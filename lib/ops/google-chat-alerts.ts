export type GoogleChatSupportAlertResult =
  | { delivered: true }
  | { delivered: false; reason: 'google_chat_not_configured' }

export interface SupportAuditAlertPayload {
  title: string
  urgency: 'normal' | 'blocking' | 'showtime_urgent'
  clientName: string
  showName: string | null
  phone: string | null
  email: string
  reportId: string
  issue: string
  source: string
  workflow: string
  auditStatus: 'completed' | 'failed' | 'timed_out' | 'incomplete'
  summary: string
  findings: string[]
  recommendedFirstAction: string | null
}

interface LegacyGoogleChatSupportAlertInput {
  title: string
  urgency: 'normal' | 'blocking' | 'showtime_urgent'
  lines?: string[]
  audit?: SupportAuditAlertPayload
}

type SendGoogleChatSupportAlertInput =
  | LegacyGoogleChatSupportAlertInput
  | SupportAuditAlertPayload

function urgencyLabel(urgency: SupportAuditAlertPayload['urgency']) {
  if (urgency === 'showtime_urgent') return '[Show-time urgent]'
  if (urgency === 'blocking') return '[Blocking]'
  return '[Normal]'
}

function auditStatusLabel(status: SupportAuditAlertPayload['auditStatus']) {
  if (status === 'completed') return 'Completed'
  if (status === 'timed_out') return 'Timed out'
  if (status === 'failed') return 'Failed'
  return 'Incomplete'
}

export function buildSupportAuditAlertText(payload: SupportAuditAlertPayload) {
  const findings = payload.findings.length
    ? [
        '',
        'Key findings:',
        ...payload.findings.map((finding) => `- ${finding}`),
      ]
    : []
  const firstAction = payload.recommendedFirstAction
    ? ['', 'Recommended first action:', payload.recommendedFirstAction]
    : []

  return [
    'Sparkle Suite support report',
    '',
    `${urgencyLabel(payload.urgency)} ${payload.title}`,
    '',
    `Client: ${payload.clientName}`,
    `Show: ${payload.showName ?? 'Not provided'}`,
    `Phone: ${payload.phone ?? 'Not provided'}`,
    `Email: ${payload.email}`,
    `Report ID: ${payload.reportId}`,
    '',
    `Issue: ${payload.issue}`,
    `Submitted from: ${payload.source}`,
    `Workflow: ${payload.workflow}`,
    '',
    `Support Auditor: ${auditStatusLabel(payload.auditStatus)}`,
    `Summary: ${payload.summary}`,
    ...findings,
    ...firstAction,
  ].join('\n')
}

function isSupportAuditPayload(
  input: SendGoogleChatSupportAlertInput,
): input is SupportAuditAlertPayload {
  return 'clientName' in input
}

export async function sendGoogleChatSupportAlert(
  input: SendGoogleChatSupportAlertInput,
): Promise<GoogleChatSupportAlertResult> {
  const title = input.title
  const urgency = input.urgency
  const audit = isSupportAuditPayload(input) ? input : input.audit
  const lines = isSupportAuditPayload(input) ? [] : input.lines ?? []
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
      text: audit
        ? buildSupportAuditAlertText(audit)
        : [
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
