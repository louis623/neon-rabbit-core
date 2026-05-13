import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  APPROVED_PRELAUNCH_QR_FLYER_ASSET_PATH,
  buildPrelaunchQrTargetUrl,
  getApprovedPrelaunchQrManifest,
} from '@/lib/prelaunch/qr-assets'

describe('prelaunch QR assets', () => {
  it('builds the canonical waitlist QR target with campaign tracking', () => {
    expect(
      buildPrelaunchQrTargetUrl({
        baseUrl: 'https://www.yoursparklesuite.com/',
      }),
    ).toBe(
      'https://www.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
    )
  })

  it('falls back to the production prelaunch URL when the app URL is missing', () => {
    expect(buildPrelaunchQrTargetUrl({ baseUrl: '' })).toBe(
      'https://www.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
    )
  })

  it('locks automation to the approved image-first flyer asset', () => {
    const manifest = getApprovedPrelaunchQrManifest({
      baseUrl: 'https://preview.yoursparklesuite.com',
    })

    expect(manifest.approvedFlyer.path).toBe(
      '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png',
    )
    expect(manifest.approvedFlyer.path).toBe(
      APPROVED_PRELAUNCH_QR_FLYER_ASSET_PATH,
    )
    expect(manifest.approvedFlyer.status).toBe('approved')
    expect(manifest.retiredAssetPolicy).toContain('Do not use older')
    expect(JSON.stringify(manifest)).not.toContain(
      'sparkle-suite-qr-flyer-example-one',
    )
  })

  it('points at an asset that exists in public exports', () => {
    const absoluteAssetPath = join(
      process.cwd(),
      'public',
      APPROVED_PRELAUNCH_QR_FLYER_ASSET_PATH.slice(1),
    )

    expect(existsSync(absoluteAssetPath)).toBe(true)
  })
})
