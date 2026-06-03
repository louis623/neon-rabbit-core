import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, stripeEnabled as isStripeEnabled } from '@/lib/stripe/client'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createRequiredSetupCheckoutFulfillment,
  isRequiredNicNacSetupCheckout,
  transitionSetupSessionAfterCheckout,
} from '@/lib/self-serve/required-setup-checkout'

function getSubscriptionPeriod(sub: Stripe.Subscription): { start: number; end: number } {
  const item = sub.items.data[0]
  if (item) {
    return { start: item.current_period_start, end: item.current_period_end }
  }
  return { start: sub.start_date, end: sub.billing_cycle_anchor }
}

function mapStripeStatus(s: string): string {
  if (s === 'active') return 'active'
  if (s === 'past_due') return 'past_due'
  if (s === 'canceled') return 'cancelled'
  if (s === 'trialing') return 'trialing'
  if (s === 'paused') return 'paused'
  if (s === 'incomplete') return 'incomplete'
  if (s === 'incomplete_expired') return 'incomplete_expired'
  if (s === 'unpaid') return 'unpaid'
  return 'incomplete'
}

function hasStripePaidWorkspaceAccess(status: string) {
  return ['active', 'trialing', 'past_due'].includes(mapStripeStatus(status))
}

function getStripeCustomerId(value: Stripe.Checkout.Session | Stripe.Subscription) {
  const customer = value.customer
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

async function upsertSubscriptionFromStripe({
  admin,
  repId,
  stripeSub,
  customerId,
  metadata,
}: {
  admin: ReturnType<typeof createAdminClient>
  repId: string
  stripeSub: Stripe.Subscription
  customerId: string
  metadata?: Stripe.Metadata | null
}) {
  const period = getSubscriptionPeriod(stripeSub)
  const planType = metadata?.plan_type || stripeSub.metadata?.plan_type || 'monthly'
  const pricingTier = metadata?.pricing_tier || stripeSub.metadata?.pricing_tier || null
  const founderSequenceRaw =
    metadata?.founder_sequence || stripeSub.metadata?.founder_sequence || ''
  const founderSequence = Number.parseInt(founderSequenceRaw, 10)
  const founderRateRaw =
    metadata?.founder_rate_months || stripeSub.metadata?.founder_rate_months || ''
  const founderRateMonths = Number.parseInt(founderRateRaw, 10)

  await admin
    .from('reps')
    .update({
      stripe_customer_id: customerId,
      ...(pricingTier ? { pricing_tier: pricingTier } : {}),
      ...(Number.isInteger(founderSequence) && founderSequence > 0
        ? { founder_sequence: founderSequence }
        : {}),
    })
    .eq('id', repId)

  const { error } = await admin
    .from('subscriptions')
    .upsert({
      rep_id: repId,
      stripe_subscription_id: stripeSub.id,
      stripe_customer_id: customerId,
      plan_tier: planType,
      pricing_tier: pricingTier,
      founder_sequence:
        Number.isInteger(founderSequence) && founderSequence > 0
          ? founderSequence
          : null,
      build_fee_charged:
        (metadata?.build_fee_charged ?? stripeSub.metadata?.build_fee_charged) ===
        'true',
      founder_rate_months:
        Number.isInteger(founderRateMonths) && founderRateMonths > 0
          ? founderRateMonths
          : null,
      build_fee_price_id:
        metadata?.build_fee_price_id ?? stripeSub.metadata?.build_fee_price_id ?? null,
      monthly_price_id:
        metadata?.monthly_price_id ?? stripeSub.metadata?.monthly_price_id ?? null,
      status: mapStripeStatus(stripeSub.status),
      current_period_start: new Date(period.start * 1000).toISOString(),
      current_period_end: new Date(period.end * 1000).toISOString(),
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      cancelled_at: stripeSub.canceled_at
        ? new Date(stripeSub.canceled_at * 1000).toISOString()
        : null,
      stripe_livemode: stripeSub.livemode,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    })

  if (error) throw error
}

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  try {
    const { repId, rep } = await getAuthenticatedRep()
    const body = await request.json().catch(() => ({}))
    const sessionId =
      typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''
    const stripe = getStripe()
    const admin = createAdminClient()

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.metadata?.rep_id !== repId) {
        return NextResponse.json(
          { error: 'Checkout session does not belong to this account.' },
          { status: 403 },
        )
      }

      if (session.mode !== 'subscription' || !session.subscription) {
        return NextResponse.json(
          { error: 'Checkout session is not a subscription checkout.' },
          { status: 400 },
        )
      }

      const stripeSub =
        typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription, {
              expand: ['items'],
            })
          : session.subscription
      const customerId = getStripeCustomerId(session) ?? getStripeCustomerId(stripeSub)

      if (!customerId) {
        return NextResponse.json(
          { error: 'Checkout session is missing a Stripe customer.' },
          { status: 400 },
        )
      }

      if (!hasStripePaidWorkspaceAccess(stripeSub.status)) {
        return NextResponse.json(
          {
            error: 'Stripe subscription is not active yet.',
            status: stripeSub.status,
          },
          { status: 402 },
        )
      }

      await upsertSubscriptionFromStripe({
        admin,
        repId,
        stripeSub,
        customerId,
        metadata: session.metadata,
      })

      const changes = [`${stripeSub.id}: synced from checkout session`]
      if (isRequiredNicNacSetupCheckout(session)) {
        await transitionSetupSessionAfterCheckout(
          admin,
          repId,
          new Date().toISOString(),
        )
        await createRequiredSetupCheckoutFulfillment({
          admin,
          repId,
          session,
          subscription: stripeSub,
          paidAtIso: new Date(session.created * 1000).toISOString(),
        })
        changes.push(`${session.id}: required setup unlocked`)
      }

      return NextResponse.json({
        synced: true,
        mode: 'checkout_session',
        stripeSubscriptionCount: 1,
        changes,
      })
    }

    if (!rep.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer linked' }, { status: 400 })
    }

    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: rep.stripe_customer_id,
      limit: 10,
      expand: ['data.items'],
    })

    const changes: string[] = []

    for (const stripeSub of stripeSubscriptions.data) {
      const period = getSubscriptionPeriod(stripeSub)

      const { data: existing } = await admin
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('stripe_subscription_id', stripeSub.id)
        .single()

      const newStatus = mapStripeStatus(stripeSub.status)
      const newPeriodEnd = new Date(period.end * 1000).toISOString()
      const newCancelAtPeriodEnd = stripeSub.cancel_at_period_end

      if (existing) {
        const diffs: string[] = []
        if (existing.status !== newStatus) diffs.push(`status: ${existing.status} → ${newStatus}`)
        if (existing.current_period_end !== newPeriodEnd) diffs.push(`period_end updated`)
        if (existing.cancel_at_period_end !== newCancelAtPeriodEnd) diffs.push(`cancel_at_period_end: ${newCancelAtPeriodEnd}`)

        if (diffs.length > 0) {
          await admin
            .from('subscriptions')
            .update({
              status: newStatus,
              current_period_start: new Date(period.start * 1000).toISOString(),
              current_period_end: newPeriodEnd,
              cancel_at_period_end: newCancelAtPeriodEnd,
              cancelled_at: stripeSub.canceled_at
                ? new Date(stripeSub.canceled_at * 1000).toISOString()
                : null,
              stripe_livemode: stripeSub.livemode,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', stripeSub.id)

          changes.push(`${stripeSub.id}: ${diffs.join(', ')}`)
        }
      } else {
        await admin
          .from('subscriptions')
          .insert({
            rep_id: repId,
            stripe_subscription_id: stripeSub.id,
            stripe_customer_id: rep.stripe_customer_id,
            plan_tier: (stripeSub.metadata?.plan_type as string) || 'monthly',
            status: newStatus,
            current_period_start: new Date(period.start * 1000).toISOString(),
            current_period_end: newPeriodEnd,
            cancel_at_period_end: newCancelAtPeriodEnd,
            stripe_livemode: stripeSub.livemode,
          })

        changes.push(`${stripeSub.id}: created (was missing from DB)`)
      }
    }

    return NextResponse.json({
      synced: true,
      stripeSubscriptionCount: stripeSubscriptions.data.length,
      changes,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[stripe/sync] Error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
