import { NextResponse } from 'next/server'
import { getAuthenticatedNicNacContext, AuthError } from '@/lib/nic-nac/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { rep } = await getAuthenticatedNicNacContext()
    return NextResponse.json({
      rep: { id: rep.id, email: rep.email, display_name: rep.display_name },
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw err
  }
}
