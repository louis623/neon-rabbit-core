import { describe, expect, it } from 'vitest'

import { buildPrelaunchOperatorHandoffBrief } from '@/lib/prelaunch/operator-handoff'
import type {
  PrelaunchGateReadinessItem,
} from '@/lib/prelaunch/gate-readiness'
import type {
  PrelaunchIntakeReviewSubmission,
  PrelaunchScribeTranscriptRunReviewSummary,
} from '@/lib/prelaunch/intake-review'
import type { PrelaunchScribeBrief } from '@/lib/prelaunch/scribe'

const gateReadiness: PrelaunchGateReadinessItem[] = [
  {
    key: 'agreement',
    label: 'Agreement gate',
    status: 'blocked',
    displayStatus: 'SignWell not configured',
    detail: 'Agreement sending is disabled until SignWell config is complete.',
  },
  {
    key: 'start_work_fee',
    label: 'Start work fee',
    status: 'blocked',
    displayStatus: 'Stripe price missing',
    detail: 'Checkout is disabled until the start-work price is configured.',
  },
]

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
      confirmedDecisions: [],
      styleAndSetupSignals: [],
      actionItems: [],
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
      decisions: [],
      clientPreferences: [],
      actionItems: [],
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
    handoffStatus: 'scout_ready',
    latestScoutRun: null,
    latestScribeTranscriptRun: null,
    createdAt: '2026-05-09T18:00:00Z',
    updatedAt: '2026-05-09T18:00:00Z',
    ...overrides,
  }
}

describe('buildPrelaunchOperatorHandoffBrief', () => {
  it('summarizes blocked fit review handoffs with contact and gate context', () => {
    const brief = buildPrelaunchOperatorHandoffBrief({
      submission: makeSubmission(),
      gateReadiness,
      nextReviewBullets: [
        'Resolve phone_only_setup before any launch handoff.',
      ],
    })

    expect(brief.title).toBe('Operator handoff brief')
    expect(brief.status).toBe('Blocked fit review')
    expect(brief.lines).toContain('Owner/business: Jamie Hart - Jamie Hart Jewelry')
    expect(brief.lines).toContain('Contact: jamie@example.com - 303-555-0123')
    expect(brief.lines).toContain(
      'Current status: needs review / scout ready / waitlist linked',
    )
    expect(brief.lines).toContain('Scout: not run yet')
    expect(brief.lines).toContain(
      'Gate reminder: Agreement gate - SignWell not configured; Start work fee - Stripe price missing',
    )
    expect(brief.nextReviewBullets).toEqual([
      'Resolve phone_only_setup before any launch handoff.',
    ])
  })

  it('captures saved Scout and queued Scribe states without inventing live actions', () => {
    const brief = buildPrelaunchOperatorHandoffBrief({
      submission: makeSubmission({
        prequalificationStatus: 'qualified',
        fitFlags: [],
        scoutInputStatus: 'generated',
        handoffStatus: 'meeting_ready',
        latestScoutRun: {
          runKey: 'scout:intake-1:2026-05-09T19:30:00.000Z',
          status: 'completed',
          triggerSource: 'operator_review',
          model: 'deterministic_scout_v1',
          summary: 'Scout captured public evidence.',
          errorMessage: null,
          createdAt: '2026-05-09T19:30:00Z',
          synthesisStatus: 'deterministic_fallback',
          synthesisConfidence: 'medium',
          capturedEvidenceCount: 2,
        },
        latestScribeTranscriptRun: makeTranscriptRun(),
      }),
      gateReadiness,
      nextReviewBullets: ['Confirm transcript signals before copying notes.'],
    })

    expect(brief.status).toBe('Operator review')
    expect(brief.lines).toContain('Scout: completed - Scout captured public evidence.')
    expect(brief.lines).toContain(
      'Scribe: queued / ready for scribe - Gemini transcript captured; Scribe processing is queued.',
    )
    expect(JSON.stringify(brief)).not.toContain('Send agreement')
    expect(JSON.stringify(brief)).not.toContain('Collect payment')
  })

  it('includes Scribe brief warnings and explicit read-only guardrails', () => {
    const brief = buildPrelaunchOperatorHandoffBrief({
      submission: makeSubmission({
        latestScribeTranscriptRun: makeTranscriptRun({
          scribeBrief: makeScribeBrief({
            manualReviewWarnings: [
              'Transcript signals mention legal, agreement, payment, pricing, or launch-gate work.',
            ],
          }),
        }),
      }),
      gateReadiness,
    })

    expect(brief.lines).toContain(
      'Scribe: queued / ready for scribe - Scribe draft is ready for operator review.',
    )
    expect(brief.nextReviewBullets).toContain(
      'Review Scribe warning: Transcript signals mention legal, agreement, payment, pricing, or launch-gate work.',
    )
    expect(brief.guardrails).toEqual([
      'No live SMS send.',
      'No live SignWell send.',
      'No payment collection.',
      'No kit fulfillment approval.',
    ])
  })
})
