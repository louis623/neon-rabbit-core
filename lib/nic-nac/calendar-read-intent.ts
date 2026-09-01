const CALENDAR_MUTATION_PATTERNS = [
  /\b(?:add|create|schedule|set up|put)\b[\s\S]{0,100}\b(?:show|live|event)\b/i,
  /\b(?:move|change|update|edit|replace|cancel|delete|remove|skip|pause|suspend)\b[\s\S]{0,100}\b(?:show|live|event|calendar|schedule)\b/i,
  /\b(?:remind|notify|text|sms|email)\b[\s\S]{0,100}\b(?:customer|people|audience|show|live|event)\b/i,
]

const CALENDAR_READ_PATTERNS = [
  /\bdo i have\b[\s\S]{0,100}\b(?:anything|shows?|lives?|events?|something)\b[\s\S]{0,80}\b(?:calendar|schedule|scheduled|today|tonight|tomorrow|week|month|right now)\b/i,
  /\bdo i have\b[\s\S]{0,80}\b(?:anything scheduled|a show|a live|an event)\b/i,
  /\b(?:what(?:'s| is)?|which|when|how many|show me|list|check|tell me)\b[\s\S]{0,100}\b(?:calendar|schedule|scheduled|shows?|lives?|events?)\b/i,
  /\b(?:calendar|schedule)\b[\s\S]{0,80}\b(?:right now|today|tonight|tomorrow|this week|next week|this month|coming up|look like|on it)\b/i,
  /\bwhen(?:'s| is)\b[\s\S]{0,50}\bnext\b[\s\S]{0,30}\b(?:show|live|event)\b/i,
  /\bam i\b[\s\S]{0,40}\b(?:scheduled|going live|live)\b[\s\S]{0,50}\b(?:today|tonight|tomorrow|this week|next week|on\s+\w+)\b/i,
  /\bwhat(?:'s| is)\b[\s\S]{0,30}\bcoming up\b/i,
]

/**
 * Identifies factual reads of the rep's own Calendar. This stays separate from
 * the general keyword router so read questions can be pinned to list_my_shows
 * instead of entering the write-oriented calendar preflight.
 */
export function isCalendarReadQueryText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return false
  if (CALENDAR_MUTATION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false
  }
  return CALENDAR_READ_PATTERNS.some((pattern) => pattern.test(normalized))
}
