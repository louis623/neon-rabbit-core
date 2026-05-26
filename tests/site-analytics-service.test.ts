import { describe, expect, it, vi } from 'vitest'
import {
  captureSiteAnalyticsEvent,
  getSiteAnalyticsCaptureConfig,
} from '@/lib/services/site-analytics'

describe('site analytics service adapter boundary', () => {
  it('stays disabled by default without exposing PostHog secrets', () => {
    const config = getSiteAnalyticsCaptureConfig({
      NEXT_PUBLIC_POSTHOG_KEY: 'phc_secret_demo_key',
      NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
    })

    expect(config).toEqual({
      enabled: false,
      provider: 'posthog',
      hostConfigured: true,
      privacy: {
        disablesIpCapture: true,
        masksSensitiveInputs: true,
        identifiesAfterLoginOnly: true,
      },
    })
    expect(JSON.stringify(config)).not.toContain('phc_secret_demo_key')
  })

  it('skips capture when disabled even when an adapter is injected', async () => {
    const adapter = { capture: vi.fn() }

    const result = await captureSiteAnalyticsEvent({
      adapter,
      config: { enabled: false, provider: 'posthog' },
      event: {
        name: 'customer_site_viewed',
        distinctId: 'rep:demo',
        properties: { path: '/shop', source: 'tiktok' },
      },
    })

    expect(result).toEqual({
      captured: false,
      provider: 'posthog',
      reason: 'disabled',
    })
    expect(adapter.capture).not.toHaveBeenCalled()
  })

  it('captures safe events through an injected adapter when explicitly enabled', async () => {
    const adapter = { capture: vi.fn().mockResolvedValue(undefined) }

    const result = await captureSiteAnalyticsEvent({
      adapter,
      config: { enabled: true, provider: 'posthog' },
      event: {
        name: 'customer_site_viewed',
        distinctId: 'rep:demo',
        properties: { path: '/shop', source: 'tiktok', pageViews: 3 },
      },
    })

    expect(adapter.capture).toHaveBeenCalledWith({
      name: 'customer_site_viewed',
      distinctId: 'rep:demo',
      properties: { path: '/shop', source: 'tiktok', pageViews: 3 },
    })
    expect(result).toEqual({
      captured: true,
      provider: 'posthog',
    })
  })

  it('rejects PII-ish analytics payloads without echoing values', async () => {
    const adapter = { capture: vi.fn() }

    await expect(
      captureSiteAnalyticsEvent({
        adapter,
        config: { enabled: true, provider: 'posthog' },
        event: {
          name: 'customer_site_viewed',
          distinctId: 'rep:demo',
          properties: {
            path: '/shop',
            email: 'lead@example.com',
            posthogSecret: 'phc_secret_demo_key',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'SITE_ANALYTICS_PII_BLOCKED',
      userMessage: 'That analytics event was blocked before capture.',
    })

    expect(adapter.capture).not.toHaveBeenCalled()
  })
})
