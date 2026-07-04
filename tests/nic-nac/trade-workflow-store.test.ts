import { describe, expect, it, vi } from 'vitest'
import {
  completeTradeWorkflowSession,
  createTradeWorkflowSession,
  getActiveTradeWorkflowSession,
  isMissingTradeWorkflowSchemaError,
  updateTradeWorkflowSession,
} from '@/lib/nic-nac/workflows/trade-workflow-store'

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'workflow-1',
    rep_id: 'rep-1',
    conversation_id: 'conversation-1',
    workflow_type: 'trade_board_remove_listing',
    status: 'active',
    phase: 'started',
    intent: 'remove_listing',
    known_fields: {},
    missing_fields: [],
    blockers: [],
    candidates: [],
    approval_state: 'not_required',
    last_user_message_id: null,
    expires_at: '2026-07-04T14:00:00.000Z',
    created_at: '2026-07-04T12:00:00.000Z',
    updated_at: '2026-07-04T12:00:00.000Z',
    ...overrides,
  }
}

function makeTable(result: Record<string, unknown>) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'gt', 'in', 'order', 'limit']) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(result)
  chain.single = vi.fn().mockResolvedValue(result)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  return chain
}

describe('trade workflow store', () => {
  it('loads the newest active workflow for a rep conversation', async () => {
    const table = makeTable({ data: makeRow(), error: null })
    const from = vi.fn().mockReturnValue(table)

    const result = await getActiveTradeWorkflowSession(
      { from } as never,
      {
        repId: 'rep-1',
        conversationId: 'conversation-1',
        nowIso: '2026-07-04T12:30:00.000Z',
        workflowTypes: ['trade_board_remove_listing'],
      },
    )

    expect(from).toHaveBeenCalledWith('nic_nac_trade_workflows')
    expect(table.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(table.eq).toHaveBeenCalledWith('conversation_id', 'conversation-1')
    expect(table.in).toHaveBeenCalledWith('workflow_type', [
      'trade_board_remove_listing',
    ])
    expect(result).toMatchObject({
      id: 'workflow-1',
      workflowType: 'trade_board_remove_listing',
      intent: 'remove_listing',
    })
  })

  it('creates a workflow session with the requested workflow type and intent', async () => {
    const table = makeTable({ data: makeRow(), error: null })
    const from = vi.fn().mockReturnValue(table)

    await createTradeWorkflowSession(
      { from } as never,
      {
        repId: 'rep-1',
        conversationId: 'conversation-1',
        workflowType: 'trade_board_remove_listing',
        intent: 'remove_listing',
        lastUserMessageId: 'message-1',
      },
    )

    expect(table.insert).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      conversation_id: 'conversation-1',
      workflow_type: 'trade_board_remove_listing',
      intent: 'remove_listing',
      last_user_message_id: 'message-1',
    })
  })

  it('updates durable workflow state and extends expiry', async () => {
    const table = makeTable({
      data: makeRow({
        phase: 'ready_to_remove',
        known_fields: { listingId: 'listing-1' },
      }),
      error: null,
    })
    const from = vi.fn().mockReturnValue(table)

    await updateTradeWorkflowSession(
      { from } as never,
      {
        id: 'workflow-1',
        repId: 'rep-1',
        conversationId: 'conversation-1',
        workflowType: 'trade_board_remove_listing',
        status: 'active',
        phase: 'ready_to_remove',
        intent: 'remove_listing',
        knownFields: { listingId: 'listing-1' },
        missingFields: [],
        blockers: [],
        candidates: [],
        approvalState: 'approved',
      },
    )

    expect(table.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        phase: 'ready_to_remove',
        intent: 'remove_listing',
        known_fields: { listingId: 'listing-1' },
        approval_state: 'approved',
        expires_at: expect.any(String),
        updated_at: expect.any(String),
      }),
    )
    expect(table.eq).toHaveBeenCalledWith('id', 'workflow-1')
    expect(table.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
  })

  it('marks workflow sessions completed after successful mutations', async () => {
    const table = makeTable({
      data: makeRow({
        status: 'completed',
        phase: 'completed',
        known_fields: { listingId: 'listing-1' },
      }),
      error: null,
    })
    const from = vi.fn().mockReturnValue(table)

    await completeTradeWorkflowSession(
      { from } as never,
      {
        id: 'workflow-1',
        repId: 'rep-1',
        conversationId: 'conversation-1',
        workflowType: 'trade_board_remove_listing',
        status: 'active',
        phase: 'ready_to_remove',
        intent: 'remove_listing',
        knownFields: {},
        missingFields: [],
        blockers: [],
        candidates: [],
        approvalState: 'required',
      },
      {
        knownFields: { listingId: 'listing-1' },
        approvalState: 'approved',
      },
    )

    expect(table.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        phase: 'completed',
        known_fields: { listingId: 'listing-1' },
        missing_fields: [],
        blockers: [],
        approval_state: 'approved',
      }),
    )
  })

  it('detects missing schema errors for rollout-safe fallback', () => {
    expect(
      isMissingTradeWorkflowSchemaError(
        new Error('Could not find the table public.nic_nac_trade_workflows in the schema cache'),
      ),
    ).toBe(true)
    expect(isMissingTradeWorkflowSchemaError(new Error('network'))).toBe(false)
  })
})
