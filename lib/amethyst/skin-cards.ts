import {
  AMETHYST_APPEARANCE_PRESETS,
  normalizeAmethystAppearancePreset,
  type AmethystAppearancePresetId,
} from './appearance-presets'

export interface AmethystSkinSwatch {
  label: string
  value: string
}

export interface AmethystSkinCard {
  id: AmethystAppearancePresetId
  code: string
  label: string
  description: string
  headingFont: string
  bodyFont: string
  surfaceNote: string
  motionNote: string
  swatches: AmethystSkinSwatch[]
}

export const AMETHYST_SKIN_CARDS: AmethystSkinCard[] = [
  {
    id: 'amethyst',
    code: 'AM-01',
    label: 'Amethyst',
    description: 'The default high-sparkle Amethyst look with lavender, hot pink, and glossy cards.',
    headingFont: 'Italiana',
    bodyFont: 'Inter',
    surfaceNote: 'Holographic cards with confetti sparkle',
    motionNote: 'Calm CTA with sparkle cursor',
    swatches: [
      { label: 'Primary', value: '#5C0EFF' },
      { label: 'Accent', value: '#FF1AC2' },
      { label: 'Ground', value: '#E8DFF5' },
    ],
  },
  {
    id: 'sparkle_suite_morganite',
    code: 'SS-01',
    label: 'Sparkle Suite/Morganite',
    description:
      'Sparkle Suite polish with warm blush paper, plum ink, and refined pink accents.',
    headingFont: 'Playfair Display',
    bodyFont: 'DM Sans',
    surfaceNote: 'Warm white cards with soft paper edges',
    motionNote: 'Gentle hover lift and polished pink CTA',
    swatches: [
      { label: 'Primary', value: '#ee2c9b' },
      { label: 'Accent', value: '#ff4cae' },
      { label: 'Ground', value: '#fcf8f6' },
    ],
  },
  {
    id: 'black_diamond',
    code: 'BD-01',
    label: 'Black Diamond',
    description:
      'A black velvet reveal-night look with metallic gold, blush warmth, and cyan live-show accents.',
    headingFont: 'Playfair Display',
    bodyFont: 'DM Sans',
    surfaceNote: 'Dark metallic cards with velvet depth',
    motionNote: 'Gold hover lift with cyan action glow',
    swatches: [
      { label: 'Velvet', value: '#080808' },
      { label: 'Gold', value: '#d4af37' },
      { label: 'Blush', value: '#f4c2c2' },
      { label: 'Live', value: '#00d9ff' },
    ],
  },
  {
    id: 'rose_gold',
    code: 'RG-01',
    label: 'Rose Gold',
    description:
      'A soft rose, pearl, and champagne jewelry look with polished live-reveal warmth.',
    headingFont: 'Playfair Display',
    bodyFont: 'DM Sans',
    surfaceNote: 'Pearl white cards with rose-gold edges',
    motionNote: 'Champagne hover lift with rose CTA glow',
    swatches: [
      { label: 'Pearl', value: '#fff5f6' },
      { label: 'Rose', value: '#e04f73' },
      { label: 'Blush', value: '#f9a8d4' },
      { label: 'Gold', value: '#f5c66d' },
    ],
  },
  {
    id: 'garnet',
    code: 'GN-01',
    label: 'Garnet',
    description:
      'Warm boutique red with blush shell surfaces and lipstick-polish confidence.',
    headingFont: 'Boska',
    bodyFont: 'Switzer',
    surfaceNote: 'Blush shell cards with garnet ink and warm red borders',
    motionNote: 'Ruby hover lift with polished red CTA emphasis',
    swatches: [
      { label: 'Shell', value: '#FFE5DD' },
      { label: 'Garnet', value: '#B91C1C' },
      { label: 'Deep red', value: '#920000' },
      { label: 'Border', value: '#FF9180' },
    ],
  },
  {
    id: 'amber',
    code: 'AB-01',
    label: 'Amber',
    description:
      'Energetic orange with sunny pearl cards, peach borders, and reveal-party warmth.',
    headingFont: 'Melodrama',
    bodyFont: 'Nunito',
    surfaceNote: 'Sunlit pearl cards with peach-orange edges',
    motionNote: 'Amber pop hover with citrine trade-board glow',
    swatches: [
      { label: 'Pearl', value: '#FAFAFA' },
      { label: 'Amber', value: '#F97316' },
      { label: 'Burnt orange', value: '#761A00' },
      { label: 'Border', value: '#FFB781' },
    ],
  },
  {
    id: 'velvet',
    code: 'VE-01',
    label: 'Velvet',
    description:
      'Rich elegant purple with orchid gloss, plush cards, and boutique-night depth.',
    headingFont: 'Bitter',
    bodyFont: 'Archivo',
    surfaceNote: 'Plush orchid cards with glossy violet accents',
    motionNote: 'Velvet hover lift with orchid trade-board sheen',
    swatches: [
      { label: 'Orchid wash', value: '#FFE8FF' },
      { label: 'Velvet', value: '#9333EA' },
      { label: 'Deep violet', value: '#6300B9' },
      { label: 'Border', value: '#FB96FF' },
    ],
  },
  {
    id: 'rose_quartz',
    code: 'RQ-01',
    label: 'Rose Quartz',
    description:
      'Soft fun pink with quartz glow, playful sparkle, and deep plum contrast.',
    headingFont: 'Sharpie',
    bodyFont: 'Ranade',
    surfaceNote: 'Pink quartz cards with soft plum contrast',
    motionNote: 'Playful quartz hover pop with pink sparkle',
    swatches: [
      { label: 'Pearl', value: '#FAFAFA' },
      { label: 'Quartz', value: '#E879F9' },
      { label: 'Deep plum', value: '#63146E' },
      { label: 'Border', value: '#FFB0FF' },
    ],
  },
]

export function getAmethystSkinCard(
  value: string | null | undefined,
): AmethystSkinCard {
  const id = normalizeAmethystAppearancePreset(value)
  return (
    AMETHYST_SKIN_CARDS.find((card) => card.id === id) ??
    AMETHYST_SKIN_CARDS[0]
  )
}

export function getAmethystSkinCardByCode(
  value: string | null | undefined,
): AmethystSkinCard | null {
  const code = value?.trim().toUpperCase()
  if (!code) return null
  return AMETHYST_SKIN_CARDS.find((card) => card.code === code) ?? null
}

export function normalizeAmethystSkinSelection(
  value: string | null | undefined,
): AmethystAppearancePresetId {
  const rawValue = value?.trim()
  if (!rawValue) return normalizeAmethystAppearancePreset(rawValue)

  const card =
    getAmethystSkinCardByCode(rawValue) ??
    AMETHYST_SKIN_CARDS.find(
      (candidate) => candidate.label.toLowerCase() === rawValue.toLowerCase(),
    )

  return card?.id ?? normalizeAmethystAppearancePreset(rawValue)
}

export function getAmethystSkinPresetLabel(id: AmethystAppearancePresetId) {
  return AMETHYST_APPEARANCE_PRESETS[id].label
}
