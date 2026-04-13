import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()

    const admin = createAdminClient()
    const { data: subscription, error } = await admin
      .from('subscriptions')
      .select('status, plan_tier, current_period_end, cancel_at_period_end, stripe_livemode')
      .eq('rep_id', repId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({
      subscription: {
        status: subscription.status,
        planType: subscription.plan_tier,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        livemode: subscription.stripe_livemode,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[stripe/subscription-status] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
  }
}
