import { beforeEach, describe, expect, it, vi } from 'vitest'

const resetReviewerSmokeSessionMock = vi.fn()

vi.mock('@/lib/reviewer-smoke/session', () => ({
  resetReviewerSmokeSession: (...args: unknown[]) =>
    resetReviewerSmokeSessionMock(...args),
}))

import { POST } from '@/app/api/reviewer-smoke/session/route'

describe('POST /api/reviewer-smoke/session', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetReviewerSmokeSessionMock.mockReset()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_MODE', 'true')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_TOKEN', 'review-token-12345')
  })

  it('blocks reviewer setup when the token is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/reviewer-smoke/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'required_setup' }),
      }),
    )

    expect(response.status).toBe(403)
    expect(resetReviewerSmokeSessionMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      code: 'REVIEWER_SMOKE_DISABLED',
      error: 'Reviewer smoke mode is not available.',
    })
  })

  it('blocks reviewer setup in production even with a matching token', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', 'production')

    const response = await POST(
      new Request('http://localhost/api/reviewer-smoke/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: 'review-token-12345',
          state: 'required_setup',
        }),
      }),
    )

    expect(response.status).toBe(403)
    expect(resetReviewerSmokeSessionMock).not.toHaveBeenCalled()
  })

  it('resets the reusable reviewer session for a valid preview token', async () => {
    resetReviewerSmokeSessionMock.mockResolvedValue({
      ok: true,
      email: 'sparkle-reviewer+preview@neonrabbit.net',
      password: 'preview-only-password',
      state: 'required_setup',
      next: '/nic-nac?onboarding=required-setup',
    })

    const response = await POST(
      new Request('http://localhost/api/reviewer-smoke/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: 'review-token-12345',
          state: 'required_setup',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(resetReviewerSmokeSessionMock).toHaveBeenCalledWith('required_setup')
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        state: 'required_setup',
        next: '/nic-nac?onboarding=required-setup',
      }),
    )
  })
})
