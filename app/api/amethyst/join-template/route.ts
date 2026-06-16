import { NextResponse } from 'next/server'

import { buildAmethystJoinBootstrapScript } from '@/lib/amethyst/join-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  const repId = target.repId ?? target.customDomain
  const targeted = target.targeted
  const publicSiteSlug = target.publicSiteSlug
  const templateData = await loadAmethystPreviewTemplateData({
    ...(publicSiteSlug ? { publicSiteSlug } : {}),
    repId,
  })

  return new NextResponse(
    buildAmethystJoinBootstrapScript(
      templateData.join,
      templateData.appearancePreset,
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
