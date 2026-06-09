import { describe, expect, it } from 'vitest'

import { getHelpResources } from '@/lib/services/help-resources'

describe('help resources', () => {
  it('defaults to the launch Workflow Playbook guides before feature references', () => {
    const resources = getHelpResources()
    const workflowTitles = resources
      .filter((resource) => resource.type === 'workflow')
      .map((resource) => resource.title)

    expect(workflowTitles).toEqual([
      'Start here: Learn your Sparkle Suite workspace',
      'Finish setup and approve your customer site',
      'Update your customer-facing site',
      'Get ready for a live show',
      'Use Live Queue during a show',
      'Add jewelry to your Trade Board',
      'Handle trade requests',
      'Manage customers and updates',
      'Billing, SMS wallet, and account basics',
      'Fix something or ask for help',
    ])

    const firstFeatureIndex = resources.findIndex(
      (resource) => resource.type === 'feature_reference',
    )
    const lastWorkflowIndex = resources.reduce(
      (lastIndex, resource, index) =>
        resource.type === 'workflow' ? index : lastIndex,
      -1,
    )

    expect(firstFeatureIndex).toBeGreaterThan(lastWorkflowIndex)
  })

  it('gives every workflow guide the standard operator-manual fields', () => {
    const workflows = getHelpResources().filter((resource) => resource.type === 'workflow')

    expect(workflows.length).toBe(10)

    for (const workflow of workflows) {
      expect(workflow.group).toMatch(/Setup|Live Shows|Trade Board|Customers & Account|Help/)
      expect(workflow.goal).toBeTruthy()
      expect(workflow.useWhen).toBeTruthy()
      expect(workflow.beforeYouStart.length).toBeGreaterThanOrEqual(1)
      expect(workflow.steps.length).toBeGreaterThanOrEqual(3)
      expect(workflow.goodResult).toBeTruthy()
      expect(workflow.nicNacPrompt).toMatch(/\w/)
      expect(workflow.stillStuck).toBeTruthy()
    }
  })

  it('keeps a compact Feature Index underneath the workflows', () => {
    const featureReferences = getHelpResources()
      .filter((resource) => resource.type === 'feature_reference')
      .map((resource) => resource.title)

    expect(featureReferences).toEqual([
      'Customer Site',
      'Trade Board',
      'Live Queue',
      'Live Event Calendar',
      'Email Updates',
      'SMS Updates',
      'Nic-Nac',
      'Billing',
      'Account / Settings',
    ])
  })

  it('covers the launch workflow video slots', () => {
    const resources = getHelpResources()

    const requiredVideoResourceIds = [
      'start-here-workspace',
      'update-customer-site',
      'add-jewelry-to-trade-board',
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

  it('keeps Live Queue guidance honest about rollout and Web Store readiness', () => {
    const liveQueueText = getHelpResources('live queue')
      .map((resource) => [resource.title, resource.summary, resource.body].join(' '))
      .join(' ')

    expect(liveQueueText).toContain('coming soon or launch-gated')
    expect(liveQueueText).toContain('Web Store')
    expect(liveQueueText).not.toContain('fully live for every rep')
  })

  it('keeps Email and SMS update guidance honest about readiness', () => {
    const updateText = getHelpResources('email sms updates')
      .map((resource) => [resource.title, resource.summary, resource.body].join(' '))
      .join(' ')

    expect(updateText).toContain('coming soon or sandbox')
    expect(updateText).toContain('opted-in')
    expect(updateText).not.toContain('send production texts now')
  })

  it.each([
    ['sync code', 'use-live-queue-during-show'],
    ['Party Filter', 'use-live-queue-during-show'],
    ['Web Store', 'use-live-queue-during-show'],
    ['unpacked', 'use-live-queue-during-show'],
    ['stale queue', 'use-live-queue-during-show'],
    ['empty queue', 'use-live-queue-during-show'],
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

  it('preserves the strict Add Jewelry workflow sequence and photo boundaries', () => {
    const guide = getHelpResources('add jewelry trade board light box white background')
      .find((resource) => resource.id === 'add-jewelry-to-trade-board')

    expect(guide).toMatchObject({
      type: 'workflow',
      group: 'Trade Board',
      title: 'Add jewelry to your Trade Board',
      nicNacPrompt: 'Help me add a piece to my Trade Board.',
    })

    expect(guide?.steps).toEqual([
      'Start with the item number.',
      'Let Nic-Nac check the Sparkle Suite jewelry database.',
      'If the item is already found, confirm the match and listing details.',
      'If the item is missing, upload a readable label/details photo.',
      'Confirm the collection name or upload packaging context if the collection is not clear.',
      'Upload the final front-facing jewelry photo for the customer-facing board image.',
      'Review the listing and add it to your board.',
    ])

    expect(guide?.body).toContain('Label/details and packaging photos are not final board photos')
    expect(guide?.body).toContain('front-facing jewelry photo')
    expect(guide?.body).toContain('white background')
    expect(guide?.body).toContain('brightest setting')
    expect(guide?.quickActions).toContain('Add a piece to Trade Board')
  })

  it.each([
    'domain',
    'forwarding',
    'custom domain',
  ])('retrieves domain forwarding help for "%s"', (query) => {
    expect(getHelpResources(query).map((resource) => resource.id)).toContain('domain-forwarding')
  })
})
