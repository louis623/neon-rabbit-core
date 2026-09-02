import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Nic-Nac production orchestrator', () => {
  it('has one runtime path and it is the ToolLoopAgent', () => {
    const routeSource = readFileSync(
      resolve(process.cwd(), 'app/api/nic-nac/route.ts'),
      'utf8',
    )

    expect(routeSource).toContain("'x-nic-nac-orchestrator': 'agent'")
    expect(routeSource).toContain('createConfiguredNicNacAgent({')
    expect(routeSource).not.toMatch(/legacyNicNacPOST|runLegacyNicNac/)
    expect(routeSource).not.toContain('NIC_NAC_AGENT_HARNESS')
    expect(
      existsSync(resolve(process.cwd(), 'app/api/nic-nac/legacy-route.ts')),
    ).toBe(false)
    expect(
      existsSync(resolve(process.cwd(), 'lib/nic-nac/agent/rollout.ts')),
    ).toBe(false)
  })
})
