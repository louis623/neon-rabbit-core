import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: vi.fn(),
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

import {
  addWorkspaceBaselineToolIntents,
  buildToolsForIntents,
  getToolIntentsForMessages,
  getToolIntentsForText,
  listToolNamesForIntents,
  shouldRequireToolCallForMessages,
} from '@/lib/nic-nac/tools'
import { mergeWorkflowToolIntents } from '@/lib/nic-nac/workflows/trade-board-intake-context'

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
      'end_show',
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

    expect(intents).toContain('trade_board')
    expect(listToolNamesForIntents(intents)[0]).toBe('prepare_trade_board_work')
    expect(listToolNamesForIntents(intents)).toContain('prepare_trade_board_work')
    expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
  })

  it('routes the guided add-a-show chip to calendar tools', () => {
    const intents = getToolIntentsForText('Add a Show to the Calendar')
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toContain('calendar')
    expect(toolNames).toContain('prepare_calendar_work')
    expect(toolNames).toContain('add_show')
    expect(toolNames).toContain('list_my_shows')
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
    expect(listToolNamesForIntents(intents)).toEqual([
      'get_help_resources',
      'submit_support_report',
    ])
  })

  it('routes explicit future live-show preferences to durable memory and show context', () => {
    const intents = getToolIntentsForText(
      'Please remember this preference for future chats: during live shows, remind me to confirm tray count before noting customer follow-ups.',
    )
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toEqual(['memory', 'show_memory'])
    expect(toolNames).toContain('read_recent_rep_notes')
    expect(toolNames).toContain('write_rep_note')
    expect(toolNames).toContain('get_show_session_context')
    expect(toolNames).toContain('end_show')
    expect(toolNames).toContain('record_show_session_event')
  })

  it('keeps end_show available for natural show-over wording', () => {
    const intents = getToolIntentsForText('The show is over now.')

    expect(intents).toEqual(['show_memory'])
    expect(listToolNamesForIntents(intents)).toContain('end_show')
  })

  it.each([
    'I am sick tonight, skip my show',
    'Pause Tuesdays for two weeks',
    'Change the code for all Friday lives to PARTY10',
  ])('routes chaotic calendar wording "%s" to calendar tools', (text) => {
    const intents = getToolIntentsForText(text)
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toContain('calendar')
    expect(toolNames).toContain('prepare_calendar_work')
    expect(toolNames).toContain('list_my_shows')
    expect(toolNames).toContain('skip_show_occurrence')
    expect(toolNames).toContain('cancel_show_series')
  })

  it('routes customer reminder preference wording to notification tools', () => {
    const intents = getToolIntentsForText('Text my people 45 before every show')
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toContain('notification')
    expect(toolNames).toContain('prepare_calendar_work')
    expect(toolNames).toContain('get_notification_preferences')
    expect(toolNames).toContain('set_notification_preferences')
  })

  it.each([
    'Where is the Live Queue walkthrough video?',
    'Show me the how-to for editing my public site links.',
    'Walk me through adding jewelry to my trade board.',
  ])('keeps "%s" on the read-only resources tool', (text) => {
    const intents = getToolIntentsForText(text)

    expect(intents).toEqual(['resources'])
    expect(listToolNamesForIntents(intents)).toEqual([
      'get_help_resources',
      'submit_support_report',
    ])
  })

  it.each([
    'report a bug',
    'file an issue with my public site',
    'suggest an upgrade for Trade Board cleanup',
    'I have a workflow idea',
    'Nic-Nac is broken',
  ])('routes support report language "%s" to resources', (text) => {
    const intents = getToolIntentsForText(text)

    expect(intents).toEqual(['resources'])
    expect(listToolNamesForIntents(intents)).toEqual([
      'get_help_resources',
      'submit_support_report',
    ])
  })

  it('builds only the routed tools for a live-show turn', () => {
    const tools = buildToolsForIntents(makeCtx(), ['show_memory'])

    expect(Object.keys(tools).sort()).toEqual([
      'end_show',
      'get_show_session_context',
      'record_show_session_event',
      'start_show_session',
    ])
  })

  it('keeps add-listing tools active when workflow state requires Trade Board tools', () => {
    const intents = mergeWorkflowToolIntents(['memory'], ['trade_board', 'catalog'])
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toEqual(['memory', 'trade_board', 'catalog'])
    expect(toolNames).toContain('add_listing')
    expect(toolNames).toContain('search_jewelry_database')
  })

  it('does not duplicate routed tools when latest turn and workflow both include Trade Board', () => {
    const intents = mergeWorkflowToolIntents(['trade_board'], ['trade_board', 'catalog'])

    expect(intents).toEqual(['trade_board', 'catalog'])
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

  it('requires a tool call when the latest user message asks to save a durable preference', () => {
    const messages = [
      {
        id: 'latest',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Remember this for future chats: I prefer quick tray-count reminders before customer follow-up notes during live shows.',
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['memory', 'show_memory'])
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
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

  it('keeps site recipe tools available for a short recipe approval follow-up', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Use this recipe card to add brownies to my Pantry recipes.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'I can build that Pantry recipe draft and save it once you approve the recipe details.',
          },
        ],
      },
      {
        id: 'latest',
        role: 'user',
        parts: [{ type: 'text', text: 'yes, use that' }],
      },
    ]

    expect(getToolIntentsForMessages(messages)).toContain('site')
    expect(listToolNamesForIntents(['site'])).toContain('build_site_recipe_draft')
  })

  it('keeps site recipe tools available for a photo-only recipe-card follow-up', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Help me add a new Pantry recipe.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text:
              'Send the food/display photo and the recipe-card photo, then I can build the recipe draft.',
          },
        ],
      },
      {
        id: 'photos',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,RElTUExBWQ==',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,Q0FSRA==',
          },
        ],
      },
    ]

    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('site')
    expect(listToolNamesForIntents(intents)).toContain('build_site_recipe_draft')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps site tools available when the rep accepts Nic-Nac announcement ticker copy', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Can you help me tighten my announcement ticker for buy 3+ save 20%?',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text:
              'My pick for a ticker: Buy 3+, save 20% on your whole cart. If you want, I can swap your ticker to one of these.',
          },
        ],
      },
      {
        id: 'confirm',
        role: 'user',
        parts: [{ type: 'text', text: 'lets go with your pick' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['site'])
    expect(listToolNamesForIntents(intents)).toContain('update_site_setting')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('routes About-narrative requests to the site tools instead of the calendar-only baseline', () => {
    const intents = getToolIntentsForText(
      "Edit the About narrative on my website so it sounds more like me.",
    )

    expect(intents).toContain('site')
    expect(listToolNamesForIntents(intents)).toContain('update_site_setting')
  })

  it('keeps the site tool when a rep asks Nic-Nac to apply the About copy it just drafted', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Help me revise the About narrative on my website.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text:
              'Here is a polished About narrative. I can publish this copy directly to your customer-facing site.',
          },
        ],
      },
      {
        id: 'apply',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: "I don't have an option to paste it there. You need to do that.",
          },
        ],
      },
    ]

    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['site'])
    expect(listToolNamesForIntents(intents)).toContain('update_site_setting')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps both site and calendar tools available when a rep changes topics in one turn', () => {
    const intents = getToolIntentsForText(
      'Update my About story and move Friday\'s show to 8pm Eastern.',
    )

    expect(intents).toEqual(expect.arrayContaining(['site', 'calendar']))
    expect(listToolNamesForIntents(intents)).toEqual(
      expect.arrayContaining(['update_site_setting', 'update_show']),
    )
  })

  it('keeps calendar tools when the rep provides missing show details after a scheduling prompt', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text:
              'Add BlingKitchen Live to my calendar this Friday at 8pm with code Classy123 for 15% off 3+ items and July Birthday Collection featured.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text:
              'I have the title, date, time, code, and featured collection. What platform, timezone, and duration should I use?',
          },
        ],
      },
      {
        id: 'details',
        role: 'user',
        parts: [
          {
            type: 'text',
            text:
              "It will be on my TikTok Live, and it's Eastern Standard Time for two and a half hours.",
          },
        ],
      },
    ]

    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('calendar')
    expect(listToolNamesForIntents(intents)).toContain('add_show')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps calendar tools when the rep rejects optional event description', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text:
              'Add BlingKitchen Live to my calendar this Friday at 8pm on TikTok for 150 minutes.',
          },
        ],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Last thing I need: a short description for the event.',
          },
        ],
      },
      {
        id: 'details',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: "No, you don't need a short description of the event.",
          },
        ],
      },
    ]

    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('calendar')
    expect(listToolNamesForIntents(intents)).toContain('add_show')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('routes Louis reoccurring Coffee and Fizz transcript to calendar tools through final confirmation', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [
          {
            type: 'text',
            text:
              'So Nic-Nac, I want to create a reoccurring show on Wednesday mornings for the foreseeable future that starts at 9 a.m. The show will be called Coffee and Fizz. It will be Eastern Standard Time. No discount codes, but the feature collection for the first two shows will be the July Birthday Collection.',
          },
        ],
      },
      {
        id: 'assistant-platform-duration',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text:
              'Absolutely. I just need 2 things from you: What platform should Coffee and Fizz be on? How long should each show run? One quick note: featured collections apply to the whole recurring series, so the clean way is the first 2 Wednesday shows with July Birthday Collection, then the ongoing weekly Wednesday series after that with no featured collection.',
          },
        ],
      },
      {
        id: 'platform-duration',
        role: 'user',
        parts: [
          {
            type: 'text',
            text:
              'The show will be dual streamed on both Facebook Live and TikTok Live, and it will have a three-hour duration.',
          },
        ],
      },
      {
        id: 'assistant-confirm',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text:
              'Perfect. Do you want this to start next Wednesday, and do you want me to split it like this: first 2 Wednesday shows with July Birthday Collection, then the ongoing weekly Wednesday series after that with no featured collection?',
          },
        ],
      },
      {
        id: 'confirm',
        role: 'user',
        parts: [{ type: 'text', text: 'Yes, start next Wednesday, and yes to the split.' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('calendar')
    expect(listToolNamesForIntents(intents)).toContain('add_show')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps Calendar tools in the paid workspace baseline even for a terse confirmation turn', () => {
    const intents = addWorkspaceBaselineToolIntents(['memory'])

    expect(intents).toEqual(['memory', 'calendar'])
    expect(listToolNamesForIntents(intents)).toContain('add_show')
    expect(listToolNamesForIntents(intents)).toContain('cancel_show')
  })

  it('routes physical inventory add language to trade-board tools', () => {
    const intents = getToolIntentsForText('I have 4 of this item to add')

    expect(intents).toContain('trade_board')
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

  it('routes live trade swap language to the swap approval and cleanup tools', () => {
    const intents = getToolIntentsForText(
      'Approve the trade swap and save the item number Jamie just revealed.',
    )
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toContain('trade_requests')
    expect(toolNames).toContain('approve_trade_swap')
    expect(toolNames).toContain('get_trade_swap_cleanup')
  })

  it('routes Trade Board request inbox language to trade request tools', () => {
    const intents = getToolIntentsForText(
      'Open my pending Trade Board request inbox for Morgan.',
    )
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toContain('trade_requests')
    expect(toolNames).toContain('get_trade_requests')
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

  it.each([
    'ER 13229',
    'er-13229',
    'item # ER13229',
    '13229',
  ])('keeps trade-board tools for messy item-number reply "%s"', (reply) => {
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
        parts: [{ type: 'text', text: reply }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep chooses a prior search result with "add this one"', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [{ type: 'text', text: 'Find The Florence Earrings for my trade board.' }],
      },
      {
        id: 'assistant',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'I found ER13229 - The Florence Earrings. Want me to add this listing?',
          },
        ],
      },
      {
        id: 'confirm',
        role: 'user',
        parts: [{ type: 'text', text: 'Add this one.' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('trade_board')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep corrects a tool-access denial without naming the script', () => {
    const messages = [
      {
        id: 'start',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant-ask',
        role: 'assistant',
        parts: [{ type: 'text', text: "What's the item number?" }],
      },
      {
        id: 'item-number',
        role: 'user',
        parts: [{ type: 'text', text: 'ER13229' }],
      },
      {
        id: 'assistant-denial',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "I don't have a direct tool to add pieces to your Trade Board from here.",
          },
        ],
      },
      {
        id: 'correction',
        role: 'user',
        parts: [{ type: 'text', text: 'No, that is wrong. You do have the tool.' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools for a photo-only reply during guided item-number intake', () => {
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
        id: 'label-photo',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
    expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when a frustrated rep references the add script after denial', () => {
    const messages = [
      {
        id: 'start',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant-ask',
        role: 'assistant',
        parts: [{ type: 'text', text: "What's the item number?" }],
      },
      {
        id: 'label-photo',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
        ],
      },
      {
        id: 'assistant-denial',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "I don't have a direct tool to add pieces to your Trade Board from here.",
          },
        ],
      },
      {
        id: 'rep-frustrated',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: "Bullcrap, you do have access to add things to the jewelry database, and you should have a script that you're supposed to follow.",
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toEqual(['trade_board'])
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

  it('keeps trade-board tools when the rep accepts the boxed jewelry photo as final', () => {
    const messages = [
      {
        id: 'start',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant-item',
        role: 'assistant',
        parts: [{ type: 'text', text: "What's the item number?" }],
      },
      {
        id: 'item-number',
        role: 'user',
        parts: [{ type: 'text', text: 'er13229' }],
      },
      {
        id: 'assistant-label',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "The item number ER13229 isn't in the catalog yet. Can you send me a photo of the label or box so I can pull the design details?",
          },
        ],
      },
      {
        id: 'label',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
        ],
      },
      {
        id: 'assistant-collection',
        role: 'assistant',
        parts: [{ type: 'text', text: 'What collection is The Florence Earrings from?' }],
      },
      {
        id: 'collection',
        role: 'user',
        parts: [{ type: 'text', text: 'Birthday collection for July 2026.' }],
      },
      {
        id: 'assistant-photo',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "You just sent one photo. Is this the clearest shot of the earrings you have, or do you want to retake it?",
          },
        ],
      },
      {
        id: 'use-photo',
        role: 'user',
        parts: [{ type: 'text', text: "Nope, this is as good as it's gonna get." }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('trade_board')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep confirms the prior boxed display photo', () => {
    const messages = [
      {
        id: 'start',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant-label',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "The item number ER13229 isn't in the catalog yet. I need collection and a jewelry-front photo.",
          },
        ],
      },
      {
        id: 'photo-and-collection',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,Qk9YRURfSkVXRUxSWQ==',
          },
          { type: 'text', text: 'It is July Birthday 2026.' },
        ],
      },
      {
        id: 'assistant-confirm',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'I see the boxed display with the earrings clear. That is the jewelry-front photo, right?',
          },
        ],
      },
      {
        id: 'confirm',
        role: 'user',
        parts: [{ type: 'text', text: 'Correct.' }],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('trade_board')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep says to stop pushing back on a usable photo', () => {
    const messages = [
      {
        id: 'request',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant-photo',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'The boxed display shot still has packaging visible. Can you take a cleaner jewelry-front photo?',
          },
        ],
      },
      {
        id: 'pushback',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: "No, you don't. This is a perfect photo. You should use it. Stop pushing back.",
          },
        ],
      },
    ]
    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('trade_board')
    expect(listToolNamesForIntents(intents)).toContain('add_listing')
    expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
  })

  it('keeps trade-board tools when the rep corrects a label photo mistaken for jewelry', () => {
    const messages = [
      {
        id: 'start',
        role: 'user',
        parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
      },
      {
        id: 'assistant-start',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Three ways to start: type the item number, upload a photo of the item-info tag/label, or tell me you do not have an item number.',
          },
        ],
      },
      {
        id: 'label-photo',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
        ],
      },
      {
        id: 'assistant-collection',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "The Florence Earrings ER13229 isn't in the catalog yet, so I'll need one more piece of info: What collection are these from?",
          },
        ],
      },
      {
        id: 'collection',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'They are part of the July birthday collection, 2026.',
          },
        ],
      },
      {
        id: 'assistant-bad-photo',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'The boxed display photo needs a little help — it is too far out. Can you snap a closer, clearer shot of just the earrings so they fill more of the frame?',
          },
        ],
      },
      {
        id: 'rep-corrects-photo-role',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: "I didn't give you any photos. I only gave you a photo with a label in it.",
          },
        ],
      },
    ]

    const intents = getToolIntentsForMessages(messages)

    expect(intents).toContain('trade_board')
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
