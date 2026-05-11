import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getStripe,
  stripeEnabled as isStripeEnabled,
} from '@/lib/stripe/client'
import { ServiceError } from '@/lib/services/errors'
import type {
  AccountBillingDashboardResult,
  AccountBillingInvoiceSummary,
  AccountBillingPaymentMethodSummary,
  AccountBillingSubscriptionStatus,
} from '@/lib/services/types'

type SubscriptionRow = {
  status: AccountBillingSubscriptionStatus
  plan_tier: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  cancelled_at: string | null
  stripe_livemode: boolean | null
}

function toServiceError(
  code: string,
  message: string,
  userMessage: string,
  cause: unknown,
) {
  return new ServiceError({
    code,
    message,
    userMessage,
    cause,
    statusCode: 500,
  })
}

function mapPaymentMethod(
  customer: unknown,
): AccountBillingPaymentMethodSummary | null {
  const source = customer as {
    invoice_settings?: {
      default_payment_method?: {
        card?: {
          brand?: string | null
          last4?: string | null
          exp_month?: number | null
          exp_year?: number | null
        } | null
      } | null
    } | null
  }

  const card = source.invoice_settings?.default_payment_method?.card
  if (
    !card?.brand ||
    !card.last4 ||
    !card.exp_month ||
    !card.exp_year
  ) {
    return null
  }

  return {
    brand: card.brand,
    last4: card.last4,
    expMonth: card.exp_month,
    expYear: card.exp_year,
  }
}

function mapInvoices(invoices: unknown[]): AccountBillingInvoiceSummary[] {
  return invoices.map((invoice) => {
    const row = invoice as {
      id: string
      created: number
      amount_paid: number | null
      currency: string | null
      status: string | null
      hosted_invoice_url: string | null
      invoice_pdf: string | null
    }

    return {
      id: row.id,
      createdAt: new Date(row.created * 1000).toISOString(),
      amountPaidCents: row.amount_paid ?? 0,
      currency: row.currency ?? 'usd',
      status: row.status,
      hostedInvoiceUrl: row.hosted_invoice_url,
      invoicePdfUrl: row.invoice_pdf,
    }
  })
}

export async function getAccountBillingDashboard(args: {
  supabase: SupabaseClient
  repId: string
  stripeCustomerId: string | null
}): Promise<AccountBillingDashboardResult> {
  const { data, error } = await args.supabase
    .from('subscriptions')
    .select(
      'status, plan_tier, current_period_end, cancel_at_period_end, cancelled_at, stripe_livemode',
    )
    .eq('rep_id', args.repId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw toServiceError(
      'ACCOUNT_BILLING_LOOKUP_FAILED',
      'failed to load subscription row',
      "I couldn't load billing details right now.",
      error,
    )
  }

  const subscriptionRow = (data as SubscriptionRow | null) ?? null
  const stripeConfigured = isStripeEnabled()

  let paymentMethod: AccountBillingPaymentMethodSummary | null = null
  let invoices: AccountBillingInvoiceSummary[] = []

  if (stripeConfigured && args.stripeCustomerId) {
    try {
      const stripe = getStripe()
      const [customer, invoiceList] = await Promise.all([
        stripe.customers.retrieve(args.stripeCustomerId, {
          expand: ['invoice_settings.default_payment_method'],
        }),
        stripe.invoices.list({
          customer: args.stripeCustomerId,
          limit: 5,
        }),
      ])

      paymentMethod = mapPaymentMethod(customer)
      invoices = mapInvoices(invoiceList.data)
    } catch (cause) {
      throw toServiceError(
        'ACCOUNT_BILLING_STRIPE_LOOKUP_FAILED',
        'failed to load Stripe billing details',
        "I couldn't load the latest Stripe billing details right now.",
        cause,
      )
    }
  }

  const subscription = subscriptionRow
    ? {
        status: subscriptionRow.status,
        planType: 'monthly' as const,
        currentPeriodEnd: subscriptionRow.current_period_end,
        cancelAtPeriodEnd: subscriptionRow.cancel_at_period_end ?? false,
        cancelledAt: subscriptionRow.cancelled_at,
        livemode: subscriptionRow.stripe_livemode ?? false,
      }
    : null

  const canManageBilling = Boolean(
    stripeConfigured &&
      args.stripeCustomerId &&
      subscription &&
      subscription.status !== 'cancelled',
  )
  const canStartSubscription = !subscription || subscription.status === 'cancelled'

  return {
    stripeConfigured,
    subscription,
    paymentMethod,
    invoices,
    canStartSubscription,
    canManageBilling,
  }
}
