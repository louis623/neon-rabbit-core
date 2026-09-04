import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensureLiveQueueSyncCodeForRepMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/services/live-queue', () => ({
  ensureLiveQueueSyncCodeForRep: (...args: unknown[]) =>
    ensureLiveQueueSyncCodeForRepMock(...args),
}))

import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'

function makeDeleteBuilder() {
  const eq = vi.fn().mockResolvedValue({ error: null })
  const inMock = vi.fn().mockResolvedValue({ error: null })
  const or = vi.fn().mockResolvedValue({ error: null })
  const match = vi.fn().mockResolvedValue({ error: null })
  const deleteMock = vi.fn(() => ({ eq, in: inMock, or, match }))
  return { delete: deleteMock, eq, in: inMock, or, match }
}

function makeReviewerAdmin() {
  const repSelectMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'rep-reviewer',
      auth_user_id: 'auth-reviewer',
      email: 'sparkle-reviewer+preview@neonrabbit.net',
    },
    error: null,
  })
  const repSelectEq = vi.fn(() => ({ maybeSingle: repSelectMaybeSingle }))
  const repSelect = vi.fn(() => ({ eq: repSelectEq }))
  const repUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const repUpdate = vi.fn(() => ({ eq: repUpdateEq }))
  const setupUpsert = vi.fn().mockResolvedValue({ error: null })
  const subscriptionUpsert = vi.fn().mockResolvedValue({ error: null })
  const teamManagementEntitlementUpsert = vi.fn().mockResolvedValue({ error: null })
  const designDelete = makeDeleteBuilder()
  const listingDelete = makeDeleteBuilder()
  const requestDelete = makeDeleteBuilder()
  const fulfillmentDelete = makeDeleteBuilder()
  const swapDelete = makeDeleteBuilder()
  const conversationDelete = makeDeleteBuilder()
  const workspaceConversationDelete = makeDeleteBuilder()
  const onboardingParticipantDelete = makeDeleteBuilder()
  const joinTeamMemberDelete = makeDeleteBuilder()
  const approvalDelete = makeDeleteBuilder()
  const runDelete = makeDeleteBuilder()
  const reminderPreferenceDelete = makeDeleteBuilder()
  const reminderOverrideDelete = makeDeleteBuilder()
  const audienceDelete = makeDeleteBuilder()
  const eventDelete = makeDeleteBuilder()
  const audienceUpsert = vi.fn().mockResolvedValue({ error: null })
  const eventUpsert = vi.fn().mockResolvedValue({ error: null })
  const updateUserById = vi.fn().mockResolvedValue({ error: null })

  const admin = {
    auth: {
      admin: {
        updateUserById,
      },
    },
    from: vi.fn((table: string) => {
      if (table === 'reps') {
        return {
          select: repSelect,
          update: repUpdate,
        }
      }
      if (table === 'self_serve_setup_sessions') {
        return { upsert: setupUpsert }
      }
      if (table === 'subscriptions') {
        return { upsert: subscriptionUpsert }
      }
      if (table === 'team_management_entitlements') {
        return { upsert: teamManagementEntitlementUpsert }
      }
      if (table === 'jewelry_designs') return designDelete
      if (table === 'trade_listings') return listingDelete
      if (table === 'trade_requests') return requestDelete
      if (table === 'trade_fulfillment') return fulfillmentDelete
      if (table === 'trade_swaps') return swapDelete
      if (table === 'nic_nac_conversations') return conversationDelete
      if (table === 'workspace_conversations') return workspaceConversationDelete
      if (table === 'team_onboarding_participants') return onboardingParticipantDelete
      if (table === 'join_team_members') return joinTeamMemberDelete
      if (table === 'approval_events') return approvalDelete
      if (table === 'nic_nac_runs') return runDelete
      if (table === 'show_reminder_preferences') return reminderPreferenceDelete
      if (table === 'show_reminder_overrides') return reminderOverrideDelete
      if (table === 'customer_audience') {
        return { ...audienceDelete, upsert: audienceUpsert }
      }
      if (table === 'calendar_events') {
        return { ...eventDelete, upsert: eventUpsert }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  }

  return {
    admin,
    spies: {
      approvalDelete,
      conversationDelete,
      workspaceConversationDelete,
      onboardingParticipantDelete,
      joinTeamMemberDelete,
      runDelete,
      setupUpsert,
      subscriptionUpsert,
      teamManagementEntitlementUpsert,
      designDelete,
      listingDelete,
      requestDelete,
      fulfillmentDelete,
      swapDelete,
      reminderPreferenceDelete,
      reminderOverrideDelete,
      audienceDelete,
      eventDelete,
      audienceUpsert,
      eventUpsert,
      repUpdate,
    },
  }
}

describe('reviewer smoke session reset', () => {
  beforeEach(() => {
    ensureLiveQueueSyncCodeForRepMock.mockReset()
    ensureLiveQueueSyncCodeForRepMock.mockResolvedValue({
      syncCode: 'BTR-7342',
      created: false,
    })
  })

  it('clears the reusable reviewer rep Nic-Nac history so setup preview starts fresh', async () => {
    const { admin, spies } = makeReviewerAdmin()

    const result = await resetReviewerSmokeSession(
      'required_setup',
      admin as never,
    )

    expect(result.next).toBe('/nic-nac?onboarding=required-setup')
    expect(spies.approvalDelete.delete).toHaveBeenCalled()
    expect(spies.approvalDelete.eq).toHaveBeenCalledWith('rep_id', 'rep-reviewer')
    expect(spies.runDelete.delete).toHaveBeenCalled()
    expect(spies.runDelete.eq).toHaveBeenCalledWith('rep_id', 'rep-reviewer')
    expect(spies.conversationDelete.delete).toHaveBeenCalled()
    expect(spies.conversationDelete.eq).toHaveBeenCalledWith(
      'rep_id',
      'rep-reviewer',
    )
  })

  it('clears synthetic Team Management data so the Alex smoke is repeatable', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('dashboard_unlocked', admin as never)

    expect(spies.onboardingParticipantDelete.eq).toHaveBeenCalledWith(
      'owner_rep_id',
      'rep-reviewer',
    )
    expect(spies.joinTeamMemberDelete.eq).toHaveBeenCalledWith(
      'rep_id',
      'rep-reviewer',
    )
    expect(spies.workspaceConversationDelete.match).toHaveBeenCalledWith({
      created_by_rep_id: 'rep-reviewer',
      conversation_type: 'team_onboarding',
    })
    expect(
      spies.workspaceConversationDelete.delete.mock.invocationCallOrder[0],
    ).toBeLessThan(
      spies.onboardingParticipantDelete.delete.mock.invocationCallOrder[0],
    )
  })

  it('ensures reviewer required setup has a real Live Queue sync code', async () => {
    const { admin } = makeReviewerAdmin()

    await resetReviewerSmokeSession('required_setup', admin as never)

    expect(ensureLiveQueueSyncCodeForRepMock).toHaveBeenCalledWith(
      admin,
      { repId: 'rep-reviewer' },
    )
  })

  it('starts required setup preview without stale welcome-copy answers', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('required_setup', admin as never)

    expect(spies.setupUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        current_step: 'account_basics',
        completed_steps: [],
        generated_copy: {},
        answers: expect.not.objectContaining({
          welcome_copy: expect.objectContaining({
            headline: 'Welcome, sparkle friends.',
          }),
        }),
      }),
      { onConflict: 'rep_id' },
    )
  })

  it('seeds active test subscription access for dashboard-unlocked smoke sessions', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('dashboard_unlocked', admin as never)

    expect(spies.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-reviewer',
        status: 'active',
        plan_tier: 'monthly',
        pricing_tier: 'smoke',
        stripe_livemode: false,
      }),
      { onConflict: 'rep_id' },
    )
  })

  it('always keeps the synthetic reviewer out of the public Finder directory', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('dashboard_unlocked', admin as never)

    expect(spies.repUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        account_classification: 'demo',
        status: 'active',
        finder_directory_visible: false,
      }),
    )
  })

  it('seeds Team Management beta access for dashboard workspace smoke sessions', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('dashboard_unlocked', admin as never)

    expect(spies.teamManagementEntitlementUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-reviewer',
        status: 'manual_beta',
        source: 'manual_beta',
        stripe_subscription_id: null,
        stripe_price_id: null,
        stripe_customer_id: 'cus_reviewer_smoke_rep-reviewer',
      }),
      { onConflict: 'rep_id' },
    )
  })

  it('clears legacy synthetic fulfillment jewelry from dashboard smoke sessions', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('dashboard_unlocked', admin as never)

    expect(spies.swapDelete.delete).toHaveBeenCalled()
    expect(spies.swapDelete.or).toHaveBeenCalledWith(
      expect.stringContaining('revealed_design_id.eq.00000000-0000-4000-8000-000000000101'),
    )
    expect(spies.fulfillmentDelete.eq).toHaveBeenCalledWith(
      'id',
      '00000000-0000-4000-8000-000000000104',
    )
    expect(spies.requestDelete.eq).toHaveBeenCalledWith(
      'id',
      '00000000-0000-4000-8000-000000000103',
    )
    expect(spies.listingDelete.eq).toHaveBeenCalledWith(
      'id',
      '00000000-0000-4000-8000-000000000102',
    )
    expect(spies.designDelete.eq).toHaveBeenCalledWith(
      'id',
      '00000000-0000-4000-8000-000000000101',
    )
  })

  it('seeds deterministic calendar and audience rows for dashboard Nic-Nac smoke', async () => {
    const { admin, spies } = makeReviewerAdmin()

    await resetReviewerSmokeSession('dashboard_unlocked', admin as never)

    expect(spies.reminderOverrideDelete.in).toHaveBeenCalledWith('event_id', [
      '00000000-0000-4000-8000-000000000202',
      '00000000-0000-4000-8000-000000000203',
    ])
    expect(spies.reminderPreferenceDelete.eq).toHaveBeenCalledWith(
      'rep_id',
      'rep-reviewer',
    )
    expect(spies.eventUpsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: '00000000-0000-4000-8000-000000000202',
          rep_id: 'rep-reviewer',
          platform: 'TikTok',
          is_recurring: true,
          recurrence_group_id: '00000000-0000-4000-8000-000000000201',
          status: 'scheduled',
          streaming_destinations: [
            { platform: 'tiktok', url: 'https://www.tiktok.com/@sparklesuitereviewer' },
          ],
        }),
        expect.objectContaining({
          id: '00000000-0000-4000-8000-000000000203',
          rep_id: 'rep-reviewer',
          is_recurring: true,
          recurrence_group_id: '00000000-0000-4000-8000-000000000201',
          status: 'scheduled',
          streaming_destinations: [
            { platform: 'tiktok', url: 'https://www.tiktok.com/@sparklesuitereviewer' },
            { platform: 'whatnot', url: 'https://www.whatnot.com/user/sparklesuitereviewer' },
          ],
        }),
      ],
      { onConflict: 'id' },
    )
    expect(spies.audienceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '00000000-0000-4000-8000-000000000204',
        rep_id: 'rep-reviewer',
        sms_consent: true,
        email_consent: true,
      }),
      { onConflict: 'id' },
    )
  })
})
