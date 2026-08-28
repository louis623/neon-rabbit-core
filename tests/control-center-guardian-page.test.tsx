import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getControlCenterAccessMock = vi.fn()
const createAdminClientMock = vi.fn()
const getControlCenterOperatorHealthMock = vi.fn()
const getControlCenterNicNacUsageMock = vi.fn()
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
  getControlCenterAccess: (...args: unknown[]) =>
    getControlCenterAccessMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/remy-communications/operator-health', () => ({
  getControlCenterOperatorHealth: (...args: unknown[]) =>
    getControlCenterOperatorHealthMock(...args),
}))

vi.mock('@/lib/remy-communications/nic-nac-usage', () => ({
  getControlCenterNicNacUsage: (...args: unknown[]) =>
    getControlCenterNicNacUsageMock(...args),
}))

import ControlCenterGuardianPage from '@/app/control-center/guardian/page'

const endpoint = (url: string) => ({
  url,
  answered: true,
  healthy: true,
  statusCode: 200,
  fiveXx: false,
  checkedAt: '2026-08-28T12:00:00.000Z',
  responseTimeMs: 100,
})

describe('Control Center Guardian page', () => {
  beforeEach(() => {
    getControlCenterAccessMock.mockReset()
    createAdminClientMock.mockReset()
    getControlCenterOperatorHealthMock.mockReset()
    getControlCenterNicNacUsageMock.mockReset()
    redirectMock.mockClear()
    getControlCenterAccessMock.mockResolvedValue({
      method: 'control_center_session',
      operator: { email: 'operator@example.test', repId: 'operator-1' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    getControlCenterOperatorHealthMock.mockResolvedValue({
      status: 'clear',
      redFlagCount: 0,
      support: { createdLast24Hours: 1, urgentOpenCount: 0 },
      safety: { reportedNetworkSafetyCount: 0 },
      production: {
        suite: endpoint('https://www.yoursparklesuite.com'),
        finder: endpoint('https://yoursparklefinder.com'),
      },
      coverageHoles: ['Deployment history is unavailable.'],
      notice: 'Read-only health.',
    })
    getControlCenterNicNacUsageMock.mockResolvedValue({
      totals: {
        runCount: 2,
        knownEstimatedSpendCents: 3,
        runSpikeDetected: false,
        failedOrAbortedRunCount: 0,
        hardFailPhraseCount: 0,
        creditBalance: null,
      },
      bySurface: [
        {
          product: 'sparkle_suite',
          surface: 'rep_workspace',
          runCount: 2,
          previousRunCount: 1,
          knownEstimatedSpendCents: 3,
          unknownSpendRunCount: 0,
          runSpikeDetected: false,
        },
      ],
      byModel: [
        {
          provider: 'openai',
          model: 'gpt-5.4',
          runCount: 2,
          knownEstimatedSpendCents: 3,
        },
      ],
      sparkleLab: {
        mutationMode: 'recommendations_only',
        manualRunsEnabled: false,
        weeklyRunsEnabled: false,
        modelSynthesisEnabled: false,
      },
      coverageHoles: ['Finder usage is unavailable.'],
      notice: 'Read-only usage.',
    })
  })

  it('requires operator access and renders the same read-only watch', async () => {
    const page = await ControlCenterGuardianPage()
    const html = renderToStaticMarkup(page)

    expect(getControlCenterAccessMock).toHaveBeenCalledOnce()
    expect(getControlCenterOperatorHealthMock).toHaveBeenCalledOnce()
    expect(getControlCenterNicNacUsageMock).toHaveBeenCalledOnce()
    expect(html).toContain('Guardian')
    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Sparkle Finder')
    expect(html).toContain('Recommendations only')
    expect(html).toContain('Finder usage is unavailable.')
    const controlCenterSource = readFileSync(
      'app/control-center/_components/SupportCommandCenter.tsx',
      'utf8',
    )
    expect(controlCenterSource).toContain('href="/control-center/guardian"')
  })

  it('redirects unauthenticated visitors to Control Center login', async () => {
    getControlCenterAccessMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    await expect(ControlCenterGuardianPage()).rejects.toThrow(
      'redirect:/control-center/login',
    )
    expect(getControlCenterOperatorHealthMock).not.toHaveBeenCalled()
  })

  it('shows a bounded operator-only message for non-operators', async () => {
    getControlCenterAccessMock.mockRejectedValueOnce(
      new MockOperatorAuthError('forbidden'),
    )

    const page = await ControlCenterGuardianPage()
    const html = renderToStaticMarkup(page)
    expect(html).toContain('Operator access required')
    expect(html).toContain('Guardian is limited to internal operators.')
    expect(getControlCenterOperatorHealthMock).not.toHaveBeenCalled()
  })
})
