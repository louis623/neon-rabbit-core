import type { UIMessageChunk } from 'ai'

export const NIC_NAC_EMPTY_RESPONSE_FALLBACK =
  "I’m sorry—I didn’t produce a response that time. Please send that again."

type ToolOutputRecord = Record<string, unknown>

export type NicNacToolFailure = {
  toolName: string
  errorTier: string
  code: string | null
  stage: string | null
  message: string | null
}

function asRecord(output: unknown): ToolOutputRecord {
  return output && typeof output === 'object'
    ? (output as ToolOutputRecord)
    : {}
}

function readString(record: ToolOutputRecord, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNumber(record: ToolOutputRecord, key: string) {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readRecords(record: ToolOutputRecord, key: string): ToolOutputRecord[] {
  const value = record[key]
  return Array.isArray(value)
    ? value.filter(
        (item): item is ToolOutputRecord =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : []
}

function compactLabel(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact ? compact.slice(0, 160) : fallback
}

function formatMoney(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `$${value.toFixed(2).replace(/\.00$/, '')}`
    : null
}

function summarizeRows(
  intro: string,
  rows: ToolOutputRecord[],
  render: (row: ToolOutputRecord, index: number) => string,
) {
  const visible = rows.slice(0, 5)
  const lines = visible.map(render)
  const remainder = rows.length - visible.length
  return [
    intro,
    ...lines,
    ...(remainder > 0 ? [`…and ${remainder} more.`] : []),
  ].join('\n')
}

function summarizeTradeBoard(record: ToolOutputRecord) {
  const listings = readRecords(record, 'listings')
  const count = readNumber(record, 'count') ?? listings.length
  if (count === 0) return 'Your Dance Floor has no matching dancers right now.'

  const totalMsrp = formatMoney(record.totalMsrp)
  const intro = `Your Dance Floor has ${count} matching ${count === 1 ? 'dancer' : 'dancers'}${
    totalMsrp ? ` with ${totalMsrp} total MSRP` : ''
  }.`
  return summarizeRows(intro, listings, (listing, index) => {
    const name = compactLabel(listing.designName, 'Unnamed dancer')
    const item = compactLabel(listing.itemNumber, 'no item number')
    const quantity = readNumber(listing, 'quantityAvailable')
    const status = compactLabel(listing.status, 'status unavailable').replaceAll('_', ' ')
    return `${index + 1}. ${name} (${item}) — ${status}${
      quantity && quantity > 1 ? `, quantity ${quantity}` : ''
    }.`
  })
}

function summarizeTradeRequests(record: ToolOutputRecord) {
  const requests = readRecords(record, 'requests')
  const count = readNumber(record, 'count') ?? requests.length
  if (count === 0) return 'You don’t have any matching trade requests right now.'

  return summarizeRows(
    `You have ${count} matching trade ${count === 1 ? 'request' : 'requests'}.`,
    requests,
    (request, index) => {
      const listing = asRecord(request.listing)
      const design = asRecord(listing.design)
      const customer = compactLabel(request.customerName, 'A customer')
      const name = compactLabel(design.designName, 'an unnamed dancer')
      const item = compactLabel(design.itemNumber, 'no item number')
      const status = compactLabel(request.status, 'status unavailable')
      return `${index + 1}. ${customer} requested ${name} (${item}) — ${status}.`
    },
  )
}

function summarizeFulfillmentQueue(record: ToolOutputRecord) {
  const queue = readRecords(record, 'queue')
  const count = readNumber(record, 'count') ?? queue.length
  if (count === 0) return 'Your fulfillment queue is clear right now.'

  const needsAttention = readNumber(record, 'needsAttentionCount') ?? 0
  return summarizeRows(
    `Your fulfillment queue has ${count} active ${count === 1 ? 'trade' : 'trades'}${
      needsAttention > 0 ? `; ${needsAttention} need attention` : ''
    }.`,
    queue,
    (item, index) => {
      const customer = compactLabel(item.customerName, 'Customer')
      const name = compactLabel(item.designName, 'Unnamed dancer')
      const status = compactLabel(item.status, 'status unavailable')
      const next = compactLabel(item.suggestedNextAction, 'review').replaceAll('_', ' ')
      return `${index + 1}. ${name} for ${customer} — ${status}; next: ${next}.`
    },
  )
}

function summarizeSwapCleanup(record: ToolOutputRecord) {
  const items = readRecords(record, 'items')
  const count = readNumber(record, 'count') ?? items.length
  if (count === 0) return 'You don’t have any revealed trade swaps waiting for cleanup.'

  return summarizeRows(
    `You have ${count} revealed trade ${count === 1 ? 'swap' : 'swaps'} waiting for cleanup.`,
    items,
    (item, index) => {
      const customer = compactLabel(item.customerName, 'Customer')
      const itemNumber = compactLabel(item.revealedItemNumber, 'item number missing')
      const ringSize = compactLabel(item.revealedRingSize, '')
      const status = compactLabel(item.replacementStatus, 'cleanup needed').replaceAll('_', ' ')
      return `${index + 1}. ${customer}: ${itemNumber}${ringSize ? `, ring size ${ringSize}` : ''} — ${status}.`
    },
  )
}

function summarizeCatalogSearch(record: ToolOutputRecord) {
  const results = readRecords(record, 'results')
  const count = readNumber(record, 'count') ?? results.length
  if (count === 0) return 'I couldn’t find a matching jewelry catalog record.'

  return summarizeRows(
    `I found ${count} matching catalog ${count === 1 ? 'record' : 'records'}.`,
    results,
    (result, index) => {
      const name = compactLabel(result.designName, 'Unnamed design')
      const item = compactLabel(result.itemNumber, 'no item number')
      const msrp = formatMoney(result.msrp)
      const boardStatus = result.isOnMyBoard === true
        ? 'already on your Dance Floor'
        : 'not currently on your Dance Floor'
      return `${index + 1}. ${name} (${item})${msrp ? ` — MSRP ${msrp}` : ''}; ${boardStatus}.`
    },
  )
}

function summarizeTradeHistory(record: ToolOutputRecord) {
  const items = readRecords(record, 'items')
  const count = readNumber(record, 'count') ?? items.length
  if (count === 0) return 'You don’t have any matching completed or denied trade history yet.'

  return summarizeRows(
    `I found ${count} matching past trade ${count === 1 ? 'record' : 'records'}.`,
    items,
    (item, index) => {
      const design = asRecord(item.design)
      const name = compactLabel(design.designName, 'Unnamed dancer')
      const customer = compactLabel(item.customerName, 'Customer')
      const status = compactLabel(item.status, 'status unavailable')
      return `${index + 1}. ${name} with ${customer} — ${status}.`
    },
  )
}

function summarizeShows(record: ToolOutputRecord) {
  const events = readRecords(record, 'events')
  const count = readNumber(record, 'count') ?? events.length
  if (count === 0) return 'You don’t have any matching shows on your Calendar right now.'

  return summarizeRows(
    `I found ${count} matching ${count === 1 ? 'show' : 'shows'} on your Calendar.`,
    events,
    (event, index) => {
      const title = compactLabel(event.title, 'Untitled show')
      const when = compactLabel(event.eventTime, 'time unavailable')
      const platform = compactLabel(event.platform, 'platform unavailable')
      const status = compactLabel(event.status, 'status unavailable')
      return `${index + 1}. ${title} — ${when} on ${platform} (${status}).`
    },
  )
}

export function getNicNacToolFailure(
  toolName: string,
  output: unknown,
): NicNacToolFailure | null {
  const record = asRecord(output)
  if (record.ok !== false) return null

  return {
    toolName,
    errorTier: readString(record, 'errorTier') ?? 'unknown',
    code: readString(record, 'code'),
    stage: readString(record, 'stage'),
    message: readString(record, 'message'),
  }
}

function toolFailureRecoveryText(failure: NicNacToolFailure): string {
  if (failure.message && failure.errorTier === 'explain') return failure.message
  if (failure.toolName === 'prepare_trade_board_work') {
    if (failure.message && /catalog check failed|paused this dancer add/i.test(failure.message)) {
      return failure.message
    }
    return "I couldn’t check the Dance Floor catalog because Sparkle Suite hit a problem. I haven’t changed anything, and the issue has been logged for review."
  }
  if (failure.message && failure.errorTier === 'escalate' && failure.code) {
    return failure.message
  }
  return failure.message ??
    "Sparkle Suite hit a problem while I was checking that. I haven’t changed anything, and the issue has been logged for review."
}

export function getNicNacToolOnlyRecoveryText(
  toolName: string,
  output: unknown,
): string | null {
  const record = asRecord(output)
  const failure = getNicNacToolFailure(toolName, output)
  if (failure) return toolFailureRecoveryText(failure)

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

  if (toolName === 'list_my_trade_board') return summarizeTradeBoard(record)
  if (toolName === 'get_trade_requests') return summarizeTradeRequests(record)
  if (toolName === 'get_fulfillment_queue') return summarizeFulfillmentQueue(record)
  if (toolName === 'get_trade_swap_cleanup') return summarizeSwapCleanup(record)
  if (toolName === 'search_jewelry_database') return summarizeCatalogSearch(record)
  if (toolName === 'get_trade_history') return summarizeTradeHistory(record)
  if (toolName === 'list_my_shows') return summarizeShows(record)

  return null
}

export function getNicNacMandatoryToolFollowUpText(
  toolName: string,
  output: unknown,
): string | null {
  const record = asRecord(output)
  if (
    toolName === 'update_fulfillment_status' &&
    record.status === 'completed' &&
    record.shouldPromptAddToBoard === true
  ) {
    return 'Fulfillment is complete. Want to add the dancer you received to your Dance Floor now?'
  }
  return null
}

export function isRenderableNicNacStreamChunk(chunk: UIMessageChunk) {
  if (chunk.type === 'text-delta') return /\S/.test(chunk.delta)
  if (chunk.type === 'tool-approval-request') return true
  return chunk.type === 'data-trade-request-card'
}
