import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260827100000_ss_remy_communications_agent_audit.sql',
  'utf8',
)
const replyApprovalService = readFileSync(
  'lib/remy-communications/reply-approvals.ts',
  'utf8',
)

describe('Remy Communications schema contract', () => {
  it('keeps raw request data out of the audit log and gates sends with one-time approvals', () => {
    expect(migration).toContain('remy_communications_agent_audit_events')
    expect(migration).toContain('request_digest')
    expect(migration).not.toContain('request_body')
    expect(migration).toContain('remy_communications_reply_approvals')
    expect(migration).toContain("'requested', 'approved', 'declined', 'executing', 'executed', 'expired'")
    expect(migration).toContain("now() + interval '15 minutes'")
    expect(replyApprovalService).toContain('clientRequestId: `remy-approved:${approval.id}`')
    expect(replyApprovalService).not.toContain('randomUUID')
  })
})
