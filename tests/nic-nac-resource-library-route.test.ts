import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPaidContext = vi.fn()
const listResources = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getPaidNicNacContext: (...args: unknown[]) => getPaidContext(...args),
}))

vi.mock('@/lib/services/workspace-resources', () => ({
  WORKSPACE_RESOURCE_TYPES: ['help', 'faq', 'blog', 'video'],
  listPublishedWorkspaceResources: (...args: unknown[]) => listResources(...args),
}))

import { GET } from '@/app/api/nic-nac/resource-library/route'

describe('rep resource library route', () => {
  beforeEach(() => {
    getPaidContext.mockReset()
    listResources.mockReset()
  })

  it('lists only through the authenticated rep client', async () => {
    getPaidContext.mockResolvedValue({ supabase: { marker: 'rep-client' } })
    listResources.mockResolvedValue([{ id: 'resource-1' }])

    const response = await GET(
      new Request('http://localhost/api/nic-nac/resource-library?type=video&query=live'),
    )

    expect(response.status).toBe(200)
    expect(listResources).toHaveBeenCalledWith(
      { marker: 'rep-client' },
      { type: 'video', query: 'live', limit: undefined },
    )
    await expect(response.json()).resolves.toEqual({ resources: [{ id: 'resource-1' }] })
  })

  it('rejects unsupported resource types', async () => {
    const response = await GET(
      new Request('http://localhost/api/nic-nac/resource-library?type=executable'),
    )
    expect(response.status).toBe(400)
    expect(getPaidContext).not.toHaveBeenCalled()
  })
})
