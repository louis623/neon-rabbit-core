import { z } from 'zod'

export const PUBLIC_HANDOFF_MAX_BODY_BYTES = 12_000
export const PUBLIC_HANDOFF_MAX_QUESTION_LENGTH = 2_000

export const publicNicNacHandoffSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  question: z.string().trim().min(3).max(PUBLIC_HANDOFF_MAX_QUESTION_LENGTH),
  contactConsent: z.literal(true),
  website: z.string().max(0).optional(),
})

export function buildPublicNicNacHandoffInsert(
  input: z.infer<typeof publicNicNacHandoffSchema>,
) {
  return {
    name: input.name,
    email: input.email,
    phone: null,
    tiktok_handle: null,
    team_rep_name: null,
    setup_pain: null,
    source: 'public_nic_nac',
    lead_status: 'inquiry',
    sms_consent: false,
    email_consent: false,
    welcome_email_status: 'skipped',
    welcome_email_error: 'Inquiry only; no marketing enrollment or welcome email.',
    operator_notes: [
      'PUBLIC NIC-NAC QUESTION — not a build-queue signup or founder reservation.',
      'Visitor agreed to an email reply about this question only. No marketing consent.',
      '',
      input.question,
    ].join('\n'),
  }
}

export class PublicHandoffBodyTooLargeError extends Error {}

export async function readPublicHandoffBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let bytes = 0
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > PUBLIC_HANDOFF_MAX_BODY_BYTES) {
        await reader.cancel()
        throw new PublicHandoffBodyTooLargeError()
      }
      text += decoder.decode(value, { stream: true })
    }
    return text + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}
