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
  const checkoutHome = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.tsx'),
    'utf8',
  )
  const standard = readFileSync(
    resolve(process.cwd(), 'docs/sparkle-suite/testing/reviewer-smoke-standard.md'),
    'utf8',
  )

  it('adds reviewer controls to the start page without replacing normal signup', () => {
    expect(startForm).toContain('/api/reviewer-smoke/session')
    expect(startForm).toContain('Start fresh review run')
    expect(startForm).toContain('Skip to Nic-Nac setup')
    expect(startForm).toContain('Open dashboard preview')
    expect(startForm).toContain('/api/self-serve/signup')
  })

  it('adds a clearly labeled simulated checkout path only for reviewer mode', () => {
    expect(nicNacClient).toContain('/api/reviewer-smoke/checkout')
    expect(nicNacClient).toContain("searchParams.get('review')")
    expect(checkoutHome).toContain('Reviewer smoke mode - test data only')
    expect(checkoutHome).toContain('Simulate paid checkout')
  })

  it('captures reviewer smoke path as a standard process', () => {
    expect(standard).toContain('not ready for Louis review')
    expect(standard).toContain('tests proving review mode is disabled in production')
    expect(standard).toContain('no live charges')
  })
})
