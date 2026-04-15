import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { getStripeConfig } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function logStripeEvent(
  level: 'info' | 'warn' | 'error',
  event: Stripe.Event,
  context: Record<string, unknown>
) {
  console[level](JSON.stringify({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    timestamp: new Date().toISOString(),
    ...context,
  }))
}

/** In Stripe v22 (dahlia), current_period_start/end live on subscription items, not the subscription. */
function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: number; end: number } {
  const item = subscription.items.data[0]
  if (item) {
    return { start: item.current_period_start, end: item.current_period_end }
  }
  // Fallback: use subscription start_date and billing_cycle_anchor
  return { start: subscription.start_date, end: subscription.billing_cycle_anchor }
}

/** In Stripe v22, Invoice.subscription is replaced by Invoice.parent.subscription_details */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails) return null
  return typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription?.id ?? null
}

function mapStripeStatus(s: string): string {
  if (s === 'active') return 'active'
  if (s === 'past_due') return 'past_due'
  if (s === 'canceled') return 'cancelled'
  if (s === 'trialing') return 'trialing'
  if (s === 'paused') return 'paused'
  return 'active'
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('stripe_events')
    .select('id')
    .eq('id', eventId)
    .single()
  return !!data
}

async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('stripe_events')
    .insert({ id: eventId, event_type: eventType })
  if (error) {
    // Unique constraint violation means another process already recorded it — safe
    if (!error.code?.includes('23505')) {
      throw error
    }
  }
}

/**
 * Resolve the Stripe processing fee for a PaymentIntent from its latest charge's
 * balance transaction. Returns null if the balance transaction isn't yet available —
 * callers should pass null to the credit RPC (we never invent fees).
 */
async function resolveStripeFeeCents(
  stripe: Stripe,
  pi: Stripe.PaymentIntent
): Promise<number | null> {
  const latestCharge = pi.latest_charge
  if (!latestCharge) return null

  let charge: Stripe.Charge | null = null
  if (typeof latestCharge === 'string') {
    charge = await stripe.charges.retrieve(latestCharge, { expand: ['balance_transaction'] })
  } else if (latestCharge.balance_transaction) {
    charge = latestCharge
  } else {
    charge = await stripe.charges.retrieve(latestCharge.id, { expand: ['balance_transaction'] })
  }

  const bt = charge?.balance_transaction
  if (!bt) return null
  if (typeof bt === 'string') return null
  return bt.fee ?? null
}

async function handleWalletLoad(event: Stripe.Event, session: Stripe.Checkout.Session): Promise<void> {
  const walletId = session.metadata?.wallet_id
  const repId = session.metadata?.rep_id
  const intendedStr = session.metadata?.intended_cents
  if (!walletId || !repId || !intendedStr) {
    logStripeEvent('error', event, {
      phase: 'wallet_load',
      reason: 'missing_wallet_metadata',
      session_id: session.id,
    })
    return
  }

  if (session.payment_status !== 'paid') {
    logStripeEvent('info', event, {
      phase: 'wallet_load',
      skipped: true,
      reason: 'not_paid',
      session_id: session.id,
      payment_status: session.payment_status,
    })
    return
  }

  const intended = Number.parseInt(intendedStr, 10)
  if (!Number.isInteger(intended) || intended <= 0) {
    logStripeEvent('error', event, {
      phase: 'wallet_load',
      reason: 'invalid_intended_cents',
      intendedStr,
    })
    return
  }

  if (!session.payment_intent) {
    logStripeEvent('error', event, {
      phase: 'wallet_load',
      reason: 'missing_payment_intent',
      session_id: session.id,
    })
    return
  }

  const stripe = getStripe()
  const piId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent.id
  const pi = await stripe.paymentIntents.retrieve(piId, {
    expand: ['latest_charge.balance_transaction'],
  })

  if (pi.amount_received < intended || session.amount_total !== intended) {
    logStripeEvent('error', event, {
      phase: 'wallet_load',
      reason: 'amount_mismatch',
      intended,
      session_total: session.amount_total,
      pi_received: pi.amount_received,
    })
    return
  }

  const feeCents = await resolveStripeFeeCents(stripe, pi)
  if (feeCents === null) {
    logStripeEvent('warn', event, {
      phase: 'wallet_load',
      reason: 'balance_transaction_not_ready',
      pi_id: pi.id,
    })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('credit_wallet', {
    p_wallet_id: walletId,
    p_rep_id: repId,
    p_amount: intended,
    p_type: 'load',
    p_stripe_pi: pi.id,
    p_stripe_fee: feeCents,
    p_description: 'Wallet load',
    p_attempt_id: null,
  })
  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'wallet_load',
    wallet_id: walletId,
    rep_id: repId,
    credited_cents: intended,
    fee_cents: feeCents,
    pi_id: pi.id,
  })
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent
  if (pi.metadata?.auto_recharge !== 'true') return

  const walletId = pi.metadata.wallet_id
  const repId = pi.metadata.rep_id
  const attemptId = pi.metadata.attempt_id
  if (!walletId || !repId || !attemptId) {
    logStripeEvent('error', event, {
      phase: 'auto_recharge_succeeded',
      reason: 'missing_metadata',
      pi_id: pi.id,
    })
    return
  }

  const stripe = getStripe()
  const feeCents = await resolveStripeFeeCents(stripe, pi)
  if (feeCents === null) {
    logStripeEvent('warn', event, {
      phase: 'auto_recharge_succeeded',
      reason: 'balance_transaction_not_ready',
      pi_id: pi.id,
    })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('credit_wallet', {
    p_wallet_id: walletId,
    p_rep_id: repId,
    p_amount: pi.amount_received,
    p_type: 'auto_recharge',
    p_stripe_pi: pi.id,
    p_stripe_fee: feeCents,
    p_description: 'Auto-recharge',
    p_attempt_id: attemptId,
  })
  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'auto_recharge_succeeded',
    wallet_id: walletId,
    rep_id: repId,
    credited_cents: pi.amount_received,
    fee_cents: feeCents,
    pi_id: pi.id,
  })
}

async function releaseAutoRechargeLock(event: Stripe.Event, pi: Stripe.PaymentIntent, phase: string): Promise<void> {
  const walletId = pi.metadata?.wallet_id
  const attemptId = pi.metadata?.attempt_id
  if (!walletId || !attemptId) {
    logStripeEvent('error', event, { phase, reason: 'missing_metadata', pi_id: pi.id })
    return
  }
  const admin = createAdminClient()
  const { error } = await admin.rpc('release_wallet_recharge_lock', {
    p_wallet_id: walletId,
    p_attempt_id: attemptId,
  })
  if (error) throw error
  logStripeEvent('warn', event, {
    phase,
    wallet_id: walletId,
    pi_id: pi.id,
    last_payment_error: pi.last_payment_error?.message ?? null,
  })
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent
  if (pi.metadata?.auto_recharge !== 'true') return
  await releaseAutoRechargeLock(event, pi, 'auto_recharge_failed')
}

async function handlePaymentIntentCanceled(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent
  if (pi.metadata?.auto_recharge !== 'true') return
  await releaseAutoRechargeLock(event, pi, 'auto_recharge_canceled')
}

/**
 * requires_action is NON-terminal — do NOT release the lock here; otherwise the next
 * SMS deduct could kick off a second off-session PI while the first awaits 3DS.
 * The eventual terminal event (succeeded / payment_failed / canceled) will settle it.
 */
async function handlePaymentIntentRequiresAction(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent
  if (pi.metadata?.auto_recharge !== 'true') return
  logStripeEvent('warn', event, {
    phase: 'auto_recharge_requires_action',
    wallet_id: pi.metadata.wallet_id ?? null,
    pi_id: pi.id,
    last_payment_error: pi.last_payment_error?.message ?? null,
  })
}

// --- Event Handlers ---

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  // Wallet loads are mode='payment', so they must be handled BEFORE the subscription-only early return.
  if (session.metadata?.wallet_load === 'true') {
    await handleWalletLoad(event, session)
    return
  }

  if (session.mode !== 'subscription' || !session.subscription) return

  const repId = session.metadata?.rep_id
  const planType = session.metadata?.plan_type
  if (!repId) {
    logStripeEvent('error', event, { phase: 'checkout_completed', error: 'Missing rep_id in metadata' })
    return
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
    { expand: ['items'] }
  )
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  const period = getSubscriptionPeriod(subscription)
  const admin = createAdminClient()

  await admin
    .from('reps')
    .update({ stripe_customer_id: customerId })
    .eq('id', repId)

  const { error } = await admin
    .from('subscriptions')
    .upsert({
      rep_id: repId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      plan_tier: planType ?? 'monthly',
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(period.start * 1000).toISOString(),
      current_period_end: new Date(period.end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_livemode: event.livemode,
      stripe_event_timestamp: event.created,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    })

  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'checkout_completed',
    rep_id: repId,
    subscription_id: subscription.id,
    customer_id: customerId,
  })
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const admin = createAdminClient()

  // Race condition protection: only overwrite if this event is newer (Finding 4)
  const { data: existing } = await admin
    .from('subscriptions')
    .select('stripe_event_timestamp')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existing?.stripe_event_timestamp && existing.stripe_event_timestamp >= event.created) {
    logStripeEvent('info', event, {
      phase: 'subscription_updated',
      skipped: true,
      reason: 'older_event',
    })
    return
  }

  const period = getSubscriptionPeriod(subscription)

  const { error } = await admin
    .from('subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(period.start * 1000).toISOString(),
      current_period_end: new Date(period.end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancelled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      stripe_livemode: event.livemode,
      stripe_event_timestamp: event.created,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    })

  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'subscription_updated',
    subscription_id: subscription.id,
    status: subscription.status,
  })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const admin = createAdminClient()

  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_at_period_end: false,
      stripe_event_timestamp: event.created,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'subscription_deleted',
    subscription_id: subscription.id,
  })
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'invoice_payment_succeeded',
    subscription_id: subscriptionId,
  })
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  logStripeEvent('info', event, {
    phase: 'invoice_payment_failed',
    subscription_id: subscriptionId,
  })
}

// --- Main Handler ---

const EVENT_HANDLERS: Record<string, (event: Stripe.Event) => Promise<void>> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
  'payment_intent.payment_failed': handlePaymentIntentFailed,
  'payment_intent.canceled': handlePaymentIntentCanceled,
  'payment_intent.requires_action': handlePaymentIntentRequiresAction,
}

export async function POST(request: Request) {
  const stripeConfig = getStripeConfig()
  if (!stripeConfig) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, stripeConfig.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/webhook] Signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check (Finding 2)
  if (await isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, deduplicated: true })
  }

  const handler = EVENT_HANDLERS[event.type]
  if (!handler) {
    return NextResponse.json({ received: true })
  }

  try {
    await handler(event)
    await markEventProcessed(event.id, event.type)
    return NextResponse.json({ received: true })
  } catch (error) {
    logStripeEvent('error', event, {
      phase: 'handler_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
