import { describe, expect, it } from 'vitest'

import { buildPhotographyKitPrep } from '@/lib/prelaunch/photography-kit-prep'
import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

function makeSubmission(
  overrides: Partial<PrelaunchIntakeReviewSubmission> = {},
): PrelaunchIntakeReviewSubmission {
  return {
    id: 'intake-1',
    name: 'Jamie Hart',
    email: 'jamie@example.com',
    phone: '303-555-0123',
    businessName: 'Jamie Hart Jewelry',
    social: {
      tiktok: '@jamieh',
      instagram: '@jamiebling',
      facebook: null,
    },
    team: {
      name: 'Lindsey Team',
      size: '6-20',
    },
    primaryPlatform: 'tiktok',
    streamingFrequency: 'multiple_weekly',
    currentSetup: 'TikTok bio link and DMs',
    setupGoal: 'Cleaner show-night hub',
    deviceSetup: 'phone_only',
    brandVibe: 'polished and warm',
    colorPreferences: 'plum and pearl',
    specialRequests: 'Needs help with launch links',
    intakeStatus: 'submitted',
    prequalificationStatus: 'needs_review',
    fitFlags: ['phone_only_setup'],
    waitlistId: 'waitlist-1',
    scoutInputStatus: 'ready',
    handoffStatus: 'scout_ready',
    latestScoutRun: null,
    latestScribeTranscriptRun: null,
    createdAt: '2026-05-09T18:00:00Z',
    updatedAt: '2026-05-09T18:00:00Z',
    ...overrides,
  }
}

describe('buildPhotographyKitPrep', () => {
  it('builds phone-only prep without triggering fulfillment actions', () => {
    const prep = buildPhotographyKitPrep(makeSubmission())

    expect(prep.status).toBe('sample_photo_needed')
    expect(prep.items).toContainEqual({
      label: 'Baseline setup',
      detail: 'DUCLUS lightbox or equivalent white setup; white background required.',
      status: 'required',
    })
    expect(prep.items).toContainEqual({
      label: 'Rep device first',
      detail:
        'Use the rep phone or existing camera first; webcam standardization is skipped for now.',
      status: 'review',
    })
    expect(prep.items).toContainEqual({
      label: 'Phone-only workflow check',
      detail:
        'Confirm the rep can handle live selling and jewelry photo capture without a second device.',
      status: 'review',
    })
    expect(prep.guardrails).toEqual([
      'No kit order triggered.',
      'No vendor selected.',
      'No price shown.',
      'No shipment status changed.',
      'No webcam upsell.',
    ])
  })

  it('flags unknown device setup for manual confirmation', () => {
    const prep = buildPhotographyKitPrep(
      makeSubmission({
        deviceSetup: 'not_sure',
        fitFlags: ['device_setup_unknown'],
      }),
    )

    expect(prep.items).toContainEqual({
      label: 'Confirm capture device',
      detail: 'Ask what phone, camera, or computer the rep will use for jewelry photos.',
      status: 'review',
    })
  })

  it('still requires sample photo review for otherwise qualified intakes', () => {
    const prep = buildPhotographyKitPrep(
      makeSubmission({
        prequalificationStatus: 'qualified',
        fitFlags: [],
        deviceSetup: 'phone_and_computer',
      }),
    )

    expect(prep.status).toBe('sample_photo_needed')
    expect(prep.items).toContainEqual({
      label: 'Request sample jewelry photo',
      detail:
        'Ask for one or more sample jewelry photos from the rep real setup before making a kit decision.',
      status: 'required',
    })
    expect(prep.items).toContainEqual({
      label: 'Run Nic-Nac screening',
      detail: 'Screen sample photos for blur, lighting, framing, and white-background quality.',
      status: 'required',
    })
  })
})
