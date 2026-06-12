import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260612172908_support_command_center_auditor.sql',
  ),
  'utf8',
)

describe('support command center migration', () => {
  it('creates client account profiles, audits, lessons, and audit fields', () => {
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS public.client_account_profiles',
    )
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.support_audits')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.support_lessons')
    expect(sql).toContain('ALTER TABLE public.support_reports')
    expect(sql).toContain('client_account_profile_id')
    expect(sql).toContain('client_snapshot')
    expect(sql).toContain('audit_status')
    expect(sql).toContain(
      "CHECK (audit_status IN ('pending', 'running', 'completed', 'failed', 'timed_out'))",
    )
  })

  it('enables RLS and service-role policies for support-owned tables', () => {
    expect(sql).toContain(
      'ALTER TABLE public.client_account_profiles ENABLE ROW LEVEL SECURITY',
    )
    expect(sql).toContain(
      'ALTER TABLE public.support_audits ENABLE ROW LEVEL SECURITY',
    )
    expect(sql).toContain(
      'ALTER TABLE public.support_lessons ENABLE ROW LEVEL SECURITY',
    )
    expect(sql).toContain('client_account_profiles_admin_full_access')
    expect(sql).toContain('support_audits_admin_full_access')
    expect(sql).toContain('support_lessons_admin_full_access')
  })

  it('adds indexes for support dashboard and lesson lookup', () => {
    expect(sql).toContain('idx_client_account_profiles_rep')
    expect(sql).toContain('idx_support_reports_audit_status_created')
    expect(sql).toContain('idx_support_audits_report_created')
    expect(sql).toContain('idx_support_lessons_approved_area')
  })
})
