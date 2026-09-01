import type { TradeBoardIntakeSessionState } from './trade-board-intake-types'
import { isExplicitTradeBoardAddRequest } from './trade-board-add-intent'

export const TRADE_BOARD_GUIDED_START_RESPONSE =
  'Absolutely—let’s add a dancer to your Dance Floor. You can start in any of these three ways:\n\n' +
  '1. Type the item number.\n' +
  '2. Upload a clear photo of the item-info tag or label.\n' +
  '3. Tell me you don’t have an item number.'

const CONFIRMED_NO_ITEM_NUMBER =
  /\b(?:i\s+)?(?:do\s+not|don['’]?t|dont|no)\s+(?:have|got|know)[\s\S]{0,30}\bitem\s*(?:number|#)\b/i

export function shouldUseTradeBoardGuidedStart(args: {
  latestUserText: string
  workflow: TradeBoardIntakeSessionState | null | undefined
}): boolean {
  const { workflow } = args
  if (!workflow || workflow.status !== 'active') return false
  if (!['started', 'details_capture'].includes(workflow.phase)) return false
  if (workflow.photos.length > 0 || Object.keys(workflow.known).length > 0) return false

  const text = args.latestUserText.trim()
  if (!text || CONFIRMED_NO_ITEM_NUMBER.test(text)) return false
  return isExplicitTradeBoardAddRequest(text)
}
