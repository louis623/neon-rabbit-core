export type LouisAlertSeverity = 'info' | 'warning' | 'error'

interface SendLouisAlertInput {
  title: string
  severity: LouisAlertSeverity
  lines: string[]
}

export type LouisAlertResult =
  | { delivered: true }
  | { delivered: false; reason: 'telegram_not_configured' }

function getLouisAlertPrefix(severity: LouisAlertSeverity) {
  if (severity === 'warning') return '[Sparkle Suite needs attention]'
  if (severity === 'error') return '[Sparkle Suite error]'
  return '[Sparkle Suite]'
}

export async function sendLouisAlert({
  title,
  severity,
  lines,
}: SendLouisAlertInput): Promise<LouisAlertResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.LOUIS_TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn(
      '[louis-alerts] Telegram alert skipped because TELEGRAM_BOT_TOKEN or LOUIS_TELEGRAM_CHAT_ID is missing.',
      { title, severity },
    )
    return { delivered: false, reason: 'telegram_not_configured' }
  }

  const prefix = getLouisAlertPrefix(severity)
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: [prefix, title, '', ...lines].join('\n'),
        disable_web_page_preview: true,
      }),
    },
  )

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300)
    throw new Error(`Louis alert failed: ${response.status} ${body}`)
  }

  return { delivered: true }
}
