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
