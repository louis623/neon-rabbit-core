import { NextResponse } from 'next/server'

import {
  BUG_HUNT_ITEM_TYPES,
  BUG_HUNT_SELECT,
  BUG_HUNT_STATUSES,
  normalizeBugHuntItem,
  type BugHuntItemType,
  type BugHuntStatus,
} from '@/lib/control-center/bug-hunt'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getControlCenterAccess, OperatorAuthError } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function text(value: unknown, limit = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function isItemType(value: string): value is BugHuntItemType {
  return (BUG_HUNT_ITEM_TYPES as readonly string[]).includes(value)
}

function isStatus(value: string): value is BugHuntStatus {
  return (BUG_HUNT_STATUSES as readonly string[]).includes(value)
}

function errorResponse(error: unknown) {
  if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  if (error instanceof OperatorAuthError) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  console.error('[control-center/bug-hunt] Error:', error)
  return NextResponse.json({ error: 'Unable to save the Bug Hunt item.' }, { status: 500 })
}

export async function POST(request: Request) {
  try {
    await getControlCenterAccess()
    const body = (await request.json()) as Record<string, unknown>
    const title = text(body.title, 240)
    const itemType = text(body.itemType, 30)
    if (!title) return NextResponse.json({ error: 'A task title is required.' }, { status: 400 })
    if (!isItemType(itemType)) return NextResponse.json({ error: 'Choose a valid task type.' }, { status: 400 })

    const { data, error } = await createAdminClient()
      .from('sparkle_suite_bug_hunt_items')
      .insert({
        title,
        item_type: itemType,
        details: text(body.details) || null,
        owner: text(body.owner, 160) || null,
        source: text(body.source, 240) || null,
      })
      .select(BUG_HUNT_SELECT)
      .single()
    if (error || !data) throw error ?? new Error('Bug Hunt insert returned no row')
    return NextResponse.json({ item: normalizeBugHuntItem(data) }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await getControlCenterAccess()
    const body = (await request.json()) as Record<string, unknown>
    const id = text(body.id, 80)
    if (!id) return NextResponse.json({ error: 'A task is required.' }, { status: 400 })

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if ('details' in body) update.details = text(body.details) || null
    if ('owner' in body) update.owner = text(body.owner, 160) || null
    if ('status' in body) {
      const status = text(body.status, 30)
      if (!isStatus(status)) return NextResponse.json({ error: 'Choose a valid status.' }, { status: 400 })
      update.status = status
      update.completed_at = status === 'complete' ? new Date().toISOString() : null
    }
    if (Object.keys(update).length === 1) return NextResponse.json({ error: 'No update was supplied.' }, { status: 400 })

    const { data, error } = await createAdminClient()
      .from('sparkle_suite_bug_hunt_items')
      .update(update)
      .eq('id', id)
      .select(BUG_HUNT_SELECT)
      .single()
    if (error || !data) throw error ?? new Error('Bug Hunt update returned no row')
    return NextResponse.json({ item: normalizeBugHuntItem(data) })
  } catch (error) {
    return errorResponse(error)
  }
}
