import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import {
  buildPrelaunchLaunchGateItems,
  DEFAULT_PRELAUNCH_LAUNCH_GATES,
  loadPrelaunchLaunchGatesByBuildIds,
  normalizePrelaunchLaunchGateRows,
  upsertPrelaunchLaunchGate,
} from '@/lib/prelaunch/launch-gates'

describe('prelaunch launch gates', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('normalizes launch gate rows', () => {
    expect(
      normalizePrelaunchLaunchGateRows([
        {
          id: 'gate-1',
          launch_build_id: 'build-1',
          gate_key: 'payment',
          label: 'Payment gate',
          mode: 'test',
          status: 'ready',
          notes: 'Stripe test mode verified.',
          updated_by_rep_id: null,
          created_at: '2026-05-21T22:10:00Z',
          updated_at: '2026-05-21T22:11:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'gate-1',
        launchBuildId: 'build-1',
        gateKey: 'payment',
        label: 'Payment gate',
        mode: 'test',
        status: 'ready',
        notes: 'Stripe test mode verified.',
        updatedByRepId: null,
        createdAt: '2026-05-21T22:10:00Z',
        updatedAt: '2026-05-21T22:11:00Z',
      },
    ])
  })

  it('builds default launch gates without writing rows on page load', () => {
    const gates = buildPrelaunchLaunchGateItems('build-1', [])

    expect(gates).toHaveLength(DEFAULT_PRELAUNCH_LAUNCH_GATES.length)
    expect(gates[0]).toMatchObject({
      launchBuildId: 'build-1',
      gateKey: 'payment',
      mode: 'test',
      status: 'disabled',
    })
  })

  it('loads launch gates for active builds', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockResolvedValueOnce({
      data: [
        {
          id: 'gate-1',
          launch_build_id: 'build-1',
          gate_key: 'payment',
          label: 'Payment gate',
          mode: 'test',
          status: 'ready',
          notes: '',
          updated_by_rep_id: null,
          created_at: '2026-05-21T22:10:00Z',
          updated_at: '2026-05-21T22:11:00Z',
        },
      ],
      error: null,
    })

    const gates = await loadPrelaunchLaunchGatesByBuildIds(['build-1'])

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_launch_gates')
    expect(inMock).toHaveBeenCalledWith('launch_build_id', ['build-1'])
    expect(gates[0].gateKey).toBe('payment')
  })

  it('treats a missing launch gates table as empty while migrations catch up', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST205',
        message:
          "Could not find the table 'public.sparkle_suite_launch_gates' in the schema cache",
      },
    })

    await expect(loadPrelaunchLaunchGatesByBuildIds(['build-1'])).resolves.toEqual(
      [],
    )
  })

  it('upserts payment gate readiness without provider calls and keeps roster blocked', async () => {
    const upsertMock = vi.fn()
    const selectMock = vi.fn()
    const singleMock = vi.fn()
    const buildSelectMock = vi.fn()
    const buildEqMock = vi.fn()
    const buildSingleMock = vi.fn()
    const updateMock = vi.fn()
    const updateEqMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ upsert: upsertMock })
      .mockReturnValueOnce({ select: buildSelectMock })
      .mockReturnValueOnce({ update: updateMock })
    upsertMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ single: singleMock })
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'gate-1',
        launch_build_id: 'build-1',
        gate_key: 'payment',
        label: 'Payment gate',
        mode: 'test',
        status: 'ready',
        notes: 'Stripe test config reviewed.',
        updated_by_rep_id: 'operator-1',
        created_at: '2026-05-21T22:10:00Z',
        updated_at: '2026-05-21T22:11:00Z',
      },
      error: null,
    })
    buildSelectMock.mockReturnValueOnce({ eq: buildEqMock })
    buildEqMock.mockReturnValueOnce({ single: buildSingleMock })
    buildSingleMock.mockResolvedValueOnce({
      data: {
        setup_profile_status: 'ready',
        payment_gate_status: 'disabled',
        agreement_gate_status: 'ready',
        build_check_status: 'passed',
        production_roster_status: 'not_started',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: updateEqMock })
    updateEqMock.mockResolvedValueOnce({ data: null, error: null })

    const gate = await upsertPrelaunchLaunchGate({
      launchBuildId: 'build-1',
      gateKey: 'payment',
      status: 'ready',
      notes: 'Stripe test config reviewed.',
      operatorRepId: 'operator-1',
    })

    expect(upsertMock).toHaveBeenCalledWith(
      {
        launch_build_id: 'build-1',
        gate_key: 'payment',
        label: 'Payment gate',
        mode: 'test',
        status: 'ready',
        notes: 'Stripe test config reviewed.',
        updated_by_rep_id: 'operator-1',
      },
      { onConflict: 'launch_build_id,gate_key' },
    )
    expect(updateMock).toHaveBeenCalledWith({
      payment_gate_status: 'ready',
      agreement_gate_status: 'ready',
      status: 'blocked',
      blockers: ['Production roster is not connected.'],
    })
    expect(gate.status).toBe('ready')
  })
})
