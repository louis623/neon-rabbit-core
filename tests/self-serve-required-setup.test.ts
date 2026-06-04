import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import {
  REQUIRED_SETUP_STEPS,
  canUnlockRequiredSetup,
  completeRequiredSetupStep,
  ensureRequiredSetupSession,
  getNextRequiredSetupStep,
  isRequiredSetupStepId,
  normalizeRequiredSetupSession,
  saveRequiredSetupAnswer,
  unlockRequiredSetup,
  type RequiredSetupSessionRow,
} from '@/lib/self-serve/required-setup'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260602143000_ss_required_nic_nac_setup.sql',
)
const exposureMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260603124344_expose_required_setup_tables_to_data_api.sql',
)

describe('self-serve required setup migration', () => {
  const sql = readFileSync(migrationPath, 'utf8')
  const exposureSql = readFileSync(exposureMigrationPath, 'utf8')

  it('creates the required setup session table with the locked dashboard state machine', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS self_serve_setup_sessions')
    expect(sql).toContain('rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE')
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'checkout_required'")
    expect(sql).toContain("current_step TEXT NOT NULL DEFAULT 'account_basics'")
    expect(sql).toContain("completed_steps TEXT[] NOT NULL DEFAULT '{}'::text[]")
    expect(sql).toContain("answers JSONB NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain("generated_copy JSONB NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain("support_state JSONB NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain('dashboard_unlocked_at TIMESTAMPTZ')
    expect(sql).toContain('UNIQUE (rep_id)')
    ;[
      'checkout_required',
      'payment_pending',
      'required_setup',
      'setup_blocked',
      'dashboard_unlocked',
    ].forEach((status) => expect(sql).toContain(`'${status}'`))
    expect(sql).toContain('idx_self_serve_setup_sessions_rep_id')
  })

  it('creates light box fulfillment tasks due within 24 hours after checkout', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS light_box_fulfillment_tasks')
    expect(sql).toContain('rep_id UUID NOT NULL REFERENCES reps(id)')
    expect(sql).toContain('stripe_checkout_session_id TEXT NOT NULL UNIQUE')
    expect(sql).toContain('stripe_subscription_id TEXT')
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'needs_order'")
    ;['needs_order', 'ordered', 'blocked', 'cancelled'].forEach((status) =>
      expect(sql).toContain(`'${status}'`),
    )
    expect(sql).toContain('shipping_name TEXT')
    expect(sql).toContain("shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain("due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')")
    expect(sql).toContain('ordered_at TIMESTAMPTZ')
    expect(sql).toContain('notes TEXT')
    expect(sql).toContain('idx_light_box_fulfillment_tasks_rep_id')
    expect(sql).toContain('idx_light_box_fulfillment_tasks_needs_order_due')
    expect(sql).toContain("WHERE status = 'needs_order'")
  })

  it('enables RLS and keeps writes service-only while allowing owning reps to read setup sessions', () => {
    expect(sql).toContain(
      'ALTER TABLE self_serve_setup_sessions ENABLE ROW LEVEL SECURITY',
    )
    expect(sql).toContain(
      'ALTER TABLE light_box_fulfillment_tasks ENABLE ROW LEVEL SECURITY',
    )
    expect(sql).toContain('FOR SELECT')
    expect(sql).toContain('TO authenticated')
    expect(sql).toContain('auth.uid() IS NOT NULL')
    expect(sql).toContain('SELECT 1 FROM reps')
    expect(sql).toContain('reps.auth_user_id = auth.uid()')
    expect(sql).toContain('reps.id = self_serve_setup_sessions.rep_id')
    expect(sql).toContain('USING (false)')
    expect(sql).toContain('WITH CHECK (false)')
    expect(sql).not.toContain('user_metadata')
  })

  it('explicitly grants Data API access for the server-side setup flow', () => {
    expect(exposureSql).toContain(
      'GRANT SELECT ON self_serve_setup_sessions TO authenticated',
    )
    expect(exposureSql).toContain(
      'GRANT ALL ON self_serve_setup_sessions TO service_role',
    )
    expect(exposureSql).toContain(
      'GRANT ALL ON light_box_fulfillment_tasks TO service_role',
    )
    expect(exposureSql).not.toContain('TO anon')
  })
})

describe('self-serve required setup service contract', () => {
  const requiredStepIds = [
    'account_basics',
    'site_skin',
    'welcome_copy',
    'about_page',
    'show_schedule',
    'customer_site_orientation',
    'live_queue_setup',
    'email_sms_update_readiness',
    'trade_board_orientation',
    'final_preview_approval',
  ] as const

  beforeEach(() => {
    fromMock.mockReset()
  })

  it('exposes the exact required setup steps in order', () => {
    expect(REQUIRED_SETUP_STEPS.map((step) => step.id)).toEqual(requiredStepIds)
    expect(REQUIRED_SETUP_STEPS.every((step) => step.required)).toBe(true)
    expect(REQUIRED_SETUP_STEPS.map((step) => step.id)).not.toContain(
      'trade_board_inventory',
    )
    expect(REQUIRED_SETUP_STEPS.map((step) => step.label)).toContain(
      'Live Queue setup',
    )
    expect(REQUIRED_SETUP_STEPS.map((step) => step.label)).toContain(
      'Email and SMS update readiness',
    )
    expect(REQUIRED_SETUP_STEPS.map((step) => step.label)).not.toContain(
      'Live queue orientation',
    )
    expect(REQUIRED_SETUP_STEPS.every((step) => step.label.length > 0)).toBe(
      true,
    )
  })

  it('identifies setup steps and returns the next incomplete step', () => {
    expect(isRequiredSetupStepId('site_skin')).toBe(true)
    expect(isRequiredSetupStepId('trade_board_inventory')).toBe(false)
    expect(getNextRequiredSetupStep([])).toBe('account_basics')
    expect(
      getNextRequiredSetupStep([
        'account_basics',
        'site_skin',
        'unknown_step',
      ]),
    ).toBe('welcome_copy')
    expect(getNextRequiredSetupStep([...requiredStepIds])).toBeNull()
  })

  it('only unlocks the dashboard when every required step is complete', () => {
    expect(canUnlockRequiredSetup([...requiredStepIds])).toBe(true)
    expect(canUnlockRequiredSetup(requiredStepIds.slice(0, -1))).toBe(false)
    expect(
      canUnlockRequiredSetup([...requiredStepIds, 'trade_board_inventory']),
    ).toBe(true)
  })

  it('normalizes a missing setup row to the checkout gate', () => {
    expect(normalizeRequiredSetupSession(null)).toEqual({
      id: null,
      repId: null,
      status: 'checkout_required',
      currentStep: 'account_basics',
      completedSteps: [],
      steps: REQUIRED_SETUP_STEPS,
      answers: {},
      generatedCopy: {},
      supportState: {},
      dashboardUnlockedAt: null,
      createdAt: null,
      updatedAt: null,
      nextStep: 'account_basics',
      canUnlockDashboard: false,
    })
  })

  it('normalizes a database row to client-safe camelCase state', () => {
    const row: RequiredSetupSessionRow = {
      id: 'setup-1',
      rep_id: 'rep-1',
      status: 'required_setup',
      current_step: 'trade_board_inventory',
      completed_steps: [
        'account_basics',
        'site_skin',
        'welcome_copy',
        'about_page',
        'show_schedule',
        'customer_site_orientation',
        'live_queue_setup',
      ],
      answers: { businessName: 'Britt With Bling' },
      generated_copy: { welcome: 'Welcome sparkle friends' },
      support_state: { needsHelp: false },
      dashboard_unlocked_at: null,
      created_at: '2026-06-02T14:30:00Z',
      updated_at: '2026-06-02T14:35:00Z',
    }

    expect(normalizeRequiredSetupSession(row)).toEqual({
      id: 'setup-1',
      repId: 'rep-1',
      status: 'required_setup',
      currentStep: 'account_basics',
      completedSteps: [
        'account_basics',
        'site_skin',
        'welcome_copy',
        'about_page',
        'show_schedule',
        'customer_site_orientation',
        'live_queue_setup',
      ],
      steps: REQUIRED_SETUP_STEPS,
      answers: { businessName: 'Britt With Bling' },
      generatedCopy: { welcome: 'Welcome sparkle friends' },
      supportState: { needsHelp: false },
      dashboardUnlockedAt: null,
      createdAt: '2026-06-02T14:30:00Z',
      updatedAt: '2026-06-02T14:35:00Z',
      nextStep: 'email_sms_update_readiness',
      canUnlockDashboard: false,
    })
  })

  it('returns an existing setup session without rewinding status, step, or saved answers', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'show_schedule',
        completed_steps: [
          'account_basics',
          'site_skin',
          'welcome_copy',
          'about_page',
        ],
        answers: {
          account_basics: { businessName: 'Britt With Bling' },
        },
        generated_copy: { welcome_copy: { draft: 'Welcome friends' } },
        support_state: { about_page: { reviewed: true } },
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:45:00Z',
      },
      error: null,
    })

    const state = await ensureRequiredSetupSession('rep-1')

    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(state.status).toBe('required_setup')
    expect(state.currentStep).toBe('show_schedule')
    expect(state.completedSteps).toEqual([
      'account_basics',
      'site_skin',
      'welcome_copy',
      'about_page',
    ])
    expect(state.answers).toEqual({
      account_basics: { businessName: 'Britt With Bling' },
    })
  })

  it('inserts a default setup session only when one does not already exist', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()
    const insertMock = vi.fn()
    const insertSelectMock = vi.fn()
    const insertSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ insert: insertMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    insertMock.mockReturnValueOnce({ select: insertSelectMock })
    insertSelectMock.mockReturnValueOnce({ single: insertSingleMock })
    insertSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'payment_pending',
        current_step: 'account_basics',
        completed_steps: [],
        answers: {},
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:30:00Z',
      },
      error: null,
    })

    const state = await ensureRequiredSetupSession('rep-1', 'payment_pending')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        status: 'payment_pending',
        current_step: 'account_basics',
      }),
    )
    expect(state.status).toBe('payment_pending')
    expect(state.currentStep).toBe('account_basics')
  })

  it('saves a step answer by merging structured setup state before returning normalized state', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()
    const updateMock = vi.fn()
    const updateEqMock = vi.fn()
    const updateSelectMock = vi.fn()
    const updateSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ update: updateMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'welcome_copy',
        completed_steps: ['account_basics', 'site_skin'],
        answers: {
          welcome_copy: { tone: 'warm' },
        },
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:35:00Z',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: updateEqMock })
    updateEqMock.mockReturnValueOnce({ select: updateSelectMock })
    updateSelectMock.mockReturnValueOnce({ single: updateSingleMock })
    updateSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'welcome_copy',
        completed_steps: ['account_basics', 'site_skin'],
        answers: {
          welcome_copy: { tone: 'warm', headline: 'Welcome sparkle friends' },
        },
        generated_copy: {
          welcome_copy: { draft: 'Welcome sparkle friends' },
        },
        support_state: {
          welcome_copy: { reviewed: false },
        },
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:40:00Z',
      },
      error: null,
    })

    const state = await saveRequiredSetupAnswer(
      'rep-1',
      'welcome_copy',
      { headline: 'Welcome sparkle friends' },
      {
        generatedCopyPatch: { draft: 'Welcome sparkle friends' },
        supportStatePatch: { reviewed: false },
      },
    )

    expect(fromMock).toHaveBeenNthCalledWith(1, 'self_serve_setup_sessions')
    expect(fromMock).toHaveBeenNthCalledWith(2, 'self_serve_setup_sessions')
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: {
          welcome_copy: { tone: 'warm', headline: 'Welcome sparkle friends' },
        },
        generated_copy: {
          welcome_copy: { draft: 'Welcome sparkle friends' },
        },
        support_state: {
          welcome_copy: { reviewed: false },
        },
      }),
    )
    expect(updateEqMock).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(state.answers).toEqual({
      welcome_copy: { tone: 'warm', headline: 'Welcome sparkle friends' },
    })
  })

  it('completes a required setup step idempotently and advances to the next incomplete step', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()
    const updateMock = vi.fn()
    const updateEqMock = vi.fn()
    const updateSelectMock = vi.fn()
    const updateSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ update: updateMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'payment_pending',
        current_step: 'welcome_copy',
        completed_steps: ['account_basics', 'site_skin'],
        answers: {},
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:35:00Z',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: updateEqMock })
    updateEqMock.mockReturnValueOnce({ select: updateSelectMock })
    updateSelectMock.mockReturnValueOnce({ single: updateSingleMock })
    updateSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'about_page',
        completed_steps: ['account_basics', 'site_skin', 'welcome_copy'],
        answers: { welcome_copy: { headline: 'Welcome' } },
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:40:00Z',
      },
      error: null,
    })

    const state = await completeRequiredSetupStep('rep-1', 'welcome_copy', {
      headline: 'Welcome',
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'required_setup',
        current_step: 'about_page',
        completed_steps: ['account_basics', 'site_skin', 'welcome_copy'],
        answers: { welcome_copy: { headline: 'Welcome' } },
      }),
    )
    expect(state.currentStep).toBe('about_page')
    expect(state.completedSteps).toEqual([
      'account_basics',
      'site_skin',
      'welcome_copy',
    ])
  })

  it('preserves prior completed steps and answer keys when completing another step', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()
    const updateMock = vi.fn()
    const updateEqMock = vi.fn()
    const updateSelectMock = vi.fn()
    const updateSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ update: updateMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'about_page',
        completed_steps: ['account_basics', 'site_skin', 'welcome_copy'],
        answers: {
          account_basics: { businessName: 'Britt With Bling' },
          welcome_copy: { tone: 'warm' },
        },
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:40:00Z',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: updateEqMock })
    updateEqMock.mockReturnValueOnce({ select: updateSelectMock })
    updateSelectMock.mockReturnValueOnce({ single: updateSingleMock })
    updateSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'show_schedule',
        completed_steps: [
          'account_basics',
          'site_skin',
          'welcome_copy',
          'about_page',
        ],
        answers: {
          account_basics: { businessName: 'Britt With Bling' },
          welcome_copy: { tone: 'warm' },
          about_page: { story: 'Family-owned sparkle studio' },
        },
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:45:00Z',
      },
      error: null,
    })

    await completeRequiredSetupStep('rep-1', 'about_page', {
      story: 'Family-owned sparkle studio',
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_steps: [
          'account_basics',
          'site_skin',
          'welcome_copy',
          'about_page',
        ],
        answers: {
          account_basics: { businessName: 'Britt With Bling' },
          welcome_copy: { tone: 'warm' },
          about_page: { story: 'Family-owned sparkle studio' },
        },
      }),
    )
  })

  it('does not unlock the dashboard until every required setup step is complete', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'welcome_copy',
        completed_steps: ['account_basics', 'site_skin'],
        answers: {},
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:35:00Z',
      },
      error: null,
    })

    await expect(unlockRequiredSetup('rep-1')).rejects.toThrow(
      'Required setup is incomplete',
    )
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it.each(['checkout_required', 'payment_pending', 'setup_blocked'] as const)(
    'does not unlock from %s even when all required steps are complete',
    async (status) => {
      const selectMock = vi.fn()
      const eqMock = vi.fn()
      const maybeSingleMock = vi.fn()

      fromMock.mockReturnValueOnce({ select: selectMock })
      selectMock.mockReturnValueOnce({ eq: eqMock })
      eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
      maybeSingleMock.mockResolvedValueOnce({
        data: {
          id: 'setup-1',
          rep_id: 'rep-1',
          status,
          current_step: 'final_preview_approval',
          completed_steps: [...requiredStepIds],
          answers: {},
          generated_copy: {},
          support_state: {},
          dashboard_unlocked_at: null,
          created_at: '2026-06-02T14:30:00Z',
          updated_at: '2026-06-02T14:45:00Z',
        },
        error: null,
      })

      await expect(unlockRequiredSetup('rep-1')).rejects.toThrow(
        `Cannot unlock required setup from ${status}`,
      )
      expect(fromMock).toHaveBeenCalledTimes(1)
    },
  )

  it('returns an already unlocked setup session without updating it again', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'dashboard_unlocked',
        current_step: 'final_preview_approval',
        completed_steps: [...requiredStepIds],
        answers: {},
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: '2026-06-02T15:00:00Z',
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T15:00:00Z',
      },
      error: null,
    })

    const state = await unlockRequiredSetup('rep-1')

    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(state.status).toBe('dashboard_unlocked')
    expect(state.dashboardUnlockedAt).toBe('2026-06-02T15:00:00Z')
  })

  it('unlocks the dashboard when every required setup step is complete', async () => {
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()
    const updateMock = vi.fn()
    const updateEqMock = vi.fn()
    const updateSelectMock = vi.fn()
    const updateSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ update: updateMock })
    selectMock.mockReturnValueOnce({ eq: eqMock })
    eqMock.mockReturnValueOnce({ maybeSingle: maybeSingleMock })
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'required_setup',
        current_step: 'final_preview_approval',
        completed_steps: [...requiredStepIds],
        answers: {},
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: null,
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T14:35:00Z',
      },
      error: null,
    })
    updateMock.mockReturnValueOnce({ eq: updateEqMock })
    updateEqMock.mockReturnValueOnce({ select: updateSelectMock })
    updateSelectMock.mockReturnValueOnce({ single: updateSingleMock })
    updateSingleMock.mockResolvedValueOnce({
      data: {
        id: 'setup-1',
        rep_id: 'rep-1',
        status: 'dashboard_unlocked',
        current_step: 'final_preview_approval',
        completed_steps: [...requiredStepIds],
        answers: {},
        generated_copy: {},
        support_state: {},
        dashboard_unlocked_at: '2026-06-02T15:00:00Z',
        created_at: '2026-06-02T14:30:00Z',
        updated_at: '2026-06-02T15:00:00Z',
      },
      error: null,
    })

    const state = await unlockRequiredSetup('rep-1')

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'dashboard_unlocked',
        dashboard_unlocked_at: expect.any(String),
      }),
    )
    expect(state.status).toBe('dashboard_unlocked')
    expect(state.canUnlockDashboard).toBe(true)
  })
})
