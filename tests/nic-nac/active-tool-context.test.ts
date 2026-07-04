import { describe, expect, it } from 'vitest'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import {
  activeWorkflowRequiresToolCall,
  mergeActiveWorkflowToolIntents,
  renderActiveWorkflowPromptStates,
  type ActiveNicNacWorkflowContext,
} from '@/lib/nic-nac/workflows/active-tool-context'

function context(
  workflowType: ActiveNicNacWorkflowContext['workflowType'],
  workflowIntents: NicNacToolIntent[],
  status: ActiveNicNacWorkflowContext['status'] = 'active',
): ActiveNicNacWorkflowContext {
  return {
    workflowId: `${workflowType}-1`,
    workflowType,
    status,
    phase: 'details_capture',
    workflowIntents,
    toolPolicySource: 'active_workflow',
    promptState: `Active workflow: ${workflowType}`,
  }
}

describe('active Nic-Nac workflow tool context', () => {
  it('keeps active workflow tools when the latest turn routes to memory', () => {
    const merged = mergeActiveWorkflowToolIntents(
      ['memory'],
      [context('calendar_event_work', ['calendar'])],
    )

    expect(merged).toEqual(['memory', 'calendar'])
  })

  it('deduplicates latest-turn and workflow tool intents', () => {
    const merged = mergeActiveWorkflowToolIntents(
      ['calendar', 'memory'],
      [context('calendar_event_work', ['calendar'])],
    )

    expect(merged).toEqual(['calendar', 'memory'])
  })

  it('supports multiple active workflow contexts without losing order', () => {
    const merged = mergeActiveWorkflowToolIntents(
      ['memory'],
      [
        context('trade_board_add_listing', ['trade_board', 'catalog']),
        context('calendar_event_work', ['calendar']),
      ],
    )

    expect(merged).toEqual(['memory', 'trade_board', 'catalog', 'calendar'])
  })

  it('supports durable trade workflow contexts beyond add-listing', () => {
    const merged = mergeActiveWorkflowToolIntents(
      ['memory'],
      [
        context('trade_swap_capture', ['trade_requests', 'trade_board', 'catalog']),
        context('trade_fulfillment_update', ['fulfillment', 'trade_board']),
      ],
    )

    expect(merged).toEqual([
      'memory',
      'trade_requests',
      'trade_board',
      'catalog',
      'fulfillment',
    ])
  })

  it('does not retain tools from terminal workflows', () => {
    const merged = mergeActiveWorkflowToolIntents(
      ['memory'],
      [context('calendar_event_work', ['calendar'], 'completed')],
    )

    expect(merged).toEqual(['memory'])
  })

  it('renders prompt state only for active workflows', () => {
    const prompt = renderActiveWorkflowPromptStates([
      context('calendar_event_work', ['calendar']),
      context('trade_board_add_listing', ['trade_board'], 'completed'),
    ])

    expect(prompt).toContain('Active workflow: calendar_event_work')
    expect(prompt).not.toContain('Active workflow: trade_board_add_listing')
  })

  it('requires tool calls for active trade request and fulfillment workflows', () => {
    expect(
      activeWorkflowRequiresToolCall([
        context('trade_request_decision', ['trade_requests']),
      ]),
    ).toBe(true)
    expect(
      activeWorkflowRequiresToolCall([
        context('trade_fulfillment_update', ['fulfillment']),
      ]),
    ).toBe(true)
  })
})
