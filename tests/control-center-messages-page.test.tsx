import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getControlCenterAccessMock = vi.fn()
const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`)
})

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('next/navigation', () => ({
  redirect: (target: string) => redirectMock(target),
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getControlCenterAccess: (...args: unknown[]) =>
    getControlCenterAccessMock(...args),
}))

vi.mock('@/app/control-center/_components/CommunicationsConsole', () => ({
  CommunicationsConsole: () =>
    createElement('div', null, 'Authenticated communications console'),
}))

import ControlCenterMessagesPage from '@/app/control-center/messages/page'

describe('ControlCenterMessagesPage', () => {
  beforeEach(() => {
    getControlCenterAccessMock.mockReset()
    redirectMock.mockClear()
    getControlCenterAccessMock.mockResolvedValue({
      operator: { email: 'owner@example.com' },
    })
  })

  it('renders the console for an authenticated operator', async () => {
    const page = await ControlCenterMessagesPage()
    const html = renderToStaticMarkup(page)

    expect(getControlCenterAccessMock).toHaveBeenCalledOnce()
    expect(html).toContain('Authenticated communications console')
  })

  it('preserves the destination when redirecting an unauthenticated visitor', async () => {
    getControlCenterAccessMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    await expect(ControlCenterMessagesPage()).rejects.toThrow(
      'redirect:/control-center/login?redirect=%2Fcontrol-center%2Fmessages',
    )
  })

  it('does not expose the console to a non-operator', async () => {
    getControlCenterAccessMock.mockRejectedValueOnce(
      new MockOperatorAuthError('not operator'),
    )

    const page = await ControlCenterMessagesPage()
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Operator access required')
    expect(html).not.toContain('Authenticated communications console')
  })
})
