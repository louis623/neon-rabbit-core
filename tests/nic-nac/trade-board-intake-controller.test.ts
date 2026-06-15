import { describe, expect, it } from 'vitest'
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'
import {
  buildTradeBoardIntakePromptState,
  computeTradeBoardIntakeReadiness,
  createEmptyTradeBoardIntakeState,
  getTradeBoardIntakeToolsRequired,
  transitionTradeBoardIntake,
} from '@/lib/nic-nac/workflows/trade-board-intake-controller'

function baseState(
  overrides: Partial<TradeBoardIntakeSessionState> = {},
): TradeBoardIntakeSessionState {
  return {
    id: 'workflow-1',
    repId: 'rep-1',
    conversationId: 'conv-1',
    workflowType: 'trade_board_add_listing',
    status: 'active',
    phase: 'started',
    known: {},
    missing: [],
    blockers: [],
    warnings: [],
    photos: [],
    ...overrides,
  }
}

describe('Trade Board intake controller', () => {
  it('creates an empty active workflow state', () => {
    const state = createEmptyTradeBoardIntakeState({
      id: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
    })

    expect(state.status).toBe('active')
    expect(state.phase).toBe('started')
    expect(state.workflowType).toBe('trade_board_add_listing')
    expect(state.missing).toContain('itemNumber')
  })

  it('never lets label/details photos satisfy jewelry-front readiness', () => {
    const state = baseState({
      phase: 'catalog_match',
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
        collectionYear: 2026,
      },
      photos: [
        {
          attachmentIndex: 1,
          declaredRole: 'label_details',
          visualRole: 'jewelry',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: ['backs of earrings visible'],
        },
      ],
    })

    const readiness = computeTradeBoardIntakeReadiness(state)

    expect(readiness.ready).toBe(false)
    expect(readiness.missing).toContain('jewelryFrontPhoto')
    expect(readiness.blockers).not.toContain('labelPhotoUnreadable')
  })

  it('accepts boxed display jewelry-front photos when clear and usable', () => {
    const state = baseState({
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      photos: [
        {
          attachmentIndex: 1,
          declaredRole: 'label_details',
          visualRole: 'label_or_packaging',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: [],
        },
        {
          attachmentIndex: 2,
          declaredRole: 'jewelry_front',
          visualRole: 'jewelry',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: ['boxed display jewelry is centered and clear'],
        },
      ],
    })

    const readiness = computeTradeBoardIntakeReadiness(state)

    expect(readiness.ready).toBe(true)
    expect(readiness.missing).toEqual([])
    expect(readiness.blockers).toEqual([])
  })

  it('keeps Trade Board tools required while active', () => {
    expect(getTradeBoardIntakeToolsRequired(baseState())).toEqual([
      'trade_board',
      'catalog',
    ])
  })

  it('builds model prompt state with the correct next action', () => {
    const promptState = buildTradeBoardIntakePromptState(
      baseState({
        known: {
          itemNumber: 'ER13229',
          designName: 'The Florence Earrings',
          collectionName: 'July Birthday',
        },
        photos: [
          {
            attachmentIndex: 1,
            declaredRole: 'label_details',
            visualRole: 'label_or_packaging',
            roleConfirmed: true,
            quality: 'usable',
            qualityIssues: [],
            notes: [],
          },
        ],
      }),
    )

    expect(promptState.nextAction).toBe('ask_for_jewelry_front_photo')
    expect(promptState.hardRules).toContain(
      'label_details photos cannot satisfy jewelry_front',
    )
    expect(promptState.photos[0]).toMatchObject({
      declaredRole: 'label_details',
      visualRole: 'label_or_packaging',
    })
  })

  it('moves ready state to adding only through controller transition', () => {
    const state = baseState({
      phase: 'ready_to_add',
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      photos: [
        {
          attachmentIndex: 1,
          declaredRole: 'jewelry_front',
          visualRole: 'jewelry',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: [],
        },
      ],
    })

    const next = transitionTradeBoardIntake(state, {
      type: 'authorize_add_listing',
    })

    expect(next.phase).toBe('adding')
    expect(next.status).toBe('active')
  })
})
