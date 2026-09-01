import type { SupportCapability } from './types'

export const OPERATOR_SUPPORT_CAPABILITIES = [
  'workspace.view',
  'workspace.manage',
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
  'messages.manage',
  'communications.manage',
  'nic_nac.use',
  'live_queue.view',
  'live_queue.manage',
] as const satisfies readonly SupportCapability[]

// An active support session mirrors ordinary Workspace access. The deny list
// is structural (billing/auth/security/ownership routes are never gateway
// eligible), rather than silently removing ordinary product capabilities.
export const DEFAULT_OPERATOR_SUPPORT_CAPABILITIES = [
  ...OPERATOR_SUPPORT_CAPABILITIES,
] as const

// Site-support operators can work only on a disclosed customer-site support
// session. This intentionally excludes customer records, messages, calendar,
// inventory, Live Queue, Nic-Nac, and every structural account area.
export const SITE_SUPPORT_OPERATOR_CAPABILITIES = [
  'site.view',
  'site.manage',
  'nic_nac.use',
] as const satisfies readonly SupportCapability[]

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
  'account_security',
  'account_email',
  'account_password',
  'deployments',
] as const
