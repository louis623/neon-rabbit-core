import type { UIMessageChunk } from 'ai'

export const NIC_NAC_EMPTY_RESPONSE_FALLBACK =
  "I’m sorry—I didn’t produce a response that time. Please send that again."

type ToolOutputRecord = Record<string, unknown>

function asRecord(output: unknown): ToolOutputRecord {
  return output && typeof output === 'object'
    ? (output as ToolOutputRecord)
    : {}
}

function readString(record: ToolOutputRecord, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function getNicNacToolOnlyRecoveryText(
  toolName: string,
  output: unknown,
): string | null {
  const record = asRecord(output)

  if (toolName === 'prepare_trade_board_work') {
    const nextQuestion = readString(record, 'nextQuestion')
    if (nextQuestion) return nextQuestion

    const missing = Array.isArray(record.requiredBeforeAction)
      ? record.requiredBeforeAction.filter(
          (field): field is string => typeof field === 'string',
        )
      : []
    if (missing.includes('ringSize') && missing.length === 1) {
      return 'What ring size is this physical piece?'
    }
    if (
      missing.some((field) =>
        ['itemNumber', 'designName', 'collectionName', 'jewelryFrontPhoto'].includes(
          field,
        ),
      )
    ) {
      return 'I can help add that dancer. Send the item number or a readable label/details photo, plus a clear customer-facing photo of the jewelry, and I’ll finish the Dance Floor listing.'
    }
    return 'I can help with that Dance Floor piece. Send the item number, a label/details photo, or a short description so I can check the jewelry database first.'
  }

  if (toolName === 'prepare_calendar_work') {
    const intent = readString(record, 'intent')
    if (intent === 'add_show') {
      return 'I can add that show. What title, date and start time (including the time zone), and streaming platform should I use?'
    }
    return 'I can help with that Calendar request. Which show and date or schedule should I use?'
  }

  return null
}

export function isRenderableNicNacStreamChunk(chunk: UIMessageChunk) {
  if (chunk.type === 'text-delta') return /\S/.test(chunk.delta)
  if (chunk.type === 'tool-approval-request') return true
  return chunk.type === 'data-trade-request-card'
}
