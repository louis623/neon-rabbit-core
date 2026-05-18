import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelnyxSms } from '@/lib/telnyx/client'
import { isTelnyxEnabled, isTelnyxSmsCampaignApproved } from '@/lib/telnyx/config'
import { assertMessageContentAllowed } from './message-content-screening'
import { errors } from './errors'
import { assertMessageSendAllowed } from './message-send-limits'
import { deductSmsCharge, refundSmsCharge } from './wallet'
import { walletMilsToUsd } from './wallet-units'

const SMS_COST = 0.009
const MAX_CONTENT_PREVIEW = 160

export interface SendSmsNotificationInput {
  recipientPhone: string
  message: string
}

export interface SendSmsNotificationOptions {
  isAutomated?: boolean
  automationKey?: string
  now?: Date
}

export interface SendSmsNotificationResult {
  success: true
  messageId: string
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced'
  recipientPhone: string
  remainingBalanceMils: number
  remainingBalanceUsd: number
}

function normalizeRecipientPhone(recipientPhone: string) {
  const normalized = recipientPhone.trim().replace(/[\s().-]/g, '')
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw errors.INVALID_PHONE_NUMBER()
  }
  return normalized
}

function buildContentPreview(message: string) {
  return message.length <= MAX_CONTENT_PREVIEW
    ? message
    : `${message.slice(0, MAX_CONTENT_PREVIEW - 1)}…`
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
    console.error(`[sms] failed to mark message_log row as ${context}`, {
      logId,
      error,
    })
  }
}

export async function sendSmsNotification(
  repId: string,
  input: SendSmsNotificationInput,
  options: SendSmsNotificationOptions = {},
): Promise<SendSmsNotificationResult> {
  if (!isTelnyxSmsCampaignApproved()) {
    throw errors.SMS_CAMPAIGN_PENDING()
  }

  if (!isTelnyxEnabled()) {
    throw errors.SMS_NOT_CONFIGURED()
  }

  const recipientPhone = normalizeRecipientPhone(input.recipientPhone)
  const message = input.message.trim()
  if (!message) {
    throw errors.INVALID_INPUT(
      'message cannot be empty',
      'I need a message before I can text anyone.',
    )
  }

  const screening = await assertMessageContentAllowed({
    repId,
    channel: 'sms',
    recipient: recipientPhone,
    text: message,
    contentPreview: buildContentPreview(message),
    isAutomated: options.isAutomated,
    automationKey: options.automationKey,
  })

  await assertMessageSendAllowed(repId, {
    channel: 'sms',
    isAutomated: options.isAutomated,
    automationKey: options.automationKey,
    now: options.now,
  })

  const debit = await deductSmsCharge(repId)
  if (!debit.success) {
    throw errors.INSUFFICIENT_SMS_WALLET()
  }

  const admin = createAdminClient()
  let logId: string | null = null

  try {
    const { data: logRow, error: logError } = await admin
      .from('message_log')
      .insert({
        rep_id: repId,
        channel: 'sms',
        recipient: recipientPhone,
        content_preview: buildContentPreview(message),
        screening_result: screening.screeningResult,
        screening_notes: screening.screeningNotes,
        delivery_status: 'queued',
        cost: SMS_COST,
        is_automated: options.isAutomated ?? false,
        automation_key: options.automationKey?.trim() || null,
      })
      .select('id')
      .single()

    if (logError || !logRow?.id) {
      throw logError ?? new Error('MESSAGE_LOG_INSERT_FAILED')
    }
    logId = logRow.id

    const delivery = await sendTelnyxSms({
      to: recipientPhone,
      text: message,
    })

    await updateMessageLog(
      logRow.id,
      {
        delivery_status: delivery.deliveryStatus,
        sent_at: delivery.sentAt ?? new Date().toISOString(),
      },
      'sent',
    )

    return {
      success: true,
      messageId: delivery.messageId,
      deliveryStatus: delivery.deliveryStatus,
      recipientPhone,
      remainingBalanceMils: debit.new_balance_mils,
      remainingBalanceUsd: walletMilsToUsd(debit.new_balance_mils),
    }
  } catch (error) {
    if (logId) {
      await updateMessageLog(logId, { delivery_status: 'failed' }, 'failed')
    }

    const detail = error instanceof Error ? error.message : 'Unknown Telnyx error'
    try {
      await refundSmsCharge(repId, `SMS refund after send failure: ${detail}`)
    } catch (refundError) {
      console.error('[sms] refund failed after send failure', { repId, refundError })
    }

    throw errors.SMS_DELIVERY_FAILED(detail)
  }
}
