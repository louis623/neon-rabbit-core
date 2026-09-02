import { describe, expect, it, vi } from 'vitest'
import { simulateReadableStream, tool, type ToolSet } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { z } from 'zod'
import {
  createNicNacAgent,
  NIC_NAC_AGENT_DEFAULT_MAX_OUTPUT_TOKENS,
  NIC_NAC_AGENT_DEFAULT_MAX_RETRIES,
  NIC_NAC_AGENT_DEFAULT_MAX_STEPS,
  NIC_NAC_AGENT_DEFAULT_TIMEOUT,
  NIC_NAC_AGENT_HARD_MAX_STEPS,
} from '@/lib/nic-nac/agent/nic-nac-agent'

function streamedTextModel() {
  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 'text-1' },
          { type: 'text-delta', id: 'text-1', delta: 'Ready to help.' },
          { type: 'text-end', id: 'text-1' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            logprobs: undefined,
            usage: {
              inputTokens: {
                total: 3,
                noCache: 3,
                cacheRead: undefined,
                cacheWrite: undefined,
              },
              outputTokens: {
                total: 4,
                text: 4,
                reasoning: undefined,
              },
            },
          },
        ],
      }),
    }),
  })
}

const ZERO_USAGE = {
  inputTokens: {
    total: 1,
    noCache: 1,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: {
    total: 1,
    text: 1,
    reasoning: undefined,
  },
}

describe('Nic-Nac ToolLoopAgent factory', () => {
  it('provides the route-facing stream seam with model-selected tools', async () => {
    const model = streamedTextModel()
    const onFinish = vi.fn()
    const onStepFinish = vi.fn()
    const tools = {
      readCalendar: tool({
        description: 'Read the current calendar.',
        inputSchema: z.object({}),
        execute: async () => ({ shows: [] }),
      }),
    } satisfies ToolSet
    const agent = createNicNacAgent({
      model,
      instructions: 'Act like a capable employee.',
      tools,
      onFinish,
    })

    expect(agent.id).toBe('nic-nac-workspace-agent')
    expect(agent.toolChoice).toBe('auto')
    expect(agent.maxSteps).toBe(NIC_NAC_AGENT_DEFAULT_MAX_STEPS)
    expect(agent.maxOutputTokens).toBe(NIC_NAC_AGENT_DEFAULT_MAX_OUTPUT_TOKENS)
    expect(agent.maxRetries).toBe(NIC_NAC_AGENT_DEFAULT_MAX_RETRIES)
    expect(agent.timeout).toEqual(NIC_NAC_AGENT_DEFAULT_TIMEOUT)
    expect(agent.tools).toBe(tools)

    const result = await agent.stream({
      messages: [{ role: 'user', content: 'Hello' }],
      onStepFinish,
    })

    await expect(result.text).resolves.toBe('Ready to help.')
    expect(model.doStreamCalls).toHaveLength(1)
    expect(model.doStreamCalls[0].toolChoice).toEqual({ type: 'auto' })
    expect(model.doStreamCalls[0].maxOutputTokens).toBe(
      NIC_NAC_AGENT_DEFAULT_MAX_OUTPUT_TOKENS,
    )
    expect(onStepFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('hard-bounds requested loop steps and rejects invalid limits', () => {
    const model = streamedTextModel()

    expect(
      createNicNacAgent({
        model,
        instructions: 'test',
        tools: {},
        maxSteps: 99,
      }).maxSteps,
    ).toBe(NIC_NAC_AGENT_HARD_MAX_STEPS)

    expect(() =>
      createNicNacAgent({
        model,
        instructions: 'test',
        tools: {},
        maxSteps: 0,
      }),
    ).toThrow('maxSteps must be a positive integer')

    expect(() =>
      createNicNacAgent({
        model,
        instructions: 'test',
        tools: {},
        maxOutputTokens: 0,
      }),
    ).toThrow('maxOutputTokens must be a positive integer')

    expect(() =>
      createNicNacAgent({
        model,
        instructions: 'test',
        tools: {},
        maxRetries: -1,
      }),
    ).toThrow('maxRetries must be a non-negative integer')
  })

  it('can choose different tools on consecutive steps and finish naturally', async () => {
    let modelStep = 0
    const executions: string[] = []
    const model = new MockLanguageModelV3({
      doStream: async () => {
        modelStep += 1
        if (modelStep === 1) {
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: 'tool-call',
                  toolCallId: 'read-calendar-1',
                  toolName: 'list_my_shows',
                  input: '{}',
                },
                {
                  type: 'finish',
                  finishReason: { unified: 'tool-calls', raw: undefined },
                  usage: ZERO_USAGE,
                },
              ],
            }),
          }
        }
        if (modelStep === 2) {
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: 'tool-call',
                  toolCallId: 'add-calendar-1',
                  toolName: 'add_show',
                  input: JSON.stringify({ title: 'Bunny Ears Live' }),
                },
                {
                  type: 'finish',
                  finishReason: { unified: 'tool-calls', raw: undefined },
                  usage: ZERO_USAGE,
                },
              ],
            }),
          }
        }
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 'final-text' },
              {
                type: 'text-delta',
                id: 'final-text',
                delta: 'Done — Bunny Ears Live is on the calendar.',
              },
              { type: 'text-end', id: 'final-text' },
              {
                type: 'finish',
                finishReason: { unified: 'stop', raw: undefined },
                usage: ZERO_USAGE,
              },
            ],
          }),
        }
      },
    })
    const agent = createNicNacAgent({
      model,
      instructions: 'Use the tools needed to finish the current request.',
      tools: {
        list_my_shows: tool({
          description: 'Read the current calendar.',
          inputSchema: z.object({}),
          execute: async () => {
            executions.push('list_my_shows')
            return { count: 0, events: [] }
          },
        }),
        add_show: tool({
          description: 'Add a show to the calendar.',
          inputSchema: z.object({ title: z.string() }),
          execute: async ({ title }) => {
            executions.push('add_show')
            return { event: { title } }
          },
        }),
      },
    })

    const result = await agent.stream({
      messages: [
        {
          role: 'user',
          content:
            'Check tonight, then add Bunny Ears Live if the calendar is empty.',
        },
      ],
    })

    await expect(result.text).resolves.toBe(
      'Done — Bunny Ears Live is on the calendar.',
    )
    expect(executions).toEqual(['list_my_shows', 'add_show'])
    expect(model.doStreamCalls).toHaveLength(3)
    expect(model.doStreamCalls.map((call) => call.toolChoice)).toEqual([
      { type: 'auto' },
      { type: 'auto' },
      { type: 'auto' },
    ])
  })

  it('replays an empty Calendar read then naturally collects the missing platform and adds the show', async () => {
    const script: Array<
      | { toolName: string; input: Record<string, unknown> }
      | { text: string }
    > = [
      { toolName: 'list_my_shows', input: { upcoming: true } },
      { text: 'You do not have any shows on your Calendar tonight.' },
      { text: 'Absolutely. What platform should I put the show on?' },
      {
        toolName: 'add_show',
        input: {
          platform: 'TikTok',
          eventTime: '2099-09-02T23:00:00.000Z',
          timeZone: 'America/New_York',
          title: 'Bunny Ears Live',
          discountCodes: [{ code: 'AWESOME', description: '10% off' }],
          featuredCollections: ['Bunny Ears'],
        },
      },
      { text: 'Done — Bunny Ears Live is on your Calendar tonight at 7 p.m. Eastern.' },
    ]
    let scriptIndex = 0
    const listExecutions: Array<Record<string, unknown>> = []
    const addExecutions: Array<Record<string, unknown>> = []
    const model = new MockLanguageModelV3({
      doStream: async () => {
        const step = script[scriptIndex++]
        if (!step) throw new Error('Unexpected extra model step')
        if ('toolName' in step) {
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: 'tool-call',
                  toolCallId: `calendar-replay-${scriptIndex}`,
                  toolName: step.toolName,
                  input: JSON.stringify(step.input),
                },
                {
                  type: 'finish',
                  finishReason: { unified: 'tool-calls', raw: undefined },
                  usage: ZERO_USAGE,
                },
              ],
            }),
          }
        }
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: `calendar-text-${scriptIndex}` },
              {
                type: 'text-delta',
                id: `calendar-text-${scriptIndex}`,
                delta: step.text,
              },
              { type: 'text-end', id: `calendar-text-${scriptIndex}` },
              {
                type: 'finish',
                finishReason: { unified: 'stop', raw: undefined },
                usage: ZERO_USAGE,
              },
            ],
          }),
        }
      },
    })
    const tools = {
      list_my_shows: tool({
        description: 'Read the rep’s Calendar.',
        inputSchema: z.object({ upcoming: z.boolean().optional() }),
        execute: async (input) => {
          listExecutions.push(input)
          return { count: 0, events: [] }
        },
      }),
      add_show: tool({
        description: 'Put a new show on the rep’s Calendar.',
        inputSchema: z.object({
          platform: z.string(),
          eventTime: z.string(),
          timeZone: z.string(),
          title: z.string(),
          discountCodes: z.array(
            z.object({ code: z.string(), description: z.string() }),
          ),
          featuredCollections: z.array(z.string()),
        }),
        execute: async (input) => {
          addExecutions.push(input)
          return { count: 1, event: input }
        },
      }),
      search_work_knowledge: tool({
        description: 'Answer grounded live-show questions.',
        inputSchema: z.object({ query: z.string() }),
        execute: async () => ({ results: [] }),
      }),
    } satisfies ToolSet
    const agent = createNicNacAgent({
      model,
      instructions:
        'The latest request wins. Ask only for a material missing fact, then use the appropriate tool.',
      tools,
    })
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    messages.push({ role: 'user', content: 'Do I have any shows on my Calendar?' })
    const readResult = await agent.stream({ messages: [...messages] })
    const readText = await readResult.text
    messages.push({ role: 'assistant', content: readText })

    messages.push({
      role: 'user',
      content:
        'Cool, add a show tonight at 7 p.m. Eastern. Discount code AWESOME is 10% off, and the collection is Bunny Ears.',
    })
    const clarificationResult = await agent.stream({ messages: [...messages] })
    const clarificationText = await clarificationResult.text
    messages.push({ role: 'assistant', content: clarificationText })

    messages.push({ role: 'user', content: 'TikTok.' })
    const addResult = await agent.stream({ messages: [...messages] })
    const addText = await addResult.text

    expect(readText).toContain('do not have any shows')
    expect(clarificationText).toBe('Absolutely. What platform should I put the show on?')
    expect(clarificationText).not.toMatch(/do not have|no shows/i)
    expect(addText).toContain('Bunny Ears Live is on your Calendar')
    expect(listExecutions).toHaveLength(1)
    expect(addExecutions).toEqual([
      expect.objectContaining({
        platform: 'TikTok',
        timeZone: 'America/New_York',
        discountCodes: [{ code: 'AWESOME', description: '10% off' }],
        featuredCollections: ['Bunny Ears'],
      }),
    ])
    expect(model.doStreamCalls).toHaveLength(5)
    expect(model.doStreamCalls.every((call) => call.toolChoice?.type === 'auto')).toBe(true)
    expect(model.doStreamCalls.length).toBeLessThanOrEqual(
      NIC_NAC_AGENT_DEFAULT_MAX_STEPS,
    )
  })

  it('keeps the full catalog available while a conversation switches workflows between turns', async () => {
    const executions: string[] = []
    const script: Array<
      | { toolName: string; input: Record<string, unknown> }
      | { text: string }
    > = [
      { toolName: 'list_my_shows', input: {} },
      { text: 'Your Calendar is clear tonight.' },
      { toolName: 'list_my_trade_board', input: {} },
      { text: 'You have three dancers on the Dance Floor.' },
      { toolName: 'search_work_knowledge', input: { query: 'live opening' } },
      { text: 'Start with a short welcome and preview the collection.' },
      {
        toolName: 'add_show',
        input: { title: 'Bunny Ears Live', eventTime: '2026-09-01T23:00:00Z' },
      },
      { text: 'Done — Bunny Ears Live is on your Calendar.' },
    ]
    let scriptIndex = 0
    const model = new MockLanguageModelV3({
      doStream: async () => {
        const step = script[scriptIndex++]
        if (!step) throw new Error('Unexpected extra model step')
        if ('toolName' in step) {
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: 'tool-call',
                  toolCallId: `tool-${scriptIndex}`,
                  toolName: step.toolName,
                  input: JSON.stringify(step.input),
                },
                {
                  type: 'finish',
                  finishReason: { unified: 'tool-calls', raw: undefined },
                  usage: ZERO_USAGE,
                },
              ],
            }),
          }
        }
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: `text-${scriptIndex}` },
              {
                type: 'text-delta',
                id: `text-${scriptIndex}`,
                delta: step.text,
              },
              { type: 'text-end', id: `text-${scriptIndex}` },
              {
                type: 'finish',
                finishReason: { unified: 'stop', raw: undefined },
                usage: ZERO_USAGE,
              },
            ],
          }),
        }
      },
    })
    const tools = {
      list_my_shows: tool({
        description: 'Direct Calendar read.',
        inputSchema: z.object({}),
        execute: async () => {
          executions.push('list_my_shows')
          return { events: [] }
        },
      }),
      list_my_trade_board: tool({
        description: 'Direct Dance Floor read.',
        inputSchema: z.object({}),
        execute: async () => {
          executions.push('list_my_trade_board')
          return { listings: [{}, {}, {}] }
        },
      }),
      search_work_knowledge: tool({
        description: 'Search grounded work knowledge.',
        inputSchema: z.object({ query: z.string() }),
        execute: async () => {
          executions.push('search_work_knowledge')
          return { results: [{ answer: 'Open with a welcome.' }] }
        },
      }),
      add_show: tool({
        description: 'Add a show after an explicit scheduling request.',
        inputSchema: z.object({
          title: z.string(),
          eventTime: z.string(),
        }),
        execute: async ({ title, eventTime }) => {
          executions.push('add_show')
          return { event: { title, eventTime } }
        },
      }),
    } satisfies ToolSet
    const agent = createNicNacAgent({
      model,
      instructions: 'Follow the latest request and choose from the full catalog.',
      tools,
    })
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    const turns = [
      ['What shows do I have tonight?', 'Your Calendar is clear tonight.'],
      ['Switch tasks. What is on my Dance Floor?', 'You have three dancers on the Dance Floor.'],
      ['Pause that. How should I open tonight\'s live?', 'Start with a short welcome and preview the collection.'],
      ['Now add Bunny Ears Live tonight at 7 Eastern.', 'Done — Bunny Ears Live is on your Calendar.'],
    ] as const

    for (const [userText, expectedText] of turns) {
      messages.push({ role: 'user', content: userText })
      const result = await agent.stream({ messages: [...messages] })
      await expect(result.text).resolves.toBe(expectedText)
      messages.push({ role: 'assistant', content: expectedText })
    }

    expect(executions).toEqual([
      'list_my_shows',
      'list_my_trade_board',
      'search_work_knowledge',
      'add_show',
    ])
    expect(model.doStreamCalls).toHaveLength(8)
    expect(model.doStreamCalls.every((call) => call.toolChoice?.type === 'auto')).toBe(true)
    const expectedToolNames = Object.keys(tools).sort()
    for (const call of model.doStreamCalls) {
      expect((call.tools ?? []).map((candidate) => candidate.name).sort()).toEqual(
        expectedToolNames,
      )
    }
  })

  it('executes a canonically approved tool and returns to model reasoning for follow-up work', async () => {
    const executions: string[] = []
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: 'text-start', id: 'approved-final' },
            {
              type: 'text-delta',
              id: 'approved-final',
              delta:
                'The show is cancelled. I also checked the remaining task and it is ready.',
            },
            { type: 'text-end', id: 'approved-final' },
            {
              type: 'finish',
              finishReason: { unified: 'stop', raw: undefined },
              usage: ZERO_USAGE,
            },
          ],
        }),
      }),
    })
    const agent = createNicNacAgent({
      model,
      instructions: 'Continue reasoning after approved tools execute.',
      tools: {
        cancel_show: tool({
          description: 'Cancel the selected show after approval.',
          inputSchema: z.object({ eventId: z.string() }),
          needsApproval: true,
          execute: async ({ eventId }) => {
            executions.push(`cancel_show:${eventId}`)
            return { event: { id: eventId, status: 'cancelled' } }
          },
        }),
        list_my_shows: tool({
          description: 'Read remaining shows when needed.',
          inputSchema: z.object({}),
          execute: async () => ({ events: [] }),
        }),
      },
    })

    const result = await agent.stream({
      messages: [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'cancel-call-1',
              toolName: 'cancel_show',
              input: { eventId: 'synthetic-event-1' },
            },
            {
              type: 'tool-approval-request',
              approvalId: 'approval-1',
              toolCallId: 'cancel-call-1',
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-approval-response',
              approvalId: 'approval-1',
              approved: true,
            },
          ],
        },
      ],
    })

    await expect(result.text).resolves.toContain('show is cancelled')
    expect(executions).toEqual(['cancel_show:synthetic-event-1'])
    expect(model.doStreamCalls).toHaveLength(1)
    expect(model.doStreamCalls[0].toolChoice).toEqual({ type: 'auto' })
    expect(
      model.doStreamCalls[0].prompt.some(
        (message) =>
          message.role === 'tool' &&
          Array.isArray(message.content) &&
          message.content.some(
            (part) =>
              part.type === 'tool-result' &&
              part.toolCallId === 'cancel-call-1',
          ),
      ),
    ).toBe(true)
  })
})
