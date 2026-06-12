import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SparkleSuiteDashboardPage() {
  redirect('/control-center')
}
