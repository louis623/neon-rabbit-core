import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260825019000_ss_finder_studio_intake_v2.sql',
)

describe('Sparkle Finder Studio intake v2 migration', () => {
  it('creates an isolated service-only ledger and atomic claim/complete RPCs', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase()

    expect(sql).toContain('create table if not exists public.finder_studio_intake_v2')
    expect(sql).toContain('primary key (finder_submission_id)')
    expect(sql).toContain('create or replace function public.rpc_claim_finder_studio_intake_v2')
    expect(sql).toContain('create or replace function public.rpc_complete_finder_studio_intake_v2')
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(sql).toContain('revoke all on table public.finder_studio_intake_v2')
    expect(sql).toContain('from public, anon, authenticated')
    expect(sql).toContain('grant select, insert, update on table public.finder_studio_intake_v2 to service_role')
    expect(sql).toContain('create or replace function public.rpc_finalize_finder_studio_review_v2')
    expect(sql).toContain('grant execute on function public.rpc_finalize_finder_studio_review_v2')
    expect(sql).toContain("from public, anon, authenticated")
  })

  it('validates typed completion matrices without nullable SQL comparisons', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase()

    expect(sql).toContain("p_result -> 'schemaversion' is distinct from '2'::jsonb")
    expect(sql).toContain("jsonb_typeof(p_result -> 'ok') is distinct from 'boolean'")
    expect(sql).toContain('invalid successful finder studio status for action')
    expect(sql).toContain('invalid failed finder studio status')
    expect(sql).toContain('variant confirmation requires matching candidate metadata')
    expect(sql).toContain('variant confirmation candidate ids do not match the stored offer')
    expect(sql).not.toContain("p_result ->> 'schemaversion' <> '2'")
    expect(sql).not.toContain("p_result ->> 'ok' not in")
  })

  it('makes queued review finalization monotonic, exact-design-bound, and resumable', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase()

    expect(sql).toContain("v_ledger.resolve_result ->> 'status' is distinct from 'publish_queued'")
    expect(sql).toContain('upper(trim(design.item_number)) = v_item_number')
    expect(sql).toContain("'status', 'accepted'")
    expect(sql).toContain("stage = 'review_completed'")
    expect(sql).toContain("'canonicalphotocontrol',")
    expect(sql).toContain('reviewed_by_email')
    expect(sql).toContain('reviewed_by_rep_id')
    expect(sql).toContain('reviewed_at')
    expect(sql).toContain('review_note')
    expect(sql).not.toContain("'status', 'published'")
    expect(sql).toContain("'decision', 'replay'")
    expect(sql).toContain("'decision', 'conflict'")
    expect(sql).toContain("'decision', 'invalid_selection'")
    expect(sql).toContain('if v_ledger.review_result is not null then')
    expect(sql.indexOf('if v_ledger.review_result is not null then')).toBeLessThan(
      sql.indexOf('if v_ledger.resolve_result is not null then'),
    )
    expect(sql).toContain('lower(trim(reviewer.email)) = lower(trim(p_reviewed_by_email))')
    expect(sql).toContain('length(trim(p_review_note)) > 2000')
    expect(sql).toContain('idx_finder_studio_intake_v2_pending_review')
    expect(sql).toMatch(
      /rpc_finalize_finder_studio_review_v2\(\s*uuid, uuid, text, uuid, text\s*\) to service_role/,
    )
  })

  it('labels persisted Finder asset metadata as untrusted manual-review evidence', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase()

    expect(sql).toContain('untrusted manual-review evidence')
    expect(sql).toContain('temporary urls are never stored here')
  })

  it('does not alter existing catalog, Dance Floor, or listing idempotency tables', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase()

    expect(sql).not.toMatch(/alter\s+table\s+(public\.)?jewelry_designs/)
    expect(sql).not.toMatch(/alter\s+table\s+(public\.)?trade_listings/)
    expect(sql).not.toContain('trade_listing_add_mutations')
    expect(sql).not.toMatch(/references\s+public\.jewelry_designs/)
    expect(sql).not.toContain('create trigger')
  })
})
