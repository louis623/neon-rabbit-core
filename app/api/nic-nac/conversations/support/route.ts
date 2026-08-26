import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { createSupportConversation, processSupportConversationFollowup } from '@/lib/services/workspace-support-conversations'
import { createSupportConversationAttachment } from '@/lib/services/workspace-conversation-attachments'
import { getRepConversation } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  type: z.enum(['help_question', 'site_issue', 'bug', 'suggested_upgrade', 'workflow_idea', 'question', 'idea']).transform((value) => (
    value === 'question' ? 'help_question' as const : value === 'idea' ? 'suggested_upgrade' as const : value
  )),
  summary: z.string().trim().min(3).max(160),
  details: z.string().trim().min(2).max(10000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).default('normal'),
  source: z.string().trim().max(180).optional(),
  contactOk: z.boolean().optional(),
  clientRequestId: z.string().trim().min(1).max(180),
  idempotencyKey: z.string().trim().min(1).max(180).optional(),
})

async function readSupportSubmission(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return { body: schema.parse(await request.json()), screenshots: [] as File[] }
  }
  const form = await request.formData()
  const screenshots = [...form.getAll('screenshots'), ...form.getAll('file')]
    .filter((value): value is File => value instanceof File && value.size > 0)
  if (screenshots.length > 3) throw new ServiceError({ code: 'ATTACHMENT_LIMIT_REACHED', message: 'too many support screenshots', userMessage: 'Choose no more than three screenshots.', statusCode: 400 })
  if (screenshots.some((file) => file.size > 8 * 1024 * 1024)) throw new ServiceError({ code: 'ATTACHMENT_SIZE_INVALID', message: 'support screenshot exceeds size limit', userMessage: 'Choose screenshots smaller than 8 MB.', statusCode: 413 })
  const stringValue = (key: string) => {
    const value = form.get(key)
    return typeof value === 'string' && value.trim() ? value : undefined
  }
  return {
    body: schema.parse({
      type: stringValue('type'),
      summary: stringValue('summary'),
      details: stringValue('details'),
      expectedResult: stringValue('expectedResult'),
      actualResult: stringValue('actualResult'),
      urgency: stringValue('urgency'),
      source: stringValue('source'),
      contactOk: stringValue('contactOk') === undefined ? undefined : stringValue('contactOk') === 'true',
      clientRequestId: stringValue('clientRequestId'),
      idempotencyKey: stringValue('idempotencyKey'),
    }),
    screenshots,
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { body, screenshots } = await readSupportSubmission(request)
    const auth = await getAuthenticatedNicNacContext()
    const admin = createAdminClient()
    const result = await createSupportConversation(admin, {
      repId: auth.repId,
      repDisplayName: auth.rep.business_name || auth.rep.display_name,
      type: body.type,
      urgency: body.urgency,
      pageOrWorkflow: body.source,
      title: body.summary,
      details: body.details,
      expectedResult: body.expectedResult,
      actualResult: body.actualResult,
      contactOk: body.contactOk,
      clientRequestId: body.clientRequestId,
      idempotencyKey: body.idempotencyKey ?? body.clientRequestId,
    })
    const attachments = []
    const attachmentWarnings: Array<{ fileName: string; error: string; code?: string }> = []
    for (const [index, file] of screenshots.entries()) {
      try {
        attachments.push(await createSupportConversationAttachment(admin, {
          repId: auth.repId,
          conversationId: result.conversationId,
          file: Buffer.from(await file.arrayBuffer()),
          clientRequestId: `${body.clientRequestId}:attachment:${index + 1}`,
        }))
      } catch (error) {
        attachmentWarnings.push({
          fileName: file.name,
          error: error instanceof ServiceError ? error.userMessage : 'That screenshot could not be uploaded.',
          ...(error instanceof ServiceError ? { code: error.code } : {}),
        })
      }
    }
    const detail = await getRepConversation(admin, auth.repId, result.conversationId)
    after(async () => {
      try {
        await processSupportConversationFollowup(createAdminClient(), result.reportId)
      } catch (error) {
        console.error('[workspace-support] follow-up processing failed', error)
      }
    })
    return NextResponse.json({
      ...result,
      conversation: detail.conversation,
      messages: detail.messages,
      attachments,
      attachmentWarnings,
    }, { status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: 'Check the support message and try again.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    console.error('[workspace-support] create failed', error)
    return NextResponse.json({ error: 'Your support message could not be saved right now.' }, { status: 500 })
  }
}
