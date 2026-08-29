import type {
  OperatorSupportWorkspaceArea,
  SupportCapability,
} from '@/lib/operator-support/types'

export type OperatorSupportToolPolicy = {
  capability: SupportCapability
  workspaceArea: OperatorSupportWorkspaceArea
  mutation: boolean
}

const POLICIES: Record<string, OperatorSupportToolPolicy> = {}

function register(
  names: readonly string[],
  capability: SupportCapability,
  workspaceArea: OperatorSupportWorkspaceArea,
  mutations: readonly string[] = [],
) {
  const mutationSet = new Set(mutations)
  for (const name of names) {
    POLICIES[name] = { capability, workspaceArea, mutation: mutationSet.has(name) }
  }
}

register(
  ['read_recent_rep_notes', 'write_rep_note', 'get_help_resources'],
  'workspace.view',
  'workspace',
  ['write_rep_note'],
)
register(
  ['get_required_setup_state', 'save_required_setup_answer'],
  'workspace.manage',
  'workspace',
  ['save_required_setup_answer'],
)
register(
  ['get_show_session_context', 'start_show_session', 'record_show_session_event', 'end_show'],
  'live_queue.manage',
  'live_queue',
  ['start_show_session', 'record_show_session_event', 'end_show'],
)
register(
  [
    'prepare_trade_board_work', 'list_my_trade_board', 'remove_listing',
    'restore_listing', 'add_listing', 'update_listing', 'search_jewelry_database',
    'report_jewelry_catalog_issue', 'get_trade_requests', 'approve_trade',
    'approve_trade_swap', 'reject_trade', 'get_trade_swap_cleanup',
    'get_trade_history', 'get_fulfillment_queue', 'update_fulfillment_status',
  ],
  'inventory.manage',
  'inventory',
  [
    'remove_listing', 'restore_listing', 'add_listing', 'update_listing',
    'report_jewelry_catalog_issue', 'approve_trade', 'approve_trade_swap',
    'reject_trade', 'update_fulfillment_status',
  ],
)
register(
  [
    'prepare_calendar_work', 'add_show', 'list_my_shows', 'update_show',
    'cancel_show', 'skip_show_occurrence', 'cancel_show_series',
    'pause_show_series',
  ],
  'calendar.manage',
  'calendar',
  [
    'add_show', 'update_show', 'cancel_show', 'skip_show_occurrence',
    'cancel_show_series', 'pause_show_series',
  ],
)
register(
  [
    'update_banner_text', 'update_streaming_links', 'update_site_setting',
    'list_site_recipes', 'manage_site_recipes', 'build_site_recipe_draft',
  ],
  'site.manage',
  'site',
  [
    'update_banner_text', 'update_streaming_links', 'update_site_setting',
    'manage_site_recipes', 'build_site_recipe_draft',
  ],
)
register(
  ['list_join_team_roster', 'manage_join_team_roster'],
  'team.manage',
  'team',
  ['manage_join_team_roster'],
)
register(
  [
    'get_customer_audience', 'manage_customer_contact',
    'get_notification_preferences', 'set_notification_preferences',
    'set_show_reminder_override',
  ],
  'customers.manage',
  'customers',
  [
    'manage_customer_contact', 'set_notification_preferences',
    'set_show_reminder_override',
  ],
)
register(
  [
    'send_sms_notification', 'send_email_notification',
    'submit_support_report', 'request_required_setup_support',
  ],
  'communications.manage',
  'communications',
  [
    'send_sms_notification', 'send_email_notification',
    'submit_support_report', 'request_required_setup_support',
  ],
)

// These change an access credential or entitlement. They stay unavailable
// even when a session carries every ordinary Workspace capability.
export const OPERATOR_SUPPORT_PERMANENTLY_BLOCKED_TOOLS = [
  'ensure_live_queue_sync_code',
  'unlock_required_setup',
] as const

const permanentlyBlocked = new Set<string>(OPERATOR_SUPPORT_PERMANENTLY_BLOCKED_TOOLS)

export function getOperatorSupportToolPolicy(
  toolName: string,
): OperatorSupportToolPolicy | null {
  if (permanentlyBlocked.has(toolName)) return null
  return POLICIES[toolName] ?? null
}

export function filterOperatorSupportToolNames(
  toolNames: readonly string[],
  capabilities: readonly SupportCapability[],
) {
  return toolNames.filter((toolName) => {
    const policy = getOperatorSupportToolPolicy(toolName)
    return Boolean(policy && capabilities.includes(policy.capability))
  })
}
