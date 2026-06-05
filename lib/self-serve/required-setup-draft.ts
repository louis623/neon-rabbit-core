import { normalizeAmethystSkinSelection } from '@/lib/amethyst/skin-cards'
import type { RequiredSetupState } from './required-setup'

type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stepObject(
  source: RequiredSetupState | null | undefined,
  collection: 'answers' | 'generatedCopy',
  stepId: string,
) {
  const step = source?.[collection]?.[stepId]
  return isJsonObject(step) ? step : {}
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function firstRequiredSetupDraftText(...values: unknown[]) {
  for (const value of values) {
    const text = textValue(value)
    if (text) return text
  }

  return ''
}

export function socialKeyForRequiredSetupUrl(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('tiktok.com')) return 'tiktok'
  if (normalized.includes('facebook.com') || normalized.includes('fb.com')) return 'facebook'
  if (normalized.includes('instagram.com')) return 'instagram'
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube'
  return 'website'
}

export function normalizeRequiredSetupDraftState(
  state: RequiredSetupState | null | undefined,
) {
  const accountBasics = stepObject(state, 'answers', 'account_basics')
  const siteSkin = stepObject(state, 'answers', 'site_skin')
  const welcomeAnswers = stepObject(state, 'answers', 'welcome_copy')
  const welcomeGenerated = stepObject(state, 'generatedCopy', 'welcome_copy')
  const aboutAnswers = stepObject(state, 'answers', 'about_page')
  const aboutGenerated = stepObject(state, 'generatedCopy', 'about_page')
  const scheduleAnswers = stepObject(state, 'answers', 'show_schedule')
  const scheduleGenerated = stepObject(state, 'generatedCopy', 'show_schedule')
  const rawLook = firstRequiredSetupDraftText(
    siteSkin.appearancePreset,
    siteSkin.selectedLook,
    siteSkin.selectedLookId,
    siteSkin.selectedLookCode,
    siteSkin.lookCode,
    siteSkin.code,
    siteSkin.label,
  )
  const primaryLiveShowOrSocialLink = firstRequiredSetupDraftText(
    accountBasics.primaryLiveShowOrSocialLink,
    accountBasics.primarySocialLink,
    accountBasics.socialLink,
  )

  return {
    conversationName: firstRequiredSetupDraftText(accountBasics.conversationName),
    customerFacingDisplayName: firstRequiredSetupDraftText(
      accountBasics.customerFacingDisplayName,
      accountBasics.customerSiteName,
      accountBasics.websiteName,
    ),
    liveShowName: firstRequiredSetupDraftText(accountBasics.liveShowName),
    bestContactEmail: firstRequiredSetupDraftText(accountBasics.bestContactEmail),
    bombPartyRepStoreLink: firstRequiredSetupDraftText(
      accountBasics.bombPartyRepStoreLink,
      accountBasics.storeLink,
      accountBasics.shopLink,
    ),
    primaryLiveShowOrSocialLink,
    primarySocialLinks: primaryLiveShowOrSocialLink
      ? {
          [socialKeyForRequiredSetupUrl(primaryLiveShowOrSocialLink)]:
            primaryLiveShowOrSocialLink,
        }
      : {},
    appearancePreset: rawLook ? normalizeAmethystSkinSelection(rawLook) : null,
    welcomeHeadline: firstRequiredSetupDraftText(
      welcomeAnswers.headline,
      welcomeAnswers.welcomeHeadline,
      welcomeGenerated.headline,
      welcomeGenerated.welcomeHeadline,
    ),
    welcomeSupportingLine: firstRequiredSetupDraftText(
      welcomeAnswers.supportingLine,
      welcomeAnswers.supportingWelcomeLine,
      welcomeAnswers.supportingCopy,
      welcomeAnswers.supporting,
      welcomeAnswers.subheadline,
      welcomeAnswers.subtitle,
      welcomeAnswers.heroSub,
      welcomeAnswers.line,
      welcomeAnswers.copy,
      welcomeAnswers.tagline,
      welcomeGenerated.supportingLine,
      welcomeGenerated.supportingWelcomeLine,
      welcomeGenerated.supportingCopy,
      welcomeGenerated.supporting,
      welcomeGenerated.subheadline,
      welcomeGenerated.subtitle,
      welcomeGenerated.heroSub,
      welcomeGenerated.line,
      welcomeGenerated.copy,
      welcomeGenerated.tagline,
    ),
    aboutCopy: firstRequiredSetupDraftText(
      aboutAnswers.selectedAboutCopy,
      aboutAnswers.aboutCopy,
      aboutAnswers.copy,
      aboutAnswers.selectedCopy,
      aboutGenerated.selectedAboutCopy,
      aboutGenerated.aboutCopy,
      aboutGenerated.copy,
      aboutGenerated.selectedCopy,
    ),
    scheduleSummary: firstRequiredSetupDraftText(
      scheduleAnswers.scheduleSummary,
      scheduleAnswers.summary,
      scheduleAnswers.regularSchedule,
      scheduleAnswers.showSchedule,
      scheduleAnswers.schedule,
      scheduleAnswers.copy,
      scheduleAnswers.answer,
      scheduleGenerated.scheduleSummary,
      scheduleGenerated.summary,
      scheduleGenerated.regularSchedule,
      scheduleGenerated.showSchedule,
      scheduleGenerated.schedule,
      scheduleGenerated.copy,
      scheduleGenerated.answer,
    ),
  }
}
