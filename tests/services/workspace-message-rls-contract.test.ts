import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260818010000_ss_workspace_message_center.sql',
  ),
  'utf8',
)

function policy(name: string) {
  const start = sql.indexOf(`CREATE POLICY "${name}"`)
  expect(start, `missing policy ${name}`).toBeGreaterThanOrEqual(0)
  const end = sql.indexOf(';', start)
  return sql.slice(start, end + 1)
}

describe('Message Center RLS contract', () => {
  it('publication visibility requires a delivery assigned to auth.uid rep', () => {
    const publicationRead = policy('workspace_message_publications_assigned_read')
    expect(publicationRead).toContain("status = 'published'")
    expect(publicationRead).toContain(
      'delivery.publication_id = workspace_message_publications.id',
    )
    expect(publicationRead).toContain('rep.auth_user_id = (SELECT auth.uid())')
  })

  it('delivery reads and state updates resolve rep ownership from auth.uid', () => {
    for (const name of [
      'workspace_message_deliveries_own_read',
      'workspace_message_deliveries_own_state_update',
    ]) {
      const contract = policy(name)
      expect(contract).toContain('rep.auth_user_id = (SELECT auth.uid())')
      expect(contract).toContain('rep_id = (')
    }
    expect(policy('workspace_message_deliveries_own_state_update')).toContain(
      'WITH CHECK',
    )
  })

  it('column grants make rep_id, publication_id, click state, and delivery timestamps immutable to reps', () => {
    const grants = sql
      .split('\n')
      .filter((line) => line.trim().startsWith('GRANT '))
      .join('\n')
    expect(grants).toContain(
      'GRANT UPDATE (read_at, archived_at) ON workspace_message_deliveries TO authenticated',
    )
    expect(grants).not.toMatch(/GRANT UPDATE \([^)]*rep_id/i)
    expect(grants).not.toMatch(/GRANT UPDATE \([^)]*publication_id/i)
    expect(grants).not.toMatch(/GRANT UPDATE \([^)]*delivered_at/i)
    expect(grants).not.toMatch(/GRANT UPDATE \([^)]*first_action_clicked_at/i)
  })

  it('does not expose frozen audience, source, or idempotency metadata to recipient clients', () => {
    const start = sql.indexOf('GRANT SELECT (\n  id,')
    const end = sql.indexOf(
      ') ON workspace_message_publications TO authenticated',
      start,
    )
    const grant = sql.slice(start, end)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    expect(grant).toContain('sender_display_name')
    expect(grant).toContain('body')
    expect(grant).not.toContain('audience_rule')
    expect(grant).not.toContain('audience_snapshot')
    expect(grant).not.toContain('audience_count')
    expect(grant).not.toContain('source_id')
    expect(grant).not.toContain('idempotency_key')
  })

  it('defines no rep write policy for publication, sender, audit, or outbox tables', () => {
    const policyStatements = [...sql.matchAll(/CREATE POLICY[\s\S]*?;/g)].map(
      (match) => match[0],
    )
    for (const statement of policyStatements) {
      if (
        /ON workspace_message_(publications|senders|audit_events|outbox)/.test(
          statement,
        )
      ) {
        expect(statement).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/)
      }
    }
  })
})
