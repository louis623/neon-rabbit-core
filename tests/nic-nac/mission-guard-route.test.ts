import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Nic-Nac mission guard route wiring', () => {
  it('checks mission scope before model streaming and returns a static redirect stream', () => {
    const routeSource = readFileSync(
      join(process.cwd(), 'app/api/nic-nac/route.ts'),
      'utf8',
    )

    expect(routeSource).toContain('classifyNicNacMissionScopeForMessages')
    expect(routeSource).toContain('createNicNacStaticTextStreamResponse')
    expect(routeSource).toContain("model: 'mission_redirect'")
    expect(routeSource).toContain("status: 'complete'")
    expect(routeSource).toContain('estimatedCostCents: 0')
    const routeBody = routeSource.slice(routeSource.indexOf('export async function POST'))
    const missionScopeCallIndex = routeBody.indexOf(
      'const missionScope = classifyNicNacMissionScopeForMessages(messages)',
    )

    expect(missionScopeCallIndex).toBeGreaterThan(-1)
    expect(missionScopeCallIndex).toBeLessThan(routeBody.indexOf('loadSuiteRepMemoryCards({'))
    expect(missionScopeCallIndex).toBeLessThan(routeBody.indexOf('getOrCreateTradeBoardIntakeContext({'))
    expect(missionScopeCallIndex).toBeLessThan(routeBody.indexOf('buildToolsForIntents('))
    expect(missionScopeCallIndex).toBeLessThan(routeBody.indexOf('streamText({'))
  })
})
