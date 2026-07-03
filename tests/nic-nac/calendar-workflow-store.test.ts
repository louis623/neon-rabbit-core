import { describe, expect, it, vi } from 'vitest'
import {
  createCalendarWorkflowSession,
  getActiveCalendarWorkflowSession,
  updateCalendarWorkflowSession,
} from '@/lib/nic-nac/workflows/calendar-workflow-store'

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  rep_id: 'rep-1',
  conversation_id: '22222222-2222-4222-8222-222222222222',
  workflow_type: 'calendar_event_work',
  status: 'active',
  phase: 'details_capture',
  intent: 'add_show',
  known_fields: { title: 'BlingKitchen Live' },
  missing_fields: ['platform'],
  candidate_event_ids: [],
  last_user_message_id: 'msg-1',
  expires_at: '2026-07-03T02:00:00.000Z',
  created_at: '2026-07-03T00:00:00.000Z',
  updated_at: '2026-07-03T00:01:00.000Z',
}

function makeSingleChain(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: result, error: null })),
  }
  return chain
}

describe('calendar workflow store', () => {
  it('loads active calendar workflow state for the authenticated rep conversation', async () => {
    const chain = makeSingleChain(row)
    const supabase = { from: vi.fn(() => chain) }

    const result = await getActiveCalendarWorkflowSession(supabase as never, {
      repId: 'rep-1',
      conversationId: row.conversation_id,
      nowIso: '2026-07-03T00:30:00.000Z',
    })

    expect(result?.workflowType).toBe('calendar_event_work')
    expect(result?.knownFields.title).toBe('BlingKitchen Live')
    expect(chain.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(chain.eq).toHaveBeenCalledWith('conversation_id', row.conversation_id)
    expect(chain.gt).toHaveBeenCalledWith('expires_at', '2026-07-03T00:30:00.000Z')
  })

  it('creates calendar workflow state scoped to rep and conversation', async () => {
    const chain = makeSingleChain(row)
    const supabase = { from: vi.fn(() => chain) }

    await createCalendarWorkflowSession(supabase as never, {
      repId: 'rep-1',
      conversationId: row.conversation_id,
      lastUserMessageId: 'msg-1',
    })

    expect(chain.insert).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      conversation_id: row.conversation_id,
      last_user_message_id: 'msg-1',
    })
  })

  it('updates known fields and missing fields without changing rep scope', async () => {
    const chain = makeSingleChain(row)
    const supabase = { from: vi.fn(() => chain) }

    await updateCalendarWorkflowSession(supabase as never, {
      id: row.id,
      repId: row.rep_id,
      conversationId: row.conversation_id,
      workflowType: 'calendar_event_work',
      status: 'active',
      phase: 'ready_to_add',
      intent: 'add_show',
      knownFields: { platform: 'TikTok' },
      missingFields: [],
      candidateEventIds: [],
      lastUserMessageId: 'msg-2',
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'ready_to_add',
      known_fields: { platform: 'TikTok' },
      missing_fields: [],
      expires_at: expect.any(String),
      updated_at: expect.any(String),
    }))
    expect(chain.eq).toHaveBeenCalledWith('id', row.id)
    expect(chain.eq).toHaveBeenCalledWith('rep_id', row.rep_id)
  })
})
