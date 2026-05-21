import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import {
  buildPrelaunchLaunchBuildReadiness,
  createPrelaunchLaunchBuildDraft,
  loadPrelaunchLaunchBuilds,
  normalizePrelaunchLaunchBuildRows,
} from '@/lib/prelaunch/launch-builds'

describe('prelaunch launch builds', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('normalizes launch build rows for the active work board', () => {
    expect(
      normalizePrelaunchLaunchBuildRows([
        {
          id: 'build-1',
          waitlist_id: 'waitlist-1',
          intake_submission_id: null,
          rep_id: null,
          stage: 'draft',
          status: 'blocked',
          lead_name: 'Kim Goforth',
          lead_email: 'kim@example.com',
          setup_profile_status: 'not_started',
          payment_gate_status: 'disabled',
          agreement_gate_status: 'disabled',
          build_check_status: 'not_started',
          production_roster_status: 'not_started',
          blockers: ['Setup profile needs operator review.'],
          created_at: '2026-05-21T20:00:00Z',
          updated_at: '2026-05-21T20:01:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'build-1',
        waitlistId: 'waitlist-1',
        intakeSubmissionId: null,
        repId: null,
        stage: 'draft',
        status: 'blocked',
        leadName: 'Kim Goforth',
        leadEmail: 'kim@example.com',
        setupProfileStatus: 'not_started',
        paymentGateStatus: 'disabled',
        agreementGateStatus: 'disabled',
        buildCheckStatus: 'not_started',
        productionRosterStatus: 'not_started',
        blockers: ['Setup profile needs operator review.'],
        createdAt: '2026-05-21T20:00:00Z',
        updatedAt: '2026-05-21T20:01:00Z',
      },
    ])
  })

  it('loads recent non-launched launch builds without provider actions', async () => {
    const selectMock = vi.fn()
    const neqMock = vi.fn()
    const orderMock = vi.fn()
    const limitMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ neq: neqMock })
    neqMock.mockReturnValueOnce({ order: orderMock })
    orderMock.mockReturnValueOnce({ limit: limitMock })
    limitMock.mockResolvedValueOnce({
      data: [
        {
          id: 'build-1',
          waitlist_id: 'waitlist-1',
          intake_submission_id: null,
          rep_id: null,
          stage: 'draft',
          status: 'blocked',
          lead_name: 'Kim Goforth',
          lead_email: 'kim@example.com',
          setup_profile_status: 'not_started',
          payment_gate_status: 'disabled',
          agreement_gate_status: 'disabled',
          build_check_status: 'not_started',
          production_roster_status: 'not_started',
          blockers: ['Payment and agreement gates are still disabled.'],
          created_at: '2026-05-21T20:00:00Z',
          updated_at: '2026-05-21T20:01:00Z',
        },
      ],
      error: null,
    })

    const builds = await loadPrelaunchLaunchBuilds(undefined, 5)

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_launch_builds')
    expect(selectMock).toHaveBeenCalled()
    expect(neqMock).toHaveBeenCalledWith('stage', 'launched')
    expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(limitMock).toHaveBeenCalledWith(5)
    expect(builds).toHaveLength(1)
    expect(builds[0].leadName).toBe('Kim Goforth')
  })

  it('treats a missing launch-build table as an empty board while migrations catch up', async () => {
    const selectMock = vi.fn()
    const neqMock = vi.fn()
    const orderMock = vi.fn()
    const limitMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ neq: neqMock })
    neqMock.mockReturnValueOnce({ order: orderMock })
    orderMock.mockReturnValueOnce({ limit: limitMock })
    limitMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST205',
        message:
          "Could not find the table 'public.sparkle_suite_launch_builds' in the schema cache",
      },
    })

    await expect(loadPrelaunchLaunchBuilds(undefined, 5)).resolves.toEqual([])
  })


  it('creates a blocked draft build from a Start Work-ready waitlist lead only', async () => {
    const waitlistSelectMock = vi.fn()
    const waitlistEqIdMock = vi.fn()
    const waitlistEqStatusMock = vi.fn()
    const waitlistSingleMock = vi.fn()
    const insertMock = vi.fn()
    const buildSelectMock = vi.fn()
    const buildSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: waitlistSelectMock })
      .mockReturnValueOnce({ insert: insertMock })
    waitlistSelectMock.mockReturnValueOnce({ eq: waitlistEqIdMock })
    waitlistEqIdMock.mockReturnValueOnce({ eq: waitlistEqStatusMock })
    waitlistEqStatusMock.mockReturnValueOnce({ single: waitlistSingleMock })
    waitlistSingleMock.mockResolvedValueOnce({
      data: {
        id: 'waitlist-1',
        name: 'Kim Goforth',
        email: 'kim@example.com',
        intake_submission_id: null,
      },
      error: null,
    })
    insertMock.mockReturnValueOnce({ select: buildSelectMock })
    buildSelectMock.mockReturnValueOnce({ single: buildSingleMock })
    buildSingleMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: null,
        rep_id: null,
        stage: 'draft',
        status: 'blocked',
        lead_name: 'Kim Goforth',
        lead_email: 'kim@example.com',
        setup_profile_status: 'drafted',
        payment_gate_status: 'disabled',
        agreement_gate_status: 'disabled',
        build_check_status: 'not_started',
        production_roster_status: 'not_started',
        blockers: [
          'Payment gate is disabled.',
          'Agreement gate is disabled.',
          'Build checks have not started.',
          'Production roster is not connected.',
        ],
        created_at: '2026-05-21T20:00:00Z',
        updated_at: '2026-05-21T20:01:00Z',
      },
      error: null,
    })

    const build = await createPrelaunchLaunchBuildDraft({
      waitlistId: 'waitlist-1',
      operatorRepId: 'operator-1',
    })

    expect(fromMock).toHaveBeenNthCalledWith(1, 'sparkle_suite_waitlist')
    expect(waitlistEqIdMock).toHaveBeenCalledWith('id', 'waitlist-1')
    expect(waitlistEqStatusMock).toHaveBeenCalledWith(
      'lead_status',
      'start_work_ready',
    )
    expect(fromMock).toHaveBeenNthCalledWith(2, 'sparkle_suite_launch_builds')
    expect(insertMock).toHaveBeenCalledWith({
      waitlist_id: 'waitlist-1',
      intake_submission_id: null,
      operator_rep_id: 'operator-1',
      stage: 'draft',
      status: 'blocked',
      lead_name: 'Kim Goforth',
      lead_email: 'kim@example.com',
      setup_profile_status: 'drafted',
      payment_gate_status: 'disabled',
      agreement_gate_status: 'disabled',
      build_check_status: 'not_started',
      production_roster_status: 'not_started',
      blockers: [
        'Payment gate is disabled.',
        'Agreement gate is disabled.',
        'Build checks have not started.',
        'Production roster is not connected.',
      ],
    })
    expect(build.id).toBe('build-1')
  })

  it('explains readiness without marking a build launchable too early', () => {
    expect(
      buildPrelaunchLaunchBuildReadiness({
        setupProfileStatus: 'drafted',
        paymentGateStatus: 'disabled',
        agreementGateStatus: 'disabled',
        buildCheckStatus: 'not_started',
        productionRosterStatus: 'not_started',
      }),
    ).toEqual({
      status: 'blocked',
      blockers: [
        'Payment gate is disabled.',
        'Agreement gate is disabled.',
        'Build checks have not started.',
        'Production roster is not connected.',
      ],
    })
  })

  it('treats a ready setup profile as clear while later launch gates stay blocked', () => {
    expect(
      buildPrelaunchLaunchBuildReadiness({
        setupProfileStatus: 'ready',
        paymentGateStatus: 'disabled',
        agreementGateStatus: 'disabled',
        buildCheckStatus: 'not_started',
        productionRosterStatus: 'not_started',
      }),
    ).toEqual({
      status: 'blocked',
      blockers: [
        'Payment gate is disabled.',
        'Agreement gate is disabled.',
        'Build checks have not started.',
        'Production roster is not connected.',
      ],
    })
  })
})
