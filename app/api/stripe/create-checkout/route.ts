import { NextResponse } from 'next/server'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'
import { getPriceId, getAppUrl } from '@/lib/stripe/config'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  try {
    const { repId, rep } = await getAuthenticatedRep()
    const body = await request.json()
    const planType: string = body.planType

    if (!planType || !['monthly', 'quarterly', 'annual'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid planType — must be monthly, quarterly, or annual' }, { status: 400 })
    }

    const priceId = getPriceId(planType)
    if (!priceId) {
      return NextResponse.json({ error: `Price not configured for plan: ${planType}` }, { status: 400 })
    }

    // Check for existing active subscription (Finding 16)
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('subscriptions')
      .select('id, status')
      .eq('rep_id', repId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Active subscription already exists. Use the Customer Portal to change plans.' },
        { status: 409 }
      )
    }

    const customerId = await getOrCreateStripeCustomer(repId)

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/billing`,
      metadata: {
        rep_id: repId,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          rep_id: repId,
          plan_type: planType,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[stripe/create-checkout] Error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
