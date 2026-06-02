import { NextResponse } from 'next/server'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const context = await getAuthenticatedNicNacContext()

    return NextResponse.json({
      sites: [],
      repId: context.repId,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    throw error
  }
}
