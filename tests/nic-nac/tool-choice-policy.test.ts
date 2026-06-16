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
        activeToolNames: ['add_listing', 'search_jewelry_database'],
        activeTradeBoardWorkflow: {
          status: 'active',
          phase: 'photo_capture',
          missing: ['jewelryFrontPhoto'],
          blockers: [],
        },
      }),
    ).toBe('required')
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
})
