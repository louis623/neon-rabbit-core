import { redirect } from 'next/navigation'

import {
  SupportCommandCenter,
  type OperatorCustomerRecord,
  type SupportReportRecord,
} from '@/app/control-center/_components/SupportCommandCenter'
import { listOperatorCustomerProfiles } from '@/lib/services/client-account-profiles'
import { listOperatorSupportReports } from '@/lib/services/support-reports'
import { loadCustomerWaitlist } from '@/lib/prelaunch/customer-waitlist'
import { loadBugHuntItems } from '@/lib/control-center/bug-hunt'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getControlCenterAccess,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SparkleSuiteControlCenterPage() {
  try {
    await getControlCenterAccess()
  } catch (error) {
    redirect('/control-center/login')
  }

  const admin = createAdminClient()
  const [reports, customers, waitlist, bugHuntItems] = await Promise.all([
    listOperatorSupportReports(admin, {
      limit: 50,
    }),
    listOperatorCustomerProfiles(admin, {
      limit: 200,
    }),
    loadCustomerWaitlist(admin),
    loadBugHuntItems(admin),
  ])

  return (
    <SupportCommandCenter
      customers={customers as unknown as OperatorCustomerRecord[]}
      reports={reports as unknown as SupportReportRecord[]}
      waitlist={waitlist}
      bugHuntItems={bugHuntItems}
    />
  )
}
