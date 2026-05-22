import { createAdminClient } from '@/lib/supabase/admin'
import {
  getSiteSettingsDashboard,
} from '@/lib/services/site-settings'
import type { SiteSettingsDashboardResult } from '@/lib/services/types'
import {
  defaultAmethystHomepageTemplateData,
  type AmethystHomepageTemplateData,
} from './homepage-template-data'
import {
  defaultAmethystJoinTemplateData,
  type AmethystJoinTemplateData,
} from './join-template-data'
import { resolveAmethystPreviewRep } from './preview-rep'
import {
  defaultAmethystTradeTemplateData,
  type AmethystTradeTemplateData,
} from './trade-template-data'

interface PreviewTemplateDataDependencies {
  createAdminClient?: typeof createAdminClient
  resolveAmethystPreviewRep?: typeof resolveAmethystPreviewRep
  getSiteSettingsDashboard?: typeof getSiteSettingsDashboard
}

interface LoadPreviewTemplateDataOptions {
  env?: Record<string, string | undefined>
  dependencies?: PreviewTemplateDataDependencies
}

interface PreviewRepExtras {
  shopLink?: string | null
  streamingLinks?: unknown
}

export interface AmethystPreviewTemplateData {
  homepage: AmethystHomepageTemplateData
  trade: AmethystTradeTemplateData
  join: AmethystJoinTemplateData
}

const defaultPreviewTemplateData: AmethystPreviewTemplateData = {
  homepage: defaultAmethystHomepageTemplateData,
  trade: defaultAmethystTradeTemplateData,
  join: defaultAmethystJoinTemplateData,
}

function clean(value: string | null | undefined) {
  return value?.trim() || ''
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleaned = clean(value)
    if (cleaned) return cleaned
  }

  return ''
}

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, link]) => [key, typeof link === 'string' ? link.trim() : ''])
      .filter(([, link]) => link.length > 0),
  )
}

function normalizeSocialUrl(label: string, value: string | undefined) {
  const cleaned = clean(value)
  if (!cleaned) return '#'
  if (/^https?:\/\//.test(cleaned)) return cleaned

  const handle = cleaned.replace(/^@/, '')
  if (label === 'tiktok') return `https://www.tiktok.com/@${handle}`
  if (label === 'instagram') return `https://www.instagram.com/${handle}`
  if (label === 'facebook') return `https://www.facebook.com/${handle}`
  return cleaned
}

function buildTicker(settings: SiteSettingsDashboardResult, fallback: string) {
  const parts = [
    settings.bannerVisible ? settings.bannerText : '',
    settings.tickerVisible ? settings.tickerText : '',
  ].filter((value) => clean(value).length > 0)

  return parts.length > 0 ? parts.join(' | ') : fallback
}

function buildSocialLinks(settings: SiteSettingsDashboardResult) {
  return [
    {
      label: 'TikTok',
      shortLabel: 'TT',
      href: normalizeSocialUrl('tiktok', settings.socialHandles.tiktok),
    },
    {
      label: 'Facebook',
      shortLabel: 'FB',
      href: normalizeSocialUrl('facebook', settings.socialHandles.facebook),
    },
    {
      label: 'Instagram',
      shortLabel: 'IG',
      href: normalizeSocialUrl('instagram', settings.socialHandles.instagram),
    },
    {
      label: 'YouTube',
      shortLabel: 'YT',
      href: normalizeSocialUrl('youtube', settings.socialHandles.youtube),
    },
  ] satisfies [
    { label: string; shortLabel: string; href: string },
    { label: string; shortLabel: string; href: string },
    { label: string; shortLabel: string; href: string },
    { label: string; shortLabel: string; href: string },
  ]
}

function resolveShopUrl(extras: PreviewRepExtras) {
  return clean(extras.shopLink) || 'https://bombparty.com'
}

function resolveStreamingLinks(settings: SiteSettingsDashboardResult, extras: PreviewRepExtras) {
  const links = asRecord(extras.streamingLinks)

  return {
    shop: resolveShopUrl(extras),
    watch:
      links.tiktok ||
      links.facebook ||
      normalizeSocialUrl('tiktok', settings.socialHandles.tiktok),
    tiktok: links.tiktok || normalizeSocialUrl('tiktok', settings.socialHandles.tiktok),
    facebook:
      links.facebook || normalizeSocialUrl('facebook', settings.socialHandles.facebook),
  }
}

function buildLegalDisclaimer(businessName: string, context: 'homepage' | 'trade' | 'join') {
  const tradeNote =
    context === 'trade'
      ? ' Trades are private agreements between the customer and the rep.'
      : ''

  return `${businessName} is operated by an independent Bomb Party Representative. Bomb Party is a registered trademark of Bomb Party LLC. This site is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bomb Party LLC.${tradeNote}`
}

export function mapPreviewSettingsToHomepageTemplateData(
  settings: SiteSettingsDashboardResult,
  extras: PreviewRepExtras = {},
): AmethystHomepageTemplateData {
  const repName = firstText(settings.displayName, defaultAmethystHomepageTemplateData.repName)
  const businessName = firstText(
    settings.businessName,
    defaultAmethystHomepageTemplateData.businessName,
  )
  const tagline = firstText(settings.tagline, defaultAmethystHomepageTemplateData.tagline)
  const streamLinks = resolveStreamingLinks(settings, extras)

  return {
    ...defaultAmethystHomepageTemplateData,
    repName,
    businessName,
    teamName: firstText(settings.teamName, defaultAmethystHomepageTemplateData.teamName),
    tagline,
    heroSub: `I'm ${repName} - join me for live reveals, favorite finds, and customer-first sparkle.`,
    tickerTopText: buildTicker(
      settings,
      defaultAmethystHomepageTemplateData.tickerTopText,
    ),
    aboutHeadline: `Meet ${repName} and the story behind ${businessName}.`,
    signupSub: `Get a heads-up when ${repName} goes live, plus first dibs on new drops.`,
    signupConsent: `Choose SMS, email, or both. Marketing consent stays separate from reminders and updates from ${businessName}. Msg & data rates may apply. Reply STOP to unsubscribe.`,
    footerTagline: tagline,
    legalDisclaimer: buildLegalDisclaimer(businessName, 'homepage'),
    streamLinks,
    socialLinks: buildSocialLinks(settings),
    footerLinks: {
      ...defaultAmethystHomepageTemplateData.footerLinks,
      catalog: streamLinks.shop,
      preOrders: streamLinks.shop,
    },
  }
}

export function mapPreviewSettingsToTradeTemplateData(
  settings: SiteSettingsDashboardResult,
  extras: PreviewRepExtras = {},
): AmethystTradeTemplateData {
  const businessName = firstText(
    settings.businessName,
    defaultAmethystTradeTemplateData.businessName,
  )
  const shopUrl = resolveShopUrl(extras)

  return {
    ...defaultAmethystTradeTemplateData,
    repName: firstText(settings.displayName, defaultAmethystTradeTemplateData.repName),
    businessName,
    tickerTopText: buildTicker(settings, defaultAmethystTradeTemplateData.tickerTopText),
    shopUrl,
    footerTagline: firstText(settings.tagline, defaultAmethystTradeTemplateData.footerTagline),
    legalDisclaimer: buildLegalDisclaimer(businessName, 'trade'),
    socialLinks: buildSocialLinks(settings),
    footerLinks: {
      ...defaultAmethystTradeTemplateData.footerLinks,
      catalog: shopUrl,
      preOrders: shopUrl,
    },
  }
}

export function mapPreviewSettingsToJoinTemplateData(
  settings: SiteSettingsDashboardResult,
  extras: PreviewRepExtras = {},
): AmethystJoinTemplateData {
  const repName = firstText(settings.displayName, defaultAmethystJoinTemplateData.repName)
  const businessName = firstText(
    settings.businessName,
    defaultAmethystJoinTemplateData.businessName,
  )
  const teamName = firstText(settings.teamName, defaultAmethystJoinTemplateData.teamName)
  const shopUrl = resolveShopUrl(extras)

  return {
    ...defaultAmethystJoinTemplateData,
    repName,
    businessName,
    teamName,
    heroPitch: `Join ${teamName} with ${repName}. Build your Bomb Party business with a clear live-show path, support, and a Sparkle Suite-ready customer hub.`,
    finalPitch: `Pick your starter pack, follow the steps on Bomb Party, and connect with ${repName} for the next onboarding step.`,
    bpReferralUrl: shopUrl,
    tickerTopText: buildTicker(settings, defaultAmethystJoinTemplateData.tickerTopText),
    shopUrl,
    footerTagline: firstText(settings.tagline, defaultAmethystJoinTemplateData.footerTagline),
    legalDisclaimer: buildLegalDisclaimer(businessName, 'join'),
    repSocialLinks: {
      tiktok: normalizeSocialUrl('tiktok', settings.socialHandles.tiktok),
      website: shopUrl,
      youtube: normalizeSocialUrl('youtube', settings.socialHandles.youtube),
    },
    socialLinks: buildSocialLinks(settings),
    footerLinks: {
      ...defaultAmethystJoinTemplateData.footerLinks,
      catalog: shopUrl,
      preOrders: shopUrl,
    },
  }
}

function canLoadPreviewData(env: Record<string, string | undefined>) {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function loadAmethystPreviewTemplateData(
  options: LoadPreviewTemplateDataOptions = {},
): Promise<AmethystPreviewTemplateData> {
  const env = options.env ?? process.env
  if (!canLoadPreviewData(env)) return defaultPreviewTemplateData

  const dependencies = options.dependencies ?? {}

  try {
    const admin = (dependencies.createAdminClient ?? createAdminClient)()
    const rep = await (dependencies.resolveAmethystPreviewRep ??
      resolveAmethystPreviewRep)(admin, {
      env,
      select: 'id, email, shop_link, streaming_links',
    })

    if (!rep) return defaultPreviewTemplateData

    const settings = await (dependencies.getSiteSettingsDashboard ??
      getSiteSettingsDashboard)(admin, rep.id)
    const extras = {
      shopLink: rep.shop_link,
      streamingLinks: rep.streaming_links,
    }

    return {
      homepage: mapPreviewSettingsToHomepageTemplateData(settings, extras),
      trade: mapPreviewSettingsToTradeTemplateData(settings, extras),
      join: mapPreviewSettingsToJoinTemplateData(settings, extras),
    }
  } catch {
    return defaultPreviewTemplateData
  }
}
