import { describe, expect, it, vi } from 'vitest';

import { createQuestion, getPublishedSiteConfig, mapSiteRow } from '@/lib/team-onboarding/repository';

const publishedSiteRow = {
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
};

type MockQueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

function createPublishedConfigSupabaseMock({
  siteResult = { data: publishedSiteRow, error: null },
  resourceResult = {
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
  },
  stepResult = {
    data: [
      {
        id: 'step-1',
        site_id: 'site-1',
        group_title: 'Questions for Brittany',
        title: 'Ask Brittany',
        description: 'Collect anything the new rep needs Brittany to answer.',
        resource_ids: null,
        sort_order: 70,
      },
    ],
    error: null,
  },
}: {
  siteResult?: MockQueryResult<typeof publishedSiteRow>;
  resourceResult?: MockQueryResult<
    Array<{
      id: string;
      site_id: string;
      title: string;
      description: string;
      href: string;
      category: string;
      source: string;
      sort_order: number;
    }>
  >;
  stepResult?: MockQueryResult<
    Array<{
      id: string;
      site_id: string;
      group_title: string;
      title: string;
      description: string;
      resource_ids: string[] | null;
      sort_order: number;
    }>
  >;
} = {}) {
  const siteMaybeSingle = vi.fn().mockResolvedValue(siteResult);
  const siteEqStatus = vi.fn().mockReturnValue({ maybeSingle: siteMaybeSingle });
  const siteEqSlug = vi.fn().mockReturnValue({ eq: siteEqStatus });
  const siteSelect = vi.fn().mockReturnValue({ eq: siteEqSlug });

  const resourceOrder = vi.fn().mockResolvedValue(resourceResult);
  const resourceEq = vi.fn().mockReturnValue({ order: resourceOrder });
  const resourceSelect = vi.fn().mockReturnValue({ eq: resourceEq });

  const stepOrder = vi.fn().mockResolvedValue(stepResult);
  const stepEq = vi.fn().mockReturnValue({ order: stepOrder });
  const stepSelect = vi.fn().mockReturnValue({ eq: stepEq });

  const from = vi.fn((table: string) => {
    if (table === 'ss_team_onboarding_sites') {
      return { select: siteSelect };
    }

    if (table === 'ss_team_onboarding_resources') {
      return { select: resourceSelect };
    }

    if (table === 'ss_team_onboarding_steps') {
      return { select: stepSelect };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: { from } as never,
    from,
    siteSelect,
    siteEqSlug,
    siteEqStatus,
    siteMaybeSingle,
    resourceSelect,
    resourceEq,
    resourceOrder,
    stepSelect,
    stepEq,
    stepOrder,
  };
}

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

  it('getPublishedSiteConfig queries published site by slug and status', async () => {
    const mock = createPublishedConfigSupabaseMock();

    await getPublishedSiteConfig(mock.supabase, 'britt-with-bling');

    expect(mock.from).toHaveBeenCalledWith('ss_team_onboarding_sites');
    expect(mock.siteSelect).toHaveBeenCalledWith(
      'id,owner_rep_id,slug,title,team_name,rep_display_name,status,custom_domain,created_at,updated_at,published_at',
    );
    expect(mock.siteEqSlug).toHaveBeenCalledWith('slug', 'britt-with-bling');
    expect(mock.siteEqStatus).toHaveBeenCalledWith('status', 'published');
    expect(mock.siteMaybeSingle).toHaveBeenCalledOnce();
  });

  it('getPublishedSiteConfig maps the returned public config shape', async () => {
    const mock = createPublishedConfigSupabaseMock();

    await expect(getPublishedSiteConfig(mock.supabase, 'britt-with-bling')).resolves.toEqual({
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
          resourceIds: [],
          sortOrder: 70,
        },
      ],
    });

    expect(mock.from).toHaveBeenCalledWith('ss_team_onboarding_resources');
    expect(mock.resourceSelect).toHaveBeenCalledWith(
      'id,site_id,title,description,href,category,source,sort_order',
    );
    expect(mock.resourceEq).toHaveBeenCalledWith('site_id', 'site-1');
    expect(mock.resourceOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(mock.from).toHaveBeenCalledWith('ss_team_onboarding_steps');
    expect(mock.stepSelect).toHaveBeenCalledWith(
      'id,site_id,group_title,title,description,resource_ids,sort_order',
    );
    expect(mock.stepEq).toHaveBeenCalledWith('site_id', 'site-1');
    expect(mock.stepOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('getPublishedSiteConfig returns null when the published site has no data', async () => {
    const mock = createPublishedConfigSupabaseMock({
      siteResult: { data: null, error: null },
    });

    await expect(getPublishedSiteConfig(mock.supabase, 'missing-site')).resolves.toBeNull();
    expect(mock.from).toHaveBeenCalledTimes(1);
  });

  it('getPublishedSiteConfig returns null when the published site query errors', async () => {
    const mock = createPublishedConfigSupabaseMock({
      siteResult: { data: null, error: { message: 'permission denied' } },
    });

    await expect(getPublishedSiteConfig(mock.supabase, 'britt-with-bling')).resolves.toBeNull();
    expect(mock.from).toHaveBeenCalledTimes(1);
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
