import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendGoogleChatSupportAlert } from '@/lib/ops/google-chat-alerts'

describe('sendGoogleChatSupportAlert', () => {
  const originalWebhook = process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL

  beforeEach(() => {
    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL = originalWebhook
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('ok'),
      }),
    )
  })

  afterEach(() => {
    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL = originalWebhook
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('posts a compact support report message to Google Chat when configured', async () => {
    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL =
      'https://chat.googleapis.com/v1/spaces/support/messages?key=key&token=token'

    const result = await sendGoogleChatSupportAlert({
      title: 'Calendar save fails',
      urgency: 'blocking',
      lines: ['Report ID: report-1', 'Rep: jamie@example.com', 'Page: Calendar'],
    })

    expect(result).toEqual({ delivered: true })
    expect(fetch).toHaveBeenCalledWith(
      'https://chat.googleapis.com/v1/spaces/support/messages?key=key&token=token',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          text:
            'Sparkle Suite support report\n' +
            '[Blocking] Calendar save fails\n\n' +
            'Report ID: report-1\n' +
            'Rep: jamie@example.com\n' +
            'Page: Calendar',
        }),
      },
    )
  })

  it('warns and skips without fetch when Google Chat is not configured', async () => {
    delete process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await sendGoogleChatSupportAlert({
      title: 'Missing config check',
      urgency: 'normal',
      lines: ['No message should be sent.'],
    })

    expect(result).toEqual({
      delivered: false,
      reason: 'google_chat_not_configured',
    })
    expect(fetch).not.toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalledWith(
      '[google-chat-alerts] Support alert skipped because GOOGLE_CHAT_SUPPORT_WEBHOOK_URL is missing.',
      { title: 'Missing config check', urgency: 'normal' },
    )
  })

  it('throws a sanitized error when Google Chat rejects the message', async () => {
    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL =
      'https://chat.googleapis.com/v1/spaces/support/messages?key=key&token=token'
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue('x'.repeat(350)),
    } as unknown as Response)

    await expect(
      sendGoogleChatSupportAlert({
        title: 'Rejected message',
        urgency: 'showtime_urgent',
        lines: ['Report ID: report-2'],
      }),
    ).rejects.toThrow(`Google Chat alert failed: 403 ${'x'.repeat(300)}`)
  })
})
