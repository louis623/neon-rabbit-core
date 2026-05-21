import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import {
  buildPrelaunchLaunchCheckItems,
  DEFAULT_PRELAUNCH_LAUNCH_CHECKS,
  loadPrelaunchLaunchChecksByBuildIds,
  normalizePrelaunchLaunchCheckRows,
  upsertPrelaunchLaunchCheck,
} from '@/lib/prelaunch/launch-checks'

describe('prelaunch launch checks', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('normalizes launch check rows', () => {
    expect(
      normalizePrelaunchLaunchCheckRows([
        {
          id: 'check-1',
          launch_build_id: 'build-1',
          check_key: 'setup_profile_ready',
          label: 'Setup profile ready',
          status: 'passed',
          notes: 'Looks good.',
          checked_at: '2026-05-21T22:00:00Z',
          created_at: '2026-05-21T21:55:00Z',
          updated_at: '2026-05-21T22:00:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'check-1',
        launchBuildId: 'build-1',
        checkKey: 'setup_profile_ready',
        label: 'Setup profile ready',
        status: 'passed',
        notes: 'Looks good.',
        checkedAt: '2026-05-21T22:00:00Z',
        createdAt: '2026-05-21T21:55:00Z',
        updatedAt: '2026-05-21T22:00:00Z',
      },
    ])
  })

  it('builds default checklist items without writing rows on page load', () => {
    const items = buildPrelaunchLaunchCheckItems('build-1', [])

    expect(items).toHaveLength(DEFAULT_PRELAUNCH_LAUNCH_CHECKS.length)
    expect(items[0]).toMatchObject({
      launchBuildId: 'build-1',
      checkKey: 'setup_profile_ready',
      status: 'not_started',
    })
  })

  it('loads saved checks for active launch builds', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockResolvedValueOnce({
      data: [
        {
          id: 'check-1',
          launch_build_id: 'build-1',
          check_key: 'setup_profile_ready',
          label: 'Setup profile ready',
          status: 'passed',
          notes: '',
          checked_at: '2026-05-21T22:00:00Z',
          created_at: '2026-05-21T21:55:00Z',
          updated_at: '2026-05-21T22:00:00Z',
        },
      ],
      error: null,
    })

    const checks = await loadPrelaunchLaunchChecksByBuildIds(['build-1'])

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_launch_checks')
    expect(inMock).toHaveBeenCalledWith('launch_build_id', ['build-1'])
    expect(checks).toHaveLength(1)
    expect(checks[0].status).toBe('passed')
  })

  it('treats a missing checks table as empty while migrations catch up', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST205',
        message:
          "Could not find the table 'public.sparkle_suite_launch_checks' in the schema cache",
      },
    })

    await expect(
      loadPrelaunchLaunchChecksByBuildIds(['build-1']),
    ).resolves.toEqual([])
  })

  it('upserts a check and keeps the build blocked until every check passes', async () => {
    const upsertMock = vi.fn()
    const selectMock = vi.fn()
    const singleMock = vi.fn()
    const checksSelectMock = vi.fn()
    const checksEqMock = vi.fn()
    const buildSelectMock = vi.fn()
    const buildEqMock = vi.fn()
    const buildSingleMock = vi.fn()
    const updateMock = vi.fn()
    const updateEqMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ upsert: upsertMock })
      .mockReturnValueOnce({ select: checksSelectMock })
      .mockReturnValueOnce({ select: buildSelectMock })
      .mockReturnValueOnce({ update: updateMock })
    upsertMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ single: singleMock })
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'check-1',
        launch_build_id: 'build-1',
        check_key: 'setup_profile_ready',
        label: 'Setup profile ready',
        status: 'passed',
        notes: 'Profile reviewed.',
        checked_at: '2026-05-21T22:00:00Z',
        created_at: '2026-05-21T21:55:00Z',
        updated_at: '2026-05-21T22:00:00Z',
      },
      error: null,
    })
    checksSelectMock.mockReturnValueOnce({ eq: checksEqMock })
    checksEqMock.mockResolvedValueOnce({
      data: [
        {
          id: 'check-1',
          launch_build_id: 'build-1',
          check_key: 'setup_profile_ready',
          label: 'Setup profile ready',
          status: 'passed',
          notes: 'Profile reviewed.',
          checked_at: '2026-05-21T22:00:00Z',
          created_at: '2026-05-21T21:55:00Z',
          updated_at: '2026-05-21T22:00:00Z',
        },
      ],
      error: null,
    })
    buildSelectMock.mockReturnValueOnce({ eq: buildEqMock })
    buildEqMock.mockReturnValueOnce({ single: buildSingleMock })
    buildSingleMock.mockResolvedValueOnce({
      data: {
        setup_profile_status: 'ready',
        payment_gate_status: 'disabled',
        agreement_gate_status: 'disabled',
        production_roster_status: 'not_started',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: updateEqMock })
    updateEqMock.mockResolvedValueOnce({ data: null, error: null })

    const check = await upsertPrelaunchLaunchCheck({
      launchBuildId: 'build-1',
      checkKey: 'setup_profile_ready',
      status: 'passed',
      notes: 'Profile reviewed.',
    })

    expect(upsertMock).toHaveBeenCalledWith(
      {
        launch_build_id: 'build-1',
        check_key: 'setup_profile_ready',
        label: 'Setup profile ready',
        status: 'passed',
        notes: 'Profile reviewed.',
        checked_at: expect.any(String),
      },
      { onConflict: 'launch_build_id,check_key' },
    )
    expect(updateMock).toHaveBeenCalledWith({
      build_check_status: 'not_started',
      stage: 'checks',
      status: 'blocked',
      blockers: [
        'Payment gate is disabled.',
        'Agreement gate is disabled.',
        'Build checks have not started.',
        'Production roster is not connected.',
      ],
    })
    expect(check.status).toBe('passed')
  })
})
