import type {
  TradeRequestNotificationSummary,
  TradeRequestStatus,
} from '@/lib/services/types'

export type TradeRequestCardData = {
  requestId: string
  status?: TradeRequestStatus
  customerName: string
  requestedItem: {
    itemNumber: string
    designName: string
    typePrefix: string
    collectionName: string | null
    bpMsrp: number | null
  }
  offeredText: string
  ruleCheck: {
    status: 'needs_review'
    label: string
    description: string
  }
}

export type TradeRequestCardPart = {
  type: 'data-trade-request-card'
  data: TradeRequestCardData
}

export function buildTradeRequestCardPart(
  summary: TradeRequestNotificationSummary,
): TradeRequestCardPart {
  const comparisonTarget = summary.listing.collectionName
    ? `${summary.listing.typePrefix} / ${summary.listing.collectionName}`
    : summary.listing.typePrefix

  return {
    type: 'data-trade-request-card',
    data: {
      requestId: summary.requestId,
      status: 'pending',
      customerName: summary.customerName,
      requestedItem: {
        itemNumber: summary.listing.itemNumber,
        designName: summary.listing.designName,
        typePrefix: summary.listing.typePrefix,
        collectionName: summary.listing.collectionName,
        bpMsrp: summary.listing.bpMsrp,
      },
      offeredText: summary.customerDescription,
      ruleCheck: {
        status: 'needs_review',
        label: `Compare against ${comparisonTarget}`,
        description:
          'Customer offers are free text, so the rep should confirm the offered piece is the same type and collection before approving the trade.',
      },
    },
  }
}

export function isTradeRequestCardPart(
  part: unknown,
): part is TradeRequestCardPart {
  if (!part || typeof part !== 'object') return false

  const candidate = part as Partial<TradeRequestCardPart>
  const data = candidate.data
  const requestedItem = data?.requestedItem
  const ruleCheck = data?.ruleCheck

  return (
    candidate.type === 'data-trade-request-card' &&
    !!data &&
    typeof data === 'object' &&
    typeof data.requestId === 'string' &&
    (data.status === undefined ||
      data.status === 'pending' ||
      data.status === 'approved' ||
      data.status === 'denied' ||
      data.status === 'cancelled') &&
    typeof data.customerName === 'string' &&
    !!requestedItem &&
    typeof requestedItem === 'object' &&
    typeof requestedItem.itemNumber === 'string' &&
    typeof requestedItem.designName === 'string' &&
    typeof requestedItem.typePrefix === 'string' &&
    (typeof requestedItem.collectionName === 'string' ||
      requestedItem.collectionName === null) &&
    (typeof requestedItem.bpMsrp === 'number' ||
      requestedItem.bpMsrp === null) &&
    typeof data.offeredText === 'string' &&
    !!ruleCheck &&
    typeof ruleCheck === 'object' &&
    ruleCheck.status === 'needs_review' &&
    typeof ruleCheck.label === 'string' &&
    typeof ruleCheck.description === 'string'
  )
}
