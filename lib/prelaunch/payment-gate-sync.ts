import type Stripe from 'stripe'

import { upsertPrelaunchLaunchGate } from '@/lib/prelaunch/launch-gates'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (!session.payment_intent) return null
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent.id
}

export async function syncPrelaunchPaymentGateFromCheckoutSession(
  checkoutSessionId: string,
  admin: AdminClient = createAdminClient(),
) {
  const sessionId = checkoutSessionId.trim()
  if (!sessionId.startsWith('cs_')) {
    return {
      ok: false,
      status: 'invalid_session_id' as const,
      launchBuildId: null,
    }
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.metadata?.sparkle_suite_payment_gate !== 'true') {
    return {
      ok: false,
      status: 'not_prelaunch_payment_gate' as const,
      launchBuildId: null,
    }
  }

  const launchBuildId = session.metadata.launch_build_id?.trim() || null
  const gateType = session.metadata.payment_gate?.trim() || 'start_work_fee'

  if (session.payment_status !== 'paid') {
    return {
      ok: false,
      status: session.payment_status,
      launchBuildId,
    }
  }

  const now = new Date().toISOString()
  const { error } = await admin
    .from('sparkle_suite_payment_gates')
    .update({
      status: 'paid',
      stripe_payment_intent_id: getPaymentIntentId(session),
      stripe_customer_id:
        typeof session.customer === 'string' ? session.customer : null,
      amount_cents: session.amount_total,
      currency: session.currency ?? 'usd',
      livemode: session.livemode,
      paid_at: now,
      updated_at: now,
    })
    .eq('stripe_checkout_session_id', session.id)

  if (error) throw error

  if (launchBuildId) {
    await upsertPrelaunchLaunchGate(
      {
        launchBuildId,
        gateKey: 'payment',
        status: 'ready',
        notes: `Stripe checkout ${session.id} paid for ${gateType}.`,
        operatorRepId: null,
      },
      admin,
    )
  }

  return {
    ok: true,
    status: 'paid' as const,
    launchBuildId,
  }
}
