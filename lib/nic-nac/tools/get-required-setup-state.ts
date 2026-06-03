import { tool } from 'ai'
import { z } from 'zod'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import type { ToolDefinition } from './types'

const inputSchema = z.object({})

export const getRequiredSetupStateTool: ToolDefinition = {
  name: 'get_required_setup_state',
  readOnly: true,
  build: (ctx) =>
    tool({
      description: 'Read the current required Nic-Nac setup state for this rep.',
      inputSchema,
      execute: async () => getRequiredSetupState(ctx.repId),
    }),
}
