import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { ServiceError } from '@/lib/services/errors'
import { requireRepConversationMembership } from '@/lib/services/workspace-conversation-permissions'

const BUCKET = 'workspace-support-attachments'
const MAX_BYTES = 8 * 1024 * 1024
const MAX_DIMENSION = 2400

type AttachmentRow = {
  id: string
  conversation_id: string
  content_type: string
  byte_size: number
  width: number
  height: number
  attachment_slot: number
  created_at: string
}

const FORMAT: Record<string, { extension: 'jpg' | 'png' | 'webp'; contentType: 'image/jpeg' | 'image/png' | 'image/webp' }> = {
  jpeg: { extension: 'jpg', contentType: 'image/jpeg' },
  png: { extension: 'png', contentType: 'image/png' },
  webp: { extension: 'webp', contentType: 'image/webp' },
}

async function requireSupportConversation(supabase: SupabaseClient, conversationId: string) {
  const { data, error } = await supabase.from('workspace_conversations').select('id, conversation_type, state').eq('id', conversationId).maybeSingle()
  if (error || !data || data.conversation_type !== 'support') {
    throw new ServiceError({ code: 'SUPPORT_CONVERSATION_NOT_FOUND', message: 'support conversation required for attachment', userMessage: 'Screenshots can be added only to a Support conversation.', statusCode: 404, cause: error })
  }
  return data
}

async function prepareImage(input: Buffer) {
  if (input.byteLength < 1 || input.byteLength > MAX_BYTES) {
    throw new ServiceError({ code: 'ATTACHMENT_SIZE_INVALID', message: 'support screenshot exceeds size limit', userMessage: 'Choose an image smaller than 8 MB.', statusCode: 413 })
  }
  let metadata: sharp.Metadata
  try {
    metadata = await sharp(input, { limitInputPixels: 40_000_000, animated: false }).metadata()
  } catch (error) {
    throw new ServiceError({ code: 'ATTACHMENT_IMAGE_INVALID', message: 'support attachment is not a decodable image', userMessage: 'Choose a JPEG, PNG, or WebP screenshot.', statusCode: 415, cause: error })
  }
  const format = metadata.format ? FORMAT[metadata.format] : undefined
  if (!format || (metadata.pages ?? 1) > 1) {
    throw new ServiceError({ code: 'ATTACHMENT_TYPE_INVALID', message: 'unsupported or animated support image', userMessage: 'Choose a JPEG, PNG, or WebP screenshot.', statusCode: 415 })
  }
  let pipeline = sharp(input, { limitInputPixels: 40_000_000, animated: false })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
  if (metadata.format === 'jpeg') pipeline = pipeline.jpeg({ quality: 86, mozjpeg: true })
  else if (metadata.format === 'png') pipeline = pipeline.png({ compressionLevel: 9 })
  else pipeline = pipeline.webp({ quality: 84 })
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  if (data.byteLength > MAX_BYTES) {
    throw new ServiceError({ code: 'ATTACHMENT_SIZE_INVALID', message: 'processed support screenshot exceeds size limit', userMessage: 'Choose a smaller screenshot.', statusCode: 413 })
  }
  return { data, width: info.width, height: info.height, ...format }
}

function attachmentDto(row: AttachmentRow, created: boolean) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    contentType: row.content_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    slot: row.attachment_slot,
    createdAt: row.created_at,
    created,
  }
}

async function findExistingAttachment(
  supabase: SupabaseClient,
  conversationId: string,
  input: { clientRequestId?: string; contentSha256?: string },
) {
  const select = 'id, conversation_id, content_type, byte_size, width, height, attachment_slot, created_at'
  if (input.clientRequestId) {
    const byRequest = await supabase
      .from('workspace_conversation_attachments')
      .select(select)
      .eq('conversation_id', conversationId)
      .eq('client_request_id', input.clientRequestId)
      .maybeSingle()
    if (byRequest.error) throw byRequest.error
    if (byRequest.data) return byRequest.data as unknown as AttachmentRow
  }
  if (input.contentSha256) {
    const byContent = await supabase
      .from('workspace_conversation_attachments')
      .select(select)
      .eq('conversation_id', conversationId)
      .eq('content_sha256', input.contentSha256)
      .maybeSingle()
    if (byContent.error) throw byContent.error
    if (byContent.data) return byContent.data as unknown as AttachmentRow
  }
  return null
}

export async function createSupportConversationAttachment(
  supabase: SupabaseClient,
  input: { repId: string; conversationId: string; file: Buffer; clientRequestId?: string },
) {
  const membership = await requireRepConversationMembership(supabase, input.repId, input.conversationId)
  if (membership.membershipState !== 'active') throw new ServiceError({ code: 'CONVERSATION_FORBIDDEN', message: 'active support membership required', statusCode: 403 })
  await requireSupportConversation(supabase, input.conversationId)
  const clientRequestId = input.clientRequestId?.trim()
  if (clientRequestId && clientRequestId.length > 180) {
    throw new ServiceError({ code: 'ATTACHMENT_REQUEST_INVALID', message: 'attachment client request id is too long', userMessage: 'That screenshot request is not valid.', statusCode: 400 })
  }
  const existingRequest = clientRequestId
    ? await findExistingAttachment(supabase, input.conversationId, { clientRequestId })
    : null
  if (existingRequest) return attachmentDto(existingRequest, false)
  const prepared = await prepareImage(input.file)
  const contentSha256 = createHash('sha256').update(prepared.data).digest('hex')
  const existingContent = await findExistingAttachment(supabase, input.conversationId, { contentSha256 })
  if (existingContent) return attachmentDto(existingContent, false)
  const attachmentId = randomUUID()
  const objectPath = `${input.conversationId}/${attachmentId}.${prepared.extension}`
  const upload = await supabase.storage.from(BUCKET).upload(objectPath, prepared.data, { contentType: prepared.contentType, upsert: false, cacheControl: 'private, max-age=0' })
  if (upload.error) throw new ServiceError({ code: 'ATTACHMENT_UPLOAD_FAILED', message: 'private screenshot upload failed', userMessage: 'That screenshot could not be uploaded right now.', statusCode: 500, cause: upload.error })
  try {
    for (const slot of [1, 2, 3]) {
      const inserted = await supabase.from('workspace_conversation_attachments').insert({
        id: attachmentId,
        conversation_id: input.conversationId,
        uploaded_by_rep_id: input.repId,
        attachment_slot: slot,
        object_path: objectPath,
        client_request_id: clientRequestId || null,
        content_sha256: contentSha256,
        content_type: prepared.contentType,
        byte_size: prepared.data.byteLength,
        width: prepared.width,
        height: prepared.height,
      }).select('id, conversation_id, content_type, byte_size, width, height, attachment_slot, created_at').maybeSingle()
      if (inserted.data) return attachmentDto(inserted.data as unknown as AttachmentRow, true)
      if ((inserted.error as { code?: string } | null)?.code !== '23505') throw inserted.error ?? new Error('attachment row missing')
      const duplicate = await findExistingAttachment(supabase, input.conversationId, { clientRequestId, contentSha256 })
      if (duplicate) {
        await supabase.storage.from(BUCKET).remove([objectPath])
        return attachmentDto(duplicate, false)
      }
    }
    throw new ServiceError({ code: 'ATTACHMENT_LIMIT_REACHED', message: 'support screenshot limit reached', userMessage: 'You can attach up to three screenshots.', statusCode: 409 })
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([objectPath])
    throw error
  }
}

export async function createSupportAttachmentSignedRead(
  supabase: SupabaseClient,
  input: { conversationId: string; attachmentId: string; repId?: string; operatorAuthorized?: boolean },
) {
  if (!input.operatorAuthorized) {
    if (!input.repId) throw new ServiceError({ code: 'CONVERSATION_FORBIDDEN', message: 'attachment actor required', statusCode: 403 })
    await requireRepConversationMembership(supabase, input.repId, input.conversationId)
  }
  await requireSupportConversation(supabase, input.conversationId)
  const attachment = await supabase.from('workspace_conversation_attachments').select('id, object_path').eq('id', input.attachmentId).eq('conversation_id', input.conversationId).maybeSingle()
  if (attachment.error || !attachment.data) throw new ServiceError({ code: 'ATTACHMENT_NOT_FOUND', message: 'support attachment not found', statusCode: 404, cause: attachment.error })
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(attachment.data.object_path as string, 300)
  if (signed.error || !signed.data?.signedUrl) throw new ServiceError({ code: 'ATTACHMENT_SIGN_FAILED', message: 'failed to sign private screenshot read', userMessage: 'That screenshot could not be opened right now.', statusCode: 500, cause: signed.error })
  return { attachmentId: input.attachmentId, url: signed.data.signedUrl, expiresIn: 300 }
}
