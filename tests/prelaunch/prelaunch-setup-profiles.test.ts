import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import {
  loadPrelaunchLaunchSetupProfilesByBuildIds,
  normalizePrelaunchLaunchSetupProfileRows,
  upsertPrelaunchLaunchSetupProfile,
} from '@/lib/prelaunch/setup-profiles'

describe('prelaunch launch setup profiles', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('normalizes setup profile rows for the active build folder', () => {
    expect(
      normalizePrelaunchLaunchSetupProfileRows([
        {
          id: 'profile-1',
          launch_build_id: 'build-1',
          business_name: 'Sparkle Demo Shop',
          public_site_goal: 'Launch a clean live shopping hub.',
          custom_domain: 'lindsey.sparklesuite.test',
          primary_social_url: 'https://example.com/social',
          secondary_social_url: null,
          shop_url: null,
          brand_notes: 'Bright, practical, friendly.',
          must_have_launch_notes: 'Start with profile and show links.',
          open_questions: ['Confirm launch fee.'],
          status: 'draft',
          created_at: '2026-05-21T21:00:00Z',
          updated_at: '2026-05-21T21:01:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'profile-1',
        launchBuildId: 'build-1',
        businessName: 'Sparkle Demo Shop',
        publicSiteGoal: 'Launch a clean live shopping hub.',
        customDomain: 'lindsey.sparklesuite.test',
        primarySocialUrl: 'https://example.com/social',
        secondarySocialUrl: null,
        shopUrl: null,
        brandNotes: 'Bright, practical, friendly.',
        mustHaveLaunchNotes: 'Start with profile and show links.',
        openQuestions: ['Confirm launch fee.'],
        status: 'draft',
        createdAt: '2026-05-21T21:00:00Z',
        updatedAt: '2026-05-21T21:01:00Z',
      },
    ])
  })

  it('does not query Supabase when there are no launch build ids', async () => {
    await expect(
      loadPrelaunchLaunchSetupProfilesByBuildIds([]),
    ).resolves.toEqual([])
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('loads setup profiles for active launch builds', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockResolvedValueOnce({
      data: [
        {
          id: 'profile-1',
          launch_build_id: 'build-1',
          business_name: 'Sparkle Demo Shop',
          public_site_goal: '',
          custom_domain: null,
          primary_social_url: null,
          secondary_social_url: null,
          shop_url: null,
          brand_notes: '',
          must_have_launch_notes: '',
          open_questions: [],
          status: 'draft',
          created_at: '2026-05-21T21:00:00Z',
          updated_at: '2026-05-21T21:01:00Z',
        },
      ],
      error: null,
    })

    const profiles = await loadPrelaunchLaunchSetupProfilesByBuildIds(['build-1'])

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_launch_setup_profiles')
    expect(selectMock).toHaveBeenCalled()
    expect(inMock).toHaveBeenCalledWith('launch_build_id', ['build-1'])
    expect(profiles).toHaveLength(1)
    expect(profiles[0].businessName).toBe('Sparkle Demo Shop')
  })

  it('treats a missing setup profile table as empty while migrations catch up', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST205',
        message:
          "Could not find the table 'public.sparkle_suite_launch_setup_profiles' in the schema cache",
      },
    })

    await expect(
      loadPrelaunchLaunchSetupProfilesByBuildIds(['build-1']),
    ).resolves.toEqual([])
  })

  it('upserts a setup profile and marks the launch build profile gate without providers', async () => {
    const upsertMock = vi.fn()
    const selectMock = vi.fn()
    const singleMock = vi.fn()
    const buildSelectMock = vi.fn()
    const buildSingleMock = vi.fn()
    const updateMock = vi.fn()
    const eqMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ upsert: upsertMock })
      .mockReturnValueOnce({ select: buildSelectMock })
      .mockReturnValueOnce({ update: updateMock })
    upsertMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ single: singleMock })
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'profile-1',
        launch_build_id: 'build-1',
        business_name: 'Sparkle Demo Shop',
        public_site_goal: 'Launch a clean live shopping hub.',
        custom_domain: 'demo.sparklesuite.test',
        primary_social_url: null,
        secondary_social_url: null,
        shop_url: null,
        brand_notes: '',
        must_have_launch_notes: '',
        open_questions: ['Confirm logo.'],
        status: 'ready',
        created_at: '2026-05-21T21:00:00Z',
        updated_at: '2026-05-21T21:01:00Z',
      },
      error: null,
    })
    buildSelectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ single: buildSingleMock })
    buildSingleMock.mockResolvedValueOnce({
      data: {
        payment_gate_status: 'disabled',
        agreement_gate_status: 'disabled',
        build_check_status: 'not_started',
        production_roster_status: 'not_started',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockResolvedValueOnce({ data: null, error: null })

    const profile = await upsertPrelaunchLaunchSetupProfile({
      launchBuildId: 'build-1',
      businessName: 'Sparkle Demo Shop',
      publicSiteGoal: 'Launch a clean live shopping hub.',
      customDomain: ' Demo.SparkleSuite.test ',
      openQuestions: ['Confirm logo.'],
      status: 'ready',
    })

    expect(fromMock).toHaveBeenNthCalledWith(
      1,
      'sparkle_suite_launch_setup_profiles',
    )
    expect(upsertMock).toHaveBeenCalledWith(
      {
        launch_build_id: 'build-1',
        business_name: 'Sparkle Demo Shop',
        public_site_goal: 'Launch a clean live shopping hub.',
        custom_domain: 'demo.sparklesuite.test',
        primary_social_url: null,
        secondary_social_url: null,
        shop_url: null,
        brand_notes: '',
        must_have_launch_notes: '',
        open_questions: ['Confirm logo.'],
        status: 'ready',
      },
      { onConflict: 'launch_build_id' },
    )
    expect(fromMock).toHaveBeenNthCalledWith(2, 'sparkle_suite_launch_builds')
    expect(buildSelectMock).toHaveBeenCalledWith(
      'payment_gate_status, agreement_gate_status, build_check_status, production_roster_status',
    )
    expect(fromMock).toHaveBeenNthCalledWith(3, 'sparkle_suite_launch_builds')
    expect(updateMock).toHaveBeenCalledWith({
      setup_profile_status: 'ready',
      stage: 'setup_profile',
      status: 'blocked',
      blockers: [
        'Payment gate is disabled.',
        'Agreement gate is disabled.',
        'Build checks have not started.',
        'Production roster is not connected.',
      ],
    })
    expect(eqMock).toHaveBeenCalledWith('id', 'build-1')
    expect(profile.status).toBe('ready')
  })
})
