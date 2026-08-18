import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260818110000_ss_workspace_resources_and_monthly_reports.sql',
  ),
  'utf8',
)

describe('workspace resources and monthly report migration', () => {
  it('creates versioned resources and immutable monthly snapshots', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.workspace_resources')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.workspace_resource_revisions')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.workspace_monthly_report_snapshots')
    expect(sql).toContain('UNIQUE (resource_id, version)')
    expect(sql).toContain('UNIQUE (rep_id, report_month)')
    expect(sql).toContain("resource_type IN ('help', 'faq', 'blog', 'video')")
  })

  it('gives reps published-resource and own-report reads without rep writes', () => {
    expect(sql).toContain('workspace_resources_reps_read_published')
    expect(sql).toContain("USING (status = 'published')")
    expect(sql).toContain('workspace_monthly_reports_own_select')
    expect(sql).not.toContain('workspace_resources_reps_insert')
    expect(sql).not.toContain('workspace_monthly_reports_own_insert')
    expect(sql).not.toContain('GRANT INSERT ON public.workspace_resources TO authenticated')
  })

  it('keeps failed announcements retryable', () => {
    expect(sql).toContain("announcement_status IN ('pending', 'published', 'failed', 'not_required')")
    expect(sql).toContain('idx_workspace_resource_revisions_pending')
    expect(sql).toContain("WHERE announcement_status IN ('pending', 'failed')")
    expect(sql).toContain('enqueue_workspace_resource_message_event')
    expect(sql).toContain("'workspace_resource_published'")
    expect(sql).toContain('trg_workspace_resource_message_event')
  })

  it('atomically enqueues only public customer-site signups', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS record_source')
    expect(sql).toContain("record_source = 'customer_site_signup'")
    expect(sql).toContain("'customer_signup_created'")
    expect(sql).toContain("'customer-signup:' || NEW.id::TEXT")
    expect(sql).toContain('trg_customer_signup_message_event')
  })
})
