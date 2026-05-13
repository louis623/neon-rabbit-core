import { describe, expect, it, vi } from 'vitest'

import { importPrelaunchMeetTranscriptFromGoogleDoc } from '@/lib/prelaunch/meet-transcript'

function buildAdminMock() {
  const intakeSingleMock = vi.fn().mockResolvedValueOnce({
    data: {
      id: 'intake-1',
      full_name: 'Jamie Hart',
      business_name: 'Jamie Hart Jewelry',
      waitlist_id: 'waitlist-1',
    },
    error: null,
  })
  const intakeEqMock = vi.fn(() => ({ single: intakeSingleMock }))
  const intakeSelectMock = vi.fn(() => ({ eq: intakeEqMock }))
  const intakeUpdateEqMock = vi.fn().mockResolvedValueOnce({ error: null })
  const intakeUpdateMock = vi.fn(() => ({ eq: intakeUpdateEqMock }))
  const agentRunsUpsertMock = vi.fn().mockResolvedValueOnce({ error: null })
  const fromMock = vi.fn((table: string) => {
    if (table === 'agent_runs') {
      return { upsert: agentRunsUpsertMock }
    }

    return {
      select: intakeSelectMock,
      update: intakeUpdateMock,
    }
  })

  return {
    admin: { from: fromMock } as never,
    agentRunsUpsertMock,
  }
}

describe('prelaunch Meet transcript Google Doc import', () => {
  it('exports a shareable Google Doc transcript and records it through the hook', async () => {
    const { admin, agentRunsUpsertMock } = buildAdminMock()
    const transcriptText = [
      'Louis: Key decision: keep the velvet concierge direction.',
      'Jamie: I prefer plum and pearl.',
      'Louis: Action item: send the SignWell agreement.',
    ].join('\n')
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
      text: async () => transcriptText,
    } satisfies Partial<Response>)

    const result = await importPrelaunchMeetTranscriptFromGoogleDoc({
      admin,
      fetchImpl: fetchMock as typeof fetch,
      intakeId: 'intake-1',
      operatorRepId: 'rep-1',
      driveFileUrl:
        'https://docs.google.com/document/d/drive-file-123/edit?tab=t.0',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
      now: new Date('2026-05-13T18:00:00Z'),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://docs.google.com/document/d/drive-file-123/export?format=txt',
      expect.objectContaining({
        headers: { accept: 'text/plain' },
        redirect: 'follow',
      }),
    )
    expect(result.runKey).toBe('scribe_hook:intake-1:drive-file-123')
    expect(result.driveFileId).toBe('drive-file-123')
    expect(result.output.transcript.preview).toContain('Key decision')
    expect(agentRunsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        run_key: 'scribe_hook:intake-1:drive-file-123',
        input: expect.objectContaining({
          transcript: expect.objectContaining({
            text: transcriptText,
          }),
        }),
        metadata: expect.objectContaining({
          source: 'google_meet_gemini_transcript',
          drive_file_id: 'drive-file-123',
          drive_file_url:
            'https://docs.google.com/document/d/drive-file-123/edit?tab=t.0',
        }),
      }),
      { onConflict: 'run_key' },
    )
  })

  it('rejects non-Google-Docs transcript URLs without fetching', async () => {
    const fetchMock = vi.fn()

    await expect(
      importPrelaunchMeetTranscriptFromGoogleDoc({
        admin: { from: vi.fn() } as never,
        fetchImpl: fetchMock as typeof fetch,
        intakeId: 'intake-1',
        driveFileUrl: 'https://example.com/transcript.txt',
      }),
    ).rejects.toMatchObject({
      code: 'GOOGLE_DOC_URL_REQUIRED',
      statusCode: 400,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a clear auth/sharing error when the Google Doc export is inaccessible', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<html>Sign in required</html>',
    } satisfies Partial<Response>)

    await expect(
      importPrelaunchMeetTranscriptFromGoogleDoc({
        admin: { from: vi.fn() } as never,
        fetchImpl: fetchMock as typeof fetch,
        intakeId: 'intake-1',
        driveFileUrl: 'https://docs.google.com/document/d/private-doc/edit',
      }),
    ).rejects.toMatchObject({
      code: 'GOOGLE_DOC_TRANSCRIPT_NOT_ACCESSIBLE',
      statusCode: 424,
    })
  })

  it('rejects Google Doc login HTML instead of storing it as transcript text', async () => {
    const fromMock = vi.fn()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '<html><title>Sign in - Google Accounts</title></html>',
    } satisfies Partial<Response>)

    await expect(
      importPrelaunchMeetTranscriptFromGoogleDoc({
        admin: { from: fromMock } as never,
        fetchImpl: fetchMock as typeof fetch,
        intakeId: 'intake-1',
        driveFileUrl: 'https://docs.google.com/document/d/private-doc/edit',
      }),
    ).rejects.toMatchObject({
      code: 'GOOGLE_DOC_TRANSCRIPT_HTML_RESPONSE',
      statusCode: 424,
    })
    expect(fromMock).not.toHaveBeenCalled()
  })
})
