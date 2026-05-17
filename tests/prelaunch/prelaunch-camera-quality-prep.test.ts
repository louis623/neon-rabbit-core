import { describe, expect, it } from 'vitest'

import { buildCameraQualityPrep } from '@/lib/prelaunch/camera-quality-prep'
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

describe('buildCameraQualityPrep', () => {
  it('requires sample screening and a two-device check for phone-only intakes', () => {
    const prep = buildCameraQualityPrep(makeSubmission())

    expect(prep.status).toBe('sample_photo_required')
    expect(prep.items).toContainEqual({
      label: 'Sample photo screening',
      detail:
        'Sample photo still needs Nic-Nac screening for blur, lighting, framing, and white-background quality.',
      status: 'required',
    })
    expect(prep.items).toContainEqual({
      label: 'Confirm two-device workflow',
      detail:
        'Phone-only setup needs operator review so live selling and jewelry photo capture do not compete for the same device.',
      status: 'review',
    })
  })

  it('asks operators to confirm unknown capture devices', () => {
    const prep = buildCameraQualityPrep(
      makeSubmission({
        deviceSetup: 'not_sure',
        fitFlags: ['device_setup_unknown'],
      }),
    )

    expect(prep.items).toContainEqual({
      label: 'Confirm capture device',
      detail:
        'Ask what phone, camera, or computer will capture sample jewelry photos before treating setup as ready.',
      status: 'review',
    })
  })

  it('keeps qualified intakes in sample-photo review before readiness', () => {
    const prep = buildCameraQualityPrep(
      makeSubmission({
        prequalificationStatus: 'qualified',
        fitFlags: [],
        deviceSetup: 'phone_and_computer',
      }),
    )

    expect(prep.status).toBe('sample_photo_required')
    expect(prep.items).toContainEqual({
      label: 'Capture setup quality context',
      detail:
        'Assess photo quality against current setup: TikTok bio link and DMs. Setup goal: Cleaner show-night hub.',
      status: 'review',
    })
    expect(prep.items).toContainEqual({
      label: 'Screening is not hardware approval',
      detail:
        'Passing sample-photo screening does not approve hardware, shipping, pricing, or fulfillment.',
      status: 'review',
    })
  })

  it('keeps camera prep free of live fulfillment actions', () => {
    const prep = buildCameraQualityPrep(makeSubmission())
    const payload = JSON.stringify(prep)

    expect(prep.guardrails).toEqual([
      'No SMS or handset workflow is triggered.',
      'No camera, lightbox, or kit order is created.',
      'No shipment is approved.',
      'No fee or price is collected.',
      'No sample photo result bypasses human review.',
    ])
    expect(payload).not.toContain('Send SMS')
    expect(payload).not.toContain('Order camera')
    expect(payload).not.toContain('Approve shipment')
    expect(payload).not.toContain('Collect kit fee')
  })
})
