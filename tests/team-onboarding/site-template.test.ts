import { describe, expect, it } from 'vitest';

import type { PublicTeamOnboardingConfig } from '@/lib/team-onboarding/types';

describe('team onboarding site template contract', () => {
  it('represents the Britt with Bling public onboarding template', async () => {
    await expect(import('@/lib/team-onboarding/types')).resolves.toBeTypeOf('object');

    const config = {
      site: {
        slug: 'britt-with-bling',
        title: 'Britt with Bling New Rep Path',
        teamName: 'Britt with Bling',
        repDisplayName: 'Brittany',
        customDomain: 'brittwithbling.com',
      },
      resources: [
        {
          id: 'sparkle-suite-questions',
          siteId: 'site_britt',
          title: 'Sparkle Suite Question Inbox',
          description: 'Sends new-rep questions to Brittany in Sparkle Suite.',
          href: 'https://www.yoursparklesuite.com/nic-nac/team-onboarding',
          category: 'Sparkle Suite',
          source: 'sparkle-suite',
          sortOrder: 10,
        },
      ],
      steps: [
        {
          id: 'questions-for-brittany',
          siteId: 'site_britt',
          groupTitle: 'Questions for Brittany',
          title: 'Ask Brittany',
          description: 'Collect anything the new rep needs Brittany to answer.',
          resourceIds: ['sparkle-suite-questions'],
          sortOrder: 70,
        },
      ],
    } satisfies PublicTeamOnboardingConfig;

    expect(config.site.teamName).toBe('Britt with Bling');
    expect(config.resources[0].source).toBe('sparkle-suite');
    expect(config.steps[0]).toMatchObject({
      groupTitle: 'Questions for Brittany',
      resourceIds: ['sparkle-suite-questions'],
    });
  });
});
