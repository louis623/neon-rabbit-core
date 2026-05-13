import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ServiceError } from '@/lib/services/errors'

const getAuthenticatedOperatorMock = vi.fn()
const recordPrelaunchMeetTranscriptMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getAuthenticatedOperator: (...args: unknown[]) =>
    getAuthenticatedOperatorMock(...args),
}))

vi.mock('@/lib/prelaunch/meet-transcript', () => ({
  recordPrelaunchMeetTranscript: (...args: unknown[]) =>
    recordPrelaunchMeetTranscriptMock(...args),
}))

import { POST } from '@/app/api/prelaunch/meet-transcript/route'

describe('POST /api/prelaunch/meet-transcript', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    recordPrelaunchMeetTranscriptMock.mockReset()
  })

  it('records a Google Meet Gemini transcript for an authenticated operator', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    recordPrelaunchMeetTranscriptMock.mockResolvedValueOnce({
      runKey: 'scribe_hook:intake-1:drive-file-123',
      output: {
        status: 'ready_for_scribe',
      },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/meet-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intakeId: 'intake-1',
          driveFileId: 'drive-file-123',
          driveFileUrl: 'https://docs.google.com/document/d/drive-file-123/edit',
          meetUrl: 'https://meet.google.com/abc-defg-hij',
          meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
          meetingStartedAt: '2026-05-13T16:00:00Z',
          transcriptText: 'Louis: Key decision: keep the velvet direction.',
        }),
      }),
    )

    expect(recordPrelaunchMeetTranscriptMock).toHaveBeenCalledWith({
      intakeId: 'intake-1',
      operatorRepId: 'rep-1',
      driveFileId: 'drive-file-123',
      driveFileUrl: 'https://docs.google.com/document/d/drive-file-123/edit',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
      meetingStartedAt: '2026-05-13T16:00:00Z',
      transcriptText: 'Louis: Key decision: keep the velvet direction.',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      runKey: 'scribe_hook:intake-1:drive-file-123',
      output: {
        status: 'ready_for_scribe',
      },
    })
  })

  it('rejects missing transcript payload fields', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/meet-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intakeId: 'intake-1' }),
      }),
    )

    expect(recordPrelaunchMeetTranscriptMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'driveFileId and transcriptText are required.',
    })
  })

  it('returns 403 for non-operator reps', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('nope'),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/meet-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intakeId: 'intake-1',
          driveFileId: 'drive-file-123',
          transcriptText: 'Louis: hello',
        }),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })

  it('returns 401 for unauthenticated requests without recording a transcript', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/meet-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intakeId: 'intake-1',
          driveFileId: 'drive-file-123',
          transcriptText: 'Louis: hello',
        }),
      }),
    )

    expect(recordPrelaunchMeetTranscriptMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })

  it('preserves service error codes and user-facing messages', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    recordPrelaunchMeetTranscriptMock.mockRejectedValueOnce(
      new ServiceError({
        code: 'TRANSCRIPT_NOT_USABLE',
        message: 'transcript text too short',
        userMessage: 'That transcript is too short to review.',
        statusCode: 422,
      }),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/meet-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intakeId: 'intake-1',
          driveFileId: 'drive-file-123',
          transcriptText: 'Louis: hello',
        }),
      }),
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      code: 'TRANSCRIPT_NOT_USABLE',
      error: 'That transcript is too short to review.',
    })
  })
})
