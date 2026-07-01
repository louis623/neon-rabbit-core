import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Nic-Nac recipe builder smoke script', () => {
  it('keeps provider-free and OpenAI-unblocked modes available', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts?: Record<string, string>
    }
    const builderSource = readFileSync(
      'scripts/smoke-nic-nac-recipe-builder.ts',
      'utf8',
    )
    const chatSource = readFileSync(
      'scripts/smoke-nic-nac-recipe-chat.ts',
      'utf8',
    )

    expect(packageJson.scripts?.['smoke:nic-nac:recipe-builder']).toBe(
      'tsx scripts/smoke-nic-nac-recipe-builder.ts',
    )
    expect(packageJson.scripts?.['smoke:nic-nac:recipe-chat']).toBe(
      'tsx scripts/smoke-nic-nac-recipe-chat.ts',
    )
    expect(packageJson.scripts?.['smoke:nic-nac:recipe-tool-contract']).toBe(
      'npm exec vitest run tests/nic-nac/site-recipe-draft-tool.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac/nic-nac-calendar-route-routing-smoke.test.ts tests/nic-nac-workspace-refresh-events.test.ts',
    )
    expect(builderSource).toContain('--expect-model')
    expect(builderSource).toContain('--probe-model')
    expect(builderSource).toContain('--target=bling-kitchen')
    expect(builderSource).toContain('BLING_KITCHEN_RECIPE_SMOKE_PASSWORD')
    expect(builderSource).toContain('buildRecipeCardFixtureDataUrl')
    expect(builderSource).toContain('MODEL_PROBE_REQUIRED_FACTS')
    expect(builderSource).toContain('coconut oil')
    expect(builderSource).toContain('/api/nic-nac/site-recipes/draft')
    expect(builderSource).toContain('draft requires a recipe-card source image')

    expect(chatSource).toContain('runRecipeChatSmoke')
    expect(chatSource).toContain('build_site_recipe_draft')
    expect(chatSource).toContain('manage_site_recipes')
    expect(chatSource).toContain('loadCanonicalHistory')
    expect(chatSource).toContain('MODEL_UNAVAILABLE')
    expect(chatSource).toContain('--expect-model')
    expect(chatSource).toContain('--target=bling-kitchen')
    expect(chatSource).toContain('BLING_KITCHEN_RECIPE_SMOKE_PASSWORD')
    expect(chatSource).toContain('/blingkitchen/in-the-pantry')
  })
})
