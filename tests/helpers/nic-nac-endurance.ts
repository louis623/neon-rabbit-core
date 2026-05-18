import type { UIMessage } from 'ai'
import { selectMessagesForModel } from '@/lib/nic-nac/model-context'
import { evaluateNicNacRunThresholds } from '@/lib/nic-nac/run-thresholds'
import { buildNicNacRolloverMessages } from '@/lib/nic-nac/rollover'

export type NicNacEnduranceSimulationOptions = {
  hours: number
  turnEveryMinutes: number
  userChars: number
  assistantChars: number
}

export type NicNacEnduranceSimulationResult = {
  runs: number
  rollovers: Array<{
    run: number
    carriedMessageCount: number
    carriedMessageIds: string[]
    reasons: string[]
  }>
  maxEstimatedTokens: number
  maxModelMessages: number
  finalConversationMessages: UIMessage[]
}

function repeatedText(prefix: string, index: number, length: number) {
  return `${prefix} ${index}: ${'x'.repeat(Math.max(0, length))}`
}

function syntheticMessage(
  id: string,
  role: 'user' | 'assistant',
  text: string,
): UIMessage {
  return {
    id,
    role,
    parts: [{ type: 'text', text }],
  }
}

export function simulateNicNacEndurance(
  options: NicNacEnduranceSimulationOptions,
): NicNacEnduranceSimulationResult {
  const runs = Math.floor((options.hours * 60) / options.turnEveryMinutes)
  let messages: UIMessage[] = []
  const rollovers: NicNacEnduranceSimulationResult['rollovers'] = []
  let maxEstimatedTokens = 0
  let maxModelMessages = 0

  for (let run = 0; run < runs; run++) {
    messages.push(
      syntheticMessage(
        `u-${run}`,
        'user',
        repeatedText('show turn', run, options.userChars),
      ),
      syntheticMessage(
        `a-${run}`,
        'assistant',
        repeatedText('show note', run, options.assistantChars),
      ),
    )

    const context = selectMessagesForModel(messages)
    maxEstimatedTokens = Math.max(maxEstimatedTokens, context.estimatedTokens)
    maxModelMessages = Math.max(maxModelMessages, context.messages.length)

    const thresholds = evaluateNicNacRunThresholds({
      latencyMs: 1_200,
      inputTokens: context.estimatedTokens,
      totalTokens: context.estimatedTokens + 200,
      estimatedContextTokens: context.estimatedTokens,
      contextCompacted: context.wasCompacted,
      droppedMessageCount: context.droppedMessageCount,
    })

    if (thresholds.rolloverRecommended) {
      const carried = buildNicNacRolloverMessages(messages)
      rollovers.push({
        run,
        carriedMessageCount: carried.length,
        carriedMessageIds: carried.map((message) => message.id),
        reasons: thresholds.reasons,
      })
      messages = carried
    }
  }

  return {
    runs,
    rollovers,
    maxEstimatedTokens,
    maxModelMessages,
    finalConversationMessages: messages,
  }
}
