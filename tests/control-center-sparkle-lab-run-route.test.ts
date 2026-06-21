import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createAdminClientMock = vi.fn()
const runSparkleLabManualScanMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getAuthenticatedOperator: (...args: unknown[]) =>
    getAuthenticatedOperatorMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/sparkle-lab/runner', () => ({
  runSparkleLabManualScan: (...args: unknown[]) =>
    runSparkleLabManualScanMock(...args),
}))

import { POST } from '@/app/api/control-center/sparkle-lab/run/route'

function request(body: unknown = {}) {
  return new Request('https://www.yoursparklesuite.com/api/control-center/sparkle-lab/run', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/control-center/sparkle-lab/run', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    getAuthenticatedOperatorMock.mockReset()
    createAdminClientMock.mockReset()
    runSparkleLabManualScanMock.mockReset()
    getAuthenticatedOperatorMock.mockResolvedValue({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    runSparkleLabManualScanMock.mockResolvedValue({
      runId: 'run-1',
      runType: 'urgent',
      usage: {
        estimatedCostCents: 0,
        modelCallCount: 0,
        premiumCallCount: 0,
        runtimeSeconds: 0,
        candidateRecordCount: 2,
        deepItemCount: 1,
        headlineFindingCount: 1,
        activePriorityCount: 1,
      },
      limitsHit: [],
      findings: [
        {
          section: 'nic_nac_lab',
          severity: 'high',
          confidence: 'high',
          title: 'Hard fail',
          recommendedAction: 'Create a replay.',
          priorityRank: 1,
        },
      ],
    })
  })

  it('is disabled by default to prevent accidental Lab spend', async () => {
    const response = await POST(request())
    const json = await response.json()

    expect(response.status).toBe(423)
    expect(json).toMatchObject({
      error: 'sparkle_lab_manual_runs_disabled',
    })
    expect(runSparkleLabManualScanMock).not.toHaveBeenCalled()
  })

  it('runs a bounded urgent scan only when explicitly enabled', async () => {
    vi.stubEnv('SPARKLE_LAB_MANUAL_RUNS_ENABLED', 'true')

    const response = await POST(request({ runType: 'urgent' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(runSparkleLabManualScanMock).toHaveBeenCalledWith({
      supabase: { from: expect.any(Function) },
      runType: 'urgent',
    })
    expect(json).toMatchObject({
      runId: 'run-1',
      runType: 'urgent',
      findingCount: 1,
      findings: [
        {
          section: 'nic_nac_lab',
          severity: 'high',
          title: 'Hard fail',
          priorityRank: 1,
        },
      ],
    })
  })

  it('rejects unauthenticated users before checking the feature flag', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(request())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({ error: 'unauthenticated' })
    expect(runSparkleLabManualScanMock).not.toHaveBeenCalled()
  })

  it('rejects non-operators', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('not operator'),
    )

    const response = await POST(request())
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json).toEqual({ error: 'forbidden' })
    expect(runSparkleLabManualScanMock).not.toHaveBeenCalled()
  })
})
