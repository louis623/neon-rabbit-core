import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Nic-Nac recipe builder smoke script', () => {
  it('keeps provider-free and OpenAI-unblocked modes available', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts?: Record<string, string>
    }
    const source = readFileSync(
      'scripts/smoke-nic-nac-recipe-builder.ts',
      'utf8',
    )

    expect(packageJson.scripts?.['smoke:nic-nac:recipe-builder']).toBe(
      'tsx scripts/smoke-nic-nac-recipe-builder.ts',
    )
    expect(source).toContain('--expect-model')
    expect(source).toContain('--probe-model')
    expect(source).toContain('--target=bling-kitchen')
    expect(source).toContain('BLING_KITCHEN_RECIPE_SMOKE_PASSWORD')
    expect(source).toContain('/api/nic-nac/site-recipes/draft')
    expect(source).toContain('draft requires a recipe-card source image')
  })
})
