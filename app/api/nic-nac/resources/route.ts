import { NextResponse } from 'next/server'
import { getHelpResources } from '@/lib/services/help-resources'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('query') ?? ''
  return NextResponse.json(getHelpResources(query))
}
