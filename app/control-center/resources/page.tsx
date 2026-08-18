import { redirect } from 'next/navigation'
import { ResourcePublisher } from '@/app/control-center/_components/ResourcePublisher'
import { listOperatorWorkspaceResources } from '@/lib/services/workspace-resources'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ControlCenterResourcesPage() {
  try {
    await getControlCenterAccess()
  } catch (error) {
    if (error instanceof AuthError) redirect('/control-center/login')
    if (error instanceof OperatorAuthError) {
      return <main className="p-8">Operator access required.</main>
    }
    throw error
  }

  const resources = await listOperatorWorkspaceResources(createAdminClient())
  return <ResourcePublisher initialResources={resources} />
}
