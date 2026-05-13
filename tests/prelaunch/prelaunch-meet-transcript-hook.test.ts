import { describe, expect, it, vi } from 'vitest'

import { recordPrelaunchMeetTranscript } from '@/lib/prelaunch/meet-transcript'

describe('prelaunch Meet transcript hook', () => {
  it('records a Gemini transcript as a Scribe-ready agent run', async () => {
    const transcriptText = [
      'Louis: Key decision: keep the homepage in the velvet concierge direction.',
      'Jamie: I prefer plum and pearl, and I need help with TikTok replay links.',
      'Louis: Action item: send the SignWell agreement after pricing is confirmed.',
      'Jamie: My team name is Lindsey Bomb Party.',
    ].join('\n')
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

    const result = await recordPrelaunchMeetTranscript({
      admin: { from: fromMock } as never,
      intakeId: 'intake-1',
      operatorRepId: 'rep-1',
      driveFileId: 'drive-file-123',
      driveFileUrl: 'https://docs.google.com/document/d/drive-file-123/edit',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
      meetingStartedAt: '2026-05-13T16:00:00Z',
      transcriptText,
      now: new Date('2026-05-13T17:00:00Z'),
    })

    expect(result.runKey).toBe('scribe_hook:intake-1:drive-file-123')
    expect(result.output.status).toBe('ready_for_scribe')
    expect(result.output.transcript.source.transcriptionProvider).toBe('gemini')
    expect(result.output.transcript.speakerNames).toEqual(['Louis', 'Jamie'])
    expect(result.output.signals.decisions).toContain(
      'keep the homepage in the velvet concierge direction.',
    )
    expect(result.output.signals.clientPreferences).toContain(
      'I prefer plum and pearl, and I need help with TikTok replay links.',
    )
    expect(result.output.signals.actionItems).toContain(
      'send the SignWell agreement after pricing is confirmed.',
    )
    expect(result.output.scribeBrief).toEqual(
      expect.objectContaining({
        status: 'draft_ready',
        sourceRunKey: 'scribe_hook:intake-1:drive-file-123',
        summary:
          'Scribe draft for Jamie Hart Jewelry is ready for operator review: 1 decision, 2 client preferences, 1 action item, and 0 open questions captured.',
        profileDraft: expect.objectContaining({
          intakeId: 'intake-1',
          ownerName: 'Jamie Hart',
          businessName: 'Jamie Hart Jewelry',
          confirmedDecisions: [
            'keep the homepage in the velvet concierge direction.',
          ],
          styleAndSetupSignals: [
            'I prefer plum and pearl, and I need help with TikTok replay links.',
            'My team name is Lindsey Bomb Party.',
          ],
          actionItems: [
            'send the SignWell agreement after pricing is confirmed.',
          ],
        }),
        operatorChecklist: expect.arrayContaining([
          'Review all Scribe draft fields before copying them into onboarding or Builder work.',
          'Do not treat this draft as legal, payment, or launch approval.',
        ]),
        manualReviewWarnings: [
          'Transcript action items mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
        ],
      }),
    )
    expect(agentRunsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        run_key: 'scribe_hook:intake-1:drive-file-123',
        agent_name: 'Scribe',
        agent_kind: 'post_meeting_transcript_hook',
        subject_type: 'prelaunch_intake',
        subject_id: 'intake-1',
        intake_submission_id: 'intake-1',
        waitlist_id: 'waitlist-1',
        rep_id: 'rep-1',
        status: 'queued',
        trigger_source: 'google_meet_gemini_transcript',
        model: 'gemini_transcript_hook_v1',
        summary:
          'Gemini transcript captured for Jamie Hart Jewelry; Scribe processing is queued.',
        input: expect.objectContaining({
          transcript: expect.objectContaining({
            text: transcriptText,
          }),
        }),
        output: result.output,
        metadata: expect.objectContaining({
          source: 'google_meet_gemini_transcript',
          drive_file_id: 'drive-file-123',
          transcript_char_count: transcriptText.length,
          speaker_count: 2,
          scribe_status: 'queued',
        }),
        started_at: '2026-05-13T17:00:00.000Z',
        finished_at: '2026-05-13T17:00:00.000Z',
      }),
      { onConflict: 'run_key' },
    )
    expect(intakeUpdateMock).toHaveBeenCalledWith({
      handoff_status: 'meeting_ready',
    })
    expect(intakeUpdateEqMock).toHaveBeenCalledWith('id', 'intake-1')
  })

  it('rejects empty transcript text before writing a run', async () => {
    const fromMock = vi.fn()

    await expect(
      recordPrelaunchMeetTranscript({
        admin: { from: fromMock } as never,
        intakeId: 'intake-1',
        driveFileId: 'drive-file-123',
        transcriptText: '   ',
      }),
    ).rejects.toMatchObject({
      code: 'TRANSCRIPT_REQUIRED',
      statusCode: 400,
    })
    expect(fromMock).not.toHaveBeenCalled()
  })
})
