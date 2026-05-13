import { describe, expect, it } from 'vitest'

import { buildPrelaunchScribeBrief } from '@/lib/prelaunch/scribe'
import type { PrelaunchMeetTranscriptHookOutput } from '@/lib/prelaunch/meet-transcript'

const transcriptHookOutput: PrelaunchMeetTranscriptHookOutput = {
  status: 'ready_for_scribe',
  transcript: {
    source: {
      meetingProvider: 'google_meet',
      transcriptionProvider: 'gemini',
      driveFileId: 'drive-file-123',
      driveFileUrl: 'https://docs.google.com/document/d/drive-file-123/edit',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
      meetingStartedAt: '2026-05-13T16:00:00Z',
    },
    charCount: 680,
    preview:
      'Louis: Key decision: keep the velvet direction.\nJamie: I prefer plum and pearl.',
    speakerNames: ['Louis', 'Jamie'],
  },
  signals: {
    decisions: ['keep the velvet direction.'],
    clientPreferences: [
      'I prefer plum and pearl.',
      'I need help with TikTok replay links.',
    ],
    actionItems: ['send the SignWell agreement after pricing is confirmed.'],
    openQuestions: ['Can we keep my current team name?'],
  },
  nextAgent: {
    name: 'Scribe',
    status: 'queued',
    requiredManualChecks: [
      'Confirm the Drive transcript belongs to this intake before running Scribe.',
      'Run Scribe transcript interpretation before treating profile fields as final.',
    ],
  },
}

describe('prelaunch Scribe', () => {
  it('builds an operator-review brief from a queued transcript hook', () => {
    expect(
      buildPrelaunchScribeBrief({
        intake: {
          id: 'intake-1',
          name: 'Jamie Hart',
          businessName: 'Jamie Hart Jewelry',
        },
        transcriptRunKey: 'scribe_hook:intake-1:drive-file-123',
        transcriptHookOutput,
      }),
    ).toEqual({
      status: 'draft_ready',
      sourceRunKey: 'scribe_hook:intake-1:drive-file-123',
      summary:
        'Scribe draft for Jamie Hart Jewelry is ready for operator review: 1 decision, 2 client preferences, 1 action item, and 1 open question captured.',
      meeting: {
        title: 'Sparkle Suite discovery call - Jamie Hart',
        startedAt: '2026-05-13T16:00:00Z',
        speakerNames: ['Louis', 'Jamie'],
      },
      profileDraft: {
        intakeId: 'intake-1',
        ownerName: 'Jamie Hart',
        businessName: 'Jamie Hart Jewelry',
        confirmedDecisions: ['keep the velvet direction.'],
        styleAndSetupSignals: [
          'I prefer plum and pearl.',
          'I need help with TikTok replay links.',
        ],
        actionItems: ['send the SignWell agreement after pricing is confirmed.'],
        openQuestions: ['Can we keep my current team name?'],
      },
      operatorChecklist: [
        'Confirm the Drive transcript belongs to this intake before running Scribe.',
        'Run Scribe transcript interpretation before treating profile fields as final.',
        'Review all Scribe draft fields before copying them into onboarding or Builder work.',
        'Do not treat this draft as legal, payment, or launch approval.',
      ],
      manualReviewWarnings: [
        'Transcript signals mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
      ],
      provenance: {
        meetingProvider: 'google_meet',
        transcriptionProvider: 'gemini',
        driveFileId: 'drive-file-123',
        driveFileUrl: 'https://docs.google.com/document/d/drive-file-123/edit',
        meetUrl: 'https://meet.google.com/abc-defg-hij',
        transcriptCharCount: 680,
      },
    })
  })

  it('keeps empty transcript signals as reviewable empty arrays', () => {
    const brief = buildPrelaunchScribeBrief({
      intake: {
        id: 'intake-2',
        name: 'Morgan Lee',
        businessName: 'Morgan Lee Jewelry',
      },
      transcriptRunKey: 'scribe_hook:intake-2:drive-file-456',
      transcriptHookOutput: {
        ...transcriptHookOutput,
        transcript: {
          ...transcriptHookOutput.transcript,
          speakerNames: [],
        },
        signals: {
          decisions: [],
          clientPreferences: [],
          actionItems: [],
          openQuestions: [],
        },
      },
    })

    expect(brief.summary).toBe(
      'Scribe draft for Morgan Lee Jewelry is ready for operator review: 0 decisions, 0 client preferences, 0 action items, and 0 open questions captured.',
    )
    expect(brief.profileDraft.confirmedDecisions).toEqual([])
    expect(brief.profileDraft.styleAndSetupSignals).toEqual([])
    expect(brief.profileDraft.actionItems).toEqual([])
    expect(brief.profileDraft.openQuestions).toEqual([])
    expect(brief.operatorChecklist).toContain(
      'Review all Scribe draft fields before copying them into onboarding or Builder work.',
    )
    expect(brief.manualReviewWarnings).toEqual([])
  })

  it('flags gate-sensitive language outside action items', () => {
    const brief = buildPrelaunchScribeBrief({
      intake: {
        id: 'intake-3',
        name: 'Riley Stone',
        businessName: 'Riley Stone Jewelry',
      },
      transcriptRunKey: 'scribe_hook:intake-3:drive-file-789',
      transcriptHookOutput: {
        ...transcriptHookOutput,
        signals: {
          decisions: ['launch approval depends on final review.'],
          clientPreferences: ['pricing should wait until Louis confirms the package.'],
          actionItems: ['send style notes to Builder.'],
          openQuestions: ['Do we need attorney review before the agreement?'],
        },
      },
    })

    expect(brief.manualReviewWarnings).toEqual([
      'Transcript signals mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
    ])
  })
})
