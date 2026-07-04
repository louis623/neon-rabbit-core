import { describe, expect, it } from 'vitest'
import { chooseNicNacToolChoiceForStep } from '@/lib/nic-nac/tool-choice-policy'

describe('Nic-Nac tool choice policy', () => {
  it('forces add_listing when the active Trade Board intake workflow is ready to add', () => {
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

  it('keeps required tool choice for contextual Trade Board turns that are not ready yet', () => {
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
          'That item number is already on your Trade Board. Are we adding a second physical piece of that same design?',
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

  it('does not force a tool for non-required turns', () => {
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
})
