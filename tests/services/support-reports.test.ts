import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendGoogleChatSupportAlertMock = vi.fn()
const ensureClientAccountProfileMock = vi.fn()
const runSupportAuditForReportMock = vi.fn()

vi.mock('@/lib/ops/google-chat-alerts', () => ({
  sendGoogleChatSupportAlert: (...args: unknown[]) =>
    sendGoogleChatSupportAlertMock(...args),
}))

vi.mock('@/lib/services/client-account-profiles', () => ({
  ensureClientAccountProfile: (...args: unknown[]) =>
    ensureClientAccountProfileMock(...args),
}))

vi.mock('@/lib/services/support-auditor', () => ({
  runSupportAuditForReport: (...args: unknown[]) =>
    runSupportAuditForReportMock(...args),
}))

import {
  createSupportReport,
  listOperatorSupportReports,
  updateOperatorSupportReportStatus,
} from '@/lib/services/support-reports'

type SupportReportRow = Record<string, unknown>

const supportReportSelect =
  'id, rep_id, client_account_profile_id, client_snapshot, conversation_id, run_id, source, report_type, urgency, status, page_or_workflow, title, details, expected_result, actual_result, contact_ok, notification_channel, notification_status, notification_error, audit_status, audit_started_at, audit_completed_at, audit_error, resolution_snapshot, created_at, updated_at, support_audits(status, findings, recommended_first_action, ai_summary, template_summary, created_at)'

const clientSnapshot = {
  profileId: 'profile-1',
  repId: 'rep-1',
  clientName: "Jamie's Sparkles",
  showName: "Jamie's Friday Live",
  primaryContactName: 'Jamie Morgan',
  email: 'jamie@example.com',
  phone: '555-222-3333',
  accountStatus: 'active',
  subscriptionStatus: 'active',
  supportTier: 'standard',
  publicSiteSlug: 'jamies-sparkles',
  customDomain: null,
  sourceSnapshot: {},
}

const auditAlertPayload = {
  title: 'Bug: Calendar save fails',
  urgency: 'blocking',
  clientName: "Jamie's Sparkles",
  showName: "Jamie's Friday Live",
  phone: '555-222-3333',
  email: 'jamie@example.com',
  reportId: 'report-1',
  issue: 'Clicking save does nothing.',
  source: 'Help form',
  workflow: 'Calendar',
  auditStatus: 'completed',
  summary:
    "Jamie's Sparkles account is active and the report includes expected versus actual behavior.",
  findings: ['Report includes expected versus actual behavior details.'],
  recommendedFirstAction: 'Open the report in Control Center and review manually.',
} as const

function createSupportReportsClient(options: {
  insertRow?: SupportReportRow
  updateRow?: SupportReportRow
  selectRows?: SupportReportRow[]
  insertError?: Error
  updateError?: Error
} = {}) {
  const insertMock = vi.fn()
  const updateMock = vi.fn()
  const selectMock = vi.fn()
  const eqMock = vi.fn()
  const orderMock = vi.fn()
  const limitMock = vi.fn()
  const singleMock = vi.fn()
  const fromMock = vi.fn()

  const insertChain = {
    select: vi.fn(() => ({
      single: singleMock,
    })),
  }

  insertMock.mockReturnValue(insertChain)
  singleMock.mockResolvedValue({
    data: options.insertRow ?? {
      id: 'report-1',
      rep_id: 'rep-1',
      client_account_profile_id: 'profile-1',
      client_snapshot: clientSnapshot,
      source: 'help_form',
      report_type: 'bug',
      urgency: 'blocking',
      status: 'open',
      page_or_workflow: 'Calendar',
      title: 'Calendar save fails',
      details: 'Clicking save does nothing.',
      expected_result: 'Show should save.',
      actual_result: 'Nothing happens.',
      notification_status: 'pending',
      created_at: '2026-06-12T10:00:00.000Z',
      updated_at: '2026-06-12T10:00:00.000Z',
    },
    error: options.insertError ?? null,
  })

  const updateSelectMock = vi.fn()
  const updateSingleMock = vi.fn()
  const updateEqSecondMock = vi.fn()
  const updateEqFirstMock = vi.fn()
  const updateChain = {
    eq: updateEqFirstMock,
  }
  eqMock.mockResolvedValue({ error: options.updateError ?? null })
  updateMock.mockImplementation((values: Record<string, unknown>) =>
    'status' in values ? updateChain : { eq: eqMock },
  )
  updateEqFirstMock.mockImplementation(() => ({
    eq: updateEqSecondMock,
    select: updateSelectMock,
  }))
  updateEqSecondMock.mockImplementation(() => ({
    select: updateSelectMock,
  }))
  updateSelectMock.mockReturnValue({
    single: updateSingleMock,
  })
  updateSingleMock.mockResolvedValue({
    data: options.updateRow ?? {
      id: 'report-1',
      status: 'reviewing',
      updated_at: '2026-06-12T12:00:00.000Z',
    },
    error: options.updateError ?? null,
  })

  const selectChain = {
    eq: vi.fn(() => selectChain),
    order: vi.fn(() => selectChain),
    limit: vi.fn(() => Promise.resolve({
      data: options.selectRows ?? [],
      error: null,
    })),
  }
  selectMock.mockReturnValue(selectChain)

  fromMock.mockReturnValue({
    insert: insertMock,
    update: updateMock,
    select: selectMock,
    eq: eqMock,
    order: orderMock,
    limit: limitMock,
  })

  return {
    client: { from: fromMock },
    fromMock,
    insertMock,
    updateMock,
    selectMock,
    eqMock,
    updateEqFirstMock,
    updateEqSecondMock,
    updateSelectMock,
    updateSingleMock,
    selectChain,
  }
}

describe('support reports service', () => {
  beforeEach(() => {
    sendGoogleChatSupportAlertMock.mockReset()
    ensureClientAccountProfileMock.mockReset()
    runSupportAuditForReportMock.mockReset()
    ensureClientAccountProfileMock.mockResolvedValue(clientSnapshot)
    runSupportAuditForReportMock.mockResolvedValue({
      status: 'completed',
      auditId: 'audit-1',
      summary: auditAlertPayload.summary,
      findings: auditAlertPayload.findings,
      recommendedFirstAction: auditAlertPayload.recommendedFirstAction,
      alertPayload: auditAlertPayload,
    })
    sendGoogleChatSupportAlertMock.mockResolvedValue({ delivered: true })
  })

  it('normalizes and inserts a support report before auditing and notifying Google Chat', async () => {
    const { client, insertMock, updateMock } = createSupportReportsClient()

    const result = await createSupportReport(client as never, {
      repId: 'rep-1',
      repEmail: 'jamie@example.com',
      source: 'help_form',
      reportType: 'bug',
      urgency: 'blocking',
      pageOrWorkflow: ' Calendar ',
      title: ' Calendar save fails ',
      details: ' Clicking save does nothing. ',
      expectedResult: ' Show should save. ',
      actualResult: ' Nothing happens. ',
      contactOk: true,
    })

    expect(ensureClientAccountProfileMock).toHaveBeenCalledWith(client, 'rep-1')
    expect(insertMock).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      client_account_profile_id: 'profile-1',
      client_snapshot: clientSnapshot,
      conversation_id: null,
      run_id: null,
      source: 'help_form',
      report_type: 'bug',
      urgency: 'blocking',
      status: 'open',
      page_or_workflow: 'Calendar',
      title: 'Calendar save fails',
      details: 'Clicking save does nothing.',
      expected_result: 'Show should save.',
      actual_result: 'Nothing happens.',
      contact_ok: true,
      notification_channel: 'google_chat',
      notification_status: 'pending',
      audit_status: 'pending',
    })
    expect(runSupportAuditForReportMock).toHaveBeenCalledWith(client, {
      reportId: 'report-1',
    })
    expect(sendGoogleChatSupportAlertMock).toHaveBeenCalledWith(auditAlertPayload)
    expect(updateMock).toHaveBeenCalledWith({
      notification_status: 'delivered',
      notification_error: null,
      updated_at: expect.any(String),
    })
    expect(result).toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
    })
  })

  it('saves reports when Google Chat is not configured', async () => {
    const { client, updateMock } = createSupportReportsClient()
    sendGoogleChatSupportAlertMock.mockResolvedValueOnce({
      delivered: false,
      reason: 'google_chat_not_configured',
    })

    const result = await createSupportReport(client as never, {
      repId: 'rep-1',
      source: 'nic_nac',
      reportType: 'workflow_idea',
      title: 'Better after-show cleanup',
      details: 'Please add a cleanup flow for post-show work.',
      conversationId: 'conversation-1',
      runId: 'run-1',
    })

    expect(updateMock).toHaveBeenCalledWith({
      notification_status: 'not_configured',
      notification_error: 'google_chat_not_configured',
      updated_at: expect.any(String),
    })
    expect(result).toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'not_configured',
    })
  })

  it('keeps the report saved when Google Chat delivery fails', async () => {
    const { client, updateMock } = createSupportReportsClient()
    sendGoogleChatSupportAlertMock.mockRejectedValueOnce(new Error('webhook rejected'))

    const result = await createSupportReport(client as never, {
      repId: 'rep-1',
      source: 'help_form',
      reportType: 'site_issue',
      title: 'Homepage typo',
      details: 'The public site has a typo in the hero.',
    })

    expect(updateMock).toHaveBeenCalledWith({
      notification_status: 'failed',
      notification_error: 'webhook rejected',
      updated_at: expect.any(String),
    })
    expect(result).toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'failed',
    })
  })

  it('still alerts Louis with the auditor fallback when the audit is incomplete', async () => {
    const { client, updateMock } = createSupportReportsClient()
    runSupportAuditForReportMock.mockResolvedValueOnce({
      status: 'failed',
      auditId: null,
      summary: 'The report was saved, but the account audit did not finish. Review manually.',
      findings: [],
      recommendedFirstAction: 'Open the report in Control Center and review manually.',
      alertPayload: {
        ...auditAlertPayload,
        auditStatus: 'incomplete',
        summary:
          'The report was saved, but the account audit did not finish. Review manually.',
        findings: [],
        recommendedFirstAction:
          'Open the report in Control Center and review manually.',
      },
    })

    const result = await createSupportReport(client as never, {
      repId: 'rep-1',
      source: 'help_form',
      reportType: 'bug',
      title: 'Audit fallback report',
      details: 'The report should still alert Louis after audit trouble.',
    })

    expect(sendGoogleChatSupportAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        auditStatus: 'incomplete',
        summary:
          'The report was saved, but the account audit did not finish. Review manually.',
      }),
    )
    expect(updateMock).toHaveBeenCalledWith({
      notification_status: 'delivered',
      notification_error: null,
      updated_at: expect.any(String),
    })
    expect(result).toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
    })
  })

  it('does not fail the saved report when the notification status update fails', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = createSupportReportsClient({
      updateError: new Error('update blocked by policy'),
    })

    const result = await createSupportReport(client as never, {
      repId: 'rep-1',
      source: 'help_form',
      reportType: 'bug',
      title: 'Saved report update issue',
      details: 'The report should still count as saved.',
    })

    expect(result).toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
    })
    expect(errorMock).toHaveBeenCalledWith(
      '[support-reports] notification status update failed',
      expect.objectContaining({
        reportId: 'report-1',
        notificationStatus: 'delivered',
      }),
    )
  })

  it('rejects underspecified reports before inserting', async () => {
    const { client, insertMock } = createSupportReportsClient()

    await expect(createSupportReport(client as never, {
      repId: 'rep-1',
      source: 'help_form',
      reportType: 'bug',
      title: 'No',
      details: 'short',
    })).rejects.toThrow()

    expect(insertMock).not.toHaveBeenCalled()
  })

  it('lists operator reports with dashboard-ready filters and ordering', async () => {
    const rows = [
      {
        id: 'report-1',
        rep_id: 'rep-1',
        report_type: 'bug',
        urgency: 'showtime_urgent',
        status: 'open',
        title: 'Live queue stale',
        details: 'Queue stopped moving.',
        created_at: '2026-06-12T11:00:00.000Z',
      },
    ]
    const { client, selectMock, selectChain } = createSupportReportsClient({
      selectRows: rows,
    })

    const result = await listOperatorSupportReports(client as never, {
      status: 'open',
      limit: 25,
    })

    expect(selectMock).toHaveBeenCalledWith(supportReportSelect)
    expect(selectChain.eq).toHaveBeenCalledWith('status', 'open')
    expect(selectChain.order).toHaveBeenCalledWith('urgency_rank', { ascending: false })
    expect(selectChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(selectChain.limit).toHaveBeenCalledWith(25)
    expect(result).toEqual(rows)
  })

  it('updates operator report status for dashboard triage', async () => {
    const { client, updateMock, updateEqFirstMock, updateSelectMock } =
      createSupportReportsClient({
        updateRow: {
          id: 'report-1',
          rep_id: 'rep-1',
          report_type: 'bug',
          urgency: 'blocking',
          status: 'reviewing',
          title: 'Calendar save fails',
          details: 'Clicking save does nothing.',
          updated_at: '2026-06-12T12:00:00.000Z',
        },
      })

    const result = await updateOperatorSupportReportStatus(client as never, {
      reportId: 'report-1',
      status: 'reviewing',
    })

    expect(updateMock).toHaveBeenCalledWith({
      status: 'reviewing',
      updated_at: expect.any(String),
    })
    expect(updateEqFirstMock).toHaveBeenCalledWith('id', 'report-1')
    expect(updateSelectMock).toHaveBeenCalledWith(supportReportSelect)
    expect(result).toMatchObject({
      id: 'report-1',
      status: 'reviewing',
    })
  })

  it('rejects invalid operator report status updates before writing', async () => {
    const { client, updateMock } = createSupportReportsClient()

    await expect(updateOperatorSupportReportStatus(client as never, {
      reportId: 'report-1',
      status: 'invalid' as never,
    })).rejects.toThrow()

    expect(updateMock).not.toHaveBeenCalled()
  })
})
