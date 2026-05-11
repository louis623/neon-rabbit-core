import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { ServiceError } from '@/lib/services/errors'
import { getSiteAnalyticsDashboard } from '@/lib/services/site-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()
    const summary = await getSiteAnalyticsDashboard({
      supabase: createAdminClient(),
      repId,
    })
    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.userMessage },
        { status: error.statusCode },
      )
    }
    throw error
  }
}
