import { beforeEach, describe, expect, it } from 'vitest'

import { GET } from '@/app/api/prelaunch/health/route'

const envKeys = [
  'NEXT_PUBLIC_APP_URL',
  'SIGNWELL_API_KEY',
  'SIGNWELL_API_BASE_URL',
  'SIGNWELL_TEMPLATE_ID',
  'STRIPE_PRICE_START_WORK_FEE',
  'STRIPE_PRICE_LAUNCH_FEE',
] as const

function clearEnv() {
  for (const key of envKeys) {
    delete process.env[key]
  }
}

describe('GET /api/prelaunch/health', () => {
  beforeEach(() => {
    clearEnv()
  })

  it('returns a safe readiness snapshot without configured provider secrets', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: 'sparkle-suite-prelaunch',
      status: 'ready',
      readiness: {
        liveActionsEnabled: false,
        qrAssets: {
          approvedFlyerPath:
            '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png',
          targetUrl:
            'https://www.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
        },
        gates: [
          {
            key: 'agreement',
            label: 'Agreement gate',
            status: 'blocked',
            displayStatus: 'SignWell not configured',
            detail:
              'Agreement sending is disabled until SignWell config is complete.',
          },
          {
            key: 'start_work_fee',
            label: 'Start work fee',
            status: 'blocked',
            displayStatus: 'Stripe price missing',
            detail:
              'Checkout is disabled until the start-work price is configured.',
          },
          {
            key: 'launch_fee',
            label: 'Launch fee',
            status: 'blocked',
            displayStatus: 'Stripe price missing',
            detail:
              'Checkout is disabled until the launch-fee price is configured.',
          },
        ],
      },
    })
  })

  it('reports configured gates without exposing SignWell keys or Stripe price IDs', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://staging.yoursparklesuite.com'
    process.env.SIGNWELL_API_KEY = 'secret_signwell_key'
    process.env.SIGNWELL_API_BASE_URL = 'https://www.signwell.com/api/v1'
    process.env.SIGNWELL_TEMPLATE_ID = 'template_secret_123'
    process.env.STRIPE_PRICE_START_WORK_FEE = 'price_secret_start'
    process.env.STRIPE_PRICE_LAUNCH_FEE = 'price_secret_launch'

    const response = await GET()
    const payload = await response.json()
    const serializedPayload = JSON.stringify(payload)

    expect(payload.readiness.liveActionsEnabled).toBe(false)
    expect(payload.readiness.qrAssets.targetUrl).toBe(
      'https://staging.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
    )
    expect(payload.readiness.gates).toEqual([
      expect.objectContaining({
        key: 'agreement',
        status: 'disabled',
        displayStatus: 'Send not enabled',
      }),
      expect.objectContaining({
        key: 'start_work_fee',
        status: 'disabled',
        displayStatus: 'Checkout not enabled',
      }),
      expect.objectContaining({
        key: 'launch_fee',
        status: 'disabled',
        displayStatus: 'Checkout not enabled',
      }),
    ])
    expect(serializedPayload).not.toContain('secret_signwell_key')
    expect(serializedPayload).not.toContain('template_secret_123')
    expect(serializedPayload).not.toContain('price_secret_start')
    expect(serializedPayload).not.toContain('price_secret_launch')
  })
})
