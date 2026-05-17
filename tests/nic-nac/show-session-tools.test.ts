import { beforeEach, describe, expect, it, vi } from 'vitest'

const startNicNacShowSessionMock = vi.fn()
const recordNicNacShowSessionEventMock = vi.fn()
const loadNicNacShowSessionContextMock = vi.fn()

vi.mock('@/lib/nic-nac/show-sessions', async () => {
  const actual = await vi.importActual<typeof import('@/lib/nic-nac/show-sessions')>(
    '@/lib/nic-nac/show-sessions',
  )
  return {
    ...actual,
    startNicNacShowSession: (...args: unknown[]) =>
      startNicNacShowSessionMock(...args),
    recordNicNacShowSessionEvent: (...args: unknown[]) =>
      recordNicNacShowSessionEventMock(...args),
    loadNicNacShowSessionContext: (...args: unknown[]) =>
      loadNicNacShowSessionContextMock(...args),
  }
})

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: vi.fn(),
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

import { buildAllTools } from '@/lib/nic-nac/tools'
import { makeGetShowSessionContextTool } from '@/lib/nic-nac/tools/get-show-session-context'
import { makeRecordShowSessionEventTool } from '@/lib/nic-nac/tools/record-show-session-event'
import { makeStartShowSessionTool } from '@/lib/nic-nac/tools/start-show-session'
import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: { marker: 'supabase' } as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

beforeEach(() => {
  startNicNacShowSessionMock.mockReset()
  recordNicNacShowSessionEventMock.mockReset()
  loadNicNacShowSessionContextMock.mockReset()
})

describe('Nic-Nac show-session tools', () => {
  it('starts a show session using the authenticated rep and current conversation context', async () => {
    startNicNacShowSessionMock.mockResolvedValueOnce({
      id: 'session-1',
      repId: 'rep-1',
      status: 'active',
    })
    const tool = makeStartShowSessionTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      calendarEventId: 'event-1',
      liveQueueSyncCode: 'SYNC123',
      metadata: { platform: 'TikTok' },
    })

    expect(startNicNacShowSessionMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      {
        repId: 'rep-1',
        calendarEventId: 'event-1',
        liveQueueSyncCode: 'SYNC123',
        metadata: {
          platform: 'TikTok',
          conversationId: 'conv-1',
          runId: 'run-1',
        },
      },
    )
    expect(result).toMatchObject({ id: 'session-1', status: 'active' })
  })

  it('records a show-session event with conversation and run correlation', async () => {
    recordNicNacShowSessionEventMock.mockResolvedValueOnce({
      id: 'event-row-1',
      repId: 'rep-1',
      eventType: 'follow_up',
    })
    const tool = makeRecordShowSessionEventTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      sessionId: 'session-1',
      eventType: 'follow_up',
      summary: 'Ask Jamie about the blue ring after the show.',
      payload: { customerName: 'Jamie' },
    })

    expect(recordNicNacShowSessionEventMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      {
        sessionId: 'session-1',
        repId: 'rep-1',
        eventType: 'follow_up',
        summary: 'Ask Jamie about the blue ring after the show.',
        payload: { customerName: 'Jamie' },
        conversationId: 'conv-1',
        runId: 'run-1',
      },
    )
    expect(result).toMatchObject({ id: 'event-row-1', eventType: 'follow_up' })
  })

  it('gets current show context as a read-only internal tool', async () => {
    loadNicNacShowSessionContextMock.mockResolvedValueOnce({
      activeSession: null,
      recentEvents: [],
      memory: {
        preferences: [],
        showProcesses: [],
        customerPatterns: [],
        followUps: [],
        previousShowSummaries: [],
        guarded: [],
      },
    })
    const tool = makeGetShowSessionContextTool(makeCtx()) as unknown as ToolDef

    await tool.execute({})

    expect(loadNicNacShowSessionContextMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      { eventLimit: 20, memoryLimit: 10 },
    )
  })

  it('registers show-session tools and documents the no-provider smoke boundary', () => {
    const tools = buildAllTools(makeCtx())
    expect(Object.keys(tools)).toEqual(
      expect.arrayContaining([
        'start_show_session',
        'record_show_session_event',
        'get_show_session_context',
      ]),
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('You have twenty-eight tools')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('get_show_session_context')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('record_show_session_event')
  })
})
