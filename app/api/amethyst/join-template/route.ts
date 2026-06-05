import { NextResponse } from 'next/server'

import { buildAmethystJoinBootstrapScript } from '@/lib/amethyst/join-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'

export async function GET(request: Request) {
  const repId = resolveAmethystRequestRepId(request)
  const targeted = Boolean(repId)
  const templateData = await loadAmethystPreviewTemplateData({ repId })

  return new NextResponse(
    buildAmethystJoinBootstrapScript(
      templateData.join,
      templateData.appearancePreset,
      { targeted },
    ),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
