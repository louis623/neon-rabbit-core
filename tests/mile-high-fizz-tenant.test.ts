import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensureLiveQueueSyncCodeForRepMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/services/live-queue', () => ({
  ensureLiveQueueSyncCodeForRep: ensureLiveQueueSyncCodeForRepMock,
}))

import {
  attachMileHighFizzTenant,
  MILE_HIGH_FIZZ_PROFILE,
} from '@/lib/mile-high-fizz/tenant'

function makeRepUpdateResult(repId: string, email = MILE_HIGH_FIZZ_PROFILE.email) {
  return {
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: repId, email },
          error: null,
        }),
      })),
    })),
  }
}

function makeRepInsertResult(repId: string, email = MILE_HIGH_FIZZ_PROFILE.email) {
  return {
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: { id: repId, email },
        error: null,
      }),
    })),
  }
}

function makeAdminClient({
  candidateReps = [],
  authUsers = [],
  createdAuthUserId = 'auth-created',
  repId = 'rep-mile-high-fizz',
}: {
  candidateReps?: Array<{
    id: string
    auth_user_id: string | null
    email: string
    display_name: string
    business_name: string
  }>
  authUsers?: Array<{ id: string; email?: string | null }>
  createdAuthUserId?: string
  repId?: string
} = {}) {
  const calls = {
    repInsert: vi.fn((payload: unknown) => makeRepInsertResult(repId)),
    repUpdate: vi.fn((payload: unknown) => makeRepUpdateResult(candidateReps[0]?.id ?? repId)),
    siteSettingsUpsert: vi.fn().mockResolvedValue({ error: null }),
    onboardingUpsert: vi.fn().mockResolvedValue({ error: null }),
    setupSessionUpsert: vi.fn().mockResolvedValue({ error: null }),
    subscriptionUpsert: vi.fn().mockResolvedValue({ error: null }),
    createUser: vi.fn().mockResolvedValue({
      data: { user: { id: createdAuthUserId } },
      error: null,
    }),
    updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
    listUsers: vi.fn().mockResolvedValue({
      data: { users: authUsers },
      error: null,
    }),
  }

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return {
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValue({
            data: candidateReps,
            error: null,
          }),
        })),
        update: calls.repUpdate,
        insert: calls.repInsert,
      }
    }

    if (table === 'site_settings') {
      return { upsert: calls.siteSettingsUpsert }
    }

    if (table === 'onboarding_status') {
      return { upsert: calls.onboardingUpsert }
    }

    if (table === 'self_serve_setup_sessions') {
      return { upsert: calls.setupSessionUpsert }
    }

    if (table === 'subscriptions') {
      return { upsert: calls.subscriptionUpsert }
    }

    throw new Error(`Unexpected table ${table}`)
  })

  return {
    admin: {
      from,
      auth: {
        admin: {
          listUsers: calls.listUsers,
          createUser: calls.createUser,
          updateUserById: calls.updateUserById,
        },
      },
    } as never,
    calls,
  }
}

describe('Mile High Fizz tenant attachment', () => {
  beforeEach(() => {
    ensureLiveQueueSyncCodeForRepMock.mockReset()
    ensureLiveQueueSyncCodeForRepMock.mockResolvedValue({
      syncCode: 'MHF-1188',
      created: false,
    })
  })

  it('creates Lindsey auth, rep, workspace defaults, subscription gate, and live queue when no rep exists', async () => {
    const { admin, calls } = makeAdminClient()

    const result = await attachMileHighFizzTenant(
      { temporaryPassword: 'MHF-temporary-2026!' },
      admin,
    )

    expect(result).toMatchObject({
      repId: 'rep-mile-high-fizz',
      email: MILE_HIGH_FIZZ_PROFILE.email,
      createdRep: true,
      createdAuthUser: true,
      updatedAuthPassword: false,
      liveQueueSyncCode: 'MHF-1188',
      createdLiveQueue: false,
      readyForDomainCutover: true,
    })
    expect(calls.createUser).toHaveBeenCalledWith({
      email: MILE_HIGH_FIZZ_PROFILE.email,
      password: 'MHF-temporary-2026!',
      email_confirm: true,
    })
    expect(calls.repInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        auth_user_id: 'auth-created',
        email: MILE_HIGH_FIZZ_PROFILE.email,
        display_name: MILE_HIGH_FIZZ_PROFILE.displayName,
        business_name: MILE_HIGH_FIZZ_PROFILE.businessName,
        custom_domain: null,
        public_site_slug: MILE_HIGH_FIZZ_PROFILE.publicSiteSlug,
        streaming_links: expect.objectContaining({
          tiktok: MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
        }),
      }),
    )
    expect(calls.siteSettingsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-mile-high-fizz',
        team_name: MILE_HIGH_FIZZ_PROFILE.businessName,
        show_join_page: true,
        customer_site_template: 'amethyst',
      }),
      { onConflict: 'rep_id' },
    )
    expect(calls.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-mile-high-fizz',
        plan_tier: 'monthly',
        status: 'active',
        monthly_amount: 0,
      }),
      { onConflict: 'rep_id' },
    )
    expect(calls.setupSessionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-mile-high-fizz',
        status: 'dashboard_unlocked',
        current_step: 'final_preview_approval',
        completed_steps: [
          'account_basics',
          'site_skin',
          'welcome_copy',
          'about_page',
          'show_schedule',
          'customer_site_orientation',
          'live_queue_setup',
          'trade_board_orientation',
          'final_preview_approval',
        ],
        dashboard_unlocked_at: expect.any(String),
        support_state: expect.objectContaining({
          migrated_existing_client: expect.objectContaining({
            enabled: true,
            source: 'mile_high_fizz_migration',
          }),
        }),
      }),
      { onConflict: 'rep_id' },
    )
    expect(ensureLiveQueueSyncCodeForRepMock).toHaveBeenCalledWith(admin, {
      repId: 'rep-mile-high-fizz',
    })
  })

  it('updates an existing Lindsey rep without creating a duplicate or replacing the live queue sync code', async () => {
    const { admin, calls } = makeAdminClient({
      candidateReps: [
        {
          id: 'rep-existing',
          auth_user_id: 'auth-existing',
          email: MILE_HIGH_FIZZ_PROFILE.email,
          display_name: 'Lindsey Chapman',
          business_name: 'Mile High Fizz',
        },
      ],
    })

    const result = await attachMileHighFizzTenant({}, admin)

    expect(result).toMatchObject({
      repId: 'rep-existing',
      createdRep: false,
      createdAuthUser: false,
      liveQueueSyncCode: 'MHF-1188',
      createdLiveQueue: false,
    })
    expect(calls.createUser).not.toHaveBeenCalled()
    expect(calls.repInsert).not.toHaveBeenCalled()
    expect(calls.repUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        auth_user_id: 'auth-existing',
        custom_domain: null,
        public_site_slug: MILE_HIGH_FIZZ_PROFILE.publicSiteSlug,
      }),
    )
  })

  it('requires a temporary password when creating Lindsey auth', async () => {
    const { admin } = makeAdminClient()

    await expect(attachMileHighFizzTenant({}, admin)).rejects.toThrow(
      "temporaryPassword is required to create Lindsey's Sparkle Suite login.",
    )
  })

  it('updates an existing auth password only when explicitly requested', async () => {
    const { admin, calls } = makeAdminClient({
      candidateReps: [
        {
          id: 'rep-existing',
          auth_user_id: 'auth-existing',
          email: MILE_HIGH_FIZZ_PROFILE.email,
          display_name: 'Lindsey Chapman',
          business_name: 'Mile High Fizz',
        },
      ],
    })

    const result = await attachMileHighFizzTenant(
      {
        temporaryPassword: 'MHF-temporary-2026!',
        updateAuthPassword: true,
      },
      admin,
    )

    expect(result.updatedAuthPassword).toBe(true)
    expect(calls.updateUserById).toHaveBeenCalledWith('auth-existing', {
      password: 'MHF-temporary-2026!',
      email_confirm: true,
    })
  })

  it('stops when multiple possible Lindsey records exist', async () => {
    const { admin, calls } = makeAdminClient({
      candidateReps: [
        {
          id: 'rep-one',
          auth_user_id: 'auth-one',
          email: MILE_HIGH_FIZZ_PROFILE.email,
          display_name: 'Lindsey Chapman',
          business_name: 'Mile High Fizz',
        },
        {
          id: 'rep-two',
          auth_user_id: 'auth-two',
          email: 'other@example.test',
          display_name: 'Lindsey',
          business_name: 'Lindsey Reveals',
        },
      ],
    })

    await expect(
      attachMileHighFizzTenant({ temporaryPassword: 'MHF-temporary-2026!' }, admin),
    ).rejects.toThrow(
      'Found 2 possible Lindsey/Mile High Fizz rep records.',
    )
    expect(calls.createUser).not.toHaveBeenCalled()
    expect(calls.repInsert).not.toHaveBeenCalled()
  })
})
