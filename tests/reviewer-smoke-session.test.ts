import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensureLiveQueueSyncCodeForRepMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/services/live-queue', () => ({
  ensureLiveQueueSyncCodeForRep: (...args: unknown[]) =>
    ensureLiveQueueSyncCodeForRepMock(...args),
}))

import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'

function makeDeleteBuilder() {
  const eq = vi.fn().mockResolvedValue({ error: null })
  const deleteMock = vi.fn(() => ({ eq }))
  return { delete: deleteMock, eq }
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
  const conversationDelete = makeDeleteBuilder()
  const approvalDelete = makeDeleteBuilder()
  const runDelete = makeDeleteBuilder()
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
      if (table === 'nic_nac_conversations') return conversationDelete
      if (table === 'approval_events') return approvalDelete
      if (table === 'nic_nac_runs') return runDelete
      throw new Error(`Unexpected table ${table}`)
    }),
  }

  return {
    admin,
    spies: {
      approvalDelete,
      conversationDelete,
      runDelete,
      setupUpsert,
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
})
