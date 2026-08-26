import { describe, expect, it } from 'vitest'

import { normalizeBugHuntItem } from '@/lib/control-center/bug-hunt'

describe('Control Center Task List', () => {
  it('normalizes durable operator tasks for the Control Center', () => {
    expect(normalizeBugHuntItem({
      id: 'task-1',
      title: 'Fix the popup',
      details: null,
      item_type: 'bug',
      status: 'open',
      owner: 'Louis',
      source: 'Meeting',
      created_at: '2026-08-09T12:00:00.000Z',
      updated_at: '2026-08-09T12:00:00.000Z',
      completed_at: null,
      source_support_report_id: 'report-1',
    })).toMatchObject({ itemType: 'bug', status: 'open', details: '', owner: 'Louis', sourceSupportReportId: 'report-1' })
  })
})
