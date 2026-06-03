import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getReviewerSmokePersona,
  isReviewerSmokeTokenValid,
  reviewerSmokeModeEnabled,
} from '@/lib/reviewer-smoke/config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('reviewer smoke config', () => {
  it('is disabled by default', () => {
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_MODE', '')

    expect(reviewerSmokeModeEnabled()).toBe(false)
    expect(isReviewerSmokeTokenValid('anything')).toBe(false)
  })

  it('requires a long matching token in local or preview environments', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_MODE', 'true')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_TOKEN', 'review-token-12345')

    expect(reviewerSmokeModeEnabled()).toBe(true)
    expect(isReviewerSmokeTokenValid('review-token-12345')).toBe(true)
    expect(isReviewerSmokeTokenValid('wrong-token')).toBe(false)
  })

  it('does not depend on NODE_ENV when the reviewer flag and token are explicit', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_MODE', 'true')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_TOKEN', 'review-token-12345')

    expect(reviewerSmokeModeEnabled()).toBe(true)
    expect(isReviewerSmokeTokenValid('review-token-12345')).toBe(true)
  })

  it('cannot be enabled in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_MODE', 'true')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_TOKEN', 'review-token-12345')

    expect(reviewerSmokeModeEnabled()).toBe(false)
    expect(isReviewerSmokeTokenValid('review-token-12345')).toBe(false)
  })

  it('uses safe synthetic reviewer persona defaults', () => {
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_EMAIL', '')
    vi.stubEnv('SPARKLE_REVIEWER_SMOKE_DISPLAY_NAME', '')

    expect(getReviewerSmokePersona()).toEqual(
      expect.objectContaining({
        displayName: 'Britt Test Rep',
        email: 'sparkle-reviewer+preview@neonrabbit.net',
      }),
    )
  })
})
