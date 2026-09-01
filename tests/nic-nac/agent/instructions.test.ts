import { describe, expect, it } from 'vitest'
import {
  createSuiteOperatorSupportProductContext,
  createSuiteRepWorkspaceProductContext,
} from '@/lib/nic-nac/core/product-context'
import { buildNicNacAgentInstructions } from '@/lib/nic-nac/agent/instructions'

describe('Nic-Nac employee instructions', () => {
  it('makes the current request, natural task switching, and tool truth the operating guide', () => {
    const instructions = buildNicNacAgentInstructions({
      productContext: createSuiteRepWorkspaceProductContext({
        repId: 'rep-1',
      }),
      repDisplayName: 'Louis Chapman',
      taskContext: 'Paused goal: add a Dance Floor dancer; item ER13229.',
    })

    expect(instructions).toContain('The latest explicit request or correction wins.')
    expect(instructions).toContain('A prior unfinished task is context, not a lock.')
    expect(instructions).toContain('A completed read is complete')
    expect(instructions).toContain('ask one short, specific question')
    expect(instructions).toContain('Choose tools yourself')
    expect(instructions).toContain('Use more than one tool, in sequence')
    expect(instructions).toContain(
      'unless the corresponding tool result proves it',
    )
    expect(instructions).toContain(
      'Task continuity (facts to preserve, never a tool-selection lock)',
    )
    expect(instructions).toContain('Louis Chapman')
    expect(instructions).not.toContain('Required Nic-Nac setup mode:')
  })

  it('keeps required setup a separate capability mode', () => {
    const instructions = buildNicNacAgentInstructions({
      mode: 'required_setup',
      productContext: createSuiteRepWorkspaceProductContext({
        repId: 'rep-1',
      }),
    })

    expect(instructions).toContain('Stay in required setup.')
    expect(instructions).toContain(
      'normal Workspace capabilities are intentionally unavailable',
    )
    expect(instructions).toContain('Required Nic-Nac setup mode:')
    expect(instructions).toContain('unlock_required_setup')
  })

  it('states the dedicated support operator boundary without granting account control', () => {
    const instructions = buildNicNacAgentInstructions({
      productContext: createSuiteOperatorSupportProductContext({
        targetRepId: 'rep-1',
        targetUserId: 'user-1',
        operatorRepId: 'operator-1',
        supportSessionId: 'support-1',
      }),
    })

    expect(instructions).toContain('disclosed Nic-Nac Support session')
    expect(instructions).toContain('Address the subject rep, not the operator.')
    expect(instructions).toContain(
      'Support has no owner, billing, Stripe, payment, authentication, entitlement, account-control, DNS, domain-ownership, or customer-domain-mapping authority.',
    )
  })
})
