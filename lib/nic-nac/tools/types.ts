// Shared types for the Nic-Nac tool registry. Every tool file under
// lib/nic-nac/tools/ exports a ToolDefinition that the barrel
// (lib/nic-nac/tools/index.ts) feeds into buildAllTools(ctx).

import type { Tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CalendarWorkflowSessionState } from '@/lib/nic-nac/workflows/calendar-workflow-types'
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'

export type ToolContext = {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
  latestUserText?: string
  activeTradeBoardWorkflow?: TradeBoardIntakeSessionState | null
  activeCalendarWorkflow?: CalendarWorkflowSessionState | null
}

export type ToolDefinition = {
  name: string
  /**
   * Read-only tools are eligible for Tier 1 transient retry.
   * Write/mutation tools must be false to avoid double-applying side effects.
   */
  readOnly: boolean
  build: (ctx: ToolContext) => Tool
}
