import { tool } from 'ai'
import { z } from 'zod'
import { searchNicNacWorkKnowledge } from '@/lib/nic-nac/knowledge/search-work-knowledge'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2)
    .max(240)
    .describe('The rep’s Sparkle Suite, Bomb Party, live-show, or live-streaming question.'),
  limit: z.number().int().min(1).max(4).optional(),
})

export const searchWorkKnowledgeTool: ToolDefinition = {
  name: 'search_work_knowledge',
  readOnly: true,
  build: () =>
    tool({
      description:
        'Search reviewed job knowledge for Sparkle Suite product use, Bomb Party context boundaries, live-show operations, and live-streaming practices. Use this for how-to, preparation, troubleshooting, and advice questions. Do not use it as proof of the rep’s current Calendar, Dance Floor, customer, fulfillment, or show-session state; those require live read tools. Results identify source owner, review date, scope, freshness, confidence, and boundaries. If no result matches, ask one focused question or state uncertainty instead of inventing an answer.',
      inputSchema,
      execute: async ({ query, limit }) =>
        searchNicNacWorkKnowledge(query, limit),
    }),
}
