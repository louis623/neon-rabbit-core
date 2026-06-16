import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TradeBoardIntakePhotoState,
  TradeBoardIntakeSessionState,
} from './trade-board-intake-types'

export type TradeBoardIntakeSessionPatch = {
  status?: string
  current_phase?: string
  item_number?: string | null
  quantity?: number | null
  design_name?: string | null
  collection_name?: string | null
  collection_year?: number | null
  material?: string | null
  main_stone?: string | null
  bp_msrp?: number | null
  ring_size?: string | null
  rep_notes?: string | null
  trade_preferences?: string | null
  missing_fields?: string[]
  hard_blockers?: string[]
  soft_warnings?: string[]
  created_listing_ids?: string[]
  created_design_id?: string | null
  last_user_message_id?: string | null
  metadata?: Record<string, unknown>
  updated_at?: string
}

export function mapTradeBoardIntakeSessionRow(
  row: Record<string, unknown>,
): TradeBoardIntakeSessionState {
  const photos = (
    (row.trade_board_intake_photos as Array<Record<string, unknown>> | null) ??
    []
  ).map(mapTradeBoardIntakePhotoRow)

  return {
    id: row.id as string,
    repId: row.rep_id as string,
    conversationId: row.conversation_id as string,
    workflowType: 'trade_board_add_listing',
    status: row.status as TradeBoardIntakeSessionState['status'],
    phase: row.current_phase as TradeBoardIntakeSessionState['phase'],
    known: {
      ...(row.item_number ? { itemNumber: row.item_number as string } : {}),
      ...(row.quantity ? { quantity: row.quantity as number } : {}),
      ...(row.design_name ? { designName: row.design_name as string } : {}),
      ...(row.collection_name
        ? { collectionName: row.collection_name as string }
        : {}),
      ...(row.collection_year
        ? { collectionYear: row.collection_year as number }
        : {}),
      ...(row.material ? { material: row.material as string } : {}),
      ...(row.main_stone ? { mainStone: row.main_stone as string } : {}),
      ...(row.bp_msrp ? { bpMsrp: Number(row.bp_msrp) } : {}),
      ...(row.ring_size ? { ringSize: row.ring_size as string } : {}),
      ...(row.rep_notes ? { repNotes: row.rep_notes as string } : {}),
      ...(row.trade_preferences
        ? { tradePreferences: row.trade_preferences as string }
        : {}),
    },
    missing: (row.missing_fields as string[] | null) ?? [],
    blockers: (row.hard_blockers as string[] | null) ?? [],
    warnings: (row.soft_warnings as string[] | null) ?? [],
    photos,
    createdListingIds:
      ((row.created_listing_ids as string[] | null) ?? undefined) || undefined,
    ...(row.created_design_id
      ? { createdDesignId: row.created_design_id as string }
      : {}),
    ...(row.last_user_message_id
      ? { lastUserMessageId: row.last_user_message_id as string }
      : {}),
    ...(row.created_at ? { createdAt: row.created_at as string } : {}),
    ...(row.updated_at ? { updatedAt: row.updated_at as string } : {}),
    ...(row.expires_at ? { expiresAt: row.expires_at as string } : {}),
  }
}

export function mapTradeBoardIntakePhotoRow(
  row: Record<string, unknown>,
): TradeBoardIntakePhotoState {
  return {
    id: row.id as string,
    ...(row.conversation_message_id
      ? { conversationMessageId: row.conversation_message_id as string }
      : {}),
    attachmentIndex: row.attachment_index as number,
    declaredRole:
      row.declared_role as TradeBoardIntakePhotoState['declaredRole'],
    visualRole: row.visual_role as TradeBoardIntakePhotoState['visualRole'],
    roleConfirmed: Boolean(row.role_confirmed),
    ...(row.image_url ? { imageUrl: row.image_url as string } : {}),
    quality: row.quality as TradeBoardIntakePhotoState['quality'],
    ...(row.quality_score !== null && row.quality_score !== undefined
      ? { qualityScore: row.quality_score as number }
      : {}),
    qualityIssues: (row.quality_issues as string[] | null) ?? [],
    notes: (row.notes as string[] | null) ?? [],
  }
}

export async function getActiveTradeBoardIntakeSession(
  supabase: SupabaseClient,
  args: { repId: string; conversationId: string; nowIso: string },
): Promise<TradeBoardIntakeSessionState | null> {
  const { data, error } = await supabase
    .from('trade_board_intake_sessions')
    .select('*')
    .eq('rep_id', args.repId)
    .eq('conversation_id', args.conversationId)
    .eq('status', 'active')
    .gt('expires_at', args.nowIso)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: photos, error: photoError } = await supabase
    .from('trade_board_intake_photos')
    .select('*')
    .eq('session_id', (data as { id: string }).id)
    .order('created_at', { ascending: true })
  if (photoError) throw photoError

  return mapTradeBoardIntakeSessionRow({
    ...(data as Record<string, unknown>),
    trade_board_intake_photos: photos ?? [],
  })
}

export async function createTradeBoardIntakeSession(
  supabase: SupabaseClient,
  args: {
    repId: string
    conversationId: string
    lastUserMessageId?: string
  },
): Promise<TradeBoardIntakeSessionState> {
  const { data, error } = await supabase
    .from('trade_board_intake_sessions')
    .insert({
      rep_id: args.repId,
      conversation_id: args.conversationId,
      workflow_type: 'trade_board_add_listing',
      status: 'active',
      current_phase: 'started',
      last_user_message_id: args.lastUserMessageId ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapTradeBoardIntakeSessionRow(data as Record<string, unknown>)
}

export async function updateTradeBoardIntakeSession(
  supabase: SupabaseClient,
  args: { sessionId: string; patch: TradeBoardIntakeSessionPatch },
): Promise<void> {
  const { error } = await supabase
    .from('trade_board_intake_sessions')
    .update({ ...args.patch, updated_at: new Date().toISOString() })
    .eq('id', args.sessionId)

  if (error) throw error
}

export async function upsertTradeBoardIntakePhoto(
  supabase: SupabaseClient,
  args: {
    sessionId: string
    repId: string
    conversationId: string
    conversationMessageId?: string
    attachmentIndex: number
    declaredRole: TradeBoardIntakePhotoState['declaredRole']
    visualRole: TradeBoardIntakePhotoState['visualRole']
    roleConfirmed: boolean
    imageUrl?: string
    quality: TradeBoardIntakePhotoState['quality']
    qualityIssues: string[]
    notes: string[]
    ocrOrVisionSummary?: string
  },
): Promise<void> {
  const { error } = await supabase.from('trade_board_intake_photos').upsert(
    {
      session_id: args.sessionId,
      rep_id: args.repId,
      conversation_id: args.conversationId,
      conversation_message_id: args.conversationMessageId ?? null,
      attachment_index: args.attachmentIndex,
      declared_role: args.declaredRole,
      visual_role: args.visualRole,
      role_confirmed: args.roleConfirmed,
      image_url: args.imageUrl ?? null,
      quality: args.quality,
      quality_issues: args.qualityIssues,
      notes: args.notes,
      ocr_or_vision_summary: args.ocrOrVisionSummary ?? null,
    },
    { onConflict: 'session_id,conversation_message_id,attachment_index' },
  )

  if (error) throw error
}
