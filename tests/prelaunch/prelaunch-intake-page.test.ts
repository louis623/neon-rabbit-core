import { describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}))

import PrelaunchIntakePage from '@/app/prelaunch/intake/page'

describe('Sparkle Suite prelaunch intake page', () => {
  it('redirects back to the low-friction prelaunch waitlist', () => {
    redirectMock.mockClear()

    PrelaunchIntakePage()

    expect(redirectMock).toHaveBeenCalledWith('/prelaunch')
  })
})
