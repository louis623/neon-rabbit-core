export const REDACTED_UNSAFE_MEMORY_SUMMARY =
  '[Redacted unsafe memory note: possible prompt-injection instructions.]'

const UNSAFE_MEMORY_PATTERNS = [
  /\bignore\s+(?:all\s+)?(?:prior|previous)\s+instructions?\b/i,
  /\byou\s+are\s+now\b/i,
  /\badmin\s+mode\b/i,
  /\bcall\s+[a-z_]+/i,
  /\bdo\s+not\s+ask\s+for\s+confirmation\b/i,
  /\bprint\s+the\s+contents?\b/i,
  /\blist\s+the\s+trade\s+board\s+for\s+rep\b/i,
]

export function isUnsafeNicNacMemoryText(summary: string): boolean {
  return UNSAFE_MEMORY_PATTERNS.some((pattern) => pattern.test(summary))
}
