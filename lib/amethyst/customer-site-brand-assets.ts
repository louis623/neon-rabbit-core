import {
  getAmethystAppearancePreset,
  type AmethystAppearancePresetId,
} from './appearance-presets'
import { resolveAmethystRequestCustomDomainHost } from './host-routing'
import { loadAmethystPreviewTemplateData } from './preview-template-data'

export interface CustomerSiteSharePalette {
  background: string
  foreground: string
  secondary: string
  accent: string
}

export interface CustomerSiteBrandAssetContext {
  businessName: string
  customDomain: string
  mark: string
  markAssetPath: string | null
  palette: CustomerSiteSharePalette
  preset: AmethystAppearancePresetId
  tagline: string
}

const BRI_CUSTOM_DOMAINS = new Set(['brisglowtique.com', 'www.brisglowtique.com'])

const SHARE_BACKGROUNDS: Partial<Record<AmethystAppearancePresetId, string>> = {
  amethyst: '#2b155c',
  black_diamond: '#161313',
  moonstone: '#272938',
  emerald_garden: '#123c35',
  garnet: '#4a1218',
  velvet: '#321142',
}

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || ''
}

export function getCustomerSiteSharePalette(
  preset: AmethystAppearancePresetId,
): CustomerSiteSharePalette {
  const appearance = getAmethystAppearancePreset(preset)
  const background = SHARE_BACKGROUNDS[preset] ?? '#21191d'

  return {
    background,
    foreground: '#fffdfb',
    secondary: '#f4e9e4',
    accent: appearance.values.primaryColor,
  }
}

export function getCustomerSiteMark(
  businessName: string | null | undefined,
  fallbackName: string | null | undefined,
) {
  const source = cleanText(businessName) || cleanText(fallbackName) || 'S'
  const letter = Array.from(source).find((character) => /[\p{L}\p{N}]/u.test(character))
  return letter?.toLocaleUpperCase() ?? 'S'
}

function getCustomerSiteMarkAssetPath(customDomain: string) {
  return BRI_CUSTOM_DOMAINS.has(customDomain)
    ? '/customer-site-assets/bris-glowtique-monogram-b.png'
    : null
}

/**
 * Resolves customer-site branding only on a custom customer domain. Platform
 * URLs keep the Sparkle Suite application icon and social card unchanged.
 */
export async function getCustomerSiteBrandAssetContext(
  requestHeaders: Headers,
): Promise<CustomerSiteBrandAssetContext | null> {
  const request = new Request('https://www.yoursparklesuite.com/', {
    headers: requestHeaders,
  })
  const customDomain = resolveAmethystRequestCustomDomainHost(request)
  if (!customDomain) return null

  const templateData = await loadAmethystPreviewTemplateData({ repId: customDomain })
  const businessName = cleanText(templateData.homepage.businessName)
  const tagline = cleanText(templateData.homepage.tagline)
  const preset = templateData.appearancePreset

  return {
    businessName: businessName || 'Customer site',
    customDomain,
    mark: getCustomerSiteMark(businessName, templateData.homepage.repName),
    markAssetPath: getCustomerSiteMarkAssetPath(customDomain),
    palette: getCustomerSiteSharePalette(preset),
    preset,
    tagline,
  }
}
