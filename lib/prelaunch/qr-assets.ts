export const APPROVED_PRELAUNCH_QR_FLYER_ASSET_PATH =
  '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png'

const DEFAULT_PRELAUNCH_BASE_URL = 'https://www.yoursparklesuite.com'

const QR_CAMPAIGN = {
  id: 'sparkle_suite_prelaunch_waitlist_qr',
  source: 'sparkle_suite_qr',
  medium: 'flyer',
  campaign: 'prelaunch_waitlist',
  content: 'tiktok_brand_image_v1',
} as const

interface PrelaunchQrTargetOptions {
  baseUrl?: string | null
}

function normalizeBaseUrl(baseUrl?: string | null) {
  const value = baseUrl?.trim() || DEFAULT_PRELAUNCH_BASE_URL

  try {
    return new URL(value).origin
  } catch {
    return DEFAULT_PRELAUNCH_BASE_URL
  }
}

export function buildPrelaunchQrTargetUrl({
  baseUrl,
}: PrelaunchQrTargetOptions = {}) {
  const url = new URL('/prelaunch', normalizeBaseUrl(baseUrl))
  url.searchParams.set('utm_source', QR_CAMPAIGN.source)
  url.searchParams.set('utm_medium', QR_CAMPAIGN.medium)
  url.searchParams.set('utm_campaign', QR_CAMPAIGN.campaign)
  url.searchParams.set('utm_content', QR_CAMPAIGN.content)
  url.hash = 'waitlist'

  return url.toString()
}

export function getApprovedPrelaunchQrManifest({
  baseUrl,
}: PrelaunchQrTargetOptions = {}) {
  return {
    campaign: QR_CAMPAIGN,
    targetUrl: buildPrelaunchQrTargetUrl({ baseUrl }),
    approvedFlyer: {
      path: APPROVED_PRELAUNCH_QR_FLYER_ASSET_PATH,
      status: 'approved',
      altText:
        'Sparkle Suite waitlist QR flyer using the approved public prelaunch brand.',
      sourceOfTruth: [
        'docs/sparkle-suite/brand/08-production-site-design-kit.md',
        'docs/sparkle-suite/brand/09-social-asset-status.md',
      ],
    },
    retiredAssetPolicy:
      'Do not use older code-based flyer experiments or superseded QR exports for new public promotion.',
  }
}
