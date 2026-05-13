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
  latestScoutRun: null,
  createdAt: '2026-05-09T18:00:00Z',
  updatedAt: '2026-05-09T18:00:00Z',
}

describe('PrelaunchIntakeReviewPageContent', () => {
  it('renders operator summary counts and intake cards', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
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

    expect(html).toContain('Prelaunch intake review')
    expect(html).toContain('2 total')
    expect(html).toContain('1 needs review')
    expect(html).toContain('1 qualified')
    expect(html).toContain('2 Scout ready')
    expect(html).toContain('Jamie Hart Jewelry')
    expect(html).toContain('jamie@example.com')
    expect(html).toContain('phone_only_setup')
    expect(html).toContain('Waitlist linked')
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
