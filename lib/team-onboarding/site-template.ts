import type { PublicTeamOnboardingConfig } from './types'

export function buildBrittWithBlingStarterConfig(input: {
  slug: string
  teamName: string
  repDisplayName: string
}): PublicTeamOnboardingConfig {
  return {
    site: {
      slug: input.slug,
      title: `Start Strong with ${input.teamName}`,
      teamName: input.teamName,
      repDisplayName: input.repDisplayName,
      customDomain: null,
    },
    resources: [],
    steps: [],
  }
}
