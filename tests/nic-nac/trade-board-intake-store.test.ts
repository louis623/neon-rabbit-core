import { describe, expect, it, vi } from 'vitest'
import {
  createTradeBoardIntakeSession,
  getActiveTradeBoardIntakeSession,
  mapTradeBoardIntakeSessionRow,
  updateTradeBoardIntakeSession,
  upsertTradeBoardIntakePhoto,
} from '@/lib/nic-nac/workflows/trade-board-intake-store'

function makeBuilder(result: { data: unknown; error: unknown }) {
  const calls: Array<[string, unknown[]]> = []
  const builder: Record<string, unknown> = {
    select: (...args: unknown[]) => {
      calls.push(['select', args])
      return builder
    },
    insert: (...args: unknown[]) => {
      calls.push(['insert', args])
      return builder
    },
    update: (...args: unknown[]) => {
      calls.push(['update', args])
      return builder
    },
    upsert: (...args: unknown[]) => {
      calls.push(['upsert', args])
      return builder
    },
    eq: (...args: unknown[]) => {
      calls.push(['eq', args])
      return builder
    },
    gt: (...args: unknown[]) => {
      calls.push(['gt', args])
      return builder
    },
    order: (...args: unknown[]) => {
      calls.push(['order', args])
      return builder
    },
    limit: (...args: unknown[]) => {
      calls.push(['limit', args])
      return builder
    },
    single: () => result,
    maybeSingle: () => result,
  }
  return { builder, calls }
}

describe('Trade Board intake store', () => {
  it('maps session rows to camelCase workflow state', () => {
    const mapped = mapTradeBoardIntakeSessionRow({
      id: 'workflow-1',
      rep_id: 'rep-1',
      conversation_id: 'conv-1',
      workflow_type: 'trade_board_add_listing',
      status: 'active',
      current_phase: 'photo_capture',
      item_number: 'ER13229',
      design_name: 'The Florence Earrings',
      collection_name: 'July Birthday',
      missing_fields: ['jewelryFrontPhoto'],
      hard_blockers: [],
      soft_warnings: [],
      created_listing_ids: ['listing-1'],
      trade_board_intake_photos: [
        {
          id: 'photo-1',
          conversation_message_id: 'msg-1',
          attachment_index: 1,
          declared_role: 'label_details',
          visual_role: 'label_or_packaging',
          role_confirmed: true,
          quality: 'usable',
          quality_issues: [],
          notes: ['label only'],
        },
      ],
    })

    expect(mapped).toMatchObject({
      id: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
      phase: 'photo_capture',
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      missing: ['jewelryFrontPhoto'],
      createdListingIds: ['listing-1'],
      photos: [
        {
          declaredRole: 'label_details',
          visualRole: 'label_or_packaging',
          roleConfirmed: true,
        },
      ],
    })
  })

  it('queries for the active session by rep, conversation, status, and expiry', async () => {
    const { builder, calls } = makeBuilder({ data: null, error: null })
    const supabase = {
      from: vi.fn(() => builder),
    }

    await getActiveTradeBoardIntakeSession(supabase as never, {
      repId: 'rep-1',
      conversationId: 'conv-1',
      nowIso: '2026-06-15T00:00:00.000Z',
    })

    expect(supabase.from).toHaveBeenCalledWith('trade_board_intake_sessions')
    expect(calls).toContainEqual(['select', ['*']])
    expect(calls).not.toContainEqual([
      'select',
      ['*, trade_board_intake_photos(*)'],
    ])
    expect(calls).toContainEqual(['eq', ['rep_id', 'rep-1']])
    expect(calls).toContainEqual(['eq', ['conversation_id', 'conv-1']])
    expect(calls).toContainEqual(['eq', ['status', 'active']])
    expect(calls).toContainEqual(['gt', ['expires_at', '2026-06-15T00:00:00.000Z']])
  })

  it('creates, updates, and upserts through the expected tables', async () => {
    const sessionBuilder = makeBuilder({ data: { id: 'workflow-1' }, error: null })
    const photoBuilder = makeBuilder({ data: { id: 'photo-1' }, error: null })
    const supabase = {
      from: vi.fn((table: string) =>
        table === 'trade_board_intake_photos'
          ? photoBuilder.builder
          : sessionBuilder.builder,
      ),
    }

    await createTradeBoardIntakeSession(supabase as never, {
      repId: 'rep-1',
      conversationId: 'conv-1',
      lastUserMessageId: 'msg-1',
    })
    await updateTradeBoardIntakeSession(supabase as never, {
      sessionId: 'workflow-1',
      patch: { current_phase: 'photo_capture' },
    })
    await upsertTradeBoardIntakePhoto(supabase as never, {
      sessionId: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
      conversationMessageId: 'msg-1',
      attachmentIndex: 1,
      declaredRole: 'label_details',
      visualRole: 'label_or_packaging',
      roleConfirmed: true,
      imageUrl: 'data:image/jpeg;base64,AAA',
      quality: 'usable',
      qualityIssues: [],
      notes: [],
    })

    expect(supabase.from).toHaveBeenCalledWith('trade_board_intake_sessions')
    expect(supabase.from).toHaveBeenCalledWith('trade_board_intake_photos')
    expect(sessionBuilder.calls).toContainEqual(['select', ['*']])
    expect(sessionBuilder.calls).not.toContainEqual([
      'select',
      ['*, trade_board_intake_photos(*)'],
    ])
  })
})
