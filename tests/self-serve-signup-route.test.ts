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
  const setupSessionUpsert = vi.fn().mockResolvedValue({ error: null })
  const smsWalletUpsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return {
        select: repsSelect,
        insert: repsInsert,
      }
    }
    if (table === 'site_settings') return { upsert: siteSettingsUpsert }
    if (table === 'self_serve_setup_sessions') {
      return { upsert: setupSessionUpsert }
    }
    if (table === 'onboarding_status') {
      throw new Error('onboarding_status should not be written by tiny signup')
    }
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
    setupSessionUpsert,
    smsWalletUpsert,
    createUser,
    deleteUser,
    repsMaybeSingle,
    repsSingle,
  }
}

describe('POST /api/self-serve/signup', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalVercelEnv = process.env.VERCEL_ENV
  const originalReviewerSmokeMode = process.env.SPARKLE_REVIEWER_SMOKE_MODE

  beforeEach(() => {
    createAdminClientMock.mockReset()
    process.env.NODE_ENV = originalNodeEnv
    process.env.VERCEL_ENV = originalVercelEnv
    process.env.SPARKLE_REVIEWER_SMOKE_MODE = originalReviewerSmokeMode
    process.env.SPARKLE_SELF_SERVE_ENABLED = 'true'
  })

  it('creates only the auth user, rep account defaults, and checkout-required setup session', async () => {
    const admin = createAdminMock()
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          email: 'JAMIE@example.com',
          password: 'Sparkle2026!',
        }),
      }),
    )

    expect(admin.createUser).toHaveBeenCalledWith({
      email: 'jamie@example.com',
      password: 'Sparkle2026!',
      email_confirm: true,
    })
    expect(admin.repsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        auth_user_id: 'auth-self-serve',
        email: 'jamie@example.com',
        display_name: 'Jamie Hart',
        business_name: 'Jamie Hart',
        phone: null,
        custom_domain: null,
        public_site_slug: null,
        shop_link: null,
        streaming_links: {
          primary: null,
          secondary: null,
        },
        social_handles: {},
        template_id: 'default',
        status: 'onboarding',
        referral_code: expect.stringMatching(/^SS-[A-HJ-NP-Z2-9]{6}$/),
      }),
    )
    expect(admin.siteSettingsUpsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-self-serve',
        banner_text: 'Welcome to Jamie Hart',
        banner_visible: true,
        ticker_text: null,
        ticker_visible: false,
        tagline: 'A polished place to shop Jamie Hart.',
        team_name: 'Jamie Hart',
        show_join_page: true,
        hero_animation_type: 'sparkle_rise',
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      { onConflict: 'rep_id' },
    )
    expect(admin.setupSessionUpsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-self-serve',
        status: 'checkout_required',
        current_step: 'account_basics',
        completed_steps: ['self_serve_account_created'],
        answers: {
          displayName: 'Jamie Hart',
          email: 'jamie@example.com',
        },
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
      next: '/nic-nac?onboarding=checkout-required',
    })
  })

  it('assigns the new rep a public referral code and preserves a valid referring code for checkout', async () => {
    const admin = createAdminMock()
    admin.repsMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    admin.repsMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
          referralCode: ' ss-k7m4q9 ',
        }),
      }),
    )

    expect(response.status).toBe(201)
    expect(admin.repsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        referral_code: expect.stringMatching(/^SS-[A-HJ-NP-Z2-9]{6}$/),
      }),
    )
    expect(admin.setupSessionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: {
          displayName: 'Jamie Hart',
          email: 'jamie@example.com',
          referralCode: 'SS-K7M4Q9',
        },
      }),
      { onConflict: 'rep_id' },
    )
  })

  it('ignores setup source fields when a tiny signup payload contains legacy extras', async () => {
    const admin = createAdminMock()
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          businessName: 'Legacy Business',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
          phone: '303-555-0199',
          primarySocialUrl: 'https://www.tiktok.com/@legacy',
          shopUrl: 'https://legacy.example/shop',
        }),
      }),
    )

    expect(response.status).toBe(201)
    expect(admin.repsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_name: 'Jamie Hart',
        phone: null,
        shop_link: null,
        streaming_links: { primary: null, secondary: null },
      }),
    )
    expect(admin.setupSessionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: {
          displayName: 'Jamie Hart',
          email: 'jamie@example.com',
        },
      }),
      { onConflict: 'rep_id' },
    )
  })

  it('stays closed when self-serve is not enabled', async () => {
    process.env.SPARKLE_SELF_SERVE_ENABLED = 'false'
    process.env.VERCEL_ENV = 'preview'
    process.env.SPARKLE_REVIEWER_SMOKE_MODE = 'true'

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Jamie Hart',
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
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

  it('opens in Vercel preview when reviewer smoke mode is enabled', async () => {
    delete process.env.SPARKLE_SELF_SERVE_ENABLED
    process.env.NODE_ENV = 'production'
    process.env.VERCEL_ENV = 'preview'
    process.env.SPARKLE_REVIEWER_SMOKE_MODE = 'true'

    const admin = createAdminMock()
    createAdminClientMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Preview Buyer',
          email: 'preview@example.com',
          password: 'Sparkle2026!',
        }),
      }),
    )

    expect(response.status).toBe(201)
    expect(admin.createUser).toHaveBeenCalledWith({
      email: 'preview@example.com',
      password: 'Sparkle2026!',
      email_confirm: true,
    })
  })

  it('rejects invalid account input before writing provider state without requiring update consent', async () => {
    const response = await POST(
      new Request('http://localhost/api/self-serve/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'J',
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
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
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
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
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
          email: 'jamie@example.com',
          password: 'Sparkle2026!',
        }),
      }),
    )

    expect(admin.deleteUser).toHaveBeenCalledWith('auth-self-serve')
    expect(response.status).toBe(500)
  })
})
