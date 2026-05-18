import { NextResponse } from 'next/server'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'
import { getAppUrl } from '@/lib/stripe/config'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'

export async function POST() {
  if (!stripeEnabled()) {
    return NextResponse.json(
      {
        code: 'STRIPE_CONFIGURATION_MISSING',
        error: 'Stripe is not configured.',
        action:
          'Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and NEXT_PUBLIC_APP_URL before opening the billing portal.',
      },
      { status: 503 },
    )
  }

  try {
    const { rep } = await getAuthenticatedRep()

    if (!rep.stripe_customer_id) {
      return NextResponse.json(
        {
          code: 'STRIPE_CUSTOMER_MISSING',
          error: 'No Stripe customer found.',
          action: 'Start a subscription checkout before opening the billing portal.',
        },
        { status: 400 },
      )
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: rep.stripe_customer_id,
      return_url: `${getAppUrl()}/nic-nac?billing=portal-returned`,
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
