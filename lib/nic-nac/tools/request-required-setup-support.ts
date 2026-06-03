import { tool } from 'ai'
import { z } from 'zod'
import { sendLouisAlert } from '@/lib/ops/louis-alerts'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  reason: z.string().trim().min(3),
  severity: z.enum(['warning', 'error']).optional(),
})

export const requestRequiredSetupSupportTool: ToolDefinition = {
  name: 'request_required_setup_support',
  readOnly: false,
  build: (ctx) =>
    tool({
      description: 'Notify Louis when required Nic-Nac setup is blocked.',
      inputSchema,
      execute: async ({ reason, severity = 'warning' }) => {
        const alertResult = await sendLouisAlert({
          title: 'Nic-Nac setup needs Louis',
          severity,
          lines: [
            `Rep ID: ${ctx.repId}`,
            `Conversation: ${ctx.conversationId}`,
            `Run: ${ctx.runId}`,
            `Reason: ${reason}`,
          ],
        })

        return alertResult.delivered
          ? { ok: true, delivered: true }
          : { ok: false, delivered: false, reason: alertResult.reason }
      },
    }),
}
