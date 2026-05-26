import { describe, expect, it, vi } from 'vitest'

import { preparePrelaunchClientAccountForLaunchBuild } from '@/lib/prelaunch/client-account'

function makeAdminClient() {
  const fromMock = vi.fn()
  const createUserMock = vi.fn()
  const listUsersMock = vi.fn()

  return {
    admin: {
      auth: {
        admin: {
          createUser: createUserMock,
          listUsers: listUsersMock,
        },
      },
      from: fromMock,
    },
    fromMock,
    createUserMock,
    listUsersMock,
  }
}

describe('prelaunch client account provisioning', () => {
  it('creates the real rep account shell from a ready launch build without sending invites', async () => {
    const { admin, fromMock, createUserMock, listUsersMock } = makeAdminClient()
    const selectBuildMock = vi.fn()
    const eqBuildMock = vi.fn()
    const singleBuildMock = vi.fn()
    const selectProfileMock = vi.fn()
    const eqProfileMock = vi.fn()
    const maybeSingleProfileMock = vi.fn()
    const selectRepLookupMock = vi.fn()
    const eqRepLookupMock = vi.fn()
    const maybeSingleRepLookupMock = vi.fn()
    const insertRepMock = vi.fn()
    const selectRepMock = vi.fn()
    const singleRepMock = vi.fn()
    const upsertSiteSettingsMock = vi.fn()
    const upsertOnboardingMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectBuildMock })
      .mockReturnValueOnce({ select: selectProfileMock })
      .mockReturnValueOnce({ select: selectRepLookupMock })
      .mockReturnValueOnce({ insert: insertRepMock })
      .mockReturnValueOnce({ upsert: upsertSiteSettingsMock })
      .mockReturnValueOnce({ upsert: upsertOnboardingMock })
    selectBuildMock.mockReturnValueOnce({ eq: eqBuildMock })
    eqBuildMock.mockReturnValueOnce({ single: singleBuildMock })
    singleBuildMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        rep_id: null,
        lead_name: 'Louis Sparkle',
        lead_email: 'Louis+Real@NeonRabbit.net',
        setup_profile_status: 'ready',
        payment_gate_status: 'ready',
        agreement_gate_status: 'ready',
        build_check_status: 'passed',
      },
      error: null,
    })
    selectProfileMock.mockReturnValueOnce({ eq: eqProfileMock })
    eqProfileMock.mockReturnValueOnce({ maybeSingle: maybeSingleProfileMock })
    maybeSingleProfileMock.mockResolvedValueOnce({
      data: {
        business_name: 'Louis Live Sparkles',
        public_site_goal: 'A real public live shopping hub.',
        custom_domain: 'louis.sparklesuite.test',
        primary_social_url: 'https://tiktok.com/@louis',
        secondary_social_url: 'https://instagram.com/louis',
        shop_url: 'https://example.com/shop',
        brand_notes: 'Bright and simple.',
      },
      error: null,
    })
    selectRepLookupMock.mockReturnValueOnce({ eq: eqRepLookupMock })
    eqRepLookupMock.mockReturnValueOnce({ maybeSingle: maybeSingleRepLookupMock })
    maybeSingleRepLookupMock.mockResolvedValueOnce({ data: null, error: null })
    listUsersMock.mockResolvedValueOnce({ data: { users: [] }, error: null })
    createUserMock.mockResolvedValueOnce({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    })
    insertRepMock.mockReturnValueOnce({ select: selectRepMock })
    selectRepMock.mockReturnValueOnce({ single: singleRepMock })
    singleRepMock.mockResolvedValueOnce({
      data: {
        id: 'rep-1',
        auth_user_id: 'auth-user-1',
        email: 'louis+real@neonrabbit.net',
        display_name: 'Louis Sparkle',
        business_name: 'Louis Live Sparkles',
      },
      error: null,
    })
    upsertSiteSettingsMock.mockResolvedValueOnce({ error: null })
    upsertOnboardingMock.mockResolvedValueOnce({ error: null })

    const result = await preparePrelaunchClientAccountForLaunchBuild(
      {
        launchBuildId: 'build-1',
        temporaryPassword: 'RealCustomerTemp2026!',
      },
      admin as never,
    )

    expect(createUserMock).toHaveBeenCalledWith({
      email: 'louis+real@neonrabbit.net',
      password: 'RealCustomerTemp2026!',
      email_confirm: true,
    })
    expect(insertRepMock).toHaveBeenCalledWith({
      auth_user_id: 'auth-user-1',
      email: 'louis+real@neonrabbit.net',
      display_name: 'Louis Sparkle',
      business_name: 'Louis Live Sparkles',
      custom_domain: 'louis.sparklesuite.test',
      phone: null,
      shop_link: 'https://example.com/shop',
      streaming_links: {
        primary: 'https://tiktok.com/@louis',
        secondary: 'https://instagram.com/louis',
      },
      social_handles: {},
      template_id: 'default',
      status: 'active',
    })
    expect(upsertSiteSettingsMock).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        tagline: 'A real public live shopping hub.',
        banner_text: 'Welcome to Louis Live Sparkles',
        banner_visible: true,
        ticker_text: null,
        ticker_visible: false,
        team_name: 'Louis Live Sparkles',
        show_join_page: true,
        hero_animation_type: 'zoom',
      },
      { onConflict: 'rep_id' },
    )
    expect(upsertOnboardingMock).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        current_stage: 'launch_ready',
        completed_steps: [
          'waitlist',
          'conversation',
          'setup_profile',
          'payment_gate',
          'agreement_gate',
          'build_checks',
        ],
      },
      { onConflict: 'rep_id' },
    )
    expect(result).toMatchObject({
      repId: 'rep-1',
      email: 'louis+real@neonrabbit.net',
      createdAuthUser: true,
      sentInvite: false,
    })
  })

  it('refuses to create an account before launch gates and checks are ready', async () => {
    const { admin, fromMock, createUserMock } = makeAdminClient()
    const selectBuildMock = vi.fn()
    const eqBuildMock = vi.fn()
    const singleBuildMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectBuildMock })
    selectBuildMock.mockReturnValueOnce({ eq: eqBuildMock })
    eqBuildMock.mockReturnValueOnce({ single: singleBuildMock })
    singleBuildMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        rep_id: null,
        lead_name: 'Louis Sparkle',
        lead_email: 'louis@example.com',
        setup_profile_status: 'drafted',
        payment_gate_status: 'disabled',
        agreement_gate_status: 'ready',
        build_check_status: 'not_started',
      },
      error: null,
    })

    await expect(
      preparePrelaunchClientAccountForLaunchBuild(
        {
          launchBuildId: 'build-1',
          temporaryPassword: 'RealCustomerTemp2026!',
        },
        admin as never,
      ),
    ).rejects.toThrow(
      'Client account requires setup, payment, agreement, and build checks to be ready.',
    )
    expect(createUserMock).not.toHaveBeenCalled()
  })
})
