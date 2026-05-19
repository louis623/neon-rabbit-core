import { describe, expect, it } from 'vitest'

import {
  generateSparkleSuiteReferralCode,
  normalizeSparkleSuiteReferralCode,
} from '@/lib/services/sparkle-suite-referrals'

describe('Sparkle Suite referral codes', () => {
  it('generates public-safe referral codes separate from live queue sync codes', () => {
    const code = generateSparkleSuiteReferralCode(() => 0)

    expect(code).toBe('SS-AAAAAA')
    expect(code).toMatch(/^SS-[A-HJ-NP-Z2-9]{6}$/)
    expect(code).not.toMatch(/^\d{6}$/)
  })

  it('normalizes lowercase and spaced referral codes into the stored format', () => {
    expect(normalizeSparkleSuiteReferralCode(' ss-k7m4q9 ')).toBe('SS-K7M4Q9')
  })

  it('rejects malformed or confusing referral code input', () => {
    expect(normalizeSparkleSuiteReferralCode('123456')).toBeNull()
    expect(normalizeSparkleSuiteReferralCode('SS-O0I1Q9')).toBeNull()
    expect(normalizeSparkleSuiteReferralCode('SS-ABC')).toBeNull()
  })
})
