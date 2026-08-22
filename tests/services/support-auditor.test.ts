import { describe, expect, it, vi } from 'vitest'

import { runSupportAuditForReport } from '@/lib/services/support-auditor'

type TableName =
  | 'support_reports'
  | 'reps'
  | 'self_serve_setup_sessions'
  | 'subscriptions'
  | 'client_account_profiles'
  | 'support_lessons'
  | 'support_audits'

const reportRow = {
  id: 'report-1',
  rep_id: 'rep-1',
  conversation_id: 'conversation-1',
  run_id: 'run-1',
  source: 'help_form',
  report_type: 'bug',
  urgency: 'blocking',
  status: 'open',
  page_or_workflow: 'Dance Floor',
  title: 'Dance Floor item vanished',
  details: 'Rep says a Dance Floor item disappeared after approving a trade.',
  expected_result: 'Replacement listing should appear.',
  actual_result: 'No replacement listing is visible.',
  contact_ok: true,
  created_at: '2026-06-12T16:00:00.000Z',
  updated_at: '2026-06-12T16:00:00.000Z',
}

const repRow = {
  id: 'rep-1',
  display_name: 'Jane Roberts',
  business_name: "Jane's Sparkle Party",
  email: 'jane@example.com',
  phone: '555-123-4567',
  status: 'active',
  public_site_slug: 'janes-sparkle-party',
  custom_domain: null,
}

const setupRow = {
  status: 'dashboard_unlocked',
  current_step: 'final_preview_approval',
  completed_steps: ['account_basics'],
  answers: {
    account_basics: {
      liveShowName: "Jane's Sparkle Party Live",
      bestContactEmail: 'jane@example.com',
    },
  },
}

function makeSingleResult(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data, error })),
    single: vi.fn(async () => ({ data, error })),
  }
  return query
}

function makeArrayResult(data: unknown[] = [], error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => ({ data, error })),
  }
  return query
}

function makeUpdateResult() {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(async () => ({ error: null })),
  }
  return query
}

function makeInsertResult(data: unknown, error: unknown = null) {
  const query = {
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
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
  reportError?: Error
  lessons?: Record<string, unknown>[]
  lessonError?: Error
  auditInsertError?: Error
} = {}) {
  const reportSelect = makeSingleResult(reportRow, options.reportError ?? null)
  const reportUpdate = makeUpdateResult()
  const supportReports = {
    select: reportSelect.select,
    update: reportUpdate.update,
  }
  const supportLessons = makeArrayResult(options.lessons ?? [
    {
      id: 'lesson-1',
      affected_area: 'trade_board',
      symptom: 'Replacement listing missing after trade approval.',
      root_cause: 'Ring size was missing before cleanup.',
      fix_or_workaround: 'Open trade swap cleanup and enter ring size.',
      tags: ['trade-board', 'cleanup'],
      approved_for_reuse: true,
    },
  ], options.lessonError ?? null)
  const supportAudits = makeInsertResult(
    { id: 'audit-1', support_report_id: 'report-1' },
    options.auditInsertError ?? null,
  )
  const queries = {
    support_reports: supportReports,
    reps: makeSingleResult(repRow),
    self_serve_setup_sessions: makeSingleResult(setupRow),
    subscriptions: makeSingleResult({ status: 'active', tier: 'standard' }),
    client_account_profiles: makeUpsertResult({
      id: 'profile-1',
      rep_id: 'rep-1',
      client_name: "Jane's Sparkle Party",
      show_name: "Jane's Sparkle Party Live",
      primary_contact_name: 'Jane Roberts',
      email: 'jane@example.com',
      phone: '555-123-4567',
      account_status: 'active',
      subscription_status: 'active',
      support_tier: 'standard',
      public_site_slug: 'janes-sparkle-party',
      custom_domain: null,
    }),
    support_lessons: supportLessons,
    support_audits: supportAudits,
  } satisfies Record<TableName, unknown>

  return {
    client: {
      from: vi.fn((table: TableName) => queries[table]),
    },
    queries,
    reportUpdate,
    supportAudits,
  }
}

describe('runSupportAuditForReport', () => {
  it('collects report/profile facts, stores an audit, and returns a completed alert payload', async () => {
    const { client, reportUpdate, supportAudits } = makeClient()

    const result = await runSupportAuditForReport(client as never, {
      reportId: 'report-1',
      now: new Date('2026-06-12T16:05:00.000Z'),
      summarize: vi.fn(async ({ findings }: {
        findings: Array<{ message: string }>
      }) => ({
        summary:
          'The account is active and a similar trade cleanup lesson may apply.',
        findings: findings.map((finding) => finding.message),
        recommendedFirstAction:
          'Open Control Center and inspect the latest trade swap cleanup state.',
      })),
    })

    expect(reportUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        audit_status: 'running',
        audit_started_at: '2026-06-12T16:05:00.000Z',
      }),
    )
    expect(supportAudits.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        support_report_id: 'report-1',
        client_account_profile_id: 'profile-1',
        status: 'completed',
        facts: expect.objectContaining({
          report: expect.objectContaining({
            title: 'Dance Floor item vanished',
            workflow: 'Dance Floor',
          }),
          profile: expect.objectContaining({
            clientName: "Jane's Sparkle Party",
            showName: "Jane's Sparkle Party Live",
            email: 'jane@example.com',
          }),
        }),
        similar_lessons: [
          expect.objectContaining({
            title: 'Replacement listing missing after trade approval.',
          }),
        ],
        recommended_first_action:
          'Open Control Center and inspect the latest trade swap cleanup state.',
        ai_summary:
          'The account is active and a similar trade cleanup lesson may apply.',
      }),
    )
    expect(reportUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        audit_status: 'completed',
        audit_completed_at: '2026-06-12T16:05:00.000Z',
        audit_error: null,
      }),
    )
    expect(result.alertPayload).toMatchObject({
      title: 'Bug: Dance Floor item vanished',
      urgency: 'blocking',
      clientName: "Jane's Sparkle Party",
      showName: "Jane's Sparkle Party Live",
      phone: '555-123-4567',
      email: 'jane@example.com',
      reportId: 'report-1',
      issue: 'Rep says a Dance Floor item disappeared after approving a trade.',
      auditStatus: 'completed',
      summary:
        'The account is active and a similar trade cleanup lesson may apply.',
      recommendedFirstAction:
        'Open Control Center and inspect the latest trade swap cleanup state.',
    })
  })

  it('uses a template summary when the injected summarizer fails', async () => {
    const { client, supportAudits } = makeClient()

    const result = await runSupportAuditForReport(client as never, {
      reportId: 'report-1',
      now: new Date('2026-06-12T16:05:00.000Z'),
      summarize: vi.fn(async () => {
        throw new Error('model unavailable')
      }),
    })

    expect(supportAudits.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        ai_summary: null,
        template_summary: expect.stringContaining(
          "Jane's Sparkle Party account is active",
        ),
      }),
    )
    expect(result.alertPayload.auditStatus).toBe('completed')
    expect(result.alertPayload.summary).toContain(
      "Jane's Sparkle Party account is active",
    )
  })

  it('marks the report failed and returns an incomplete fallback alert when audit storage fails', async () => {
    const { client, reportUpdate } = makeClient({
      auditInsertError: new Error('audit insert blocked'),
    })

    const result = await runSupportAuditForReport(client as never, {
      reportId: 'report-1',
      now: new Date('2026-06-12T16:05:00.000Z'),
    })

    expect(reportUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        audit_status: 'failed',
        audit_error: 'audit insert blocked',
      }),
    )
    expect(result.status).toBe('failed')
    expect(result.alertPayload).toMatchObject({
      auditStatus: 'incomplete',
      summary: 'The report was saved, but the account audit did not finish. Review manually.',
      findings: [],
      recommendedFirstAction: 'Open the report in Control Center and review manually.',
    })
  })
})
