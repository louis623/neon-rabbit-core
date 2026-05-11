import { describe, expect, it } from 'vitest'

import {
  buildPrelaunchScoutInput,
  normalizePrelaunchIntakeReviewRows,
} from '@/lib/prelaunch/intake-review'

describe('prelaunch intake review helpers', () => {
  it('normalizes review rows for operator review', () => {
    expect(
      normalizePrelaunchIntakeReviewRows([
        {
          id: 'intake-1',
          full_name: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          business_name: 'Jamie Hart Jewelry',
          tiktok_handle: '@jamieh',
          instagram_handle: null,
          facebook_url: null,
          team_name: null,
          team_size: '1-5',
          primary_platform: 'tiktok',
          streaming_frequency: 'weekly',
          current_setup: 'Bio link',
          setup_goal: 'Cleaner hub',
          device_setup: 'phone_and_computer',
          brand_vibe: 'warm',
          color_preferences: null,
          special_requests: null,
          intake_status: 'submitted',
          prequalification_status: 'qualified',
          fit_flags: [],
          waitlist_id: 'waitlist-1',
          scout_input_status: 'ready',
          created_at: '2026-05-09T18:00:00Z',
          updated_at: '2026-05-09T18:00:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'intake-1',
        name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        businessName: 'Jamie Hart Jewelry',
        social: {
          tiktok: '@jamieh',
          instagram: null,
          facebook: null,
        },
        team: {
          name: null,
          size: '1-5',
        },
        primaryPlatform: 'tiktok',
        streamingFrequency: 'weekly',
        currentSetup: 'Bio link',
        setupGoal: 'Cleaner hub',
        deviceSetup: 'phone_and_computer',
        brandVibe: 'warm',
        colorPreferences: null,
        specialRequests: null,
        intakeStatus: 'submitted',
        prequalificationStatus: 'qualified',
        fitFlags: [],
        waitlistId: 'waitlist-1',
        scoutInputStatus: 'ready',
        createdAt: '2026-05-09T18:00:00Z',
        updatedAt: '2026-05-09T18:00:00Z',
      },
    ])
  })

  it('builds the Scout input shape from one normalized intake row', () => {
    const [submission] = normalizePrelaunchIntakeReviewRows([
      {
        id: 'intake-1',
        full_name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        business_name: 'Jamie Hart Jewelry',
        tiktok_handle: '@jamieh',
        instagram_handle: '@jamiebling',
        facebook_url: null,
        team_name: 'Lindsey Team',
        team_size: '6-20',
        primary_platform: 'tiktok',
        streaming_frequency: 'multiple_weekly',
        current_setup: 'TikTok bio link and DMs',
        setup_goal: 'Cleaner show-night hub',
        device_setup: 'phone_only',
        brand_vibe: 'polished and warm',
        color_preferences: 'plum and pearl',
        special_requests: 'Needs help with links',
        intake_status: 'submitted',
        prequalification_status: 'needs_review',
        fit_flags: ['phone_only_setup'],
        waitlist_id: 'waitlist-1',
        scout_input_status: 'ready',
        created_at: '2026-05-09T18:00:00Z',
        updated_at: '2026-05-09T18:00:00Z',
      },
    ])

    expect(buildPrelaunchScoutInput(submission)).toEqual({
      intakeId: 'intake-1',
      prospect: {
        name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        businessName: 'Jamie Hart Jewelry',
      },
      socialHandles: {
        tiktok: '@jamieh',
        instagram: '@jamiebling',
        facebook: null,
      },
      streamingContext: {
        primaryPlatform: 'tiktok',
        streamingFrequency: 'multiple_weekly',
        currentSetup: 'TikTok bio link and DMs',
        deviceSetup: 'phone_only',
      },
      teamContext: {
        teamName: 'Lindsey Team',
        teamSize: '6-20',
      },
      brandContext: {
        brandVibe: 'polished and warm',
        colorPreferences: 'plum and pearl',
        setupGoal: 'Cleaner show-night hub',
        specialRequests: 'Needs help with links',
      },
      prequalification: {
        status: 'needs_review',
        fitFlags: ['phone_only_setup'],
      },
    })
  })
})
