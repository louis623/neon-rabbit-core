import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPaidNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import {
  listPublishedWorkspaceResources,
  WORKSPACE_RESOURCE_TYPES,
} from '@/lib/services/workspace-resources'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  type: z.enum(WORKSPACE_RESOURCE_TYPES).optional(),
  query: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const filters = querySchema.parse({
      type: url.searchParams.get('type') || undefined,
      query: url.searchParams.get('query') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    })
    const { supabase } = await getPaidNicNacContext()
    const resources = await listPublishedWorkspaceResources(supabase, filters)
    return NextResponse.json({ resources })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Check the resource filters and try again.' },
        { status: 400 },
      )
    }
    console.error('[nic-nac/resource-library] list failed', error)
    return NextResponse.json(
      { error: 'Resources could not be loaded right now.' },
      { status: 500 },
    )
  }
}
