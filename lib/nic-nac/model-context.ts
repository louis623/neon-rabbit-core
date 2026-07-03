import type { UIMessage } from 'ai'

export type ModelContextOptions = {
  maxEstimatedTokens?: number
  maxMessages?: number
}

export type ModelContextSelection = {
  messages: UIMessage[]
  wasCompacted: boolean
  droppedMessageCount: number
  estimatedTokens: number
}

const DEFAULT_MAX_ESTIMATED_TOKENS = 18_000
const DEFAULT_MAX_MESSAGES = 32
const CHARS_PER_TOKEN = 4

export function selectMessagesForModel(
  messages: UIMessage[],
  options: ModelContextOptions = {},
): ModelContextSelection {
  const maxEstimatedTokens =
    options.maxEstimatedTokens ?? DEFAULT_MAX_ESTIMATED_TOKENS
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES

  if (messages.length === 0) {
    return {
      messages: [],
      wasCompacted: false,
      droppedMessageCount: 0,
      estimatedTokens: 0,
    }
  }

  const selected: UIMessage[] = []
  let estimatedTokens = 0

  for (let index = messages.length - 1; index >= 0; index--) {
    if (selected.length >= maxMessages) break
    const message = messages[index]
    const messageTokens = estimateMessageTokens(message)
    if (
      selected.length > 0 &&
      estimatedTokens + messageTokens > maxEstimatedTokens
    ) {
      break
    }
    selected.unshift(message)
    estimatedTokens += messageTokens
  }

  const messagesForModel = stripHistoricalOutputlessApprovalParts(selected)
  const wasCompacted = messagesForModel.length < messages.length
  return {
    messages: messagesForModel,
    wasCompacted,
    droppedMessageCount: messages.length - messagesForModel.length,
    estimatedTokens,
  }
}

function stripHistoricalOutputlessApprovalParts(messages: UIMessage[]): UIMessage[] {
  return messages.flatMap((message, index) => {
    if (message.role !== 'assistant') return [message]

    // HITL resume posts end with the assistant message that contains the
    // approval response. That last assistant turn must be left intact so the
    // SDK can execute the approved/denied tool.
    if (index === messages.length - 1) return [message]

    const parts = message.parts ?? []
    const nextParts = parts.filter((part) => !isOutputlessApprovalToolPart(part))
    if (nextParts.length === parts.length) return [message]
    if (nextParts.length === 0 || !nextParts.some(isModelRelevantPart)) return []
    return [{ ...message, parts: nextParts as UIMessage['parts'] }]
  })
}

function isOutputlessApprovalToolPart(part: UIMessage['parts'][number]): boolean {
  const p = part as {
    type?: string
    state?: string
    output?: unknown
    approval?: { id?: string }
  }
  return (
    p.type?.startsWith('tool-') === true &&
    p.approval?.id != null &&
    p.output === undefined &&
    (p.state === 'approval-requested' || p.state === 'approval-responded')
  )
}

function isModelRelevantPart(part: UIMessage['parts'][number]): boolean {
  return (part as { type?: string }).type !== 'step-start'
}

function estimateMessageTokens(message: UIMessage): number {
  const textChars = (message.parts ?? []).reduce((sum, part) => {
    const p = part as { text?: unknown; url?: unknown; input?: unknown; output?: unknown }
    let next = sum
    if (typeof p.text === 'string') next += p.text.length
    if (typeof p.url === 'string') next += 200
    if (p.input !== undefined) next += safeJsonLength(p.input)
    if (p.output !== undefined) next += safeJsonLength(p.output)
    return next
  }, 0)

  return Math.max(1, Math.ceil((textChars + 80) / CHARS_PER_TOKEN))
}

function safeJsonLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0
  } catch {
    return 0
  }
}
