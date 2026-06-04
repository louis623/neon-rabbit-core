import { tool } from 'ai'
import { z } from 'zod'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import { getLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'
import type { ToolDefinition } from './types'

const inputSchema = z.object({})

export const getRequiredSetupStateTool: ToolDefinition = {
  name: 'get_required_setup_state',
  readOnly: true,
  build: (ctx) =>
    tool({
      description: 'Read the current required Nic-Nac setup state for this rep.',
      inputSchema,
      execute: async () => {
        const [state, liveQueueSyncCode] = await Promise.all([
          getRequiredSetupState(ctx.repId),
          getLiveQueueSyncCodeForRep(ctx.supabase, ctx.repId),
        ])

        return {
          ...state,
          liveQueueSyncCode,
        }
      },
    }),
}
