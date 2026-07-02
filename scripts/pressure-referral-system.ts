import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createPendingReferralAfterPaidCheckout,
  processReferralPaidSubscriptionInvoice,
  resolveReferralCodeForCheckout,
} from '../lib/services/sparkle-suite-referral-rewards'

type ReferralRewardStatus =
  | 'pending'
  | 'eligible'
  | 'credited'
  | 'forfeited'
  | 'rejected'

type RepRow = {
  id: string
  referral_code: string | null
  stripe_customer_id: string | null
  pricing_tier: 'founder' | 'standard' | null
}

type SubscriptionRow = {
  rep_id: string
  stripe_subscription_id: string
  status: string | null
  pricing_tier: 'founder' | 'standard' | null
  created_at: string
}

type ReferralRow = {
  id: string
  referrer_rep_id: string
  referred_rep_id: string
  referral_code_used: string
  reward_status: ReferralRewardStatus
  paid_service_months: number
  stripe_credit_id: string | null
  stripe_customer_id?: string | null
  eligibility_reached_at?: string | null
  credit_issued_at?: string | null
  updated_at?: string | null
}

type PaidMonthRow = {
  id: string
  referral_id: string
  referred_rep_id: string
  stripe_invoice_id: string
  stripe_subscription_id: string
  stripe_customer_id: string | null
  amount_paid_cents: number
  paid_at: string
}

type ReferralPressureState = {
  reps: RepRow[]
  subscriptions: SubscriptionRow[]
  rep_referrals: ReferralRow[]
  rep_referral_paid_months: PaidMonthRow[]
}

type ReferralPressureTable = keyof ReferralPressureState
type ReferralPressureRow =
  | RepRow
  | SubscriptionRow
  | ReferralRow
  | PaidMonthRow
type Filter = { column: string; value: unknown }
type QueryResult = {
  data: ReferralPressureRow[] | ReferralPressureRow | null
  error: null
  count?: number | null
}
type StripeCreditRecord = {
  customerId: string
  amount: number
  currency: string
  idempotencyKey?: string
}

function tableRows(
  state: ReferralPressureState,
  table: ReferralPressureTable,
): ReferralPressureRow[] {
  return state[table] as ReferralPressureRow[]
}

function hasColumnValue(row: ReferralPressureRow, filter: Filter) {
  return (row as Record<string, unknown>)[filter.column] === filter.value
}

class ReferralPressureQuery {
  private action: 'select' | 'update' | 'upsert' | null = null
  private countExact = false
  private head = false
  private filters: Filter[] = []
  private limitCount: number | null = null
  private upsertedRow: ReferralPressureRow | null = null
  private updatePatch: Record<string, unknown> | null = null

  constructor(
    private readonly state: ReferralPressureState,
    private readonly table: ReferralPressureTable,
  ) {}

  select(_columns: string, options?: { count?: string; head?: boolean }) {
    this.action = 'select'
    this.countExact = options?.count === 'exact'
    this.head = options?.head === true
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  order(_column: string, _options?: { ascending?: boolean }) {
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  upsert(row: Record<string, unknown>, _options?: { onConflict?: string }) {
    this.action = 'upsert'
    if (this.table !== 'rep_referrals') {
      throw new Error(`unexpected upsert table ${this.table}`)
    }

    const referralRows = this.state.rep_referrals
    const existing = referralRows.find(
      (candidate) => candidate.referred_rep_id === row.referred_rep_id,
    )
    if (existing) {
      Object.assign(existing, row)
      this.upsertedRow = existing
      return this
    }

    const created: ReferralRow = {
      id: `referral-${referralRows.length + 1}`,
      referrer_rep_id: String(row.referrer_rep_id),
      referred_rep_id: String(row.referred_rep_id),
      referral_code_used: String(row.referral_code_used),
      reward_status: 'pending',
      paid_service_months: 0,
      stripe_credit_id: null,
      updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
    }
    referralRows.push(created)
    this.upsertedRow = created
    return this
  }

  insert(row: Record<string, unknown>) {
    if (this.table !== 'rep_referral_paid_months') {
      throw new Error(`unexpected insert table ${this.table}`)
    }

    this.state.rep_referral_paid_months.push({
      id: `paid-month-${this.state.rep_referral_paid_months.length + 1}`,
      referral_id: String(row.referral_id),
      referred_rep_id: String(row.referred_rep_id),
      stripe_invoice_id: String(row.stripe_invoice_id),
      stripe_subscription_id: String(row.stripe_subscription_id),
      stripe_customer_id:
        typeof row.stripe_customer_id === 'string'
          ? row.stripe_customer_id
          : null,
      amount_paid_cents: Number(row.amount_paid_cents),
      paid_at: String(row.paid_at),
    })

    return Promise.resolve({ error: null })
  }

  update(patch: Record<string, unknown>) {
    this.action = 'update'
    this.updatePatch = patch
    return this
  }

  async maybeSingle(): Promise<QueryResult> {
    if (this.action === 'upsert') {
      return { data: this.upsertedRow, error: null }
    }

    const rows = this.filteredRows()
    return { data: rows[0] ?? null, error: null }
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) {
    return Promise.resolve(this.resolve()).then(onfulfilled, onrejected)
  }

  private filteredRows() {
    let rows = tableRows(this.state, this.table).filter((row) =>
      this.filters.every((filter) => hasColumnValue(row, filter)),
    )
    if (this.limitCount !== null) rows = rows.slice(0, this.limitCount)
    return rows
  }

  private resolve(): QueryResult {
    if (this.action === 'update') {
      for (const row of this.filteredRows()) {
        Object.assign(row, this.updatePatch)
      }
      return { data: null, error: null }
    }

    const rows = this.filteredRows()
    if (this.countExact) {
      return {
        data: this.head ? null : rows,
        error: null,
        count: rows.length,
      }
    }

    return { data: rows, error: null, count: null }
  }
}

class ReferralPressureSupabase {
  constructor(private readonly state: ReferralPressureState) {}

  from(table: string) {
    if (
      table !== 'reps' &&
      table !== 'subscriptions' &&
      table !== 'rep_referrals' &&
      table !== 'rep_referral_paid_months'
    ) {
      throw new Error(`unexpected referral pressure table ${table}`)
    }

    return new ReferralPressureQuery(this.state, table)
  }
}

function createStripeDouble(credits: StripeCreditRecord[]) {
  return {
    customers: {
      createBalanceTransaction: async (
        customerId: string,
        payload: { amount: number; currency: string },
        options?: { idempotencyKey?: string },
      ) => {
        credits.push({
          customerId,
          amount: payload.amount,
          currency: payload.currency,
          idempotencyKey: options?.idempotencyKey,
        })
        return { id: `cbtxn_referral_${credits.length}` }
      },
    },
  } as unknown as Stripe
}

function buildReferralPressureSummary(input: {
  referralId: string
  paidMonths: number
  creditsIssued: number
  duplicateInvoiceStatus: string
  selfReferralBlocked: boolean
}) {
  return [
    `[referral-pressure] referral=${input.referralId}`,
    `paid_months=${input.paidMonths}`,
    `credits=${input.creditsIssued}`,
    `duplicate_invoice=${input.duplicateInvoiceStatus}`,
    `self_referral_blocked=${input.selfReferralBlocked}`,
  ].join(' ')
}

export async function runReferralSystemPressure() {
  const state: ReferralPressureState = {
    reps: [
      {
        id: 'rep-referrer',
        referral_code: 'SS-K7M4Q9',
        stripe_customer_id: 'cus_referrer',
        pricing_tier: 'standard',
      },
      {
        id: 'rep-referred',
        referral_code: 'SS-Z9Z9Z9',
        stripe_customer_id: 'cus_referred',
        pricing_tier: 'standard',
      },
    ],
    subscriptions: [
      {
        rep_id: 'rep-referred',
        stripe_subscription_id: 'sub_referred',
        status: 'active',
        pricing_tier: 'standard',
        created_at: '2026-07-02T12:00:00.000Z',
      },
      {
        rep_id: 'rep-referrer',
        stripe_subscription_id: 'sub_referrer',
        status: 'active',
        pricing_tier: 'standard',
        created_at: '2026-07-02T12:00:00.000Z',
      },
    ],
    rep_referrals: [],
    rep_referral_paid_months: [],
  }
  const credits: StripeCreditRecord[] = []
  const supabase = new ReferralPressureSupabase(state) as unknown as SupabaseClient
  const stripe = createStripeDouble(credits)

  const resolved = await resolveReferralCodeForCheckout({
    supabase,
    referredRepId: 'rep-referred',
    referralCode: 'SS-K7M4Q9',
  })
  if (!resolved) throw new Error('referral code did not resolve')

  const selfReferral = await resolveReferralCodeForCheckout({
    supabase,
    referredRepId: 'rep-referrer',
    referralCode: 'SS-K7M4Q9',
  })
  if (selfReferral) throw new Error('self-referral was not blocked')

  const referralId = await createPendingReferralAfterPaidCheckout({
    supabase,
    referrerRepId: resolved.referrerRepId,
    referredRepId: 'rep-referred',
    referralCodeUsed: resolved.referralCodeUsed,
  })
  if (!referralId) throw new Error('pending referral was not created')

  const firstInvoice = await processReferralPaidSubscriptionInvoice({
    supabase,
    stripe,
    stripeInvoiceId: 'in_referral_1',
    stripeSubscriptionId: 'sub_referred',
    stripeCustomerId: 'cus_referred',
    amountPaidCents: 7499,
    paidAtIso: '2026-08-02T12:00:00.000Z',
  })
  if (firstInvoice.status !== 'counted' || firstInvoice.paidServiceMonths !== 1) {
    throw new Error(`first invoice pressure failed: ${JSON.stringify(firstInvoice)}`)
  }

  const duplicateInvoice = await processReferralPaidSubscriptionInvoice({
    supabase,
    stripe,
    stripeInvoiceId: 'in_referral_1',
    stripeSubscriptionId: 'sub_referred',
    stripeCustomerId: 'cus_referred',
    amountPaidCents: 7499,
    paidAtIso: '2026-08-02T12:00:00.000Z',
  })
  if (duplicateInvoice.reason !== 'invoice_already_counted') {
    throw new Error(
      `duplicate invoice pressure failed: ${JSON.stringify(duplicateInvoice)}`,
    )
  }

  const secondInvoice = await processReferralPaidSubscriptionInvoice({
    supabase,
    stripe,
    stripeInvoiceId: 'in_referral_2',
    stripeSubscriptionId: 'sub_referred',
    stripeCustomerId: 'cus_referred',
    amountPaidCents: 7499,
    paidAtIso: '2026-09-02T12:00:00.000Z',
  })
  if (secondInvoice.status !== 'counted' || secondInvoice.paidServiceMonths !== 2) {
    throw new Error(`second invoice pressure failed: ${JSON.stringify(secondInvoice)}`)
  }

  const thirdInvoice = await processReferralPaidSubscriptionInvoice({
    supabase,
    stripe,
    stripeInvoiceId: 'in_referral_3',
    stripeSubscriptionId: 'sub_referred',
    stripeCustomerId: 'cus_referred',
    amountPaidCents: 7499,
    paidAtIso: '2026-10-02T12:00:00.000Z',
  })
  if (
    thirdInvoice.status !== 'credited' ||
    thirdInvoice.paidServiceMonths !== 3 ||
    thirdInvoice.creditAmountCents !== 7499
  ) {
    throw new Error(`third invoice pressure failed: ${JSON.stringify(thirdInvoice)}`)
  }

  const postCreditInvoice = await processReferralPaidSubscriptionInvoice({
    supabase,
    stripe,
    stripeInvoiceId: 'in_referral_4',
    stripeSubscriptionId: 'sub_referred',
    stripeCustomerId: 'cus_referred',
    amountPaidCents: 7499,
    paidAtIso: '2026-11-02T12:00:00.000Z',
  })
  if (postCreditInvoice.reason !== 'no_pending_referral') {
    throw new Error(
      `post-credit invoice pressure failed: ${JSON.stringify(postCreditInvoice)}`,
    )
  }

  const referral = state.rep_referrals[0]
  if (
    !referral ||
    referral.reward_status !== 'credited' ||
    referral.paid_service_months !== 3 ||
    referral.stripe_credit_id !== 'cbtxn_referral_1' ||
    credits.length !== 1 ||
    credits[0]?.customerId !== 'cus_referrer' ||
    credits[0]?.amount !== -7499 ||
    credits[0]?.idempotencyKey !== 'sparkle-suite-referral-credit-referral-1'
  ) {
    throw new Error(
      `referral credit invariant failed: ${JSON.stringify({
        referral,
        credits,
      })}`,
    )
  }

  return {
    ok: true,
    referralId,
    paidMonths: state.rep_referral_paid_months.length,
    creditsIssued: credits.length,
    duplicateInvoiceStatus: duplicateInvoice.reason,
    selfReferralBlocked: selfReferral === null,
    summary: buildReferralPressureSummary({
      referralId,
      paidMonths: state.rep_referral_paid_months.length,
      creditsIssued: credits.length,
      duplicateInvoiceStatus: duplicateInvoice.reason,
      selfReferralBlocked: selfReferral === null,
    }),
  }
}

if (
  process.argv[1]?.replace(/\\/g, '/').endsWith('/pressure-referral-system.ts')
) {
  runReferralSystemPressure()
    .then((result) => {
      console.log(result.summary)
    })
    .catch((error) => {
      console.error('[referral-pressure] error', error)
      process.exit(1)
    })
}
