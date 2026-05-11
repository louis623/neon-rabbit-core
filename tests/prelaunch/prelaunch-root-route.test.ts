import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import Home from '@/app/page'
import { redirect } from 'next/navigation'

describe('root route', () => {
  it('redirects to /prelaunch', () => {
    Home()

    expect(redirect).toHaveBeenCalledWith('/prelaunch')
  })
})
