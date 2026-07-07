export const WORKSPACE_PRIMARY_SECTIONS = [
  'home',
  'trade-board',
  'show-calendar',
  'jewelry-library',
  'more',
] as const

export type WorkspacePrimarySection = (typeof WORKSPACE_PRIMARY_SECTIONS)[number]

export type WorkspaceLaunchAction =
  | 'add_trade_piece'
  | 'add_calendar_show'
  | 'check_board'
  | 'open_site_preview'

const LAUNCH_PROMPTS: Record<WorkspaceLaunchAction, string | null> = {
  add_trade_piece: 'Add a piece to Trade Board',
  add_calendar_show: 'Add a Show to the Calendar',
  check_board: "What's on my Trade Board right now?",
  open_site_preview: null,
}

export function getPrimaryWorkspaceSections(): WorkspacePrimarySection[] {
  return [...WORKSPACE_PRIMARY_SECTIONS]
}

export function getLaunchPromptForWorkspaceAction(
  action: WorkspaceLaunchAction,
): string | null {
  return LAUNCH_PROMPTS[action]
}
