import { describe, expect, it, vi } from 'vitest'
import { simulateReadableStream, tool, type ToolSet } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { z } from 'zod'
import {
  createNicNacAgent,
  NIC_NAC_AGENT_DEFAULT_MAX_STEPS,
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
    expect(agent.tools).toBe(tools)

    const result = await agent.stream({
      messages: [{ role: 'user', content: 'Hello' }],
      onStepFinish,
    })

    await expect(result.text).resolves.toBe('Ready to help.')
    expect(model.doStreamCalls).toHaveLength(1)
    expect(model.doStreamCalls[0].toolChoice).toEqual({ type: 'auto' })
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
})
