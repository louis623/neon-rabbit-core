const REDACTED = '[redacted]'
const MAX_DEPTH = 4
const MAX_OBJECT_KEYS = 50
const MAX_ARRAY_ITEMS = 20
const MAX_STRING_LENGTH = 200
const MAX_TOTAL_NODES = 50

const sensitiveKeyPattern = /(?:password|passcode|credential|token|secret|cookie|authorization|authcode|api.?key|live.?queue.?code|payment|stripe|card|bank|routing|account.?number|provider.?id|message.?body|raw.?body|customer.?list|private.?link|refresh|bearer|ssn|social.?security)/i
const personalKeyPattern = /(?:email|phone|address|customer.?name|first.?name|last.?name|birth|contact)/i

function safeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 100)
}

function sanitize(value: unknown, key: string, depth: number, budget: { remaining: number }): unknown {
  if (budget.remaining <= 0) return '[truncated]'
  budget.remaining -= 1
  if (sensitiveKeyPattern.test(key) || personalKeyPattern.test(key)) return REDACTED
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH)
  if (depth >= MAX_DEPTH) return '[truncated]'
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitize(item, key, depth + 1, budget))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, MAX_OBJECT_KEYS)
        .map(([childKey, childValue]) => [safeKey(childKey), sanitize(childValue, childKey, depth + 1, budget)]),
    )
  }
  return String(value).slice(0, MAX_STRING_LENGTH)
}

export function redactOperatorSupportSafeDiff(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return sanitize(value, '', 0, { remaining: MAX_TOTAL_NODES }) as Record<string, unknown>
}

export function buildOperatorSupportSafeDiff(input: {
  changedFields: readonly string[]
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}) {
  const changedFields = [...new Set(input.changedFields)]
    .map(safeKey)
    .filter(Boolean)
    .slice(0, MAX_OBJECT_KEYS)
  return redactOperatorSupportSafeDiff({
    changedFields,
    ...(input.before ? { before: input.before } : {}),
    ...(input.after ? { after: input.after } : {}),
  })
}

export const operatorSupportRedactedMarker = REDACTED

const unsafeCustomerTextPattern =
  /(?:password|passcode|bearer\s+|api[ _-]?key|access[ _-]?token|refresh[ _-]?token|live[ _-]?queue[ _-]?code|credit[ _-]?card|routing[ _-]?number|account[ _-]?number|stripe[ _-]?(?:customer|payment|subscription)[ _-]?id)/i

export function assertOperatorSupportCustomerSafeText(
  value: string | null | undefined,
  label: string,
) {
  if (value && unsafeCustomerTextPattern.test(value)) {
    throw new Error(
      `${label} cannot include credentials, payment details, provider IDs, or private access codes.`,
    )
  }
}
