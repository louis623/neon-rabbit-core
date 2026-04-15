import { NextResponse } from 'next/server'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'
import { getAppUrl } from '@/lib/stripe/config'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { ensureWallet } from '@/lib/services/wallet'

export async function POST(request: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  try {
    const { repId, rep } = await getAuthenticatedRep()

    const body = (await request.json()) as { amount_cents?: unknown }
    const amountCents = body.amount_cents
    if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json(
        { error: 'amount_cents must be a positive integer' },
        { status: 400 }
      )
    }

    const customerId = rep.stripe_customer_id ?? (await getOrCreateStripeCustomer(repId))

    const wallet = await ensureWallet(repId)

    if (amountCents < wallet.minimum_load_amount_cents) {
      return NextResponse.json(
        {
          error: `amount_cents must be >= ${wallet.minimum_load_amount_cents}`,
          minimum_load_amount_cents: wallet.minimum_load_amount_cents,
        },
        { status: 400 }
      )
    }

    const metadata = {
      rep_id: repId,
      wallet_id: wallet.id,
      wallet_load: 'true',
      intended_cents: String(amountCents),
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: 'SMS Wallet Load' },
            unit_amount: amountCents,
          },
        },
      ],
      payment_intent_data: { metadata },
      metadata,
      success_url: `${getAppUrl()}/?wallet=success`,
      cancel_url: `${getAppUrl()}/?wallet=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[stripe/wallet/load] Error:', error)
    return NextResponse.json({ error: 'Failed to create wallet load session' }, { status: 500 })
  }
}
