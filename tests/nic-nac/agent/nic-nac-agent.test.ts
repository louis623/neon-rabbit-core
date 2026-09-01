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
})
