import { getStripe } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createStripeCustomer(
  repId: string,
  email: string,
  name: string
): Promise<string> {
  const stripe = getStripe()

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      rep_id: repId,
      platform: 'sparkle_suite',
    },
  })

  const admin = createAdminClient()
  const { error } = await admin
    .from('reps')
    .update({ stripe_customer_id: customer.id })
    .eq('id', repId)

  if (error) {
    console.error('[stripe/customers] Failed to save stripe_customer_id to reps:', error)
    throw new Error('Failed to link Stripe customer to rep')
  }

  return customer.id
}

export async function getOrCreateStripeCustomer(
  repId: string
): Promise<string> {
  const admin = createAdminClient()
  const { data: rep, error } = await admin
    .from('reps')
    .select('id, stripe_customer_id, email, display_name')
    .eq('id', repId)
    .single()

  if (error || !rep) {
    throw new Error(`Rep not found: ${repId}`)
  }

  if (rep.stripe_customer_id) {
    return rep.stripe_customer_id
  }

  return createStripeCustomer(repId, rep.email, rep.display_name)
}
