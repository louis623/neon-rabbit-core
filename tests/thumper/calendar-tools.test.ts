import { describe, it, expect, vi, beforeEach } from 'vitest'
import { errors } from '@/lib/services/errors'

const addShowMock = vi.fn()
const listMyShowsMock = vi.fn()
const updateShowMock = vi.fn()
const cancelShowMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()

vi.mock('@/lib/services/calendar', () => ({
  addShow: (...args: unknown[]) => addShowMock(...args),
  listMyShows: (...args: unknown[]) => listMyShowsMock(...args),
  updateShow: (...args: unknown[]) => updateShowMock(...args),
  cancelShow: (...args: unknown[]) => cancelShowMock(...args),
}))

vi.mock('@/lib/thumper/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

vi.mock('@/lib/thumper/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

import { makeAddShowTool } from '@/lib/thumper/tools/add-show'
import { makeListMyShowsTool } from '@/lib/thumper/tools/list-my-shows'
import { makeUpdateShowTool } from '@/lib/thumper/tools/update-show'
import { makeCancelShowTool } from '@/lib/thumper/tools/cancel-show'
import { buildAllTools } from '@/lib/thumper/tools'
import { THUMPER_SYSTEM_PROMPT } from '@/lib/thumper/system-prompt'
import { APPROVAL_COPY } from '@/app/thumper/components/HITLBlock'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
  needsApproval?: boolean
}

const VALID_EVENT_ID = '11111111-1111-4111-8111-111111111111'

function calendarEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_EVENT_ID,
    repId: 'rep-1',
    platform: 'TikTok',
    eventTime: '2099-05-01T20:00:00.000Z',
    durationMinutes: 60,
    title: 'Friday Sparkles',
    description: 'Main show',
    discountCode: null,
    discountDescription: null,
    featuredCollections: ['Celestial'],
    isRecurring: false,
    recurrenceRule: null,
    status: 'scheduled',
    createdAt: '2099-04-01T12:00:00.000Z',
    updatedAt: '2099-04-01T12:00:00.000Z',
    ...overrides,
  }
}

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

beforeEach(() => {
  addShowMock.mockReset()
  listMyShowsMock.mockReset()
  updateShowMock.mockReset()
  cancelShowMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
})

describe('calendar tools', () => {
  it('add_show calls addShow with auth client + repId and returns the event payload', async () => {
    addShowMock.mockResolvedValueOnce({ event: calendarEvent() })
    const tool = makeAddShowTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      platform: 'TikTok',
      eventTime: '2099-05-01T20:00:00.000Z',
      title: 'Friday Sparkles',
    })

    expect(addShowMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
      expect.objectContaining({
        platform: 'TikTok',
        eventTime: '2099-05-01T20:00:00.000Z',
        title: 'Friday Sparkles',
      }),
    )
    expect(result.event).toMatchObject({
      id: VALID_EVENT_ID,
      title: 'Friday Sparkles',
      status: 'scheduled',
    })
  })

  it('list_my_shows returns count + totalCount + events', async () => {
    listMyShowsMock.mockResolvedValueOnce({
      events: [calendarEvent()],
      totalCount: 3,
    })
    const tool = makeListMyShowsTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({ upcoming: true, limit: 5 })

    expect(listMyShowsMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
      { upcoming: true, limit: 5 },
    )
    expect(result).toMatchObject({
      count: 1,
      totalCount: 3,
    })
    expect((result.events as Array<Record<string, unknown>>)[0]).toMatchObject({
      eventId: VALID_EVENT_ID,
      title: 'Friday Sparkles',
      platform: 'TikTok',
    })
  })

  it('update_show blocks empty patches before calling the service', async () => {
    const tool = makeUpdateShowTool(makeCtx()) as unknown as ToolDef

    await expect(tool.execute({ eventId: VALID_EVENT_ID })).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'NO_PATCH_FIELDS',
    })
    expect(updateShowMock).not.toHaveBeenCalled()
  })

  it('update_show translates ServiceError into ThumperToolError', async () => {
    updateShowMock.mockRejectedValueOnce(errors.EVENT_NOT_EDITABLE())
    const tool = makeUpdateShowTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({ eventId: VALID_EVENT_ID, title: 'Moved title' }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'EVENT_NOT_EDITABLE',
    })
  })

  it('cancel_show exposes needsApproval, writes audit, and returns the cancelled event', async () => {
    cancelShowMock.mockResolvedValueOnce({
      event: calendarEvent({ status: 'cancelled' }),
    })
    const tool = makeCancelShowTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      eventId: VALID_EVENT_ID,
      reason: 'family emergency',
    })

    expect(tool.needsApproval).toBe(true)
    expect(cancelShowMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
      VALID_EVENT_ID,
      'family emergency',
    )
    expect(writeTradeActionAuditMock).toHaveBeenCalledTimes(1)
    expect(writeTradeActionAuditMock.mock.calls[0][0]).toMatchObject({
      actionType: 'cancel_show',
      repId: 'rep-1',
      targetListingId: null,
      details: { runId: 'run-1', conversationId: 'conv-1', reason: 'family emergency' },
    })
    expect(result).toMatchObject({
      event: { status: 'cancelled' },
      reason: 'family emergency',
    })
  })

  it('cancel_show still returns success when audit logging fails', async () => {
    cancelShowMock.mockResolvedValueOnce({
      event: calendarEvent({ status: 'cancelled' }),
    })
    writeTradeActionAuditMock.mockRejectedValueOnce(new Error('audit down'))
    const tool = makeCancelShowTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({ eventId: VALID_EVENT_ID })

    expect(result).toMatchObject({
      event: { status: 'cancelled' },
    })
    expect(logIncidentMock).toHaveBeenCalledTimes(1)
    expect(logIncidentMock.mock.calls[0][0]).toMatchObject({
      errorType: 'audit_write_failed',
      severity: 'warn',
    })
  })
})

describe('calendar registry and prompt wiring', () => {
  it('buildAllTools now exposes 13 tools including the four calendar tools', () => {
    const tools = buildAllTools(makeCtx())
    const names = Object.keys(tools).sort()

    expect(names).toHaveLength(13)
    expect(names).toEqual(expect.arrayContaining([
      'add_show',
      'list_my_shows',
      'update_show',
      'cancel_show',
    ]))
  })

  it('system prompt promotes show scheduling into active scope and keeps reminders as not yet', () => {
    expect(THUMPER_SYSTEM_PROMPT).toContain('You have thirteen tools available right now:')
    expect(THUMPER_SYSTEM_PROMPT).toContain('add_show')
    expect(THUMPER_SYSTEM_PROMPT).toContain('list_my_shows')
    expect(THUMPER_SYSTEM_PROMPT).toContain('update_show')
    expect(THUMPER_SYSTEM_PROMPT).toContain('cancel_show')
    expect(THUMPER_SYSTEM_PROMPT).toContain('Sending show reminders');
    expect(THUMPER_SYSTEM_PROMPT).not.toContain('Scheduling a show, sending show reminders, or building a show plan â€” Not yet.')
  })

  it('HITL copy includes custom cancel_show labels', () => {
    expect(APPROVAL_COPY.cancel_show).toEqual({
      title: 'Cancel this show?',
      confirm: 'Cancel show',
      cancel: 'Keep show',
    })
  })
})
