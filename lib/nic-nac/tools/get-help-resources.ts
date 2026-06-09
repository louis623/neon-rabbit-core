import { z } from 'zod'
import { tool } from 'ai'
import { getHelpResources } from '@/lib/services/help-resources'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  query: z.string().trim().max(120).optional(),
})

export const getHelpResourcesTool: ToolDefinition = {
  name: 'get_help_resources',
  readOnly: true,
  build: () =>
    tool({
      description:
        'Search the approved Sparkle Suite Help & Resources Workflow Playbook. Prefer workflow guides for step-by-step rep outcomes, feature references for quick lookup, and support resources when the rep is blocked. Use only returned resource details; do not claim coming-soon or sandbox features are fully live.',
      inputSchema,
      execute: async ({ query = '' }) => ({
        resources: getHelpResources(query),
      }),
    }),
}
