import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendGoogleChatSupportAlertMock = vi.fn()

vi.mock('@/lib/ops/google-chat-alerts', () => ({
  sendGoogleChatSupportAlert: (...args: unknown[]) =>
    sendGoogleChatSupportAlertMock(...args),
}))

import {
  createSupportReport,
  listOperatorSupportReports,
  updateOperatorSupportReportStatus,
} from '@/lib/services/support-reports'

type SupportReportRow = Record<string, unknown>

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
    sendGoogleChatSupportAlertMock.mockResolvedValue({ delivered: true })
  })

  it('normalizes and inserts a support report before notifying Google Chat', async () => {
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

    expect(insertMock).toHaveBeenCalledWith({
      rep_id: 'rep-1',
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
    })
    expect(sendGoogleChatSupportAlertMock).toHaveBeenCalledWith({
      title: 'Bug: Calendar save fails',
      urgency: 'blocking',
      lines: [
        'Report ID: report-1',
        'Rep: jamie@example.com',
        'Source: Help form',
        'Page/workflow: Calendar',
        'Details: Clicking save does nothing.',
      ],
    })
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

    expect(selectMock).toHaveBeenCalledWith(
      'id, rep_id, conversation_id, run_id, source, report_type, urgency, status, page_or_workflow, title, details, expected_result, actual_result, contact_ok, notification_channel, notification_status, notification_error, created_at, updated_at',
    )
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
    expect(updateSelectMock).toHaveBeenCalledWith(
      'id, rep_id, conversation_id, run_id, source, report_type, urgency, status, page_or_workflow, title, details, expected_result, actual_result, contact_ok, notification_channel, notification_status, notification_error, created_at, updated_at',
    )
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
