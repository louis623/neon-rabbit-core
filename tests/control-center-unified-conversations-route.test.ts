import { beforeEach, describe, expect, it, vi } from 'vitest'

const getControlCenterAccessMock = vi.fn()
const createAdminClientMock = vi.fn()
const listOperatorConversationsMock = vi.fn()
const getOperatorConversationMock = vi.fn()
const sendOperatorSupportReplyMock = vi.fn()
const transitionSupportConversationStatusMock = vi.fn()
const promoteSupportReportToTaskMock = vi.fn()
const moderateRepNetworkConversationMock = vi.fn()
const setRepNetworkSuspensionMock = vi.fn()
const listOperatorMessagingSuspensionsMock = vi.fn()
const listReportedOperatorConversationsMock = vi.fn()
const loadOperatorConversationReportsMock = vi.fn()
const resolveSupportReportMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getControlCenterAccess: (...args: unknown[]) =>
    getControlCenterAccessMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/workspace-conversations', () => ({
  listOperatorConversations: (...args: unknown[]) =>
    listOperatorConversationsMock(...args),
  getOperatorConversation: (...args: unknown[]) =>
    getOperatorConversationMock(...args),
  sendOperatorSupportReply: (...args: unknown[]) =>
    sendOperatorSupportReplyMock(...args),
}))

vi.mock('@/lib/services/workspace-support-conversations', () => ({
  transitionSupportConversationStatus: (...args: unknown[]) =>
    transitionSupportConversationStatusMock(...args),
  promoteSupportReportToTask: (...args: unknown[]) =>
    promoteSupportReportToTaskMock(...args),
}))

vi.mock('@/lib/services/support-lessons', () => ({
  resolveSupportReport: (...args: unknown[]) => resolveSupportReportMock(...args),
}))

vi.mock('@/lib/services/workspace-rep-network', () => ({
  moderateRepNetworkConversation: (...args: unknown[]) =>
    moderateRepNetworkConversationMock(...args),
  setRepNetworkSuspension: (...args: unknown[]) =>
    setRepNetworkSuspensionMock(...args),
}))

vi.mock('@/lib/control-center/operator-network-safety', () => ({
  listOperatorMessagingSuspensions: (...args: unknown[]) =>
    listOperatorMessagingSuspensionsMock(...args),
  listReportedOperatorConversations: (...args: unknown[]) =>
    listReportedOperatorConversationsMock(...args),
  loadOperatorConversationReports: (...args: unknown[]) =>
    loadOperatorConversationReportsMock(...args),
}))

import { GET as listConversations } from '@/app/api/control-center/conversations/route'
import { GET as getConversation } from '@/app/api/control-center/conversations/[conversationId]/route'
import { POST as sendReply } from '@/app/api/control-center/conversations/[conversationId]/messages/route'
import { PATCH as updateStatus } from '@/app/api/control-center/support-reports/[reportId]/status/route'
import { POST as promoteTask } from '@/app/api/control-center/support-reports/[reportId]/promote-task/route'
import { POST as moderateConversation } from '@/app/api/control-center/conversations/[conversationId]/moderate/route'
import {
  GET as listSuspensions,
  PATCH as updateSuspension,
} from '@/app/api/control-center/rep-messaging-suspensions/route'

const conversationId = '00000000-0000-4000-8000-000000000001'
const reportId = '00000000-0000-4000-8000-000000000002'
const admin = { from: vi.fn() }

describe('Control Center unified conversation routes', () => {
  beforeEach(() => {
    getControlCenterAccessMock.mockReset()
    createAdminClientMock.mockReset()
    listOperatorConversationsMock.mockReset()
    getOperatorConversationMock.mockReset()
    sendOperatorSupportReplyMock.mockReset()
    transitionSupportConversationStatusMock.mockReset()
    promoteSupportReportToTaskMock.mockReset()
    moderateRepNetworkConversationMock.mockReset()
    setRepNetworkSuspensionMock.mockReset()
    listOperatorMessagingSuspensionsMock.mockReset()
    listReportedOperatorConversationsMock.mockReset()
    loadOperatorConversationReportsMock.mockReset()
    resolveSupportReportMock.mockReset()
    getControlCenterAccessMock.mockResolvedValue({
      operator: { email: 'operator@example.com', repId: 'operator-1' },
    })
    createAdminClientMock.mockReturnValue(admin)
  })

  it('lists Support and reported Rep Network conversations behind operator auth', async () => {
    listOperatorConversationsMock.mockResolvedValueOnce({
      conversations: [{ id: conversationId, type: 'support' }],
      nextCursor: null,
    })
    const support = await listConversations(
      new Request(
        'http://localhost/api/control-center/conversations?type=support&limit=25',
      ),
    )
    expect(support.status).toBe(200)
    expect(listOperatorConversationsMock).toHaveBeenLastCalledWith(admin, {
      type: 'support',
      state: undefined,
      reportedOnly: false,
      limit: 25,
    })

    listReportedOperatorConversationsMock.mockResolvedValueOnce({ conversations: [] })
    const safety = await listConversations(
      new Request(
        'http://localhost/api/control-center/conversations?type=rep_network&reportedOnly=true',
      ),
    )
    expect(safety.status).toBe(200)
    expect(listReportedOperatorConversationsMock).toHaveBeenLastCalledWith(admin, {
      limit: 50,
    })
  })

  it('loads one operator conversation after validating its ID', async () => {
    getOperatorConversationMock.mockResolvedValueOnce({
      conversation: { id: conversationId },
      messages: [],
    })
    const response = await getConversation(new Request('http://localhost'), {
      params: Promise.resolve({ conversationId }),
    })
    expect(response.status).toBe(200)
    expect(getOperatorConversationMock).toHaveBeenCalledWith(admin, conversationId)
  })

  it('adds open safety reports only when loading a Rep Network conversation', async () => {
    getOperatorConversationMock.mockResolvedValueOnce({
      conversation: { id: conversationId, type: 'rep_direct' },
      messages: [],
    })
    loadOperatorConversationReportsMock.mockResolvedValueOnce([
      { id: reportId, reason: 'spam', status: 'open' },
    ])
    const response = await getConversation(new Request('http://localhost'), {
      params: Promise.resolve({ conversationId }),
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      detail: { reports: [{ id: reportId, reason: 'spam' }] },
    })
    expect(loadOperatorConversationReportsMock).toHaveBeenCalledWith(
      admin,
      conversationId,
    )
  })

  it('records the private operator identity while replying as Support', async () => {
    sendOperatorSupportReplyMock.mockResolvedValueOnce({
      id: 'message-1',
      senderLabel: 'Sparkle Suite Support',
    })
    const response = await sendReply(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          body: 'We are reviewing this now.',
          clientRequestId: 'reply-request-1',
        }),
      }),
      { params: Promise.resolve({ conversationId }) },
    )
    expect(response.status).toBe(201)
    expect(sendOperatorSupportReplyMock).toHaveBeenCalledWith(admin, {
      conversationId,
      operatorId: 'operator-1',
      body: 'We are reviewing this now.',
      clientRequestId: 'reply-request-1',
    })
  })

  it('updates truthful support status with the authenticated operator ID', async () => {
    transitionSupportConversationStatusMock.mockResolvedValueOnce({
      reportId,
      status: 'reviewing',
      changed: true,
    })
    const response = await updateStatus(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'reviewing' }),
      }),
      { params: Promise.resolve({ reportId }) },
    )
    expect(response.status).toBe(200)
    expect(transitionSupportConversationStatusMock).toHaveBeenCalledWith(admin, {
      reportId,
      status: 'reviewing',
      operatorId: 'operator-1',
    })
  })

  it('requires and saves a private resolution lesson before marking resolved', async () => {
    resolveSupportReportMock.mockResolvedValueOnce({
      report: { id: reportId, status: 'resolved' },
      lesson: { id: 'lesson-1' },
    })
    transitionSupportConversationStatusMock.mockResolvedValueOnce({
      reportId,
      status: 'resolved',
      changed: true,
    })
    const response = await updateStatus(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          affectedArea: 'Dance Floor',
          symptom: 'The dancer card stayed blank after saving.',
          rootCause: 'A stale cache key was reused.',
          fixOrWorkaround: 'The cache key now includes the rep ID.',
          tags: ['dance-floor', 'cache'],
          approvedForReuse: true,
        }),
      }),
      { params: Promise.resolve({ reportId }) },
    )
    expect(response.status).toBe(200)
    expect(resolveSupportReportMock).toHaveBeenCalledWith(admin, {
      reportId,
      clientAccountProfileId: undefined,
      affectedArea: 'Dance Floor',
      symptom: 'The dancer card stayed blank after saving.',
      rootCause: 'A stale cache key was reused.',
      fixOrWorkaround: 'The cache key now includes the rep ID.',
      tags: ['dance-floor', 'cache'],
      approvedForReuse: true,
      createdBy: 'operator@example.com',
    })
    expect(transitionSupportConversationStatusMock).toHaveBeenCalledWith(admin, {
      reportId,
      status: 'resolved',
      operatorId: 'operator-1',
    })
  })

  it('promotes a reviewed report deliberately and passes optional Planned status', async () => {
    promoteSupportReportToTaskMock.mockResolvedValueOnce({
      task: { id: 'task-1' },
      created: true,
    })
    const response = await promoteTask(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Fix Dance Floor loading',
          itemType: 'bug',
          owner: 'Louis',
          notes: 'Private operator notes',
          status: 'planned',
        }),
      }),
      { params: Promise.resolve({ reportId }) },
    )
    expect(response.status).toBe(201)
    expect(promoteSupportReportToTaskMock).toHaveBeenCalledWith(admin, {
      reportId,
      title: 'Fix Dance Floor loading',
      itemType: 'bug',
      owner: 'Louis',
      notes: 'Private operator notes',
      operatorId: 'operator-1',
      status: 'planned',
    })
  })

  it('requires an explicit report or message target for moderation', async () => {
    const invalid = await moderateConversation(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss_report',
          reason: 'The report was reviewed.',
        }),
      }),
      { params: Promise.resolve({ conversationId }) },
    )
    expect(invalid.status).toBe(400)
    expect(moderateRepNetworkConversationMock).not.toHaveBeenCalled()

    moderateRepNetworkConversationMock.mockResolvedValueOnce({
      conversationId,
      action: 'suspend_sender',
      suspendedRepId: 'rep-2',
    })
    const response = await moderateConversation(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend_sender',
          reason: 'Repeated unwanted recruiting messages.',
          messageId: '00000000-0000-4000-8000-000000000003',
        }),
      }),
      { params: Promise.resolve({ conversationId }) },
    )
    expect(response.status).toBe(200)
    expect(moderateRepNetworkConversationMock).toHaveBeenCalledWith(admin, {
      conversationId,
      operatorId: 'operator-1',
      action: 'suspend_sender',
      reason: 'Repeated unwanted recruiting messages.',
      reportId: undefined,
      messageId: '00000000-0000-4000-8000-000000000003',
    })
  })

  it('lists and deliberately lifts Rep Network messaging suspensions', async () => {
    listOperatorMessagingSuspensionsMock.mockResolvedValueOnce([
      { repId: 'rep-2', repLabel: 'Avery Sparkles' },
    ])
    const list = await listSuspensions(
      new Request(
        'http://localhost/api/control-center/rep-messaging-suspensions',
      ),
    )
    expect(list.status).toBe(200)
    expect(listOperatorMessagingSuspensionsMock).toHaveBeenCalledWith(admin, {
      activeOnly: true,
    })

    setRepNetworkSuspensionMock.mockResolvedValueOnce({
      repId: '00000000-0000-4000-8000-000000000004',
      suspended: false,
    })
    const restore = await updateSuspension(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          repId: '00000000-0000-4000-8000-000000000004',
          suspended: false,
          reason: 'Safety review completed.',
        }),
      }),
    )
    expect(restore.status).toBe(200)
    expect(setRepNetworkSuspensionMock).toHaveBeenCalledWith(admin, {
      repId: '00000000-0000-4000-8000-000000000004',
      operatorId: 'operator-1',
      suspended: false,
      reason: 'Safety review completed.',
    })
  })

  it('rejects malformed requests before a service write', async () => {
    const response = await promoteTask(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ title: '', itemType: 'anything' }),
      }),
      { params: Promise.resolve({ reportId }) },
    )
    expect(response.status).toBe(400)
    expect(promoteSupportReportToTaskMock).not.toHaveBeenCalled()
  })

  it('does not create an admin client for an unauthenticated request', async () => {
    getControlCenterAccessMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )
    const response = await listConversations(
      new Request('http://localhost/api/control-center/conversations'),
    )
    expect(response.status).toBe(401)
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })
})
