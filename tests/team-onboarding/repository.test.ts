import { describe, expect, it, vi } from 'vitest';

import { createQuestion, mapSiteRow } from '@/lib/team-onboarding/repository';

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
