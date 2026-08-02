import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Sparkle Suite start route source boundary', () => {
  const page = readFileSync('app/start/page.tsx', 'utf8')
  const form = readFileSync('app/start/StartSparkleSuiteForm.tsx', 'utf8')

  it('sends ordinary visitors to the waitlist', () => {
    expect(page).toContain("redirect('/prelaunch#waitlist')")
    expect(page).toContain('reviewerSmokeControlsVisible')
  })

  it('keeps only token-gated reviewer actions on the former signup route', () => {
    expect(form).toContain('Reviewer smoke mode')
    expect(form).toContain('/api/reviewer-smoke/session')
    expect(form).not.toContain('/api/self-serve/signup')
    expect(form).not.toContain('/api/stripe/create-checkout')
    expect(form).not.toContain('Continue with Google')
    expect(form).not.toContain('Create account with a different email')
  })
})
