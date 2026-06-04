import { tool } from 'ai'
import { z } from 'zod'
import {
  completeRequiredSetupStep,
  unlockRequiredSetup,
} from '@/lib/self-serve/required-setup'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  repApprovedPreview: z.boolean(),
})

export const unlockRequiredSetupTool: ToolDefinition = {
  name: 'unlock_required_setup',
  readOnly: false,
  build: (ctx) =>
    tool({
      description:
        'Unlock the full Sparkle Suite workspace after required setup is complete and the rep approves the final preview.',
      inputSchema,
      execute: async ({ repApprovedPreview }) => {
        if (!repApprovedPreview) {
          throw new Error('The rep must approve the final preview before unlock.')
        }

        await completeRequiredSetupStep(ctx.repId, 'final_preview_approval', {
          repApprovedPreview: true,
        })
        return unlockRequiredSetup(ctx.repId)
      },
    }),
}
