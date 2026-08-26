import { describe, expect, it, vi } from 'vitest'

import {
  loadSparkleFinderAppearanceSetting,
  resolveSparkleFinderAppearance,
  saveSparkleFinderAppearanceSetting,
} from '@/lib/sparkle-finder/appearance'

describe('Sparkle Finder appearance settings', () => {
  it('resolves the approved Amethyst preset into public semantic tokens', () => {
    const appearance = resolveSparkleFinderAppearance('amethyst')

    expect(appearance).toMatchObject({
      schemaVersion: 1,
      preset: 'amethyst',
      label: 'Amethyst',
      tokens: {
        background: '#E8DFF5',
        primary: '#5C0EFF',
        accent: '#FF1AC2',
        headingFont: 'italiana',
        bodyFont: 'inter',
      },
    })
  })

  it('falls back to Amethyst when the global setting is missing or invalid', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn(() => ({ maybeSingle }))
    const select = vi.fn(() => ({ eq }))
    const admin = { from: vi.fn(() => ({ select })) }

    await expect(loadSparkleFinderAppearanceSetting(admin as never)).resolves.toMatchObject({
      preset: 'amethyst',
    })

    expect(admin.from).toHaveBeenCalledWith('sparkle_finder_brand_settings')
  })

  it('upserts only normalized customer-site preset IDs', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { appearance_preset: 'rose_quartz' },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const upsert = vi.fn(() => ({ select }))
    const admin = { from: vi.fn(() => ({ upsert })) }

    const saved = await saveSparkleFinderAppearanceSetting(
      admin as never,
      'rose_quartz',
      'operator@example.com',
    )

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'global',
        appearance_preset: 'rose_quartz',
        updated_by: 'operator@example.com',
      }),
      { onConflict: 'id' },
    )
    expect(saved.preset).toBe('rose_quartz')
  })
})
