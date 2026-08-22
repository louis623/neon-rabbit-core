export const NIC_NAC_TRADE_TERMS = [
  'trade',
  'tradeboard',
  'dance floor',
  'dancers',
  'shipping',
  'ship',
  'lesser value',
  'lower value',
  'higher value',
  'equal-value',
  'equal value',
  'fair',
  'items can be traded',
  'what items',
  'settle trade disputes',
  'trade disputes',
  'approve this trade',
  'pay the difference',
  'msrp decide',
  'msrp decides',
] as const

export function normalizeNicNacTradeTerms(input: string) {
  return input
    .toLowerCase()
    .replaceAll('dance floor', 'tradeboard')
    .replaceAll('dancers', 'trade listing')
}
