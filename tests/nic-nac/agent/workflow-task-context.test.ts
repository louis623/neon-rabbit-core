import { describe, expect, it } from 'vitest'
import {
  buildNicNacWorkflowTaskContext,
  loadNicNacWorkflowTaskContinuity,
  renderNicNacWorkflowTaskContext,
} from '@/lib/nic-nac/agent/workflow-task-context'
import type { CalendarWorkflowSessionState } from '@/lib/nic-nac/workflows/calendar-workflow-types'
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'
import type { TradeWorkflowSessionState } from '@/lib/nic-nac/workflows/trade-workflow-types'

const calendarSession: CalendarWorkflowSessionState = {
  id: 'calendar-1',
  repId: 'rep-1',
  conversationId: 'conversation-1',
  workflowType: 'calendar_event_work',
  status: 'active',
  phase: 'details_capture',
  intent: 'add_show',
  knownFields: {
    title: 'Tonight Live',
    eventTime: '2026-09-01T23:00:00.000Z',
    timeZone: 'America/New_York',
    discountCodes: [{ code: 'AWESOME', description: '10% off' }],
    featuredCollections: ['Bunny Ears'],
  },
  missingFields: ['platform'],
  candidateEventIds: [],
  createdAt: '2026-09-01T20:00:00.000Z',
  updatedAt: '2026-09-01T20:05:00.000Z',
  expiresAt: '2026-09-01T22:05:00.000Z',
}

const danceFloorSession: TradeBoardIntakeSessionState = {
  id: 'dance-floor-1',
  repId: 'rep-1',
  conversationId: 'conversation-1',
  workflowType: 'trade_board_add_listing',
  catalogMode: 'item_number',
  status: 'active',
  phase: 'photo_capture',
  known: { itemNumber: 'ER13229', quantity: 1 },
  missing: ['jewelry_front_photo'],
  blockers: [],
  warnings: [],
  metadata: { untrustedOversizedValue: 'x'.repeat(20_000) },
  photos: [
    {
      attachmentIndex: 0,
      declaredRole: 'label_details',
      visualRole: 'label_or_packaging',
      roleConfirmed: true,
      quality: 'usable',
      qualityIssues: [],
      notes: [],
    },
  ],
  createdAt: '2026-09-01T20:00:00.000Z',
  updatedAt: '2026-09-01T20:06:00.000Z',
  expiresAt: '2026-09-01T22:06:00.000Z',
}

const tradeSession: TradeWorkflowSessionState = {
  id: 'trade-1',
  repId: 'rep-1',
  conversationId: 'conversation-1',
  workflowType: 'trade_request_decision',
  status: 'active',
  phase: 'approval_required',
  intent: 'approve_trade',
  knownFields: { requestId: 'request-1' },
  missingFields: [],
  blockers: [],
  candidates: [
    {
      id: 'request-1',
      kind: 'trade_request',
      summary: 'Jamie requested ER13229.',
    },
  ],
  approvalState: 'required',
  updatedAt: '2026-09-01T20:07:00.000Z',
}

describe('Nic-Nac workflow task continuity', () => {
  it('maps durable transaction facts into recoverable goals without declaring the current goal', () => {
    const context = buildNicNacWorkflowTaskContext({
      calendarSession,
      tradeBoardSession: danceFloorSession,
      tradeSession,
    })

    expect(context.currentGoal).toBeNull()
    expect(context.pausedGoals.map((goal) => goal.id)).toEqual([
      'trade:trade-1',
      'dance-floor:dance-floor-1',
      'calendar:calendar-1',
    ])
    expect(context.pausedGoals[1]).toMatchObject({
      relevantFacts: {
        domain: 'dance_floor',
        knownFields: { itemNumber: 'ER13229', quantity: 1 },
        photos: [
          expect.objectContaining({
            declaredRole: 'label_details',
            visualRole: 'label_or_packaging',
          }),
        ],
      },
      missingFacts: ['jewelry_front_photo'],
      status: 'waiting_for_user',
    })
    expect(context.pausedGoals[2]).toMatchObject({
      relevantFacts: {
        domain: 'calendar',
        knownFields: expect.objectContaining({
          title: 'Tonight Live',
          featuredCollections: ['Bunny Ears'],
        }),
      },
      missingFacts: ['platform'],
    })
  })

  it('labels continuity as context rather than a tool-selection command', () => {
    const prompt = renderNicNacWorkflowTaskContext(
      buildNicNacWorkflowTaskContext({
        calendarSession,
        tradeBoardSession: danceFloorSession,
        tradeSession: null,
      }),
    )

    expect(prompt).toContain('latest explicit request still wins')
    expect(prompt).toContain('none of these records selects or forces a tool')
    expect(prompt).toContain('ER13229')
    expect(prompt).toContain('Tonight Live')
    expect(prompt).not.toContain('untrustedOversizedValue')
    expect(prompt.length).toBeLessThanOrEqual(8_500)
  })

  it('returns no continuity prompt when there is no unfinished transaction', () => {
    const context = buildNicNacWorkflowTaskContext({
      calendarSession: null,
      tradeBoardSession: null,
      tradeSession: null,
    })

    expect(context.pausedGoals).toEqual([])
    expect(renderNicNacWorkflowTaskContext(context)).toBe('')
  })

  it('keeps required setup isolated without reading normal Workspace workflows', async () => {
    const throwingSupabase = new Proxy(
      {},
      {
        get() {
          throw new Error('normal Workspace workflow storage must not be read')
        },
      },
    )
    const result = await loadNicNacWorkflowTaskContinuity({
      mode: 'required_setup',
      supabase: throwingSupabase as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      nowIso: '2026-09-01T20:00:00.000Z',
    })

    expect(result.promptText).toBe('')
    expect(result.context.pausedGoals).toEqual([])
  })

  it('does not query workflow storage for capability-excluded continuity domains', async () => {
    const throwingSupabase = new Proxy(
      {},
      {
        get() {
          throw new Error('capability-excluded workflow storage must not be read')
        },
      },
    )
    const result = await loadNicNacWorkflowTaskContinuity({
      mode: 'workspace',
      supabase: throwingSupabase as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      nowIso: '2026-09-01T20:00:00.000Z',
      access: { calendar: false, tradeBoard: false, trade: false },
    })

    expect(result.promptText).toBe('')
    expect(result.context.pausedGoals).toEqual([])
  })
})
