import { describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`)
})

vi.mock('next/navigation', () => ({
  redirect: (target: string) => redirectMock(target),
}))

import SparkleSuiteDashboardPage from '@/app/dashboard/page'

describe('SparkleSuiteDashboardPage', () => {
  it('keeps the permanent dashboard link pointed at the Control Center', () => {
    expect(() => SparkleSuiteDashboardPage()).toThrow(
      'redirect:/control-center',
    )
    expect(redirectMock).toHaveBeenCalledWith('/control-center')
  })
})
