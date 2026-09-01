import { describe, expect, it } from 'vitest'
import { chooseNicNacToolChoiceForStep } from '@/lib/nic-nac/tool-choice-policy'

describe('Nic-Nac tool choice policy', () => {
  it('forces add_listing when the active Dance Floor intake workflow is ready to add', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['add_listing', 'search_jewelry_database'],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'ready_to_add',
          missing: [],
          blockers: [],
        },
      }),
    ).toEqual({ type: 'tool', toolName: 'add_listing' })
  })

  it('pins a pasted About narrative to update_site_setting after Nic-Nac requests the copy', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['update_site_setting', 'add_show'],
        previousAssistantText:
          'Send me the new About text you want on the site, and I will update it.',
        latestUserText:
          'Meet Heather\n\nHeather is a Registered Nurse with a love for family, food, and live jewelry reveals. She built a welcoming community by sharing that passion live and brings the same warmth to every show.',
      }),
    ).toEqual({ type: 'tool', toolName: 'update_site_setting' })
  })

  it('pins an incomplete About-section correction to update_site_setting', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['update_site_setting'],
        previousAssistantText: "Done — Heather's About section has been updated.",
        latestUserText: 'No, you just added part of it. Add the whole thing.',
      }),
    ).toEqual({ type: 'tool', toolName: 'update_site_setting' })
  })

  it('keeps required tool choice for contextual Dance Floor turns that are not ready yet', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: [
          'prepare_trade_board_work',
          'add_listing',
          'search_jewelry_database',
        ],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'photo_capture',
          missing: ['jewelryFrontPhoto'],
          blockers: [],
        },
      }),
    ).toEqual({ type: 'tool', toolName: 'prepare_trade_board_work' })
  })

  it('forces add_listing after the rep confirms a second physical piece', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: [
          'prepare_trade_board_work',
          'add_listing',
          'search_jewelry_database',
        ],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'photo_capture',
          missing: ['jewelryFrontPhoto'],
          blockers: [],
          known: {
            itemNumber: 'ER13229',
            designName: 'The Florence Earrings',
            collectionName: 'July Birthday 2026',
          },
        },
        latestUserText: 'Yes',
        previousAssistantText:
          'That item number is already on your Dance Floor. Are we adding a second physical piece of that same design?',
      }),
    ).toEqual({ type: 'tool', toolName: 'add_listing' })
  })

  it('forces add_show when the active Calendar workflow is ready to add', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['prepare_calendar_work', 'add_show', 'list_my_shows'],
        activeCalendarWorkflow: {
          status: 'active',
          phase: 'ready_to_add',
          missing: [],
        },
      }),
    ).toEqual({ type: 'tool', toolName: 'add_show' })
  })

  it.each([
    'Hey Nic-Nac, do I have anything on my calendar right now?',
    "What's on my schedule this week?",
    'When is my next live?',
    'Do I have a show tonight?',
  ])('pins natural Calendar reads directly to list_my_shows: %s', (latestUserText) => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: false,
        stepsLength: 0,
        activeToolNames: [
          'prepare_trade_board_work',
          'prepare_calendar_work',
          'list_my_shows',
        ],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'photo_capture',
          missing: ['jewelryFrontPhoto'],
          blockers: [],
        },
        latestUserText,
      }),
    ).toEqual({ type: 'tool', toolName: 'list_my_shows' })
  })

  it('retains Calendar reads for a natural follow-up through workflow intent', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['prepare_calendar_work', 'list_my_shows'],
        activeCalendarWorkflow: {
          status: 'active',
          phase: 'details_capture',
          intent: 'list_shows',
          missing: [],
        },
        latestUserText: 'What about the earlier ones?',
      }),
    ).toEqual({ type: 'tool', toolName: 'list_my_shows' })
  })

  it('pins an explicit Calendar request ahead of stale Dance Floor workflow context', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['prepare_trade_board_work', 'prepare_calendar_work'],
        latestToolIntents: ['show_memory', 'calendar'],
        routedToolIntents: ['show_memory', 'calendar', 'trade_board'],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'photo_capture',
          missing: ['jewelryFrontPhoto'],
          blockers: [],
        },
      }),
    ).toEqual({ type: 'tool', toolName: 'prepare_calendar_work' })
  })

  it('forces get_trade_requests for request inbox reads instead of generic board prep', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: [
          'prepare_trade_board_work',
          'list_my_trade_board',
          'get_trade_requests',
        ],
        latestUserText:
          'Open my pending Dance Floor request inbox for this customer.',
      }),
    ).toEqual({ type: 'tool', toolName: 'get_trade_requests' })
  })

  it.each([
    {
      toolName: 'get_trade_requests',
      text: 'Open my Dance Floor request inbox and list the pending incoming trade requests.',
    },
    {
      toolName: 'get_fulfillment_queue',
      text: 'Show my active trade fulfillment queue.',
    },
    {
      toolName: 'get_trade_swap_cleanup',
      text: 'Show my post-show swap cleanup queue.',
    },
    {
      toolName: 'search_jewelry_database',
      text: 'Open the jewelry database record for item ER12345.',
    },
    {
      toolName: 'list_my_trade_board',
      text: 'List everything currently on my Dance Floor.',
    },
  ])('pins explicit $toolName reads even when the turn was not marked required', ({ toolName, text }) => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: false,
        stepsLength: 0,
        activeToolNames: [
          'prepare_trade_board_work',
          'get_trade_requests',
          'get_fulfillment_queue',
          'get_trade_swap_cleanup',
          'search_jewelry_database',
          'list_my_trade_board',
        ],
        latestUserText: text,
      }),
    ).toEqual({ type: 'tool', toolName })
  })

  it('does not force a tool after the first model step', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 1,
        activeToolNames: ['add_listing'],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'ready_to_add',
          missing: [],
          blockers: [],
        },
      }),
    ).toBe('auto')
  })

  it('disables tools for a purely conversational first turn', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: false,
        stepsLength: 0,
        activeToolNames: ['add_listing'],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'ready_to_add',
          missing: [],
          blockers: [],
        },
      }),
    ).toBe('none')
  })

  it('keeps optional tool selection for a routed but non-required turn', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: false,
        stepsLength: 0,
        activeToolNames: ['get_help_resources'],
        routedToolIntents: ['resources'],
      }),
    ).toBe('auto')
  })

  it('keeps optional memory lookup for real follow-up language', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: false,
        stepsLength: 0,
        activeToolNames: ['read_recent_rep_notes'],
        routedToolIntents: ['memory'],
        latestUserText: 'What follow-up did I promise that customer?',
      }),
    ).toBe('auto')
  })

  it.each([
    ['trade_board_remove_listing', 'ready_to_remove', 'remove_listing'],
    ['trade_request_decision', 'ready_to_approve', 'approve_trade'],
    ['trade_request_decision', 'ready_to_reject', 'reject_trade'],
    ['trade_swap_capture', 'ready_to_approve', 'approve_trade_swap'],
    ['trade_fulfillment_update', 'ready_to_update', 'update_fulfillment_status'],
    ['trade_swap_cleanup', 'ready_to_update', 'add_listing'],
    ['trade_catalog_correction', 'ready_to_report', 'report_jewelry_catalog_issue'],
  ])(
    'forces %s workflow in %s to %s',
    (workflowType, phase, toolName) => {
      expect(
        chooseNicNacToolChoiceForStep({
          requireToolCall: true,
          stepsLength: 0,
          activeToolNames: [
            'remove_listing',
            'approve_trade',
            'reject_trade',
            'approve_trade_swap',
            'update_fulfillment_status',
            'add_listing',
            'report_jewelry_catalog_issue',
          ],
          activeTradeWorkflow: {
            status: 'active',
            workflowType,
            phase,
            missingFields: [],
            blockers: [],
          },
        }),
      ).toEqual({ type: 'tool', toolName })
    },
  )

  it.each([
    ['trade_board_remove_listing', 'identify_target', 'list_my_trade_board'],
    ['trade_request_decision', 'identify_target', 'get_trade_requests'],
    ['trade_swap_capture', 'details_capture', 'get_trade_requests'],
    ['trade_fulfillment_update', 'identify_target', 'get_fulfillment_queue'],
    ['trade_swap_cleanup', 'details_capture', 'get_trade_swap_cleanup'],
    ['trade_catalog_correction', 'details_capture', 'search_jewelry_database'],
  ])(
    'forces %s workflow in %s to read candidates with %s',
    (workflowType, phase, toolName) => {
      expect(
        chooseNicNacToolChoiceForStep({
          requireToolCall: true,
          stepsLength: 0,
          activeToolNames: [
            'list_my_trade_board',
            'get_trade_requests',
            'get_fulfillment_queue',
            'get_trade_swap_cleanup',
            'search_jewelry_database',
          ],
          activeTradeWorkflow: {
            status: 'active',
            workflowType,
            phase,
            missingFields: ['target'],
            blockers: [],
          },
        }),
      ).toEqual({ type: 'tool', toolName })
    },
  )

  it('prioritizes a mutation-ready correction over broad catalog read wording', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: [
          'search_jewelry_database',
          'report_jewelry_catalog_issue',
        ],
        latestUserText:
          'The shared jewelry catalog MSRP is wrong. Fix the catalog record now.',
        activeTradeWorkflow: {
          status: 'active',
          workflowType: 'trade_catalog_correction',
          phase: 'ready_to_report',
          missingFields: [],
          blockers: [],
        },
      }),
    ).toEqual({ type: 'tool', toolName: 'report_jewelry_catalog_issue' })
  })

  it('does not force a generic Trade write tool when candidate blockers remain', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['remove_listing'],
        activeTradeWorkflow: {
          status: 'active',
          workflowType: 'trade_board_remove_listing',
          phase: 'ready_to_remove',
          missingFields: [],
          blockers: ['ambiguousListingCandidate'],
        },
      }),
    ).toBe('required')
  })

  it('does not let always-available Dance Floor tools hijack another routed workflow', () => {
    expect(
      chooseNicNacToolChoiceForStep({
        requireToolCall: true,
        stepsLength: 0,
        activeToolNames: ['prepare_trade_board_work', 'prepare_calendar_work'],
        routedToolIntents: ['calendar'],
      }),
    ).toBe('required')
  })
})
