import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

const restoreListingMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()

vi.mock('@/lib/services/trade-board', () => ({
  restoreListing: (...args: unknown[]) => restoreListingMock(...args),
}))

vi.mock('@/lib/nic-nac/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
}))

import {
  makeRestoreListingTool,
  restoreListingTool,
} from '@/lib/nic-nac/tools/restore-listing'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
  needsApproval?: boolean
}

const VALID_LISTING_ID = '11111111-1111-4111-8111-111111111111'

function makeTool(): ToolDef {
  return makeRestoreListingTool({
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }) as unknown as ToolDef
}

beforeEach(() => {
  restoreListingMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
})

describe('restore_listing tool', () => {
  it('calls restoreListing with the auth client and writes a restore audit row', async () => {
    restoreListingMock.mockResolvedValueOnce({
      listingId: VALID_LISTING_ID,
      designName: 'Aurora Ring',
      status: 'available',
      deletedAt: '2026-05-16T12:00:00.000Z',
      recoveryWindowDays: 7,
    })

    const result = await makeTool().execute({ listingId: VALID_LISTING_ID })

    expect(restoreListingMock).toHaveBeenCalledWith(
      {},
      'rep-1',
      { listingId: VALID_LISTING_ID, itemNumber: undefined },
    )
    expect(writeTradeActionAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'restore_listing',
        repId: 'rep-1',
        targetListingId: VALID_LISTING_ID,
        beforeState: expect.objectContaining({ status: 'removed' }),
        afterState: expect.objectContaining({ status: 'available' }),
      }),
    )
    expect(result).toMatchObject({
      listingId: VALID_LISTING_ID,
      designName: 'Aurora Ring',
      status: 'available',
      recoveryWindowDays: 7,
    })
  })

  it('translates expired recovery errors without auditing', async () => {
    restoreListingMock.mockRejectedValueOnce(errors.LISTING_RECOVERY_EXPIRED(7))

    await expect(
      makeTool().execute({ listingId: VALID_LISTING_ID }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'LISTING_RECOVERY_EXPIRED',
    })
    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })

  it('is registered as a write tool without HITL approval', () => {
    expect(restoreListingTool.name).toBe('restore_listing')
    expect(restoreListingTool.readOnly).toBe(false)
    expect(makeTool().needsApproval).toBeFalsy()
  })
})
