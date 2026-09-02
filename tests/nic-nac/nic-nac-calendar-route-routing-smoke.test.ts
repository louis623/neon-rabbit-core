import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  supabaseMock,
  getPaidNicNacContextMock,
  loadCanonicalHistoryMock,
  insertUserMessageMock,
  reserveAssistantMessageMock,
  completeAssistantMock,
  abortAssistantMock,
  checkpointAssistantMock,
  recordApprovalEventMock,
  probeConversationOwnerMock,
  logIncidentMock,
  logNicNacRunMock,
  normalizeRunUsageMock,
  createAdminClientMock,
  getOrCreateTradeBoardIntakeContextMock,
  getOrCreateTradeWorkflowContextMock,
  getOrCreateCalendarWorkflowContextMock,
  loadSuiteRepMemoryCardsMock,
  loadOperatorSupportConversationMock,
  insertOperatorSupportConversationMessageMock,
  recordOperatorSupportApprovalEventMock,
  createConfiguredNicNacAgentMock,
  loadNicNacWorkflowTaskContinuityMock,
  agentStreamMock,
} = vi.hoisted(() => ({
  supabaseMock: {},
  getPaidNicNacContextMock: vi.fn(),
  loadCanonicalHistoryMock: vi.fn(),
  insertUserMessageMock: vi.fn(),
  reserveAssistantMessageMock: vi.fn(),
  completeAssistantMock: vi.fn(),
  abortAssistantMock: vi.fn(),
  checkpointAssistantMock: vi.fn(),
  recordApprovalEventMock: vi.fn(),
  probeConversationOwnerMock: vi.fn(),
  logIncidentMock: vi.fn(),
  logNicNacRunMock: vi.fn(),
  normalizeRunUsageMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  getOrCreateTradeBoardIntakeContextMock: vi.fn(),
  getOrCreateTradeWorkflowContextMock: vi.fn(),
  getOrCreateCalendarWorkflowContextMock: vi.fn(),
  loadSuiteRepMemoryCardsMock: vi.fn(),
  loadOperatorSupportConversationMock: vi.fn(),
  insertOperatorSupportConversationMessageMock: vi.fn(),
  recordOperatorSupportApprovalEventMock: vi.fn(),
  createConfiguredNicNacAgentMock: vi.fn(),
  loadNicNacWorkflowTaskContinuityMock: vi.fn(),
  agentStreamMock: vi.fn(),
}))

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getPaidNicNacContext: getPaidNicNacContextMock,
}))

vi.mock('@/lib/nic-nac/persistence', () => ({
  loadCanonicalHistory: loadCanonicalHistoryMock,
  insertUserMessage: insertUserMessageMock,
  reserveAssistantMessage: reserveAssistantMessageMock,
  completeAssistant: completeAssistantMock,
  abortAssistant: abortAssistantMock,
  checkpointAssistant: checkpointAssistantMock,
  recordApprovalEvent: recordApprovalEventMock,
}))

vi.mock('@/lib/nic-nac/probe-conversation-owner', () => ({
  probeConversationOwner: probeConversationOwnerMock,
}))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: logIncidentMock,
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/nic-nac/run-telemetry', () => ({
  logNicNacRun: logNicNacRunMock,
  normalizeRunUsage: normalizeRunUsageMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/nic-nac/workflows/trade-board-intake-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/nic-nac/workflows/trade-board-intake-context')>()
  return {
    ...actual,
    getOrCreateTradeBoardIntakeContext: getOrCreateTradeBoardIntakeContextMock,
  }
})

vi.mock('@/lib/nic-nac/workflows/trade-workflow-context', () => ({
  getOrCreateTradeWorkflowContext: getOrCreateTradeWorkflowContextMock,
}))

vi.mock('@/lib/nic-nac/workflows/calendar-workflow-context', () => ({
  getOrCreateCalendarWorkflowContext: getOrCreateCalendarWorkflowContextMock,
}))

vi.mock('@/lib/nic-nac/core/memory/rep-memory-cards', () => ({
  loadSuiteRepMemoryCards: loadSuiteRepMemoryCardsMock,
}))

vi.mock('@/lib/nic-nac/support-conversation', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/nic-nac/support-conversation')>()
  return {
    ...actual,
    loadOperatorSupportConversation: loadOperatorSupportConversationMock,
    insertOperatorSupportConversationMessage:
      insertOperatorSupportConversationMessageMock,
    recordOperatorSupportApprovalEvent: recordOperatorSupportApprovalEventMock,
  }
})

vi.mock('@/lib/nic-nac/agent', () => ({
  createConfiguredNicNacAgent: createConfiguredNicNacAgentMock,
}))

vi.mock('@/lib/nic-nac/agent/workflow-task-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/nic-nac/agent/workflow-task-context')>()
  return {
    ...actual,
    loadNicNacWorkflowTaskContinuity: loadNicNacWorkflowTaskContinuityMock,
  }
})

import { POST } from '@/app/api/nic-nac/route'
import { runWithOperatorSupportRequestContext } from '@/lib/operator-support/request-context'

const REPRESENTATIVE_TOOLS = [
  'search_trade_board',
  'list_my_trade_board',
  'prepare_trade_board_add',
  'add_trade_board_listing',
  'list_my_shows',
  'prepare_calendar_work',
  'add_show',
  'update_show',
  'cancel_show',
  'build_site_recipe_draft',
  'manage_site_recipes',
  'update_site_setting',
  'get_help_resources',
]

type AgentChunk = Record<string, unknown>

function resultFromChunks(chunks: AgentChunk[]) {
  return {
    toUIMessageStream: async function* () {
      for (const chunk of chunks) yield chunk
    },
  }
}

function textResult(text: string) {
  return resultFromChunks([
    { type: 'text-start', id: 'text-1' },
    { type: 'text-delta', id: 'text-1', delta: text },
    { type: 'text-end', id: 'text-1' },
    { type: 'finish', finishReason: { unified: 'stop', raw: undefined } },
  ])
}

function requestForMessages(messages: unknown[], conversationId = 'agent-route-conversation') {
  return new Request('http://localhost/api/nic-nac', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ conversationId, mode: 'workspace', messages }),
  })
}

function requestFor(text: string, id = 'user-1') {
  return requestForMessages([
    { id, role: 'user', parts: [{ type: 'text', text }] },
  ])
}

function supportRequestFor(text: string) {
  return requestForMessages(
    [{ id: 'support-user-1', role: 'user', parts: [{ type: 'text', text }] }],
    'support-session-1',
  )
}

describe('Nic-Nac agent route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    getPaidNicNacContextMock.mockResolvedValue({
      repId: '11111111-1111-4111-8111-111111111111',
      rep: {
        auth_user_id: 'user-1',
        email: 'rep@example.com',
        display_name: 'Brittany Smith',
      },
      supabase: supabaseMock,
    })
    probeConversationOwnerMock.mockResolvedValue(null)
    loadCanonicalHistoryMock.mockResolvedValue([])
    loadOperatorSupportConversationMock.mockResolvedValue([])
    insertUserMessageMock.mockResolvedValue(undefined)
    reserveAssistantMessageMock.mockResolvedValue(undefined)
    completeAssistantMock.mockResolvedValue(undefined)
    abortAssistantMock.mockResolvedValue(undefined)
    checkpointAssistantMock.mockResolvedValue(undefined)
    recordApprovalEventMock.mockResolvedValue({ replayed: false })
    recordOperatorSupportApprovalEventMock.mockResolvedValue({ replayed: false })
    insertOperatorSupportConversationMessageMock.mockResolvedValue(undefined)
    createAdminClientMock.mockReturnValue(supabaseMock)
    loadNicNacWorkflowTaskContinuityMock.mockResolvedValue({
      context: {
        schemaVersion: 1,
        currentGoal: null,
        pausedGoals: [],
        immediateContinuation: null,
      },
      promptText: '',
      calendarSession: null,
      tradeBoardSession: null,
      tradeSession: null,
    })
    loadSuiteRepMemoryCardsMock.mockResolvedValue([])
    getOrCreateTradeBoardIntakeContextMock.mockResolvedValue({
      sessionBefore: null,
      sessionAfter: null,
      workflowIntents: [],
      toolPolicySource: 'latest_turn_intent',
      workflowPromptState: '',
    })
    getOrCreateTradeWorkflowContextMock.mockResolvedValue({
      sessionBefore: null,
      sessionAfter: null,
      activeWorkflow: null,
    })
    getOrCreateCalendarWorkflowContextMock.mockResolvedValue({
      sessionBefore: null,
      sessionAfter: null,
      activeWorkflow: null,
      workflowIntents: [],
      toolPolicySource: 'latest_turn_intent',
      workflowPromptState: '',
    })
    normalizeRunUsageMock.mockReturnValue({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      estimatedCostCents: 0,
    })
    logNicNacRunMock.mockResolvedValue(undefined)
    agentStreamMock.mockResolvedValue(textResult('I handled the latest request.'))
    createConfiguredNicNacAgentMock.mockImplementation((input) => {
      input.onFinish?.({ totalUsage: { inputTokens: 10, outputTokens: 5 } })
      const tools = Object.fromEntries(
        REPRESENTATIVE_TOOLS.map((name) => [name, { description: name }]),
      )
      return {
        catalog: {
          source: 'workspace_permissions',
          mode: 'workspace',
          tools,
          toolNames: [...REPRESENTATIVE_TOOLS],
          requestedIntents: ['trade_board', 'calendar', 'site_content', 'resources_support'],
          allowedIntents: ['trade_board', 'calendar', 'site_content', 'resources_support'],
          blockedIntents: [],
          blockedToolNames: [],
          operatorRestrictedToolNames: [],
        },
        agent: {
          id: 'mock-agent',
          tools,
          toolChoice: 'auto',
          maxSteps: 6,
          stream: agentStreamMock,
        },
      }
    })
  })

  it('keeps the zero-cost personalized greeting fast path', async () => {
    const response = await POST(requestFor('Hello'))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('Hello, Brittany! How can I help you today?')
    expect(createConfiguredNicNacAgentMock).not.toHaveBeenCalled()
    expect(agentStreamMock).not.toHaveBeenCalled()
  })

  it('lets the agent handle a Dance Floor starter instead of returning a scripted bypass', async () => {
    agentStreamMock.mockResolvedValueOnce(
      textResult('Absolutely—send the item number, a label photo, or tell me you do not have one.'),
    )

    const response = await POST(requestFor('Nic-Nac, add a dancer'))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('send the item number')
    expect(createConfiguredNicNacAgentMock).toHaveBeenCalledOnce()
    expect(agentStreamMock).toHaveBeenCalledOnce()
  })

  it('passes the authenticated context to one permission-scoped agent catalog', async () => {
    await (await POST(requestFor('What is on my calendar this week?'))).text()

    expect(createConfiguredNicNacAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'workspace',
        repDisplayName: 'Brittany Smith',
        toolContext: expect.objectContaining({
          repId: '11111111-1111-4111-8111-111111111111',
          conversationId: 'agent-route-conversation',
          agentHarness: true,
          latestUserText: 'What is on my calendar this week?',
        }),
      }),
    )
    expect(agentStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.any(Array),
        abortSignal: expect.any(AbortSignal),
      }),
    )
  })

  it('supplies recoverable transaction facts without narrowing or forcing the agent catalog', async () => {
    const pausedCalendar = {
      id: 'calendar-workflow-1',
      status: 'active',
      intent: 'add_show',
      knownFields: { title: 'Tonight Live', eventTime: '2026-09-01T23:00:00Z' },
      missingFields: ['platform'],
    }
    loadNicNacWorkflowTaskContinuityMock.mockResolvedValueOnce({
      context: {
        schemaVersion: 1,
        currentGoal: null,
        pausedGoals: [{ id: 'calendar:calendar-workflow-1' }],
        immediateContinuation: null,
      },
      promptText: 'Recoverable Calendar facts: title Tonight Live; missing platform.',
      calendarSession: pausedCalendar,
      tradeBoardSession: null,
      tradeSession: null,
    })

    await (await POST(requestFor('Pause that. What is on my Dance Floor?'))).text()

    expect(createConfiguredNicNacAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        taskContext: expect.stringMatching(
          /latest explicit request still wins[\s\S]*Tonight Live/,
        ),
        toolContext: expect.objectContaining({
          activeCalendarWorkflow: pausedCalendar,
        }),
      }),
    )
    expect(agentStreamMock).toHaveBeenCalledWith({
      messages: expect.any(Array),
      abortSignal: expect.any(AbortSignal),
    })
  })

  it('does not feed an unrelated latest request into the most recent unfinished workflow', async () => {
    loadNicNacWorkflowTaskContinuityMock.mockResolvedValueOnce({
      context: {
        schemaVersion: 1,
        currentGoal: null,
        pausedGoals: [{ id: 'calendar:calendar-workflow-1' }],
        immediateContinuation: null,
      },
      promptText:
        'Recoverable transaction facts: Calendar title Tonight Live; platform is still missing.',
      calendarSession: {
        id: 'calendar-workflow-1',
        status: 'active',
        intent: 'add_show',
        knownFields: { title: 'Tonight Live' },
        missingFields: ['platform'],
        updatedAt: '2026-09-01T20:10:00.000Z',
      },
      tradeBoardSession: null,
      tradeSession: null,
    })

    await (await POST(requestFor('Give me three strong opening lines for a live show.'))).text()

    expect(getOrCreateCalendarWorkflowContextMock).not.toHaveBeenCalled()
    expect(getOrCreateTradeBoardIntakeContextMock).not.toHaveBeenCalled()
    expect(getOrCreateTradeWorkflowContextMock).not.toHaveBeenCalled()
    expect(agentStreamMock).toHaveBeenCalledOnce()
  })

  it('still lets a direct answer to the immediately preceding Calendar question update that workflow', async () => {
    const pausedCalendar = {
      id: 'calendar-workflow-1',
      status: 'active',
      intent: 'add_show',
      knownFields: { title: 'Tonight Live' },
      missingFields: ['platform'],
      updatedAt: '2026-09-01T20:10:00.000Z',
    }
    loadNicNacWorkflowTaskContinuityMock.mockResolvedValueOnce({
      context: {
        schemaVersion: 1,
        currentGoal: null,
        pausedGoals: [{ id: 'calendar:calendar-workflow-1' }],
        immediateContinuation: null,
      },
      promptText: 'Recoverable Calendar facts: title Tonight Live; missing platform.',
      calendarSession: pausedCalendar,
      tradeBoardSession: null,
      tradeSession: null,
    })

    await (
      await POST(
        requestForMessages([
          {
            id: 'calendar-user-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Add a show tonight at 7 Eastern.' }],
          },
          {
            id: 'calendar-assistant-1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'What platform should I use for the show?' }],
          },
          {
            id: 'calendar-user-2',
            role: 'user',
            parts: [{ type: 'text', text: 'TikTok.' }],
          },
        ]),
      )
    ).text()

    expect(getOrCreateCalendarWorkflowContextMock).toHaveBeenCalledWith(
      expect.objectContaining({ preloadedSession: pausedCalendar }),
    )
    expect(getOrCreateTradeBoardIntakeContextMock).not.toHaveBeenCalled()
  })

  it('switches from a Calendar read to an add request in the same conversation without route pinning', async () => {
    const firstMessages = [
      {
        id: 'read-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Do I have any shows tonight?' }],
      },
    ]
    await (await POST(requestForMessages(firstMessages))).text()

    const secondMessages = [
      ...firstMessages,
      {
        id: 'assistant-read-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'You do not have any shows tonight.' }],
      },
      {
        id: 'add-1',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Cool, add one tonight at 7 Eastern for Bunny Ears with code AWESOME.',
          },
        ],
      },
    ]
    await (await POST(requestForMessages(secondMessages))).text()

    expect(createConfiguredNicNacAgentMock).toHaveBeenCalledTimes(2)
    const secondConfig = createConfiguredNicNacAgentMock.mock.calls[1][0]
    expect(secondConfig.toolContext.latestUserText).toContain('add one tonight')
    expect(agentStreamMock).toHaveBeenCalledTimes(2)
    const secondStreamInput = agentStreamMock.mock.calls[1][0]
    expect(secondStreamInput).toEqual({
      messages: expect.any(Array),
      abortSignal: expect.any(AbortSignal),
    })
    expect(secondStreamInput).not.toHaveProperty('toolChoice')
    expect(secondStreamInput).not.toHaveProperty('prepareStep')
  })

  it.each([
    [
      'Calendar to Dance Floor',
      'What platform should I use for the show?',
      'Pause that. What dancers are on my Dance Floor?',
    ],
    [
      'Dance Floor to site content',
      'Send the item number or a label photo.',
      'Actually, update my homepage banner to Live tonight at 7.',
    ],
    [
      'site content to Calendar',
      'What should the About section say?',
      'Before that, what shows do I have next week?',
    ],
    [
      'general guidance to Calendar action',
      'Here are three ways to make the live easier.',
      'Thanks. Add a TikTok show tomorrow at 8 Eastern called Summer Stacks.',
    ],
  ])('honors the latest %s request instead of retaining the prior task', async (
    _label,
    priorAssistantText,
    latestUserText,
  ) => {
    const messages = [
      {
        id: 'old-user',
        role: 'user',
        parts: [{ type: 'text', text: 'Help me with the previous task.' }],
      },
      {
        id: 'old-assistant',
        role: 'assistant',
        parts: [{ type: 'text', text: priorAssistantText }],
      },
      {
        id: 'latest-user',
        role: 'user',
        parts: [{ type: 'text', text: latestUserText }],
      },
    ]

    await (await POST(requestForMessages(messages))).text()

    const config = createConfiguredNicNacAgentMock.mock.calls[0][0]
    expect(config.toolContext.latestUserText).toBe(latestUserText)
    expect(agentStreamMock).toHaveBeenCalledWith({
      messages: expect.any(Array),
      abortSignal: expect.any(AbortSignal),
    })
  })

  it('keeps support work isolated and passes the disclosed support capabilities', async () => {
    await runWithOperatorSupportRequestContext(
      {
        session: {
          id: 'support-session-1',
          targetRepId: '11111111-1111-4111-8111-111111111111',
          capabilities: ['calendar.manage'],
        },
        actor: {
          operatorRepId: '22222222-2222-4222-8222-222222222222',
          subjectRepId: '11111111-1111-4111-8111-111111111111',
        },
      } as never,
      async () => {
        await (await POST(supportRequestFor('What is on the rep calendar?'))).text()
      },
    )

    expect(createConfiguredNicNacAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toolContext: expect.objectContaining({
          operatorSupport: {
            supportSessionId: 'support-session-1',
            operatorRepId: '22222222-2222-4222-8222-222222222222',
            capabilities: ['calendar.manage'],
          },
        }),
      }),
    )
    expect(loadNicNacWorkflowTaskContinuityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        access: { calendar: true, tradeBoard: false, trade: false },
      }),
    )
  })

  it('does not ingest an unauthorized Dance Floor workflow during Calendar-only support', async () => {
    await runWithOperatorSupportRequestContext(
      {
        session: {
          id: 'support-session-1',
          targetRepId: '11111111-1111-4111-8111-111111111111',
          capabilities: ['calendar.manage'],
        },
        actor: {
          operatorRepId: '22222222-2222-4222-8222-222222222222',
          subjectRepId: '11111111-1111-4111-8111-111111111111',
        },
      } as never,
      async () => {
        await (await POST(supportRequestFor('What is on the rep Dance Floor?'))).text()
      },
    )

    expect(getOrCreateTradeBoardIntakeContextMock).not.toHaveBeenCalled()
    expect(getOrCreateTradeWorkflowContextMock).not.toHaveBeenCalled()
    expect(loadNicNacWorkflowTaskContinuityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        access: { calendar: true, tradeBoard: false, trade: false },
      }),
    )
  })

  it('validates a canonical approval and returns control to the agent loop', async () => {
    const executeCancel = vi.fn().mockResolvedValue({
      event: { title: 'Synthetic Reviewer Show', status: 'cancelled' },
    })
    const tools = {
      cancel_show: {
        description: 'Cancel one show.',
        needsApproval: true,
        execute: executeCancel,
      },
    }
    createConfiguredNicNacAgentMock.mockReturnValueOnce({
      catalog: {
        source: 'workspace_permissions',
        mode: 'workspace',
        tools,
        toolNames: ['cancel_show'],
        toolSafety: [],
        requestedIntents: ['calendar'],
        allowedIntents: ['calendar'],
        blockedIntents: [],
        blockedToolNames: [],
        operatorRestrictedToolNames: [],
      },
      agent: {
        id: 'mock-agent',
        tools,
        toolChoice: 'auto',
        maxSteps: 6,
        stream: agentStreamMock,
      },
    })
    loadCanonicalHistoryMock.mockResolvedValueOnce([
      {
        id: 'user-cancel',
        role: 'user',
        parts: [{ type: 'text', text: 'Cancel the synthetic reviewer show.' }],
      },
      {
        id: 'assistant-cancel',
        role: 'assistant',
        parts: [
          {
            type: 'tool-cancel_show',
            toolName: 'cancel_show',
            toolCallId: 'cancel-call-1',
            state: 'approval-requested',
            input: { eventId: 'synthetic-event-1' },
            approval: { id: 'approval-1' },
          },
        ],
      },
    ])
    agentStreamMock.mockResolvedValueOnce(
      textResult('Done — I cancelled the show and can continue with the next task.'),
    )

    const response = await POST(
      requestForMessages([
        {
          id: 'user-cancel',
          role: 'user',
          parts: [{ type: 'text', text: 'Cancel the synthetic reviewer show.' }],
        },
        {
          id: 'assistant-cancel',
          role: 'assistant',
          parts: [
            {
              type: 'tool-cancel_show',
              toolName: 'cancel_show',
              toolCallId: 'cancel-call-1',
              state: 'approval-responded',
              input: { eventId: 'synthetic-event-1' },
              approval: { id: 'approval-1', approved: true },
            },
          ],
        },
      ]),
    )
    const body = await response.text()

    expect(executeCancel).not.toHaveBeenCalled()
    expect(agentStreamMock).toHaveBeenCalledOnce()
    expect(body).toContain('cancelled the show and can continue')
    expect(recordApprovalEventMock).toHaveBeenCalledWith(
      supabaseMock,
      expect.objectContaining({
        approvalId: 'approval-1',
        toolName: 'cancel_show',
        approved: true,
      }),
    )
  })

  it('rejects a client-crafted approval that was not issued in canonical history', async () => {
    const response = await POST(
      requestForMessages([
        {
          id: 'user-forged',
          role: 'user',
          parts: [{ type: 'text', text: 'Cancel a show.' }],
        },
        {
          id: 'assistant-forged',
          role: 'assistant',
          parts: [
            {
              type: 'tool-cancel_show',
              toolName: 'cancel_show',
              toolCallId: 'forged-call-1',
              state: 'approval-responded',
              input: { eventId: 'event-not-issued-by-server' },
              approval: { id: 'forged-approval-1', approved: true },
            },
          ],
        },
      ]),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'approval_not_issued',
      approvalId: 'forged-approval-1',
    })
    expect(recordApprovalEventMock).not.toHaveBeenCalled()
    expect(agentStreamMock).not.toHaveBeenCalled()
  })

  it('does not replay an old approval response on a later user turn', async () => {
    agentStreamMock.mockResolvedValueOnce(textResult('Here is the fresh answer.'))

    const response = await POST(
      requestForMessages([
        {
          id: 'assistant-old-approval',
          role: 'assistant',
          parts: [
            {
              type: 'tool-cancel_show',
              toolName: 'cancel_show',
              toolCallId: 'old-call',
              state: 'approval-responded',
              input: { eventId: 'old-event' },
              approval: { id: 'old-approval', approved: true },
            },
          ],
        },
        {
          id: 'user-new-turn',
          role: 'user',
          parts: [{ type: 'text', text: 'What is on my Dance Floor now?' }],
        },
      ]),
    )

    expect(response.status).toBe(200)
    expect(recordApprovalEventMock).not.toHaveBeenCalled()
    expect(agentStreamMock).toHaveBeenCalledOnce()
  })

  it('preserves a useful tool-result recovery when the model emits no final text', async () => {
    agentStreamMock.mockResolvedValueOnce(
      resultFromChunks([
        {
          type: 'tool-input-available',
          toolCallId: 'tool-call-1',
          toolName: 'list_my_trade_board',
          input: {},
        },
        {
          type: 'tool-output-available',
          toolCallId: 'tool-call-1',
          output: {
            count: 1,
            listings: [
              {
                designName: 'The Starlight Earrings',
                itemNumber: 'ER12345',
                status: 'available',
              },
            ],
          },
        },
        { type: 'finish', finishReason: { unified: 'tool-calls', raw: undefined } },
      ]),
    )

    const response = await POST(requestFor('What is on my Dance Floor?'))
    const body = await response.text()

    expect(body).toContain('Your Dance Floor has 1 matching dancer')
    expect(body).toContain('The Starlight Earrings')
    expect(body).not.toContain('Please send that again')
    expect(logNicNacRunMock).toHaveBeenCalledWith(
      expect.objectContaining({ executedToolNames: ['list_my_trade_board'] }),
    )
  })

  it('records an agent-stream failure without claiming the task succeeded', async () => {
    agentStreamMock.mockResolvedValueOnce({
      toUIMessageStream: async function* () {
        throw new Error('provider exploded')
      },
    })

    const response = await POST(requestFor('Check the calendar'))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('error')
    expect(logIncidentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'agent_stream_error',
        details: expect.objectContaining({ message: 'provider exploded' }),
      }),
    )
    expect(completeAssistantMock).not.toHaveBeenCalled()
  })

  it('records a provider failure that occurs before the stream iterator exists', async () => {
    agentStreamMock.mockRejectedValueOnce(new Error('provider failed to start'))

    const response = await POST(requestFor('Check the calendar'))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('error')
    expect(logIncidentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'agent_stream_error',
        details: expect.objectContaining({ message: 'provider failed to start' }),
      }),
    )
    expect(completeAssistantMock).not.toHaveBeenCalled()
  })
})
