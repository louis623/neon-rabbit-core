import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import { connectPrelaunchLaunchBuildToProductionRep } from '@/lib/prelaunch/production-roster'

describe('prelaunch production roster', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('connects a launch build to an existing rep only after real launch gates are ready', async () => {
    const selectCurrentMock = vi.fn()
    const eqCurrentMock = vi.fn()
    const singleCurrentMock = vi.fn()
    const selectRepMock = vi.fn()
    const eqRepMock = vi.fn()
    const singleRepMock = vi.fn()
    const selectProfileMock = vi.fn()
    const eqProfileMock = vi.fn()
    const maybeSingleProfileMock = vi.fn()
    const updateRepMock = vi.fn()
    const eqUpdateRepMock = vi.fn()
    const updateMock = vi.fn()
    const eqUpdateMock = vi.fn()
    const selectUpdatedMock = vi.fn()
    const singleUpdatedMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectCurrentMock })
      .mockReturnValueOnce({ select: selectRepMock })
      .mockReturnValueOnce({ select: selectProfileMock })
      .mockReturnValueOnce({ update: updateRepMock })
      .mockReturnValueOnce({ update: updateMock })
    selectCurrentMock.mockReturnValueOnce({ eq: eqCurrentMock })
    eqCurrentMock.mockReturnValueOnce({ single: singleCurrentMock })
    singleCurrentMock.mockResolvedValueOnce({
      data: {
        lead_name: 'Sparkle Demo Lead',
        lead_email: 'customer@example.com',
        setup_profile_status: 'ready',
        payment_gate_status: 'ready',
        agreement_gate_status: 'ready',
        build_check_status: 'passed',
      },
      error: null,
    })
    selectRepMock.mockReturnValueOnce({ eq: eqRepMock })
    eqRepMock.mockReturnValueOnce({ single: singleRepMock })
    singleRepMock.mockResolvedValueOnce({
      data: {
        id: 'rep-real',
        email: 'customer@example.com',
      },
      error: null,
    })
    selectProfileMock.mockReturnValueOnce({ eq: eqProfileMock })
    eqProfileMock.mockReturnValueOnce({ maybeSingle: maybeSingleProfileMock })
    maybeSingleProfileMock.mockResolvedValueOnce({
      data: {
        custom_domain: 'customer.sparklesuite.test',
      },
      error: null,
    })
    updateRepMock.mockReturnValueOnce({ eq: eqUpdateRepMock })
    eqUpdateRepMock.mockResolvedValueOnce({ data: null, error: null })
    updateMock.mockReturnValueOnce({ eq: eqUpdateMock })
    eqUpdateMock.mockReturnValueOnce({ select: selectUpdatedMock })
    selectUpdatedMock.mockReturnValueOnce({ single: singleUpdatedMock })
    singleUpdatedMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: null,
        rep_id: 'rep-real',
        stage: 'ready_for_launch',
        status: 'ready',
        lead_name: 'Real Customer',
        lead_email: 'customer@example.com',
        setup_profile_status: 'ready',
        payment_gate_status: 'ready',
        agreement_gate_status: 'ready',
        build_check_status: 'passed',
        production_roster_status: 'connected',
        blockers: [],
        created_at: '2026-05-21T20:00:00Z',
        updated_at: '2026-05-21T23:50:00Z',
      },
      error: null,
    })

    const build = await connectPrelaunchLaunchBuildToProductionRep({
      launchBuildId: 'build-1',
      repId: 'rep-real',
      notes: 'Customer account confirmed.',
    })

    expect(fromMock).toHaveBeenNthCalledWith(1, 'sparkle_suite_launch_builds')
    expect(fromMock).toHaveBeenNthCalledWith(2, 'reps')
    expect(fromMock).toHaveBeenNthCalledWith(
      3,
      'sparkle_suite_launch_setup_profiles',
    )
    expect(fromMock).toHaveBeenNthCalledWith(4, 'reps')
    expect(fromMock).toHaveBeenNthCalledWith(5, 'sparkle_suite_launch_builds')
    expect(updateRepMock).toHaveBeenCalledWith({
      custom_domain: 'customer.sparklesuite.test',
    })
    expect(eqUpdateRepMock).toHaveBeenCalledWith('id', 'rep-real')
    expect(updateMock).toHaveBeenCalledWith({
      rep_id: 'rep-real',
      production_roster_status: 'connected',
      stage: 'ready_for_launch',
      status: 'ready',
      blockers: [],
      notes: 'Customer account confirmed.',
    })
    expect(build.repId).toBe('rep-real')
    expect(build.status).toBe('ready')
  })

  it('does not change the rep domain when the setup profile has none', async () => {
    const selectCurrentMock = vi.fn()
    const eqCurrentMock = vi.fn()
    const singleCurrentMock = vi.fn()
    const selectRepMock = vi.fn()
    const eqRepMock = vi.fn()
    const singleRepMock = vi.fn()
    const selectProfileMock = vi.fn()
    const eqProfileMock = vi.fn()
    const maybeSingleProfileMock = vi.fn()
    const updateMock = vi.fn()
    const eqUpdateMock = vi.fn()
    const selectUpdatedMock = vi.fn()
    const singleUpdatedMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectCurrentMock })
      .mockReturnValueOnce({ select: selectRepMock })
      .mockReturnValueOnce({ select: selectProfileMock })
      .mockReturnValueOnce({ update: updateMock })
    selectCurrentMock.mockReturnValueOnce({ eq: eqCurrentMock })
    eqCurrentMock.mockReturnValueOnce({ single: singleCurrentMock })
    singleCurrentMock.mockResolvedValueOnce({
      data: {
        lead_name: 'Sparkle Demo Lead',
        lead_email: 'customer@example.com',
        setup_profile_status: 'ready',
        payment_gate_status: 'ready',
        agreement_gate_status: 'ready',
        build_check_status: 'passed',
      },
      error: null,
    })
    selectRepMock.mockReturnValueOnce({ eq: eqRepMock })
    eqRepMock.mockReturnValueOnce({ single: singleRepMock })
    singleRepMock.mockResolvedValueOnce({
      data: {
        id: 'rep-real',
        email: 'customer@example.com',
      },
      error: null,
    })
    selectProfileMock.mockReturnValueOnce({ eq: eqProfileMock })
    eqProfileMock.mockReturnValueOnce({ maybeSingle: maybeSingleProfileMock })
    maybeSingleProfileMock.mockResolvedValueOnce({
      data: {
        custom_domain: null,
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: eqUpdateMock })
    eqUpdateMock.mockReturnValueOnce({ select: selectUpdatedMock })
    selectUpdatedMock.mockReturnValueOnce({ single: singleUpdatedMock })
    singleUpdatedMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: null,
        rep_id: 'rep-real',
        stage: 'ready_for_launch',
        status: 'ready',
        lead_name: 'Real Customer',
        lead_email: 'customer@example.com',
        setup_profile_status: 'ready',
        payment_gate_status: 'ready',
        agreement_gate_status: 'ready',
        build_check_status: 'passed',
        production_roster_status: 'connected',
        blockers: [],
        created_at: '2026-05-21T20:00:00Z',
        updated_at: '2026-05-21T23:50:00Z',
      },
      error: null,
    })

    const build = await connectPrelaunchLaunchBuildToProductionRep({
      launchBuildId: 'build-1',
      repId: 'rep-real',
    })

    expect(fromMock).toHaveBeenNthCalledWith(4, 'sparkle_suite_launch_builds')
    expect(updateMock).toHaveBeenCalledWith({
      rep_id: 'rep-real',
      production_roster_status: 'connected',
      stage: 'ready_for_launch',
      status: 'ready',
      blockers: [],
      notes: '',
    })
    expect(build.repId).toBe('rep-real')
    expect(build.status).toBe('ready')
  })

  it('refuses to connect a build before gates and checks are ready', async () => {
    const selectCurrentMock = vi.fn()
    const eqCurrentMock = vi.fn()
    const singleCurrentMock = vi.fn()
    const selectRepMock = vi.fn()
    const eqRepMock = vi.fn()
    const singleRepMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectCurrentMock })
      .mockReturnValueOnce({ select: selectRepMock })
    selectCurrentMock.mockReturnValueOnce({ eq: eqCurrentMock })
    eqCurrentMock.mockReturnValueOnce({ single: singleCurrentMock })
    singleCurrentMock.mockResolvedValueOnce({
      data: {
        lead_name: 'Sparkle Demo Lead',
        lead_email: 'customer@example.com',
        setup_profile_status: 'drafted',
        payment_gate_status: 'disabled',
        agreement_gate_status: 'ready',
        build_check_status: 'not_started',
      },
      error: null,
    })
    selectRepMock.mockReturnValueOnce({ eq: eqRepMock })
    eqRepMock.mockReturnValueOnce({ single: singleRepMock })
    singleRepMock.mockResolvedValueOnce({
      data: {
        id: 'rep-real',
        email: 'real@example.com',
      },
      error: null,
    })

    await expect(
      connectPrelaunchLaunchBuildToProductionRep({
        launchBuildId: 'build-1',
        repId: 'rep-real',
      }),
    ).rejects.toThrow(
      'Production roster requires setup, payment, agreement, and build checks to be ready.',
    )
  })
})
