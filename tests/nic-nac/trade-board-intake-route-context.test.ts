import { describe, expect, it, vi } from 'vitest'
import type { UIMessage } from 'ai'
import {
  getOrCreateTradeBoardIntakeContext,
  inferDeclaredPhotoRoleFromConversation,
  mergeWorkflowToolIntents,
} from '@/lib/nic-nac/workflows/trade-board-intake-context'
import { renderTradeBoardIntakePromptState } from '@/lib/nic-nac/workflows/trade-board-intake-prompt'
import type { TradeBoardIntakePromptState } from '@/lib/nic-nac/workflows/trade-board-intake-types'

describe('Trade Board intake route context', () => {
  it('inherits label_details role after Nic-Nac asks for a label/details photo', () => {
    const messages: UIMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Upload a clear item-info tag or label photo.' },
        ],
      } as UIMessage,
      {
        id: 'user-1',
        role: 'user',
        parts: [
          { type: 'file', mediaType: 'image/jpeg', url: 'data:image/jpeg;base64,AAA' },
        ],
      } as UIMessage,
    ]

    expect(inferDeclaredPhotoRoleFromConversation(messages, 0)).toBe(
      'label_details',
    )
  })

  it('inherits jewelry_front role after Nic-Nac asks for customer-facing jewelry photo', () => {
    const messages: UIMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'I still need the customer-facing jewelry photo.' },
        ],
      } as UIMessage,
      {
        id: 'user-1',
        role: 'user',
        parts: [
          { type: 'file', mediaType: 'image/jpeg', url: 'data:image/jpeg;base64,BBB' },
        ],
      } as UIMessage,
    ]

    expect(inferDeclaredPhotoRoleFromConversation(messages, 0)).toBe(
      'jewelry_front',
    )
  })

  it('keeps trade board intents when workflow intents are active', () => {
    expect(mergeWorkflowToolIntents(['memory'], ['trade_board', 'catalog'])).toEqual([
      'memory',
      'trade_board',
      'catalog',
    ])
  })

  it('renders compact prompt state with hard rules', () => {
    const state: TradeBoardIntakePromptState = {
      workflow: {
        id: 'workflow-1',
        type: 'trade_board_add_listing',
        status: 'active',
        phase: 'photo_capture',
      },
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      photos: [
        {
          index: 1,
          declaredRole: 'label_details',
          visualRole: 'label_or_packaging',
          roleConfirmed: true,
          quality: 'usable',
          notes: [],
        },
      ],
      missing: ['jewelryFrontPhoto'],
      blockers: [],
      nextAction: 'ask_for_jewelry_front_photo',
      hardRules: ['label_details photos cannot satisfy jewelry_front'],
    }

    const rendered = renderTradeBoardIntakePromptState(state)

    expect(rendered).toContain('Active workflow: trade_board_add_listing')
    expect(rendered).toContain('itemNumber: ER13229')
    expect(rendered).toContain('declaredRole=label_details')
    expect(rendered).toContain('Missing: jewelryFrontPhoto')
    expect(rendered).toContain('Next action: ask_for_jewelry_front_photo')
  })

  it('falls back cleanly when workflow tables are not deployed yet', async () => {
    const supabase = {
      from: vi.fn(() => {
        throw {
          code: '42P01',
          message: 'relation "trade_board_intake_sessions" does not exist',
        }
      }),
    }

    await expect(
      getOrCreateTradeBoardIntakeContext({
        supabase: supabase as never,
        repId: 'rep-1',
        conversationId: 'conv-1',
        messages: [
          {
            id: 'user-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Add ER13229 to my Trade Board' }],
          } as UIMessage,
        ],
        latestUserMessageId: 'user-1',
        mode: 'workspace',
        nowIso: '2026-06-15T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      sessionAfter: null,
      workflowIntents: [],
      toolPolicySource: 'latest_turn_intent',
      workflowPromptState: '',
    })
  })
})
