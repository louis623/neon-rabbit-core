import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getPublishedSiteConfig } from '@/lib/team-onboarding/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const { siteSlug } = await params
  const admin = createAdminClient()
  const config = await getPublishedSiteConfig(admin, siteSlug)

  if (!config) {
    return NextResponse.json(
      { error: 'Onboarding site not found.' },
      { status: 404 },
    )
  }

  return NextResponse.json(config)
}
