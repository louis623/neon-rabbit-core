import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PrelaunchIntakeReviewPageContent } from '@/app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent'
import { PrelaunchScoutRecommendationResult } from '@/app/internal/prelaunch/intake/_components/PrelaunchScoutRunButton'
import type { PrelaunchScoutOutput } from '@/lib/prelaunch/scout'
import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

const submission: PrelaunchIntakeReviewSubmission = {
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
  createdAt: '2026-05-09T18:00:00Z',
  updatedAt: '2026-05-09T18:00:00Z',
}

const gateEnvKeys = [
  'NEXT_PUBLIC_APP_URL',
  'SIGNWELL_API_KEY',
  'SIGNWELL_API_BASE_URL',
  'SIGNWELL_TEMPLATE_ID',
  'STRIPE_PRICE_START_WORK_FEE',
  'STRIPE_PRICE_LAUNCH_FEE',
] as const

function snapshotGateEnv() {
  return Object.fromEntries(
    gateEnvKeys.map((key) => [key, process.env[key]]),
  ) as Record<(typeof gateEnvKeys)[number], string | undefined>
}

function restoreGateEnv(snapshot: ReturnType<typeof snapshotGateEnv>) {
  for (const key of gateEnvKeys) {
    const value = snapshot[key]

    if (value == null) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

describe('PrelaunchIntakeReviewPageContent', () => {
  it('renders operator summary counts and intake cards', () => {
    const originalEnv = snapshotGateEnv()
    delete process.env.SIGNWELL_API_KEY
    delete process.env.SIGNWELL_API_BASE_URL
    delete process.env.SIGNWELL_TEMPLATE_ID
    delete process.env.STRIPE_PRICE_START_WORK_FEE
    delete process.env.STRIPE_PRICE_LAUNCH_FEE
    delete process.env.NEXT_PUBLIC_APP_URL

    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          {
            ...submission,
            handoffStatus: 'meeting_ready',
          },
          submission,
          {
            ...submission,
            id: 'intake-2',
            email: 'morgan@example.com',
            prequalificationStatus: 'qualified',
            fitFlags: [],
            waitlistId: null,
          },
        ],
      }),
    )

    restoreGateEnv(originalEnv)

    expect(html).toContain('Prelaunch intake review')
    expect(html).toContain('3 total')
    expect(html).toContain('2 needs review')
    expect(html).toContain('1 qualified')
    expect(html).toContain('3 Scout ready')
    expect(html).toContain('1 meeting ready')
    expect(html).toContain('Meeting ready')
    expect(html).toContain('Jamie Hart Jewelry')
    expect(html).toContain('jamie@example.com')
    expect(html).toContain('phone_only_setup')
    expect(html).toContain('Waitlist linked')
    expect(html).toContain('Gate readiness')
    expect(html).toContain('Agreement gate')
    expect(html).toContain('SignWell not configured')
    expect(html).toContain('Start work fee')
    expect(html).toContain('Stripe price missing')
    expect(html).toContain('Launch fee')
    expect(html).toContain('No live send or payment action is enabled here yet.')
    expect(html).not.toContain('Send agreement')
    expect(html).not.toContain('Collect payment')
    expect(html).toContain('Approved QR flyer')
    expect(html).toContain('Open approved flyer')
    expect(html).toContain(
      '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png',
    )
    expect(html).toContain('Canonical waitlist target')
    expect(html).toContain('prelaunch?utm_source=sparkle_suite_qr')
    expect(html).not.toContain('sparkle-suite-qr-flyer-example-one')
    expect(html).toContain('Run Scout')
    expect(html).toContain('&quot;intakeId&quot;: &quot;intake-1&quot;')
  })

  it('renders a clear empty state when there are no submissions yet', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, { submissions: [] }),
    )

    expect(html).toContain('No intake submissions yet')
    expect(html).toContain('New /prelaunch intake forms will appear here')
  })

  it('renders consolidated next operator steps for blocked intake handoffs', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          {
            ...submission,
            waitlistId: null,
            latestScoutRun: {
              runKey: 'scout:intake-1:2026-05-09T19:30:00.000Z',
              status: 'failed',
              triggerSource: 'intake_submission',
              model: 'deterministic_scout_v1',
              summary: null,
              errorMessage: 'Public evidence fetch timed out.',
              createdAt: '2026-05-09T19:30:00Z',
              synthesisStatus: null,
              synthesisConfidence: null,
              capturedEvidenceCount: null,
            },
            latestScribeTranscriptRun: {
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
              meetingTitle: null,
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
                actionItems: ['send the SignWell agreement.'],
                openQuestions: [],
              },
              scribeBrief: {
                status: 'draft_ready',
                sourceRunKey: 'scribe_hook:intake-1:drive-file-123',
                summary: 'Scribe draft is ready for operator review.',
                meeting: {
                  title: null,
                  startedAt: null,
                  speakerNames: ['Louis', 'Jamie'],
                },
                profileDraft: {
                  intakeId: 'intake-1',
                  ownerName: 'Jamie Hart',
                  businessName: 'Jamie Hart Jewelry',
                  confirmedDecisions: [],
                  styleAndSetupSignals: [],
                  actionItems: ['send the SignWell agreement.'],
                  openQuestions: [],
                },
                operatorChecklist: [
                  'Review all Scribe draft fields before copying them into onboarding or Builder work.',
                ],
                manualReviewWarnings: [
                  'Transcript action items mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
                ],
                provenance: {
                  meetingProvider: 'google_meet',
                  transcriptionProvider: 'gemini',
                  driveFileId: 'drive-file-123',
                  driveFileUrl: null,
                  meetUrl: null,
                  transcriptCharCount: 248,
                },
              },
            },
          },
        ],
      }),
    )

    expect(html).toContain('Next operator steps')
    expect(html).toContain('Handoff blocked')
    expect(html).toContain('Resolve fit review')
    expect(html).toContain('phone_only_setup')
    expect(html).toContain('Link waitlist lead')
    expect(html).toContain('Review failed Scout run')
    expect(html).toContain('Public evidence fetch timed out.')
    expect(html).toContain('Review Scribe guardrails')
    expect(html).toContain('Keep launch gates disabled')
    expect(html).not.toContain('Send agreement')
    expect(html).not.toContain('Collect payment')
  })

  it('renders photography kit prep as operator-only readiness guidance', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [submission],
      }),
    )

    expect(html).toContain('Photography kit prep')
    expect(html).toContain('DUCLUS lightbox or equivalent white setup')
    expect(html).toContain('Use the rep phone or existing camera first')
    expect(html).toContain('Request sample jewelry photo')
    expect(html).toContain('Run Nic-Nac screening')
    expect(html).toContain(
      'Coach framing, distance, lighting, and white background before changing hardware.',
    )
    expect(html).toContain('Manual exception')
    expect(html).not.toContain('Order kit')
    expect(html).not.toContain('Ship kit')
    expect(html).not.toContain('Collect kit fee')
  })

  it('renders camera quality prep without live fulfillment actions', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [submission],
      }),
    )

    expect(html).toContain('Camera quality prep')
    expect(html).toContain('Sample photo still needs Nic-Nac screening')
    expect(html).toContain('Confirm two-device workflow')
    expect(html).toContain('Do not treat this as kit approval')
    expect(html).not.toContain('Send SMS')
    expect(html).not.toContain('Order camera')
    expect(html).not.toContain('Approve shipment')
    expect(html).not.toContain('Collect kit fee')
  })

  it('renders the latest saved Scout run on each intake card', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          {
            ...submission,
            scoutInputStatus: 'generated',
            latestScoutRun: {
              runKey: 'scout:intake-1:2026-05-09T19:30:00.000Z',
              status: 'completed',
              triggerSource: 'intake_submission',
              model: 'deterministic_scout_v1',
              summary:
                'Scout captured public evidence and suggested a call angle.',
              errorMessage: null,
              createdAt: '2026-05-09T19:30:00Z',
              synthesisStatus: 'deterministic_fallback',
              synthesisConfidence: 'high',
              capturedEvidenceCount: 2,
              reusedLessonCount: 1,
              reusedLessonStatus: 'available',
              researchSynthesis: {
                status: 'deterministic_fallback',
                discoveryAngle:
                  'The public path is ready for a focused discovery call.',
                summaryBullets: ['TikTok points directly to live shopping.'],
                followUpQuestions: [
                  'Which live-shopping action should Scout prioritize?',
                ],
                evidenceBackedObservations: [
                  'Public profile and customer link both mention live shopping.',
                ],
                manualVerificationNeeded: [
                  'Confirm the live link is still current before outreach.',
                ],
                contradictions: [
                  'Instagram profile still points to an older link.',
                ],
                confidence: 'high',
              },
              publicFunnel: {
                shape: 'direct_site_first',
                summary:
                  'Public profiles point customers straight to the live shopping page.',
                primaryLinks: ['https://jamiehartjewelry.com/live'],
                concerns: [
                  'Confirm the live link still matches the current show-night flow.',
                ],
              },
              reusedLessons: [
                {
                  sourceRunKey: 'scout:tiktok-intake:2026-05-09T18:30:00.000Z',
                  lesson:
                    'TikTok phone-only reps need a two-device plan before launch copy.',
                  similarityReasons: [
                    'same primary platform',
                    'same device setup',
                  ],
                },
              ],
              evidenceSourceStatuses: [
                {
                  label: 'TikTok',
                  status: 'captured',
                  url: 'https://www.tiktok.com/@jamieh',
                },
                {
                  label: 'Instagram',
                  status: 'metadata_missing',
                  url: 'https://www.instagram.com/jamiebling/',
                },
              ],
            },
          },
        ],
      }),
    )

    expect(html).toContain('Latest saved Scout run')
    expect(html).toContain('completed')
    expect(html).toContain('intake submission')
    expect(html).toContain('deterministic scout v1')
    expect(html).toContain(
      'Scout captured public evidence and suggested a call angle.',
    )
    expect(html).toContain('2 captured evidence items')
    expect(html).toContain('deterministic fallback synthesis')
    expect(html).toContain('high confidence')
    expect(html).toContain('1 reused lesson')
    expect(html).toContain('lesson reuse available')
    expect(html).toContain('Saved synthesis')
    expect(html).toContain(
      'The public path is ready for a focused discovery call.',
    )
    expect(html).toContain('What stands out')
    expect(html).toContain('TikTok points directly to live shopping.')
    expect(html).toContain('Grounded observations')
    expect(html).toContain(
      'Public profile and customer link both mention live shopping.',
    )
    expect(html).toContain('Manual verification needed')
    expect(html).toContain(
      'Confirm the live link is still current before outreach.',
    )
    expect(html).toContain('Contradictions or tensions')
    expect(html).toContain('Instagram profile still points to an older link.')
    expect(html).toContain('Follow-up questions')
    expect(html).toContain(
      'Which live-shopping action should Scout prioritize?',
    )
    expect(html).toContain('Saved public funnel')
    expect(html).toContain('direct site first')
    expect(html).toContain(
      'Public profiles point customers straight to the live shopping page.',
    )
    expect(html).toContain('https://jamiehartjewelry.com/live')
    expect(html).toContain(
      'Confirm the live link still matches the current show-night flow.',
    )
    expect(html).toContain('Saved reused lessons')
    expect(html).toContain(
      'TikTok phone-only reps need a two-device plan before launch copy.',
    )
    expect(html).toContain('Why Scout reused this')
    expect(html).toContain('same primary platform')
    expect(html).toContain('same device setup')
    expect(html).toContain('scout:tiktok-intake:2026-05-09T18:30:00.000Z')
    expect(html).toContain('TikTok: captured')
    expect(html).toContain('Instagram: metadata missing')
    expect(html).toContain('scout:intake-1:2026-05-09T19:30:00.000Z')
  })

  it('renders saved Scout source checks on the latest run card', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          {
            ...submission,
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
              capturedEvidenceCount: 1,
              evidenceSourceStatuses: [
                {
                  label: 'TikTok',
                  status: 'captured',
                  url: 'https://www.tiktok.com/@jamieh',
                },
                {
                  label: 'Instagram',
                  status: 'metadata_missing',
                  url: 'https://www.instagram.com/jamiebling/',
                },
              ],
            },
          },
        ],
      }),
    )

    expect(html).toContain('Saved source checks')
    expect(html).toContain('TikTok: captured')
    expect(html).toContain('Instagram: metadata missing')
    expect(html).toContain('https://www.tiktok.com/@jamieh')
    expect(html).toContain('https://www.instagram.com/jamiebling/')
  })

  it('renders the latest Meet transcript hook on each intake card', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          {
            ...submission,
            latestScribeTranscriptRun: {
              runKey: 'scribe_hook:intake-1:drive-file-123',
              status: 'queued',
              triggerSource: 'google_meet_gemini_transcript',
              model: 'gemini_transcript_hook_v1',
              summary:
                'Gemini transcript captured for Jamie Hart Jewelry; Scribe processing is queued.',
              errorMessage: null,
              createdAt: '2026-05-13T17:00:00Z',
              driveFileId: 'drive-file-123',
              driveFileUrl:
                'https://docs.google.com/document/d/drive-file-123/edit',
              meetUrl: 'https://meet.google.com/abc-defg-hij',
              meetingTitle: 'Sparkle Suite discovery call - Jamie Hart',
              transcriptCharCount: 248,
              speakerCount: 2,
              decisionCount: 1,
              actionItemCount: 1,
              clientPreferenceCount: 2,
              scribeStatus: 'queued',
              statusForScribe: 'ready_for_scribe',
              speakerNames: ['Louis', 'Jamie'],
              preview: 'Louis: Key decision: keep the velvet direction.',
              signals: {
                decisions: ['keep the velvet direction.'],
                clientPreferences: ['I prefer plum and pearl.'],
                actionItems: ['send the SignWell agreement.'],
                openQuestions: ['Can we keep my current team name?'],
              },
              scribeBrief: {
                status: 'draft_ready',
                sourceRunKey: 'scribe_hook:intake-1:drive-file-123',
                summary:
                  'Scribe draft for Jamie Hart Jewelry is ready for operator review: 1 decision, 1 client preference, 1 action item, and 1 open question captured.',
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
                  styleAndSetupSignals: ['I prefer plum and pearl.'],
                  actionItems: ['send the SignWell agreement.'],
                  openQuestions: ['Can we keep my current team name?'],
                },
                operatorChecklist: [
                  'Confirm the Drive transcript belongs to this intake before running Scribe.',
                  'Review all Scribe draft fields before copying them into onboarding or Builder work.',
                  'Do not treat this draft as legal, payment, or launch approval.',
                ],
                manualReviewWarnings: [
                  'Transcript action items mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
                ],
                provenance: {
                  meetingProvider: 'google_meet',
                  transcriptionProvider: 'gemini',
                  driveFileId: 'drive-file-123',
                  driveFileUrl:
                    'https://docs.google.com/document/d/drive-file-123/edit',
                  meetUrl: 'https://meet.google.com/abc-defg-hij',
                  transcriptCharCount: 248,
                },
              },
            },
          },
        ],
      }),
    )

    expect(html).toContain('Latest Meet transcript')
    expect(html).toContain('queued via google meet gemini transcript')
    expect(html).toContain('gemini transcript hook v1')
    expect(html).toContain(
      'Gemini transcript captured for Jamie Hart Jewelry; Scribe processing is queued.',
    )
    expect(html).toContain('ready for scribe')
    expect(html).toContain('2 speakers')
    expect(html).toContain('1 decision')
    expect(html).toContain('1 action item')
    expect(html).toContain('2 client preferences')
    expect(html).toContain('Sparkle Suite discovery call - Jamie Hart')
    expect(html).toContain('Louis, Jamie')
    expect(html).toContain('Louis: Key decision: keep the velvet direction.')
    expect(html).toContain('Transcript signals')
    expect(html).toContain('keep the velvet direction.')
    expect(html).toContain('I prefer plum and pearl.')
    expect(html).toContain('send the SignWell agreement.')
    expect(html).toContain('Scribe follow-up brief')
    expect(html).toContain(
      'Scribe draft for Jamie Hart Jewelry is ready for operator review',
    )
    expect(html).toContain('Profile draft')
    expect(html).toContain('Confirmed decisions')
    expect(html).toContain('Style and setup signals')
    expect(html).toContain('Open questions')
    expect(html).toContain('Can we keep my current team name?')
    expect(html).toContain('Operator review checks')
    expect(html).toContain(
      'Review all Scribe draft fields before copying them into onboarding or Builder work.',
    )
    expect(html).toContain(
      'Do not treat this draft as legal, payment, or launch approval.',
    )
    expect(html).toContain('Scribe guardrails')
    expect(html).toContain(
      'Transcript action items mention legal, agreement, payment, pricing, or launch-gate work.',
    )
    expect(html).not.toContain('Run Scribe')
    expect(html).toContain('https://docs.google.com/document/d/drive-file-123/edit')
    expect(html).toContain('https://meet.google.com/abc-defg-hij')
    expect(html).toContain('scribe_hook:intake-1:drive-file-123')
  })

  it('renders the latest failed Scout run error on the intake card', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          {
            ...submission,
            latestScoutRun: {
              runKey: 'scout:intake-1:2026-05-09T19:30:00.000Z',
              status: 'failed',
              triggerSource: 'intake_submission',
              model: 'deterministic_scout_v1',
              summary: null,
              errorMessage: 'Public evidence fetch timed out.',
              createdAt: '2026-05-09T19:30:00Z',
              synthesisStatus: null,
              synthesisConfidence: null,
              capturedEvidenceCount: null,
            },
          },
        ],
      }),
    )

    expect(html).toContain('Latest saved Scout run')
    expect(html).toContain('failed')
    expect(html).toContain('Scout run error')
    expect(html).toContain('Public evidence fetch timed out.')
  })

  it('renders Scout research handoff details after a run', () => {
    const output: PrelaunchScoutOutput = {
      briefTitle: 'Scout brief: Jamie Hart Jewelry',
      summary:
        'Jamie Hart Jewelry is a TikTok prospect. External social research is not connected yet.',
      recommendedNextStep: 'operator_review_first',
      researchTargets: [
        { label: 'TikTok', value: '@jamieh', priority: 'high' },
      ],
      researchPlan: {
        status: 'manual_research_required',
        searchQueries: ['Jamie Hart Jewelry @jamieh TikTok'],
        evidenceChecklist: [
          'Confirm recent live-show cadence and audience engagement.',
        ],
        blockers: ['External social research is not connected yet.'],
        capturedEvidence: [],
        sourceReports: [
          {
            label: 'TikTok',
            status: 'fetch_failed',
            url: 'https://www.tiktok.com/@jamieh',
            note: 'Scout could not fetch the public page metadata.',
          },
          {
            label: 'Instagram',
            status: 'metadata_missing',
            url: 'https://www.instagram.com/jamiebling/',
            note: 'Scout reached the public page but did not find usable title or description metadata.',
          },
          {
            label: 'Facebook',
            status: 'not_provided',
            url: null,
            note: 'No public handle or URL was provided in the intake.',
          },
        ],
      },
      setupRisks: ['Confirm a two-device live setup.'],
      suggestedQuestions: ['Can they support a two-device setup?'],
      reusedLessons: [],
      generatedBy: 'deterministic_scout_v1',
      publicFunnel: {
        shape: 'unclear',
        summary:
          'Scout does not have enough public link evidence to describe the customer path yet.',
        primaryLinks: [],
        concerns: ['Public customer path still needs manual confirmation.'],
      },
      researchSynthesis: {
        status: 'not_available',
        discoveryAngle: null,
        summaryBullets: [],
        followUpQuestions: [],
        evidenceBackedObservations: [],
        manualVerificationNeeded: [],
        contradictions: [],
        confidence: 'low',
      },
    }

    const html = renderToStaticMarkup(
      createElement(PrelaunchScoutRecommendationResult, { output }),
    )

    expect(html).toContain('Manual research handoff')
    expect(html).toContain('Jamie Hart Jewelry @jamieh TikTok')
    expect(html).toContain(
      'Confirm recent live-show cadence and audience engagement.',
    )
    expect(html).toContain('External social research is not connected yet.')
    expect(html).toContain('Source check results')
    expect(html).toContain('TikTok: fetch failed')
    expect(html).toContain(
      'Scout reached the public page but did not find usable title or description metadata.',
    )
  })

  it('renders captured public profile evidence when Scout finds it', () => {
    const output: PrelaunchScoutOutput = {
      briefTitle: 'Scout brief: Jamie Hart Jewelry',
      summary:
        'Jamie Hart Jewelry is a TikTok prospect. Scout captured lightweight public-profile evidence from TikTok.',
      recommendedNextStep: 'operator_review_first',
      researchTargets: [
        { label: 'TikTok', value: '@jamieh', priority: 'high' },
      ],
      researchPlan: {
        status: 'evidence_captured',
        searchQueries: ['Jamie Hart Jewelry @jamieh TikTok'],
        evidenceChecklist: [
          'Look for one discovery-call angle from the captured bio/title language.',
        ],
        blockers: [],
        capturedEvidence: [
          {
            label: 'TikTok',
            url: 'https://www.tiktok.com/@jamieh',
            title: 'Jamie Hart Jewelry | TikTok',
            description:
              'Live jewelry sales, trade nights, and customer follow-up clips.',
            canonicalUrl: 'https://www.tiktok.com/@jamieh',
            evidenceSnippets: [
              'Live reveals every Tuesday',
              "Shop tonight's live board",
            ],
            outboundLinks: ['https://jamiehartjewelry.com/live'],
            primaryOutboundLink: 'https://jamiehartjewelry.com/live',
            primaryOutboundLinkReason:
              'Direct brand or shop links are more likely the real customer action than a generic link hub.',
          },
          {
            label: 'Primary customer link',
            url: 'https://jamiehartjewelry.com/live',
            title: 'Jamie Hart Jewelry Live Shop',
            description:
              'Shop the current live reveal board and see next-show details.',
            canonicalUrl: 'https://jamiehartjewelry.com/live',
            evidenceSnippets: [
              'Claim favorites before the next show',
              'Join the VIP text list',
            ],
            outboundLinks: [],
            primaryOutboundLink: null,
            primaryOutboundLinkReason: null,
          },
        ],
        sourceReports: [
          {
            label: 'TikTok',
            status: 'captured',
            url: 'https://www.tiktok.com/@jamieh',
            note: 'Usable public profile metadata was captured.',
          },
          {
            label: 'Instagram',
            status: 'metadata_missing',
            url: 'https://www.instagram.com/jamiebling/',
            note: 'Scout reached the public page but did not find usable title or description metadata.',
          },
          {
            label: 'Facebook',
            status: 'not_provided',
            url: null,
            note: 'No public handle or URL was provided in the intake.',
          },
          {
            label: 'Primary customer link',
            status: 'captured',
            url: 'https://jamiehartjewelry.com/live',
            note: 'Usable public customer-link metadata was captured.',
          },
        ],
      },
      setupRisks: ['Confirm a two-device live setup.'],
      suggestedQuestions: ['Can they support a two-device setup?'],
      reusedLessons: [],
      generatedBy: 'deterministic_scout_v1',
      publicFunnel: {
        shape: 'direct_site_first',
        summary:
          'The public profile points customers straight to a direct brand or shop link first.',
        primaryLinks: ['https://jamiehartjewelry.com/live'],
        concerns: [],
      },
      researchSynthesis: {
        status: 'deterministic_fallback',
        discoveryAngle:
          'The public TikTok profile is enough to start from customer-facing language instead of a blank first pass.',
        summaryBullets: [
          'Profile copy points toward live-sale momentum.',
        ],
        followUpQuestions: [
          'Which customer action is breaking most often right now?',
        ],
        evidenceBackedObservations: [
          'Profile copy points toward live-sale momentum.',
        ],
        manualVerificationNeeded: [
          'Confirm the direct customer-link page still matches the public profile promise.',
        ],
        contradictions: [],
        confidence: 'high',
      },
    }

    const html = renderToStaticMarkup(
      createElement(PrelaunchScoutRecommendationResult, { output }),
    )

    expect(html).toContain('Captured public evidence')
    expect(html).toContain('Jamie Hart Jewelry | TikTok')
    expect(html).toContain('https://www.tiktok.com/@jamieh')
    expect(html).toContain(
      'Live jewelry sales, trade nights, and customer follow-up clips.',
    )
    expect(html).toContain('Likely primary customer link')
    expect(html).toContain('Primary customer link')
    expect(html).toContain('Jamie Hart Jewelry Live Shop')
    expect(html).toContain(
      'Shop the current live reveal board and see next-show details.',
    )
    expect(html).toContain('Page signals')
    expect(html).toContain('Live reveals every Tuesday')
    expect(html).toContain('Shop tonight&#x27;s live board')
    expect(html).toContain('Claim favorites before the next show')
    expect(html).toContain('Join the VIP text list')
    expect(html).toContain(
      'Direct brand or shop links are more likely the real customer action than a generic link hub.',
    )
    expect(html).toContain('Public funnel read')
    expect(html).toContain('direct site first')
    expect(html).toContain(
      'The public profile points customers straight to a direct brand or shop link first.',
    )
    expect(html).toContain('Possible customer links')
    expect(html).toContain('https://jamiehartjewelry.com/live')
    expect(html).toContain('TikTok: captured')
    expect(html).toContain('Usable public customer-link metadata was captured.')
  })

  it('renders Scout synthesis when it exists', () => {
    const output: PrelaunchScoutOutput = {
      briefTitle: 'Scout brief: Jamie Hart Jewelry',
      summary:
        'Jamie Hart Jewelry is a TikTok prospect. Scout captured lightweight public-profile evidence from TikTok.',
      recommendedNextStep: 'operator_review_first',
      researchTargets: [
        { label: 'TikTok', value: '@jamieh', priority: 'high' },
      ],
      researchPlan: {
        status: 'evidence_captured',
        searchQueries: ['Jamie Hart Jewelry @jamieh TikTok'],
        evidenceChecklist: [],
        blockers: [],
        capturedEvidence: [
          {
            label: 'TikTok',
            url: 'https://www.tiktok.com/@jamieh',
            title: 'Jamie Hart Jewelry | TikTok',
            description:
              'Live jewelry sales, trade nights, and customer follow-up clips.',
            canonicalUrl: 'https://www.tiktok.com/@jamieh',
            outboundLinks: ['https://jamiehartjewelry.com/live'],
            primaryOutboundLink: 'https://jamiehartjewelry.com/live',
            primaryOutboundLinkReason:
              'Direct brand or shop links are more likely the real customer action than a generic link hub.',
          },
        ],
        sourceReports: [
          {
            label: 'TikTok',
            status: 'captured',
            url: 'https://www.tiktok.com/@jamieh',
            note: 'Usable public profile metadata was captured.',
          },
          {
            label: 'Instagram',
            status: 'metadata_missing',
            url: 'https://www.instagram.com/jamiebling/',
            note: 'Scout reached the public page but did not find usable title or description metadata.',
          },
          {
            label: 'Facebook',
            status: 'not_provided',
            url: null,
            note: 'No public handle or URL was provided in the intake.',
          },
        ],
      },
      setupRisks: ['Confirm a two-device live setup.'],
      suggestedQuestions: ['Can they support a two-device setup?'],
      reusedLessons: [],
      generatedBy: 'deterministic_scout_v1',
      publicFunnel: {
        shape: 'direct_site_first',
        summary:
          'The public profile points customers straight to a direct brand or shop link first.',
        primaryLinks: ['https://jamiehartjewelry.com/live'],
        concerns: [],
      },
      researchSynthesis: {
        status: 'model_generated',
        discoveryAngle:
          'The public TikTok language already sounds customer-first, so the discovery call can focus on smoothing the live-show path.',
        summaryBullets: [
          'Profile language points to active live-sale momentum.',
          'Customer follow-up already appears in the public positioning.',
        ],
        followUpQuestions: [
          'Which customer action breaks most often between the live and the replay window?',
        ],
        evidenceBackedObservations: [
          'The public profile and customer-link page both point to live-show shopping.',
        ],
        manualVerificationNeeded: [
          'Confirm the direct customer-link page still matches the public profile promise.',
        ],
        contradictions: [
          'TikTok and Instagram appear to point to different public links.',
        ],
        confidence: 'medium',
      },
    }

    const html = renderToStaticMarkup(
      createElement(PrelaunchScoutRecommendationResult, { output }),
    )

    expect(html).toContain('Scout synthesis')
    expect(html).toContain(
      'The public TikTok language already sounds customer-first, so the discovery call can focus on smoothing the live-show path.',
    )
    expect(html).toContain(
      'Profile language points to active live-sale momentum.',
    )
    expect(html).toContain(
      'Which customer action breaks most often between the live and the replay window?',
    )
    expect(html).toContain('Grounded observations')
    expect(html).toContain(
      'The public profile and customer-link page both point to live-show shopping.',
    )
    expect(html).toContain('Manual verification needed')
    expect(html).toContain(
      'Confirm the direct customer-link page still matches the public profile promise.',
    )
    expect(html).toContain('Contradictions or tensions')
    expect(html).toContain(
      'TikTok and Instagram appear to point to different public links.',
    )
    expect(html).toContain('Confidence: medium')
  })

  it('renders reused Scout lessons with similarity reasons', () => {
    const output: PrelaunchScoutOutput = {
      briefTitle: 'Scout brief: Jamie Hart Jewelry',
      summary:
        'Jamie Hart Jewelry is a TikTok prospect. External social research is not connected yet.',
      recommendedNextStep: 'operator_review_first',
      researchTargets: [
        { label: 'TikTok', value: '@jamieh', priority: 'high' },
      ],
      researchPlan: {
        status: 'manual_research_required',
        searchQueries: [],
        evidenceChecklist: [],
        blockers: [],
        capturedEvidence: [],
        sourceReports: [],
      },
      setupRisks: [],
      suggestedQuestions: [],
      reusedLessons: [
        {
          sourceRunKey: 'scout:tiktok-intake:2026-05-09T18:30:00.000Z',
          lesson:
            'TikTok phone-only reps need a two-device plan before launch copy.',
          similarityReasons: [
            'same primary platform',
            'same device setup',
            'shared fit flag: phone_only_setup',
          ],
        },
      ],
      generatedBy: 'deterministic_scout_v1',
      publicFunnel: {
        shape: 'unclear',
        summary:
          'Scout does not have enough public link evidence to describe the customer path yet.',
        primaryLinks: [],
        concerns: [],
      },
      researchSynthesis: {
        status: 'not_available',
        discoveryAngle: null,
        summaryBullets: [],
        followUpQuestions: [],
        evidenceBackedObservations: [],
        manualVerificationNeeded: [],
        contradictions: [],
        confidence: 'low',
      },
    }

    const html = renderToStaticMarkup(
      createElement(PrelaunchScoutRecommendationResult, { output }),
    )

    expect(html).toContain('Reused Scout lessons')
    expect(html).toContain(
      'TikTok phone-only reps need a two-device plan before launch copy.',
    )
    expect(html).toContain('Why Scout reused this')
    expect(html).toContain('same primary platform')
    expect(html).toContain('same device setup')
    expect(html).toContain('shared fit flag: phone_only_setup')
    expect(html).toContain('scout:tiktok-intake:2026-05-09T18:30:00.000Z')
  })
})
