import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()
const migration = readFileSync(
  join(
    repoRoot,
    'supabase/migrations/20260829154000_ss_rep_account_classification.sql',
  ),
  'utf8',
).toLowerCase()
const onboardingSkill = readFileSync(
  join(repoRoot, '.agents/skills/sparkle-suite-rep-welcome-site/SKILL.md'),
  'utf8',
).toLowerCase()

describe('durable rep account classification', () => {
  it('defaults future real onboarding to customer and constrains the stored values', () => {
    expect(migration).toContain('account_classification set default \'customer\'')
    expect(migration).toContain('account_classification set not null')
    expect(migration).toContain(
      "check (account_classification in ('customer', 'demo'))",
    )
  })

  it('backfills the established customers and Kim without using onboarding progress', () => {
    expect(migration).toContain("'milehighfizz', 'brittwithbling', 'blingkitchen'")
    expect(migration).toContain("lower(trim(display_name)) = 'kim goforth'")
    expect(migration).not.toContain('dashboard_unlocked')
    expect(migration).not.toContain('subscription')
  })

  it('makes the reusable onboarding skill verify customer placement', () => {
    expect(onboardingSkill).toContain('account_classification=customer')
    expect(onboardingSkill).toContain('account_classification=demo')
    expect(onboardingSkill).toContain('customer database')
    expect(onboardingSkill).toContain('demo database')
    expect(onboardingSkill).toContain(
      'never infer demo status from incomplete onboarding',
    )
  })

  it('keeps the operator launch ledger separate from rep self-setup', () => {
    expect(onboardingSkill).toContain('operator launch checklist')
    expect(onboardingSkill).toContain('rep-facing self-serve checklist')
    expect(onboardingSkill).toContain('done/not-done checkbox')
    expect(onboardingSkill).toContain('do not add statuses, proof notes')
    expect(onboardingSkill).toMatch(/identity-guarded rep\s+domain mapping/)
    expect(onboardingSkill).toMatch(/favicon\s+plus social-share card render/)
    expect(onboardingSkill).toContain('do not reuse the legacy `onboarding_status`')
  })
})
