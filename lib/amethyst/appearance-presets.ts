export const AMETHYST_CUSTOMER_SITE_TEMPLATE = 'amethyst' as const

export const AMETHYST_APPEARANCE_PRESET_IDS = [
  'amethyst',
  'editorial',
  'softGlam',
  'sparkleParty',
  'sparkle_suite_morganite',
  'maximum',
] as const

export type AmethystCustomerSiteTemplate = typeof AMETHYST_CUSTOMER_SITE_TEMPLATE
export type AmethystAppearancePresetId =
  (typeof AMETHYST_APPEARANCE_PRESET_IDS)[number]

export const DEFAULT_AMETHYST_APPEARANCE_PRESET =
  'amethyst' satisfies AmethystAppearancePresetId

export interface AmethystAppearancePreset {
  id: AmethystAppearancePresetId
  label: string
  description: string
  values: {
    primaryColor: string
    accentColor: string
    bgTone: string
    headingFont: string
    bodyFont: string
    headingWeight: number
    shapeRadius: string
    density: string
    saturation: number
    sparkleLevel: string
    bgTreatment: string
    cardSurface: string
    textureOverlay: string
    buttonEnergy: string
    ctaEmphasis: string
    tradeFlair: string
    cursorEffect: string
    tickerSpeed: number
  }
}

export const AMETHYST_APPEARANCE_PRESETS: Record<
  AmethystAppearancePresetId,
  AmethystAppearancePreset
> = {
  amethyst: {
    id: 'amethyst',
    label: 'Amethyst',
    description: 'The default Sparkle Suite customer-site look.',
    values: {
      primaryColor: '#5C0EFF',
      accentColor: '#FF1AC2',
      bgTone: 'lavender',
      headingFont: 'italiana',
      bodyFont: 'inter',
      headingWeight: 600,
      shapeRadius: 'soft',
      density: 'regular',
      saturation: 130,
      sparkleLevel: 'glittery',
      bgTreatment: 'confetti',
      cardSurface: 'holographic',
      textureOverlay: 'sparkle',
      buttonEnergy: 'calm',
      ctaEmphasis: 'standard',
      tradeFlair: 'holo-unicorn',
      cursorEffect: 'sparkle',
      tickerSpeed: 0.6,
    },
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Cleaner, quieter sparkle for a polished shop feel.',
    values: {
      primaryColor: '#480DDF',
      accentColor: '#D209E3',
      bgTone: 'lavender',
      headingFont: 'italiana',
      bodyFont: 'inter',
      headingWeight: 600,
      shapeRadius: 'soft',
      density: 'regular',
      saturation: 100,
      sparkleLevel: 'subtle',
      bgTreatment: 'clean',
      cardSurface: 'matte',
      textureOverlay: 'none',
      buttonEnergy: 'calm',
      ctaEmphasis: 'standard',
      tradeFlair: 'clean',
      cursorEffect: 'default',
      tickerSpeed: 0.6,
    },
  },
  softGlam: {
    id: 'softGlam',
    label: 'Soft Glam',
    description: 'A softer luxe look with glassy cards and gentle sparkle.',
    values: {
      primaryColor: '#480DDF',
      accentColor: '#D209E3',
      bgTone: 'lavender',
      headingFont: 'italiana',
      bodyFont: 'inter',
      headingWeight: 600,
      shapeRadius: 'soft',
      density: 'regular',
      saturation: 110,
      sparkleLevel: 'glittery',
      bgTreatment: 'mesh',
      cardSurface: 'glass',
      textureOverlay: 'sparkle',
      buttonEnergy: 'bouncy',
      ctaEmphasis: 'pulse',
      tradeFlair: 'tier-glow',
      cursorEffect: 'default',
      tickerSpeed: 0.6,
    },
  },
  sparkleParty: {
    id: 'sparkleParty',
    label: 'Sparkle Party',
    description: 'Bright, animated, and show-night ready.',
    values: {
      primaryColor: '#5C0EFF',
      accentColor: '#FF1AC2',
      bgTone: 'warm',
      headingFont: 'italiana',
      bodyFont: 'inter',
      headingWeight: 600,
      shapeRadius: 'soft',
      density: 'regular',
      saturation: 130,
      sparkleLevel: 'maximum',
      bgTreatment: 'confetti',
      cardSurface: 'glass',
      textureOverlay: 'sparkle',
      buttonEnergy: 'bouncy',
      ctaEmphasis: 'pulse',
      tradeFlair: 'holo-unicorn',
      cursorEffect: 'sparkle',
      tickerSpeed: 0.6,
    },
  },
  sparkle_suite_morganite: {
    id: 'sparkle_suite_morganite',
    label: 'Sparkle Suite/Morganite',
    description:
      'Sparkle Suite polish with blush paper, plum ink, and refined pink accents.',
    values: {
      primaryColor: '#ee2c9b',
      accentColor: '#ff4cae',
      bgTone: 'suiteBlush',
      headingFont: 'playfair',
      bodyFont: 'dmSans',
      headingWeight: 500,
      shapeRadius: 'soft',
      density: 'regular',
      saturation: 104,
      sparkleLevel: 'subtle',
      bgTreatment: 'suite-paper',
      cardSurface: 'warm-paper',
      textureOverlay: 'none',
      buttonEnergy: 'suite-lift',
      ctaEmphasis: 'standard',
      tradeFlair: 'soft-pink-lift',
      cursorEffect: 'default',
      tickerSpeed: 0.6,
    },
  },
  maximum: {
    id: 'maximum',
    label: 'Maximum',
    description: 'The loudest approved Amethyst look.',
    values: {
      primaryColor: '#3300FF',
      accentColor: '#FF00CC',
      bgTone: 'neon',
      headingFont: 'italiana',
      bodyFont: 'inter',
      headingWeight: 600,
      shapeRadius: 'soft',
      density: 'regular',
      saturation: 150,
      sparkleLevel: 'maximum',
      bgTreatment: 'aurora',
      cardSurface: 'holographic',
      textureOverlay: 'sparkle',
      buttonEnergy: 'wiggle',
      ctaEmphasis: 'pulse',
      tradeFlair: 'holo-unicorn',
      cursorEffect: 'sparkle',
      tickerSpeed: 0.6,
    },
  },
}

export function normalizeCustomerSiteTemplate(
  value: string | null | undefined,
): AmethystCustomerSiteTemplate {
  return AMETHYST_CUSTOMER_SITE_TEMPLATE
}

export function normalizeAmethystAppearancePreset(
  value: string | null | undefined,
): AmethystAppearancePresetId {
  return AMETHYST_APPEARANCE_PRESET_IDS.includes(
    value as AmethystAppearancePresetId,
  )
    ? (value as AmethystAppearancePresetId)
    : DEFAULT_AMETHYST_APPEARANCE_PRESET
}

export function getAmethystAppearancePreset(
  value: string | null | undefined,
): AmethystAppearancePreset {
  return AMETHYST_APPEARANCE_PRESETS[normalizeAmethystAppearancePreset(value)]
}

export function applyAmethystAppearancePreset<
  T extends { preset: string } & Partial<AmethystAppearancePreset['values']>,
>(defaults: T, value: string | null | undefined): T {
  const preset = getAmethystAppearancePreset(value)

  return {
    ...defaults,
    ...preset.values,
    preset: preset.id,
  }
}
