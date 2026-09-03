import type { SupabaseClient } from '@supabase/supabase-js'

import {
  listOperatorCustomerProfiles,
  type OperatorCustomerProfile,
} from '@/lib/services/client-account-profiles'

export type ProjectedClientBilling = {
  clientName: string
  plan: string | null
  monthlyAmount: number
}

export type SparkleSuiteAccountingProjection = {
  monthlyRevenue: number
  pricedActiveClientCount: number
  activeClientCount: number
  pastDueClientCount: number
  cancelledClientCount: number
  clientsMissingMonthlyAmount: number
  clientBilling: ProjectedClientBilling[]
}

function isActiveProjectedClient(customer: OperatorCustomerProfile) {
  return (
    customer.accountClassification === 'customer' &&
    customer.accountStatus === 'active' &&
    customer.billing.status === 'active'
  )
}

function monthlyAmount(customer: OperatorCustomerProfile) {
  const value = customer.billing.monthlyAmount
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}

export function summarizeSparkleSuiteProjectedRevenue(
  customers: OperatorCustomerProfile[],
): SparkleSuiteAccountingProjection {
  const activeClients = customers.filter(isActiveProjectedClient)
  const customerSubscriptions = customers.filter(
    (customer) => customer.accountClassification === 'customer',
  )
  const pricedClients = activeClients.flatMap((customer) => {
    const amount = monthlyAmount(customer)
    return amount === null
      ? []
      : [{
          clientName: customer.clientName,
          plan: customer.billing.pricingTier ?? customer.billing.planTier,
          monthlyAmount: amount,
        }]
  })

  return {
    monthlyRevenue: pricedClients.reduce(
      (total, client) => total + client.monthlyAmount,
      0,
    ),
    activeClientCount: activeClients.length,
    pastDueClientCount: customerSubscriptions.filter(
      (customer) => customer.billing.status === 'past_due',
    ).length,
    cancelledClientCount: customerSubscriptions.filter(
      (customer) => customer.billing.status === 'cancelled',
    ).length,
    pricedActiveClientCount: pricedClients.length,
    clientsMissingMonthlyAmount: activeClients.length - pricedClients.length,
    clientBilling: pricedClients.sort((left, right) =>
      left.clientName.localeCompare(right.clientName),
    ),
  }
}

export async function loadSparkleSuiteAccountingProjection(
  supabase: SupabaseClient,
): Promise<SparkleSuiteAccountingProjection> {
  const customers = await listOperatorCustomerProfiles(supabase, { limit: 500 })
  return summarizeSparkleSuiteProjectedRevenue(customers)
}
