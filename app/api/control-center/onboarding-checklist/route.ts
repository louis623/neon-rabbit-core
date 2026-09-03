import { NextResponse } from 'next/server'

import {
  isOperatorOnboardingChecklistItemKey,
  isOperatorOnboardingChecklistStatus,
  type OperatorOnboardingChecklistEntry,
} from '@/lib/control-center/operator-onboarding-checklist'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getControlCenterAccess, OperatorAuthError } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function errorResponse(error: unknown) {
  if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  if (error instanceof OperatorAuthError) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  console.error('[control-center/onboarding-checklist] Error:', error)
  return NextResponse.json({ error: 'Unable to save the onboarding checklist item.' }, { status: 500 })
}

export async function PATCH(request: Request) {
  try {
    const access = await getControlCenterAccess()
    const body = (await request.json()) as Record<string, unknown>
    const repId = text(body.repId, 100)
    const itemKey = text(body.itemKey, 100)
    const status = text(body.status, 40)
    if (!repId) return NextResponse.json({ error: 'A customer is required.' }, { status: 400 })
    if (!isOperatorOnboardingChecklistItemKey(itemKey)) return NextResponse.json({ error: 'Choose a valid onboarding checklist item.' }, { status: 400 })
    if (!isOperatorOnboardingChecklistStatus(status)) return NextResponse.json({ error: 'Choose a valid checklist status.' }, { status: 400 })

    const now = new Date().toISOString()
    const { data, error } = await createAdminClient()
      .from('operator_onboarding_checklist_items')
      .upsert({
        rep_id: repId,
        item_key: itemKey,
        status,
        evidence_summary: text(body.evidenceSummary, 1200) || null,
        updated_by_rep_id: access.operator.repId,
        completed_at: status === 'complete' ? now : null,
        updated_at: now,
      }, { onConflict: 'rep_id,item_key' })
      .select('item_key, status, evidence_summary, updated_at, completed_at')
      .single()
    if (error || !data) throw error ?? new Error('Onboarding checklist update returned no row')

    const item: OperatorOnboardingChecklistEntry = {
      itemKey,
      status,
      evidenceSummary: typeof data.evidence_summary === 'string' ? data.evidence_summary : null,
      updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
      completedAt: typeof data.completed_at === 'string' ? data.completed_at : null,
    }
    return NextResponse.json({ item })
  } catch (error) {
    return errorResponse(error)
  }
}
