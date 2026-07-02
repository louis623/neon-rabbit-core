import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  streamTextMock,
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
  getNicNacLanguageModelMock,
  getNicNacProviderOptionsMock,
  createAdminClientMock,
  getOrCreateTradeBoardIntakeContextMock,
  loadSuiteRepMemoryCardsMock,
} = vi.hoisted(() => ({
  streamTextMock: vi.fn(),
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
  getNicNacLanguageModelMock: vi.fn(),
  getNicNacProviderOptionsMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  getOrCreateTradeBoardIntakeContextMock: vi.fn(),
  loadSuiteRepMemoryCardsMock: vi.fn(),
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    streamText: (options: unknown) => streamTextMock(options),
  }
})

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

vi.mock('@/lib/nic-nac/core/model-provider', () => ({
  getNicNacLanguageModel: getNicNacLanguageModelMock,
  getNicNacProviderOptions: getNicNacProviderOptionsMock,
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

vi.mock('@/lib/nic-nac/core/memory/rep-memory-cards', () => ({
  loadSuiteRepMemoryCards: loadSuiteRepMemoryCardsMock,
}))

import { POST } from '@/app/api/nic-nac/route'

function requestFor(text: string) {
  return requestForMessages([
    {
      id: 'user-chaos-1',
      role: 'user',
      parts: [{ type: 'text', text }],
    },
  ])
}

function requestForMessages(messages: unknown[]) {
  return new Request('http://localhost/api/nic-nac', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'calendar-chaos-conversation',
      mode: 'workspace',
      messages,
    }),
  })
}

describe('Nic-Nac calendar route chaotic routing smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getPaidNicNacContextMock.mockResolvedValue({
      repId: '11111111-1111-4111-8111-111111111111',
      rep: {
        auth_user_id: 'user-1',
        email: 'chaos-rep@example.com',
      },
      supabase: supabaseMock,
    })
    probeConversationOwnerMock.mockResolvedValue(null)
    loadCanonicalHistoryMock.mockResolvedValue([])
    insertUserMessageMock.mockResolvedValue(undefined)
    reserveAssistantMessageMock.mockResolvedValue(undefined)
    completeAssistantMock.mockResolvedValue(undefined)
    abortAssistantMock.mockResolvedValue(undefined)
    checkpointAssistantMock.mockResolvedValue(undefined)
    recordApprovalEventMock.mockResolvedValue({ replayed: false })
    createAdminClientMock.mockReturnValue(supabaseMock)
    loadSuiteRepMemoryCardsMock.mockResolvedValue([])
    getOrCreateTradeBoardIntakeContextMock.mockResolvedValue({
      sessionBefore: null,
      sessionAfter: null,
      workflowIntents: [],
      toolPolicySource: 'latest_turn_intent',
      workflowPromptState: '',
    })
    getNicNacLanguageModelMock.mockReturnValue({ modelId: 'mock-nic-nac' })
    getNicNacProviderOptionsMock.mockReturnValue(undefined)
    normalizeRunUsageMock.mockReturnValue({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      estimatedCostCents: 0,
    })
    logNicNacRunMock.mockResolvedValue(undefined)
    streamTextMock.mockImplementation((options: {
      onFinish?: (event: { totalUsage: unknown }) => void
    }) => {
      options.onFinish?.({ totalUsage: { inputTokens: 10, outputTokens: 5 } })
      return {
        toUIMessageStream: async function* () {
          yield { type: 'text-start', id: 'text-1' }
          yield {
            type: 'text-delta',
            id: 'text-1',
            delta: 'I found the calendar path and will use the approval dialog.',
          }
          yield { type: 'text-end', id: 'text-1' }
          yield {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
          }
        },
      }
    })
  })

  it.each([
    {
      text: 'ugh i am sick tonight can you just skip whatever live i had',
      expectedIntents: ['show_memory', 'calendar'],
      expectedTools: [
        'prepare_calendar_work',
        'list_my_shows',
        'skip_show_occurrence',
        'cancel_show_series',
        'pause_show_series',
      ],
    },
    {
      text: 'text my people 45 before every show',
      expectedIntents: ['show_memory', 'notification'],
      expectedTools: [
        'prepare_calendar_work',
        'get_notification_preferences',
        'set_notification_preferences',
      ],
    },
    {
      text: 'turn off SMS reminders for tonight but keep email',
      expectedIntents: ['calendar', 'notification'],
      expectedTools: [
        'prepare_calendar_work',
        'list_my_shows',
        'set_show_reminder_override',
      ],
    },
  ])('exposes app-owned calendar tools for chaotic wording: $text', async ({
    text,
    expectedIntents,
    expectedTools,
  }) => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      const response = await POST(requestFor(text))
      await response.text()

      expect(response.status).toBe(200)
      expect(streamTextMock).toHaveBeenCalledOnce()
      const options = streamTextMock.mock.calls[0][0] as {
        system: string
        tools: Record<string, unknown>
      }
      const toolNames = Object.keys(options.tools)

      expect(toolNames).toEqual(expect.arrayContaining(expectedTools))
      expect(options.system).toContain('prepare_calendar_work is read-only')
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'calendar-chaos-conversation',
          intents: expect.arrayContaining(expectedIntents),
          toolNames: expect.arrayContaining(expectedTools),
        }),
      )
    } finally {
      infoSpy.mockRestore()
      logSpy.mockRestore()
    }
  })

  it('keeps calendar write tools active when a rep supplies missing show details on a follow-up', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      const response = await POST(
        requestForMessages([
          {
            id: 'calendar-request',
            role: 'user',
            parts: [
              {
                type: 'text',
                text:
                  'Add BlingKitchen Live to my calendar this Friday at 8pm with code Classy123 for 15% off 3+ items and July Birthday Collection featured.',
              },
            ],
          },
          {
            id: 'assistant-calendar-details',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text:
                  'I have the title, date, time, code, and featured collection. What platform, timezone, and duration should I use?',
              },
            ],
          },
          {
            id: 'calendar-details',
            role: 'user',
            parts: [
              {
                type: 'text',
                text:
                  "It will be on my TikTok Live, and it's Eastern Standard Time for two and a half hours.",
              },
            ],
          },
        ]),
      )
      await response.text()

      expect(response.status).toBe(200)
      expect(streamTextMock).toHaveBeenCalledOnce()
      const options = streamTextMock.mock.calls[0][0] as {
        prepareStep: (input: { steps: unknown[] }) => { toolChoice: unknown }
        tools: Record<string, unknown>
      }
      const toolNames = Object.keys(options.tools)

      expect(toolNames).toEqual(
        expect.arrayContaining(['prepare_calendar_work', 'add_show']),
      )
      expect(options.prepareStep({ steps: [] }).toolChoice).not.toBe('auto')
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'calendar-chaos-conversation',
          intents: expect.arrayContaining(['calendar']),
          toolNames: expect.arrayContaining(['add_show']),
        }),
      )
    } finally {
      infoSpy.mockRestore()
      logSpy.mockRestore()
    }
  })

  it('exposes the recipe draft and save tools through the real chat route', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      const response = await POST(
        requestFor(
          'Add a new Pantry recipe called Chocolate-Dipped Strawberries from these food and recipe-card photos.',
        ),
      )
      await response.text()

      expect(response.status).toBe(200)
      expect(streamTextMock).toHaveBeenCalledOnce()
      const options = streamTextMock.mock.calls[0][0] as {
        system: string
        tools: Record<string, unknown>
      }
      const toolNames = Object.keys(options.tools)

      expect(toolNames).toEqual(
        expect.arrayContaining([
          'build_site_recipe_draft',
          'list_site_recipes',
          'manage_site_recipes',
        ]),
      )
      expect(options.system).toContain('build_site_recipe_draft')
      expect(options.system).toContain(
        'Recipe-card photos are source material',
      )
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'calendar-chaos-conversation',
          intents: expect.arrayContaining(['site']),
          toolNames: expect.arrayContaining([
            'build_site_recipe_draft',
            'manage_site_recipes',
          ]),
        }),
      )
    } finally {
      infoSpy.mockRestore()
      logSpy.mockRestore()
    }
  })

  it('keeps recipe tools available for a photo-only recipe follow-up', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      const response = await POST(
        requestForMessages([
          {
            id: 'recipe-request',
            role: 'user',
            parts: [
              {
                type: 'text',
                text: 'Help me add a new Pantry recipe for Chocolate-Dipped Strawberries.',
              },
            ],
          },
          {
            id: 'assistant-recipe-photos',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text:
                  'Send the food/display photo and the recipe-card photo, then I can build the recipe draft.',
              },
            ],
          },
          {
            id: 'recipe-photos',
            role: 'user',
            parts: [
              {
                type: 'file',
                mediaType: 'image/jpeg',
                url: 'data:image/jpeg;base64,RElTUExBWQ==',
              },
              {
                type: 'file',
                mediaType: 'image/jpeg',
                url: 'data:image/jpeg;base64,Q0FSRA==',
              },
            ],
          },
        ]),
      )
      await response.text()

      expect(response.status).toBe(200)
      expect(streamTextMock).toHaveBeenCalledOnce()
      const options = streamTextMock.mock.calls[0][0] as {
        prepareStep: (input: { steps: unknown[] }) => { toolChoice: unknown }
        tools: Record<string, unknown>
      }
      const toolNames = Object.keys(options.tools)

      expect(toolNames).toEqual(
        expect.arrayContaining([
          'build_site_recipe_draft',
          'manage_site_recipes',
        ]),
      )
      expect(options.prepareStep({ steps: [] }).toolChoice).not.toBe('none')
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'calendar-chaos-conversation',
          intents: expect.arrayContaining(['site']),
          toolNames: expect.arrayContaining(['build_site_recipe_draft']),
        }),
      )
    } finally {
      infoSpy.mockRestore()
      logSpy.mockRestore()
    }
  })

  it('marks provider stream errors as aborted and logs the nested provider message', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    streamTextMock.mockImplementation((options: {
      onError?: (error: unknown) => void
      onFinish?: (event: { totalUsage: unknown }) => void
    }) => {
      options.onError?.({
        error: {
          type: 'error',
          sequence_number: 2,
          error: {
            type: 'insufficient_quota',
            code: 'insufficient_quota',
            message:
              'You exceeded your current quota, please check your plan and billing details.',
            param: null,
          },
        },
      })
      options.onFinish?.({ totalUsage: {} })
      return {
        toUIMessageStream: async function* () {
          yield {
            type: 'finish',
            finishReason: { unified: 'error', raw: undefined },
          }
        },
      }
    })

    try {
      const response = await POST(requestFor('Add a piece to Trade Board'))
      await response.text()

      expect(response.status).toBe(200)
      expect(abortAssistantMock).toHaveBeenCalledWith(
        supabaseMock,
        expect.objectContaining({
          conversationId: 'calendar-chaos-conversation',
          parts: expect.any(Array),
        }),
      )
      expect(completeAssistantMock).not.toHaveBeenCalled()
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'calendar-chaos-conversation',
          status: 'error',
          errorMessage: expect.stringContaining('insufficient_quota'),
        }),
      )
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: expect.stringContaining('exceeded your current quota'),
        }),
      )
    } finally {
      infoSpy.mockRestore()
      logSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })
})
