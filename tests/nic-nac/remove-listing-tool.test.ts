import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

const removeListingMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()

vi.mock('@/lib/services/trade-board', () => ({
  removeListing: (...args: unknown[]) => removeListingMock(...args),
  TradeBoardError: class TradeBoardError extends Error {
    readonly code: string
    constructor(code: string, message: string) {
      super(message)
      this.name = 'TradeBoardError'
      this.code = code
    }
  },
}))

vi.mock('@/lib/nic-nac/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
}))

import { makeRemoveListingTool } from '@/lib/nic-nac/tools/remove-listing'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
  needsApproval?: boolean
}

function makeTool(): ToolDef {
  return makeRemoveListingTool({
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }) as unknown as ToolDef
}

beforeEach(() => {
  removeListingMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
})

describe('remove_listing tool', () => {
  it('requires HITL approval', () => {
    expect(makeTool().needsApproval).toBe(true)
  })

  it('translates ambiguous item-number removal into an exact-listing prompt', async () => {
    removeListingMock.mockRejectedValueOnce(errors.AMBIGUOUS_LISTING('ER13229'))

    await expect(
      makeTool().execute({
        itemNumber: 'ER13229',
        reason: 'mistake',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'AMBIGUOUS_LISTING',
      userMessage:
        'I found more than one active physical piece for that item. Pick the exact listing before I remove anything.',
    })

    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })
})
