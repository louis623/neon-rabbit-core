/**
 * Deny-by-default inventory for routes that are adjacent to the rep Workspace.
 *
 * A support-allowed classification is a design decision for a future, explicit
 * `/api/control-center/support-sessions/[sessionId]/...` handler. It does not
 * authorize the existing rep route to accept a Control Center cookie. Existing
 * routes keep their current authentication boundary.
 */

import type { SupportCapability } from './types'

export const OPERATOR_SUPPORT_ROUTE_CLASSIFICATIONS = [
  'support_allowed_read',
  'support_allowed_write',
  'support_blocked_sensitive',
  'rep_only',
  'not_applicable',
] as const

export type OperatorSupportRouteClassification =
  (typeof OPERATOR_SUPPORT_ROUTE_CLASSIFICATIONS)[number]

export const OPERATOR_SUPPORT_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const

export type OperatorSupportHttpMethod =
  (typeof OPERATOR_SUPPORT_HTTP_METHODS)[number]

export type OperatorSupportCapabilityHint = SupportCapability

export type OperatorSupportRouteInventoryEntry = {
  /** Repository-relative route-handler file. */
  file: `app/api/${string}/route.${'ts' | 'js' | 'tsx' | 'jsx' | 'mts' | 'mjs'}`
  /** Next.js URL pattern. Dynamic segment names remain in brackets. */
  path: `/api/${string}`
  methods: readonly OperatorSupportHttpMethod[]
  classification: OperatorSupportRouteClassification
  /** Capability required by the future explicit support handler, if planned. */
  capabilities?: readonly OperatorSupportCapabilityHint[]
  rationale: string
}

/**
 * Roots guarded by the filesystem completeness test. Provider callbacks are
 * named explicitly so their trust boundary cannot be confused with a Workspace
 * route. The future support-session root is guarded before its first route is
 * added.
 */
export const OPERATOR_SUPPORT_ROUTE_INVENTORY_ROOTS = [
  'app/api/account',
  'app/api/auth',
  'app/api/control-center/support-sessions',
  'app/api/nic-nac',
  'app/api/self-serve',
  'app/api/stripe',
  'app/api/telegram',
  'app/api/telnyx',
] as const

export const OPERATOR_SUPPORT_PROVIDER_ROUTE_ROOTS = [
  'app/api/stripe',
  'app/api/telegram',
  'app/api/telnyx',
] as const

export const OPERATOR_SUPPORT_ROUTE_INVENTORY = [
  {
    file: 'app/api/control-center/support-sessions/route.ts',
    path: '/api/control-center/support-sessions',
    methods: ['GET', 'POST'],
    classification: 'not_applicable',
    rationale: 'Creates and lists operator sessions behind the independent Control Center boundary.',
  },
  {
    file: 'app/api/control-center/support-sessions/[sessionId]/end/route.ts',
    path: '/api/control-center/support-sessions/[sessionId]/end',
    methods: ['POST'],
    classification: 'not_applicable',
    rationale: 'Closes the authenticated support session; it is not a target Workspace domain route.',
  },
  {
    file: 'app/api/control-center/support-sessions/[sessionId]/customers/route.ts',
    path: '/api/control-center/support-sessions/[sessionId]/customers',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['customers.view'],
    rationale: 'Provides a separately implemented read-only customer view with exports removed.',
  },
  {
    file: 'app/api/control-center/support-sessions/[sessionId]/gateway/route.ts',
    path: '/api/control-center/support-sessions/[sessionId]/gateway',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    classification: 'not_applicable',
    rationale: 'Deny-by-default boundary that dispatches only separately classified target Workspace routes.',
  },
  {
    file: 'app/api/account/activate-trial/route.ts',
    path: '/api/account/activate-trial',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Changes account access/entitlement state.',
  },
  {
    file: 'app/api/auth/callback/route.ts',
    path: '/api/auth/callback',
    methods: ['GET'],
    classification: 'support_blocked_sensitive',
    rationale: 'Completes a Supabase Auth identity flow and must never accept support identity.',
  },
  {
    file: 'app/api/nic-nac/account-billing/route.ts',
    path: '/api/nic-nac/account-billing',
    methods: ['GET'],
    classification: 'support_blocked_sensitive',
    rationale: 'Reads billing, subscription, and provider-linked account details.',
  },
  {
    file: 'app/api/nic-nac/calendar-summary/route.ts',
    path: '/api/nic-nac/calendar-summary',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['calendar.view'],
    rationale: 'Calendar viewing is approved through an explicit target-scoped support route.',
  },
  {
    file: 'app/api/nic-nac/conversation-rollover/route.ts',
    path: '/api/nic-nac/conversation-rollover',
    methods: ['POST'],
    classification: 'rep_only',
    rationale: 'Operates the rep conversation; support mode requires separate conversation continuity.',
  },
  {
    file: 'app/api/nic-nac/conversation-state/route.ts',
    path: '/api/nic-nac/conversation-state',
    methods: ['GET'],
    classification: 'rep_only',
    rationale: 'Exposes ordinary rep conversation state, not the support-specific conversation.',
  },
  {
    file: 'app/api/nic-nac/conversation/[conversationId]/route.ts',
    path: '/api/nic-nac/conversation/[conversationId]',
    methods: ['GET'],
    classification: 'rep_only',
    rationale: 'Reads an ordinary rep Nic-Nac conversation by identifier.',
  },
  {
    file: 'app/api/nic-nac/conversation/clear/route.ts',
    path: '/api/nic-nac/conversation/clear',
    methods: ['POST'],
    classification: 'rep_only',
    rationale: 'Mutates ordinary rep conversation continuity.',
  },
  {
    file: 'app/api/nic-nac/conversation/latest/route.ts',
    path: '/api/nic-nac/conversation/latest',
    methods: ['GET'],
    classification: 'rep_only',
    rationale: 'Resolves the rep latest conversation; support continuity must be isolated.',
  },
  {
    file: 'app/api/nic-nac/conversation/rollover/route.ts',
    path: '/api/nic-nac/conversation/rollover',
    methods: ['POST'],
    classification: 'rep_only',
    rationale: 'Operates ordinary rep conversation rollover state.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/attachments/[attachmentId]/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/attachments/[attachmentId]',
    methods: ['GET'],
    classification: 'rep_only',
    rationale: 'Issues signed access for private conversation attachments.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/attachments/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/attachments',
    methods: ['POST'],
    classification: 'rep_only',
    rationale: 'Uploads into an ordinary rep conversation; support uploads need separate attribution.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/block/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/block',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Changes private Rep Network safety state as the rep.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/messages/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/messages',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Sends a private message as the rep; outbound communications are blocked in v1.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/report/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/report',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Creates a private Rep Network report attributed to the rep.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/request-decision/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/request-decision',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Accepts or declines private Rep Network contact as the rep.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]',
    methods: ['GET'],
    classification: 'support_blocked_sensitive',
    rationale: 'May expose private Support or Rep Network message content.',
  },
  {
    file: 'app/api/nic-nac/conversations/[conversationId]/state/route.ts',
    path: '/api/nic-nac/conversations/[conversationId]/state',
    methods: ['PATCH'],
    classification: 'support_blocked_sensitive',
    rationale: 'Changes private conversation read, archive, mute, or related rep state.',
  },
  {
    file: 'app/api/nic-nac/conversations/rep-directory/route.ts',
    path: '/api/nic-nac/conversations/rep-directory',
    methods: ['GET'],
    classification: 'support_blocked_sensitive',
    rationale: 'Exposes private Rep Network discovery data outside the support task.',
  },
  {
    file: 'app/api/nic-nac/conversations/rep-requests/route.ts',
    path: '/api/nic-nac/conversations/rep-requests',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Initiates a private Rep Network request as the rep.',
  },
  {
    file: 'app/api/nic-nac/conversations/support/route.ts',
    path: '/api/nic-nac/conversations/support',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Sends a support submission attributed to the rep and may upload private screenshots.',
  },
  {
    file: 'app/api/nic-nac/customer-audience/route.ts',
    path: '/api/nic-nac/customer-audience',
    methods: ['GET', 'POST', 'PATCH'],
    classification: 'support_blocked_sensitive',
    rationale: 'Combines customer PII management with a CSV export; support needs split, non-export routes.',
  },
  {
    file: 'app/api/nic-nac/fulfillment-queue/route.ts',
    path: '/api/nic-nac/fulfillment-queue',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['inventory.view', 'inventory.manage'],
    rationale: 'Fulfillment viewing and normal workflow actions are approved with audit.',
  },
  {
    file: 'app/api/nic-nac/health/route.ts',
    path: '/api/nic-nac/health',
    methods: ['GET'],
    classification: 'not_applicable',
    rationale: 'Operational health does not read or mutate a target rep Workspace.',
  },
  {
    file: 'app/api/nic-nac/jewelry-library/route.ts',
    path: '/api/nic-nac/jewelry-library',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['inventory.view', 'inventory.manage'],
    rationale: 'Inventory library setup is an approved audited support workflow.',
  },
  {
    file: 'app/api/nic-nac/join-team-roster/route.ts',
    path: '/api/nic-nac/join-team-roster',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['team.view', 'team.manage'],
    rationale: 'Non-communication team roster setup is approved with audit.',
  },
  {
    file: 'app/api/nic-nac/me/route.ts',
    path: '/api/nic-nac/me',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['workspace.view'],
    rationale: 'Target Workspace identity is needed through a frozen support context route.',
  },
  {
    file: 'app/api/nic-nac/messages/route.ts',
    path: '/api/nic-nac/messages',
    methods: ['GET', 'PATCH', 'POST', 'PUT', 'DELETE'],
    classification: 'support_blocked_sensitive',
    rationale: 'Mixes inbox reads with read/archive mutation; support requires a separate non-mutating read route.',
  },
  {
    file: 'app/api/nic-nac/resource-library/route.ts',
    path: '/api/nic-nac/resource-library',
    methods: ['GET'],
    classification: 'not_applicable',
    rationale: 'Reads shared learning resources rather than target-owned Workspace data.',
  },
  {
    file: 'app/api/nic-nac/resources/route.ts',
    path: '/api/nic-nac/resources',
    methods: ['GET'],
    classification: 'not_applicable',
    rationale: 'Reads shared resource content rather than target-owned Workspace data.',
  },
  {
    file: 'app/api/nic-nac/route.ts',
    path: '/api/nic-nac',
    methods: ['POST'],
    classification: 'rep_only',
    rationale: 'The rep chat route owns rep identity/memory; support needs a distinct actor-aware conversation route.',
  },
  {
    file: 'app/api/nic-nac/send-email/route.ts',
    path: '/api/nic-nac/send-email',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Sends outbound customer email as the rep.',
  },
  {
    file: 'app/api/nic-nac/site-analytics/route.ts',
    path: '/api/nic-nac/site-analytics',
    methods: ['GET'],
    classification: 'rep_only',
    rationale: 'Site analytics are not part of the explicitly approved v1 support route list.',
  },
  {
    file: 'app/api/nic-nac/site-recipes/draft/route.ts',
    path: '/api/nic-nac/site-recipes/draft',
    methods: ['POST'],
    classification: 'support_allowed_write',
    capabilities: ['site.manage'],
    rationale: 'Recipe drafting is approved customer-site setup work with audit.',
  },
  {
    file: 'app/api/nic-nac/site-recipes/image/route.ts',
    path: '/api/nic-nac/site-recipes/image',
    methods: ['POST'],
    classification: 'support_allowed_write',
    capabilities: ['site.manage'],
    rationale: 'Recipe image upload is approved customer-site setup work with safe file auditing.',
  },
  {
    file: 'app/api/nic-nac/site-recipes/route.ts',
    path: '/api/nic-nac/site-recipes',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['site.view', 'site.manage'],
    rationale: 'Recipe viewing and editing are approved customer-site support work.',
  },
  {
    file: 'app/api/nic-nac/site-settings/media/route.ts',
    path: '/api/nic-nac/site-settings/media',
    methods: ['POST'],
    classification: 'support_allowed_write',
    capabilities: ['site.manage'],
    rationale: 'Customer-site media setup is approved with existing file validation and audit.',
  },
  {
    file: 'app/api/nic-nac/site-settings/route.ts',
    path: '/api/nic-nac/site-settings',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['site.view', 'site.manage'],
    rationale: 'Customer-site settings are an explicitly approved support workflow.',
  },
  {
    file: 'app/api/nic-nac/support-reports/route.ts',
    path: '/api/nic-nac/support-reports',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Creates a support report attributed to the rep rather than the operator.',
  },
  {
    file: 'app/api/nic-nac/support-access-history/route.ts',
    path: '/api/nic-nac/support-access-history',
    methods: ['GET'],
    classification: 'rep_only',
    rationale: 'Rep-visible transparency history is scoped to the authenticated rep, not the operator Workspace.',
  },
  {
    file: 'app/api/nic-nac/team-onboarding/participants/[participantId]/messages/route.ts',
    path: '/api/nic-nac/team-onboarding/participants/[participantId]/messages',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Sends an outbound team message as the rep.',
  },
  {
    file: 'app/api/nic-nac/team-onboarding/participants/[participantId]/route.ts',
    path: '/api/nic-nac/team-onboarding/participants/[participantId]',
    methods: ['PATCH'],
    classification: 'support_allowed_write',
    capabilities: ['team.manage'],
    rationale: 'Non-communication participant setup changes are approved with audit.',
  },
  {
    file: 'app/api/nic-nac/team-onboarding/participants/route.ts',
    path: '/api/nic-nac/team-onboarding/participants',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['team.view', 'team.manage'],
    rationale: 'Participant setup is approved; outbound messaging remains separately blocked.',
  },
  {
    file: 'app/api/nic-nac/trade-board/route.ts',
    path: '/api/nic-nac/trade-board',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    classification: 'support_allowed_write',
    capabilities: ['inventory.view', 'inventory.manage'],
    rationale: 'Inventory listing setup and correction are approved with audit.',
  },
  {
    file: 'app/api/nic-nac/trade-history/route.ts',
    path: '/api/nic-nac/trade-history',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['inventory.view'],
    rationale: 'Trade history is approved target-scoped support context.',
  },
  {
    file: 'app/api/nic-nac/trade-requests/[requestId]/reveal-screenshot/route.ts',
    path: '/api/nic-nac/trade-requests/[requestId]/reveal-screenshot',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['inventory.view'],
    rationale: 'A target-owned trade reveal image may be needed for inventory troubleshooting.',
  },
  {
    file: 'app/api/nic-nac/trade-requests/route.ts',
    path: '/api/nic-nac/trade-requests',
    methods: ['GET', 'POST'],
    classification: 'support_allowed_write',
    capabilities: ['inventory.view', 'inventory.manage'],
    rationale: 'Normal trade-request workflow assistance is approved with audit.',
  },
  {
    file: 'app/api/nic-nac/trade-swap-cleanup/route.ts',
    path: '/api/nic-nac/trade-swap-cleanup',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['inventory.view'],
    rationale: 'Reads the target rep cleanup queue without changing trade state.',
  },
  {
    file: 'app/api/nic-nac/wallet-summary/route.ts',
    path: '/api/nic-nac/wallet-summary',
    methods: ['GET'],
    classification: 'support_blocked_sensitive',
    rationale: 'Reads SMS wallet and funding state, which is explicitly excluded.',
  },
  {
    file: 'app/api/self-serve/setup-state/route.ts',
    path: '/api/self-serve/setup-state',
    methods: ['GET'],
    classification: 'support_allowed_read',
    capabilities: ['workspace.view'],
    rationale: 'Required setup state is approved target Workspace context.',
  },
  {
    file: 'app/api/self-serve/signup/route.ts',
    path: '/api/self-serve/signup',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Creates account/authentication and pricing-reservation state.',
  },
  {
    file: 'app/api/stripe/create-checkout/route.ts',
    path: '/api/stripe/create-checkout',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Creates a Stripe checkout and may cause a charge.',
  },
  {
    file: 'app/api/stripe/create-portal-session/route.ts',
    path: '/api/stripe/create-portal-session',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Creates access to the Stripe billing portal.',
  },
  {
    file: 'app/api/stripe/subscription-status/route.ts',
    path: '/api/stripe/subscription-status',
    methods: ['GET'],
    classification: 'support_blocked_sensitive',
    rationale: 'Reads subscription, pricing tier, and provider status.',
  },
  {
    file: 'app/api/stripe/sync/route.ts',
    path: '/api/stripe/sync',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Reads Stripe and mutates local subscription/entitlement state.',
  },
  {
    file: 'app/api/stripe/wallet/auto-recharge/route.ts',
    path: '/api/stripe/wallet/auto-recharge',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Changes automatic SMS wallet funding settings.',
  },
  {
    file: 'app/api/stripe/wallet/load/route.ts',
    path: '/api/stripe/wallet/load',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Purchases SMS wallet credit through Stripe.',
  },
  {
    file: 'app/api/stripe/webhook/route.ts',
    path: '/api/stripe/webhook',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Provider-signed billing callback; never a support-session endpoint.',
  },
  {
    file: 'app/api/telegram/route.ts',
    path: '/api/telegram',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'External provider webhook that can drive outbound or operational behavior.',
  },
  {
    file: 'app/api/telnyx/webhook/route.ts',
    path: '/api/telnyx/webhook',
    methods: ['POST'],
    classification: 'support_blocked_sensitive',
    rationale: 'Provider-signed SMS callback containing customer communication state.',
  },
] as const satisfies readonly OperatorSupportRouteInventoryEntry[]

export function getOperatorSupportRouteClassification(path: string) {
  return OPERATOR_SUPPORT_ROUTE_INVENTORY.find((entry) => entry.path === path)
}

export function isOperatorSupportGatewayClassificationAllowed(
  classification: OperatorSupportRouteClassification | undefined,
) {
  return (
    classification === 'support_allowed_read' ||
    classification === 'support_allowed_write'
  )
}
