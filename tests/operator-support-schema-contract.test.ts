import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260829120000_ss_operator_support_access.sql',
  'utf8',
)

describe('operator support access schema contract', () => {
  it('creates frozen actor/subject sessions with concurrency and expiry guards', () => {
    expect(migration).toContain('create table if not exists public.operator_support_sessions')
    expect(migration).toContain('check (operator_rep_id <> target_rep_id)')
    expect(migration).toContain("where status in ('pending_notice', 'active')")
    expect(migration).toContain('operator_support_sessions_one_open_per_operator_idx')
    expect(migration).toContain('operator_support_sessions_one_open_per_target_idx')
    expect(migration).toContain("expires_at <= created_at + interval '1 hour'")
    expect(migration).toContain('csrf_token_hash')
    expect(migration).not.toMatch(/\bcsrf_token\s+text\b/i)
  })

  it('keeps the audit append-only and inaccessible to rep-facing database roles', () => {
    expect(migration).toContain('create table if not exists public.operator_support_audit_events')
    expect(migration).toContain('operator_support_audit_events_immutable')
    expect(migration).toContain('before update or delete on public.operator_support_audit_events')
    expect(migration).toContain('operator support audit events are append-only')
    expect(migration).toContain('revoke all on table public.operator_support_sessions from anon, authenticated')
    expect(migration).toContain('revoke all on table public.operator_support_audit_events from anon, authenticated')
    expect(migration).toContain('revoke insert, update, delete on table public.operator_support_sessions from service_role')
    expect(migration).toContain('revoke insert, update, delete on table public.operator_support_audit_events from service_role')
    expect(migration).toContain('alter table public.operator_support_audit_events force row level security')
  })

  it('exposes narrow service-role transitions instead of a generic update RPC', () => {
    for (const rpc of [
      'request_operator_support_session',
      'activate_operator_support_session',
      'extend_operator_support_session',
      'end_operator_support_session',
      'expire_operator_support_sessions',
      'append_operator_support_audit_event',
    ]) {
      expect(migration).toContain(`function public.${rpc}`)
    }
    expect(migration).not.toContain('update_operator_support_session')
    expect(migration).toContain('operator_support_publication_targets_rep')
    expect(migration).toContain("publication.audience_count = 1")
  })

  it('adds transparent selected-recipient account activity notices', () => {
    expect(migration).toContain("'account_activity'")
    expect(migration).toContain("'support_access_notifier'")
    expect(migration).toContain("'Sparkle Suite Support'")
    expect(migration).toContain("'{\"categories\":[\"account_activity\"],\"audiences\":[\"selected\"]}'::jsonb")
  })
})
