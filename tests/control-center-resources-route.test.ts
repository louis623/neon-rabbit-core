import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAccess = vi.fn()
const createAdmin = vi.fn(() => ({ marker: 'admin' }))
const listResources = vi.fn()
const publishResource = vi.fn()
const publishMessage = vi.fn()
const dispatchWorkspaceMessages = vi.fn()

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: class AuthError extends Error {},
  OperatorAuthError: class OperatorAuthError extends Error {},
  getControlCenterAccess: (...args: unknown[]) => getAccess(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => createAdmin() }))
vi.mock('@/lib/services/workspace-resources', () => ({
  WORKSPACE_RESOURCE_TYPES: ['help', 'faq', 'blog', 'video'],
  listOperatorWorkspaceResources: (...args: unknown[]) => listResources(...args),
  publishWorkspaceResource: (...args: unknown[]) => publishResource(...args),
}))
vi.mock('@/lib/services/workspace-messages', () => ({
  publishWorkspaceMessage: (...args: unknown[]) => publishMessage(...args),
}))
vi.mock('@/lib/services/workspace-message-dispatch', () => ({
  dispatchWorkspaceMessageAutomationAfterResponse: (...args: unknown[]) =>
    dispatchWorkspaceMessages(...args),
}))

import { GET, POST } from '@/app/api/control-center/resources/route'

describe('Control Center resources route', () => {
  beforeEach(() => {
    getAccess.mockReset()
    listResources.mockReset()
    publishResource.mockReset()
    publishMessage.mockReset()
    dispatchWorkspaceMessages.mockReset()
    getAccess.mockResolvedValue({ operator: { email: 'louis@neonrabbit.net' } })
  })

  it('lists through an operator-authenticated admin client', async () => {
    listResources.mockResolvedValue([{ id: 'resource-1' }])
    const response = await GET()
    expect(response.status).toBe(200)
    expect(listResources).toHaveBeenCalledWith({ marker: 'admin' })
  })

  it('publishes through the resource service with an owner identity', async () => {
    publishResource.mockResolvedValue({ resource: { id: 'resource-1' }, announcement: null })
    const response = await POST(
      new Request('http://localhost/api/control-center/resources', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resourceKey: 'new-guide',
          resourceType: 'blog',
          title: 'New guide',
          summary: 'A useful new guide.',
          body: 'Guide body',
          category: 'Business',
          changeSummary: 'Added a new guide.',
          announce: true,
        }),
      }),
    )

    expect(response.status).toBe(201)
    expect(publishResource).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: { marker: 'admin' },
        input: expect.objectContaining({
          actorKind: 'owner',
          actor: 'louis@neonrabbit.net',
        }),
      }),
    )
    expect(dispatchWorkspaceMessages).toHaveBeenCalledWith({
      supabase: { marker: 'admin' },
      source: 'resource_publish',
    })
  })

  it('rejects invalid resource payloads before service mutation', async () => {
    const response = await POST(
      new Request('http://localhost/api/control-center/resources', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resourceType: 'video', title: '' }),
      }),
    )
    expect(response.status).toBe(400)
    expect(publishResource).not.toHaveBeenCalled()
  })
})
