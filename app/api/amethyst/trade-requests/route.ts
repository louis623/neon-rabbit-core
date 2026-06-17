import { NextResponse } from 'next/server'

import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import { ServiceError } from '@/lib/services/errors'
import {
  attachTradeRequestRevealScreenshot,
  getTradeRequestNotificationSummary,
  submitTradeRequest,
} from '@/lib/services/trade-requests'
import {
  removeTradeRequestRevealScreenshots,
  uploadTradeRequestRevealScreenshot,
} from '@/lib/services/storage'
import { notifyRepOfTradeRequest } from '@/lib/nic-nac/trade-request-notifications'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const SUPPORTED_SCREENSHOT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

type TradeRequestPayload = {
  listingId: string
  customerName: string
  customerDescription: string
  revealScreenshot: File | null
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

async function readPayload(request: Request): Promise<TradeRequestPayload> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const screenshot = form.get('revealScreenshot')
    return {
      listingId: readString(form.get('listingId')),
      customerName: readString(form.get('customerName')),
      customerDescription: readString(form.get('customerDescription')),
      revealScreenshot: screenshot instanceof File && screenshot.size > 0
        ? screenshot
        : null,
    }
  }

  const body = await request.json()
  return {
    listingId: readString(body?.listingId),
    customerName: readString(body?.customerName),
    customerDescription: readString(body?.customerDescription),
    revealScreenshot: null,
  }
}

async function resolveScreenshotRepId(
  admin: ReturnType<typeof createAdminClient>,
  listingId: string,
) {
  const { data, error } = await admin
    .from('trade_listings')
    .select('rep_id')
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw error
  return (data as { rep_id?: string } | null)?.rep_id ?? null
}

export async function POST(request: Request) {
  try {
    const payload = await readPayload(request)
    const admin = createAdminClient()
    const target = resolveAmethystRequestTarget(request)
    const targetRep = target.targeted
      ? await resolveAmethystPreviewRep(admin, {
          env: process.env,
          publicSiteSlug: target.publicSiteSlug,
          repId: target.repId ?? target.customDomain,
          select: 'id, email',
        })
      : null

    if (target.targeted && !targetRep?.id) {
      return NextResponse.json(
        { error: 'Trade requests are temporarily unavailable right now.' },
        { status: 503 },
      )
    }

    const result = await submitTradeRequest(admin, {
      listingId: payload.listingId,
      customerName: payload.customerName,
      customerDescription: payload.customerDescription,
      expectedRepId: targetRep?.id,
    })

    let screenshotWarning: string | null = null
    if (payload.revealScreenshot) {
      let uploadedScreenshotPath: string | null = null
      try {
        const screenshotRepId =
          targetRep?.id ?? (await resolveScreenshotRepId(admin, result.listingId))
        if (!screenshotRepId) {
          throw new Error('screenshot rep target not found')
        }
        if (!SUPPORTED_SCREENSHOT_TYPES.has(payload.revealScreenshot.type.toLowerCase())) {
          throw new Error('unsupported screenshot type')
        }

        const screenshot = await uploadTradeRequestRevealScreenshot(
          screenshotRepId,
          result.requestId,
          await payload.revealScreenshot.arrayBuffer(),
          {
            contentType: payload.revealScreenshot.type,
            filename: payload.revealScreenshot.name,
          },
        )
        uploadedScreenshotPath = screenshot.objectPath
        await attachTradeRequestRevealScreenshot(admin, result.requestId, screenshot)
      } catch (screenshotError) {
        if (uploadedScreenshotPath) {
          try {
            await removeTradeRequestRevealScreenshots([uploadedScreenshotPath])
          } catch (cleanupError) {
            console.error(
              '[amethyst/trade-requests] Screenshot orphan cleanup error:',
              cleanupError,
            )
          }
        }
        screenshotWarning =
          'Your trade request was sent, but the screenshot could not be attached.'
        console.error(
          '[amethyst/trade-requests] Screenshot upload error:',
          screenshotError,
        )
      }
    }

    try {
      const summary = await getTradeRequestNotificationSummary(
        admin,
        result.requestId,
      )
      if (summary) {
        await notifyRepOfTradeRequest(admin, summary)
      }
    } catch (notificationError) {
      console.error(
        '[amethyst/trade-requests] Notification error:',
        notificationError,
      )
    }

    return NextResponse.json(
      screenshotWarning ? { ...result, warning: screenshotWarning } : result,
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.userMessage,
        },
        { status: error.statusCode },
      )
    }

    console.error('[amethyst/trade-requests] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit trade request.' },
      { status: 500 },
    )
  }
}
