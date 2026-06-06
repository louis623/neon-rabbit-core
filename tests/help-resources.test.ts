import { describe, expect, it } from 'vitest'

import { getHelpResources } from '@/lib/services/help-resources'

describe('help resources', () => {
  it('covers the self-serve onboarding help hub categories and walkthrough video slots', () => {
    const resources = getHelpResources()
    const combinedText = resources
      .map((resource) =>
        [
          resource.category,
          resource.title,
          resource.summary,
          resource.body,
          ...resource.quickActions,
          resource.video?.title ?? '',
          resource.video?.status ?? '',
        ].join(' '),
      )
      .join(' ')

    expect(combinedText).toContain('Getting oriented in the workspace')
    expect(combinedText).toContain('Meet Nic-Nac')
    expect(combinedText).toContain('Backend workspace tour')
    expect(combinedText).toContain('Editing the public site')
    expect(combinedText).toContain('Adding and updating shows')
    expect(combinedText).toContain('Managing trade board content')
    expect(combinedText).toContain('Using the calculator')
    expect(combinedText).toContain('Chrome extension and Live Queue overview')
    expect(combinedText).toContain('Troubleshooting and escalation')

    const requiredVideoResourceIds = [
      'getting-started-after-purchase',
      'meet-nic-nac',
      'backend-workspace-tour',
      'public-site-editing',
      'shows-and-trade-board',
      'calculator-walkthrough',
      'chrome-extension-live-queue-overview',
    ]

    for (const resourceId of requiredVideoResourceIds) {
      expect(resources.find((resource) => resource.id === resourceId)?.video).toMatchObject({
        provider: 'youtube',
        status: 'placeholder',
      })
    }
  })

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

  it('documents the custom domain forwarding policy and Nic-Nac support boundary', () => {
    const resource = getHelpResources()
      .find((helpResource) => helpResource.id === 'domain-forwarding')

    expect(resource).toMatchObject({
      category: 'Site settings',
      title: expect.stringContaining('domain'),
    })

    const combinedText = [
      resource?.summary,
      resource?.body,
      ...(resource?.quickActions ?? []),
    ].join(' ')

    expect(combinedText).toContain('yoursparklesuite.com/yourshowname')
    expect(combinedText).toContain('forwarding/redirect')
    expect(combinedText).toContain('do not use masked forwarding')
    expect(combinedText).toContain('premium tech help')
    expect(combinedText).toContain('Nic-Nac')
    expect(combinedText).toContain('provider-specific DNS setup')
  })

  it.each([
    'domain',
    'forwarding',
    'custom domain',
  ])('retrieves domain forwarding help for "%s"', (query) => {
    expect(getHelpResources(query).map((resource) => resource.id)).toContain('domain-forwarding')
  })
})
