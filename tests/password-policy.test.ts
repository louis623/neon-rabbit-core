import { describe, expect, it } from 'vitest'
import {
  getNewPasswordValidationError,
  PASSWORD_REQUIREMENTS,
} from '@/lib/auth/password-policy'

describe('Sparkle Suite password policy', () => {
  it('accepts a matching strong password', () => {
    expect(
      getNewPasswordValidationError(
        'SparkleSuite2026!',
        'SparkleSuite2026!',
      ),
    ).toBeNull()
  })

  it('requires the new password to be entered twice accurately', () => {
    expect(
      getNewPasswordValidationError(
        'SparkleSuite2026!',
        'SparkleSuite2026?',
      ),
    ).toBe('Enter the same new password twice.')
  })

  it.each([
    ['too short', 'Suite2!a'],
    ['an uppercase letter', 'sparklesuite2026!'],
    ['a lowercase letter', 'SPARKLESUITE2026!'],
    ['a number', 'SparkleSuitePass!'],
    ['a symbol', 'SparkleSuite2026'],
  ])('rejects a password missing %s', (_case, password) => {
    expect(getNewPasswordValidationError(password, password)).toBe(
      PASSWORD_REQUIREMENTS,
    )
  })
})
