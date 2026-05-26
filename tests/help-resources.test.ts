import { describe, expect, it } from 'vitest'

import { getHelpResources } from '@/lib/services/help-resources'

describe('help resources', () => {
  it('surfaces Live Queue rollout guidance for rep-facing searches', () => {
    const liveQueueResources = getHelpResources('live queue')
    const combinedText = liveQueueResources
      .map((resource) =>
        [
          resource.category,
          resource.title,
          resource.summary,
          resource.body,
          ...resource.quickActions,
        ].join(' '),
      )
      .join(' ')

    expect(liveQueueResources.length).toBeGreaterThanOrEqual(2)
    expect(combinedText).toContain('Nic-Nac')
    expect(combinedText).toContain('sync code')
    expect(combinedText).toContain('Party Filter')
    expect(combinedText).toContain('extension status')
    expect(combinedText).toContain('Web Store')
    expect(combinedText).toContain('unpacked')
    expect(combinedText).toContain('stale')
    expect(combinedText).toContain('empty')
  })

  it.each([
    ['sync code', 'live-queue-setup'],
    ['Party Filter', 'live-queue-setup'],
    ['Web Store', 'live-queue-rollout'],
    ['unpacked', 'live-queue-rollout'],
    ['stale queue', 'live-queue-troubleshooting'],
    ['empty queue', 'live-queue-troubleshooting'],
  ])('retrieves Live Queue help for "%s"', (query, expectedResourceId) => {
    expect(getHelpResources(query).map((resource) => resource.id)).toContain(expectedResourceId)
  })
})
