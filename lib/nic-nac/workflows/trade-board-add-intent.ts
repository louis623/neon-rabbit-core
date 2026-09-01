const TRADE_BOARD_TARGET = /\b(?:dance\s*floor|trade\s*board|board)\b/i
const OTHER_PRODUCT_TARGET =
  /\b(?:calendar|show|live\s*queue|message\s*center|site|website|customer)\b/i

const DIRECT_PLACEMENT =
  /\b(?:add|put|place|post)\b[\s\S]{0,100}\b(?:dance\s*floor|trade\s*board|board|listing|dancer|piece|item|jewelry)\b/i

const EXPLICIT_LIST_PLACEMENT =
  /\blist\b[\s\S]{0,80}\b(?:this|a|another|the)\s+(?:jewelry|piece|dancer|item)\b[\s\S]{0,80}\b(?:on|to|onto)\b[\s\S]{0,30}\b(?:dance\s*floor|trade\s*board|board)\b/i

export function isExplicitTradeBoardAddRequest(text: string): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  if (EXPLICIT_LIST_PLACEMENT.test(normalized)) return true
  if (!DIRECT_PLACEMENT.test(normalized)) return false

  return (
    TRADE_BOARD_TARGET.test(normalized) ||
    !OTHER_PRODUCT_TARGET.test(normalized)
  )
}
