import type Stripe from 'stripe'
import { getStripe } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

interface ProRataResult {
  refundAmountCents: number
  totalDaysInPeriod: number
  daysRemaining: number
  periodAmountCents: number
}

export function calculateProRataRefund(
  periodStartEpoch: number,
  periodEndEpoch: number,
  periodAmountCents: number
): ProRataResult {
  const nowEpoch = Math.floor(Date.now() / 1000)
  const totalSeconds = periodEndEpoch - periodStartEpoch
  const remainingSeconds = Math.max(0, periodEndEpoch - nowEpoch)

  const refundAmountCents = Math.min(
    periodAmountCents,
    Math.max(0, Math.round((remainingSeconds / totalSeconds) * periodAmountCents))
  )

  return {
    refundAmountCents,
    totalDaysInPeriod: Math.round(totalSeconds / 86400),
    daysRemaining: Math.round(remainingSeconds / 86400),
    periodAmountCents,
  }
}

function getSubscriptionPeriod(sub: Stripe.Subscription): { start: number; end: number } {
  const item = sub.items.data[0]
  if (item) {
    return { start: item.current_period_start, end: item.current_period_end }
  }
  return { start: sub.start_date, end: sub.billing_cycle_anchor }
}

export async function processProRataRefund(subscriptionId: string): Promise<{
  status: 'refunded' | 'cancelled' | 'failed' | 'already_processed'
  refundAmountCents?: number
  stripeRefundId?: string
  error?: string
}> {
  const stripe = getStripe()
  const admin = createAdminClient()

  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('id, stripe_subscription_id, status')
    .eq('id', subscriptionId)
    .single()

  if (subError || !sub) {
    return { status: 'failed', error: `Subscription not found: ${subscriptionId}` }
  }

  if (sub.status === 'cancelled') {
    return { status: 'failed', error: 'Subscription is already cancelled' }
  }

  // Fetch the live subscription from Stripe — expand items for period and latest_invoice for payment
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
    expand: ['latest_invoice.payments', 'items'],
  })

  const period = getSubscriptionPeriod(stripeSub)
  const periodStart = period.start
  const periodEnd = period.end

  // Check for existing refund operation for this period (Finding 7)
  const { data: existingOp } = await admin
    .from('refund_operations')
    .select('id, status, stripe_refund_id')
    .eq('stripe_subscription_id', sub.stripe_subscription_id)
    .eq('billing_period_start', new Date(periodStart * 1000).toISOString())
    .single()

  if (existingOp) {
    if (existingOp.status === 'refunded') {
      return { status: 'already_processed', stripeRefundId: existingOp.stripe_refund_id ?? undefined }
    }
  }

  // Get the period amount and payment intent from the latest invoice
  const latestInvoice = stripeSub.latest_invoice as Stripe.Invoice | null
  if (!latestInvoice || latestInvoice.status !== 'paid') {
    return { status: 'failed', error: 'No paid invoice found for current period' }
  }

  const periodAmountCents = latestInvoice.amount_paid

  // In Stripe v22, payment_intent is accessed via invoice.payments
  const payments = latestInvoice.payments?.data
  const paidPayment = payments?.find(p => p.status === 'paid')
  const paymentIntentId = typeof paidPayment?.payment?.payment_intent === 'string'
    ? paidPayment.payment.payment_intent
    : typeof paidPayment?.payment?.payment_intent === 'object'
      ? paidPayment?.payment?.payment_intent?.id
      : null

  if (!paymentIntentId) {
    return { status: 'failed', error: 'No payment intent found on latest paid invoice' }
  }

  const { refundAmountCents } = calculateProRataRefund(periodStart, periodEnd, periodAmountCents)

  if (refundAmountCents <= 0) {
    return { status: 'failed', error: 'No refundable amount remaining in current period' }
  }

  const idempotencyKey = `refund_${sub.stripe_subscription_id}_${periodStart}`

  if (!existingOp) {
    const { error: insertError } = await admin
      .from('refund_operations')
      .insert({
        subscription_id: sub.id,
        stripe_subscription_id: sub.stripe_subscription_id,
        billing_period_start: new Date(periodStart * 1000).toISOString(),
        billing_period_end: new Date(periodEnd * 1000).toISOString(),
        refund_amount_cents: refundAmountCents,
        status: 'pending',
      })

    if (insertError) {
      return { status: 'failed', error: `Failed to create refund operation: ${insertError.message}` }
    }
  }

  // Step 1: Cancel subscription immediately in Stripe
  try {
    await stripe.subscriptions.cancel(sub.stripe_subscription_id)

    await admin
      .from('refund_operations')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', sub.stripe_subscription_id)
      .eq('billing_period_start', new Date(periodStart * 1000).toISOString())

    await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
  } catch (cancelError) {
    const msg = cancelError instanceof Error ? cancelError.message : 'Unknown error'
    await admin
      .from('refund_operations')
      .update({ status: 'failed', error_message: msg })
      .eq('stripe_subscription_id', sub.stripe_subscription_id)
      .eq('billing_period_start', new Date(periodStart * 1000).toISOString())

    return { status: 'failed', error: `Failed to cancel subscription: ${msg}` }
  }

  // Step 2: Issue refund with idempotency key
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        subscription_id: sub.stripe_subscription_id,
        period_start: String(periodStart),
        period_end: String(periodEnd),
        type: 'pro_rata_cancellation',
      },
    }, {
      idempotencyKey,
    })

    await admin
      .from('refund_operations')
      .update({
        status: 'refunded',
        stripe_refund_id: refund.id,
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', sub.stripe_subscription_id)
      .eq('billing_period_start', new Date(periodStart * 1000).toISOString())

    return {
      status: 'refunded',
      refundAmountCents,
      stripeRefundId: refund.id,
    }
  } catch (refundError) {
    const msg = refundError instanceof Error ? refundError.message : 'Unknown error'
    await admin
      .from('refund_operations')
      .update({
        status: 'cancelled',
        error_message: `Refund failed after cancellation: ${msg}`,
      })
      .eq('stripe_subscription_id', sub.stripe_subscription_id)
      .eq('billing_period_start', new Date(periodStart * 1000).toISOString())

    return {
      status: 'cancelled',
      error: `Subscription cancelled but refund failed — needs manual attention: ${msg}`,
    }
  }
}
