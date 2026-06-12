import { getResendConfig, isResendEnabled } from '@/lib/resend/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertMessageContentAllowed } from './message-content-screening'
import { ServiceError, errors } from './errors'
import {
  assertMessageSendAllowed,
  mapAutomatedMessageLogInsertError,
} from './message-send-limits'

const MAX_CONTENT_PREVIEW = 160

export interface SendEmailNotificationInput {
  recipientEmail: string
  subject: string
  body: string
}

export interface SendEmailNotificationOptions {
  isAutomated?: boolean
  automationKey?: string
  now?: Date
}

export interface SendEmailNotificationResult {
  success: true
  emailId: string
  deliveryStatus: 'sent'
  recipientEmail: string
}

function normalizeRecipientEmail(recipientEmail: string) {
  const normalized = recipientEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw errors.INVALID_INPUT(
      'recipientEmail must be a valid email address',
      'I need a real email address before I can send that.',
    )
  }
  return normalized
}

function buildContentPreview(message: string) {
  return message.length <= MAX_CONTENT_PREVIEW
    ? message
    : `${message.slice(0, MAX_CONTENT_PREVIEW - 1)}...`
}

function getResendErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }

  return null
}

async function updateMessageLog(
  logId: string,
  values: Record<string, unknown>,
  context: 'sent' | 'failed',
) {
  try {
    const admin = createAdminClient()
    await admin.from('message_log').update(values).eq('id', logId)
  } catch (error) {
    console.error(`[email] failed to mark message_log row as ${context}`, {
      logId,
      error,
    })
  }
}

export async function sendEmailNotification(
  repId: string,
  input: SendEmailNotificationInput,
  options: SendEmailNotificationOptions = {},
): Promise<SendEmailNotificationResult> {
  if (!isResendEnabled()) {
    throw errors.EMAIL_NOT_CONFIGURED()
  }

  const resendConfig = getResendConfig()
  if (!resendConfig) {
    throw errors.EMAIL_NOT_CONFIGURED()
  }

  const recipientEmail = normalizeRecipientEmail(input.recipientEmail)
  const subject = input.subject.trim()
  const body = input.body.trim()

  if (!subject) {
    throw errors.INVALID_INPUT(
      'subject cannot be empty',
      'I need a subject line before I can send that email.',
    )
  }

  if (!body) {
    throw errors.INVALID_INPUT(
      'body cannot be empty',
      'I need some message copy before I can send that email.',
    )
  }

  const screening = await assertMessageContentAllowed({
    repId,
    channel: 'email',
    recipient: recipientEmail,
    text: `${subject}\n\n${body}`,
    contentPreview: buildContentPreview(body),
    isAutomated: options.isAutomated,
    automationKey: options.automationKey,
  })

  await assertMessageSendAllowed(repId, {
    channel: 'email',
    isAutomated: options.isAutomated,
    automationKey: options.automationKey,
    now: options.now,
  })

  const admin = createAdminClient()
  let logId: string | null = null

  try {
    const { data: logRow, error: logError } = await admin
      .from('message_log')
      .insert({
        rep_id: repId,
        channel: 'email',
        recipient: recipientEmail,
        content_preview: buildContentPreview(body),
        screening_result: screening.screeningResult,
        screening_notes: screening.screeningNotes,
        delivery_status: 'queued',
        is_automated: options.isAutomated ?? false,
        automation_key: options.automationKey?.trim() || null,
      })
      .select('id')
      .single()

    if (logError || !logRow?.id) {
      const duplicateError = mapAutomatedMessageLogInsertError(logError, {
        channel: 'email',
        isAutomated: options.isAutomated,
        automationKey: options.automationKey,
      })
      throw duplicateError ?? logError ?? new Error('MESSAGE_LOG_INSERT_FAILED')
    }
    logId = logRow.id

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendConfig.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendConfig.RESEND_FROM_EMAIL,
        to: [recipientEmail],
        subject,
        text: body,
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: string }
      | null

    if (!response.ok || !payload?.id) {
      throw new Error(
        getResendErrorMessage(payload) ?? 'Unknown Resend error',
      )
    }

    await updateMessageLog(
      logRow.id,
      {
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
      },
      'sent',
    )

    return {
      success: true,
      emailId: payload.id,
      deliveryStatus: 'sent',
      recipientEmail,
    }
  } catch (error) {
    if (logId) {
      const failedLogId = logId
      await updateMessageLog(
        failedLogId,
        { delivery_status: 'failed' },
        'failed',
      )
    }

    const detail = error instanceof Error ? error.message : 'Unknown Resend error'
    if (error instanceof ServiceError) {
      throw error
    }

    throw errors.EMAIL_DELIVERY_FAILED(detail)
  }
}
