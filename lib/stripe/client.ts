import Stripe from 'stripe'
import { getStripeConfig, isStripeEnabled } from './config'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const config = getStripeConfig()
  if (!config) {
    throw new Error('Stripe is not configured')
  }

  _stripe = new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
  return _stripe
}

export { isStripeEnabled as stripeEnabled }
