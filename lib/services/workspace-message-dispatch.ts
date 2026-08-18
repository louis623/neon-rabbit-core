import { randomUUID } from 'node:crypto'
import { after } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { processWorkspaceMessageAutomation } from '@/lib/services/workspace-message-automation'

/**
 * Gives signup and resource events an immediate best-effort worker kick after
 * the HTTP response. The database outbox remains the source of truth, and the
 * daily cron recovers anything this serverless invocation cannot finish.
 */
export function dispatchWorkspaceMessageAutomationAfterResponse(args: {
  supabase: SupabaseClient
  source: 'customer_signup' | 'resource_publish'
}) {
  after(async () => {
    try {
      await processWorkspaceMessageAutomation({
        supabase: args.supabase,
        workerId: `${args.source}-${Date.now()}-${randomUUID()}`,
        limit: 25,
      })
    } catch (error) {
      console.error(`[workspace-messages] ${args.source} dispatch failed`, error)
    }
  })
}
