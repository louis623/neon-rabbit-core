import type Stripe from 'stripe'
import { createLightBoxFulfillmentTask } from '@/lib/self-serve/light-box-fulfillment'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

type CheckoutSessionWithCollectedShipping = Stripe.Checkout.Session & {
  collected_information?: {
    shipping_details?: {
      name?: string | null
      address?: Record<string, unknown> | null
    } | null
  } | null
  shipping_details?: {
    name?: string | null
    address?: Record<string, unknown> | null
  } | null
}

export function isRequiredNicNacSetupCheckout(session: Stripe.Checkout.Session) {
  return (
    session.metadata?.first_run_setup === 'required_nic_nac' &&
    session.metadata?.light_box_required === 'true'
  )
}

export async function transitionSetupSessionAfterCheckout(
  admin: AdminClient,
  repId: string,
  now: string,
) {
  const { data: existing, error: selectError } = await admin
    .from('self_serve_setup_sessions')
    .select('status, current_step')
    .eq('rep_id', repId)
    .maybeSingle()

  if (selectError) throw selectError

  const shouldSetRequiredSetup =
    !existing ||
    existing.status === 'checkout_required' ||
    existing.status === 'payment_pending'

  if (!shouldSetRequiredSetup) return

  const { error: setupSessionError } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: repId,
        status: 'required_setup',
        current_step: 'account_basics',
        updated_at: now,
      },
      { onConflict: 'rep_id' },
    )

  if (setupSessionError) throw setupSessionError
}

export async function createRequiredSetupCheckoutFulfillment({
  admin,
  repId,
  session,
  subscription,
  paidAtIso,
}: {
  admin: AdminClient
  repId: string
  session: Stripe.Checkout.Session
  subscription: Stripe.Subscription
  paidAtIso: string
}) {
  const { data: rep, error: repError } = await admin
    .from('reps')
    .select('id, email, display_name')
    .eq('id', repId)
    .single()

  if (repError) throw repError

  const shippingSession = session as CheckoutSessionWithCollectedShipping
  const shippingDetails =
    shippingSession.collected_information?.shipping_details ??
    shippingSession.shipping_details ??
    null

  await createLightBoxFulfillmentTask(
    {
      repId,
      repEmail: rep?.email ?? null,
      repName: rep?.display_name ?? null,
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionId: subscription.id,
      paidAtIso,
      shippingName:
        shippingDetails?.name ??
        session.customer_details?.name ??
        null,
      shippingAddress:
        (shippingDetails?.address ??
          session.customer_details?.address ??
          {}) as Record<string, unknown>,
    },
    admin,
  )
}
