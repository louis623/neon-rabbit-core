import { NextResponse } from 'next/server'

import {
  formatCostCapacityCsv,
  readCostCapacityRuns,
} from '@/lib/remy-communications/nic-nac-cost-capacity'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await getControlCenterAccess()
    const month = new URL(request.url).searchParams.get('month') ?? undefined
    const telemetry = await readCostCapacityRuns(createAdminClient(), month)
    const rows = [...telemetry.suiteRows, ...telemetry.finderRows].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    )
    return new Response(`\ufeff${formatCostCapacityCsv(rows)}`, {
      headers: {
        'cache-control': 'no-store, private',
        'content-disposition': `attachment; filename="nic-nac-cost-capacity-${telemetry.month}.csv"`,
        'content-type': 'text/csv; charset=utf-8',
      },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof OperatorAuthError) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    console.error('[control-center/nic-nac-usage/export]', error)
    return NextResponse.json({ error: 'The monthly usage export could not be prepared.' }, { status: 500 })
  }
}
