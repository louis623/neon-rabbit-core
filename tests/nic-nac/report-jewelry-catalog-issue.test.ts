import { beforeEach, describe, expect, it, vi } from 'vitest'

const reportJewelryCatalogIssueMock = vi.fn()

vi.mock('@/lib/services/jewelry-catalog-corrections', () => ({
  reportJewelryCatalogIssue: (...args: unknown[]) =>
    reportJewelryCatalogIssueMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ __isAdmin: true }),
}))

import { reportJewelryCatalogIssueTool } from '@/lib/nic-nac/tools/report-jewelry-catalog-issue'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeTool(): ToolDef {
  return reportJewelryCatalogIssueTool.build({
    repId: 'rep-1',
    conversationId: 'conversation-1',
    runId: 'run-1',
    supabase: {} as never,
  }) as unknown as ToolDef
}

beforeEach(() => {
  reportJewelryCatalogIssueMock.mockReset()
})

describe('report_jewelry_catalog_issue', () => {
  it('passes admin client plus authenticated rep and conversation context to the service', async () => {
    reportJewelryCatalogIssueMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'RG100',
      changedFields: ['collectionName'],
      issueLogged: true,
      corrected: true,
    })

    const tool = makeTool()
    const result = await tool.execute({
      itemNumber: 'RG100',
      issueType: 'wrong_collection',
      reason: 'This is listed under the wrong collection.',
      correction: {
        collectionName: 'March Birthday',
        collectionYear: 2026,
        searchTags: ['rose gold', 'heart'],
      },
    })

    expect(result).toMatchObject({
      designId: 'design-1',
      corrected: true,
    })
    expect(reportJewelryCatalogIssueMock).toHaveBeenCalledWith(
      { __isAdmin: true },
      {
        itemNumber: 'RG100',
        repId: 'rep-1',
        conversationId: 'conversation-1',
        issueType: 'wrong_collection',
        reason: 'This is listed under the wrong collection.',
        correction: {
          collectionName: 'March Birthday',
          collectionYear: 2026,
          searchTags: ['rose gold', 'heart'],
        },
      },
    )
  })

  it('is registered as a write tool', () => {
    expect(reportJewelryCatalogIssueTool.name).toBe('report_jewelry_catalog_issue')
    expect(reportJewelryCatalogIssueTool.readOnly).toBe(false)
  })
})
