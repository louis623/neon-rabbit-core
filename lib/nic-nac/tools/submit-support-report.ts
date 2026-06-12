import { tool } from 'ai'
import { z } from 'zod'
import { createSupportReport } from '@/lib/services/support-reports'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  reportType: z.enum(['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).optional(),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().min(10).max(3000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
})

export const submitSupportReportTool: ToolDefinition = {
  name: 'submit_support_report',
  readOnly: false,
  build: (ctx) =>
    tool({
      description:
        'File a Sparkle Suite support report from Nic-Nac for bugs, site issues, suggested upgrades, or workflow ideas. Use only after the rep has given enough detail to title and describe the report.',
      inputSchema,
      execute: async (input) => {
        const result = await createSupportReport(createAdminClient(), {
          source: 'nic_nac',
          repId: ctx.repId,
          conversationId: ctx.conversationId,
          runId: ctx.runId,
          ...input,
        })
        const delivered = result.notificationStatus === 'delivered'

        return {
          ...result,
          delivered,
          message: delivered
            ? 'Saved and notified Louis.'
            : 'Saved the report, but Louis was not automatically notified. Use Help & Resources if this needs immediate backup.',
        }
      },
    }),
}
