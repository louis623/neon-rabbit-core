import { tool } from 'ai'
import { z } from 'zod'
import { buildBrittWithBlingStarterConfig } from '@/lib/team-onboarding/site-template'
import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  teamName: z.string().min(2).max(120),
  repDisplayName: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

export function createTeamOnboardingSite(input: z.input<typeof inputSchema>) {
  const parsed = inputSchema.parse(input)

  return {
    status: 'draft' as const,
    config: buildBrittWithBlingStarterConfig(parsed),
  }
}

export const createTeamOnboardingSiteTool: ToolDefinition = {
  name: 'create_team_onboarding_site',
  readOnly: false,
  build: () =>
    tool({
      description:
        'Create a draft/private onboarding site config for Manage My Team. ' +
        'This prepares the team onboarding page starter and does not publish publicly by itself.',
      inputSchema,
      execute: async (input) => createTeamOnboardingSite(input),
    }),
}
