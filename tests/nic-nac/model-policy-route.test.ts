import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Suite Nic-Nac model routing', () => {
  it('does not hardcode Anthropic model IDs in route files', () => {
    const files = [
      join(process.cwd(), 'app/api/nic-nac/route.ts'),
      join(process.cwd(), 'app/api/public/nic-nac/route.ts'),
    ]

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain("claude-haiku-4-5-20251001")
      expect(source).toContain('getNicNacModelPolicy')
    }

    const agentSource = readFileSync(
      join(process.cwd(), 'lib/nic-nac/agent/nic-nac-agent.ts'),
      'utf8',
    )
    expect(agentSource).toContain('getNicNacLanguageModel')
  })

  it('passes provider options through the shared model policy helper', () => {
    const workspaceRoute = readFileSync(
      join(process.cwd(), 'app/api/nic-nac/route.ts'),
      'utf8',
    )
    const publicRoute = readFileSync(
      join(process.cwd(), 'app/api/public/nic-nac/route.ts'),
      'utf8',
    )

    const agentSource = readFileSync(
      join(process.cwd(), 'lib/nic-nac/agent/nic-nac-agent.ts'),
      'utf8',
    )

    expect(workspaceRoute).toContain('createConfiguredNicNacAgent')
    expect(agentSource).toContain('getNicNacProviderOptions')
    expect(publicRoute).toContain('getNicNacProviderOptions')
  })

  it('keeps the Nic-Nac model provider OpenAI-only for the current product policy', () => {
    const modelProvider = readFileSync(
      join(process.cwd(), 'lib/nic-nac/core/model-provider.ts'),
      'utf8',
    )

    expect(modelProvider).not.toContain('@ai-sdk/anthropic')
    expect(modelProvider).not.toContain('createAnthropic')
    expect(modelProvider).not.toContain('anthropicCacheControl')
  })

  it('routes workspace tools through product context and surface policy', () => {
    const capabilityCatalog = readFileSync(
      join(process.cwd(), 'lib/nic-nac/agent/capability-catalog.ts'),
      'utf8',
    )

    expect(capabilityCatalog).toContain('filterNicNacToolIntentsForContext')
    expect(capabilityCatalog).toContain('WORKSPACE_TOOL_INTENTS')
    expect(capabilityCatalog).toContain('buildToolsForIntents')
    expect(capabilityCatalog).not.toContain('getToolIntentsForText')
  })

  it('pins OpenAI traffic to the official API base URL by default', () => {
    const modelProvider = readFileSync(
      join(process.cwd(), 'lib/nic-nac/core/model-provider.ts'),
      'utf8',
    )

    expect(modelProvider).toContain("createOpenAI({ baseURL: 'https://api.openai.com/v1' })")
  })
})
