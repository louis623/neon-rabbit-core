import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/20260612100000_support_reports.sql',
)

function readMigration() {
  return readFileSync(migrationPath, 'utf8')
}

describe('support reports migration', () => {
  it('creates a durable support_reports table for dashboard intake', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.support_reports')
    expect(sql).toContain('source TEXT NOT NULL')
    expect(sql).toContain('report_type TEXT NOT NULL')
    expect(sql).toContain("urgency TEXT NOT NULL DEFAULT 'normal'")
    expect(sql).toContain('urgency_rank INTEGER GENERATED ALWAYS AS')
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'open'")
    expect(sql).toContain('page_or_workflow TEXT')
    expect(sql).toContain('title TEXT NOT NULL')
    expect(sql).toContain('details TEXT NOT NULL')
    expect(sql).toContain('expected_result TEXT')
    expect(sql).toContain('actual_result TEXT')
    expect(sql).toContain("notification_channel TEXT NOT NULL DEFAULT 'google_chat'")
    expect(sql).toContain("notification_status TEXT NOT NULL DEFAULT 'pending'")
    expect(sql).toContain('notification_error TEXT')
  })

  it('adds constraints for known report states and intake sources', () => {
    const sql = readMigration()

    expect(sql).toContain("source IN ('help_form', 'nic_nac')")
    expect(sql).toContain(
      "report_type IN ('site_issue', 'bug', 'suggested_upgrade', 'workflow_idea')",
    )
    expect(sql).toContain("urgency IN ('normal', 'blocking', 'showtime_urgent')")
    expect(sql).toContain("status IN ('open', 'reviewing', 'planned', 'resolved', 'closed')")
    expect(sql).toContain(
      "notification_status IN ('pending', 'delivered', 'not_configured', 'failed')",
    )
  })

  it('scopes reports with RLS and forces writes through server routes', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('support_reports_own_select')
    expect(sql).not.toContain('support_reports_own_insert')
    expect(sql).toContain('support_reports_admin_full_access')
    expect(sql).toContain('auth.uid() = rep.auth_user_id')
  })

  it('indexes the future operator dashboard queue', () => {
    const sql = readMigration()

    expect(sql).toContain('idx_support_reports_rep_created')
    expect(sql).toContain('idx_support_reports_status_urgency_rank_created')
    expect(sql).toContain("NOTIFY pgrst, 'reload schema'")
  })
})
