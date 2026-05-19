import { describe, expect, it, vi } from 'vitest'

import {
  ensureStripeTestWebhookEndpoint,
  normalizeStripeWebhookTargetUrl,
  STRIPE_TEST_WEBHOOK_EVENTS,
  type StripeWebhookEndpointClient,
} from '@/scripts/ensure-stripe-test-webhook-endpoint'

function createClient(
  endpoints: Array<{
    id: string
    url: string
    status: string | null
    enabled_events: string[]
    secret?: string | null
  }> = [],
): StripeWebhookEndpointClient & {
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
} {
  return {
    list: vi.fn(async () => ({ data: endpoints })),
    create: vi.fn(async (input) => ({
      id: 'we_created',
      url: input.url,
      status: 'enabled',
      enabled_events: input.enabled_events,
      secret: 'whsec_created_secret',
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

describe('ensure Stripe test webhook endpoint', () => {
  it('normalizes app origins to the Stripe webhook route', () => {
    expect(normalizeStripeWebhookTargetUrl('https://www.yoursparklesuite.com')).toBe(
      'https://www.yoursparklesuite.com/api/stripe/webhook',
    )
    expect(
      normalizeStripeWebhookTargetUrl(
        'https://www.yoursparklesuite.com/api/stripe/webhook',
      ),
    ).toBe('https://www.yoursparklesuite.com/api/stripe/webhook')
  })

  it('dry-runs a missing endpoint without creating provider config', async () => {
    const client = createClient()

    const result = await ensureStripeTestWebhookEndpoint(client, {
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
    expect(result.missingEvents).toEqual([...STRIPE_TEST_WEBHOOK_EVENTS])
  })

  it('creates a test endpoint and reports secret file status without exposing the secret', async () => {
    const client = createClient()

    const result = await ensureStripeTestWebhookEndpoint(client, {
      targetUrl: 'https://www.yoursparklesuite.com',
      apply: true,
      now: new Date('2026-05-19T19:30:00.000Z'),
    })

    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://www.yoursparklesuite.com/api/stripe/webhook',
        enabled_events: [...STRIPE_TEST_WEBHOOK_EVENTS],
        metadata: expect.objectContaining({
          platform: 'sparkle_suite',
          launch_path: 'true',
        }),
      }),
    )
    expect(JSON.stringify(result)).not.toContain('whsec_created_secret')
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

  it('updates an existing endpoint when required events are missing', async () => {
    const client = createClient([
      {
        id: 'we_existing',
        url: 'https://www.yoursparklesuite.com/api/stripe/webhook',
        status: 'enabled',
        enabled_events: ['checkout.session.completed'],
      },
    ])

    const result = await ensureStripeTestWebhookEndpoint(client, {
      targetUrl: 'https://www.yoursparklesuite.com',
      apply: true,
    })

    expect(client.update).toHaveBeenCalledWith(
      'we_existing',
      expect.objectContaining({
        enabled_events: expect.arrayContaining([...STRIPE_TEST_WEBHOOK_EVENTS]),
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
