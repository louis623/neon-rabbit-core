import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('reviewer smoke UI wiring', () => {
  const startForm = readFileSync(
    resolve(process.cwd(), 'app/start/StartSparkleSuiteForm.tsx'),
    'utf8',
  )
  const nicNacClient = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/_client.tsx'),
    'utf8',
  )
  const requiredSetupHome = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.tsx'),
    'utf8',
  )
  const standard = readFileSync(
    resolve(process.cwd(), 'docs/sparkle-suite/testing/reviewer-smoke-standard.md'),
    'utf8',
  )

  it('adds reviewer controls to the start page without replacing normal signup', () => {
    expect(startForm).toContain('/api/reviewer-smoke/session')
    expect(startForm).toContain('reviewerSmokeVisible')
    expect(startForm).toContain('Start smoke checkout')
    expect(startForm).toContain('Open setup preview')
    expect(startForm).toContain("startReviewerSmoke('required_setup')")
    expect(startForm).not.toContain("startReviewerSmoke('dashboard_unlocked')")
    expect(startForm).not.toContain('Review checkout recovery')
    expect(startForm).not.toContain('{reviewToken ? (')
    expect(startForm).toContain('/api/self-serve/signup')
  })

  it('opens checkout automatically instead of rendering a duplicate checkout page', () => {
    expect(nicNacClient).toContain('/api/stripe/create-checkout')
    expect(nicNacClient).toContain('void handleStartCheckout()')
    expect(nicNacClient).not.toContain('/api/reviewer-smoke/checkout')
    expect(nicNacClient).not.toContain('void handleSimulateReviewerCheckout()')
    expect(nicNacClient).not.toContain('CheckoutRequiredHome')
    expect(requiredSetupHome).not.toContain('Simulate paid checkout')
    expect(requiredSetupHome).not.toContain('Secure checkout')
  })

  it('captures reviewer smoke path as a standard process', () => {
    expect(standard).toContain('not ready for Louis review')
    expect(standard).toContain('tests proving review mode is disabled in production')
    expect(standard).toContain('no live charges')
  })
})
