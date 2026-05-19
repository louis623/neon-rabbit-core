import { describe, expect, it } from 'vitest'

import {
  buildPrelaunchIntakeInsert,
  validatePrelaunchIntakeInput,
} from '@/lib/prelaunch/intake'
import { ServiceError } from '@/lib/services/errors'

describe('validatePrelaunchIntakeInput', () => {
  it('accepts and normalizes the Nic-Nac pre-qualification fields', () => {
    const result = validatePrelaunchIntakeInput({
      fullName: ' Jamie Hart ',
      email: ' JAMIE@EXAMPLE.COM ',
      phone: ' 303-555-0123 ',
      businessName: ' Jamie Hart Jewelry ',
      tiktokHandle: ' jamieh ',
      instagramHandle: ' @jamiebling ',
      facebookUrl: '',
      teamName: ' Lindsey Team ',
      teamSize: '6-20',
      primaryPlatform: 'tiktok',
      streamingFrequency: 'weekly',
      currentSetup: 'TikTok bio link and DMs',
      setupGoal: 'A cleaner hub before launch nights',
      deviceSetup: 'phone_and_computer',
      brandVibe: 'polished and warm',
      colorPreferences: 'plum and pearl',
      specialRequests: 'Needs help organizing show links',
      referralCode: ' ss-k7m4q9 ',
      smsConsent: true,
      emailConsent: true,
    })

    expect(result).toEqual({
      fullName: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '303-555-0123',
      businessName: 'Jamie Hart Jewelry',
      tiktokHandle: '@jamieh',
      instagramHandle: '@jamiebling',
      facebookUrl: undefined,
      teamName: 'Lindsey Team',
      teamSize: '6-20',
      primaryPlatform: 'tiktok',
      streamingFrequency: 'weekly',
      currentSetup: 'TikTok bio link and DMs',
      setupGoal: 'A cleaner hub before launch nights',
      deviceSetup: 'phone_and_computer',
      brandVibe: 'polished and warm',
      colorPreferences: 'plum and pearl',
      specialRequests: 'Needs help organizing show links',
      referralCode: 'SS-K7M4Q9',
      smsConsent: true,
      emailConsent: true,
    })
  })

  it('requires at least one social or streaming handle', () => {
    expect(() =>
      validatePrelaunchIntakeInput({
        fullName: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '303-555-0123',
        businessName: 'Jamie Hart Jewelry',
        tiktokHandle: '',
        instagramHandle: '',
        facebookUrl: '',
        teamSize: '1-5',
        primaryPlatform: 'tiktok',
        streamingFrequency: 'weekly',
        currentSetup: 'Bio link',
        setupGoal: 'Cleaner setup',
        deviceSetup: 'phone_and_computer',
        smsConsent: true,
        emailConsent: true,
      }),
    ).toThrow(ServiceError)
  })

  it('keeps scheme-less social profile URLs readable for Scout and operators', () => {
    const result = validatePrelaunchIntakeInput({
      fullName: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '303-555-0123',
      businessName: 'Jamie Hart Jewelry',
      tiktokHandle: 'tiktok.com/@jamieh',
      instagramHandle: 'www.instagram.com/jamiebling',
      facebookUrl: 'facebook.com/groups/jamiebling',
      teamSize: '1-5',
      primaryPlatform: 'tiktok',
      streamingFrequency: 'weekly',
      currentSetup: 'Bio link',
      setupGoal: 'Cleaner setup',
      deviceSetup: 'phone_and_computer',
      smsConsent: true,
      emailConsent: true,
    })

    expect(result.tiktokHandle).toBe('https://www.tiktok.com/@jamieh')
    expect(result.instagramHandle).toBe(
      'https://www.instagram.com/jamiebling/',
    )
    expect(result.facebookUrl).toBe('https://www.facebook.com/groups/jamiebling')
  })

  it('builds the Supabase insert payload with fit flags for phone-only setup', () => {
    const insert = buildPrelaunchIntakeInsert({
      fullName: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '303-555-0123',
      businessName: 'Jamie Hart Jewelry',
      tiktokHandle: '@jamieh',
      instagramHandle: '',
      facebookUrl: '',
      teamName: '',
      teamSize: '1-5',
      primaryPlatform: 'tiktok',
      streamingFrequency: 'not_live_yet',
      currentSetup: 'Phone only',
      setupGoal: 'Need help getting ready',
      deviceSetup: 'phone_only',
      brandVibe: '',
      colorPreferences: '',
      specialRequests: '',
      referralCode: 'ss-r2p8tx',
      smsConsent: true,
      emailConsent: true,
    })

    expect(insert).toEqual({
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
      streaming_frequency: 'not_live_yet',
      current_setup: 'Phone only',
      setup_goal: 'Need help getting ready',
      device_setup: 'phone_only',
      brand_vibe: null,
      color_preferences: null,
      special_requests: null,
      referral_code: 'SS-R2P8TX',
      sms_consent: true,
      email_consent: true,
      prequalification_status: 'needs_review',
      fit_flags: ['phone_only_setup', 'not_live_yet'],
      waitlist_id: null,
      scout_input_status: 'ready',
      warmup_sequence_status: 'intake_received',
      source: 'prelaunch_intake',
    })
  })
})
