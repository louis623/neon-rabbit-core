import { describe, expect, it } from 'vitest'

import {
  filterOperatorSupportToolNames,
  getOperatorSupportToolPolicy,
  OPERATOR_SUPPORT_PERMANENTLY_BLOCKED_TOOLS,
} from '@/lib/nic-nac/core/operator-support-policy'
import { DEFAULT_OPERATOR_SUPPORT_CAPABILITIES } from '@/lib/operator-support/capabilities'
import {
  assertOperatorSupportConversationId,
  clearOperatorSupportConversation,
  getOperatorSupportConversationId,
  insertOperatorSupportConversationMessage,
} from '@/lib/nic-nac/support-conversation'
import { vi } from 'vitest'

describe('operator support Nic-Nac boundary', () => {
  it('allows ordinary Workspace and outbound tools under explicit capabilities', () => {
    expect(filterOperatorSupportToolNames([
      'add_listing',
      'send_email_notification',
      'manage_customer_contact',
      'record_show_session_event',
    ], DEFAULT_OPERATOR_SUPPORT_CAPABILITIES)).toEqual([
      'add_listing',
      'send_email_notification',
      'manage_customer_contact',
      'record_show_session_event',
    ])
  })

  it('permanently blocks account access and entitlement tools and deny-lists future unknown tools', () => {
    expect(OPERATOR_SUPPORT_PERMANENTLY_BLOCKED_TOOLS).toEqual([
      'ensure_live_queue_sync_code',
      'unlock_required_setup',
    ])
    expect(getOperatorSupportToolPolicy('ensure_live_queue_sync_code')).toBeNull()
    expect(getOperatorSupportToolPolicy('unlock_required_setup')).toBeNull()
    expect(getOperatorSupportToolPolicy('future_billing_tool')).toBeNull()
    expect(filterOperatorSupportToolNames([
      'add_listing',
      'ensure_live_queue_sync_code',
      'future_billing_tool',
    ], DEFAULT_OPERATOR_SUPPORT_CAPABILITIES)).toEqual(['add_listing'])
  })

  it('requires the dedicated support-session conversation id', () => {
    const scope = {
      supportSessionId: 'session-id',
      operatorRepId: 'operator-id',
      targetRepId: 'target-id',
    }
    expect(getOperatorSupportConversationId(scope)).toBe('session-id')
    expect(() => assertOperatorSupportConversationId('session-id', scope)).not.toThrow()
    expect(() => assertOperatorSupportConversationId('rep-conversation', scope))
      .toThrow('session-scoped')
  })

  it('marks outbound and apparent read-only support submission tools as audited mutations', () => {
    expect(getOperatorSupportToolPolicy('send_sms_notification')).toMatchObject({
      capability: 'communications.manage',
      workspaceArea: 'communications',
      mutation: true,
    })
    expect(getOperatorSupportToolPolicy('submit_support_report')).toMatchObject({
      mutation: true,
    })
  })

  it('writes and clears only rows carrying exact operator/session/target provenance', async () => {
    const complete = Promise.resolve({ error: null })
    const query = {
      upsert: vi.fn(() => complete),
      update: vi.fn(),
      eq: vi.fn(),
    }
    query.update.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.eq.mockReturnValueOnce(query).mockReturnValueOnce(query).mockReturnValueOnce(complete)
    const supabase = { from: vi.fn(() => query) }
    const scope = {
      supportSessionId: 'session-id',
      operatorRepId: 'operator-id',
      targetRepId: 'target-id',
    }

    await insertOperatorSupportConversationMessage(supabase as never, scope, {
      id: 'message-id',
      role: 'user',
      parts: [{ type: 'text', text: 'helping now' }],
    })
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({
      conversation_id: 'session-id',
      rep_id: 'target-id',
      support_session_id: 'session-id',
      source_actor_type: 'operator_support',
      source_actor_rep_id: 'operator-id',
    }), expect.any(Object))

    query.eq.mockReset()
    query.eq.mockReturnValueOnce(query).mockReturnValueOnce(query).mockReturnValueOnce(complete)
    await expect(clearOperatorSupportConversation(supabase as never, scope))
      .resolves.toEqual(['session-id'])
    expect(query.eq).toHaveBeenNthCalledWith(1, 'conversation_id', 'session-id')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'rep_id', 'target-id')
    expect(query.eq).toHaveBeenNthCalledWith(3, 'support_session_id', 'session-id')
  })
})
