import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

const getJoinTeamRosterMock = vi.fn()
const upsertJoinTeamMemberMock = vi.fn()
const removeJoinTeamMemberMock = vi.fn()
const reorderJoinTeamRosterMock = vi.fn()

vi.mock('@/lib/services/join-team-roster', () => ({
  getJoinTeamRoster: (...args: unknown[]) => getJoinTeamRosterMock(...args),
  upsertJoinTeamMember: (...args: unknown[]) =>
    upsertJoinTeamMemberMock(...args),
  removeJoinTeamMember: (...args: unknown[]) =>
    removeJoinTeamMemberMock(...args),
  reorderJoinTeamRoster: (...args: unknown[]) =>
    reorderJoinTeamRosterMock(...args),
}))

import {
  makeListJoinTeamRosterTool,
  makeManageJoinTeamRosterTool,
} from '@/lib/nic-nac/tools/join-team-roster'
import { buildAllTools, listToolNamesForIntents } from '@/lib/nic-nac/tools'
import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

interface ToolDef {
  description?: string
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeCtx() {
  return {
    repId: 'rep-britt',
    supabase: { marker: 'supabase' } as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

describe('join team roster Nic-Nac tools', () => {
  beforeEach(() => {
    getJoinTeamRosterMock.mockReset()
    upsertJoinTeamMemberMock.mockReset()
    removeJoinTeamMemberMock.mockReset()
    reorderJoinTeamRosterMock.mockReset()
  })

  it('lists editable roster cards including hidden cards and links', async () => {
    getJoinTeamRosterMock.mockResolvedValueOnce([
      {
        id: 'member-brittany',
        displayName: 'Brittany',
        links: {
          tiktok: 'https://www.tiktok.com/@brittwithbling',
          facebook: 'https://www.facebook.com/groups/390848873287947',
          website: 'https://bombparty.com/brittwithbling',
        },
        isVisible: true,
      },
    ])
    const tool = makeListJoinTeamRosterTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({})

    expect(getJoinTeamRosterMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-britt',
      { visibleOnly: false },
    )
    expect(result).toMatchObject({
      count: 1,
      members: [
        {
          id: 'member-brittany',
          displayName: 'Brittany',
          links: {
            tiktok: 'https://www.tiktok.com/@brittwithbling',
            facebook: 'https://www.facebook.com/groups/390848873287947',
            website: 'https://bombparty.com/brittwithbling',
          },
        },
      ],
    })
  })

  it('manages upsert, remove, and reorder actions for roster cards', async () => {
    upsertJoinTeamMemberMock.mockResolvedValueOnce({
      id: 'member-rayna',
      displayName: 'Rayna',
    })
    removeJoinTeamMemberMock.mockResolvedValueOnce({ memberId: 'member-old' })
    reorderJoinTeamRosterMock.mockResolvedValueOnce({ updatedCount: 2 })
    const tool = makeManageJoinTeamRosterTool(makeCtx()) as unknown as ToolDef

    const upsert = await tool.execute({
      action: 'upsert',
      member: {
        displayName: 'Rayna',
        businessName: 'Queen of Blingy Thingz',
        links: {
          tiktok: 'https://www.tiktok.com/@queenofblingythingz',
          facebook: 'https://www.facebook.com/share/g/14TcP1vbcq8/',
          instagram: 'https://www.instagram.com/example',
          website: 'https://example.com',
        },
      },
    })
    const remove = await tool.execute({
      action: 'remove',
      memberId: 'member-old',
    })
    const reorder = await tool.execute({
      action: 'reorder',
      memberIds: ['member-brittany', 'member-rayna'],
    })

    expect(upsertJoinTeamMemberMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-britt',
      expect.objectContaining({
        displayName: 'Rayna',
        links: expect.objectContaining({
          facebook: 'https://www.facebook.com/share/g/14TcP1vbcq8/',
          instagram: 'https://www.instagram.com/example',
          website: 'https://example.com',
        }),
      }),
    )
    expect(removeJoinTeamMemberMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-britt',
      'member-old',
    )
    expect(reorderJoinTeamRosterMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-britt',
      { memberIds: ['member-brittany', 'member-rayna'] },
    )
    expect(upsert).toMatchObject({
      action: 'upsert',
      member: { id: 'member-rayna' },
    })
    expect(remove).toEqual({ action: 'remove', memberId: 'member-old' })
    expect(reorder).toEqual({ action: 'reorder', updatedCount: 2 })
  })

  it('translates service errors into Nic-Nac tool errors', async () => {
    upsertJoinTeamMemberMock.mockRejectedValueOnce(
      errors.INVALID_INPUT('displayName required', 'I need the team member name.'),
    )
    const tool = makeManageJoinTeamRosterTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({ action: 'upsert', member: { displayName: '' } }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'INVALID_INPUT',
      userMessage: 'I need the team member name.',
    })
  })

  it('requires approval for removal but not ordinary roster edits', () => {
    const tool = makeManageJoinTeamRosterTool(makeCtx()) as unknown as ToolDef & {
      needsApproval: (input: { action: string }) => boolean
    }

    expect(tool.needsApproval({ action: 'remove' })).toBe(true)
    expect(tool.needsApproval({ action: 'upsert' })).toBe(false)
    expect(tool.needsApproval({ action: 'reorder' })).toBe(false)
  })

  it('exposes roster tools through the site tool pack and system prompt', () => {
    const tools = buildAllTools(makeCtx())
    const siteDefinitions = listToolNamesForIntents(['site'])

    expect(Object.keys(tools)).toEqual(
      expect.arrayContaining([
        'list_join_team_roster',
        'manage_join_team_roster',
      ]),
    )
    expect(siteDefinitions).toEqual(
      expect.arrayContaining([
        'list_join_team_roster',
        'manage_join_team_roster',
      ]),
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('list_join_team_roster')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('manage_join_team_roster')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Facebook/VIP')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('website/globe')
  })
})
