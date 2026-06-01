import type { NicNacSurface } from './surfaces'

export interface NicNacSurfacePolicy {
  surface: NicNacSurface
  audience: string
  allowedScopes: string[]
  blockedScopes: string[]
  canUseAuthenticatedWorkspaceTools: boolean
  canTriggerProviderActions: boolean
}

export const NIC_NAC_SURFACE_POLICIES = {
  public_landing: {
    surface: 'public_landing',
    audience: 'Potential Sparkle Suite buyers and Bomb Party representatives before checkout.',
    allowedScopes: [
      'public_sales_support',
      'public_product_fit',
      'public_setup_overview',
      'public_tradeboard_explanation',
    ],
    blockedScopes: [
      'private_workspace_data',
      'admin_workflows',
      'implementation_details',
      'provider_actions',
      'custom_pricing_exceptions',
      'non_public_roadmap',
    ],
    canUseAuthenticatedWorkspaceTools: false,
    canTriggerProviderActions: false,
  },
  rep_workspace: {
    surface: 'rep_workspace',
    audience: 'Authenticated Sparkle Suite reps working inside their own workspace.',
    allowedScopes: [
      'authenticated_rep_workspace',
      'rep_owned_trade_board',
      'rep_owned_trade_requests',
      'rep_owned_calendar',
      'rep_owned_customer_audience',
      'approved_single_customer_notifications',
    ],
    blockedScopes: [
      'cross_rep_data',
      'unapproved_provider_actions',
      'secret_extraction',
      'prompt_extraction',
      'unsupported_bulk_campaigns',
      'non_public_roadmap',
    ],
    canUseAuthenticatedWorkspaceTools: true,
    canTriggerProviderActions: true,
  },
  customer_site: {
    surface: 'customer_site',
    audience: 'Customers visiting a rep customer-facing site.',
    allowedScopes: [
      'customer_safe_support',
      'public_show_details',
      'customer_trade_request_help',
      'public_liveq_status_explanation',
    ],
    blockedScopes: [
      'rep_admin_workflows',
      'private_workspace_data',
      'cross_customer_data',
      'provider_actions',
      'private_rep_notes',
    ],
    canUseAuthenticatedWorkspaceTools: false,
    canTriggerProviderActions: false,
  },
  sparkle_finder: {
    surface: 'sparkle_finder',
    audience: 'Sparkle Finder users who need finder-safe guidance.',
    allowedScopes: [
      'finder_safe_guidance',
      'public_product_language',
      'shared_nic_nac_personality',
    ],
    blockedScopes: [
      'sparkle_suite_private_workspace',
      'rep_admin_workflows',
      'provider_actions',
      'secret_extraction',
    ],
    canUseAuthenticatedWorkspaceTools: false,
    canTriggerProviderActions: false,
  },
} as const satisfies Record<NicNacSurface, NicNacSurfacePolicy>

export function getNicNacSurfacePolicy(surface: NicNacSurface) {
  return NIC_NAC_SURFACE_POLICIES[surface]
}
