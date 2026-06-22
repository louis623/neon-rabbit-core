import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const runSparkleLabWeeklyScanMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/sparkle-lab/runner', () => ({
  runSparkleLabWeeklyScan: (...args: unknown[]) =>
    runSparkleLabWeeklyScanMock(...args),
}))

import { GET } from '@/app/api/internal/sparkle-lab/weekly/route'

describe('GET /api/internal/sparkle-lab/weekly', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    runSparkleLabWeeklyScanMock.mockReset()
    delete process.env.CRON_SECRET
    delete process.env.SPARKLE_LAB_WEEKLY_RUNS_ENABLED
  })

  it('returns 503 when CRON_SECRET is missing', async () => {
    const response = await GET(
      new Request('http://localhost/api/internal/sparkle-lab/weekly'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'sparkle lab cron secret is not configured.',
    })
  })

  it('returns 401 when the bearer secret does not match', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request('http://localhost/api/internal/sparkle-lab/weekly', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthorized',
    })
  })

  it('no-ops safely while weekly runs are disabled', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request('http://localhost/api/internal/sparkle-lab/weekly', {
        headers: { authorization: 'Bearer secret-123' },
      }),
    )

    expect(runSparkleLabWeeklyScanMock).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      skipped: true,
      reason: 'sparkle_lab_weekly_runs_disabled',
    })
  })

  it('runs the weekly lab scan only after the feature flag is enabled', async () => {
    process.env.CRON_SECRET = 'secret-123'
    process.env.SPARKLE_LAB_WEEKLY_RUNS_ENABLED = 'true'
    createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
    runSparkleLabWeeklyScanMock.mockResolvedValueOnce({
      runId: 'run-1',
      runType: 'weekly',
      usage: {
        estimatedCostCents: 0,
        monthlyScheduledCostCents: 0,
        modelCallCount: 0,
        premiumCallCount: 0,
        runtimeSeconds: 0,
        candidateRecordCount: 2,
        deepItemCount: 1,
        headlineFindingCount: 1,
        activePriorityCount: 1,
      },
      limitsHit: [],
      findings: [{ title: 'Finding one' }],
      artifacts: [
        {
          section: 'ops_lab',
          artifactType: 'lab_note',
          title: 'Sparkle Lab deterministic run guardrails',
        },
      ],
    })

    const response = await GET(
      new Request('http://localhost/api/internal/sparkle-lab/weekly', {
        headers: { authorization: 'Bearer secret-123' },
      }),
    )

    expect(runSparkleLabWeeklyScanMock).toHaveBeenCalledWith({
      supabase: { marker: 'admin' },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run-1',
      runType: 'weekly',
      usage: {
        estimatedCostCents: 0,
        modelCallCount: 0,
      },
      limitsHit: [],
      findingCount: 1,
      artifactCount: 1,
      mutationMode: 'recommendations_only',
      modelSynthesisEnabled: false,
    })
  })
})
