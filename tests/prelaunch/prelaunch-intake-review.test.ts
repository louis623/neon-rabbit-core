import { describe, expect, it, vi } from 'vitest'

import {
  buildPrelaunchScoutInput,
  normalizePrelaunchIntakeReviewRows,
} from '@/lib/prelaunch/intake-review'
import { loadPrelaunchIntakeReviewSubmissions } from '@/lib/prelaunch/intake-review-query'

describe('prelaunch intake review helpers', () => {
  it('normalizes review rows for operator review', () => {
    expect(
      normalizePrelaunchIntakeReviewRows([
        {
          id: 'intake-1',
          full_name: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          business_name: 'Jamie Hart Jewelry',
          tiktok_handle: '@jamieh',
          instagram_handle: null,
          facebook_url: null,
          team_name: null,
          team_size: '1-5',
          primary_platform: 'tiktok',
          streaming_frequency: 'weekly',
          current_setup: 'Bio link',
          setup_goal: 'Cleaner hub',
          device_setup: 'phone_and_computer',
          brand_vibe: 'warm',
          color_preferences: null,
          special_requests: null,
          intake_status: 'submitted',
          prequalification_status: 'qualified',
          fit_flags: [],
          waitlist_id: 'waitlist-1',
          scout_input_status: 'ready',
          created_at: '2026-05-09T18:00:00Z',
          updated_at: '2026-05-09T18:00:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'intake-1',
        name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        businessName: 'Jamie Hart Jewelry',
        social: {
          tiktok: '@jamieh',
          instagram: null,
          facebook: null,
        },
        team: {
          name: null,
          size: '1-5',
        },
        primaryPlatform: 'tiktok',
        streamingFrequency: 'weekly',
        currentSetup: 'Bio link',
        setupGoal: 'Cleaner hub',
        deviceSetup: 'phone_and_computer',
        brandVibe: 'warm',
        colorPreferences: null,
        specialRequests: null,
        intakeStatus: 'submitted',
        prequalificationStatus: 'qualified',
        fitFlags: [],
        waitlistId: 'waitlist-1',
        scoutInputStatus: 'ready',
        latestScoutRun: null,
        createdAt: '2026-05-09T18:00:00Z',
        updatedAt: '2026-05-09T18:00:00Z',
      },
    ])
  })

  it('builds the Scout input shape from one normalized intake row', () => {
    const [submission] = normalizePrelaunchIntakeReviewRows([
      {
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
        special_requests: 'Needs help with links',
        intake_status: 'submitted',
        prequalification_status: 'needs_review',
        fit_flags: ['phone_only_setup'],
        waitlist_id: 'waitlist-1',
        scout_input_status: 'ready',
        created_at: '2026-05-09T18:00:00Z',
        updated_at: '2026-05-09T18:00:00Z',
      },
    ])

    expect(buildPrelaunchScoutInput(submission)).toEqual({
      intakeId: 'intake-1',
      prospect: {
        name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        businessName: 'Jamie Hart Jewelry',
      },
      socialHandles: {
        tiktok: '@jamieh',
        instagram: '@jamiebling',
        facebook: null,
      },
      streamingContext: {
        primaryPlatform: 'tiktok',
        streamingFrequency: 'multiple_weekly',
        currentSetup: 'TikTok bio link and DMs',
        deviceSetup: 'phone_only',
      },
      teamContext: {
        teamName: 'Lindsey Team',
        teamSize: '6-20',
      },
      brandContext: {
        brandVibe: 'polished and warm',
        colorPreferences: 'plum and pearl',
        setupGoal: 'Cleaner show-night hub',
        specialRequests: 'Needs help with links',
      },
      prequalification: {
        status: 'needs_review',
        fitFlags: ['phone_only_setup'],
      },
    })
  })

  it('loads the latest saved Scout run for each intake submission', async () => {
    const intakeOrderMock = async () => ({
      data: [
        {
          id: 'intake-1',
          full_name: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          business_name: 'Jamie Hart Jewelry',
          tiktok_handle: '@jamieh',
          instagram_handle: null,
          facebook_url: null,
          team_name: null,
          team_size: '1-5',
          primary_platform: 'tiktok',
          streaming_frequency: 'weekly',
          current_setup: 'Bio link',
          setup_goal: 'Cleaner hub',
          device_setup: 'phone_and_computer',
          brand_vibe: 'warm',
          color_preferences: null,
          special_requests: null,
          intake_status: 'submitted',
          prequalification_status: 'qualified',
          fit_flags: [],
          waitlist_id: 'waitlist-1',
          scout_input_status: 'generated',
          created_at: '2026-05-09T18:00:00Z',
          updated_at: '2026-05-09T18:00:00Z',
        },
      ],
      error: null,
    })
    const scoutRunsLimitMock = vi.fn().mockResolvedValueOnce({
      data: [
        {
          intake_submission_id: 'intake-1',
          run_key: 'scout:intake-1:2026-05-09T19:30:00.000Z',
          status: 'completed',
          trigger_source: 'intake_submission',
          model: 'deterministic_scout_v1',
          summary: 'Scout captured public evidence and suggested a call angle.',
          error_message: null,
          created_at: '2026-05-09T19:30:00Z',
          metadata: {
            synthesis_status: 'deterministic_fallback',
            synthesis_confidence: 'high',
            captured_evidence_count: 2,
            reused_lesson_count: 1,
            reused_lesson_status: 'available',
            evidence_source_statuses: [
              {
                label: 'TikTok',
                status: 'captured',
                url: 'https://www.tiktok.com/@jamieh',
              },
              {
                label: 'Primary customer link',
                status: 'captured',
                url: 'https://jamiehartjewelry.com/live',
              },
            ],
          },
          output: {
            reusedLessons: [
              {
                sourceRunKey: 'scout:tiktok-intake:2026-05-09T18:30:00.000Z',
                lesson:
                  'TikTok phone-only reps need a two-device plan before launch copy.',
                similarityReasons: [
                  'same primary platform',
                  'same device setup',
                ],
              },
            ],
          },
        },
        {
          intake_submission_id: 'intake-1',
          run_key: 'scout:intake-1:2026-05-09T19:00:00.000Z',
          status: 'completed',
          trigger_source: 'operator_review',
          model: 'deterministic_scout_v1',
          summary: 'Older Scout run.',
          error_message: null,
          created_at: '2026-05-09T19:00:00Z',
          metadata: {
            synthesis_status: 'not_available',
            captured_evidence_count: 0,
          },
        },
      ],
      error: null,
    })
    const scoutRunsOrderMock = vi.fn(() => ({ limit: scoutRunsLimitMock }))
    const scoutRunsInMock = vi.fn(() => ({ order: scoutRunsOrderMock }))
    const scoutRunsEqMock = vi.fn(() => ({ in: scoutRunsInMock }))
    const scoutRunsSelectMock = vi.fn(() => ({ eq: scoutRunsEqMock }))
    const intakeLimitMock = vi.fn(() => ({ order: intakeOrderMock }))
    const intakeSelectMock = vi.fn(() => ({ limit: intakeLimitMock }))
    const fromMock = vi.fn((table: string) => {
      if (table === 'agent_runs') {
        return { select: scoutRunsSelectMock }
      }

      return { select: intakeSelectMock }
    })

    const submissions = await loadPrelaunchIntakeReviewSubmissions(
      { from: fromMock } as never,
      50,
    )

    expect(fromMock).toHaveBeenCalledWith('agent_runs')
    expect(scoutRunsSelectMock).toHaveBeenCalledWith(
      'intake_submission_id, run_key, status, trigger_source, model, summary, error_message, created_at, metadata, output',
    )
    expect(scoutRunsEqMock).toHaveBeenCalledWith('agent_name', 'Scout')
    expect(scoutRunsInMock).toHaveBeenCalledWith('intake_submission_id', [
      'intake-1',
    ])
    expect(submissions[0]?.latestScoutRun).toEqual({
      runKey: 'scout:intake-1:2026-05-09T19:30:00.000Z',
      status: 'completed',
      triggerSource: 'intake_submission',
      model: 'deterministic_scout_v1',
      summary: 'Scout captured public evidence and suggested a call angle.',
      errorMessage: null,
      createdAt: '2026-05-09T19:30:00Z',
      synthesisStatus: 'deterministic_fallback',
      synthesisConfidence: 'high',
      capturedEvidenceCount: 2,
      reusedLessonCount: 1,
      reusedLessonStatus: 'available',
      reusedLessons: [
        {
          sourceRunKey: 'scout:tiktok-intake:2026-05-09T18:30:00.000Z',
          lesson:
            'TikTok phone-only reps need a two-device plan before launch copy.',
          similarityReasons: ['same primary platform', 'same device setup'],
        },
      ],
      evidenceSourceStatuses: [
        {
          label: 'TikTok',
          status: 'captured',
          url: 'https://www.tiktok.com/@jamieh',
        },
        {
          label: 'Primary customer link',
          status: 'captured',
          url: 'https://jamiehartjewelry.com/live',
        },
      ],
    })
  })

  it('keeps the latest failed Scout run error visible for review', async () => {
    const intakeOrderMock = async () => ({
      data: [
        {
          id: 'intake-1',
          full_name: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          business_name: 'Jamie Hart Jewelry',
          tiktok_handle: '@jamieh',
          instagram_handle: null,
          facebook_url: null,
          team_name: null,
          team_size: '1-5',
          primary_platform: 'tiktok',
          streaming_frequency: 'weekly',
          current_setup: 'Bio link',
          setup_goal: 'Cleaner hub',
          device_setup: 'phone_and_computer',
          brand_vibe: 'warm',
          color_preferences: null,
          special_requests: null,
          intake_status: 'submitted',
          prequalification_status: 'qualified',
          fit_flags: [],
          waitlist_id: 'waitlist-1',
          scout_input_status: 'ready',
          created_at: '2026-05-09T18:00:00Z',
          updated_at: '2026-05-09T18:00:00Z',
        },
      ],
      error: null,
    })
    const scoutRunsLimitMock = vi.fn().mockResolvedValueOnce({
      data: [
        {
          intake_submission_id: 'intake-1',
          run_key: 'scout:intake-1:2026-05-09T19:30:00.000Z',
          status: 'failed',
          trigger_source: 'intake_submission',
          model: 'deterministic_scout_v1',
          summary: null,
          error_message: 'Public evidence fetch timed out.',
          created_at: '2026-05-09T19:30:00Z',
          metadata: {},
        },
      ],
      error: null,
    })
    const scoutRunsOrderMock = vi.fn(() => ({ limit: scoutRunsLimitMock }))
    const scoutRunsInMock = vi.fn(() => ({ order: scoutRunsOrderMock }))
    const scoutRunsEqMock = vi.fn(() => ({ in: scoutRunsInMock }))
    const scoutRunsSelectMock = vi.fn(() => ({ eq: scoutRunsEqMock }))
    const intakeLimitMock = vi.fn(() => ({ order: intakeOrderMock }))
    const intakeSelectMock = vi.fn(() => ({ limit: intakeLimitMock }))
    const fromMock = vi.fn((table: string) => {
      if (table === 'agent_runs') {
        return { select: scoutRunsSelectMock }
      }

      return { select: intakeSelectMock }
    })

    const submissions = await loadPrelaunchIntakeReviewSubmissions(
      { from: fromMock } as never,
    )

    expect(submissions[0]?.latestScoutRun).toEqual(
      expect.objectContaining({
        status: 'failed',
        summary: null,
        errorMessage: 'Public evidence fetch timed out.',
      }),
    )
  })
})
