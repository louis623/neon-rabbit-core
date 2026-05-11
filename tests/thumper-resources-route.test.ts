import { beforeEach, describe, expect, it, vi } from 'vitest'

const getHelpResourcesMock = vi.fn()

vi.mock('@/lib/services/help-resources', () => ({
  getHelpResources: (...args: unknown[]) => getHelpResourcesMock(...args),
}))

import { GET } from '@/app/api/thumper/resources/route'

describe('resources route', () => {
  beforeEach(() => {
    getHelpResourcesMock.mockReset()
  })

  it('returns filtered Nic-Nac help resources', async () => {
    getHelpResourcesMock.mockReturnValueOnce([
      { id: 'res-1', title: 'How trade approvals work' },
    ])

    const response = await GET(
      new Request('http://localhost/api/thumper/resources?query=trade'),
    )

    expect(getHelpResourcesMock).toHaveBeenCalledWith('trade')
    expect(response.status).toBe(200)
  })
})
