import { describe, expect, it, vi } from 'vitest';

import { createQuestion, getPublishedSiteConfig, mapSiteRow } from '@/lib/team-onboarding/repository';

describe('team onboarding repository', () => {
  it('mapSiteRow converts all site fields to camelCase', () => {
    expect(
      mapSiteRow({
        id: 'site-1',
        owner_rep_id: 'rep-1',
        slug: 'britt-with-bling',
        title: 'Britt with Bling New Rep Path',
        team_name: 'Britt with Bling',
        rep_display_name: 'Brittany',
        status: 'published',
        custom_domain: 'brittwithbling.com',
        created_at: '2026-06-01T12:00:00.000Z',
        updated_at: '2026-06-01T12:30:00.000Z',
        published_at: '2026-06-01T13:00:00.000Z',
      }),
    ).toEqual({
      id: 'site-1',
      ownerRepId: 'rep-1',
      slug: 'britt-with-bling',
      title: 'Britt with Bling New Rep Path',
      teamName: 'Britt with Bling',
      repDisplayName: 'Brittany',
      status: 'published',
      customDomain: 'brittwithbling.com',
      createdAt: '2026-06-01T12:00:00.000Z',
      updatedAt: '2026-06-01T12:30:00.000Z',
      publishedAt: '2026-06-01T13:00:00.000Z',
    });
  });

  it('getPublishedSiteConfig returns nested public site config', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'site-1',
        owner_rep_id: 'rep-1',
        slug: 'britt-with-bling',
        title: 'Britt with Bling New Rep Path',
        team_name: 'Britt with Bling',
        rep_display_name: 'Brittany',
        status: 'published',
        custom_domain: 'brittwithbling.com',
        created_at: '2026-06-01T12:00:00.000Z',
        updated_at: '2026-06-01T12:30:00.000Z',
        published_at: '2026-06-01T13:00:00.000Z',
      },
      error: null,
    });
    const siteEqStatus = vi.fn().mockReturnValue({ maybeSingle });
    const siteEqSlug = vi.fn().mockReturnValue({ eq: siteEqStatus });
    const siteSelect = vi.fn().mockReturnValue({ eq: siteEqSlug });

    const resourceOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'resource-1',
          site_id: 'site-1',
          title: 'Sparkle Suite Question Inbox',
          description: 'Sends new-rep questions to Brittany in Sparkle Suite.',
          href: 'https://www.yoursparklesuite.com/nic-nac/team-onboarding',
          category: 'Sparkle Suite',
          source: 'sparkle-suite',
          sort_order: 10,
        },
      ],
      error: null,
    });
    const resourceEq = vi.fn().mockReturnValue({ order: resourceOrder });
    const resourceSelect = vi.fn().mockReturnValue({ eq: resourceEq });

    const stepOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'step-1',
          site_id: 'site-1',
          group_title: 'Questions for Brittany',
          title: 'Ask Brittany',
          description: 'Collect anything the new rep needs Brittany to answer.',
          resource_ids: ['resource-1'],
          sort_order: 70,
        },
      ],
      error: null,
    });
    const stepEq = vi.fn().mockReturnValue({ order: stepOrder });
    const stepSelect = vi.fn().mockReturnValue({ eq: stepEq });

    const from = vi.fn((table: string) => {
      if (table === 'ss_team_onboarding_sites') {
        return { select: siteSelect };
      }

      if (table === 'ss_team_onboarding_resources') {
        return { select: resourceSelect };
      }

      return { select: stepSelect };
    });

    await expect(getPublishedSiteConfig({ from } as never, 'britt-with-bling')).resolves.toEqual({
      site: {
        slug: 'britt-with-bling',
        title: 'Britt with Bling New Rep Path',
        teamName: 'Britt with Bling',
        repDisplayName: 'Brittany',
        customDomain: 'brittwithbling.com',
      },
      resources: [
        {
          id: 'resource-1',
          siteId: 'site-1',
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
          id: 'step-1',
          siteId: 'site-1',
          groupTitle: 'Questions for Brittany',
          title: 'Ask Brittany',
          description: 'Collect anything the new rep needs Brittany to answer.',
          resourceIds: ['resource-1'],
          sortOrder: 70,
        },
      ],
    });
  });

  it('createQuestion inserts an open question and maps the returned row', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'question-1',
        status: 'open',
        created_at: '2026-06-01T14:00:00.000Z',
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    await expect(
      createQuestion(
        { from } as never,
        {
          siteId: 'site-1',
          memberId: null,
          stepId: 'step-1',
          questionText: 'Where should I start?',
        },
      ),
    ).resolves.toEqual({
      id: 'question-1',
      status: 'open',
      createdAt: '2026-06-01T14:00:00.000Z',
    });

    expect(from).toHaveBeenCalledWith('ss_team_onboarding_questions');
    expect(insert).toHaveBeenCalledWith({
      site_id: 'site-1',
      member_id: null,
      step_id: 'step-1',
      question_text: 'Where should I start?',
      status: 'open',
    });
    expect(select).toHaveBeenCalledWith('id,status,created_at');
  });

  it('createQuestion throws a stable error when the insert fails', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    await expect(
      createQuestion(
        { from } as never,
        {
          siteId: 'site-1',
          memberId: 'member-1',
          stepId: null,
          questionText: 'Can I invite my launch group?',
        },
      ),
    ).rejects.toThrow('Failed to create team onboarding question.');
  });
});
