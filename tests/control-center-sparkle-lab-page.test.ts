import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SparkleLabControlCenterModel } from '@/lib/sparkle-lab/read-model'

const getAuthenticatedOperatorMock = vi.fn()
const createAdminClientMock = vi.fn()
const readSparkleLabControlCenterModelMock = vi.fn()
const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`)
})

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('next/navigation', () => ({
  redirect: (target: string) => redirectMock(target),
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

vi.mock('@/lib/sparkle-lab/read-model', () => ({
  readSparkleLabControlCenterModel: (...args: unknown[]) =>
    readSparkleLabControlCenterModelMock(...args),
}))

import SparkleLabControlCenterPage from '@/app/control-center/lab/page'

const model: SparkleLabControlCenterModel = {
  sections: [
    {
      id: 'nic_nac_lab',
      label: 'Nic-Nac Lab',
      description: 'Replay failures and memory quality.',
      findingCount: 1,
      artifactCount: 1,
    },
    {
      id: 'sparkle_suite_lab',
      label: 'Sparkle Suite Lab',
      description: 'Rep business health and site health.',
      findingCount: 0,
      artifactCount: 0,
    },
    {
      id: 'sparkle_finder_lab',
      label: 'Sparkle Finder Lab',
      description: 'Collector behavior and lead flow.',
      findingCount: 0,
      artifactCount: 0,
    },
    {
      id: 'ops_lab',
      label: 'Ops Lab',
      description: 'Support trends and process gaps.',
      findingCount: 0,
      artifactCount: 0,
    },
    {
      id: 'research_desk',
      label: 'Research Desk',
      description: 'AI, social commerce, and live-selling research.',
      findingCount: 0,
      artifactCount: 0,
    },
  ],
  latestRuns: [
    {
      id: 'run-1',
      runType: 'weekly',
      status: 'completed',
      startedAt: '2026-06-21T06:00:00.000Z',
      completedAt: '2026-06-21T06:05:00.000Z',
      estimatedCostCents: 173,
      costCapCents: 500,
      modelCallCount: 7,
      modelCallCap: 20,
      premiumCallCount: 1,
      premiumCallCap: 4,
      candidateRecordCount: 80,
      candidateRecordCap: 250,
      deepItemCount: 6,
      deepItemCap: 25,
      headlineFindingCount: 1,
      headlineFindingCap: 3,
      activePriorityCount: 1,
      activePriorityCap: 2,
      limitsHit: [],
      createdAt: '2026-06-21T06:00:00.000Z',
    },
  ],
  headlineFindings: [
    {
      id: 'finding-1',
      runId: 'run-1',
      section: 'nic_nac_lab',
      severity: 'high',
      confidence: 'high',
      title: 'Duplicate item replay',
      summary: 'Duplicate item handling needs a replay case.',
      recommendedAction: 'Add the replay before model comparison.',
      impactScore: 9,
      effortScore: 2,
      priorityRank: 1,
      createdAt: '2026-06-21T06:03:00.000Z',
    },
  ],
  activePriorities: [],
  recentArtifacts: [
    {
      id: 'artifact-1',
      runId: 'run-1',
      section: 'nic_nac_lab',
      artifactType: 'replay_case',
      title: 'Duplicate item replay artifact',
      bodyMarkdown: 'Rep asks to add an item already on the board.',
      createdAt: '2026-06-21T06:05:00.000Z',
    },
  ],
  caps: {
    weekly: {
      runType: 'weekly',
      costCapCents: 500,
      monthlyScheduledCapCents: 2000,
      modelCallCap: 20,
      premiumCallCap: 4,
      runtimeCapSeconds: 1200,
      candidateRecordCap: 250,
      deepItemCap: 25,
      headlineFindingCap: 3,
      activePriorityCap: 2,
    },
    manual: {
      runType: 'manual',
      costCapCents: 200,
      modelCallCap: 8,
      premiumCallCap: 2,
      runtimeCapSeconds: 600,
      candidateRecordCap: 75,
      deepItemCap: 10,
      headlineFindingCap: 3,
      activePriorityCap: 2,
    },
    urgent: {
      runType: 'urgent',
      costCapCents: 300,
      modelCallCap: 10,
      premiumCallCap: 2,
      runtimeCapSeconds: 600,
      candidateRecordCap: 75,
      deepItemCap: 10,
      headlineFindingCap: 3,
      activePriorityCap: 2,
    },
  },
  accessIssue: null,
}

describe('SparkleLabControlCenterPage', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createAdminClientMock.mockReset()
    readSparkleLabControlCenterModelMock.mockReset()
    redirectMock.mockClear()
    getAuthenticatedOperatorMock.mockResolvedValue({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    readSparkleLabControlCenterModelMock.mockResolvedValue(model)
  })

  it('renders the operator Sparkle Lab page', async () => {
    const page = await SparkleLabControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(getAuthenticatedOperatorMock).toHaveBeenCalledOnce()
    expect(readSparkleLabControlCenterModelMock).toHaveBeenCalledWith({
      from: expect.any(Function),
    })
    expect(html).toContain('Sparkle Lab')
    expect(html).toContain('Nic-Nac Lab')
    expect(html).toContain('Sparkle Suite Lab')
    expect(html).toContain('Sparkle Finder Lab')
    expect(html).toContain('Ops Lab')
    expect(html).toContain('Research Desk')
    expect(html).toContain('Weekly cap')
    expect(html).toContain('$5.00')
    expect(html).toContain('Duplicate item replay')
    expect(html).toContain('Recent Artifacts')
  })

  it('redirects unauthenticated operators back to login', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    await expect(SparkleLabControlCenterPage()).rejects.toThrow(
      'redirect:/login?redirect=%2Fcontrol-center%2Flab',
    )

    expect(readSparkleLabControlCenterModelMock).not.toHaveBeenCalled()
  })

  it('renders an operator access required message for non-operators', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('not operator'),
    )

    const page = await SparkleLabControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Operator access required')
    expect(html).toContain('Sparkle Lab is limited to internal operators.')
    expect(readSparkleLabControlCenterModelMock).not.toHaveBeenCalled()
  })
})
