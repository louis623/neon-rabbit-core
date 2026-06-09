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
  shouldRequireToolCallForMessages,
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

  it('routes the guided add-a-piece chip to trade-board tools', () => {
    const intents = getToolIntentsForText('Add a piece to Trade Board')

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
  })

  it('keeps casual chat on the lightweight memory pack', () => {
    const intents = getToolIntentsForText('hey, how are you holding up today?')

    expect(intents).toEqual(['memory'])
    expect(listToolNamesForIntents(intents)).toEqual([
      'read_recent_rep_notes',
      'write_rep_note',
    ])
  })

  it('routes help, how-to, and setup questions to the read-only resources tool', () => {
    const intents = getToolIntentsForText(
      'Where is the how-to video for the calculator and Chrome extension setup?',
    )

    expect(intents).toEqual(['resources'])
    expect(listToolNamesForIntents(intents)).toEqual(['get_help_resources'])
  })

  it.each([
    'Where is the Live Queue walkthrough video?',
    'Show me the how-to for editing my public site links.',
    'Walk me through adding jewelry to my trade board.',
  ])('keeps "%s" on the read-only resources tool', (text) => {
    const intents = getToolIntentsForText(text)

    expect(intents).toEqual(['resources'])
    expect(listToolNamesForIntents(intents)).toEqual(['get_help_resources'])
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

  it('keeps trade-board tools available for a short missing-field follow-up', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Please add this necklace to my trade board.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "I can see the item number and details, but I need the collection. What collection is it from?",
          },
        ],
      },
      {
        id: 'collection',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'It is from the April 2026 birthday collection.',
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools available for a yes/no confirmation follow-up', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Please add this necklace to my trade board.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'I can try adding it without a custom photo and use the canonical design image instead.',
          },
        ],
      },
      {
        id: 'confirm',
        role: 'user',
        parts: [{ type: 'text', text: 'Yes, do that.' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('routes physical inventory add language to trade-board tools', () => {
    const intents = getToolIntentsForText('I have 4 of this item to add')

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
  })

  it('routes catalog correction language to the catalog tool pack', () => {
    expect(getToolIntentsForText('RG100 has the wrong collection')).toContain(
      'catalog',
    )
    expect(getToolIntentsForText('This item has a bad blurry photo')).toContain(
      'catalog',
    )
    expect(
      getToolIntentsForText('The MSRP is incorrect in the database'),
    ).toContain('catalog')

    expect(listToolNamesForIntents(['catalog'])).toContain(
      'report_jewelry_catalog_issue',
    )
  })

  it('keeps trade-board tools for terse collection-name replies', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [{ type: 'text', text: 'trade board listing' }],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "NK18149 isn't in the database yet. What's the collection name for The Harper Necklace?",
          },
        ],
      },
      {
        id: 'collection',
        role: 'user',
        parts: [{ type: 'text', text: 'April Birthday' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep asks to add the missing design to the database', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [{ type: 'text', text: 'trade board listing' }],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "NK18149 isn't in the database yet. I need the design name, photo, and collection name.",
          },
        ],
      },
      {
        id: 'create',
        role: 'user',
        parts: [{ type: 'text', text: 'Add it to the data base' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools for photo-only follow-ups during add-listing recovery', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Please add NK18149, The Harper Necklace, to my trade board. I have 4 of this item.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "NK18149 isn't in the database yet. I still need a photo to complete the database entry.",
          },
        ],
      },
      {
        id: 'photo',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,AAAA',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,BBBB',
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools for an item-number reply during guided intake', () => {
    const messages = [
      {
        id: 'start',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [{ type: 'text', text: "What's the item number?" }],
      },
      {
        id: 'item-number',
        role: 'user',
        parts: [{ type: 'text', text: 'ER13743' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools available when the rep retries after a tool failure', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'I want this item added to the jewelry database as well as my trade board.',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,SkVXRUw=',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "I hit a wall here - the add-listing tool isn't available on this turn.",
          },
        ],
      },
      {
        id: 'retry',
        role: 'user',
        parts: [{ type: 'text', text: 'Try again.' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep points back to already attached photos', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Please add this piece to my jewelry database and trade board.',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,SkVXRUw=',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'What is the design name for ER13743? I can read the label photo, but I need the missing detail before I add it.',
          },
        ],
      },
      {
        id: 'photos-have-info',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'All the information you need is contained within those photos.',
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('routes required setup mode to setup tools only', () => {
    const names = listToolNamesForIntents(['required_setup'])

    expect(names).toEqual([
      'get_required_setup_state',
      'ensure_live_queue_sync_code',
      'save_required_setup_answer',
      'request_required_setup_support',
      'unlock_required_setup',
    ])
  })

  it('requires a setup-state tool call during required setup mode', () => {
    const messages = [
      {
        id: 'latest',
        role: 'user',
        parts: [{ type: 'text', text: 'What is my Live Queue sync code?' }],
      },
    ]

    expect(shouldRequireToolCallForMessages(messages, ['required_setup'])).toBe(true)
  })
})
