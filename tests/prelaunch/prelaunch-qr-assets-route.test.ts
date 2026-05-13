import { beforeEach, describe, expect, it } from 'vitest'

import { GET } from '@/app/api/prelaunch/qr-assets/route'

describe('GET /api/prelaunch/qr-assets', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  it('returns the approved QR flyer manifest and canonical target URL', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://staging.yoursparklesuite.com/'

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      ok: true,
      campaign: {
        id: 'sparkle_suite_prelaunch_waitlist_qr',
        source: 'sparkle_suite_qr',
        medium: 'flyer',
        campaign: 'prelaunch_waitlist',
        content: 'tiktok_brand_image_v1',
      },
      targetUrl:
        'https://staging.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
      displayUrl: 'www.yoursparklesuite.com/prelaunch',
      qrMode: 'approved_static_flyer_with_embedded_qr',
      provider: 'none',
      requiresExternalQrProvider: false,
      approvedFlyer: {
        path: '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png',
        status: 'approved',
        contentType: 'image/png',
        altText:
          'Sparkle Suite waitlist QR flyer using the approved public prelaunch brand.',
        sourceOfTruth: [
          'docs/sparkle-suite/brand/08-production-site-design-kit.md',
          'docs/sparkle-suite/brand/09-social-asset-status.md',
        ],
      },
      verificationSteps: [
        'Use the approved static flyer PNG only.',
        'Scan the embedded QR and confirm it lands on the canonical waitlist target.',
        'Confirm the URL includes the approved QR campaign parameters and #waitlist anchor.',
      ],
      blockedActions: [
        'Do not generate a new QR image in this app yet.',
        'Do not call an external QR provider from production code.',
        'Do not revive retired HTML or code-based flyer experiments.',
      ],
      retiredAssetPolicy:
        'Do not use older code-based flyer experiments or superseded QR exports for new public promotion.',
    })
  })
})
