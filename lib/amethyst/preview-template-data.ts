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
  DEFAULT_AMETHYST_APPEARANCE_PRESET,
  normalizeAmethystAppearancePreset,
  type AmethystAppearancePresetId,
} from './appearance-presets'
import {
  defaultAmethystJoinTemplateData,
  type AmethystJoinTemplateData,
} from './join-template-data'
import { resolveAmethystPreviewRep } from './preview-rep'
import {
  getRequiredSetupState,
  type RequiredSetupState,
} from '@/lib/self-serve/required-setup'
import {
  firstRequiredSetupDraftText as firstDraftText,
  normalizeRequiredSetupDraftState,
} from '@/lib/self-serve/required-setup-draft'
import {
  defaultAmethystTradeTemplateData,
  type AmethystTradeTemplateData,
} from './trade-template-data'
import { getPublicRepName } from './public-rep-name'

interface PreviewTemplateDataDependencies {
  createAdminClient?: typeof createAdminClient
  resolveAmethystPreviewRep?: typeof resolveAmethystPreviewRep
  getSiteSettingsDashboard?: typeof getSiteSettingsDashboard
  getRequiredSetupState?: typeof getRequiredSetupState
}

interface LoadPreviewTemplateDataOptions {
  env?: Record<string, string | undefined>
  repId?: string | null
  dependencies?: PreviewTemplateDataDependencies
}

interface PreviewRepExtras {
  shopLink?: string | null
  streamingLinks?: unknown
}

export interface AmethystPreviewTemplateData {
  appearancePreset: AmethystAppearancePresetId
  homepage: AmethystHomepageTemplateData
  trade: AmethystTradeTemplateData
  join: AmethystJoinTemplateData
}

const defaultPreviewTemplateData: AmethystPreviewTemplateData = {
  appearancePreset: DEFAULT_AMETHYST_APPEARANCE_PRESET,
  homepage: defaultAmethystHomepageTemplateData,
  trade: defaultAmethystTradeTemplateData,
  join: defaultAmethystJoinTemplateData,
}

function clean(value: string | null | undefined) {
  return value?.trim() || ''
}

function socialKeyForUrl(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('tiktok.com')) return 'tiktok'
  if (normalized.includes('facebook.com') || normalized.includes('fb.com')) return 'facebook'
  if (normalized.includes('instagram.com')) return 'instagram'
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube'
  return 'website'
}

function mergePrimarySocialLink(
  socialHandles: Record<string, string>,
  primaryLink: string,
) {
  if (!primaryLink) return socialHandles
  return {
    ...socialHandles,
    [socialKeyForUrl(primaryLink)]: primaryLink,
  }
}

function applyRequiredSetupDraftToSettings(
  settings: SiteSettingsDashboardResult,
  state: RequiredSetupState | null | undefined,
): SiteSettingsDashboardResult {
  if (!state?.repId) return settings
  const draft = normalizeRequiredSetupDraftState(state)
  const businessName = firstDraftText(
    draft.customerFacingDisplayName,
    settings.businessName,
  )
  const teamName = firstDraftText(draft.liveShowName, businessName, settings.teamName)
  const tagline = firstDraftText(draft.welcomeSupportingLine, settings.tagline)
  const bannerText = firstDraftText(draft.welcomeHeadline, settings.bannerText)

  return {
    ...settings,
    displayName: firstDraftText(draft.conversationName, settings.displayName),
    businessName,
    email: firstDraftText(draft.bestContactEmail, settings.email),
    bannerText,
    bannerVisible: Boolean(bannerText) || settings.bannerVisible,
    tagline,
    teamName,
    appearancePreset: normalizeAmethystAppearancePreset(
      draft.appearancePreset ?? settings.appearancePreset,
    ),
    socialHandles: mergePrimarySocialLink(
      settings.socialHandles,
      draft.primaryLiveShowOrSocialLink,
    ),
  }
}

function applyRequiredSetupDraftToExtras(
  extras: PreviewRepExtras,
  state: RequiredSetupState | null | undefined,
): PreviewRepExtras {
  if (!state?.repId) return extras
  const draft = normalizeRequiredSetupDraftState(state)
  const streamingLinks = asRecord(extras.streamingLinks)
  const primaryLink = draft.primaryLiveShowOrSocialLink

  return {
    ...extras,
    shopLink: firstDraftText(draft.bombPartyRepStoreLink, extras.shopLink),
    streamingLinks: primaryLink
      ? {
          ...streamingLinks,
          [socialKeyForUrl(primaryLink)]: primaryLink,
        }
      : streamingLinks,
  }
}

function applyRequiredSetupDraftToHomepage(
  homepage: AmethystHomepageTemplateData,
  state: RequiredSetupState | null | undefined,
): AmethystHomepageTemplateData {
  if (!state?.repId) return homepage
  const draft = normalizeRequiredSetupDraftState(state)
  const aboutParagraphs = [...homepage.aboutParagraphs] as [string, string, string]

  if (draft.aboutCopy) aboutParagraphs[0] = draft.aboutCopy
  if (draft.scheduleSummary) {
    aboutParagraphs[2] = `Live show schedule: ${draft.scheduleSummary}`
  }

  return {
    ...homepage,
    heroEyebrow: draft.scheduleSummary
      ? `Live schedule: ${draft.scheduleSummary}`
      : 'Live schedule coming soon',
    heroHeadline: firstDraftText(draft.welcomeHeadline, homepage.heroHeadline),
    heroSub: firstDraftText(draft.welcomeSupportingLine, homepage.heroSub),
    aboutHeadline: draft.customerFacingDisplayName
      ? `Meet the story behind ${draft.customerFacingDisplayName}.`
      : homepage.aboutHeadline,
    aboutParagraphs,
    footerTagline: firstDraftText(draft.welcomeSupportingLine, homepage.footerTagline),
  }
}

function hasLegacyPlaceholderText(value: string | null | undefined) {
  const normalized = clean(value).toLowerCase()
  if (!normalized) return false

  return (
    /\b(rep name|show name)\b/.test(normalized) ||
    normalized === 'jane' ||
    normalized.includes("jane's ") ||
    normalized.includes("jane's sparkle party")
  )
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleaned = clean(value)
    if (cleaned && !hasLegacyPlaceholderText(cleaned)) return cleaned
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
  ].filter((value) => clean(value).length > 0 && !hasLegacyPlaceholderText(value))

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

function withCustomerTarget(href: string, repId: string | null | undefined) {
  const cleanedRepId = repId?.trim()
  if (!cleanedRepId || !href.startsWith('/amethyst/')) return href

  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}c=${encodeURIComponent(cleanedRepId)}`
}

function targetedHomepageAboutParagraphs(
  homepage: AmethystHomepageTemplateData,
): [string, string, string] {
  const repName = getPublicRepName(homepage.repName)
  const neutral: [string, string, string] = [
    `${repName} will share more about this live reveal community soon.`,
    'Customer details, show style, and favorite reveal notes will appear here after they are added.',
    homepage.heroEyebrow,
  ]
  const isPlaceholder = (value: string) => {
    const normalized = value.toLowerCase()
    return (
      normalized.includes('share how you got started') ||
      normalized.includes('nic-nac can rewrite this') ||
      normalized.includes('add a final paragraph')
    )
  }

  return homepage.aboutParagraphs.map((paragraph, index) =>
    isPlaceholder(paragraph) ? neutral[index] : paragraph,
  ) as [string, string, string]
}

function targetedJoinFaq(teamName: string, repName: string): AmethystJoinTemplateData['faqAnswers'] {
  const publicRepName = getPublicRepName(repName)
  return {
    whatIsTeam: `${teamName} details will appear after ${publicRepName} adds team information.`,
    cost: 'Review current starter pack details before joining.',
    experience: `${publicRepName} can answer onboarding and experience questions directly.`,
    timeCommitment: `${publicRepName} can discuss schedule expectations and what setup looks like.`,
    support: 'Support details will appear after this rep configures them.',
    income: 'Review the income disclosure before joining. Income varies by effort, sales, and time.',
  }
}

function applyCustomerTarget(
  data: AmethystPreviewTemplateData,
  repId: string | null | undefined,
): AmethystPreviewTemplateData {
  const targeted = Boolean(repId?.trim())

  return {
    appearancePreset: data.appearancePreset,
    homepage: {
      ...data.homepage,
      aboutParagraphs: targeted
        ? targetedHomepageAboutParagraphs(data.homepage)
        : data.homepage.aboutParagraphs,
      showcaseVideoCaption: targeted
        ? 'Intro video coming soon.'
        : data.homepage.showcaseVideoCaption,
      joinTeamUrl: data.homepage.joinTeamUrl
        ? withCustomerTarget(data.homepage.joinTeamUrl, repId)
        : '',
      footerLinks: {
        ...data.homepage.footerLinks,
        home: withCustomerTarget(
          data.homepage.footerLinks.home || '/amethyst/Homepage.html',
          repId,
        ),
        tradeBoard: withCustomerTarget(data.homepage.footerLinks.tradeBoard, repId),
        joinTeam: data.homepage.footerLinks.joinTeam
          ? withCustomerTarget(data.homepage.footerLinks.joinTeam, repId)
          : undefined,
      },
    },
    trade: {
      ...data.trade,
      footerLinks: {
        ...data.trade.footerLinks,
        home: withCustomerTarget(data.trade.footerLinks.home, repId),
        tradeBoard: withCustomerTarget(data.trade.footerLinks.tradeBoard, repId),
        joinTeam: data.trade.footerLinks.joinTeam
          ? withCustomerTarget(data.trade.footerLinks.joinTeam, repId)
          : undefined,
      },
    },
    join: {
      ...data.join,
      teamMembers: targeted ? [] : data.join.teamMembers,
      promoText: targeted ? '' : data.join.promoText,
      footerColumn: targeted
        ? {
            title: 'Team Notes',
            links: [
              { label: 'Team details appear after setup', href: '#faq' },
              { label: 'Connect with the rep', href: '#faq' },
              { label: 'Review current income disclosure', href: '#faq' },
            ],
          }
        : data.join.footerColumn,
      faqAnswers: targeted
        ? targetedJoinFaq(data.join.teamName, data.join.repName)
        : data.join.faqAnswers,
      footerLinks: {
        ...data.join.footerLinks,
        home: withCustomerTarget(data.join.footerLinks.home, repId),
        tradeBoard: withCustomerTarget(data.join.footerLinks.tradeBoard, repId),
        joinTeam: withCustomerTarget(data.join.footerLinks.joinTeam, repId),
      },
    },
  }
}

export function mapPreviewSettingsToHomepageTemplateData(
  settings: SiteSettingsDashboardResult,
  extras: PreviewRepExtras = {},
): AmethystHomepageTemplateData {
  const repName = getPublicRepName(
    firstText(settings.displayName, defaultAmethystHomepageTemplateData.repName),
  )
  const businessName = firstText(
    settings.businessName,
    defaultAmethystHomepageTemplateData.businessName,
  )
  const tagline = firstText(settings.tagline, defaultAmethystHomepageTemplateData.tagline)
  const streamLinks = resolveStreamingLinks(settings, extras)
  const showJoinPage = settings.showJoinPage !== false

  return {
    ...defaultAmethystHomepageTemplateData,
    repName,
    businessName,
    teamName: firstText(settings.teamName, defaultAmethystHomepageTemplateData.teamName),
    tagline,
    heroSub: `I'm ${repName} - join me for live reveals, favorite finds, and customer-first sparkle.`,
    heroMotion: settings.heroAnimationType,
    heroEyebrow: 'Live schedule coming soon',
    tickerTopText: buildTicker(
      settings,
      defaultAmethystHomepageTemplateData.tickerTopText,
    ),
    aboutHeadline: `Meet ${repName} and the story behind ${businessName}.`,
    signupSub: `Get a heads-up when ${repName} goes live, plus first dibs on new drops.`,
    signupConsent: `Choose SMS, email, or both. Marketing consent stays separate from reminders and updates from ${businessName}. Msg & data rates may apply. Reply STOP to unsubscribe.`,
    footerTagline: tagline,
    legalDisclaimer: buildLegalDisclaimer(businessName, 'homepage'),
    showJoinPage,
    joinTeamUrl: showJoinPage
      ? defaultAmethystHomepageTemplateData.joinTeamUrl
      : '',
    streamLinks,
    socialLinks: buildSocialLinks(settings),
    footerLinks: {
      ...defaultAmethystHomepageTemplateData.footerLinks,
      joinTeam: showJoinPage
        ? defaultAmethystHomepageTemplateData.footerLinks.joinTeam
        : undefined,
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
  const showJoinPage = settings.showJoinPage !== false

  const repName = getPublicRepName(
    firstText(settings.displayName, defaultAmethystTradeTemplateData.repName),
  )

  return {
    ...defaultAmethystTradeTemplateData,
    repName,
    businessName,
    tickerTopText: buildTicker(settings, defaultAmethystTradeTemplateData.tickerTopText),
    shopUrl,
    footerTagline: firstText(settings.tagline, defaultAmethystTradeTemplateData.footerTagline),
    legalDisclaimer: buildLegalDisclaimer(businessName, 'trade'),
    socialLinks: buildSocialLinks(settings),
    footerLinks: {
      ...defaultAmethystTradeTemplateData.footerLinks,
      joinTeam: showJoinPage
        ? defaultAmethystTradeTemplateData.footerLinks.joinTeam
        : undefined,
      catalog: shopUrl,
      preOrders: shopUrl,
    },
  }
}

export function mapPreviewSettingsToJoinTemplateData(
  settings: SiteSettingsDashboardResult,
  extras: PreviewRepExtras = {},
): AmethystJoinTemplateData {
  const repName = getPublicRepName(
    firstText(settings.displayName, defaultAmethystJoinTemplateData.repName),
  )
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
      repId: options.repId,
      select: 'id, email, shop_link, streaming_links',
    })

    if (!rep) return defaultPreviewTemplateData

    const settings = await (dependencies.getSiteSettingsDashboard ??
      getSiteSettingsDashboard)(admin, rep.id)
    let requiredSetupState: RequiredSetupState | null = null
    try {
      requiredSetupState = await (dependencies.getRequiredSetupState ??
        getRequiredSetupState)(rep.id)
    } catch {
      requiredSetupState = null
    }
    const activeSetupDraftState =
      requiredSetupState?.status === 'required_setup' ||
      requiredSetupState?.status === 'setup_blocked'
        ? requiredSetupState
        : null
    const draftSettings = applyRequiredSetupDraftToSettings(
      settings,
      activeSetupDraftState,
    )
    const extras = {
      shopLink: rep.shop_link,
      streamingLinks: rep.streaming_links,
    }
    const draftExtras = applyRequiredSetupDraftToExtras(extras, activeSetupDraftState)

    return applyCustomerTarget({
      appearancePreset: normalizeAmethystAppearancePreset(
        draftSettings.appearancePreset,
      ),
      homepage: applyRequiredSetupDraftToHomepage(
        mapPreviewSettingsToHomepageTemplateData(draftSettings, draftExtras),
        activeSetupDraftState,
      ),
      trade: mapPreviewSettingsToTradeTemplateData(draftSettings, draftExtras),
      join: mapPreviewSettingsToJoinTemplateData(draftSettings, draftExtras),
    }, options.repId)
  } catch {
    return defaultPreviewTemplateData
  }
}
