import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'

import {
  appendOperatorSupportAuditEvent,
  runAuditedOperatorSupportMutation,
} from '@/lib/operator-support/audit'
import {
  OperatorSupportError,
  hashOperatorSupportCsrfToken,
  requestOperatorSupportSession,
  verifyOperatorSupportSessionAccess,
} from '@/lib/operator-support/session-service'

const future = new Date(Date.now() + 15 * 60_000).toISOString()
const now = new Date().toISOString()

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    operator_rep_id: '22222222-2222-4222-8222-222222222222',
    operator_email_snapshot: 'louis@example.test',
    operator_display_name_snapshot: 'Louis',
    target_rep_id: '33333333-3333-4333-8333-333333333333',
    target_name_snapshot: 'Kim',
    target_business_snapshot: 'Kim Sparkles',
    reason_code: 'account_setup',
    reason_note: 'Help with setup',
    support_report_id: null,
    status: 'active',
    capabilities: ['workspace.view', 'site.manage'],
    request_id: 'request-1',
    started_at: now,
    last_activity_at: now,
    expires_at: future,
    extended_at: null,
    ended_at: null,
    ended_reason: null,
    completion_summary: null,
    start_publication_id: '44444444-4444-4444-8444-444444444444',
    end_publication_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

function auditRow(eventType: string, result: string) {
  return {
    id: crypto.randomUUID(),
    support_session_id: '11111111-1111-4111-8111-111111111111',
    operator_rep_id: '22222222-2222-4222-8222-222222222222',
    target_rep_id: '33333333-3333-4333-8333-333333333333',
    event_type: eventType,
    workspace_area: 'site',
    capability: 'site.manage',
    resource_type: 'site_settings',
    resource_id: null,
    action_name: 'update_banner',
    result,
    safe_diff: {},
    error_code: null,
    idempotency_key: 'idem-1',
    request_id: 'request-1',
    created_at: now,
  }
}

function queryClient(results: Array<{ data: unknown; error: unknown }>) {
  const maybeSingle = vi.fn()
  for (const result of results) maybeSingle.mockResolvedValueOnce(result)
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'order', 'limit', 'in']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = maybeSingle
  return { from: vi.fn(() => chain), chain } as unknown as SupabaseClient
}

describe('operator support session service', () => {
  it('reports concurrent open-session conflicts without leaking database details', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'index detail' } })
    await expect(requestOperatorSupportSession({ rpc } as unknown as SupabaseClient, {
      operatorRepId: '22222222-2222-4222-8222-222222222222',
      operatorEmail: 'louis@example.test',
      operatorDisplayName: 'Louis',
      targetRepId: '33333333-3333-4333-8333-333333333333',
      targetName: 'Kim',
      targetBusinessName: 'Kim Sparkles',
      reasonCode: 'account_setup',
      capabilities: ['workspace.view'],
      requestId: 'request-conflict',
      csrfToken: 'known-csrf',
    })).rejects.toMatchObject({
      code: 'SUPPORT_SESSION_CONFLICT',
      status: 409,
      message: 'An operator or target already has an open support session.',
    })
  })

  it('requests a pending session with hashed CSRF and frozen snapshots', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: sessionRow({ status: 'pending_notice', started_at: null, start_publication_id: null }),
      error: null,
    })
    const result = await requestOperatorSupportSession({ rpc } as unknown as SupabaseClient, {
      operatorRepId: '22222222-2222-4222-8222-222222222222',
      operatorEmail: 'Louis@Example.test ',
      operatorDisplayName: ' Louis ',
      targetRepId: '33333333-3333-4333-8333-333333333333',
      targetName: ' Kim ',
      targetBusinessName: ' Kim Sparkles ',
      reasonCode: 'account_setup',
      reasonNote: ' Help with setup ',
      capabilities: ['workspace.view', 'site.manage'],
      requestId: 'request-1',
      sessionId: '11111111-1111-4111-8111-111111111111',
      csrfToken: 'known-csrf',
    })
    expect(result.csrfToken).toBe('known-csrf')
    expect(result.session.targetRepId).toBe('33333333-3333-4333-8333-333333333333')
    expect(rpc).toHaveBeenCalledWith('request_operator_support_session', expect.objectContaining({
      p_operator_email_snapshot: 'louis@example.test',
      p_operator_display_name_snapshot: 'Louis',
      p_target_name_snapshot: 'Kim',
      p_reason_note: 'Help with setup',
      p_csrf_token_hash: hashOperatorSupportCsrfToken('known-csrf'),
    }))
  })

  it('freezes operator, target, capability, status, expiry, and CSRF on access verification', async () => {
    const token = 'known-csrf'
    const client = queryClient([
      { data: sessionRow(), error: null },
      { data: { csrf_token_hash: hashOperatorSupportCsrfToken(token) }, error: null },
    ])
    const verified = await verifyOperatorSupportSessionAccess(client, {
      sessionId: '11111111-1111-4111-8111-111111111111',
      operatorRepId: '22222222-2222-4222-8222-222222222222',
      targetRepId: '33333333-3333-4333-8333-333333333333',
      capability: 'site.manage',
      mutation: true,
      csrfToken: token,
    })
    expect(verified.actor).toMatchObject({
      mode: 'operator_support',
      operatorDisplayName: 'Louis',
      subjectRepId: '33333333-3333-4333-8333-333333333333',
    })
  })

  it('denies cross-target and unavailable-capability access', async () => {
    await expect(verifyOperatorSupportSessionAccess(
      queryClient([{ data: sessionRow(), error: null }]),
      {
        sessionId: '11111111-1111-4111-8111-111111111111',
        operatorRepId: '22222222-2222-4222-8222-222222222222',
        targetRepId: '99999999-9999-4999-8999-999999999999',
      },
    )).rejects.toMatchObject({ code: 'SUPPORT_TARGET_MISMATCH' } satisfies Partial<OperatorSupportError>)

    await expect(verifyOperatorSupportSessionAccess(
      queryClient([{ data: sessionRow(), error: null }]),
      {
        sessionId: '11111111-1111-4111-8111-111111111111',
        operatorRepId: '22222222-2222-4222-8222-222222222222',
        capability: 'billing.manage' as never,
      },
    )).rejects.toMatchObject({ code: 'SUPPORT_CAPABILITY_DENIED' } satisfies Partial<OperatorSupportError>)
  })
})

describe('operator support audit service', () => {
  it('redacts audit diffs before calling the append-only RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: auditRow('mutation_succeeded', 'succeeded'), error: null })
    await appendOperatorSupportAuditEvent({ rpc } as unknown as SupabaseClient, {
      supportSessionId: '11111111-1111-4111-8111-111111111111',
      operatorRepId: '22222222-2222-4222-8222-222222222222',
      targetRepId: '33333333-3333-4333-8333-333333333333',
      eventType: 'mutation_succeeded',
      workspaceArea: 'site',
      capability: 'site.manage',
      result: 'succeeded',
      safeDiff: { before: { password: 'never-store' } },
    })
    expect(rpc).toHaveBeenCalledWith('append_operator_support_audit_event', expect.objectContaining({
      p_safe_diff: { before: { password: '[redacted]' } },
    }))
  })

  it('fails closed before work and records attempted then succeeded around a mutation', async () => {
    const order: string[] = []
    const rpc = vi.fn(async (_name: string, input: Record<string, string>) => {
      order.push(input.p_event_type)
      return { data: auditRow(input.p_event_type, input.p_result), error: null }
    })
    const value = await runAuditedOperatorSupportMutation(
      { rpc } as unknown as SupabaseClient,
      {
        supportSessionId: '11111111-1111-4111-8111-111111111111',
        operatorRepId: '22222222-2222-4222-8222-222222222222',
        targetRepId: '33333333-3333-4333-8333-333333333333',
        workspaceArea: 'site',
        capability: 'site.manage',
        actionName: 'update_banner',
        requestId: 'request-1',
        idempotencyKey: 'idem-1',
      },
      async () => {
        order.push('domain_work')
        return 'saved'
      },
    )
    expect(value).toBe('saved')
    expect(order).toEqual(['mutation_attempted', 'domain_work', 'mutation_succeeded'])
  })
})
