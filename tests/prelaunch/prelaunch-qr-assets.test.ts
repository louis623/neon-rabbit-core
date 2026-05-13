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

  it('normalizes app URLs to the origin before adding the QR target path', () => {
    expect(
      buildPrelaunchQrTargetUrl({
        baseUrl: 'https://preview.yoursparklesuite.com/internal/path?debug=true',
      }),
    ).toBe(
      'https://preview.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
    )
  })

  it('falls back to production when the app URL is invalid', () => {
    expect(buildPrelaunchQrTargetUrl({ baseUrl: 'not a url' })).toBe(
      'https://www.yoursparklesuite.com/prelaunch?utm_source=sparkle_suite_qr&utm_medium=flyer&utm_campaign=prelaunch_waitlist&utm_content=tiktok_brand_image_v1#waitlist',
    )
  })

  it('locks automation to the approved image-first flyer asset', () => {
    const manifest = getApprovedPrelaunchQrManifest({
      baseUrl: 'https://preview.yoursparklesuite.com',
    })

    expect(manifest.qrMode).toBe('approved_static_flyer_with_embedded_qr')
    expect(manifest.provider).toBe('none')
    expect(manifest.requiresExternalQrProvider).toBe(false)
    expect(manifest.displayUrl).toBe('www.yoursparklesuite.com/prelaunch')
    expect(manifest.approvedFlyer.path).toBe(
      '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png',
    )
    expect(manifest.approvedFlyer.path).toBe(
      APPROVED_PRELAUNCH_QR_FLYER_ASSET_PATH,
    )
    expect(manifest.approvedFlyer.status).toBe('approved')
    expect(manifest.approvedFlyer.contentType).toBe('image/png')
    expect(manifest.verificationSteps).toEqual([
      'Use the approved static flyer PNG only.',
      'Scan the embedded QR and confirm it lands on the canonical waitlist target.',
      'Confirm the URL includes the approved QR campaign parameters and #waitlist anchor.',
    ])
    expect(manifest.blockedActions).toEqual([
      'Do not generate a new QR image in this app yet.',
      'Do not call an external QR provider from production code.',
      'Do not revive retired HTML or code-based flyer experiments.',
    ])
    expect(manifest.retiredAssetPolicy).toContain('Do not use older')
    expect(JSON.stringify(manifest)).not.toContain(
      'sparkle-suite-qr-flyer-example-one',
    )
    expect(JSON.stringify(manifest)).not.toContain('api.qrserver.com')
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
