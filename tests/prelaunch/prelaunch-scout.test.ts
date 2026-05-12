import { describe, expect, it, vi } from 'vitest'

import {
  buildPrelaunchScoutOutput,
  collectPrelaunchScoutEvidence,
  inspectPrelaunchScoutEvidenceSources,
  runPrelaunchScoutForIntake,
  synthesizePrelaunchScoutEvidence,
} from '@/lib/prelaunch/scout'
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
  createdAt: '2026-05-09T18:00:00Z',
  updatedAt: '2026-05-09T18:00:00Z',
}

describe('prelaunch Scout', () => {
  it('builds a first-pass onboarding recommendation from intake context', () => {
    const output = buildPrelaunchScoutOutput(submission)

    expect(output.briefTitle).toBe('Scout brief: Jamie Hart Jewelry')
    expect(output.recommendedNextStep).toBe('operator_review_first')
    expect(output.setupRisks).toContain(
      'Confirm a two-device live setup before booking a build path.',
    )
    expect(output.researchTargets).toContainEqual({
      label: 'TikTok',
      value: '@jamieh',
      priority: 'high',
    })
    expect(output.suggestedQuestions.join(' ')).toContain('two-device')
  })

  it('builds a manual social research plan without claiming research is complete', () => {
    const output = buildPrelaunchScoutOutput(submission)

    expect(output.researchPlan.status).toBe('manual_research_required')
    expect(output.researchPlan.blockers).toContain(
      'External social research is not connected yet.',
    )
    expect(output.researchPlan.searchQueries).toEqual([
      'Jamie Hart Jewelry @jamieh TikTok',
      'Jamie Hart Jewelry @jamiebling Instagram',
      'Jamie Hart Jewelry Lindsey Team Bomb Party',
    ])
    expect(output.researchPlan.evidenceChecklist).toContain(
      'Confirm recent live-show cadence and audience engagement.',
    )
    expect(output.researchPlan.sourceReports).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        status: 'not_checked',
        url: 'https://www.tiktok.com/@jamieh',
      }),
      expect.objectContaining({
        label: 'Instagram',
        status: 'not_checked',
        url: 'https://www.instagram.com/jamiebling/',
      }),
      expect.objectContaining({
        label: 'Facebook',
        status: 'not_provided',
        url: null,
      }),
    ])
  })

  it('captures lightweight evidence from public social profiles when available', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales, trade nights, and customer follow-up clips." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
                <a href="https://jamiehartjewelry.com/live">Live shop</a>
                <a href="https://linktr.ee/jamieh">Link hub</a>
              </head>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: false,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '',
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry Live Shop</title>
                <meta name="description" content="Shop the current live reveal board and see next-show details." />
                <link rel="canonical" href="https://jamiehartjewelry.com/live" />
              </head>
            </html>
          `,
      } satisfies Partial<Response>)

    const evidence = await collectPrelaunchScoutEvidence(submission, {
      fetchImpl: fetchMock as typeof fetch,
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(evidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
        title: 'Jamie Hart Jewelry | TikTok',
        description:
          'Live jewelry sales, trade nights, and customer follow-up clips.',
        canonicalUrl: 'https://www.tiktok.com/@jamieh',
        outboundLinks: [
          'https://jamiehartjewelry.com/live',
          'https://linktr.ee/jamieh',
        ],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
        title: 'Jamie Hart Jewelry Live Shop',
        description:
          'Shop the current live reveal board and see next-show details.',
      }),
    ])
  })

  it('follows direct customer links for one deeper public evidence pass', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales and trade night clips." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
              </head>
              <body>
                <a href="https://jamiehartjewelry.com/live">Live shop</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: false,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '',
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry Live Shop</title>
                <meta name="description" content="Shop the current live reveal board, claim favorites, and see next-show details." />
                <link rel="canonical" href="https://jamiehartjewelry.com/live" />
              </head>
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(submission, {
      fetchImpl: fetchMock as typeof fetch,
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://jamiehartjewelry.com/live',
      expect.any(Object),
    )
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
        title: 'Jamie Hart Jewelry Live Shop',
        description:
          'Shop the current live reveal board, claim favorites, and see next-show details.',
      }),
    ])
    expect(result.sourceReports).toContainEqual({
      label: 'Primary customer link',
      status: 'captured',
      url: 'https://jamiehartjewelry.com/live',
      note: 'Usable public customer-link metadata was captured.',
    })
  })

  it('captures public page signal snippets from headings and CTA links', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales and trade night clips." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
              </head>
              <body>
                <h1>Live reveals every Tuesday</h1>
                <a href="https://jamiehartjewelry.com/live">Shop tonight's live board</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry Live Shop</title>
                <meta name="description" content="Shop the current live reveal board." />
                <link rel="canonical" href="https://jamiehartjewelry.com/live" />
              </head>
              <body>
                <h2>Claim favorites before the next show</h2>
                <button>Join the VIP text list</button>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          tiktok: '@jamieh',
          instagram: null,
          facebook: null,
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        evidenceSnippets: [
          'Live reveals every Tuesday',
          "Shop tonight's live board",
        ],
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        evidenceSnippets: [
          'Claim favorites before the next show',
          'Join the VIP text list',
        ],
      }),
    ])
  })

  it('does not follow generic link hubs during the one-hop evidence pass', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales and trade night clips." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
              </head>
              <body>
                <a href="https://linktr.ee/jamieh">Link hub</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: false,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '',
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(submission, {
      fetchImpl: fetchMock as typeof fetch,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        primaryOutboundLink: 'https://linktr.ee/jamieh',
      }),
    ])
    expect(result.sourceReports).not.toContainEqual(
      expect.objectContaining({
        label: 'Primary customer link',
      }),
    )
  })

  it('limits one-hop customer-link checks to two direct links', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales and trade night clips." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
              </head>
              <body>
                <a href="https://jamiehartjewelry.com/live">Live shop</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | Instagram</title>
                <meta property="og:description" content="Live reminders and replay clips." />
                <link rel="canonical" href="https://www.instagram.com/jamiebling/" />
              </head>
              <body>
                <a href="https://shop.jamiehartjewelry.com">Shop</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Customer link</title>
                <meta name="description" content="Customer action page." />
              </head>
            </html>
          `,
      } satisfies Partial<Response>)

    await inspectPrelaunchScoutEvidenceSources(submission, {
      fetchImpl: fetchMock as typeof fetch,
    })

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://jamiehartjewelry.com/live',
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://shop.jamiehartjewelry.com',
      expect.any(Object),
    )
  })

  it('summarizes direct customer-link evidence separately from social-profile evidence', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
        title: 'Jamie Hart Jewelry | TikTok',
        description: 'Live jewelry sales and trade night clips.',
        canonicalUrl: 'https://www.tiktok.com/@jamieh',
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
          'Shop the current live reveal board, claim favorites, and see next-show details.',
        canonicalUrl: 'https://jamiehartjewelry.com/live',
        outboundLinks: [],
        primaryOutboundLink: null,
        primaryOutboundLinkReason: null,
      },
    ])

    expect(output.summary).toContain(
      'Scout captured public-profile evidence from TikTok plus direct customer-link evidence',
    )
    expect(output.summary).not.toContain(
      'public-profile evidence from TikTok, Primary customer link',
    )
    expect(output.researchPlan.evidenceChecklist).toContain(
      'Compare the direct customer-link page against the public profile promise before the discovery call.',
    )
    expect(output.researchSynthesis.followUpQuestions).toContain(
      'Does the direct customer-link page match what the public profile promises?',
    )
    expect(output.suggestedQuestions).toContain(
      'Does the direct customer-link page match what the public profile promises?',
    )
  })

  it('uses captured page signals in deterministic synthesis bullets', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
        title: 'Jamie Hart Jewelry Live Shop',
        description: null,
        canonicalUrl: 'https://jamiehartjewelry.com/live',
        evidenceSnippets: [
          'Claim favorites before the next show',
          'Join the VIP text list',
        ],
        outboundLinks: [],
        primaryOutboundLink: null,
        primaryOutboundLinkReason: null,
      },
    ])

    expect(output.researchSynthesis.summaryBullets).toContain(
      'Claim favorites before the next show',
    )
  })

  it('flags customer links for manual review when the one-hop fetch fails', () => {
    const output = buildPrelaunchScoutOutput(
      submission,
      [],
      [
        {
          label: 'TikTok',
          url: 'https://www.tiktok.com/@jamieh',
          title: 'Jamie Hart Jewelry | TikTok',
          description: 'Live jewelry sales and trade night clips.',
          canonicalUrl: 'https://www.tiktok.com/@jamieh',
          outboundLinks: ['https://jamiehartjewelry.com/live'],
          primaryOutboundLink: 'https://jamiehartjewelry.com/live',
          primaryOutboundLinkReason:
            'Direct brand or shop links are more likely the real customer action than a generic link hub.',
        },
      ],
      undefined,
      [
        {
          label: 'TikTok',
          status: 'captured',
          url: 'https://www.tiktok.com/@jamieh',
          note: 'Usable public profile metadata was captured.',
        },
        {
          label: 'Instagram',
          status: 'not_provided',
          url: null,
          note: 'No public handle or URL was provided in the intake.',
        },
        {
          label: 'Facebook',
          status: 'not_provided',
          url: null,
          note: 'No public handle or URL was provided in the intake.',
        },
        {
          label: 'Primary customer link',
          status: 'fetch_failed',
          url: 'https://jamiehartjewelry.com/live',
          note: 'Scout could not fetch the public customer-link metadata.',
        },
      ],
    )

    expect(output.researchPlan.evidenceChecklist).toContain(
      'Open any direct customer links Scout could not fetch and verify the customer path manually.',
    )
    expect(output.suggestedQuestions).toContain(
      'Can Louis open the public customer link manually before the call to confirm the real customer path?',
    )
  })

  it('reports per-source evidence outcomes for the operator', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales, trade nights, and customer follow-up clips." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
                <a href="https://jamiehartjewelry.com/live">Live shop</a>
              </head>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '<html><head><title>Instagram</title></head></html>',
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry Live Shop</title>
                <meta name="description" content="Shop the current live reveal board." />
                <link rel="canonical" href="https://jamiehartjewelry.com/live" />
              </head>
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(submission, {
      fetchImpl: fetchMock as typeof fetch,
    })

    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
        title: 'Jamie Hart Jewelry Live Shop',
      }),
    ])
    expect(result.sourceReports).toEqual([
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
    ])
  })

  it('normalizes bare handles and scheme-less social URLs before checking public sources', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '',
    } satisfies Partial<Response>)

    await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          tiktok: 'jamieh',
          instagram: 'instagram.com/jamiebling',
          facebook: 'www.facebook.com/groups/jamiebling',
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://www.tiktok.com/@jamieh',
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://www.instagram.com/jamiebling/',
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://www.facebook.com/groups/jamiebling',
      expect.any(Object),
    )
  })

  it('switches Scout into evidence-backed mode when public profile evidence is captured', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
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
    ])

    expect(output.researchPlan.status).toBe('evidence_captured')
    expect(output.researchPlan.blockers).toEqual([])
    expect(output.researchPlan.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
      }),
    ])
    expect(output.researchPlan.sourceReports).toContainEqual(
      expect.objectContaining({
        label: 'TikTok',
        status: 'captured',
      }),
    )
    expect(output.summary).not.toContain(
      'External social research is not connected yet',
    )
    expect(output.researchSynthesis.status).toBe('deterministic_fallback')
    expect(output.publicFunnel).toEqual({
      shape: 'direct_site_first',
      summary:
        'The public profile points customers straight to a direct brand or shop link first.',
      primaryLinks: ['https://jamiehartjewelry.com/live'],
      concerns: [],
    })
  })

  it('classifies a generic link hub as the visible public funnel when no direct link is present', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/jamiebling/',
        title: 'Jamie Hart Jewelry | Instagram',
        description: 'Live reveals, replays, and launch updates.',
        canonicalUrl: 'https://www.instagram.com/jamiebling/',
        outboundLinks: ['https://linktr.ee/jamieh'],
        primaryOutboundLink: 'https://linktr.ee/jamieh',
        primaryOutboundLinkReason:
          'Only a generic link hub was visible publicly, so that is the current likely customer path.',
      },
    ])

    expect(output.publicFunnel).toEqual({
      shape: 'hub_first',
      summary:
        'The visible public path depends on a generic link hub before customers reach a specific action.',
      primaryLinks: ['https://linktr.ee/jamieh'],
      concerns: [
        'Confirm which hub destination should become the main Sparkle Suite call to action.',
      ],
    })
    expect(output.suggestedQuestions).toContain(
      'Which hub destination should become the main Sparkle Suite call to action?',
    )
  })

  it('flags competing direct customer links across public sources', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
        title: 'Jamie Hart Jewelry | TikTok',
        description: 'Live jewelry sales and customer follow-up clips.',
        canonicalUrl: 'https://www.tiktok.com/@jamieh',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      },
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/jamiebling/',
        title: 'Jamie Hart Jewelry | Instagram',
        description: 'Replays, live reminders, and launch updates.',
        canonicalUrl: 'https://www.instagram.com/jamiebling/',
        outboundLinks: ['https://shop.jamiehartjewelry.com'],
        primaryOutboundLink: 'https://shop.jamiehartjewelry.com',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      },
    ])

    expect(output.publicFunnel).toEqual({
      shape: 'direct_site_first',
      summary:
        'The public profile points customers straight to a direct brand or shop link first.',
      primaryLinks: [
        'https://jamiehartjewelry.com/live',
        'https://shop.jamiehartjewelry.com',
      ],
      concerns: [
        'Multiple public profiles point to different direct customer links; confirm which link should be primary before the discovery call.',
      ],
    })
    expect(output.suggestedQuestions).toContain(
      'Which public customer link should become the primary Sparkle Suite call to action?',
    )
  })

  it('uses model-backed synthesis when generation succeeds', async () => {
    const generateTextMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        discoveryAngle:
          'Her public TikTok language already sounds customer-first, which makes the discovery call less about brand basics and more about smoothing the live-show path.',
        summaryBullets: [
          'TikTok headline suggests active live-sale momentum.',
          'Public bio language points to customer follow-up, not just product drops.',
        ],
        followUpQuestions: [
          'Which customer action is breaking most often between the live and the replay window?',
          'What current link or bio flow needs the fastest cleanup before launch?',
        ],
      }),
    })

    const synthesis = await synthesizePrelaunchScoutEvidence(
      submission,
      [
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
      ],
      {
        generateTextImpl: generateTextMock,
      },
    )

    expect(generateTextMock).toHaveBeenCalledTimes(1)
    expect(generateTextMock.mock.calls[0]?.[0].prompt).toContain(
      'pageSignals: Live reveals every Tuesday | Shop tonight',
    )
    expect(synthesis).toEqual({
      status: 'model_generated',
      discoveryAngle:
        'Her public TikTok language already sounds customer-first, which makes the discovery call less about brand basics and more about smoothing the live-show path.',
      summaryBullets: [
        'TikTok headline suggests active live-sale momentum.',
        'Public bio language points to customer follow-up, not just product drops.',
      ],
      followUpQuestions: [
        'Which customer action is breaking most often between the live and the replay window?',
        'What current link or bio flow needs the fastest cleanup before launch?',
      ],
    })
  })

  it('prefers a direct site link over a generic link hub for the primary customer path', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | TikTok</title>
                <meta property="og:description" content="Live jewelry sales." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
              </head>
              <body>
                <a href="https://linktr.ee/jamieh">Link hub</a>
                <a href="https://jamiehartjewelry.com/live">Live shop</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: false,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '',
      } satisfies Partial<Response>)

    const evidence = await collectPrelaunchScoutEvidence(submission, {
      fetchImpl: fetchMock as typeof fetch,
    })

    expect(evidence).toEqual([
      expect.objectContaining({
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      }),
    ])
  })

  it('reuses recent Scout lessons in the generated recommendation', () => {
    const output = buildPrelaunchScoutOutput(submission, [
      {
        sourceRunKey: 'scout:older-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'Reps using TikTok and phone-only setups need a two-device plan before launch copy.',
      },
    ])

    expect(output.reusedLessons).toEqual([
      {
        sourceRunKey: 'scout:older-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'Reps using TikTok and phone-only setups need a two-device plan before launch copy.',
      },
    ])
    expect(output.suggestedQuestions).toContain(
      'What from the prior Scout lesson should Louis reuse or avoid for this rep?',
    )
  })

  it('reuses lessons from similar prior Scout runs instead of unrelated runs', async () => {
    const intakeSingleMock = vi.fn().mockResolvedValueOnce({
      data: {
        id: 'intake-1',
        full_name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        business_name: 'Jamie Hart Jewelry',
        tiktok_handle: '@jamieh',
        instagram_handle: '@jamiebling',
        facebook_url: null,
        team_name: 'Lindsey Team',
        team_size: '6-20',
        primary_platform: 'tiktok',
        streaming_frequency: 'multiple_weekly',
        current_setup: 'TikTok bio link and DMs',
        setup_goal: 'Cleaner show-night hub',
        device_setup: 'phone_only',
        brand_vibe: 'polished and warm',
        color_preferences: 'plum and pearl',
        special_requests: 'Needs help with launch links',
        intake_status: 'submitted',
        prequalification_status: 'needs_review',
        fit_flags: ['phone_only_setup'],
        waitlist_id: 'waitlist-1',
        scout_input_status: 'ready',
        created_at: '2026-05-09T18:00:00Z',
        updated_at: '2026-05-09T18:00:00Z',
      },
      error: null,
    })
    const intakeEqMock = vi.fn(() => ({ single: intakeSingleMock }))
    const intakeSelectMock = vi.fn(() => ({ eq: intakeEqMock }))
    const intakeUpdateEqMock = vi.fn().mockResolvedValueOnce({ error: null })
    const intakeUpdateMock = vi.fn(() => ({ eq: intakeUpdateEqMock }))
    const previousRunsLimitMock = vi.fn().mockResolvedValueOnce({
      data: [
        {
          run_key: 'scout:facebook-intake:2026-05-09T18:00:00.000Z',
          summary:
            'Facebook-first reps often need a group-link cleanup before launch.',
          output: null,
          input: {
            streamingContext: {
              primaryPlatform: 'facebook',
              deviceSetup: 'phone_and_computer',
            },
            teamContext: {
              teamName: 'Other Team',
            },
            prequalification: {
              fitFlags: [],
            },
          },
        },
        {
          run_key: 'scout:tiktok-intake:2026-05-09T18:30:00.000Z',
          summary:
            'TikTok phone-only reps need a two-device plan before launch copy.',
          output: null,
          input: {
            streamingContext: {
              primaryPlatform: 'tiktok',
              deviceSetup: 'phone_only',
            },
            teamContext: {
              teamName: 'Lindsey Team',
            },
            prequalification: {
              fitFlags: ['phone_only_setup'],
            },
          },
        },
      ],
      error: null,
    })
    const previousRunsOrderMock = vi.fn(() => ({ limit: previousRunsLimitMock }))
    const previousRunsNeqMock = vi.fn(() => ({ order: previousRunsOrderMock }))
    const previousRunsStatusEqMock = vi.fn(() => ({ neq: previousRunsNeqMock }))
    const previousRunsAgentEqMock = vi.fn(() => ({ eq: previousRunsStatusEqMock }))
    const previousRunsSelectMock = vi.fn(() => ({ eq: previousRunsAgentEqMock }))
    const agentRunsInsertMock = vi.fn().mockResolvedValueOnce({ error: null })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '',
    } satisfies Partial<Response>)
    const fromMock = vi.fn((table: string) => {
      if (table === 'agent_runs') {
        return {
          select: previousRunsSelectMock,
          insert: agentRunsInsertMock,
        }
      }
      return {
        select: intakeSelectMock,
        update: intakeUpdateMock,
      }
    })

    const result = await runPrelaunchScoutForIntake({
      admin: { from: fromMock } as never,
      fetchImpl: fetchMock as typeof fetch,
      intakeId: 'intake-1',
      now: new Date('2026-05-09T19:00:00Z'),
    })

    expect(result.output.reusedLessons).toEqual([
      {
        sourceRunKey: 'scout:tiktok-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'TikTok phone-only reps need a two-device plan before launch copy.',
        similarityReasons: [
          'same primary platform',
          'same device setup',
          'same team',
          'shared fit flag: phone_only_setup',
        ],
      },
    ])
    expect(agentRunsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          reused_lesson_count: 1,
          reused_lesson_status: 'available',
        }),
      }),
    )
  })

  it('logs the Scout run and marks the intake Scout handoff generated', async () => {
    const intakeSingleMock = vi.fn().mockResolvedValueOnce({
      data: {
        id: 'intake-1',
        full_name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        business_name: 'Jamie Hart Jewelry',
        tiktok_handle: '@jamieh',
        instagram_handle: '@jamiebling',
        facebook_url: null,
        team_name: 'Lindsey Team',
        team_size: '6-20',
        primary_platform: 'tiktok',
        streaming_frequency: 'multiple_weekly',
        current_setup: 'TikTok bio link and DMs',
        setup_goal: 'Cleaner show-night hub',
        device_setup: 'phone_only',
        brand_vibe: 'polished and warm',
        color_preferences: 'plum and pearl',
        special_requests: 'Needs help with launch links',
        intake_status: 'submitted',
        prequalification_status: 'needs_review',
        fit_flags: ['phone_only_setup'],
        waitlist_id: 'waitlist-1',
        scout_input_status: 'ready',
        created_at: '2026-05-09T18:00:00Z',
        updated_at: '2026-05-09T18:00:00Z',
      },
      error: null,
    })
    const intakeEqMock = vi.fn(() => ({ single: intakeSingleMock }))
    const intakeSelectMock = vi.fn(() => ({ eq: intakeEqMock }))
    const intakeUpdateEqMock = vi.fn().mockResolvedValueOnce({ error: null })
    const intakeUpdateMock = vi.fn(() => ({ eq: intakeUpdateEqMock }))
    const previousRunsLimitMock = vi.fn().mockResolvedValueOnce({
      data: [
        {
          run_key: 'scout:older-intake:2026-05-09T18:30:00.000Z',
          summary:
            'Earlier Scout run found that TikTok phone-only reps need device planning.',
          output: {
            setupRisks: [
              'Confirm a two-device live setup before booking a build path.',
            ],
          },
        },
      ],
      error: null,
    })
    const previousRunsOrderMock = vi.fn(() => ({ limit: previousRunsLimitMock }))
    const previousRunsNeqMock = vi.fn(() => ({ order: previousRunsOrderMock }))
    const previousRunsStatusEqMock = vi.fn(() => ({ neq: previousRunsNeqMock }))
    const previousRunsAgentEqMock = vi.fn(() => ({ eq: previousRunsStatusEqMock }))
    const previousRunsSelectMock = vi.fn(() => ({ eq: previousRunsAgentEqMock }))
    const agentRunsInsertMock = vi.fn().mockResolvedValueOnce({ error: null })
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '',
      } satisfies Partial<Response>)
    const fromMock = vi.fn((table: string) => {
      if (table === 'agent_runs') {
        return {
          select: previousRunsSelectMock,
          insert: agentRunsInsertMock,
        }
      }
      return {
        select: intakeSelectMock,
        update: intakeUpdateMock,
      }
    })

    const result = await runPrelaunchScoutForIntake({
      admin: { from: fromMock } as never,
      fetchImpl: fetchMock as typeof fetch,
      intakeId: 'intake-1',
      operatorRepId: 'rep-1',
      now: new Date('2026-05-09T19:00:00Z'),
    })

    expect(result.runKey).toBe('scout:intake-1:2026-05-09T19:00:00.000Z')
    expect(agentRunsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        run_key: 'scout:intake-1:2026-05-09T19:00:00.000Z',
        agent_name: 'Scout',
        agent_kind: 'pre_meeting_intel',
        intake_submission_id: 'intake-1',
        waitlist_id: 'waitlist-1',
        rep_id: 'rep-1',
        status: 'completed',
        trigger_source: 'operator_review',
        model: 'deterministic_scout_v1',
        metadata: expect.objectContaining({
          research_plan_status: 'manual_research_required',
          public_funnel_shape: 'unclear',
          reused_lesson_count: 1,
          evidence_source_statuses: [
            {
              label: 'TikTok',
              status: 'fetch_failed',
              url: 'https://www.tiktok.com/@jamieh',
            },
            {
              label: 'Instagram',
              status: 'fetch_failed',
              url: 'https://www.instagram.com/jamiebling/',
            },
            { label: 'Facebook', status: 'not_provided', url: null },
          ],
        }),
      }),
    )
    expect(previousRunsSelectMock).toHaveBeenCalledWith(
      'run_key, summary, output, input',
    )
    expect(intakeUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scout_input_status: 'generated',
        scout_input_generated_at: '2026-05-09T19:00:00.000Z',
        handoff_status: 'scout_ready',
      }),
    )
    expect(result.output.recommendedNextStep).toBe('operator_review_first')
    expect(result.output.reusedLessons).toEqual([
      {
        sourceRunKey: 'scout:older-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'Earlier Scout run found that TikTok phone-only reps need device planning.',
      },
    ])
  })

  it('continues the Scout run when recent lesson reuse is unavailable', async () => {
    const intakeSingleMock = vi.fn().mockResolvedValueOnce({
      data: {
        id: 'intake-1',
        full_name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        business_name: 'Jamie Hart Jewelry',
        tiktok_handle: '@jamieh',
        instagram_handle: '@jamiebling',
        facebook_url: null,
        team_name: 'Lindsey Team',
        team_size: '6-20',
        primary_platform: 'tiktok',
        streaming_frequency: 'multiple_weekly',
        current_setup: 'TikTok bio link and DMs',
        setup_goal: 'Cleaner show-night hub',
        device_setup: 'phone_only',
        brand_vibe: 'polished and warm',
        color_preferences: 'plum and pearl',
        special_requests: 'Needs help with launch links',
        intake_status: 'submitted',
        prequalification_status: 'needs_review',
        fit_flags: ['phone_only_setup'],
        waitlist_id: 'waitlist-1',
        scout_input_status: 'ready',
        created_at: '2026-05-09T18:00:00Z',
        updated_at: '2026-05-09T18:00:00Z',
      },
      error: null,
    })
    const intakeEqMock = vi.fn(() => ({ single: intakeSingleMock }))
    const intakeSelectMock = vi.fn(() => ({ eq: intakeEqMock }))
    const intakeUpdateEqMock = vi.fn().mockResolvedValueOnce({ error: null })
    const intakeUpdateMock = vi.fn(() => ({ eq: intakeUpdateEqMock }))
    const previousRunsLimitMock = vi.fn().mockResolvedValueOnce({
      data: null,
      error: new Error('agent_runs temporarily unavailable'),
    })
    const previousRunsOrderMock = vi.fn(() => ({ limit: previousRunsLimitMock }))
    const previousRunsNeqMock = vi.fn(() => ({ order: previousRunsOrderMock }))
    const previousRunsStatusEqMock = vi.fn(() => ({ neq: previousRunsNeqMock }))
    const previousRunsAgentEqMock = vi.fn(() => ({ eq: previousRunsStatusEqMock }))
    const previousRunsSelectMock = vi.fn(() => ({ eq: previousRunsAgentEqMock }))
    const agentRunsInsertMock = vi.fn().mockResolvedValueOnce({ error: null })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '',
    } satisfies Partial<Response>)
    const fromMock = vi.fn((table: string) => {
      if (table === 'agent_runs') {
        return {
          select: previousRunsSelectMock,
          insert: agentRunsInsertMock,
        }
      }
      return {
        select: intakeSelectMock,
        update: intakeUpdateMock,
      }
    })

    const result = await runPrelaunchScoutForIntake({
      admin: { from: fromMock } as never,
      fetchImpl: fetchMock as typeof fetch,
      intakeId: 'intake-1',
      now: new Date('2026-05-09T19:00:00Z'),
    })

    expect(result.runKey).toBe('scout:intake-1:2026-05-09T19:00:00.000Z')
    expect(result.output.reusedLessons).toEqual([])
    expect(agentRunsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        metadata: expect.objectContaining({
          reused_lesson_count: 0,
          reused_lesson_status: 'unavailable',
        }),
      }),
    )
    expect(intakeUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scout_input_status: 'generated',
        handoff_status: 'scout_ready',
      }),
    )
  })
})
