import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260818010000_ss_workspace_message_center.sql',
)
const migration = fs.readFileSync(migrationPath, 'utf8')

describe('workspace Message Center migration', () => {
  it('creates the normalized publication, delivery, audit, sender, and outbox tables', () => {
    for (const table of [
      'workspace_message_senders',
      'workspace_message_publications',
      'workspace_message_deliveries',
      'workspace_message_audit_events',
      'workspace_message_outbox',
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
      expect(migration).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
    }
    expect(migration).toContain(
      'UNIQUE (publication_id, rep_id)',
    )
    expect(migration).toContain('idempotency_key TEXT NOT NULL UNIQUE')
    expect(migration).toContain('idempotency_key TEXT UNIQUE')
  })

  it('gives reps receive-only content plus read/archive-only delivery updates', () => {
    expect(migration).toContain(') ON workspace_message_publications TO authenticated')
    expect(migration).toContain(
      'GRANT SELECT ON workspace_message_deliveries TO authenticated',
    )
    expect(migration).toContain(
      'GRANT UPDATE (read_at, archived_at) ON workspace_message_deliveries TO authenticated',
    )
    expect(migration).not.toMatch(
      /GRANT\s+(INSERT|ALL).*workspace_message_(publications|deliveries).*authenticated/i,
    )
    const publicationGrant = migration.slice(
      migration.indexOf('GRANT SELECT (\n  id,'),
      migration.indexOf(') ON workspace_message_publications TO authenticated') +
        ') ON workspace_message_publications TO authenticated'.length,
    )
    expect(publicationGrant).not.toContain('audience_snapshot')
    expect(publicationGrant).not.toContain('audience_rule')
    expect(publicationGrant).not.toContain('idempotency_key')
    expect(migration).toContain(
      'REVOKE ALL ON workspace_message_publications FROM anon, authenticated',
    )
    expect(migration).toContain(
      'REVOKE ALL ON workspace_message_audit_events FROM anon, authenticated',
    )
    expect(migration).toContain(
      'REVOKE ALL ON workspace_message_outbox FROM anon, authenticated',
    )
  })

  it('isolates delivery rows and publication reads through the authenticated rep identity', () => {
    expect(migration).toContain('workspace_message_deliveries_own_read')
    expect(migration).toContain('workspace_message_deliveries_own_state_update')
    expect(migration).toContain('workspace_message_publications_assigned_read')
    expect(migration.match(/rep\.auth_user_id = \(SELECT auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(4)
    expect(migration).not.toMatch(
      /CREATE POLICY[^;]+ON workspace_message_(senders|audit_events|outbox)[^;]+FOR (INSERT|UPDATE|ALL)/i,
    )
  })

  it('backfills only owner-to-rep legacy history and closes legacy rep writes', () => {
    expect(migration).toContain("WHERE legacy.direction = 'nr_to_rep'")
    expect(migration).not.toContain("WHERE legacy.direction = 'rep_to_nr'")
    expect(migration).toContain('DROP POLICY IF EXISTS "rep_messages_own_data"')
    expect(migration).toContain('CREATE POLICY "rep_messages_own_read"')
    expect(migration).toContain('REVOKE ALL ON rep_messages FROM anon, authenticated')
    expect(migration).toContain('GRANT SELECT ON rep_messages TO authenticated')
  })

  it('provides an idempotent, retryable, concurrency-safe service-role outbox', () => {
    expect(migration).toContain('claim_workspace_message_outbox')
    expect(migration).toContain('FOR UPDATE SKIP LOCKED')
    expect(migration).toContain("status IN ('pending', 'failed')")
    expect(migration).toContain("status = 'processing'")
    expect(migration).toContain("claimed_at < now() - INTERVAL '15 minutes'")
    expect(migration).toContain('attempt_count = outbox.attempt_count + 1')
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION claim_workspace_message_outbox(TEXT, INTEGER)',
    )
    expect(migration).toContain('TO service_role')
  })

  it('seeds narrowly scoped application-owned senders', () => {
    for (const senderKey of [
      'owner',
      'legacy_neon_rabbit',
      'customer_signup_notifier',
      'monthly_reporter',
      'resource_publisher',
    ]) {
      expect(migration).toContain(`'${senderKey}'`)
    }
  })
})
