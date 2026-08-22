import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WorkspaceResourceLibraryView } from '@/app/nic-nac/components/WorkspaceResourceLibrary'

describe('workspace resource library UI', () => {
  it('renders blog and video resources with clear actions', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceResourceLibraryView, {
        resources: [
          {
            id: 'blog-1',
            resourceKey: 'monthly-planning',
            resourceType: 'blog',
            title: 'Plan a strong month',
            summary: 'A practical monthly planning guide.',
            body: 'Choose three priorities, set realistic dates, and review them weekly.',
            category: 'Business',
            tags: ['planning'],
            thumbnailUrl: null,
            videoProvider: null,
            videoUrl: null,
            actionUrl: '/nic-nac?section=resources&resource=monthly-planning',
            status: 'published',
            version: 1,
            changeSummary: 'New guide',
            isFeatured: true,
            authorLabel: 'Sparkle Suite',
            publishedAt: '2026-08-17T20:00:00.000Z',
          },
          {
            id: 'video-1',
            resourceKey: 'trade-board-video',
            resourceType: 'video',
            title: 'Dance Floor walkthrough',
            summary: 'See the Dance Floor workflow.',
            body: '',
            category: 'Dance Floor',
            tags: ['trade'],
            thumbnailUrl: null,
            videoProvider: 'youtube',
            videoUrl: 'https://www.youtube.com/watch?v=abc123',
            actionUrl: 'https://www.youtube.com/watch?v=abc123',
            status: 'published',
            version: 1,
            changeSummary: 'New video',
            isFeatured: false,
            authorLabel: 'Sparkle Suite',
            publishedAt: '2026-08-17T20:00:00.000Z',
          },
        ],
      }),
    )

    expect(html).toContain('Resource Library')
    expect(html).toContain('Blog')
    expect(html).toContain('Videos')
    expect(html).toContain('Plan a strong month')
    expect(html).toContain('Read article')
    expect(html).toContain('Dance Floor walkthrough')
    expect(html).toContain('Watch video')
  })

  it('renders a useful empty state', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceResourceLibraryView, { resources: [] }),
    )
    expect(html).toContain('No matching resources yet.')
  })
})
