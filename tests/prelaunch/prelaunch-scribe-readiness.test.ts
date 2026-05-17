import { describe, expect, it } from 'vitest'

import { buildScribeReadiness } from '@/lib/prelaunch/scribe-readiness'
import type {
  PrelaunchIntakeReviewSubmission,
  PrelaunchScribeTranscriptRunReviewSummary,
} from '@/lib/prelaunch/intake-review'
import type { PrelaunchScribeBrief } from '@/lib/prelaunch/scribe'

function makeScribeBrief(
  overrides: Partial<PrelaunchScribeBrief> = {},
): PrelaunchScribeBrief {
  return {
    status: 'draft_ready',
    sourceRunKey: 'scribe_hook:intake-1:drive-file-123',
    summary: 'Scribe draft is ready for operator review.',
    meeting: {
      title: 'Sparkle Suite discovery call - Jamie Hart',
      startedAt: '2026-05-13T16:00:00Z',
      speakerNames: ['Louis', 'Jamie'],
    },
    profileDraft: {
      intakeId: 'intake-1',
      ownerName: 'Jamie Hart',
      businessName: 'Jamie Hart Jewelry',
      confirmedDecisions: ['Keep the velvet direction.'],
      styleAndSetupSignals: ['Prefers plum and pearl.'],
      actionItems: ['Confirm launch timing.'],
      openQuestions: [],
    },
    operatorChecklist: [
      'Review all Scribe draft fields before copying them into onboarding or Builder work.',
    ],
    manualReviewWarnings: [],
    provenance: {
      meetingProvider: 'google_meet',
      transcriptionProvider: 'gemini',
      driveFileId: 'drive-file-123',
      driveFileUrl: null,
      meetUrl: null,
      transcriptCharCount: 248,
    },
    ...overrides,
  }
}

function makeTranscriptRun(
  overrides: Partial<PrelaunchScribeTranscriptRunReviewSummary> = {},
): PrelaunchScribeTranscriptRunReviewSummary {
  return {
    runKey: 'scribe_hook:intake-1:drive-file-123',
    status: 'queued',
    triggerSource: 'google_meet_gemini_transcript',
    model: 'gemini_transcript_hook_v1',
    summary: 'Gemini transcript captured; Scribe processing is queued.',
    errorMessage: null,
    createdAt: '2026-05-13T17:00:00Z',
    driveFileId: 'drive-file-123',
    driveFileUrl: null,
    meetUrl: null,
    meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
    transcriptCharCount: 248,
    speakerCount: 2,
    decisionCount: 1,
    actionItemCount: 1,
    clientPreferenceCount: 1,
    scribeStatus: 'queued',
    statusForScribe: 'ready_for_scribe',
    speakerNames: ['Louis', 'Jamie'],
    preview: null,
    signals: {
      decisions: ['Keep the velvet direction.'],
      clientPreferences: ['Prefers plum and pearl.'],
      actionItems: ['Confirm launch timing.'],
      openQuestions: [],
    },
    ...overrides,
  }
}

function makeSubmission(
  overrides: Partial<PrelaunchIntakeReviewSubmission> = {},
): PrelaunchIntakeReviewSubmission {
  return {
    id: 'intake-1',
    name: 'Jamie Hart',
    email: 'jamie@example.com',
    phone: '303-555-0123',
    businessName: 'Jamie Hart Jewelry',
    social: {
      tiktok: '@jamieh',
      instagram: '@jamiebling',
      facebook: null,
    },
    team: {
      name: 'Lindsey Team',
      size: '6-20',
    },
    primaryPlatform: 'tiktok',
    streamingFrequency: 'multiple_weekly',
    currentSetup: 'TikTok bio link and DMs',
    setupGoal: 'Cleaner show-night hub',
    deviceSetup: 'phone_only',
    brandVibe: 'polished and warm',
    colorPreferences: 'plum and pearl',
    specialRequests: 'Needs help with launch links',
    intakeStatus: 'submitted',
    prequalificationStatus: 'needs_review',
    fitFlags: ['phone_only_setup'],
    waitlistId: 'waitlist-1',
    scoutInputStatus: 'ready',
    handoffStatus: 'meeting_ready',
    latestScoutRun: null,
    latestScribeTranscriptRun: null,
    createdAt: '2026-05-09T18:00:00Z',
    updatedAt: '2026-05-09T18:00:00Z',
    ...overrides,
  }
}

describe('buildScribeReadiness', () => {
  it('asks for a transcript handoff when a meeting-ready intake has no transcript', () => {
    const readiness = buildScribeReadiness(makeSubmission())

    expect(readiness.status).toBe('missing')
    expect(readiness.label).toBe('Transcript handoff needed')
    expect(readiness.items).toContainEqual({
      label: 'Attach transcript hook output',
      detail:
        'This intake is meeting-ready, but no Meet/Gemini transcript run is visible yet.',
      status: 'missing',
    })
  })

  it('marks a queued transcript without a brief as needing Scribe processing review', () => {
    const readiness = buildScribeReadiness(
      makeSubmission({
        latestScribeTranscriptRun: makeTranscriptRun(),
      }),
    )

    expect(readiness.status).toBe('review')
    expect(readiness.label).toBe('Scribe processing review needed')
    expect(readiness.items).toContainEqual({
      label: 'Transcript captured',
      detail: 'drive-file-123 is ready_for_scribe with 2 speakers.',
      status: 'ready',
    })
    expect(readiness.items).toContainEqual({
      label: 'Scribe brief missing',
      detail:
        'Transcript signals are visible, but no follow-up brief is ready yet.',
      status: 'review',
    })
  })

  it('surfaces transcript open questions before a Scribe brief exists', () => {
    const readiness = buildScribeReadiness(
      makeSubmission({
        latestScribeTranscriptRun: makeTranscriptRun({
          signals: {
            decisions: [],
            clientPreferences: [],
            actionItems: [],
            openQuestions: ['Can we keep my current team name?'],
          },
        }),
      }),
    )

    expect(readiness.status).toBe('review')
    expect(readiness.items).toContainEqual({
      label: 'Transcript open questions need operator follow-up',
      detail: '1 open question is visible before Scribe brief generation.',
      status: 'review',
    })
  })

  it('keeps briefs with open questions or warnings incomplete for operator follow-up', () => {
    const readiness = buildScribeReadiness(
      makeSubmission({
        latestScribeTranscriptRun: makeTranscriptRun({
          scribeBrief: makeScribeBrief({
            profileDraft: {
              ...makeScribeBrief().profileDraft,
              openQuestions: ['Can we keep my current team name?'],
            },
            manualReviewWarnings: [
              'Transcript signals mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
            ],
          }),
        }),
      }),
    )

    expect(readiness.status).toBe('review')
    expect(readiness.label).toBe('Scribe follow-up incomplete')
    expect(readiness.items).toContainEqual({
      label: 'Open questions need operator follow-up',
      detail: '1 open question remains in the Scribe profile draft.',
      status: 'review',
    })
    expect(readiness.items).toContainEqual({
      label: 'Manual review warnings',
      detail: '1 Scribe guardrail warning needs operator review.',
      status: 'review',
    })
  })

  it('marks a clean brief ready while keeping follow-up operator-only', () => {
    const readiness = buildScribeReadiness(
      makeSubmission({
        latestScribeTranscriptRun: makeTranscriptRun({
          status: 'completed',
          scribeStatus: 'draft_ready',
          scribeBrief: makeScribeBrief(),
        }),
      }),
    )

    expect(readiness.status).toBe('ready')
    expect(readiness.label).toBe('Scribe follow-up review ready')
    expect(readiness.items).toContainEqual({
      label: 'Brief ready for operator review',
      detail:
        'Scribe draft is ready for operator review. Review before copying anything into onboarding or Builder work.',
      status: 'ready',
    })
    expect(readiness.guardrails).toEqual([
      'No autonomous profile writeback.',
      'No legal, payment, or launch approval.',
      'No live SignWell send.',
    ])
  })

  it('does not introduce live agreement or payment actions', () => {
    const readiness = buildScribeReadiness(
      makeSubmission({
        latestScribeTranscriptRun: makeTranscriptRun({
          scribeBrief: makeScribeBrief(),
        }),
      }),
    )
    const payload = JSON.stringify(readiness)

    expect(payload).not.toContain('Send agreement')
    expect(payload).not.toContain('Collect payment')
    expect(payload).not.toContain('Run live Scribe')
    expect(payload).not.toContain('Write profile automatically')
  })
})
