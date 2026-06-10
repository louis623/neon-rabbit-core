import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeSparkleSuiteReferralCode } from './sparkle-suite-referrals'

const PAID_MONTH_THRESHOLD = 3

type MaybeError = {
  error?: unknown
}

type MaybeData<T> = MaybeError & {
  data: T | null
}

type ReferralRecord = {
  id: string
  referrer_rep_id: string
  referred_rep_id: string
  referral_code_used: string
  reward_status: 'pending' | 'eligible' | 'credited' | 'forfeited' | 'rejected'
  paid_service_months: number
  stripe_credit_id: string | null
}

type ReferrerRepRecord = {
  id: string
  stripe_customer_id: string | null
  pricing_tier: 'founder' | 'standard' | null
}

type SubscriptionStatusRecord = {
  status: string | null
  pricing_tier?: 'founder' | 'standard' | null
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readReferralCodeFromSetupAnswers(value: unknown) {
  if (!isJsonObject(value)) return null
  const direct = value.referralCode ?? value.referral_code
  if (typeof direct === 'string') return normalizeSparkleSuiteReferralCode(direct)

  const accountBasics = value.account_basics
  if (isJsonObject(accountBasics)) {
    const nested = accountBasics.referralCode ?? accountBasics.referral_code
    if (typeof nested === 'string') return normalizeSparkleSuiteReferralCode(nested)
  }

  return null
}

export async function getPendingReferralCodeForRep(args: {
  supabase: SupabaseClient
  repId: string
  fallbackCode?: unknown
}) {
  if (typeof args.fallbackCode === 'string') {
    const normalized = normalizeSparkleSuiteReferralCode(args.fallbackCode)
    if (normalized) return normalized
  }

  const { data, error } = (await args.supabase
    .from('self_serve_setup_sessions')
    .select('answers')
    .eq('rep_id', args.repId)
    .maybeSingle()) as MaybeData<{ answers: unknown }>

  if (error) throw error
  return readReferralCodeFromSetupAnswers(data?.answers)
}

export async function resolveReferralCodeForCheckout(args: {
  supabase: SupabaseClient
  referredRepId: string
  referralCode: string | null
}) {
  if (!args.referralCode) return null

  const { data, error } = (await args.supabase
    .from('reps')
    .select('id, referral_code')
    .eq('referral_code', args.referralCode)
    .maybeSingle()) as MaybeData<{ id: string; referral_code: string | null }>

  if (error) throw error
  if (!data) return null
  if (data.id === args.referredRepId) return null

  return {
    referrerRepId: data.id,
    referralCodeUsed: args.referralCode,
  }
}

export async function createPendingReferralAfterPaidCheckout(args: {
  supabase: SupabaseClient
  referrerRepId: string | null | undefined
  referredRepId: string
  referralCodeUsed: string | null | undefined
}) {
  const referralCodeUsed =
    typeof args.referralCodeUsed === 'string'
      ? normalizeSparkleSuiteReferralCode(args.referralCodeUsed)
      : null
  if (!args.referrerRepId || !referralCodeUsed) return null
  if (args.referrerRepId === args.referredRepId) return null

  const { data, error } = (await args.supabase
    .from('rep_referrals')
    .upsert(
      {
        referrer_rep_id: args.referrerRepId,
        referred_rep_id: args.referredRepId,
        referral_code_used: referralCodeUsed,
        reward_status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'referred_rep_id' },
    )
    .select('id')
    .maybeSingle()) as MaybeData<{ id: string }>

  if (error) throw error
  return data?.id ?? null
}

function getCreditAmountCents(referrer: ReferrerRepRecord) {
  return referrer.pricing_tier === 'founder' ? 4999 : 7499
}

function isActiveReferralCreditSubscription(row: SubscriptionStatusRecord | null) {
  return (
    row?.status === 'active' ||
    row?.status === 'trialing' ||
    row?.status === 'past_due'
  )
}

function isMissingReferralLedgerTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const record = error as { code?: unknown; message?: unknown }
  return (
    record.code === '42P01' ||
    (typeof record.message === 'string' &&
      /rep_referral_paid_months|does not exist/i.test(record.message))
  )
}

export async function processReferralPaidSubscriptionInvoice(args: {
  supabase: SupabaseClient
  stripe: Stripe
  stripeInvoiceId: string
  stripeSubscriptionId: string
  stripeCustomerId: string | null
  amountPaidCents: number
  paidAtIso: string
}) {
  if (!args.stripeInvoiceId || !args.stripeSubscriptionId) {
    return { status: 'skipped' as const, reason: 'missing_invoice_subscription' }
  }
  if (args.amountPaidCents <= 0) {
    return { status: 'skipped' as const, reason: 'non_positive_amount' }
  }

  const { data: subscription, error: subscriptionError } = (await args.supabase
    .from('subscriptions')
    .select('rep_id')
    .eq('stripe_subscription_id', args.stripeSubscriptionId)
    .maybeSingle()) as MaybeData<{ rep_id: string }>

  if (subscriptionError) throw subscriptionError
  if (!subscription?.rep_id) {
    return { status: 'skipped' as const, reason: 'subscription_not_found' }
  }

  const { data: referral, error: referralError } = (await args.supabase
    .from('rep_referrals')
    .select(
      'id, referrer_rep_id, referred_rep_id, referral_code_used, reward_status, paid_service_months, stripe_credit_id',
    )
    .eq('referred_rep_id', subscription.rep_id)
    .maybeSingle()) as MaybeData<ReferralRecord>

  if (referralError) throw referralError
  if (!referral || referral.reward_status === 'credited') {
    return { status: 'skipped' as const, reason: 'no_pending_referral' }
  }

  const { data: existingInvoice, error: existingInvoiceError } =
    (await args.supabase
      .from('rep_referral_paid_months')
      .select('id')
      .eq('stripe_invoice_id', args.stripeInvoiceId)
      .maybeSingle()) as MaybeData<{ id: string }>

  if (isMissingReferralLedgerTableError(existingInvoiceError)) {
    return { status: 'skipped' as const, reason: 'referral_ledger_not_ready' }
  }
  if (existingInvoiceError) throw existingInvoiceError
  if (existingInvoice) {
    return { status: 'skipped' as const, reason: 'invoice_already_counted' }
  }

  const { error: insertMonthError } = (await args.supabase
    .from('rep_referral_paid_months')
    .insert({
      referral_id: referral.id,
      referred_rep_id: subscription.rep_id,
      stripe_invoice_id: args.stripeInvoiceId,
      stripe_subscription_id: args.stripeSubscriptionId,
      stripe_customer_id: args.stripeCustomerId,
      amount_paid_cents: args.amountPaidCents,
      paid_at: args.paidAtIso,
    })) as MaybeError

  if (insertMonthError) throw insertMonthError

  const { count, error: countError } = await args.supabase
    .from('rep_referral_paid_months')
    .select('id', { count: 'exact', head: true })
    .eq('referral_id', referral.id)

  if (countError) throw countError
  const paidServiceMonths = count ?? referral.paid_service_months + 1

  const newStatus =
    paidServiceMonths >= PAID_MONTH_THRESHOLD &&
    referral.reward_status === 'pending'
      ? 'eligible'
      : referral.reward_status

  const referralProgressPatch = {
    paid_service_months: paidServiceMonths,
    reward_status: newStatus,
    ...(newStatus === 'eligible'
      ? { eligibility_reached_at: args.paidAtIso }
      : {}),
    updated_at: new Date().toISOString(),
  }

  const { error: updateReferralError } = (await args.supabase
    .from('rep_referrals')
    .update(referralProgressPatch)
    .eq('id', referral.id)) as MaybeError

  if (updateReferralError) throw updateReferralError
  if (newStatus !== 'eligible') {
    return { status: 'counted' as const, paidServiceMonths }
  }

  const { data: referrer, error: referrerError } = (await args.supabase
    .from('reps')
    .select('id, stripe_customer_id, pricing_tier')
    .eq('id', referral.referrer_rep_id)
    .maybeSingle()) as MaybeData<ReferrerRepRecord>

  if (referrerError) throw referrerError
  if (!referrer?.stripe_customer_id) {
    return { status: 'eligible' as const, paidServiceMonths, reason: 'missing_referrer_customer' }
  }

  const { data: referrerSubscription, error: referrerSubscriptionError } =
    (await args.supabase
      .from('subscriptions')
      .select('status, pricing_tier')
      .eq('rep_id', referral.referrer_rep_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()) as MaybeData<SubscriptionStatusRecord>

  if (referrerSubscriptionError) throw referrerSubscriptionError
  if (!isActiveReferralCreditSubscription(referrerSubscription)) {
    const { error: forfeitError } = (await args.supabase
      .from('rep_referrals')
      .update({
        reward_status: 'forfeited',
        updated_at: new Date().toISOString(),
      })
      .eq('id', referral.id)) as MaybeError
    if (forfeitError) throw forfeitError
    return { status: 'forfeited' as const, paidServiceMonths }
  }

  const creditAmountCents = getCreditAmountCents({
    ...referrer,
    pricing_tier: referrerSubscription?.pricing_tier ?? referrer.pricing_tier,
  })
  const credit = await args.stripe.customers.createBalanceTransaction(
    referrer.stripe_customer_id,
    {
      amount: -creditAmountCents,
      currency: 'usd',
      description: 'Sparkle Suite referral reward',
      metadata: {
        referral_id: referral.id,
        referred_rep_id: subscription.rep_id,
        referral_code_used: referral.referral_code_used,
        paid_service_months: String(paidServiceMonths),
      },
    },
    {
      idempotencyKey: `sparkle-suite-referral-credit-${referral.id}`,
    },
  )

  const { error: creditUpdateError } = (await args.supabase
    .from('rep_referrals')
    .update({
      reward_status: 'credited',
      credit_issued_at: new Date().toISOString(),
      stripe_credit_id: credit.id,
      stripe_customer_id: referrer.stripe_customer_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referral.id)) as MaybeError

  if (creditUpdateError) throw creditUpdateError
  return {
    status: 'credited' as const,
    paidServiceMonths,
    creditAmountCents,
    stripeCreditId: credit.id,
  }
}
