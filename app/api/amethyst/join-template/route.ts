import { NextResponse } from 'next/server'

import { buildAmethystJoinBootstrapScript } from '@/lib/amethyst/join-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'

export async function GET() {
  const templateData = await loadAmethystPreviewTemplateData()

  return new NextResponse(buildAmethystJoinBootstrapScript(templateData.join), {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
