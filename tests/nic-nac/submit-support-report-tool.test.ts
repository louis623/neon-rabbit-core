import { describe, expect, it, vi } from 'vitest'

const createSupportReportMock = vi.fn()

vi.mock('@/lib/services/support-reports', () => ({
  createSupportReport: (...args: unknown[]) => createSupportReportMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ __isAdmin: true }),
}))

import { submitSupportReportTool } from '@/lib/nic-nac/tools/submit-support-report'

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: { from: vi.fn() } as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

describe('submit_support_report tool', () => {
  it('is a write tool with required report details', () => {
    expect(submitSupportReportTool.name).toBe('submit_support_report')
    expect(submitSupportReportTool.readOnly).toBe(false)

    const tool = submitSupportReportTool.build(makeCtx())

    expect(tool.inputSchema.safeParse({}).success).toBe(false)
    expect(
      tool.inputSchema.safeParse({
        reportType: 'bug',
        title: 'Live Queue keeps spinning',
        details: 'The Live Queue spinner never finishes loading for my show.',
      }).success,
    ).toBe(true)
  })

  it('creates a Nic-Nac support report with conversation context', async () => {
    createSupportReportMock.mockResolvedValueOnce({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
    })

    const ctx = makeCtx()
    const tool = submitSupportReportTool.build(ctx)
    const result = await tool.execute({
      reportType: 'workflow_idea',
      urgency: 'showtime_urgent',
      pageOrWorkflow: 'Dance Floor cleanup',
      title: 'Make cleanup easier',
      details: 'I need a faster way to clear pieces after a live show.',
      expectedResult: 'One review screen for cleanup.',
      actualResult: 'I have to jump between multiple spots.',
    })

    expect(createSupportReportMock).toHaveBeenCalledWith({ __isAdmin: true }, {
      source: 'nic_nac',
      repId: 'rep-1',
      conversationId: 'conv-1',
      runId: 'run-1',
      reportType: 'workflow_idea',
      urgency: 'showtime_urgent',
      pageOrWorkflow: 'Dance Floor cleanup',
      title: 'Make cleanup easier',
      details: 'I need a faster way to clear pieces after a live show.',
      expectedResult: 'One review screen for cleanup.',
      actualResult: 'I have to jump between multiple spots.',
    })
    expect(result).toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
      delivered: true,
      message: 'Saved and notified Louis.',
    })
  })

  it.each(['not_configured', 'failed'] as const)(
    'does not claim Louis was notified when notification status is %s',
    async (notificationStatus) => {
      createSupportReportMock.mockResolvedValueOnce({
        ok: true,
        reportId: 'report-2',
        notificationStatus,
      })

      const tool = submitSupportReportTool.build(makeCtx())
      const result = await tool.execute({
        reportType: 'bug',
        title: 'Nic-Nac got stuck',
        details: 'Nic-Nac stopped responding while I was trying to add a piece.',
      })

      expect(result).toEqual({
        ok: true,
        reportId: 'report-2',
        notificationStatus,
        delivered: false,
        message:
          'Saved the report, but Louis was not automatically notified. Use Help & Resources if this needs immediate backup.',
      })
    },
  )
})
