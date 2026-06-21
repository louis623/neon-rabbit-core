import { describe, expect, it, vi, beforeEach } from 'vitest'

const logToolExecutionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logToolExecution: logToolExecutionMock,
}))

import { withTelemetry } from '@/lib/nic-nac/tools/wrappers/with-telemetry'
import type { ToolContext } from '@/lib/nic-nac/tools'

beforeEach(() => {
  logToolExecutionMock.mockClear()
})

describe('Nic-Nac tool telemetry', () => {
  it('correlates tool executions with the current model run id', async () => {
    const tool = {
      execute: vi.fn().mockResolvedValue({ ok: true }),
    }
    const ctx = {
      repId: '11111111-1111-4111-8111-111111111111',
      supabase: {} as never,
      conversationId: '22222222-2222-4222-8222-222222222222',
      runId: '33333333-3333-4333-8333-333333333333',
    } satisfies ToolContext

    const wrapped = withTelemetry('read_recent_rep_notes', ctx, tool as never)

    await (
      wrapped as unknown as { execute: (args: unknown) => Promise<unknown> }
    ).execute({
      limit: 3,
    })

    expect(logToolExecutionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'read_recent_rep_notes',
        repId: ctx.repId,
        conversationId: ctx.conversationId,
        runId: ctx.runId,
        success: true,
      }),
    )
  })
})
