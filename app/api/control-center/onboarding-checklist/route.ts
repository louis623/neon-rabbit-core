import { NextResponse } from 'next/server'
import { isOperatorOnboardingChecklistItemKey, type OperatorOnboardingChecklistEntry } from '@/lib/control-center/operator-onboarding-checklist'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getControlCenterAccess, OperatorAuthError } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
function text(value: unknown, limit: number) { return typeof value === 'string' ? value.trim().slice(0, limit) : '' }
function errorResponse(error: unknown) { if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 }); if (error instanceof OperatorAuthError) return NextResponse.json({ error: 'forbidden' }, { status: 403 }); console.error('[control-center/onboarding-checklist] Error:', error); return NextResponse.json({ error: 'Unable to update the onboarding checklist.' }, { status: 500 }) }
export async function PATCH(request: Request) {
  try {
    await getControlCenterAccess()
    const body = (await request.json()) as Record<string, unknown>
    const repId = text(body.repId, 100); const itemKey = text(body.itemKey, 100)
    if (!repId) return NextResponse.json({ error: 'A customer is required.' }, { status: 400 })
    if (!isOperatorOnboardingChecklistItemKey(itemKey)) return NextResponse.json({ error: 'Choose a valid onboarding checklist item.' }, { status: 400 })
    if (typeof body.isCompleted !== 'boolean') return NextResponse.json({ error: 'Choose whether this item is finished.' }, { status: 400 })
    const { data, error } = await createAdminClient().from('operator_onboarding_checklist_items').upsert({ rep_id: repId, item_key: itemKey, is_completed: body.isCompleted, updated_at: new Date().toISOString() }, { onConflict: 'rep_id,item_key' }).select('item_key, is_completed, updated_at').single()
    if (error || !data) throw error ?? new Error('Onboarding checklist update returned no row')
    const item: OperatorOnboardingChecklistEntry = { itemKey, isCompleted: data.is_completed === true, updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null }
    return NextResponse.json({ item })
  } catch (error) { return errorResponse(error) }
}
