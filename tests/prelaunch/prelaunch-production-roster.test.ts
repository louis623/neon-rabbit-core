import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import { connectPrelaunchLaunchBuildToProductionRep } from '@/lib/prelaunch/production-roster'

describe('prelaunch production roster', () => {
  const originalDemoRepEmail = process.env.DEMO_REP_EMAIL

  beforeEach(() => {
    fromMock.mockReset()
    process.env.DEMO_REP_EMAIL = 'demo@example.com'
  })

  it('connects a launch build to an existing rep without provisioning providers', async () => {
    const selectCurrentMock = vi.fn()
    const eqCurrentMock = vi.fn()
    const singleCurrentMock = vi.fn()
    const selectRepMock = vi.fn()
    const eqRepMock = vi.fn()
    const singleRepMock = vi.fn()
    const updateMock = vi.fn()
    const eqUpdateMock = vi.fn()
    const selectUpdatedMock = vi.fn()
    const singleUpdatedMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectCurrentMock })
      .mockReturnValueOnce({ select: selectRepMock })
      .mockReturnValueOnce({ update: updateMock })
    selectCurrentMock.mockReturnValueOnce({ eq: eqCurrentMock })
    eqCurrentMock.mockReturnValueOnce({ single: singleCurrentMock })
    singleCurrentMock.mockResolvedValueOnce({
      data: {
        lead_name: 'Sparkle Demo Lead',
        lead_email: 'demo-lead@yoursparklesuite.com',
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
        id: 'rep-1',
        email: 'demo@example.com',
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
        rep_id: 'rep-1',
        stage: 'ready_for_launch',
        status: 'ready',
        lead_name: 'Sparkle Demo Lead',
        lead_email: 'demo@example.com',
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
      repId: 'rep-1',
      notes: 'Demo account confirmed.',
    })

    expect(fromMock).toHaveBeenNthCalledWith(1, 'sparkle_suite_launch_builds')
    expect(fromMock).toHaveBeenNthCalledWith(2, 'reps')
    expect(fromMock).toHaveBeenNthCalledWith(3, 'sparkle_suite_launch_builds')
    expect(updateMock).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      production_roster_status: 'connected',
      stage: 'ready_for_launch',
      status: 'ready',
      blockers: [],
      notes: 'Demo account confirmed.',
    })
    expect(build.repId).toBe('rep-1')
    expect(build.status).toBe('ready')
  })

  it('refuses to connect a non-demo rep', async () => {
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
        lead_email: 'demo-lead@yoursparklesuite.com',
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
        email: 'real@example.com',
      },
      error: null,
    })

    await expect(
      connectPrelaunchLaunchBuildToProductionRep({
        launchBuildId: 'build-1',
        repId: 'rep-real',
      }),
    ).rejects.toThrow('Only the configured demo rep can be connected here.')
  })

  it('refuses to connect a real launch build when no demo rep email is configured', async () => {
    delete process.env.DEMO_REP_EMAIL
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
        lead_name: 'Kim Goforth',
        lead_email: 'kim@example.com',
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
        email: 'real@example.com',
      },
      error: null,
    })

    await expect(
      connectPrelaunchLaunchBuildToProductionRep({
        launchBuildId: 'build-real',
        repId: 'rep-real',
      }),
    ).rejects.toThrow('Only demo launch builds can be connected here.')
  })

  afterEach(() => {
    process.env.DEMO_REP_EMAIL = originalDemoRepEmail
  })
})
