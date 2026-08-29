import type { SupportCapability } from './types'

export const OPERATOR_SUPPORT_CAPABILITIES = [
  'workspace.view',
  'site.view',
  'site.manage',
  'inventory.view',
  'inventory.manage',
  'calendar.view',
  'calendar.manage',
  'customers.view',
  'customers.manage',
  'team.view',
  'team.manage',
  'messages.view',
  'nic_nac.use',
  'live_queue.view',
] as const satisfies readonly SupportCapability[]

export const DEFAULT_OPERATOR_SUPPORT_CAPABILITIES = OPERATOR_SUPPORT_CAPABILITIES.filter(
  (capability) =>
    ![
      'customers.manage',
      'messages.view',
      'nic_nac.use',
      'live_queue.view',
    ].includes(capability),
)

const capabilitySet = new Set<string>(OPERATOR_SUPPORT_CAPABILITIES)

export function isSupportCapability(value: unknown): value is SupportCapability {
  return typeof value === 'string' && capabilitySet.has(value)
}

export function normalizeSupportCapabilities(values: readonly unknown[]): SupportCapability[] {
  const normalized = [...new Set(values)]
  if (normalized.length === 0 || normalized.some((value) => !isSupportCapability(value))) {
    throw new Error('Operator support capabilities are invalid.')
  }
  return normalized as SupportCapability[]
}

export function hasSupportCapability(
  capabilities: readonly SupportCapability[],
  requested: SupportCapability,
) {
  return capabilities.includes(requested)
}

export const BLOCKED_OPERATOR_SUPPORT_AREAS = [
  'billing',
  'subscription',
  'payment_methods',
  'sms_wallet',
  'authentication',
  'account_ownership',
  'account_deletion',
  'provider_credentials',
  'outbound_communications',
  'customer_exports',
  'message_state',
  'deployments',
] as const
