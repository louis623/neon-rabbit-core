import { NextResponse } from 'next/server'

import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { loadAmethystHomepageUpcomingShows } from '@/lib/amethyst/homepage-upcoming-shows'
import {
  buildAmethystHomepageBootstrapScript,
  enrichAmethystHomepageFeatureData,
} from '@/lib/amethyst/homepage-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import {
  applyPublicSiteSlugToHomepageEvents,
  applyPublicSiteSlugToTemplateData,
} from '@/lib/amethyst/public-site-links'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import {
  getLiveQueueSnapshot,
  getLiveQueueSyncCodeForRep,
} from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LiveQueueSnapshot } from '@/lib/services/types'

export const dynamic = 'force-dynamic'

async function loadHomepageLiveQueueSnapshot(
  repId: string | null,
): Promise<LiveQueueSnapshot | null> {
  if (
    !repId ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null
  }

  try {
    const admin = createAdminClient()
    const syncCode = await getLiveQueueSyncCodeForRep(admin, repId)
    return getLiveQueueSnapshot(admin, { repId, syncCode })
  } catch {
    return null
  }
}

async function resolveHomepageFeatureRepId(lookupTarget: {
  publicSiteSlug?: string
  repId?: string | null
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return lookupTarget.repId?.trim() || null
  }

  try {
    const admin = createAdminClient()
    const rep = await resolveAmethystPreviewRep(admin, {
      env: process.env,
      ...lookupTarget,
      select: 'id, email',
    })
    return rep?.id ?? lookupTarget.repId?.trim() ?? null
  } catch {
    return lookupTarget.repId?.trim() || null
  }
}

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  const repId = target.repId ?? target.customDomain
  const targeted = target.targeted
  const publicSiteSlug = target.publicSiteSlug
  const lookupTarget = {
    ...(publicSiteSlug ? { publicSiteSlug } : {}),
    repId,
  }
  const [events, templateData] = await Promise.all([
    loadAmethystHomepageUpcomingShows({ ...lookupTarget, targeted }),
    loadAmethystPreviewTemplateData(lookupTarget),
  ])
  const featureRepId = targeted
    ? await resolveHomepageFeatureRepId(lookupTarget)
    : null
  const [tradeBoardListings, liveQueueSnapshot] = targeted
    ? await Promise.all([
        loadAmethystTradeBoardPreviewListings({
          ...lookupTarget,
          repId: featureRepId,
          targeted: true,
          limit: 8,
        }),
        loadHomepageLiveQueueSnapshot(featureRepId),
      ])
    : [[], null]
  const linkedTemplateData = applyPublicSiteSlugToTemplateData(
    templateData,
    publicSiteSlug,
  )
  const linkedEvents = applyPublicSiteSlugToHomepageEvents(events, publicSiteSlug)

  return new NextResponse(
    buildAmethystHomepageBootstrapScript(
      enrichAmethystHomepageFeatureData(linkedTemplateData.homepage, {
        liveQueueSnapshot,
        tradeBoardListings,
      }),
      linkedEvents,
      linkedTemplateData.appearancePreset,
      { publicSiteSlug, repId, targeted },
    ),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
