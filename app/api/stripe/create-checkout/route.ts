import { NextResponse } from 'next/server'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'
import {
  getAppUrl,
  getSparkleSuitePriceIds,
  getStripeConfig,
} from '@/lib/stripe/config'
import {
  buildSparkleSuiteCheckoutPricing,
  buildSparkleSuiteTestBuyerCheckoutPricing,
} from '@/lib/stripe/sparkle-suite-pricing'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSelfServeAgreementVersion } from '@/lib/prelaunch/self-serve-agreement'

const STRIPE_PRICE_SETUP_ACTION =
  'Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL, STRIPE_PRICE_BUILD_FEE, STRIPE_PRICE_FOUNDER_MONTHLY, and STRIPE_PRICE_STANDARD_MONTHLY before starting checkout.'

const SPARKLE_SUITE_CHECKOUT_PAYMENT_METHODS = ['card', 'link'] as const

function isTestBuyerCheckoutEnabled() {
  return (
    process.env.SPARKLE_STRIPE_TEST_BUYER_MODE === 'true' ||
    process.env.SPARKLE_STRIPE_TEST_BUYER_MODE === '1'
  )
}

function canUseTestBuyerCheckout() {
  const secretKey = getStripeConfig()?.STRIPE_SECRET_KEY ?? ''
  return (
    isTestBuyerCheckoutEnabled() &&
    process.env.NODE_ENV !== 'production' &&
    secretKey.startsWith('sk_test_')
  )
}

async function countPaidSubscriptionStarts(
  admin: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const { count, error } = await admin
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'trialing', 'past_due', 'cancelled', 'paused'])

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function POST(request: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json(
      {
        code: 'STRIPE_CONFIGURATION_MISSING',
        error: 'Stripe is not configured.',
        action: STRIPE_PRICE_SETUP_ACTION,
      },
      { status: 503 },
    )
  }

  try {
    const { repId } = await getAuthenticatedRep()
    const body = await request.json().catch(() => ({}))
    const requestedPlanType =
      typeof body?.planType === 'string' ? body.planType.trim() : ''
    const planType = requestedPlanType || 'monthly'

    if (planType !== 'monthly') {
      return NextResponse.json(
        { error: 'Invalid planType — monthly is the only supported plan.' },
        { status: 400 },
      )
    }

    if (body?.agreementAccepted !== true) {
      return NextResponse.json(
        {
          error: 'Accept the Sparkle Suite Terms and Conditions before checkout.',
          agreementVersion: getSelfServeAgreementVersion(),
        },
        { status: 400 },
      )
    }

    // Check for existing active subscription (Finding 16)
    const admin = createAdminClient()
    const { data: existing, error: existingError } = await admin
      .from('subscriptions')
      .select('id, status')
      .eq('rep_id', repId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Active subscription already exists. Use the Customer Portal to change plans.' },
        { status: 409 }
      )
    }

    const testBuyerCheckoutEnabled = isTestBuyerCheckoutEnabled()
    if (testBuyerCheckoutEnabled && !canUseTestBuyerCheckout()) {
      return NextResponse.json(
        {
          code: 'TEST_BUYER_CHECKOUT_NOT_AVAILABLE',
          error:
            'Test buyer checkout requires a Stripe test key and cannot run in production.',
          action:
            'Use STRIPE_SECRET_KEY=sk_test_... with SPARKLE_STRIPE_TEST_BUYER_MODE=true in local development.',
        },
        { status: 400 },
      )
    }

    const pricing = testBuyerCheckoutEnabled
      ? buildSparkleSuiteTestBuyerCheckoutPricing()
      : buildSparkleSuiteCheckoutPricing({
          paidSubscriptionStarts: await countPaidSubscriptionStarts(admin),
          priceIds: getSparkleSuitePriceIds(),
        })
    if (!pricing.ok) {
      return NextResponse.json(
        {
          error: 'Sparkle Suite checkout prices are not configured.',
          missingEnv: pricing.missingEnv,
          action: STRIPE_PRICE_SETUP_ACTION,
        },
        { status: 400 },
      )
    }

    const customerId = await getOrCreateStripeCustomer(repId)
    const agreementMetadata = {
      agreement_provider: 'clickwrap',
      agreement_version: getSelfServeAgreementVersion(),
      signwell_required: 'false',
    }
    const requiredSetupMetadata = {
      first_run_setup: 'required_nic_nac',
      light_box_required: 'true',
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: [...SPARKLE_SUITE_CHECKOUT_PAYMENT_METHODS],
      line_items: pricing.lineItems,
      success_url: `${getAppUrl()}/nic-nac?onboarding=required-setup&billing=subscription-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/nic-nac?onboarding=checkout-required&billing=subscription-cancelled`,
      shipping_address_collection: { allowed_countries: ['US'] },
      phone_number_collection: { enabled: true },
      metadata: {
        rep_id: repId,
        plan_type: planType,
        ...agreementMetadata,
        ...requiredSetupMetadata,
        ...pricing.metadata,
      },
      subscription_data: {
        metadata: {
          rep_id: repId,
          plan_type: planType,
          ...agreementMetadata,
          ...requiredSetupMetadata,
          ...pricing.metadata,
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
