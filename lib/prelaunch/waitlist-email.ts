import { getResendConfig, isResendEnabled } from '@/lib/resend/config'
import { buildPrelaunchWaitlistWelcomeEmailContent } from '@/lib/prelaunch/email-content'

export type PrelaunchWaitlistWelcomeEmailResult =
  | { status: 'sent'; providerId: string }
  | { status: 'skipped'; reason: 'resend_not_configured' }
  | { status: 'failed'; error: string }

export interface PrelaunchWaitlistWelcomeEmailInput {
  email: string
  name: string
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

export async function sendPrelaunchWaitlistWelcomeEmail(
  input: PrelaunchWaitlistWelcomeEmailInput,
): Promise<PrelaunchWaitlistWelcomeEmailResult> {
  if (!isResendEnabled()) {
    return { status: 'skipped', reason: 'resend_not_configured' }
  }

  const resendConfig = getResendConfig()
  if (!resendConfig) {
    return { status: 'skipped', reason: 'resend_not_configured' }
  }

  const recipientEmail = input.email.trim().toLowerCase()
  const content = buildPrelaunchWaitlistWelcomeEmailContent(input.name)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendConfig.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendConfig.RESEND_FROM_EMAIL,
        to: [recipientEmail],
        subject: content.subject,
        text: content.text,
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: string }
      | null

    if (!response.ok || !payload?.id) {
      return {
        status: 'failed',
        error: getResendErrorMessage(payload) ?? 'Unknown Resend error',
      }
    }

    return { status: 'sent', providerId: payload.id }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Resend error',
    }
  }
}
