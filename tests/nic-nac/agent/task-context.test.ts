import { describe, expect, it } from 'vitest'

import {
  applyNicNacTaskContextEvent,
  createEmptyNicNacTaskContext,
  type NicNacTaskContext,
  type NicNacTaskGoalDraft,
} from '@/lib/nic-nac/agent/task-context'

function request(
  context: NicNacTaskContext,
  goal: NicNacTaskGoalDraft,
): NicNacTaskContext {
  return applyNicNacTaskContextEvent(context, {
    type: 'explicit_request',
    goal,
  }).context
}

const addShowGoal: NicNacTaskGoalDraft = {
  id: 'goal-add-show',
  kind: 'mutation',
  summary: 'Add tonight\'s live show',
  relevantFacts: {
    localTime: '19:00',
    timeZone: 'America/New_York',
    discountCode: 'AWESOME',
    featuredCollection: 'Bunny Ears',
  },
  missingFacts: ['platform'],
  resumeHint: 'Ask which platform to use, then prepare the show for approval.',
}

describe('Nic-Nac task context', () => {
  it('starts with a compact, serializable empty shape', () => {
    const context = createEmptyNicNacTaskContext()

    expect(context).toEqual({
      schemaVersion: 1,
      currentGoal: null,
      pausedGoals: [],
      immediateContinuation: null,
    })
    expect(JSON.parse(JSON.stringify(context))).toEqual(context)
  })

  it('lets the latest explicit request supersede unfinished work without losing its facts', () => {
    const withAddShow = request(createEmptyNicNacTaskContext(), addShowGoal)
    const switched = applyNicNacTaskContextEvent(withAddShow, {
      type: 'explicit_request',
      goal: {
        id: 'goal-calendar-read',
        kind: 'read',
        summary: 'Check the next scheduled show',
        resumeHint: 'Explain the next scheduled show.',
      },
    })

    expect(switched.effect).toBe('switched')
    expect(switched.context.currentGoal).toMatchObject({
      id: 'goal-calendar-read',
      kind: 'read',
    })
    expect(switched.context.pausedGoals).toEqual([
      expect.objectContaining({
        id: 'goal-add-show',
        relevantFacts: addShowGoal.relevantFacts,
        missingFacts: ['platform'],
        resumeHint: addShowGoal.resumeHint,
      }),
    ])
  })

  it('continues a short answer only for the immediately preceding clarification', () => {
    const started = request(createEmptyNicNacTaskContext(), addShowGoal)
    const waiting = applyNicNacTaskContextEvent(started, {
      type: 'clarification_requested',
      goalId: 'goal-add-show',
      clarificationId: 'clarification-platform',
      missingFacts: ['platform'],
    }).context

    const answered = applyNicNacTaskContextEvent(waiting, {
      type: 'clarification_answered',
      clarificationId: 'clarification-platform',
      facts: { platform: 'TikTok' },
    })

    expect(answered.effect).toBe('clarification_answered')
    expect(answered.context.currentGoal).toMatchObject({
      id: 'goal-add-show',
      status: 'active',
      relevantFacts: expect.objectContaining({ platform: 'TikTok' }),
      missingFacts: [],
    })
    expect(answered.context.immediateContinuation).toBeNull()
  })

  it('does not feed a short answer into an old clarification after an unrelated request', () => {
    const started = request(createEmptyNicNacTaskContext(), addShowGoal)
    const waiting = applyNicNacTaskContextEvent(started, {
      type: 'clarification_requested',
      goalId: 'goal-add-show',
      clarificationId: 'clarification-platform',
      missingFacts: ['platform'],
    }).context
    const interrupted = request(waiting, {
      id: 'goal-help-question',
      kind: 'guidance',
      summary: 'Explain how featured collections work',
      resumeHint: 'Answer the Sparkle Suite question.',
    })

    const staleAnswer = applyNicNacTaskContextEvent(interrupted, {
      type: 'clarification_answered',
      clarificationId: 'clarification-platform',
      facts: { platform: 'TikTok' },
    })

    expect(staleAnswer.effect).toBe('ignored')
    expect(staleAnswer.context).toEqual(interrupted)
    expect(staleAnswer.context.pausedGoals[0]).toMatchObject({
      id: 'goal-add-show',
      status: 'waiting_for_user',
      relevantFacts: addShowGoal.relevantFacts,
    })
  })

  it('completes a read result without leaving a workflow lock or auto-resuming old work', () => {
    const addStarted = request(createEmptyNicNacTaskContext(), addShowGoal)
    const readStarted = request(addStarted, {
      id: 'goal-calendar-read',
      kind: 'read',
      summary: 'Check tonight\'s shows',
      resumeHint: 'Explain the current Calendar result.',
    })

    const completed = applyNicNacTaskContextEvent(readStarted, {
      type: 'tool_result',
      goalId: 'goal-calendar-read',
      result: {
        toolName: 'calendar_lookup',
        success: true,
        summary: 'No matching shows.',
      },
    })

    expect(completed.effect).toBe('read_completed')
    expect(completed.context.currentGoal).toBeNull()
    expect(completed.context.pausedGoals).toEqual([
      expect.objectContaining({ id: 'goal-add-show' }),
    ])
  })

  it('closes a delayed paused read without stealing the newer current task', () => {
    const readStarted = request(createEmptyNicNacTaskContext(), {
      id: 'goal-calendar-read',
      kind: 'read',
      summary: 'Check this week\'s shows',
      resumeHint: 'Explain the current Calendar result.',
    })
    const newer = request(readStarted, addShowGoal)

    const completed = applyNicNacTaskContextEvent(newer, {
      type: 'tool_result',
      goalId: 'goal-calendar-read',
      result: { toolName: 'calendar_lookup', success: true },
    })

    expect(completed.effect).toBe('read_completed')
    expect(completed.context.currentGoal?.id).toBe('goal-add-show')
    expect(completed.context.pausedGoals).toEqual([])
  })

  it('keeps approval-waiting work resumable without letting it force unrelated turns', () => {
    const started = request(createEmptyNicNacTaskContext(), addShowGoal)
    const approvalWaiting = applyNicNacTaskContextEvent(started, {
      type: 'approval_requested',
      goalId: 'goal-add-show',
      approvalId: 'approval-add-show',
      toolName: 'calendar_create',
      resumeHint: 'Resume the approved Calendar creation.',
    }).context
    const unrelated = request(approvalWaiting, {
      id: 'goal-dance-floor-read',
      kind: 'read',
      summary: 'Check the Dance Floor',
      resumeHint: 'Explain the current Dance Floor.',
    })

    expect(unrelated.currentGoal?.id).toBe('goal-dance-floor-read')
    expect(unrelated.pausedGoals[0]).toMatchObject({
      id: 'goal-add-show',
      status: 'waiting_for_approval',
      pendingApproval: { approvalId: 'approval-add-show' },
    })

    const resumed = applyNicNacTaskContextEvent(unrelated, {
      type: 'approval_resolved',
      approvalId: 'approval-add-show',
      approved: true,
    })

    expect(resumed.effect).toBe('approval_resumed')
    expect(resumed.context.currentGoal).toMatchObject({
      id: 'goal-add-show',
      status: 'active',
      relevantFacts: addShowGoal.relevantFacts,
    })
    expect(resumed.context.currentGoal?.pendingApproval).toBeUndefined()
    expect(resumed.context.pausedGoals).toEqual([
      expect.objectContaining({ id: 'goal-dance-floor-read' }),
    ])
  })

  it('does not disturb unrelated current work when a paused approval is denied', () => {
    const started = request(createEmptyNicNacTaskContext(), addShowGoal)
    const waiting = applyNicNacTaskContextEvent(started, {
      type: 'approval_requested',
      goalId: 'goal-add-show',
      approvalId: 'approval-add-show',
      toolName: 'calendar_create',
    }).context
    const unrelated = request(waiting, {
      id: 'goal-help-question',
      kind: 'guidance',
      summary: 'Answer a live-show question',
      resumeHint: 'Answer the live-show question.',
    })

    const denied = applyNicNacTaskContextEvent(unrelated, {
      type: 'approval_resolved',
      approvalId: 'approval-add-show',
      approved: false,
    })

    expect(denied.effect).toBe('approval_denied')
    expect(denied.context.currentGoal?.id).toBe('goal-help-question')
    expect(denied.context.pausedGoals).toEqual([])
  })

  it('applies corrections to the current goal and invalidates stale approval state', () => {
    const started = request(createEmptyNicNacTaskContext(), addShowGoal)
    const waiting = applyNicNacTaskContextEvent(started, {
      type: 'approval_requested',
      goalId: 'goal-add-show',
      approvalId: 'approval-old-time',
      toolName: 'calendar_create',
    }).context

    const corrected = applyNicNacTaskContextEvent(waiting, {
      type: 'correction',
      goalId: 'goal-add-show',
      summary: 'Add tomorrow\'s live show',
      facts: { localTime: '20:00' },
      removeFacts: ['discountCode'],
      missingFacts: ['platform'],
      resumeHint: 'Confirm the platform for tomorrow at 8 p.m.',
    })

    expect(corrected.effect).toBe('corrected')
    expect(corrected.context.currentGoal).toMatchObject({
      summary: 'Add tomorrow\'s live show',
      status: 'active',
      relevantFacts: expect.objectContaining({
        localTime: '20:00',
        featuredCollection: 'Bunny Ears',
      }),
      missingFacts: ['platform'],
      resumeHint: 'Confirm the platform for tomorrow at 8 p.m.',
    })
    expect(corrected.context.currentGoal?.relevantFacts.discountCode).toBeUndefined()
    expect(corrected.context.currentGoal?.pendingApproval).toBeUndefined()
  })

  it('can replace a mistaken read goal with the corrected mutation goal', () => {
    const mistakenRead = request(createEmptyNicNacTaskContext(), {
      id: 'goal-calendar-read',
      kind: 'read',
      summary: 'Check tonight\'s shows',
      resumeHint: 'Explain the current Calendar result.',
    })

    const corrected = applyNicNacTaskContextEvent(mistakenRead, {
      type: 'correction',
      goalId: 'goal-calendar-read',
      replacementGoal: addShowGoal,
    })

    expect(corrected.effect).toBe('corrected')
    expect(corrected.context.currentGoal).toMatchObject({
      id: 'goal-add-show',
      kind: 'mutation',
      relevantFacts: addShowGoal.relevantFacts,
      missingFacts: ['platform'],
    })
    expect(corrected.context.pausedGoals).toEqual([])
  })

  it('resumes a paused goal with its facts and resume hint intact', () => {
    const addStarted = request(createEmptyNicNacTaskContext(), addShowGoal)
    const interrupted = request(addStarted, {
      id: 'goal-guidance',
      kind: 'guidance',
      summary: 'Answer a streaming question',
      resumeHint: 'Give concise streaming guidance.',
    })

    const resumed = applyNicNacTaskContextEvent(interrupted, {
      type: 'resume_goal',
      goalId: 'goal-add-show',
    })

    expect(resumed.effect).toBe('resumed')
    expect(resumed.context.currentGoal).toMatchObject({
      id: 'goal-add-show',
      relevantFacts: addShowGoal.relevantFacts,
      missingFacts: ['platform'],
      resumeHint: addShowGoal.resumeHint,
    })
    expect(resumed.context.pausedGoals).toEqual([
      expect.objectContaining({ id: 'goal-guidance' }),
    ])
  })

  it('does not mutate the prior context while applying an event', () => {
    const original = request(createEmptyNicNacTaskContext(), addShowGoal)
    const snapshot = structuredClone(original)

    applyNicNacTaskContextEvent(original, {
      type: 'correction',
      facts: { platform: 'TikTok' },
      missingFacts: [],
    })

    expect(original).toEqual(snapshot)
  })
})
