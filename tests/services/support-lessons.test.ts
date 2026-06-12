import { describe, expect, it, vi } from 'vitest'
import { resolveSupportReport } from '@/lib/services/support-lessons'

type TableName = 'support_reports' | 'support_lessons'

function makeUpdateResult(data: unknown, error: unknown = null) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => ({ data, error })),
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

function makeClient(options: {
  report?: Record<string, unknown>
  lesson?: Record<string, unknown>
}) {
  const queries = {
    support_reports: makeUpdateResult(
      options.report ?? {
        id: 'report-1',
        status: 'resolved',
        resolution_snapshot: {
          affectedArea: 'trade_board',
          rootCause: 'Missing ring size paused replacement cleanup.',
        },
      },
    ),
    support_lessons: makeInsertResult(
      options.lesson ?? {
        id: 'lesson-1',
        source_report_id: 'report-1',
        affected_area: 'trade_board',
        approved_for_reuse: true,
      },
    ),
  } satisfies Record<TableName, unknown>

  return {
    client: {
      from: vi.fn((table: TableName) => queries[table]),
    },
    queries,
  }
}

describe('resolveSupportReport', () => {
  it('marks a report resolved and creates an approved reusable lesson', async () => {
    const { client, queries } = makeClient({})

    const result = await resolveSupportReport(client as never, {
      reportId: 'report-1',
      clientAccountProfileId: 'profile-1',
      affectedArea: 'trade_board',
      symptom: 'Replacement listing did not show after trade approval.',
      rootCause: 'The revealed ring was missing ring size.',
      fixOrWorkaround: 'Open swap cleanup and enter ring size before shipping.',
      tags: ['trade-board', 'ring-size'],
      approvedForReuse: true,
      createdBy: 'louis@neonrabbit.net',
    })

    expect(queries.support_reports.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolution_snapshot: expect.objectContaining({
          affectedArea: 'trade_board',
          symptom: 'Replacement listing did not show after trade approval.',
          rootCause: 'The revealed ring was missing ring size.',
          fixOrWorkaround: 'Open swap cleanup and enter ring size before shipping.',
          tags: ['trade-board', 'ring-size'],
          approvedForReuse: true,
          createdBy: 'louis@neonrabbit.net',
        }),
      }),
    )
    expect(queries.support_lessons.insert).toHaveBeenCalledWith({
      source_report_id: 'report-1',
      client_account_profile_id: 'profile-1',
      affected_area: 'trade_board',
      symptom: 'Replacement listing did not show after trade approval.',
      root_cause: 'The revealed ring was missing ring size.',
      fix_or_workaround: 'Open swap cleanup and enter ring size before shipping.',
      tags: ['trade-board', 'ring-size'],
      approved_for_reuse: true,
      created_by: 'louis@neonrabbit.net',
    })
    expect(result).toEqual({
      report: expect.objectContaining({ id: 'report-1', status: 'resolved' }),
      lesson: expect.objectContaining({ id: 'lesson-1' }),
    })
  })

  it('saves resolution metadata without creating a lesson when reuse is not approved', async () => {
    const { client, queries } = makeClient({})

    const result = await resolveSupportReport(client as never, {
      reportId: 'report-1',
      affectedArea: 'billing',
      symptom: 'Rep could not find subscription status.',
      rootCause: 'Account page copy was unclear.',
      fixOrWorkaround: 'Pointed rep to Stripe portal.',
      tags: ['billing'],
      approvedForReuse: false,
      createdBy: 'louis@neonrabbit.net',
    })

    expect(queries.support_reports.update).toHaveBeenCalled()
    expect(queries.support_lessons.insert).not.toHaveBeenCalled()
    expect(result.lesson).toBeNull()
  })

  it('rejects incomplete resolution closeout before writing', async () => {
    const { client, queries } = makeClient({})

    await expect(
      resolveSupportReport(client as never, {
        reportId: 'report-1',
        affectedArea: 'trade_board',
        symptom: '',
        rootCause: 'Missing details',
        fixOrWorkaround: 'Fix',
        tags: [],
        approvedForReuse: true,
      }),
    ).rejects.toThrow()

    expect(queries.support_reports.update).not.toHaveBeenCalled()
    expect(queries.support_lessons.insert).not.toHaveBeenCalled()
  })
})
