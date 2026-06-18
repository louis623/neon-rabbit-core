import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceError, errors } from '@/lib/services/errors'

const getPaidNicNacContextMock = vi.fn()
const getJoinTeamRosterMock = vi.fn()
const upsertJoinTeamMemberMock = vi.fn()
const removeJoinTeamMemberMock = vi.fn()
const reorderJoinTeamRosterMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getPaidNicNacContext: (...args: unknown[]) =>
    getPaidNicNacContextMock(...args),
}))

vi.mock('@/lib/services/join-team-roster', () => ({
  getJoinTeamRoster: (...args: unknown[]) => getJoinTeamRosterMock(...args),
  upsertJoinTeamMember: (...args: unknown[]) =>
    upsertJoinTeamMemberMock(...args),
  removeJoinTeamMember: (...args: unknown[]) =>
    removeJoinTeamMemberMock(...args),
  reorderJoinTeamRoster: (...args: unknown[]) =>
    reorderJoinTeamRosterMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/join-team-roster/route'
import { AuthError } from '@/lib/nic-nac/auth'

describe('/api/nic-nac/join-team-roster', () => {
  beforeEach(() => {
    getPaidNicNacContextMock.mockReset()
    getJoinTeamRosterMock.mockReset()
    upsertJoinTeamMemberMock.mockReset()
    removeJoinTeamMemberMock.mockReset()
    reorderJoinTeamRosterMock.mockReset()
  })

  it('lists all visible and hidden roster cards for the paid rep context', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-britt',
      supabase: { marker: 'supabase' },
    })
    getJoinTeamRosterMock.mockResolvedValueOnce([
      {
        id: 'member-1',
        displayName: 'Brittany',
        links: {
          tiktok: 'https://www.tiktok.com/@brittwithbling',
          facebook: 'https://www.facebook.com/groups/390848873287947',
          website: 'https://bombparty.com/brittwithbling',
        },
        isVisible: true,
      },
    ])

    const response = await GET()

    expect(getJoinTeamRosterMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-britt',
      { visibleOnly: false },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      members: [
        {
          id: 'member-1',
          displayName: 'Brittany',
          links: {
            tiktok: 'https://www.tiktok.com/@brittwithbling',
            facebook: 'https://www.facebook.com/groups/390848873287947',
            website: 'https://bombparty.com/brittwithbling',
          },
          isVisible: true,
        },
      ],
    })
  })

  it('upserts a roster card with social and website links', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-britt',
      supabase: { marker: 'supabase' },
    })
    upsertJoinTeamMemberMock.mockResolvedValueOnce({
      id: 'member-rayna',
      displayName: 'Rayna',
      businessName: 'Queen of Blingy Thingz',
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/join-team-roster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          member: {
            displayName: 'Rayna',
            businessName: 'Queen of Blingy Thingz',
            photoUrl: 'https://static.readdy.ai/rayna.png',
            links: {
              tiktok: 'https://www.tiktok.com/@queenofblingythingz',
              facebook: 'https://www.facebook.com/share/g/14TcP1vbcq8/',
              instagram: 'https://www.instagram.com/example',
              website: 'https://example.com',
            },
          },
        }),
      }),
    )

    expect(upsertJoinTeamMemberMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-britt',
      expect.objectContaining({
        displayName: 'Rayna',
        links: expect.objectContaining({
          tiktok: 'https://www.tiktok.com/@queenofblingythingz',
          facebook: 'https://www.facebook.com/share/g/14TcP1vbcq8/',
          instagram: 'https://www.instagram.com/example',
          website: 'https://example.com',
        }),
      }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      member: {
        id: 'member-rayna',
        displayName: 'Rayna',
        businessName: 'Queen of Blingy Thingz',
      },
    })
  })

  it('removes and reorders roster cards by explicit actions', async () => {
    getPaidNicNacContextMock
      .mockResolvedValueOnce({
        repId: 'rep-britt',
        supabase: { marker: 'supabase' },
      })
      .mockResolvedValueOnce({
        repId: 'rep-britt',
        supabase: { marker: 'supabase' },
      })
    removeJoinTeamMemberMock.mockResolvedValueOnce({ memberId: 'member-old' })
    reorderJoinTeamRosterMock.mockResolvedValueOnce({ updatedCount: 2 })

    const removeResponse = await POST(
      new Request('http://localhost/api/nic-nac/join-team-roster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'remove', memberId: 'member-old' }),
      }),
    )
    const reorderResponse = await POST(
      new Request('http://localhost/api/nic-nac/join-team-roster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          memberIds: ['member-brittany', 'member-rayna'],
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
    await expect(removeResponse.json()).resolves.toEqual({
      ok: true,
      memberId: 'member-old',
    })
    await expect(reorderResponse.json()).resolves.toEqual({
      ok: true,
      updatedCount: 2,
    })
  })

  it('returns auth and service errors as API-safe responses', async () => {
    getPaidNicNacContextMock.mockRejectedValueOnce(new AuthError('nope'))

    const authResponse = await GET()

    expect(authResponse.status).toBe(401)
    await expect(authResponse.json()).resolves.toEqual({
      error: 'unauthenticated',
    })

    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-britt',
      supabase: { marker: 'supabase' },
    })
    upsertJoinTeamMemberMock.mockRejectedValueOnce(
      errors.INVALID_INPUT('displayName required', 'I need the team member name.'),
    )

    const serviceResponse = await POST(
      new Request('http://localhost/api/nic-nac/join-team-roster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', member: { displayName: '' } }),
      }),
    )

    expect(serviceResponse.status).toBe(400)
    await expect(serviceResponse.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'I need the team member name.',
    })
  })

  it('maps custom ServiceError statuses without leaking internal messages', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-britt',
      supabase: { marker: 'supabase' },
    })
    getJoinTeamRosterMock.mockRejectedValueOnce(
      new ServiceError({
        code: 'JOIN_TEAM_ROSTER_LOOKUP_FAILED',
        message: 'database exploded',
        userMessage: "I couldn't load the join team roster right now.",
        statusCode: 503,
      }),
    )

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: 'JOIN_TEAM_ROSTER_LOOKUP_FAILED',
      error: "I couldn't load the join team roster right now.",
    })
  })
})
