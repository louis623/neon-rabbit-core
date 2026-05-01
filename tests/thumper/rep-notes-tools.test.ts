import { beforeEach, describe, expect, it, vi } from 'vitest'

const logIncidentMock = vi.fn()

vi.mock('@/lib/thumper/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

import {
  makeWriteRepNoteTool,
  writeRepNoteTool,
} from '@/lib/thumper/tools/write-rep-note'
import {
  makeReadRecentRepNotesTool,
  readRecentRepNotesTool,
} from '@/lib/thumper/tools/read-recent-rep-notes'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeInsertChain<T>(response: { data: T | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  return {
    api: { insert },
    spies: { insert, select, single },
  }
}

function makeReadChain<T>(response: { data: T; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(response)
  const order = vi.fn(() => ({ limit }))
  const eq = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq }))
  return {
    api: { select },
    spies: { select, eq, order, limit },
  }
}

function makeCtx(supabase: { from: (table: string) => unknown }) {
  return {
    repId: 'rep-1',
    supabase: supabase as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

beforeEach(() => {
  logIncidentMock.mockReset()
})

describe('rep note tools', () => {
  it('write_rep_note inserts a rep-scoped note and returns a truncated preview', async () => {
    const summary =
      'Talked through tonight’s TikTok show, updated the banner copy, and agreed to feature the Celestial collection first with a join-page push after the stream.'
    const chain = makeInsertChain({
      data: {
        summary,
        conversation_date: '2026-05-01T15:45:00.000Z',
      },
      error: null,
    })
    const from = vi.fn(() => chain.api)
    const tool = makeWriteRepNoteTool(makeCtx({ from })) as unknown as ToolDef

    const result = await tool.execute({
      summary,
      conversationDate: '2026-05-01T15:45:00.000Z',
    })

    expect(from).toHaveBeenCalledWith('rep_notes')
    expect(chain.spies.insert).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      summary,
      conversation_date: '2026-05-01T15:45:00.000Z',
    })
    expect(result).toEqual({
      saved: true,
      summaryPreview: summary.slice(0, 100),
      conversationDate: '2026-05-01T15:45:00.000Z',
    })
  })

  it('write_rep_note degrades quietly when the insert fails so the rep does not see an internal-memory error', async () => {
    const chain = makeInsertChain({
      data: null,
      error: { message: 'insert failed' },
    })
    const tool = makeWriteRepNoteTool(
      makeCtx({ from: vi.fn(() => chain.api) }),
    ) as unknown as ToolDef

    const result = await tool.execute({
      summary: 'Short summary',
      conversationDate: '2026-05-01T15:45:00.000Z',
    })

    expect(result).toEqual({
      saved: false,
      summaryPreview: 'Short summary',
    })
    expect(logIncidentMock).toHaveBeenCalledTimes(1)
    expect(logIncidentMock.mock.calls[0][0]).toMatchObject({
      errorType: 'rep_note_write_failed',
      severity: 'warn',
      repId: 'rep-1',
      conversationId: 'conv-1',
    })
  })

  it('read_recent_rep_notes defaults to 5, orders by conversation_date desc, and returns flattened note rows', async () => {
    const chain = makeReadChain({
      data: [
        {
          id: 'note-2',
          summary: 'Most recent',
          conversation_date: '2026-05-01T15:45:00.000Z',
        },
        {
          id: 'note-1',
          summary: 'Older note',
          conversation_date: '2026-04-30T18:00:00.000Z',
        },
      ],
      error: null,
    })
    const from = vi.fn(() => chain.api)
    const tool = makeReadRecentRepNotesTool(
      makeCtx({ from }),
    ) as unknown as ToolDef

    const result = await tool.execute({})

    expect(from).toHaveBeenCalledWith('rep_notes')
    expect(chain.spies.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(chain.spies.order).toHaveBeenCalledWith('conversation_date', {
      ascending: false,
    })
    expect(chain.spies.limit).toHaveBeenCalledWith(5)
    expect(result).toEqual({
      count: 2,
      notes: [
        {
          noteId: 'note-2',
          summary: 'Most recent',
          conversationDate: '2026-05-01T15:45:00.000Z',
        },
        {
          noteId: 'note-1',
          summary: 'Older note',
          conversationDate: '2026-04-30T18:00:00.000Z',
        },
      ],
    })
  })

  it('read_recent_rep_notes clamps limit to 20 when execute() is called directly with an oversized value', async () => {
    const chain = makeReadChain({
      data: [],
      error: null,
    })
    const tool = makeReadRecentRepNotesTool(
      makeCtx({ from: vi.fn(() => chain.api) }),
    ) as unknown as ToolDef

    await tool.execute({ limit: 99 })

    expect(chain.spies.limit).toHaveBeenCalledWith(20)
  })

  it('read_recent_rep_notes degrades to an empty context result when the lookup fails', async () => {
    const chain = makeReadChain({
      data: [],
      error: { message: 'select failed' },
    })
    const tool = makeReadRecentRepNotesTool(
      makeCtx({ from: vi.fn(() => chain.api) }),
    ) as unknown as ToolDef

    const result = await tool.execute({})

    expect(result).toEqual({
      count: 0,
      notes: [],
      unavailable: true,
    })
    expect(logIncidentMock).toHaveBeenCalledTimes(1)
    expect(logIncidentMock.mock.calls[0][0]).toMatchObject({
      errorType: 'rep_note_read_failed',
      severity: 'warn',
      repId: 'rep-1',
      conversationId: 'conv-1',
    })
  })

  it('marks read_recent_rep_notes as read-only and write_rep_note as a write tool', () => {
    expect(readRecentRepNotesTool.readOnly).toBe(true)
    expect(readRecentRepNotesTool.name).toBe('read_recent_rep_notes')
    expect(writeRepNoteTool.readOnly).toBe(false)
    expect(writeRepNoteTool.name).toBe('write_rep_note')
  })
})
