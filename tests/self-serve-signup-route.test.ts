import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { POST } from '@/app/api/self-serve/signup/route'

function createAdminMock() {
  const repsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const repsSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'rep-self-serve',
      auth_user_id: 'auth-self-serve',
      email: 'jamie@example.com',
    },
    error: null,
  })
  const repsSelect = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: repsMaybeSingle,
    })),
    single: repsSingle,
  }))
  const repsInsert = vi.fn(() => ({
    select: repsSelect,
  }))

  const siteSettingsUpsert = vi.fn().mockResolvedValue({ error: null })
  const onboardingUpsert = vi.fn().mockResolvedValue({ error: null })
  const smsWalletUpsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return {
        select: repsSelect,
        insert: repsInsert,
      }
    }
    if (table === 'site_settings') return { upsert: siteSettingsUpsert }
    if (table === 'onboarding_status') return { upsert: onboardingUpsert }
    if (table === 'sms_wallet') return { upsert: smsWalletUpsert }
    throw new Error(`unexpected table ${table}`)
  })

  const createUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'auth-self-serve' } },
    error: null,
  })
  const deleteUser = vi.fn().mockResolvedValue({
    data: {},
    error: null,
  })

  return {
    auth: {
      admin: {
        createUser,
        deleteUser,
      },
    },
    from,
    repsInsert,
    siteSettingsUpsert,
    onboardingUpsert,
    smsWalletUpsert,
    createUser,
    deleteUser,
    repsMaybeSingle,
    repsSingle,
  }
}

describe('POST /api/self-serve/signup', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    process.env.SPARKLE_SELF_SERVE_ENABLED = 'true'
  })

  it('creates the self-serve auth user, rep workspace defaults, and onboarding state', async () => {
    const admin = createAdminMock()
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Jamie Hart Sparkles',
          email: 'JAMIE@example.com',
          password: 'Sparkle2026!',
          phone: '303-555-0199',
          primarySocialUrl: 'https://www.tiktok.com/@jamiehart',
          emailConsent: true,
        }),
      }),
    )

    expect(admin.createUser).toHaveBeenCalledWith({
      email: 'jamie@example.com',
      password: 'Sparkle2026!',
      email_confirm: true,
    })
    expect(admin.repsInsert).toHaveBeenCalledWith({
      auth_user_id: 'auth-self-serve',
      email: 'jamie@example.com',
      display_name: 'Jamie Hart',
      business_name: 'Jamie Hart Sparkles',
      phone: '303-555-0199',
      custom_domain: null,
      shop_link: null,
      streaming_links: {
        primary: 'https://www.tiktok.com/@jamiehart',
        secondary: null,
      },
      social_handles: {},
      template_id: 'default',
      status: 'onboarding',
    })
    expect(admin.siteSettingsUpsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-self-serve',
        banner_text: 'Welcome to Jamie Hart Sparkles',
        banner_visible: true,
        ticker_text: null,
        ticker_visible: false,
        tagline: 'A polished place to shop Jamie Hart Sparkles.',
        team_name: 'Jamie Hart Sparkles',
        show_join_page: true,
        hero_animation_type: 'zoom',
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      { onConflict: 'rep_id' },
    )
    expect(admin.onboardingUpsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-self-serve',
        current_stage: 'signup_received',
        completed_steps: ['self_serve_account_created'],
      },
      { onConflict: 'rep_id' },
    )
    expect(admin.smsWalletUpsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-self-serve',
        balance_mils: 0,
        auto_recharge_enabled: false,
        auto_recharge_threshold_mils: 5000,
        auto_recharge_amount_mils: 25000,
        minimum_load_amount_mils: 25000,
      },
      { onConflict: 'rep_id' },
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      repId: 'rep-self-serve',
      email: 'jamie@example.com',
      next: '/nic-nac?section=account&onboarding=self-serve-started',
    })
  })

  it('stays closed when self-serve is not enabled', async () => {
    process.env.SPARKLE_SELF_SERVE_ENABLED = 'false'

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Jamie Hart Sparkles',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
          emailConsent: true,
        }),
      }),
    )

    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: 'SELF_SERVE_NOT_OPEN',
      error: 'Sparkle Suite self-serve signup is not open yet.',
    })
  })

  it('rejects invalid account input before writing provider state without requiring update consent', async () => {
    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'J',
          businessName: '',
          email: 'not-an-email',
          password: 'short',
        }),
      }),
    )

    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'Please check the signup form and try again.',
      fields: expect.objectContaining({
        businessName: expect.any(Array),
        displayName: expect.any(Array),
        email: expect.any(Array),
        password: expect.any(Array),
      }),
    })
  })

  it('creates the account when update consent is omitted', async () => {
    const admin = createAdminMock()
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Jamie Hart Sparkles',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
        }),
      }),
    )

    expect(response.status).toBe(201)
    expect(admin.createUser).toHaveBeenCalled()
  })

  it('returns a retry-safe conflict when Supabase auth already has that email', async () => {
    const admin = createAdminMock()
    admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    })
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Jamie Hart Sparkles',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
          emailConsent: true,
        }),
      }),
    )

    expect(admin.repsInsert).not.toHaveBeenCalled()
    expect(admin.deleteUser).not.toHaveBeenCalled()
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: 'ACCOUNT_ALREADY_EXISTS',
      error:
        'A Sparkle Suite account already exists for this email. Sign in to continue or contact support.',
    })
  })

  it('removes the created auth user when rep workspace creation fails', async () => {
    const admin = createAdminMock()
    admin.repsSingle.mockResolvedValue({
      data: null,
      error: { message: 'insert failed' },
    })
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Jamie Hart Sparkles',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
          emailConsent: true,
        }),
      }),
    )

    expect(admin.deleteUser).toHaveBeenCalledWith('auth-self-serve')
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to create your Sparkle Suite account right now.',
    })
  })

  it('removes the created auth user when workspace defaults fail', async () => {
    const admin = createAdminMock()
    admin.siteSettingsUpsert.mockResolvedValue({ error: { message: 'upsert failed' } })
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Jamie Hart Sparkles',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
          emailConsent: true,
        }),
      }),
    )

    expect(admin.deleteUser).toHaveBeenCalledWith('auth-self-serve')
    expect(response.status).toBe(500)
  })
})
