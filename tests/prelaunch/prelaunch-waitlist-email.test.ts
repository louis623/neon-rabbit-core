import { beforeEach, describe, expect, it, vi } from 'vitest'

const getResendConfigMock = vi.fn()
const isResendEnabledMock = vi.fn()

vi.mock('@/lib/resend/config', () => ({
  getResendConfig: () => getResendConfigMock(),
  isResendEnabled: () => isResendEnabledMock(),
}))

import { sendPrelaunchWaitlistWelcomeEmail } from '@/lib/prelaunch/waitlist-email'

describe('sendPrelaunchWaitlistWelcomeEmail', () => {
  beforeEach(() => {
    getResendConfigMock.mockReset()
    isResendEnabledMock.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('skips without failing when Resend is not configured', async () => {
    isResendEnabledMock.mockReturnValueOnce(false)

    await expect(
      sendPrelaunchWaitlistWelcomeEmail({
        email: 'jamie@example.com',
        name: 'Jamie Hart',
      }),
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'resend_not_configured',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends the first waitlist welcome email through Resend', async () => {
    isResendEnabledMock.mockReturnValueOnce(true)
    getResendConfigMock.mockReturnValueOnce({
      RESEND_API_KEY: 'rk_test',
      RESEND_FROM_EMAIL: 'updates@neonrabbit.net',
    })
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }),
    )

    await expect(
      sendPrelaunchWaitlistWelcomeEmail({
        email: 'JAMIE@EXAMPLE.COM',
        name: 'Jamie Hart',
      }),
    ).resolves.toEqual({
      status: 'sent',
      providerId: 'email_123',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer rk_test',
          'Content-Type': 'application/json',
        },
      }),
    )
    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse(String(options?.body))).toMatchObject({
      from: 'updates@neonrabbit.net',
      to: ['jamie@example.com'],
      subject: "You're in the Sparkle Suite build queue",
    })
    expect(JSON.parse(String(options?.body)).text).toContain(
      'Thanks for joining the Sparkle Suite build queue.',
    )
    expect(JSON.parse(String(options?.body)).text).toContain(
      'Reply to this email any time if you want to unsubscribe or ask a question.',
    )
  })

  it('returns a failed status when Resend rejects the send', async () => {
    isResendEnabledMock.mockReturnValueOnce(true)
    getResendConfigMock.mockReturnValueOnce({
      RESEND_API_KEY: 'rk_test',
      RESEND_FROM_EMAIL: 'updates@neonrabbit.net',
    })
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'bad request' }), {
        status: 400,
      }),
    )

    await expect(
      sendPrelaunchWaitlistWelcomeEmail({
        email: 'jamie@example.com',
        name: 'Jamie Hart',
      }),
    ).resolves.toEqual({
      status: 'failed',
      error: 'bad request',
    })
  })
})
