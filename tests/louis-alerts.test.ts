import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendLouisAlert } from '@/lib/ops/louis-alerts'

describe('sendLouisAlert', () => {
  const originalEnv = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    LOUIS_TELEGRAM_CHAT_ID: process.env.LOUIS_TELEGRAM_CHAT_ID,
  }

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalEnv.TELEGRAM_BOT_TOKEN
    process.env.LOUIS_TELEGRAM_CHAT_ID = originalEnv.LOUIS_TELEGRAM_CHAT_ID
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('ok'),
      }),
    )
  })

  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalEnv.TELEGRAM_BOT_TOKEN
    process.env.LOUIS_TELEGRAM_CHAT_ID = originalEnv.LOUIS_TELEGRAM_CHAT_ID
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('posts a formatted Sparkle Suite info message when Telegram is configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.LOUIS_TELEGRAM_CHAT_ID = 'chat-123'

    const result = await sendLouisAlert({
      title: 'Order light box within 24 hours',
      severity: 'info',
      lines: ['Rep: Britt <britt@example.com>', 'Due: tomorrow'],
    })

    expect(result).toEqual({ delivered: true })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: 'chat-123',
          text:
            '[Sparkle Suite]\n' +
            'Order light box within 24 hours\n\n' +
            'Rep: Britt <britt@example.com>\n' +
            'Due: tomorrow',
          disable_web_page_preview: true,
        }),
      },
    )
  })

  it('uses severity-specific prefixes for warning and error messages', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.LOUIS_TELEGRAM_CHAT_ID = 'chat-123'

    await expect(sendLouisAlert({
      title: 'Review checkout',
      severity: 'warning',
      lines: ['Session: cs_warning'],
    })).resolves.toEqual({ delivered: true })
    await expect(sendLouisAlert({
      title: 'Webhook failed',
      severity: 'error',
      lines: ['Event: evt_error'],
    })).resolves.toEqual({ delivered: true })

    const fetchMock = vi.mocked(fetch)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).text).toBe(
      '[Sparkle Suite needs attention]\nReview checkout\n\nSession: cs_warning',
    )
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).text).toBe(
      '[Sparkle Suite error]\nWebhook failed\n\nEvent: evt_error',
    )
  })

  it('warns and skips without fetch when Telegram is not configured', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.LOUIS_TELEGRAM_CHAT_ID
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await sendLouisAlert({
      title: 'Missing config check',
      severity: 'warning',
      lines: ['No message should be sent.'],
    })

    expect(result).toEqual({
      delivered: false,
      reason: 'telegram_not_configured',
    })
    expect(fetch).not.toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalledWith(
      '[louis-alerts] Telegram alert skipped because TELEGRAM_BOT_TOKEN or LOUIS_TELEGRAM_CHAT_ID is missing.',
      { title: 'Missing config check', severity: 'warning' },
    )
  })
})
