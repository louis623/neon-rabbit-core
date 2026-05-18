import { beforeEach, describe, expect, it, vi } from 'vitest'

const insertMock = vi.fn()
const fromMock = vi.fn(() => ({ insert: insertMock }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: fromMock }),
}))

import {
  getLatestNicNacRunHealth,
  logNicNacRun,
  normalizeRunUsage,
} from '@/lib/nic-nac/run-telemetry'

beforeEach(() => {
  fromMock.mockClear()
  insertMock.mockReset()
  insertMock.mockResolvedValue({ error: null })
})

describe('Nic-Nac run telemetry', () => {
  it('normalizes AI SDK usage details for persistence', () => {
    expect(
      normalizeRunUsage({
        inputTokens: 6_100,
        outputTokens: 216,
        totalTokens: 6_316,
        inputTokenDetails: {
          cacheReadTokens: 1_000,
          cacheWriteTokens: 2_000,
        },
      }),
    ).toEqual({
      inputTokens: 6_100,
      outputTokens: 216,
      totalTokens: 6_316,
      cacheReadTokens: 1_000,
      cacheWriteTokens: 2_000,
    })
  })

  it('persists token usage, latency, routing, and compaction metadata', async () => {
    await logNicNacRun({
      runId: 'run-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
      model: 'claude-haiku-4-5-20251001',
      status: 'complete',
      latencyMs: 1234,
      intents: ['show_memory'],
      toolNames: ['get_show_session_context', 'record_show_session_event'],
      modelContext: {
        originalMessageCount: 50,
        modelMessageCount: 20,
        droppedMessageCount: 30,
        estimatedTokens: 5_500,
        wasCompacted: true,
      },
      usage: {
        inputTokens: 6_100,
        outputTokens: 216,
        totalTokens: 6_316,
        cacheReadTokens: 1_000,
        cacheWriteTokens: 2_000,
      },
    })

    expect(fromMock).toHaveBeenCalledWith('nic_nac_runs')
    expect(insertMock).toHaveBeenCalledWith({
      run_id: 'run-1',
      rep_id: 'rep-1',
      conversation_id: 'conv-1',
      model: 'claude-haiku-4-5-20251001',
      status: 'complete',
      latency_ms: 1234,
      input_tokens: 6_100,
      output_tokens: 216,
      total_tokens: 6_316,
      cache_read_tokens: 1_000,
      cache_write_tokens: 2_000,
      routed_intents: ['show_memory'],
      tool_names: ['get_show_session_context', 'record_show_session_event'],
      tool_count: 2,
      model_message_count: 20,
      original_message_count: 50,
      dropped_message_count: 30,
      estimated_context_tokens: 5_500,
      context_compacted: true,
      rollover_recommended: true,
      rollover_reasons: ['context_compacted'],
      error_message: null,
    })
  })

  it('swallows insert failures so telemetry cannot break a reply', async () => {
    insertMock.mockResolvedValueOnce({
      error: { message: 'db down' },
    })

    await expect(
      logNicNacRun({
        runId: 'run-2',
        repId: 'rep-1',
        conversationId: 'conv-1',
        model: 'claude-haiku-4-5-20251001',
        status: 'error',
        latencyMs: 9,
        intents: [],
        toolNames: [],
        modelContext: {
          originalMessageCount: 1,
          modelMessageCount: 1,
          droppedMessageCount: 0,
          estimatedTokens: 10,
          wasCompacted: false,
        },
        errorMessage: 'stream failed',
      }),
    ).resolves.toBeUndefined()
  })

  it('loads the latest run health summary for cheap rollover checks', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValueOnce({
      data: {
        run_id: 'run-3',
        status: 'complete',
        created_at: '2026-05-17T22:00:00.000Z',
        latency_ms: 12_345,
        input_tokens: 81_000,
        total_tokens: 82_000,
        estimated_context_tokens: 19_000,
        context_compacted: true,
        rollover_recommended: true,
        rollover_reasons: ['high_input_tokens', 'context_compacted'],
      },
      error: null,
    })
    const limitMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
    const orderMock = vi.fn(() => ({ limit: limitMock }))
    const eqConversationMock = vi.fn(() => ({ order: orderMock }))
    const eqRepMock = vi.fn(() => ({ eq: eqConversationMock }))
    const selectMock = vi.fn(() => ({ eq: eqRepMock }))
    fromMock.mockReturnValueOnce({ select: selectMock } as unknown as ReturnType<typeof fromMock>)

    await expect(
      getLatestNicNacRunHealth('rep-1', 'conv-1'),
    ).resolves.toEqual({
      runId: 'run-3',
      status: 'complete',
      createdAt: '2026-05-17T22:00:00.000Z',
      latencyMs: 12_345,
      inputTokens: 81_000,
      totalTokens: 82_000,
      estimatedContextTokens: 19_000,
      contextCompacted: true,
      rolloverRecommended: true,
      rolloverReasons: ['high_input_tokens', 'context_compacted'],
    })

    expect(fromMock).toHaveBeenCalledWith('nic_nac_runs')
    expect(eqRepMock).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(eqConversationMock).toHaveBeenCalledWith('conversation_id', 'conv-1')
  })
})
