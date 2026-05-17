import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { ServiceError } from '@/lib/services/errors'
import { getAccountBillingDashboard } from '@/lib/services/account-billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { repId, rep } = await getAuthenticatedRep()
    const summary = await getAccountBillingDashboard({
      supabase: createAdminClient(),
      repId,
      stripeCustomerId: rep.stripe_customer_id,
    })

    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.userMessage,
        },
        { status: error.statusCode },
      )
    }

    throw error
  }
}
