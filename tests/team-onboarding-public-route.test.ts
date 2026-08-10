import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

const getTeamOnboardingParticipantByTokenMock = vi.fn()
const recordTeamOnboardingProgressMock = vi.fn()
const sendTeamOnboardingMessageMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/team-onboarding', () => ({
  getTeamOnboardingParticipantByToken: (...args: unknown[]) =>
    getTeamOnboardingParticipantByTokenMock(...args),
  recordTeamOnboardingProgress: (...args: unknown[]) =>
    recordTeamOnboardingProgressMock(...args),
  sendTeamOnboardingMessage: (...args: unknown[]) =>
    sendTeamOnboardingMessageMock(...args),
}))

import { GET as GET_ACCESS, OPTIONS as OPTIONS_ACCESS } from '@/app/api/team-onboarding/access/[token]/route'
import { OPTIONS as OPTIONS_PROGRESS, POST as POST_PROGRESS } from '@/app/api/team-onboarding/access/[token]/progress/route'
import { OPTIONS as OPTIONS_MESSAGE, POST as POST_MESSAGE } from '@/app/api/team-onboarding/access/[token]/messages/route'

describe('/api/team-onboarding/access/[token]', () => {
  beforeEach(() => {
    getTeamOnboardingParticipantByTokenMock.mockReset()
    recordTeamOnboardingProgressMock.mockReset()
    sendTeamOnboardingMessageMock.mockReset()
    createAdminClientMock.mockReset()
    createAdminClientMock.mockReturnValue({ marker: 'admin' })
  })

  it('returns the personalized onboarding state for a valid private link', async () => {
    getTeamOnboardingParticipantByTokenMock.mockResolvedValueOnce({
      participant: {
        id: 'participant-1',
        displayName: 'Lindsey',
        status: 'started',
      },
      team: {
        ownerRepId: 'rep-britt',
        displayName: 'Brittany',
        businessName: 'Britt With Bling',
        teamName: 'Diamond Peak Society',
      },
      progress: [{ stepId: 'payquicker', status: 'done' }],
      messages: [{ id: 'message-1', senderType: 'team_lead', body: 'Welcome!' }],
    })

    const response = await GET_ACCESS(
      new Request('http://localhost/api/team-onboarding/access/token-123'),
      { params: Promise.resolve({ token: 'token-123' }) },
    )

    expect(getTeamOnboardingParticipantByTokenMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      'token-123',
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      participant: {
        id: 'participant-1',
        displayName: 'Lindsey',
        status: 'started',
      },
      team: {
        ownerRepId: 'rep-britt',
        displayName: 'Brittany',
        businessName: 'Britt With Bling',
        teamName: 'Diamond Peak Society',
      },
      progress: [{ stepId: 'payquicker', status: 'done' }],
      messages: [{ id: 'message-1', senderType: 'team_lead', body: 'Welcome!' }],
    })
  })

  it('allows the published Start Strong Site to call private-token APIs without opening them to other origins', async () => {
    const allowedRequest = new Request('http://localhost/api/team-onboarding/access/token-123', {
      headers: { origin: 'https://brittwithbling-start-strong.louis526569.chatgpt.site' },
    })
    const allowed = OPTIONS_ACCESS(allowedRequest)
    const progress = OPTIONS_PROGRESS(allowedRequest)
    const message = OPTIONS_MESSAGE(allowedRequest)
    const rejected = OPTIONS_ACCESS(new Request('http://localhost/api/team-onboarding/access/token-123', {
      headers: { origin: 'https://untrusted.example' },
    }))

    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('access-control-allow-origin')).toBe(
      'https://brittwithbling-start-strong.louis526569.chatgpt.site',
    )
    expect(progress.headers.get('access-control-allow-methods')).toContain('POST')
    expect(message.headers.get('access-control-allow-headers')).toBe('Content-Type')
    expect(rejected.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('records progress and participant messages without creating Sparkle Suite rep accounts', async () => {
    recordTeamOnboardingProgressMock.mockResolvedValueOnce({
      stepId: 'shipping',
      status: 'needs_help',
    })
    sendTeamOnboardingMessageMock.mockResolvedValueOnce({
      id: 'message-2',
      senderType: 'participant',
      body: 'Can Brittany check my shipping setup?',
    })

    const progressResponse = await POST_PROGRESS(
      new Request('http://localhost/api/team-onboarding/access/token-123/progress', {
        method: 'POST',
        body: JSON.stringify({ stepId: 'shipping', status: 'needs_help' }),
      }),
      { params: Promise.resolve({ token: 'token-123' }) },
    )
    const messageResponse = await POST_MESSAGE(
      new Request('http://localhost/api/team-onboarding/access/token-123/messages', {
        method: 'POST',
        body: JSON.stringify({ body: 'Can Brittany check my shipping setup?' }),
      }),
      { params: Promise.resolve({ token: 'token-123' }) },
    )

    expect(recordTeamOnboardingProgressMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      'token-123',
      expect.objectContaining({ stepId: 'shipping', status: 'needs_help' }),
    )
    expect(sendTeamOnboardingMessageMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      'token-123',
      expect.objectContaining({
        senderType: 'participant',
        body: 'Can Brittany check my shipping setup?',
      }),
    )
    expect(progressResponse.status).toBe(200)
    expect(messageResponse.status).toBe(200)
  })

  it('returns safe errors for invalid or archived invite links', async () => {
    getTeamOnboardingParticipantByTokenMock.mockRejectedValueOnce(
      errors.UNAUTHORIZED('invalid invite token'),
    )

    const response = await GET_ACCESS(
      new Request('http://localhost/api/team-onboarding/access/bad-token'),
      { params: Promise.resolve({ token: 'bad-token' }) },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: 'UNAUTHORIZED',
      error: 'This onboarding link is invalid or has been turned off. Ask your team leader for a fresh link.',
    })
  })
})
