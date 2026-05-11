import { describe, expect, it, vi } from 'vitest'

const permanentRedirectMock = vi.fn()

vi.mock('next/navigation', () => ({
  permanentRedirect: (...args: unknown[]) => permanentRedirectMock(...args),
}))

import ThumperPage from '@/app/thumper/page'

describe('legacy /thumper entry', () => {
  it('redirects to the Nic-Nac route', () => {
    permanentRedirectMock.mockReset()

    ThumperPage()

    expect(permanentRedirectMock).toHaveBeenCalledWith('/nic-nac')
  })
})
