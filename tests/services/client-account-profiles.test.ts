import { describe, expect, it, vi } from 'vitest'
import { ensureClientAccountProfile } from '@/lib/services/client-account-profiles'

type TableName = 'reps' | 'self_serve_setup_sessions' | 'subscriptions' | 'client_account_profiles'

function makeSingleResult(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data, error })),
    single: vi.fn(async () => ({ data, error })),
  }
  return query
}

function makeUpsertResult(data: unknown, error: unknown = null) {
  const query = {
    upsert: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => ({ data, error })),
  }
  return query
}

function makeClient(options: {
  rep: Record<string, unknown>
  setup?: Record<string, unknown> | null
  subscription?: Record<string, unknown> | null
  profile?: Record<string, unknown>
}) {
  const queries = {
    reps: makeSingleResult(options.rep),
    self_serve_setup_sessions: makeSingleResult(options.setup ?? null),
    subscriptions: makeSingleResult(options.subscription ?? null),
    client_account_profiles: makeUpsertResult(
      options.profile ?? {
        id: 'profile-1',
        rep_id: options.rep.id,
        client_name: options.rep.business_name,
        show_name: options.rep.business_name,
        primary_contact_name: options.rep.display_name,
        email: options.rep.email,
        phone: options.rep.phone,
        account_status: options.rep.status,
        subscription_status: options.subscription?.status ?? null,
        support_tier: 'standard',
        public_site_slug: options.rep.public_site_slug,
        custom_domain: options.rep.custom_domain,
        setup_state: options.setup ?? {},
        source_snapshot: {},
      },
    ),
  } satisfies Record<TableName, unknown>

  return {
    client: {
      from: vi.fn((table: TableName) => queries[table]),
    },
    queries,
  }
}

describe('ensureClientAccountProfile', () => {
  it('creates a support-facing profile from rep and required setup data', async () => {
    const setup = {
      status: 'dashboard_unlocked',
      current_step: 'final_preview_approval',
      completed_steps: ['account_basics'],
      answers: {
        account_basics: {
          liveShowName: "Gracie's Sparkle Party Live",
          bestContactEmail: 'support-contact@example.com',
          publicSiteSlug: 'graciesparkleparty',
        },
      },
    }
    const { client, queries } = makeClient({
      rep: {
        id: 'rep-1',
        display_name: 'Gracie Roberts',
        business_name: "Gracie's Sparkle Party",
        email: 'gracie@example.com',
        phone: '555-111-2222',
        status: 'active',
        public_site_slug: 'graciesparkleparty',
        custom_domain: 'shop.gracie.example',
      },
      setup,
      subscription: { status: 'active' },
      profile: {
        id: 'profile-1',
        rep_id: 'rep-1',
        client_name: "Gracie's Sparkle Party",
        show_name: "Gracie's Sparkle Party Live",
        primary_contact_name: 'Gracie Roberts',
        email: 'support-contact@example.com',
        phone: '555-111-2222',
        account_status: 'active',
        subscription_status: 'active',
        support_tier: 'standard',
        public_site_slug: 'graciesparkleparty',
        custom_domain: 'shop.gracie.example',
        setup_state: setup,
        source_snapshot: {},
      },
    })

    const profile = await ensureClientAccountProfile(client as never, 'rep-1')

    expect(client.from).toHaveBeenCalledWith('reps')
    expect(client.from).toHaveBeenCalledWith('self_serve_setup_sessions')
    expect(client.from).toHaveBeenCalledWith('subscriptions')
    expect(client.from).toHaveBeenCalledWith('client_account_profiles')
    expect(queries.client_account_profiles.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        client_name: "Gracie's Sparkle Party",
        show_name: "Gracie's Sparkle Party Live",
        primary_contact_name: 'Gracie Roberts',
        email: 'support-contact@example.com',
        phone: '555-111-2222',
        account_status: 'active',
        subscription_status: 'active',
        support_tier: 'standard',
        public_site_slug: 'graciesparkleparty',
        custom_domain: 'shop.gracie.example',
        setup_state: setup,
      }),
      { onConflict: 'rep_id' },
    )
    expect(profile).toEqual({
      profileId: 'profile-1',
      repId: 'rep-1',
      clientName: "Gracie's Sparkle Party",
      showName: "Gracie's Sparkle Party Live",
      primaryContactName: 'Gracie Roberts',
      email: 'support-contact@example.com',
      phone: '555-111-2222',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      supportTier: 'standard',
      publicSiteSlug: 'graciesparkleparty',
      customDomain: 'shop.gracie.example',
      sourceSnapshot: expect.objectContaining({
        rep: expect.objectContaining({ id: 'rep-1' }),
        setup,
        subscription: { status: 'active' },
      }),
    })
  })

  it('falls back to rep business name and email when setup fields are missing', async () => {
    const { client, queries } = makeClient({
      rep: {
        id: 'rep-2',
        display_name: 'Sasha Lee',
        business_name: 'Sparkle by Sasha',
        email: 'sasha@example.com',
        phone: null,
        status: 'onboarding',
        public_site_slug: null,
        custom_domain: null,
      },
      setup: null,
      subscription: null,
      profile: {
        id: 'profile-2',
        rep_id: 'rep-2',
        client_name: 'Sparkle by Sasha',
        show_name: 'Sparkle by Sasha',
        primary_contact_name: 'Sasha Lee',
        email: 'sasha@example.com',
        phone: null,
        account_status: 'onboarding',
        subscription_status: null,
        support_tier: 'standard',
        public_site_slug: null,
        custom_domain: null,
        setup_state: {},
        source_snapshot: {},
      },
    })

    const profile = await ensureClientAccountProfile(client as never, 'rep-2')

    expect(queries.client_account_profiles.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_name: 'Sparkle by Sasha',
        show_name: 'Sparkle by Sasha',
        email: 'sasha@example.com',
        phone: null,
        subscription_status: null,
        setup_state: {},
      }),
      { onConflict: 'rep_id' },
    )
    expect(profile.showName).toBe('Sparkle by Sasha')
    expect(profile.email).toBe('sasha@example.com')
  })
})
