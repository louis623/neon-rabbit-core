import { describe, expect, it, vi } from 'vitest'
import { publishWorkspaceResource } from '@/lib/services/workspace-resources'

function makeSupabase(existing: { id: string; version: number } | null = null) {
  const revisionUpdates: unknown[] = []
  const resourceRow = {
    id: existing?.id ?? 'resource-1',
    resource_key: 'first-video',
    resource_type: 'video',
    title: 'First video',
    summary: 'A useful walkthrough.',
    body: '',
    category: 'Getting Started',
    tags: ['start'],
    thumbnail_url: null,
    video_provider: 'youtube',
    video_url: 'https://www.youtube.com/watch?v=abc123',
    action_url: '/nic-nac?section=resources&resource=first-video',
    status: 'published',
    version: (existing?.version ?? 0) + 1,
    change_summary: 'Added the first walkthrough.',
    is_featured: true,
    author_label: 'Sparkle Suite',
    published_at: '2026-08-17T20:00:00.000Z',
  }

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'workspace_resources') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: existing, error: null })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: resourceRow, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: resourceRow, error: null })),
              })),
            })),
          })),
        }
      }

      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { id: 'revision-1' }, error: null })),
          })),
        })),
        update: vi.fn((values: unknown) => {
          revisionUpdates.push(values)
          return {
            eq: vi.fn(async () => ({ error: null })),
          }
        }),
      }
    }),
  }

  return { client, revisionUpdates }
}

describe('workspace resources', () => {
  it('publishes a video and announces exactly one versioned update', async () => {
    const { client, revisionUpdates } = makeSupabase()
    const publishAnnouncement = vi.fn(async () => ({ publicationId: 'publication-1' }))

    const result = await publishWorkspaceResource({
      supabase: client as never,
      now: new Date('2026-08-17T20:00:00.000Z'),
      publishAnnouncement,
      input: {
        resourceKey: 'first-video',
        resourceType: 'video',
        title: 'First video',
        summary: 'A useful walkthrough.',
        body: '',
        category: 'Getting Started',
        tags: ['start'],
        videoProvider: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=abc123',
        changeSummary: 'Added the first walkthrough.',
        isFeatured: true,
        authorLabel: 'Sparkle Suite',
        actorKind: 'owner',
        actor: 'Louis',
        announce: true,
      },
    })

    expect(result.resource.version).toBe(1)
    expect(publishAnnouncement).toHaveBeenCalledTimes(1)
    expect(publishAnnouncement).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'video',
        idempotencyKey: 'resource-published:resource-1:1',
      }),
    )
    expect(revisionUpdates).toContainEqual(
      expect.objectContaining({
        announcement_status: 'published',
        publication_id: 'publication-1',
      }),
    )
  })

  it('does not announce a draft-style owner publish when announce is false', async () => {
    const { client } = makeSupabase()
    const publishAnnouncement = vi.fn()

    const result = await publishWorkspaceResource({
      supabase: client as never,
      publishAnnouncement,
      input: {
        resourceKey: 'first-video',
        resourceType: 'video',
        title: 'First video',
        summary: 'A useful walkthrough.',
        videoUrl: 'https://www.youtube.com/watch?v=abc123',
        changeSummary: 'Added the first walkthrough.',
        actor: 'Louis',
        announce: false,
      },
    })

    expect(result.announcement).toBeNull()
    expect(publishAnnouncement).not.toHaveBeenCalled()
  })

  it('rejects unsafe links before writing anything', async () => {
    const { client } = makeSupabase()
    await expect(
      publishWorkspaceResource({
        supabase: client as never,
        input: {
          resourceKey: 'bad-video',
          resourceType: 'video',
          title: 'Bad video',
          summary: 'This URL is unsafe.',
          videoUrl: 'javascript:alert(1)',
          changeSummary: 'Unsafe input test.',
          actor: 'Louis',
        },
      }),
    ).rejects.toThrow('Use a secure https link')
    expect(client.from).not.toHaveBeenCalled()
  })

  it('marks a failed announcement for retry', async () => {
    const { client, revisionUpdates } = makeSupabase()
    await expect(
      publishWorkspaceResource({
        supabase: client as never,
        publishAnnouncement: async () => {
          throw new Error('temporary publisher failure')
        },
        input: {
          resourceKey: 'first-video',
          resourceType: 'video',
          title: 'First video',
          summary: 'A useful walkthrough.',
          videoUrl: 'https://www.youtube.com/watch?v=abc123',
          changeSummary: 'Added the first walkthrough.',
          actor: 'Louis',
        },
      }),
    ).rejects.toThrow('temporary publisher failure')
    expect(revisionUpdates).toContainEqual(
      expect.objectContaining({
        announcement_status: 'failed',
        announcement_error: 'temporary publisher failure',
      }),
    )
  })
})
