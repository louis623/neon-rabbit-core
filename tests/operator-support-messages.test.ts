import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OperatorSupportSession } from '@/lib/operator-support/types'

vi.mock('server-only', () => ({}))

const publishWorkspaceMessageMock = vi.fn()
const enqueueOutboxMock = vi.fn()
const hasSuccessfulMutationMock = vi.fn()

vi.mock('@/lib/services/workspace-messages', () => ({
  publishWorkspaceMessage: (...args: unknown[]) => publishWorkspaceMessageMock(...args),
}))
vi.mock('@/lib/services/workspace-message-outbox', () => ({
  enqueueWorkspaceMessageOutboxEvent: (...args: unknown[]) => enqueueOutboxMock(...args),
}))
vi.mock('@/lib/operator-support/audit', () => ({
  operatorSupportSessionHasSuccessfulMutation: (...args: unknown[]) =>
    hasSuccessfulMutationMock(...args),
}))

import { enqueueMissingOperatorSupportCompletionNotices } from '@/lib/operator-support/completion-retry'
import { publishOperatorSupportEndNotice } from '@/lib/operator-support/messages'

function endedSession(): OperatorSupportSession {
  return {
    id: 'session-1',
    operatorRepId: 'operator-1',
    operatorEmailSnapshot: 'louis@example.com',
    operatorDisplayNameSnapshot: 'Louis',
    targetRepId: 'rep-kim',
    targetNameSnapshot: 'Kim',
    targetBusinessSnapshot: 'Kim Sparkles',
    reasonCode: 'account_setup',
    reasonNote: null,
    supportReportId: null,
    status: 'ended',
    capabilities: ['workspace.view'],
    requestId: 'request-1',
    startedAt: '2026-08-29T16:00:00.000Z',
    lastActivityAt: '2026-08-29T16:20:00.000Z',
    expiresAt: '2026-08-29T16:30:00.000Z',
    extendedAt: null,
    endedAt: '2026-08-29T16:20:00.000Z',
    endedReason: 'operator',
    completionSummary: 'Updated the homepage welcome copy.',
    startPublicationId: 'publication-start',
    endPublicationId: null,
    createdAt: '2026-08-29T15:59:00.000Z',
    updatedAt: '2026-08-29T16:20:00.000Z',
  }
}

describe('operator support transparency messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    publishWorkspaceMessageMock.mockResolvedValue({
      id: 'publication-end',
      status: 'published',
      audienceCount: 1,
      deliveryCount: 1,
    })
    enqueueOutboxMock.mockResolvedValue({ id: 'outbox-1' })
  })

  it('includes the customer-safe completion summary, reason, and ET close time', async () => {
    await publishOperatorSupportEndNotice(
      {} as SupabaseClient,
      endedSession(),
      true,
    )

    expect(publishWorkspaceMessageMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        audience: { kind: 'selected', repIds: ['rep-kim'] },
        expectedRecipientCount: 1,
        body: expect.stringMatching(
          /ended by Sparkle Suite Support.*EDT.*Updated the homepage welcome copy\./,
        ),
      }),
    )
  })

  it('derives retry change status from durable mutation evidence', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'session-1',
            completion_summary: null,
            start_publication_id: 'publication-start',
          },
        ],
        error: null,
      }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) } as unknown as SupabaseClient
    hasSuccessfulMutationMock.mockResolvedValue(true)

    await enqueueMissingOperatorSupportCompletionNotices(supabase)

    expect(hasSuccessfulMutationMock).toHaveBeenCalledWith(supabase, 'session-1')
    expect(enqueueOutboxMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        payload: { sessionId: 'session-1', changedAnything: true },
      }),
    )
  })
})
