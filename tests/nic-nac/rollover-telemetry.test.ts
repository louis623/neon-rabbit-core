import { beforeEach, describe, expect, it, vi } from 'vitest'

const insertMock = vi.fn()
const fromMock = vi.fn(() => ({ insert: insertMock }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: fromMock }),
}))

import { logNicNacRollover } from '@/lib/nic-nac/rollover-telemetry'

beforeEach(() => {
  fromMock.mockClear()
  insertMock.mockReset()
  insertMock.mockResolvedValue({ error: null })
})

describe('Nic-Nac rollover telemetry', () => {
  it('records source and destination conversation linkage', async () => {
    await logNicNacRollover({
      repId: 'rep-1',
      sourceConversationId: 'source-conv',
      destinationConversationId: 'dest-conv',
      carriedMessageCount: 12,
    })

    expect(fromMock).toHaveBeenCalledWith('nic_nac_rollovers')
    expect(insertMock).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      source_conversation_id: 'source-conv',
      destination_conversation_id: 'dest-conv',
      carried_message_count: 12,
      reason: 'run_health_threshold',
    })
  })

  it('swallows insert failures so rollover cannot break chat recovery', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'db down' } })

    await expect(
      logNicNacRollover({
        repId: 'rep-1',
        sourceConversationId: 'source-conv',
        destinationConversationId: 'dest-conv',
        carriedMessageCount: 12,
      }),
    ).resolves.toBeUndefined()
  })
})
