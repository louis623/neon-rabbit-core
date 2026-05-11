// Server-side jewelry photo upload utility. Used by the Thumper add_listing
// handler when a rep sends a photo of a NEW design (not yet in the jewelry
// database). The handler extracts the most recent image part from the
// persisted user message in thumper_conversations, calls uploadJewelryPhoto,
// and passes the returned public URL into createDesign() as piecePhotoUrl.
//
// Uses the service-role client so the upload is not subject to storage.objects
// INSERT RLS — RLS is defense-in-depth for any future client-side direct
// upload path. We always write under a {rep_id}/ folder convention so RLS
// would still gate cross-rep writes if it ever ran.

import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

const PUBLIC_BUCKET = 'jewelry-photos'
const STAGING_BUCKET = 'jewelry-photo-staging'
const STAGING_URL_TTL_SECONDS = 60 * 60

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

function parseDataUrl(input: string): { mime: string; base64: string } {
  // Accepts data:image/...;base64,XXXX or raw base64.
  const match = /^data:([^;]+);base64,(.+)$/.exec(input)
  if (match) return { mime: match[1], base64: match[2] }
  return { mime: 'image/jpeg', base64: input }
}

// Strip path separators and odd characters from caller-supplied filenames so
// they can't escape the {rep_id}/ folder convention RLS depends on.
function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 80)
  return cleaned || randomUUID()
}

function stripKnownExtension(name: string): string {
  return name.replace(/\.(jpe?g|png|webp|heic)$/i, '')
}

function toBuffer(data: Buffer | Uint8Array | ArrayBuffer): Buffer {
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) return Buffer.from(data)
  return Buffer.from(data)
}

export async function uploadJewelryPhoto(
  repId: string,
  base64Data: string,
  filename?: string,
): Promise<string> {
  const admin = createAdminClient()
  const { mime, base64 } = parseDataUrl(base64Data)
  const ext = MIME_EXT[mime.toLowerCase()] ?? 'jpg'
  const safeName = filename ? sanitizeFilename(filename) : randomUUID()
  const key = `${repId}/${safeName}.${ext}`
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await admin.storage
    .from(PUBLIC_BUCKET)
    .upload(key, buffer, { contentType: mime, upsert: false })
  if (error) throw error

  const { data } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(key)
  return data.publicUrl
}

export async function uploadStagedOriginalPhoto(
  repId: string,
  base64Data: string,
  filename?: string,
): Promise<{ objectPath: string; signedUrl: string }> {
  const admin = createAdminClient()
  const { mime, base64 } = parseDataUrl(base64Data)
  const ext = MIME_EXT[mime.toLowerCase()] ?? 'jpg'
  const baseName = filename
    ? sanitizeFilename(stripKnownExtension(filename))
    : randomUUID()
  const key = `${repId}/${randomUUID()}-${baseName}.${ext}`
  const buffer = Buffer.from(base64, 'base64')

  const bucket = admin.storage.from(STAGING_BUCKET)
  const { error } = await bucket.upload(key, buffer, {
    contentType: mime,
    upsert: false,
  })
  if (error) throw error

  const signed = await bucket.createSignedUrl(key, STAGING_URL_TTL_SECONDS)
  if (signed.error) throw signed.error

  return {
    objectPath: key,
    signedUrl: signed.data.signedUrl,
  }
}

export async function getStagedOriginalPhotoSignedUrl(
  objectPath: string,
  ttlSeconds = STAGING_URL_TTL_SECONDS,
): Promise<string> {
  const admin = createAdminClient()
  const bucket = admin.storage.from(STAGING_BUCKET)
  const signed = await bucket.createSignedUrl(objectPath, ttlSeconds)
  if (signed.error) throw signed.error
  return signed.data.signedUrl
}

export async function publishApprovedPhoto(
  designId: string,
  binaryData: Buffer | Uint8Array | ArrayBuffer,
  options: {
    contentType: string
    filename?: string
  },
): Promise<string> {
  const admin = createAdminClient()
  const ext = MIME_EXT[options.contentType.toLowerCase()] ?? 'jpg'
  const safeName = options.filename
    ? sanitizeFilename(stripKnownExtension(options.filename))
    : randomUUID()
  const key = `approved/${designId}/${safeName}.${ext}`
  const buffer = toBuffer(binaryData)

  const bucket = admin.storage.from(PUBLIC_BUCKET)
  const { error } = await bucket.upload(key, buffer, {
    contentType: options.contentType,
    upsert: true,
  })
  if (error) throw error

  const { data } = bucket.getPublicUrl(key)
  return data.publicUrl
}
