import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260829120000_ss_operator_support_access.sql',
  'utf8',
)
const fullWorkspaceCapabilitiesMigration = readFileSync(
  'supabase/migrations/20260829122500_ss_operator_support_full_workspace_capabilities.sql',
  'utf8',
)
const nicNacProvenanceMigration = readFileSync(
  'supabase/migrations/20260829123000_ss_operator_support_nic_nac_provenance.sql',
  'utf8',
)
const operatorControlledMigration = readFileSync(
  'supabase/migrations/20260901120000_ss_operator_support_operator_controlled.sql',
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

  it('allows ordinary Workspace capabilities without adding billing or account-security authority', () => {
    for (const capability of [
      'workspace.manage',
      'customers.manage',
      'messages.manage',
      'communications.manage',
      'nic_nac.use',
      'live_queue.view',
    ]) {
      expect(fullWorkspaceCapabilitiesMigration).toContain(`'${capability}'`)
    }
    expect(fullWorkspaceCapabilitiesMigration).not.toMatch(
      /'(?:billing|payments?|authentication|account_security|account_ownership)\.(?:view|manage)'/,
    )
  })

  it('records support Nic-Nac actor provenance and keeps it out of ordinary rep RLS paths', () => {
    expect(nicNacProvenanceMigration).toContain('support_session_id uuid')
    expect(nicNacProvenanceMigration).toContain('source_actor_rep_id uuid')
    expect(nicNacProvenanceMigration).toContain('guard_operator_support_nic_nac_provenance')
    expect(nicNacProvenanceMigration).toContain('new.conversation_id <> v_session.id')
    expect(nicNacProvenanceMigration).toContain('new.rep_id <> v_session.target_rep_id')
    expect(nicNacProvenanceMigration).toContain('new.source_actor_rep_id <> v_session.operator_rep_id')
    expect(nicNacProvenanceMigration).toMatch(
      /create policy nic_nac_conv_own_data[\s\S]*support_session_id is null/,
    )
    expect(nicNacProvenanceMigration).toMatch(
      /create policy approval_events_own_data[\s\S]*support_session_id is null/,
    )
  })

  it('supersedes the original timer with explicit operator closeout', () => {
    expect(operatorControlledMigration).toContain(
      'drop constraint if exists operator_support_sessions_expiry_check',
    )
    expect(operatorControlledMigration).toContain('alter column expires_at drop not null')
    expect(operatorControlledMigration).not.toMatch(
      /update public\.operator_support_sessions[\s\S]*set expires_at/,
    )
    expect(operatorControlledMigration).toMatch(
      /function public\.expire_operator_support_sessions\(\)[\s\S]*return 0;/,
    )
    expect(operatorControlledMigration).toContain(
      "p_event_type = 'mutation_attempted' and v_session.status <> 'active'",
    )
    expect(operatorControlledMigration).not.toContain(
      "p_event_type = 'mutation_attempted'\n    and (v_session.status <> 'active' or v_session.expires_at <= now())",
    )
  })
})
