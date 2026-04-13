import { NextResponse } from 'next/server'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'
import { getAppUrl } from '@/lib/stripe/config'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'

export async function POST() {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  try {
    const { rep } = await getAuthenticatedRep()

    if (!rep.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found — subscribe first' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: rep.stripe_customer_id,
      return_url: `${getAppUrl()}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[stripe/create-portal-session] Error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
