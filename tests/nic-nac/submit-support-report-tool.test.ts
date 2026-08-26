import { describe, expect, it } from 'vitest'
import { submitSupportReportTool } from '@/lib/nic-nac/tools/submit-support-report'

describe('submit_support_report tool', () => {
  it('is a read-only draft handoff that never files silently', async () => {
    expect(submitSupportReportTool.name).toBe('submit_support_report')
    expect(submitSupportReportTool.readOnly).toBe(true)
    const tool = submitSupportReportTool.build({} as never)
    const input = {
      reportType: 'workflow_idea' as const,
      urgency: 'showtime_urgent' as const,
      pageOrWorkflow: 'Dance Floor cleanup',
      title: 'Make cleanup easier',
      details: 'I need a faster way to clear pieces after a live show.',
    }
    expect(tool.execute).toBeDefined()
    await expect(tool.execute!(input, {} as never)).resolves.toEqual({
      ok: true,
      submitted: false,
      action: 'open_support_composer',
      href: '/nic-nac?section=messages&compose=support&source=nic-nac',
      draft: input,
      message: 'I prepared an editable Support draft. Review it in Messages, then choose Send when it looks right.',
    })
  })
})
