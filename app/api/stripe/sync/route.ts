import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, stripeEnabled as isStripeEnabled } from '@/lib/stripe/client'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
  return 'active'
}

export async function POST() {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  try {
    const { repId, rep } = await getAuthenticatedRep()

    if (!rep.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer linked' }, { status: 400 })
    }

    const stripe = getStripe()

    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: rep.stripe_customer_id,
      limit: 10,
      expand: ['data.items'],
    })

    const admin = createAdminClient()
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
