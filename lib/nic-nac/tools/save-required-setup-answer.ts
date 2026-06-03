import { tool } from 'ai'
import { z } from 'zod'
import {
  completeRequiredSetupStep,
  saveRequiredSetupAnswer,
} from '@/lib/self-serve/required-setup'
import type { ToolDefinition } from './types'

const requiredSetupStepSchema = z.enum([
  'account_basics',
  'site_skin',
  'welcome_copy',
  'about_page',
  'show_schedule',
  'customer_site_orientation',
  'live_queue_orientation',
  'trade_board_orientation',
  'final_preview_approval',
])

const inputSchema = z.object({
  stepId: requiredSetupStepSchema,
  answer: z.record(z.string(), z.unknown()),
  generatedCopy: z.record(z.string(), z.unknown()).optional(),
  supportState: z.record(z.string(), z.unknown()).optional(),
  completeStep: z.boolean().optional(),
})

export const saveRequiredSetupAnswerTool: ToolDefinition = {
  name: 'save_required_setup_answer',
  readOnly: false,
  build: (ctx) =>
    tool({
      description:
        'Save a required setup answer and optionally mark that setup step complete.',
      inputSchema,
      execute: async (input) => {
        const options = {
          ...(input.generatedCopy
            ? { generatedCopyPatch: input.generatedCopy }
            : {}),
          ...(input.supportState
            ? { supportStatePatch: input.supportState }
            : {}),
        }
        const saved = await saveRequiredSetupAnswer(
          ctx.repId,
          input.stepId,
          input.answer,
          options,
        )

        if (!input.completeStep) return saved
        return completeRequiredSetupStep(ctx.repId, input.stepId)
      },
    }),
}
