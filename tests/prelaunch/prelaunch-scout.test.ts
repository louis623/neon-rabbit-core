import { describe, expect, it, vi } from 'vitest'

import {
  buildPrelaunchScoutOutput,
  runPrelaunchScoutForIntake,
} from '@/lib/prelaunch/scout'
import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

const submission: PrelaunchIntakeReviewSubmission = {
  id: 'intake-1',
  name: 'Jamie Hart',
  email: 'jamie@example.com',
  phone: '303-555-0123',
  businessName: 'Jamie Hart Jewelry',
  social: {
    tiktok: '@jamieh',
    instagram: '@jamiebling',
    facebook: null,
  },
  team: {
    name: 'Lindsey Team',
    size: '6-20',
  },
  primaryPlatform: 'tiktok',
  streamingFrequency: 'multiple_weekly',
  currentSetup: 'TikTok bio link and DMs',
  setupGoal: 'Cleaner show-night hub',
  deviceSetup: 'phone_only',
  brandVibe: 'polished and warm',
  colorPreferences: 'plum and pearl',
  specialRequests: 'Needs help with launch links',
  intakeStatus: 'submitted',
  prequalificationStatus: 'needs_review',
  fitFlags: ['phone_only_setup'],
  waitlistId: 'waitlist-1',
  scoutInputStatus: 'ready',
  createdAt: '2026-05-09T18:00:00Z',
  updatedAt: '2026-05-09T18:00:00Z',
}

describe('prelaunch Scout', () => {
  it('builds a first-pass onboarding recommendation from intake context', () => {
    const output = buildPrelaunchScoutOutput(submission)

    expect(output.briefTitle).toBe('Scout brief: Jamie Hart Jewelry')
    expect(output.recommendedNextStep).toBe('operator_review_first')
    expect(output.setupRisks).toContain(
      'Confirm a two-device live setup before booking a build path.',
    )
    expect(output.researchTargets).toContainEqual({
      label: 'TikTok',
      value: '@jamieh',
      priority: 'high',
    })
    expect(output.suggestedQuestions.join(' ')).toContain('two-device')
  })

  it('reuses recent Scout lessons in the generated recommendation', () => {
    const output = buildPrelaunchScoutOutput(submission, [
      {
        sourceRunKey: 'scout:older-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'Reps using TikTok and phone-only setups need a two-device plan before launch copy.',
      },
    ])

    expect(output.reusedLessons).toEqual([
      {
        sourceRunKey: 'scout:older-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'Reps using TikTok and phone-only setups need a two-device plan before launch copy.',
      },
    ])
    expect(output.suggestedQuestions).toContain(
      'What from the prior Scout lesson should Louis reuse or avoid for this rep?',
    )
  })

  it('logs the Scout run and marks the intake Scout handoff generated', async () => {
    const intakeSingleMock = vi.fn().mockResolvedValueOnce({
      data: {
        id: 'intake-1',
        full_name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        business_name: 'Jamie Hart Jewelry',
        tiktok_handle: '@jamieh',
        instagram_handle: '@jamiebling',
        facebook_url: null,
        team_name: 'Lindsey Team',
        team_size: '6-20',
        primary_platform: 'tiktok',
        streaming_frequency: 'multiple_weekly',
        current_setup: 'TikTok bio link and DMs',
        setup_goal: 'Cleaner show-night hub',
        device_setup: 'phone_only',
        brand_vibe: 'polished and warm',
        color_preferences: 'plum and pearl',
        special_requests: 'Needs help with launch links',
        intake_status: 'submitted',
        prequalification_status: 'needs_review',
        fit_flags: ['phone_only_setup'],
        waitlist_id: 'waitlist-1',
        scout_input_status: 'ready',
        created_at: '2026-05-09T18:00:00Z',
        updated_at: '2026-05-09T18:00:00Z',
      },
      error: null,
    })
    const intakeEqMock = vi.fn(() => ({ single: intakeSingleMock }))
    const intakeSelectMock = vi.fn(() => ({ eq: intakeEqMock }))
    const intakeUpdateEqMock = vi.fn().mockResolvedValueOnce({ error: null })
    const intakeUpdateMock = vi.fn(() => ({ eq: intakeUpdateEqMock }))
    const previousRunsLimitMock = vi.fn().mockResolvedValueOnce({
      data: [
        {
          run_key: 'scout:older-intake:2026-05-09T18:30:00.000Z',
          summary:
            'Earlier Scout run found that TikTok phone-only reps need device planning.',
          output: {
            setupRisks: [
              'Confirm a two-device live setup before booking a build path.',
            ],
          },
        },
      ],
      error: null,
    })
    const previousRunsOrderMock = vi.fn(() => ({ limit: previousRunsLimitMock }))
    const previousRunsNeqMock = vi.fn(() => ({ order: previousRunsOrderMock }))
    const previousRunsStatusEqMock = vi.fn(() => ({ neq: previousRunsNeqMock }))
    const previousRunsAgentEqMock = vi.fn(() => ({ eq: previousRunsStatusEqMock }))
    const previousRunsSelectMock = vi.fn(() => ({ eq: previousRunsAgentEqMock }))
    const agentRunsInsertMock = vi.fn().mockResolvedValueOnce({ error: null })
    const fromMock = vi.fn((table: string) => {
      if (table === 'agent_runs') {
        return {
          select: previousRunsSelectMock,
          insert: agentRunsInsertMock,
        }
      }
      return {
        select: intakeSelectMock,
        update: intakeUpdateMock,
      }
    })

    const result = await runPrelaunchScoutForIntake({
      admin: { from: fromMock } as never,
      intakeId: 'intake-1',
      operatorRepId: 'rep-1',
      now: new Date('2026-05-09T19:00:00Z'),
    })

    expect(result.runKey).toBe('scout:intake-1:2026-05-09T19:00:00.000Z')
    expect(agentRunsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        run_key: 'scout:intake-1:2026-05-09T19:00:00.000Z',
        agent_name: 'Scout',
        agent_kind: 'pre_meeting_intel',
        intake_submission_id: 'intake-1',
        waitlist_id: 'waitlist-1',
        rep_id: 'rep-1',
        status: 'completed',
        trigger_source: 'operator_review',
        model: 'deterministic_scout_v1',
        metadata: expect.objectContaining({
          reused_lesson_count: 1,
        }),
      }),
    )
    expect(previousRunsSelectMock).toHaveBeenCalledWith(
      'run_key, summary, output',
    )
    expect(intakeUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scout_input_status: 'generated',
        scout_input_generated_at: '2026-05-09T19:00:00.000Z',
        handoff_status: 'scout_ready',
      }),
    )
    expect(result.output.recommendedNextStep).toBe('operator_review_first')
    expect(result.output.reusedLessons).toEqual([
      {
        sourceRunKey: 'scout:older-intake:2026-05-09T18:30:00.000Z',
        lesson:
          'Earlier Scout run found that TikTok phone-only reps need device planning.',
      },
    ])
  })
})
