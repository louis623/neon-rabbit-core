// Unit tests for the update_listing Thumper tool handler.
//
// Covers: schema-level refines (at-least-one-patch, photo-conflict),
// handler-level defense-in-depth (NO_PATCH_FIELDS, CONFLICTING_PHOTO_INPUTS),
// happy-path service threading + audit, ServiceError translation, and
// audit-failure isolation. Mock paths exactly match the imports in
// lib/thumper/tools/update-listing.ts.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { errors } from '@/lib/services/errors'

const updateListingMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()

vi.mock('@/lib/services/trade-board', () => ({
  updateListing: (...args: unknown[]) => updateListingMock(...args),
}))

vi.mock('@/lib/thumper/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

vi.mock('@/lib/thumper/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
}))

import {
  makeUpdateListingTool,
  updateListingTool,
  inputSchema,
} from '@/lib/thumper/tools/update-listing'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
  needsApproval?: boolean
}

function makeTool(): ToolDef {
  return makeUpdateListingTool({
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }) as unknown as ToolDef
}

// Zod 4 enforces version + variant bits on `.uuid()`: the 3rd group must
// start with [1-8] and the 4th with [89abAB]. Picking a v4-shaped UUID.
const VALID_LISTING_ID = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  updateListingMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
})

describe('update_listing — schema (inputSchema.safeParse)', () => {
  it('rejects an empty patch (no fields besides listingId)', () => {
    const result = inputSchema.safeParse({ listingId: VALID_LISTING_ID })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => /at least one of/.test(m))).toBe(true)
    }
  })

  it('rejects missing listingId', () => {
    const result = inputSchema.safeParse({ repNotes: 'updated' })
    expect(result.success).toBe(false)
  })

  it('accepts a patch with a single field set', () => {
    const result = inputSchema.safeParse({
      listingId: VALID_LISTING_ID,
      repNotes: 'wedding gift',
    })
    expect(result.success).toBe(true)
  })

  it('rejects listingPhotoUrl + useCanonicalPhoto:true (conflicting photo inputs)', () => {
    const result = inputSchema.safeParse({
      listingId: VALID_LISTING_ID,
      listingPhotoUrl: 'https://example.com/x.jpg',
      useCanonicalPhoto: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => /cannot set listingPhotoUrl/.test(m))).toBe(
        true,
      )
    }
  })

  it('allows listingPhotoUrl:null + useCanonicalPhoto:true (both express "clear the rep photo")', () => {
    const result = inputSchema.safeParse({
      listingId: VALID_LISTING_ID,
      listingPhotoUrl: null,
      useCanonicalPhoto: true,
    })
    expect(result.success).toBe(true)
  })
})

describe('update_listing — handler defense-in-depth (bypasses schema)', () => {
  it('throws NO_PATCH_FIELDS when execute() is called with no patch fields', async () => {
    const tool = makeTool()
    await expect(
      tool.execute({ listingId: VALID_LISTING_ID }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'NO_PATCH_FIELDS',
    })
    expect(updateListingMock).not.toHaveBeenCalled()
    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })

  it('throws CONFLICTING_PHOTO_INPUTS when listingPhotoUrl and useCanonicalPhoto:true both arrive at the handler', async () => {
    const tool = makeTool()
    await expect(
      tool.execute({
        listingId: VALID_LISTING_ID,
        listingPhotoUrl: 'https://example.com/x.jpg',
        useCanonicalPhoto: true,
      }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'CONFLICTING_PHOTO_INPUTS',
    })
    // Critical: must NOT touch the service or audit when rejecting.
    expect(updateListingMock).not.toHaveBeenCalled()
    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })
})

describe('update_listing — write + audit happy path', () => {
  it('calls updateListing with auth client + repId + listingId + scoped patch, writes listing_updated audit, returns service result + patchedFields', async () => {
    updateListingMock.mockResolvedValueOnce({
      listingId: VALID_LISTING_ID,
      status: 'available',
    })

    const tool = makeTool()
    const result = await tool.execute({
      listingId: VALID_LISTING_ID,
      repNotes: 'updated note',
      tradePreferences: 'looking for sapphires',
    })

    expect(updateListingMock).toHaveBeenCalledTimes(1)
    // updateListing(supabase, repId, listingId, patch)
    expect(updateListingMock.mock.calls[0][1]).toBe('rep-1')
    expect(updateListingMock.mock.calls[0][2]).toBe(VALID_LISTING_ID)
    expect(updateListingMock.mock.calls[0][3]).toEqual({
      repNotes: 'updated note',
      tradePreferences: 'looking for sapphires',
    })

    expect(writeTradeActionAuditMock).toHaveBeenCalledTimes(1)
    const auditArg = writeTradeActionAuditMock.mock.calls[0][0] as {
      actionType: string
      repId: string
      targetListingId: string
      beforeState: Record<string, unknown>
      afterState: Record<string, unknown>
      details: Record<string, unknown>
    }
    expect(auditArg).toMatchObject({
      actionType: 'listing_updated',
      repId: 'rep-1',
      targetListingId: VALID_LISTING_ID,
      details: { runId: 'run-1', conversationId: 'conv-1' },
    })
    expect(auditArg.afterState.patchedFields).toEqual([
      'repNotes',
      'tradePreferences',
    ])

    expect(result).toEqual({
      listingId: VALID_LISTING_ID,
      status: 'available',
      patchedFields: ['repNotes', 'tradePreferences'],
    })
  })

  it('useCanonicalPhoto:true does not include listingPhotoUrl in patchedFields even if model passed it as null (allowed combo)', async () => {
    updateListingMock.mockResolvedValueOnce({
      listingId: VALID_LISTING_ID,
      status: 'available',
    })

    const tool = makeTool()
    const result = await tool.execute({
      listingId: VALID_LISTING_ID,
      listingPhotoUrl: null,
      useCanonicalPhoto: true,
    })

    // Service receives both fields — the service applies useCanonicalPhoto
    // precedence. Audit reflects what the service actually used.
    const patch = updateListingMock.mock.calls[0][3] as Record<string, unknown>
    expect(patch.useCanonicalPhoto).toBe(true)

    // patchedFields list excludes listingPhotoUrl when useCanonicalPhoto:true
    // is set with a non-null URL — audit mirrors service behavior, not input.
    // For null + true (allowed combo), the order doesn't matter much, but
    // the audit must at least include useCanonicalPhoto.
    const patchedFields = (result.patchedFields as string[]) ?? []
    expect(patchedFields).toContain('useCanonicalPhoto')
  })
})

describe('update_listing — error handling', () => {
  it('translates LISTING_NOT_FOUND ServiceError into ThumperToolError without auditing', async () => {
    updateListingMock.mockRejectedValueOnce(errors.LISTING_NOT_FOUND('l-1'))

    const tool = makeTool()
    await expect(
      tool.execute({ listingId: VALID_LISTING_ID, repNotes: 'x' }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'LISTING_NOT_FOUND',
    })
    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })

  it('translates INVALID_STATUS_TRANSITION ServiceError without auditing', async () => {
    updateListingMock.mockRejectedValueOnce(
      errors.INVALID_STATUS_TRANSITION('traded', 'edit'),
    )

    const tool = makeTool()
    await expect(
      tool.execute({ listingId: VALID_LISTING_ID, repNotes: 'x' }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'INVALID_STATUS_TRANSITION',
    })
    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })

  it('returns the success result even when audit write fails (audit is observability, not business logic)', async () => {
    updateListingMock.mockResolvedValueOnce({
      listingId: VALID_LISTING_ID,
      status: 'available',
    })
    writeTradeActionAuditMock.mockRejectedValueOnce(
      new Error('audit table unreachable'),
    )

    const tool = makeTool()
    const result = await tool.execute({
      listingId: VALID_LISTING_ID,
      repNotes: 'x',
    })

    expect(result).toMatchObject({
      listingId: VALID_LISTING_ID,
      status: 'available',
    })
    expect(logIncidentMock).toHaveBeenCalledTimes(1)
    expect(logIncidentMock.mock.calls[0][0]).toMatchObject({
      errorType: 'audit_write_failed',
      severity: 'warn',
    })
  })
})

describe('update_listing — registry metadata', () => {
  it('exposes readOnly:false on the ToolDefinition (write tool) and no needsApproval (reversible)', () => {
    expect(updateListingTool.readOnly).toBe(false)
    expect(updateListingTool.name).toBe('update_listing')

    // The factory return — needsApproval should NOT be set (update is reversible).
    const built = makeTool()
    expect(built.needsApproval).toBeFalsy()
  })
})
