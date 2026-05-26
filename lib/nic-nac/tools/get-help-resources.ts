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
        'Search the approved Sparkle Suite help/how-to resources for setup, Nic-Nac, site edits, shows, trade board, calculator, Chrome extension, Live Queue, and escalation questions.',
      inputSchema,
      execute: async ({ query = '' }) => ({
        resources: getHelpResources(query),
      }),
    }),
}
