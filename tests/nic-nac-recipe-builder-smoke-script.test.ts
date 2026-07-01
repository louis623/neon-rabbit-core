import { readFileSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    expect(builderSource).toContain('/api/nic-nac/site-recipes/image')
    expect(builderSource).toContain('/api/nic-nac/site-recipes/draft')
    expect(builderSource).toContain('draft requires a recipe-card source image')

    expect(chatSource).toContain('runRecipeChatSmoke')
    expect(chatSource).toContain('build_site_recipe_draft')
    expect(chatSource).toContain('manage_site_recipes')
    expect(chatSource).toContain('loadCanonicalHistory')
    expect(chatSource).toContain('MODEL_UNAVAILABLE')
    expect(chatSource).toContain('--expect-model')
    expect(chatSource).toContain('--target=bling-kitchen')
    expect(chatSource).toContain('--output')
    expect(chatSource).toContain('BLING_KITCHEN_RECIPE_SMOKE_PASSWORD')
    expect(chatSource).toContain('/blingkitchen/in-the-pantry')
    expect(chatSource).toContain('/api/amethyst/pantry-template')
    expect(chatSource).toContain("templateUrl.searchParams.set('c', input.repId)")
    expect(chatSource).toContain(
      'BlingKitchen Pantry template did not include the saved smoke recipe.',
    )
    expect(chatSource).toContain('getLatestAssistantToolNames')
    expect(chatSource).toContain("Observed manage_site_recipes during the draft turn")
    expect(chatSource).toContain(".eq('title', input.title)")
    expect(chatSource).toContain(".eq('id', input.recipeId)")
    expect(chatSource.match(/cleanupSmokeRecipes\(\{/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
  })

  it('exposes a provider-free missing-env guard for the recipe chat smoke', async () => {
    const imported = await import('../scripts/smoke-nic-nac-recipe-chat')
    const smokeModule = (
      'runRecipeChatSmoke' in imported ? imported : imported.default
    ) as typeof import('../scripts/smoke-nic-nac-recipe-chat')

    expect(smokeModule.getMissingRecipeChatSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      smokeModule.getMissingRecipeChatSmokeEnv(
        {
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
          SUPABASE_SERVICE_ROLE_KEY: 'service',
        },
        { target: 'bling-kitchen' },
      ),
    ).toEqual(['BLING_KITCHEN_RECIPE_SMOKE_PASSWORD'])

    await expect(smokeModule.runRecipeChatSmoke({})).resolves.toMatchObject({
      ok: false,
      status: 'missing_env',
      missingEnv: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ],
    })
    await expect(
      smokeModule.runRecipeChatSmoke(
        {
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
          SUPABASE_SERVICE_ROLE_KEY: 'service',
        },
        { target: 'bling-kitchen' },
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 'missing_env',
      missingEnv: ['BLING_KITCHEN_RECIPE_SMOKE_PASSWORD'],
    })
  })

  it('writes recipe chat smoke JSON artifacts to a requested output path', async () => {
    const imported = await import('../scripts/smoke-nic-nac-recipe-chat')
    const smokeModule = (
      'runRecipeChatSmoke' in imported ? imported : imported.default
    ) as typeof import('../scripts/smoke-nic-nac-recipe-chat')
    const outputDir = await mkdtemp(join(tmpdir(), 'recipe-chat-smoke-'))

    try {
      const outputPath = join(outputDir, 'nested', 'recipe-chat.json')
      const result = {
        ok: false,
        status: 'missing_env',
        missingEnv: ['OPENAI_API_KEY'],
        message: 'Nic-Nac recipe chat smoke is missing required environment.',
      } as const

      await expect(
        smokeModule.writeRecipeChatSmokeArtifact(result, outputPath),
      ).resolves.toBe(outputPath)
      await expect(
        readFile(outputPath, 'utf8').then((contents) => JSON.parse(contents)),
      ).resolves.toEqual(result)
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })
})
