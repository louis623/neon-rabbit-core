import {
  REQUIRED_SETUP_STEPS,
  type RequiredSetupStepId,
} from '@/lib/self-serve/required-setup'
import {
  createSelfServeWorkspaceForAuthUser,
  type SelfServeWorkspaceAccount,
} from '@/lib/self-serve/signup'
import { ensureLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  REVIEWER_SMOKE_NEXT_PATHS,
  getReviewerSmokePersona,
  normalizeReviewerSmokeState,
  type ReviewerSmokeState,
} from './config'

type AdminClient = ReturnType<typeof createAdminClient>

type ExistingRep = {
  id: string
  auth_user_id: string | null
  email: string
}

type AuthUser = {
  id: string
  email?: string | null
}

function completedStepsForState(state: ReviewerSmokeState): RequiredSetupStepId[] {
  if (state !== 'dashboard_unlocked') return []
  return REQUIRED_SETUP_STEPS.map((step) => step.id)
}

function setupAnswersForReviewer(persona: ReturnType<typeof getReviewerSmokePersona>) {
  return {
    account_basics: {
      businessName: 'Britt Test Rep Sparkle Studio',
      repName: persona.displayName,
      email: persona.email,
      note: 'Reviewer smoke mode synthetic data only.',
    },
    site_skin: {
      preset: 'sparkle_suite_morganite',
      tone: 'warm, polished, customer-ready',
    },
  }
}

async function findAuthUserByEmail(admin: AdminClient, email: string) {
  const authAdmin = admin.auth.admin as {
    listUsers?: (params?: { page?: number; perPage?: number }) => Promise<{
      data?: { users?: AuthUser[] }
      error?: unknown
    }>
  }
  if (!authAdmin.listUsers) return null

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await authAdmin.listUsers({
      page,
      perPage: 100,
    })
    if (error) throw error
    const users = data?.users ?? []
    const match = users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    )
    if (match) return match
    if (users.length < 100) return null
  }

  return null
}

async function ensureReviewerAuthUser(
  admin: AdminClient,
  account: SelfServeWorkspaceAccount & { password: string },
) {
  const { data: existingRep, error: repError } = await admin
    .from('reps')
    .select('id, auth_user_id, email')
    .eq('email', account.email)
    .maybeSingle<ExistingRep>()

  if (repError) throw repError

  const existingAuthUserId = existingRep?.auth_user_id ?? null
  if (existingAuthUserId) {
    const { error } = await admin.auth.admin.updateUserById(
      existingAuthUserId,
      {
        password: account.password,
        user_metadata: {
          display_name: account.displayName,
          reviewer_smoke: true,
        },
      },
    )
    if (error) throw error
    return {
      authUserId: existingAuthUserId,
      repId: existingRep?.id ?? null,
    }
  }

  const existingAuthUser = await findAuthUserByEmail(admin, account.email)
  if (existingAuthUser) {
    const { error } = await admin.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password: account.password,
        user_metadata: {
          display_name: account.displayName,
          reviewer_smoke: true,
        },
      },
    )
    if (error) throw error
    return {
      authUserId: existingAuthUser.id,
      repId: existingRep?.id ?? null,
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      display_name: account.displayName,
      reviewer_smoke: true,
    },
  })

  if (error) throw error
  const authUserId = data.user?.id
  if (!authUserId) throw new Error('Supabase did not return reviewer auth id.')
  return { authUserId, repId: null }
}

async function ensureReviewerWorkspace(
  admin: AdminClient,
  account: SelfServeWorkspaceAccount,
  existingRepId: string | null,
) {
  if (existingRepId) return existingRepId

  const created = await createSelfServeWorkspaceForAuthUser(account, admin)
  return created.repId
}

async function clearReviewerNicNacHistory(admin: AdminClient, repId: string) {
  const tables = ['approval_events', 'nic_nac_runs', 'nic_nac_conversations']
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq('rep_id', repId)
    if (error) throw error
  }
}

export async function resetReviewerSmokeSession(
  requestedState: unknown,
  admin: AdminClient = createAdminClient(),
) {
  const state = normalizeReviewerSmokeState(requestedState)
  const persona = getReviewerSmokePersona()
  const account = {
    authUserId: '',
    email: persona.email,
    displayName: persona.displayName,
    password: persona.password,
  }
  const { authUserId, repId: existingRepId } = await ensureReviewerAuthUser(
    admin,
    account,
  )
  const repId = await ensureReviewerWorkspace(
    admin,
    {
      authUserId,
      email: persona.email,
      displayName: persona.displayName,
    },
    existingRepId,
  )
  await clearReviewerNicNacHistory(admin, repId)
  const now = new Date().toISOString()
  const status = state
  const completedSteps = completedStepsForState(state)

  const { error: repUpdateError } = await admin
    .from('reps')
    .update({
      display_name: persona.displayName,
      business_name: 'Britt Test Rep Sparkle Studio',
      status: state === 'dashboard_unlocked' ? 'active' : 'onboarding',
      updated_at: now,
    })
    .eq('id', repId)

  if (repUpdateError) throw repUpdateError

  const { error: setupError } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: repId,
        status,
        current_step:
          state === 'dashboard_unlocked'
            ? 'final_preview_approval'
            : 'account_basics',
        completed_steps: completedSteps,
        answers: setupAnswersForReviewer(persona),
        generated_copy: {},
        support_state: {
          reviewer_smoke: {
            enabled: true,
            reset_at: now,
            state,
          },
        },
        dashboard_unlocked_at:
          state === 'dashboard_unlocked' ? now : null,
        updated_at: now,
      },
      { onConflict: 'rep_id' },
    )

  if (setupError) throw setupError

  if (state !== 'checkout_required') {
    await ensureLiveQueueSyncCodeForRep(admin, { repId })
  }

  return {
    ok: true as const,
    repId,
    email: persona.email,
    password: persona.password,
    displayName: persona.displayName,
    state,
    next: REVIEWER_SMOKE_NEXT_PATHS[state],
  }
}
