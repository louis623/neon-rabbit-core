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
    id: 'editorial',
    code: 'ED-01',
    label: 'Editorial',
    description: 'A quieter polished shop look with cleaner surfaces and subtle sparkle.',
    headingFont: 'Italiana',
    bodyFont: 'Inter',
    surfaceNote: 'Matte cards with clean backgrounds',
    motionNote: 'Calm standard CTA',
    swatches: [
      { label: 'Primary', value: '#480DDF' },
      { label: 'Accent', value: '#D209E3' },
      { label: 'Ground', value: '#E8DFF5' },
    ],
  },
  {
    id: 'softGlam',
    code: 'SG-01',
    label: 'Soft Glam',
    description: 'A softer luxe look with glass cards and gentle sparkle.',
    headingFont: 'Italiana',
    bodyFont: 'Inter',
    surfaceNote: 'Glassy cards over a soft mesh background',
    motionNote: 'Bouncy CTA with pulse emphasis',
    swatches: [
      { label: 'Primary', value: '#480DDF' },
      { label: 'Accent', value: '#D209E3' },
      { label: 'Ground', value: '#E8DFF5' },
    ],
  },
  {
    id: 'sparkleParty',
    code: 'SP-01',
    label: 'Sparkle Party',
    description: 'Bright, animated, and show-night ready.',
    headingFont: 'Italiana',
    bodyFont: 'Inter',
    surfaceNote: 'Glass cards with warm confetti energy',
    motionNote: 'Bouncy CTA with maximum sparkle',
    swatches: [
      { label: 'Primary', value: '#5C0EFF' },
      { label: 'Accent', value: '#FF1AC2' },
      { label: 'Ground', value: '#FFF0E8' },
    ],
  },
  {
    id: 'maximum',
    code: 'MX-01',
    label: 'Maximum',
    description: 'The loudest approved Amethyst look.',
    headingFont: 'Italiana',
    bodyFont: 'Inter',
    surfaceNote: 'Holographic cards with aurora background',
    motionNote: 'Wiggle CTA and maximum sparkle',
    swatches: [
      { label: 'Primary', value: '#3300FF' },
      { label: 'Accent', value: '#FF00CC' },
      { label: 'Ground', value: '#FFE6FA' },
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
