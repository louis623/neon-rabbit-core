import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Sparkle Lab schema migration', () => {
  const migration = () =>
    readFileSync(
      join(process.cwd(), 'supabase/migrations/20260621193000_sparkle_lab.sql'),
      'utf8',
    )

  it('creates bounded Lab run, finding, and artifact tables', () => {
    const sql = migration()

    expect(sql).toContain('create table if not exists public.sparkle_lab_runs')
    expect(sql).toContain('create table if not exists public.sparkle_lab_findings')
    expect(sql).toContain('create table if not exists public.sparkle_lab_artifacts')
  })

  it('stores the hard budget caps and actual usage counters on each run', () => {
    const sql = migration()

    for (const column of [
      'cost_cap_cents',
      'monthly_scheduled_cap_cents',
      'estimated_cost_cents',
      'model_call_cap',
      'model_call_count',
      'premium_call_cap',
      'premium_call_count',
      'runtime_cap_seconds',
      'candidate_record_cap',
      'candidate_record_count',
      'deep_item_cap',
      'deep_item_count',
      'headline_finding_cap',
      'headline_finding_count',
      'active_priority_cap',
      'active_priority_count',
      'limits_hit',
    ]) {
      expect(sql).toContain(column)
    }
  })

  it('keeps Lab sections explicit and service-role protected', () => {
    const sql = migration()

    for (const section of [
      'nic_nac_lab',
      'sparkle_suite_lab',
      'sparkle_finder_lab',
      'ops_lab',
      'research_desk',
    ]) {
      expect(sql).toContain(section)
    }

    expect(sql).toContain('alter table public.sparkle_lab_runs enable row level security')
    expect(sql).toContain('alter table public.sparkle_lab_findings enable row level security')
    expect(sql).toContain('alter table public.sparkle_lab_artifacts enable row level security')
    expect(sql).toContain("auth.role() = 'service_role'")
  })
})
