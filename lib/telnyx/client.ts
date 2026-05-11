import { getTelnyxConfig } from './config'

export interface TelnyxSendSmsInput {
  to: string
  text: string
}

export interface TelnyxSendSmsResult {
  messageId: string
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced'
  sentAt: string | null
}

export class TelnyxRequestError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'TelnyxRequestError'
    this.statusCode = statusCode
  }
}

function mapTelnyxStatus(status: unknown): TelnyxSendSmsResult['deliveryStatus'] {
  if (typeof status !== 'string') return 'queued'

  switch (status) {
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'delivery_failed':
    case 'sending_failed':
      return 'failed'
    case 'delivery_unconfirmed':
      return 'bounced'
    default:
      return 'queued'
  }
}

export async function sendTelnyxSms(
  input: TelnyxSendSmsInput,
): Promise<TelnyxSendSmsResult> {
  const config = getTelnyxConfig()
  if (!config) {
    throw new Error('TELNYX_NOT_CONFIGURED')
  }

  const response = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.TELNYX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.TELNYX_SMS_FROM,
      to: input.to,
      text: input.text,
      type: 'SMS',
    }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail =
      body &&
      typeof body === 'object' &&
      Array.isArray((body as { errors?: unknown[] }).errors) &&
      typeof (body as { errors: Array<{ detail?: unknown }> }).errors[0]?.detail ===
        'string'
        ? (body as { errors: Array<{ detail: string }> }).errors[0].detail
        : `Telnyx send failed with status ${response.status}`
    throw new TelnyxRequestError(detail, response.status)
  }

  const data =
    body && typeof body === 'object' ? (body as { data?: Record<string, unknown> }).data : null
  const messageId = typeof data?.id === 'string' ? data.id : ''
  if (!messageId) {
    throw new Error('TELNYX_RESPONSE_MISSING_MESSAGE_ID')
  }

  const deliveryStatus = mapTelnyxStatus(
    Array.isArray(data?.to) ? (data.to[0] as { status?: unknown } | undefined)?.status : undefined,
  )

  return {
    messageId,
    deliveryStatus,
    sentAt: typeof data?.sent_at === 'string' ? data.sent_at : null,
  }
}
