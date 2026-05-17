import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: vi.fn(),
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

import {
  buildToolsForIntents,
  getToolIntentsForMessages,
  getToolIntentsForText,
  listToolNamesForIntents,
} from '@/lib/nic-nac/tools'

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

describe('Nic-Nac tool routing', () => {
  it('routes live-show follow-up language to the show memory tools', () => {
    const intents = getToolIntentsForText(
      'Jamie wants the blue ring after the live. Remember that for this show.',
    )

    expect(intents).toEqual(['show_memory'])
    expect(listToolNamesForIntents(intents)).toEqual([
      'get_show_session_context',
      'start_show_session',
      'record_show_session_event',
    ])
  })

  it('routes trade-board language without loading show-session tools', () => {
    const intents = getToolIntentsForText(
      "What's on my board, and can you take down the sapphire cuff?",
    )
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toEqual(['trade_board'])
    expect(toolNames).toEqual(
      expect.arrayContaining(['list_my_trade_board', 'remove_listing']),
    )
    expect(toolNames).not.toContain('get_show_session_context')
    expect(toolNames).not.toContain('record_show_session_event')
  })

  it('keeps casual chat on the lightweight memory pack', () => {
    const intents = getToolIntentsForText('hey, how are you holding up today?')

    expect(intents).toEqual(['memory'])
    expect(listToolNamesForIntents(intents)).toEqual([
      'read_recent_rep_notes',
      'write_rep_note',
    ])
  })

  it('builds only the routed tools for a live-show turn', () => {
    const tools = buildToolsForIntents(makeCtx(), ['show_memory'])

    expect(Object.keys(tools).sort()).toEqual([
      'get_show_session_context',
      'record_show_session_event',
      'start_show_session',
    ])
  })

  it('routes from the latest user message text parts', () => {
    const intents = getToolIntentsForMessages([
      {
        id: 'old',
        role: 'user',
        parts: [{ type: 'text', text: 'what is on my board?' }],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [{ type: 'text', text: 'You have two listings.' }],
      },
      {
        id: 'latest',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Actually, remember Jamie wants the blue ring after the live.',
          },
        ],
      },
    ])

    expect(intents).toEqual(['show_memory'])
  })
})
