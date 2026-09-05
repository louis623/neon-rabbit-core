import type { AmethystAppearancePresetId } from '@/lib/amethyst/appearance-presets'

// Finder has its own database constraint and release cycle. Suite-only skins
// must not become selectable there merely by joining the shared skin registry.
export const SPARKLE_FINDER_APPEARANCE_PRESET_IDS = [
  'amethyst',
  'sparkle_suite_morganite',
  'black_diamond',
  'moonstone',
  'alpine_opal',
  'emerald_garden',
  'rose_gold',
  'garnet',
  'amber',
  'velvet',
  'rose_quartz',
] as const satisfies readonly AmethystAppearancePresetId[]
