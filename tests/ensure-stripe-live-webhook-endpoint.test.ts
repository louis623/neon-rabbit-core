import { describe, expect, it, vi } from 'vitest'

import {
  ensureStripeLiveWebhookEndpoint,
  normalizeStripeLiveWebhookTargetUrl,
  STRIPE_LIVE_WEBHOOK_EVENTS,
  validateStripeLiveWebhookOptions,
  type StripeLiveWebhookEndpointClient,
} from '@/scripts/ensure-stripe-live-webhook-endpoint'

function createClient(
  endpoints: Array<{
    id: string
    url: string
    status: string | null
    enabled_events: string[]
    secret?: string | null
  }> = [],
): StripeLiveWebhookEndpointClient & {
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
} {
  return {
    list: vi.fn(async () => ({ data: endpoints })),
    create: vi.fn(async (input) => ({
      id: 'we_live_created',
      url: input.url,
      status: 'enabled',
      enabled_events: input.enabled_events,
      secret: 'whsec_live_created_secret',
    })),
    update: vi.fn(async (id, input) => ({
      id,
      url: endpoints[0]?.url ?? 'https://www.yoursparklesuite.com/api/stripe/webhook',
      status: 'enabled',
      enabled_events: input.enabled_events,
      secret: null,
    })),
  }
}

describe('ensure Stripe live webhook endpoint', () => {
  it('subscribes to checkout expiration events for unpaid founder reservation cleanup', () => {
    expect(STRIPE_LIVE_WEBHOOK_EVENTS).toContain('checkout.session.expired')
  })

  it('normalizes app origins to the Stripe webhook route', () => {
    expect(normalizeStripeLiveWebhookTargetUrl('https://www.yoursparklesuite.com')).toBe(
      'https://www.yoursparklesuite.com/api/stripe/webhook',
    )
  })

  it('dry-runs a missing live endpoint without creating provider config', async () => {
    const client = createClient()

    const result = await ensureStripeLiveWebhookEndpoint(client, {
      targetUrl: 'https://www.yoursparklesuite.com',
      apply: false,
    })

    expect(client.create).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      ok: false,
      mode: 'dry_run',
      action: 'create',
      endpointMatched: false,
      endpointStatus: null,
      targetHost: 'www.yoursparklesuite.com',
      secretAvailable: false,
      secretWritten: false,
    })
    expect(result.missingEvents).toEqual([...STRIPE_LIVE_WEBHOOK_EVENTS])
  })

  it('requires approval before creating or updating a live endpoint', () => {
    expect(
      validateStripeLiveWebhookOptions({
        targetUrl: 'https://www.yoursparklesuite.com',
        apply: true,
      }),
    ).toEqual([
      'STRIPE_LIVE_WEBHOOK_APPROVED_AT or --approved-at is required before creating or updating live webhook endpoints.',
    ])
  })

  it('creates a live endpoint after approval without exposing the secret', async () => {
    const client = createClient()

    const result = await ensureStripeLiveWebhookEndpoint(client, {
      targetUrl: 'https://www.yoursparklesuite.com',
      apply: true,
      approvedAt: '2026-05-19T22:00:00Z',
      now: new Date('2026-05-19T22:00:00.000Z'),
    })

    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://www.yoursparklesuite.com/api/stripe/webhook',
        enabled_events: [...STRIPE_LIVE_WEBHOOK_EVENTS],
        description: 'Sparkle Suite production live webhook',
        metadata: expect.objectContaining({
          platform: 'sparkle_suite',
          live_launch: 'true',
          approved_at: '2026-05-19T22:00:00Z',
        }),
      }),
    )
    expect(JSON.stringify(result)).not.toContain('whsec_live_created_secret')
    expect(result).toMatchObject({
      ok: true,
      mode: 'apply',
      action: 'create',
      endpointMatched: true,
      endpointStatus: 'enabled',
      missingEvents: [],
      secretAvailable: true,
      secretWritten: false,
    })
  })

  it('updates an existing live endpoint when required events are missing', async () => {
    const client = createClient([
      {
        id: 'we_live_existing',
        url: 'https://www.yoursparklesuite.com/api/stripe/webhook',
        status: 'enabled',
        enabled_events: ['checkout.session.completed'],
      },
    ])

    const result = await ensureStripeLiveWebhookEndpoint(client, {
      targetUrl: 'https://www.yoursparklesuite.com',
      apply: true,
      approvedAt: '2026-05-19T22:00:00Z',
    })

    expect(client.update).toHaveBeenCalledWith(
      'we_live_existing',
      expect.objectContaining({
        enabled_events: expect.arrayContaining([...STRIPE_LIVE_WEBHOOK_EVENTS]),
      }),
    )
    expect(result).toMatchObject({
      ok: true,
      action: 'update',
      missingEvents: [],
      endpointMatched: true,
    })
  })
})
