import { describe, expect, it } from 'vitest'

import {
  getLaunchPromptForWorkspaceAction,
  getPrimaryWorkspaceSections,
} from '@/lib/nic-nac/workspace-launch-actions'

describe('workspace launch actions', () => {
  it('returns the concept-1 primary nav set', () => {
    expect(getPrimaryWorkspaceSections()).toEqual([
      'home',
      'trade-board',
      'show-calendar',
      'more',
    ])
  })

  it('maps quick actions to Nic-Nac starter prompts', () => {
    expect(getLaunchPromptForWorkspaceAction('add_trade_piece')).toBe(
      'Add a piece to Dance Floor',
    )
    expect(getLaunchPromptForWorkspaceAction('add_calendar_show')).toBe(
      'Add a Show to the Calendar',
    )
    expect(getLaunchPromptForWorkspaceAction('check_board')).toBe(
      "What's on my Dance Floor right now?",
    )
  })
})
