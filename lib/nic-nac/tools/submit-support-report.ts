import { tool } from 'ai'
import { z } from 'zod'
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
  readOnly: true,
  build: () =>
    tool({
      description:
        'Prepare an editable Sparkle Suite Support draft and direct the rep to Message Center. This never files or sends the report.',
      inputSchema,
      execute: async (input) => {
        return {
          ok: true,
          submitted: false,
          action: 'open_support_composer',
          href: '/nic-nac?section=messages&compose=support&source=nic-nac',
          draft: input,
          message:
            'I prepared an editable Support draft. Review it in Messages, then choose Send when it looks right.',
        }
      },
    }),
}
