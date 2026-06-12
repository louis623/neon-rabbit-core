export type GoogleChatSupportAlertResult =
  | { delivered: true }
  | { delivered: false; reason: 'google_chat_not_configured' }

interface SendGoogleChatSupportAlertInput {
  title: string
  urgency: 'normal' | 'blocking' | 'showtime_urgent'
  lines: string[]
}

function urgencyLabel(urgency: SendGoogleChatSupportAlertInput['urgency']) {
  if (urgency === 'showtime_urgent') return '[Show-time urgent]'
  if (urgency === 'blocking') return '[Blocking]'
  return '[Normal]'
}

export async function sendGoogleChatSupportAlert({
  title,
  urgency,
  lines,
}: SendGoogleChatSupportAlertInput): Promise<GoogleChatSupportAlertResult> {
  const webhookUrl = process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn(
      '[google-chat-alerts] Support alert skipped because GOOGLE_CHAT_SUPPORT_WEBHOOK_URL is missing.',
      { title, urgency },
    )
    return { delivered: false, reason: 'google_chat_not_configured' }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      text: [
        'Sparkle Suite support report',
        `${urgencyLabel(urgency)} ${title}`,
        '',
        ...lines,
      ].join('\n'),
    }),
  })

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300)
    throw new Error(`Google Chat alert failed: ${response.status} ${body}`)
  }

  return { delivered: true }
}
