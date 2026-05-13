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
  latestScoutRun: null,
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
                <a href="https://vip.example.com/jamie?token=secret&utm_source=tiktok#top">Join VIP text list</a>
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
          'Join VIP text list',
        ],
        publicActionCandidates: [
          expect.objectContaining({
            sourceLabel: 'Primary customer link',
            sourceUrl: 'https://jamiehartjewelry.com/live',
            text: 'Join VIP text list',
            url: 'https://vip.example.com/jamie',
            actionType: 'vip_text',
          }),
        ],
      }),
    ])
  })

  it('captures public link-hub metadata without following hub destinations', async () => {
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
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Links</title>
                <meta name="description" content="Shop live boards and join VIP text updates." />
                <link rel="canonical" href="https://linktr.ee/jamieh" />
              </head>
              <body>
                <h1>Jamie Hart live sale links</h1>
                <a href="https://jamiehartjewelry.com/live">Shop tonight's live board</a>
                <a href="https://vip.example.com/join">Join VIP text list</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          ...submission.social,
          instagram: null,
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).not.toHaveBeenCalledWith(
      'https://jamiehartjewelry.com/live',
      expect.any(Object),
    )
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        primaryOutboundLink: 'https://linktr.ee/jamieh',
      }),
      expect.objectContaining({
        label: 'Public link hub',
        url: 'https://linktr.ee/jamieh',
        title: 'Jamie Hart Links',
        description: 'Shop live boards and join VIP text updates.',
        outboundLinks: [
          'https://jamiehartjewelry.com/live',
          'https://vip.example.com/join',
        ],
        evidenceSnippets: [
          'Jamie Hart live sale links',
          "Shop tonight's live board",
          'Join VIP text list',
        ],
        publicActionCandidates: [
          expect.objectContaining({
            sourceLabel: 'Public link hub',
            sourceUrl: 'https://linktr.ee/jamieh',
            text: "Shop tonight's live board",
            url: 'https://jamiehartjewelry.com/live',
            actionType: 'live_show',
          }),
          expect.objectContaining({
            sourceLabel: 'Public link hub',
            sourceUrl: 'https://linktr.ee/jamieh',
            text: 'Join VIP text list',
            url: 'https://vip.example.com/join',
            actionType: 'vip_text',
          }),
        ],
      }),
    ])
    expect(result.sourceReports).toContainEqual({
      label: 'Public link hub',
      status: 'captured',
      url: 'https://linktr.ee/jamieh',
      note: 'Usable public link-hub metadata was captured.',
    })
    expect(result.sourceReports).not.toContainEqual(
      expect.objectContaining({
        label: 'Primary customer link',
      }),
    )
  })

  it('filters unsafe public CTA URLs and strips query data from stored evidence', async () => {
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
                <meta property="og:description" content="Shop my sparkle board." />
                <link rel="canonical" href="https://www.tiktok.com/@jamieh" />
              </head>
              <body>
                <a href="https://linktr.ee/jamieh">Link hub</a>
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
                <title>Jamie Hart Links</title>
                <meta name="description" content="All public action links." />
                <link rel="canonical" href="https://linktr.ee/jamieh" />
              </head>
              <body>
                <a href="mailto:jamie@example.com">Email me</a>
                <a href="tel:+19045550123">Text me</a>
                <a href="http://localhost:3000/private">Preview draft</a>
                <a href="http://0.0.0.0/private">Wildcard preview</a>
                <a href="http://[::1]/private">IPv6 loopback preview</a>
                <a href="http://[fd00::1]/private">IPv6 private preview</a>
                <a href="http://[fe80::1]/private">IPv6 link local preview</a>
                <a href="https://192.168.0.4/private">Private board</a>
                <a href="https://jamiehartjewelry.com/live?token=secret&utm_source=tiktok#top">Shop tonight's live board</a>
              </body>
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          ...submission.social,
          instagram: null,
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    const hubEvidence = result.capturedEvidence.find(
      (item) => item.label === 'Public link hub',
    )

    expect(hubEvidence?.outboundLinks).toEqual([
      'https://jamiehartjewelry.com/live',
    ])
    expect(hubEvidence?.publicActionCandidates).toEqual([
      expect.objectContaining({
        text: "Shop tonight's live board",
        url: 'https://jamiehartjewelry.com/live',
        actionType: 'live_show',
      }),
    ])
  })

  it('unwraps known social redirect URLs before the one-hop customer-link check', async () => {
    const instagramRedirect =
      'https://l.instagram.com/?u=https%3A%2F%2Fjamiehartjewelry.com%2Flive%3Ftoken%3Dsecret%26utm_source%3Dinstagram%23top'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | Instagram</title>
                <meta property="og:description" content="Live reminders and customer updates." />
                <link rel="canonical" href="https://www.instagram.com/jamiebling/" />
              </head>
              <body>
                <a href="${instagramRedirect}">Live shop</a>
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
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          tiktok: null,
          instagram: '@jamiebling',
          facebook: null,
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://www.instagram.com/jamiebling/',
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://jamiehartjewelry.com/live',
      expect.any(Object),
    )
    expect(fetchMock).not.toHaveBeenCalledWith(
      'https://l.instagram.com',
      expect.any(Object),
    )
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'Instagram',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
      }),
    ])
  })

  it('drops social redirect targets that unwrap to private URLs', async () => {
    const privateRedirect =
      'https://l.instagram.com/?u=http%3A%2F%2F127.0.0.1%2Fadmin'
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () =>
        `
          <html>
            <head>
              <title>Jamie Hart Jewelry | Instagram</title>
              <meta property="og:description" content="Live reminders and customer updates." />
              <link rel="canonical" href="https://www.instagram.com/jamiebling/" />
            </head>
            <body>
              <a href="${privateRedirect}">Preview draft</a>
            </body>
          </html>
        `,
    } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          tiktok: null,
          instagram: '@jamiebling',
          facebook: null,
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'Instagram',
        outboundLinks: [],
        primaryOutboundLink: null,
      }),
    ])
  })

  it('unwraps known Facebook l.php redirect URLs before customer-link checks', async () => {
    const facebookRedirect =
      'https://www.facebook.com/l.php?u=https%3A%2F%2Fjamiehartjewelry.com%2Flive%3Ffbclid%3Dsecret%23replay'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>Jamie Hart Jewelry | Facebook</title>
                <meta property="og:description" content="Live sale reminders and replay links." />
                <link rel="canonical" href="https://www.facebook.com/jamiehartjewelry" />
              </head>
              <body>
                <a href="${facebookRedirect}">Live board</a>
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
                <title>Jamie Hart Jewelry Live Board</title>
                <meta name="description" content="Claim favorites from the current live board." />
                <link rel="canonical" href="https://jamiehartjewelry.com/live" />
              </head>
            </html>
          `,
      } satisfies Partial<Response>)

    const result = await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          tiktok: null,
          instagram: null,
          facebook: 'https://www.facebook.com/jamiehartjewelry',
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://jamiehartjewelry.com/live',
      expect.any(Object),
    )
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'Facebook',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
      }),
    ])
  })

  it('keeps image-only public links eligible for one-hop customer-link checks', async () => {
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
                <a href="https://jamiehartjewelry.com/live"><img alt="Shop live" src="/shop.png" /></a>
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

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://jamiehartjewelry.com/live',
      expect.any(Object),
    )
    expect(result.capturedEvidence).toEqual([
      expect.objectContaining({
        label: 'TikTok',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        publicActionCandidates: [],
      }),
      expect.objectContaining({
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
      }),
    ])
  })

  it('limits public link-hub checks to two generic hubs', async () => {
    const socialPage = (
      title: string,
      canonicalUrl: string,
      link: string,
    ) => ({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () =>
        `
          <html>
            <head>
              <title>${title}</title>
              <meta property="og:description" content="Live-sale public profile." />
              <link rel="canonical" href="${canonicalUrl}" />
            </head>
            <body>
              <a href="${link}">Link hub</a>
            </body>
          </html>
        `,
    } satisfies Partial<Response>)
    const hubPage = (title: string) =>
      ({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () =>
          `
            <html>
              <head>
                <title>${title}</title>
                <meta name="description" content="Public hub metadata." />
              </head>
            </html>
          `,
      }) satisfies Partial<Response>
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        socialPage(
          'Jamie Hart Jewelry | TikTok',
          'https://www.tiktok.com/@jamieh',
          'https://linktr.ee/jamieh',
        ),
      )
      .mockResolvedValueOnce(
        socialPage(
          'Jamie Hart Jewelry | Instagram',
          'https://www.instagram.com/jamiebling/',
          'https://beacons.ai/jamieh',
        ),
      )
      .mockResolvedValueOnce(
        socialPage(
          'Jamie Hart Jewelry | Facebook',
          'https://facebook.com/jamiehartjewelry',
          'https://bio.site/jamieh',
        ),
      )
      .mockResolvedValueOnce(hubPage('Linktree hub'))
      .mockResolvedValueOnce(hubPage('Beacons hub'))

    await inspectPrelaunchScoutEvidenceSources(
      {
        ...submission,
        social: {
          ...submission.social,
          facebook: 'https://facebook.com/jamiehartjewelry',
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://linktr.ee/jamieh',
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://beacons.ai/jamieh',
      expect.any(Object),
    )
    expect(fetchMock).not.toHaveBeenCalledWith(
      'https://bio.site/jamieh',
      expect.any(Object),
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

  it('summarizes public link-hub evidence separately from social-profile evidence', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
        title: 'Jamie Hart Jewelry | TikTok',
        description: 'Live jewelry sales and trade night clips.',
        canonicalUrl: 'https://www.tiktok.com/@jamieh',
        outboundLinks: ['https://linktr.ee/jamieh'],
        primaryOutboundLink: 'https://linktr.ee/jamieh',
        primaryOutboundLinkReason:
          'Only a generic link hub was visible publicly, so that is the current likely customer path.',
      },
      {
        label: 'Public link hub',
        url: 'https://linktr.ee/jamieh',
        title: 'Jamie Hart Links',
        description: 'Shop live boards and join VIP text updates.',
        canonicalUrl: 'https://linktr.ee/jamieh',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      },
    ])

    expect(output.summary).toContain(
      'Scout captured public-profile evidence from TikTok plus public link-hub evidence',
    )
    expect(output.summary).not.toContain(
      'public-profile evidence from TikTok, Public link hub',
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

  it('attributes link-hub outbound links as hub evidence in deterministic synthesis bullets', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'Public link hub',
        url: 'https://linktr.ee/jamieh',
        title: 'Jamie Hart Links',
        description: null,
        canonicalUrl: 'https://linktr.ee/jamieh',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      },
    ])

    expect(output.researchSynthesis.summaryBullets).toContain(
      'Public link hub points customers toward https://jamiehartjewelry.com/live.',
    )
    expect(output.researchSynthesis.summaryBullets).not.toContain(
      'Public profile points customers toward https://jamiehartjewelry.com/live.',
    )
  })

  it('adds grounded synthesis fields for evidence confidence and manual verification', () => {
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
        label: 'Instagram',
        url: 'https://www.instagram.com/jamiebling/',
        title: 'Jamie Hart Jewelry | Instagram',
        description: 'Live reminders and replay clips.',
        canonicalUrl: 'https://www.instagram.com/jamiebling/',
        outboundLinks: ['https://shop.jamiehartjewelry.com'],
        primaryOutboundLink: 'https://shop.jamiehartjewelry.com',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      },
      {
        label: 'Primary customer link',
        url: 'https://jamiehartjewelry.com/live',
        title: 'Jamie Hart Jewelry Live Shop',
        description: 'Shop the current live reveal board.',
        canonicalUrl: 'https://jamiehartjewelry.com/live',
        outboundLinks: [],
        primaryOutboundLink: null,
        primaryOutboundLinkReason: null,
        publicActionCandidates: [
          {
            sourceLabel: 'Primary customer link',
            sourceUrl: 'https://jamiehartjewelry.com/live',
            text: 'Shop tonight live show',
            url: 'https://jamiehartjewelry.com/live/show',
            actionType: 'live_show',
          },
          {
            sourceLabel: 'Primary customer link',
            sourceUrl: 'https://jamiehartjewelry.com/live',
            text: 'Join VIP text list',
            url: 'https://vip.example.com/join',
            actionType: 'vip_text',
          },
        ],
      },
    ])

    expect(output.researchSynthesis.confidence).toBe('high')
    expect(output.researchSynthesis.evidenceBackedObservations).toContain(
      'Live jewelry sales and trade night clips.',
    )
    expect(output.researchSynthesis.manualVerificationNeeded).toContain(
      'Confirm the direct customer-link page still matches the public profile promise.',
    )
    expect(output.researchSynthesis.manualVerificationNeeded).toContain(
      'Confirm which visible public CTA should become the primary Sparkle Suite action.',
    )
    expect(output.researchSynthesis.evidenceBackedObservations).toContain(
      'Visible public CTAs include live show and VIP text actions.',
    )
    expect(output.researchSynthesis.contradictions).toContain(
      'Multiple public profiles point to different direct customer links: https://jamiehartjewelry.com/live, https://shop.jamiehartjewelry.com.',
    )
  })

  it('names the strongest visible public CTA from captured action candidates', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'Public link hub',
        url: 'https://linktr.ee/jamieh',
        title: 'Jamie Hart Links',
        description: 'Shop live boards, join the VIP list, and follow socials.',
        canonicalUrl: 'https://linktr.ee/jamieh',
        outboundLinks: [
          'https://instagram.com/jamiebling',
          'https://vip.example.com/join',
          'https://jamiehartjewelry.com/shop',
        ],
        primaryOutboundLink: 'https://jamiehartjewelry.com/shop',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
        publicActionCandidates: [
          {
            sourceLabel: 'Public link hub',
            sourceUrl: 'https://linktr.ee/jamieh',
            text: 'Follow on Instagram',
            url: 'https://instagram.com/jamiebling',
            actionType: 'social',
          },
          {
            sourceLabel: 'Public link hub',
            sourceUrl: 'https://linktr.ee/jamieh',
            text: 'Join VIP text list',
            url: 'https://vip.example.com/join',
            actionType: 'vip_text',
          },
          {
            sourceLabel: 'Public link hub',
            sourceUrl: 'https://linktr.ee/jamieh',
            text: 'Shop live board',
            url: 'https://jamiehartjewelry.com/shop',
            actionType: 'shop',
          },
        ],
      },
    ])

    expect(output.researchSynthesis.evidenceBackedObservations).toContain(
      'Visible primary CTA appears to be "Shop live board" at https://jamiehartjewelry.com/shop.',
    )
    expect(output.researchSynthesis.manualVerificationNeeded).toContain(
      'Confirm whether "Shop live board" should become the primary Sparkle Suite CTA.',
    )
    expect(output.suggestedQuestions).toContain(
      'Should "Shop live board" be the main Sparkle Suite call to action?',
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

  it('keeps a hub-first funnel when link-hub evidence exposes direct destinations', () => {
    const output = buildPrelaunchScoutOutput(submission, [], [
      {
        label: 'TikTok',
        url: 'https://www.tiktok.com/@jamieh',
        title: 'Jamie Hart Jewelry | TikTok',
        description: 'Live jewelry sales and trade night clips.',
        canonicalUrl: 'https://www.tiktok.com/@jamieh',
        outboundLinks: ['https://linktr.ee/jamieh'],
        primaryOutboundLink: 'https://linktr.ee/jamieh',
        primaryOutboundLinkReason:
          'Only a generic link hub was visible publicly, so that is the current likely customer path.',
      },
      {
        label: 'Public link hub',
        url: 'https://linktr.ee/jamieh',
        title: 'Jamie Hart Links',
        description: 'Shop live boards and join VIP text updates.',
        canonicalUrl: 'https://linktr.ee/jamieh',
        outboundLinks: ['https://jamiehartjewelry.com/live'],
        primaryOutboundLink: 'https://jamiehartjewelry.com/live',
        primaryOutboundLinkReason:
          'Direct brand or shop links are more likely the real customer action than a generic link hub.',
      },
    ])

    expect(output.publicFunnel).toEqual({
      shape: 'hub_first',
      summary:
        'The visible public path depends on a generic link hub before customers reach a specific action.',
      primaryLinks: [
        'https://linktr.ee/jamieh',
        'https://jamiehartjewelry.com/live',
      ],
      concerns: [
        'Confirm which hub destination should become the main Sparkle Suite call to action.',
      ],
    })
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
        evidenceBackedObservations: [
          'The profile headline and customer-link page both point to live-show shopping.',
        ],
        manualVerificationNeeded: [
          'Confirm whether the live board is still the main customer action.',
        ],
        contradictions: [
          'TikTok and Instagram appear to point to different public links.',
        ],
        confidence: 'medium',
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
          publicActionCandidates: [
            {
              sourceLabel: 'TikTok',
              sourceUrl: 'https://www.tiktok.com/@jamieh',
              text: 'Join VIP text list',
              url: 'https://vip.example.com/join',
              actionType: 'vip_text',
            },
          ],
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
    expect(generateTextMock.mock.calls[0]?.[0].prompt).toContain(
      'publicActions: [vip_text] Join VIP text list -> https://vip.example.com/join',
    )
    expect(synthesis).toMatchObject({
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
      contradictions: [
        'TikTok and Instagram appear to point to different public links.',
      ],
      confidence: 'medium',
    })
    expect(synthesis.evidenceBackedObservations).toEqual(
      expect.arrayContaining([
        'The profile headline and customer-link page both point to live-show shopping.',
        'Live reveals every Tuesday',
      ]),
    )
    expect(synthesis.manualVerificationNeeded).toEqual(
      expect.arrayContaining([
        'Confirm whether the live board is still the main customer action.',
        'Confirm which visible public CTA should become the primary Sparkle Suite action.',
      ]),
    )
  })

  it('preserves grounded CTA evidence when model-backed synthesis omits it', async () => {
    const generateTextMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        discoveryAngle:
          'The public path is usable, but Louis should still confirm which customer action matters most.',
        summaryBullets: [
          'The profile gives Scout a starting point for the discovery call.',
        ],
        followUpQuestions: [
          'Which customer action should Sparkle Suite make easiest to reach?',
        ],
        evidenceBackedObservations: [],
        manualVerificationNeeded: [],
        contradictions: [],
        confidence: 'medium',
      }),
    })

    const synthesis = await synthesizePrelaunchScoutEvidence(
      submission,
      [
        {
          label: 'Primary customer link',
          url: 'https://jamiehartjewelry.com/live',
          title: 'Jamie Hart Jewelry Live Shop',
          description: 'Shop tonight live board and join VIP text updates.',
          canonicalUrl: 'https://jamiehartjewelry.com/live',
          evidenceSnippets: [
            'Claim favorites before the next show',
            'Live reveals every Tuesday',
            'Replay winners posted weekly',
          ],
          outboundLinks: [],
          primaryOutboundLink: null,
          primaryOutboundLinkReason: null,
          publicActionCandidates: [
            {
              sourceLabel: 'Primary customer link',
              sourceUrl: 'https://jamiehartjewelry.com/live',
              text: 'Shop tonight live show',
              url: 'https://jamiehartjewelry.com/live/show',
              actionType: 'live_show',
            },
            {
              sourceLabel: 'Primary customer link',
              sourceUrl: 'https://jamiehartjewelry.com/live',
              text: 'Join VIP text list',
              url: 'https://vip.example.com/join',
              actionType: 'vip_text',
            },
          ],
        },
      ],
      {
        generateTextImpl: generateTextMock,
      },
    )

    expect(synthesis.status).toBe('model_generated')
    expect(synthesis.discoveryAngle).toContain('public path is usable')
    expect(synthesis.evidenceBackedObservations).toContain(
      'Visible public CTAs include live show and VIP text actions.',
    )
    expect(synthesis.manualVerificationNeeded).toContain(
      'Confirm which visible public CTA should become the primary Sparkle Suite action.',
    )
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
          synthesis_confidence: 'low',
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
