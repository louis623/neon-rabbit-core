import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const order: string[] = []
const getControlCenterAccessMock = vi.fn()
const createAdminClientMock = vi.fn()
const requestSessionMock = vi.fn()
const activateSessionMock = vi.fn()
const listSessionsMock = vi.fn()
const endSessionMock = vi.fn()
const recordCompletionMock = vi.fn()
const publishStartMock = vi.fn()
const publishEndMock = vi.fn()
const loadVerifiedContextMock = vi.fn()
const appendAuditMock = vi.fn()
const hasSuccessfulMutationMock = vi.fn()
const enqueueRetryMock = vi.fn()
const expireSessionsMock = vi.fn()
const enqueueMissingCompletionMock = vi.fn()
const resolveWorkspaceAccessMock = vi.fn()

const { MockAuthError, MockSupportError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockSupportError: class MockSupportError extends Error {
    code = 'SUPPORT_ACTION_BLOCKED'
    status = 403
  },
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  getControlCenterAccess: (...args: unknown[]) => getControlCenterAccessMock(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))
vi.mock('@/lib/operator-support/session-service', () => ({
  OperatorSupportError: MockSupportError,
  requestOperatorSupportSession: (...args: unknown[]) => requestSessionMock(...args),
  activateOperatorSupportSession: (...args: unknown[]) => activateSessionMock(...args),
  listOperatorSupportSessions: (...args: unknown[]) => listSessionsMock(...args),
  endOperatorSupportSession: (...args: unknown[]) => endSessionMock(...args),
  recordOperatorSupportCompletionNotice: (...args: unknown[]) => recordCompletionMock(...args),
  expireOperatorSupportSessions: (...args: unknown[]) => expireSessionsMock(...args),
}))
vi.mock('@/lib/operator-support/completion-retry', () => ({
  enqueueMissingOperatorSupportCompletionNotices: (...args: unknown[]) =>
    enqueueMissingCompletionMock(...args),
}))
vi.mock('@/lib/operator-support/messages', () => ({
  publishOperatorSupportStartNotice: (...args: unknown[]) => publishStartMock(...args),
  publishOperatorSupportEndNotice: (...args: unknown[]) => publishEndMock(...args),
}))
vi.mock('@/lib/operator-support/http', () => ({
  OPERATOR_SUPPORT_CSRF_COOKIE_PREFIX: 'sparkle_support_csrf_',
  operatorSupportWorkspaceUrl: (id: string) => `/control-center/support/${id}`,
  mapOperatorSupportSessionSummary: (session: Record<string, unknown>) => ({
    id: session.id,
    targetRepId: session.targetRepId,
    operatorDisplayName: session.operatorDisplayNameSnapshot,
    targetRepDisplayName: session.targetNameSnapshot,
    status: session.status,
    reasonCode: session.reasonCode,
    createdAt: session.createdAt,
    workspaceUrl: session.status === 'active' ? `/control-center/support/${session.id}` : undefined,
  }),
  loadVerifiedOperatorSupportContext: (...args: unknown[]) => loadVerifiedContextMock(...args),
}))
vi.mock('@/lib/operator-support/audit', () => ({
  appendOperatorSupportAuditEvent: (...args: unknown[]) => appendAuditMock(...args),
  operatorSupportSessionHasSuccessfulMutation: (...args: unknown[]) =>
    hasSuccessfulMutationMock(...args),
}))
vi.mock('@/lib/services/workspace-message-outbox', () => ({
  enqueueWorkspaceMessageOutboxEvent: (...args: unknown[]) => enqueueRetryMock(...args),
}))
vi.mock('@/lib/services/workspace-access', () => ({
  resolveWorkspaceAccess: (...args: unknown[]) => resolveWorkspaceAccessMock(...args),
}))

import {
  GET as listSupport,
  POST as startSupport,
} from '@/app/api/control-center/support-sessions/route'
import { POST as endSupport } from '@/app/api/control-center/support-sessions/[sessionId]/end/route'

const session = {
  id: '11111111-1111-4111-8111-111111111111',
  operatorRepId: 'operator-1',
  operatorDisplayNameSnapshot: 'Louis',
  targetRepId: 'rep-kim',
  targetNameSnapshot: 'Kim',
  status: 'pending_notice',
  reasonCode: 'account_setup',
  createdAt: '2026-08-29T12:00:00.000Z',
}

function repQuery(data: Record<string, unknown>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

describe('operator support session routes', () => {
  beforeEach(() => {
    order.length = 0
    vi.clearAllMocks()
    getControlCenterAccessMock.mockResolvedValue({
      operator: { repId: 'operator-1', email: 'louis@example.com' },
    })
    const admin = {
      from: vi
        .fn()
        .mockReturnValueOnce(
          repQuery({
            id: 'operator-1',
            email: 'louis@example.com',
            display_name: 'Louis',
            business_name: 'Sparkle Suite',
          }),
        )
        .mockReturnValueOnce(
          repQuery({
            id: 'rep-kim',
            display_name: 'Kim',
            business_name: 'Kim Sparkles',
            status: 'active',
          }),
        ),
    }
    createAdminClientMock.mockReturnValue(admin)
    requestSessionMock.mockImplementation(async () => {
      order.push('requested')
      return { session, csrfToken: 'csrf-secret' }
    })
    publishStartMock.mockImplementation(async () => {
      order.push('noticed')
      return { id: 'publication-start' }
    })
    activateSessionMock.mockImplementation(async () => {
      order.push('activated')
      return { ...session, status: 'active' }
    })
    appendAuditMock.mockResolvedValue({})
    hasSuccessfulMutationMock.mockResolvedValue(false)
    enqueueRetryMock.mockResolvedValue({ id: 'outbox-1' })
    expireSessionsMock.mockResolvedValue(0)
    enqueueMissingCompletionMock.mockResolvedValue(0)
    resolveWorkspaceAccessMock.mockResolvedValue({ hasFullAccess: true })
  })

  it('does not activate or reveal the Workspace URL until the exact rep notice succeeds', async () => {
    const response = await startSupport(
      new Request('http://localhost/api/control-center/support-sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          targetRepId: 'rep-kim',
          reasonCode: 'account_setup',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(order).toEqual(['requested', 'noticed', 'activated'])
    expect(response.headers.get('set-cookie')).toContain(
      `sparkle_support_csrf_${session.id}=csrf-secret`,
    )
    expect(response.headers.get('set-cookie')).toContain('Path=/control-center')
    await expect(response.json()).resolves.toMatchObject({
      workspaceUrl: `/control-center/support/${session.id}`,
      session: { targetRepId: 'rep-kim', status: 'active' },
    })
  })

  it('fails closed before opening rep B while the operator is active in rep A', async () => {
    listSessionsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          ...session,
          targetRepId: 'rep-a',
          targetNameSnapshot: 'Rep A',
          status: 'active',
        },
      ])

    const response = await listSupport(
      new Request(
        'http://localhost/api/control-center/support-sessions?targetRepId=rep-b',
      ),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('Rep A'),
    })
  })

  it('closes an unusable pending session if rep notification fails', async () => {
    publishStartMock.mockRejectedValueOnce(new Error('message unavailable'))
    endSessionMock.mockResolvedValueOnce({ ...session, status: 'failed' })

    const response = await startSupport(
      new Request('http://localhost/api/control-center/support-sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetRepId: 'rep-kim', reasonCode: 'account_setup' }),
      }),
    )

    expect(response.status).toBe(500)
    expect(activateSessionMock).not.toHaveBeenCalled()
    expect(endSessionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ endedReason: 'failure' }),
    )
  })

  it('sends a correction notice if activation fails after the rep was notified', async () => {
    activateSessionMock.mockRejectedValueOnce(new Error('activation failed'))
    const failed = { ...session, status: 'failed', endedReason: 'failure' }
    endSessionMock.mockResolvedValueOnce(failed)
    publishEndMock.mockResolvedValueOnce({ id: 'publication-correction' })
    recordCompletionMock.mockResolvedValueOnce(failed)

    const response = await startSupport(
      new Request('http://localhost/api/control-center/support-sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetRepId: 'rep-kim', reasonCode: 'account_setup' }),
      }),
    )

    expect(response.status).toBe(500)
    expect(endSessionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ endedReason: 'failure' }),
    )
    expect(publishEndMock).toHaveBeenCalledWith(
      expect.anything(),
      failed,
      false,
    )
    expect(recordCompletionMock).toHaveBeenCalledWith(
      expect.anything(),
      {
        sessionId: session.id,
        endPublicationId: 'publication-correction',
      },
    )
  })

  it('refuses support access when the target Workspace is inactive or unentitled', async () => {
    resolveWorkspaceAccessMock.mockResolvedValueOnce({ hasFullAccess: false })

    const response = await startSupport(
      new Request('http://localhost/api/control-center/support-sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetRepId: 'rep-kim', reasonCode: 'account_setup' }),
      }),
    )

    expect(response.status).toBe(409)
    expect(requestSessionMock).not.toHaveBeenCalled()
    expect(publishStartMock).not.toHaveBeenCalled()
  })

  it('ends access before publishing the completion notice and clears the secret cookie', async () => {
    const active = { ...session, status: 'active' }
    const ended = { ...session, status: 'ended' }
    loadVerifiedContextMock.mockResolvedValue({
      session: active,
      supabase: {},
    })
    endSessionMock.mockImplementation(async () => {
      order.push('ended')
      return ended
    })
    publishEndMock.mockImplementation(async () => {
      order.push('completion-noticed')
      return { id: 'publication-end' }
    })
    recordCompletionMock.mockResolvedValue(ended)

    const response = await endSupport(
      new Request(`http://localhost/api/control-center/support-sessions/${session.id}/end`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sparkle-support-csrf': 'csrf-secret' },
        body: JSON.stringify({
          changedAnything: true,
          completionSummary: 'Updated the customer-site welcome copy.',
        }),
      }),
      { params: Promise.resolve({ sessionId: session.id }) },
    )

    expect(response.status).toBe(200)
    expect(order).toEqual(['ended', 'completion-noticed'])
    expect(response.headers.get('set-cookie')).toContain(
      `sparkle_support_csrf_${session.id}=`,
    )
    expect(response.headers.get('set-cookie')).toContain('Path=/control-center')
  })

  it('queues an idempotent completion-notice retry if Message Center is temporarily unavailable', async () => {
    const active = { ...session, status: 'active' }
    const ended = { ...session, status: 'ended' }
    loadVerifiedContextMock.mockResolvedValue({ session: active, supabase: {} })
    endSessionMock.mockResolvedValue(ended)
    publishEndMock.mockRejectedValueOnce(new Error('temporary message failure'))

    const response = await endSupport(
      new Request(`http://localhost/api/control-center/support-sessions/${session.id}/end`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sparkle-support-csrf': 'csrf-secret' },
        body: JSON.stringify({ changedAnything: false }),
      }),
      { params: Promise.resolve({ sessionId: session.id }) },
    )

    expect(response.status).toBe(200)
    expect(enqueueRetryMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        eventType: 'operator_support_completion_notice',
        idempotencyKey: `support-access-end:${session.id}`,
        payload: { sessionId: session.id, changedAnything: false },
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      warning: expect.stringContaining('queued for automatic retry'),
    })
  })

  it('uses durable mutation audit evidence even if the client reports no changes', async () => {
    const active = { ...session, status: 'active' }
    const ended = { ...session, status: 'ended' }
    loadVerifiedContextMock.mockResolvedValue({ session: active, supabase: {} })
    hasSuccessfulMutationMock.mockResolvedValue(true)
    endSessionMock.mockResolvedValue(ended)
    publishEndMock.mockResolvedValue({ id: 'publication-end' })
    recordCompletionMock.mockResolvedValue(ended)

    const response = await endSupport(
      new Request(`http://localhost/api/control-center/support-sessions/${session.id}/end`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sparkle-support-csrf': 'csrf-secret' },
        body: JSON.stringify({
          changedAnything: false,
          completionSummary: 'Updated the homepage welcome copy.',
        }),
      }),
      { params: Promise.resolve({ sessionId: session.id }) },
    )

    expect(response.status).toBe(200)
    expect(publishEndMock).toHaveBeenCalledWith({}, ended, true)
  })
})
