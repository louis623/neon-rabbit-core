'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { getTradeListingDisplayFields } from '@/lib/services/trade-listing-display'
import type {
  BoardResult,
  FulfillmentQueueItem,
  TradeListingWithDesign,
  TradeRequestWithListing,
  TradeSwapCleanupItem,
} from '@/lib/services/types'
import {
  getBoardInventoryOptions,
  getBoardInventoryResults,
  getCarouselWindow,
  hasActiveBoardInventoryBrowse,
} from '@/lib/nic-nac/board-inventory-view'
import { buildCustomerTradeBoardHref } from '@/lib/nic-nac/rep-links'
import surfaceStyles from './WorkspaceSurface.module.css'
import styles from './TradeBoardWorkspaceCard.module.css'

const BOARD_INVENTORY_MOBILE_QUERY = '(max-width: 840px)'

type TradeBoardState = {
  status: 'loading' | 'ready' | 'error'
  board?: BoardResult
  hasMoreListings?: boolean
}

type TradeBoardActionState = {
  pendingKey: string | null
  error: string | null
  helperMessage: string | null
}

type TradeRequestsState = {
  status: 'loading' | 'ready' | 'error'
  requests?: TradeRequestWithListing[]
}

type FulfillmentQueueState = {
  status: 'loading' | 'ready' | 'error'
  items?: FulfillmentQueueItem[]
}

type TradeSwapCleanupState = {
  status: 'loading' | 'ready' | 'error'
  items?: TradeSwapCleanupItem[]
}

export type TradeBoardWorkspaceCardProps = {
  tradeBoardState: TradeBoardState
  visibleListings?: TradeListingWithDesign[]
  tradeBoardSearchQuery: string
  onTradeBoardSearchQueryChange: (value: string) => void
  quickAddItemNumber: string
  onQuickAddItemNumberChange: (value: string) => void
  actionState: TradeBoardActionState
  tradeRequestsState: TradeRequestsState
  fulfillmentQueueState: FulfillmentQueueState
  tradeSwapCleanupState?: TradeSwapCleanupState
  onQuickAddListing: () => void
  onRemoveListing: (listingId: string) => void
  onApproveRequest: (
    requestId: string,
    swap?: { revealedItemNumber?: string; revealedRingSize?: string },
  ) => void
  onRejectRequest: (requestId: string) => void
  onAdvanceFulfillment: (
    requestId: string,
    nextStatus: 'shipped' | 'completed',
  ) => void
  customerBoardHref?: string
  onOpenCustomerBoardPreview?: () => void
  hasMoreListings?: boolean
  onEnsureInventoryBrowseLoaded?: () => Promise<void>
  isInventoryBrowseLoading?: boolean
}

function subscribeBoardInventoryViewport(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia(BOARD_INVENTORY_MOBILE_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getBoardInventoryPageSizeSnapshot() {
  if (typeof window === 'undefined') return 3
  return window.matchMedia(BOARD_INVENTORY_MOBILE_QUERY).matches ? 1 : 3
}

function formatTradeMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return 'MSRP n/a'
  return `$${value.toFixed(2)}`
}

function getTradeListingPhotoUrl(listing: TradeListingWithDesign) {
  return getTradeListingDisplayFields(listing).photoUrl
}

function getTradeListingPhotoSourceLabel(listing: TradeListingWithDesign) {
  const display = getTradeListingDisplayFields(listing)
  if (display.listingPhotoUrl) return 'custom listing photo'
  if (display.canonicalPhotoUrl && listing.uses_canonical_photo) {
    return 'catalog photo'
  }
  return 'no photo yet'
}

function getNextFulfillmentStatus(status: FulfillmentQueueItem['status']) {
  if (status === 'approved') return 'shipped'
  if (status === 'shipped') return 'completed'
  return null
}

export function TradeBoardWorkspaceCard({
  tradeBoardState,
  visibleListings,
  tradeBoardSearchQuery,
  onTradeBoardSearchQueryChange,
  quickAddItemNumber,
  onQuickAddItemNumberChange,
  actionState,
  tradeRequestsState,
  fulfillmentQueueState,
  tradeSwapCleanupState = { status: 'ready', items: [] },
  onQuickAddListing,
  onRemoveListing,
  onApproveRequest,
  onRejectRequest,
  onAdvanceFulfillment,
  customerBoardHref = buildCustomerTradeBoardHref(),
  onOpenCustomerBoardPreview,
  hasMoreListings = false,
  onEnsureInventoryBrowseLoaded,
  isInventoryBrowseLoading = false,
}: TradeBoardWorkspaceCardProps) {
  const [previewListing, setPreviewListing] = useState<TradeListingWithDesign | null>(
    null,
  )
  const [swapApprovalDraft, setSwapApprovalDraft] = useState<{
    requestId: string
    customerName: string
  } | null>(null)
  const [revealedItemNumber, setRevealedItemNumber] = useState('')
  const [revealedRingSize, setRevealedRingSize] = useState('')
  const [inventoryJewelryType, setInventoryJewelryType] = useState('')
  const [inventoryCollection, setInventoryCollection] = useState('')
  const [inventoryCarouselIndex, setInventoryCarouselIndex] = useState(0)
  const [isFilterDisclosureOpen, setIsFilterDisclosureOpen] = useState(false)

  const boardSummary = tradeBoardState.board?.summary
  const boardListings = (visibleListings ?? tradeBoardState.board?.listings ?? []).filter(
    (listing) => listing.status === 'available',
  )
  const inventoryFilters = {
    search: tradeBoardSearchQuery,
    jewelryType: inventoryJewelryType,
    collection: inventoryCollection,
  }
  const hasActiveInventoryBrowse = hasActiveBoardInventoryBrowse(inventoryFilters)
  const inventoryOptions = getBoardInventoryOptions(boardListings)
  const inventoryResults = getBoardInventoryResults(boardListings, inventoryFilters)
  const inventoryCarouselPageSize = useSyncExternalStore(
    subscribeBoardInventoryViewport,
    getBoardInventoryPageSizeSnapshot,
    () => 3,
  )
  const carousel = getCarouselWindow(
    inventoryResults,
    inventoryCarouselIndex,
    inventoryCarouselPageSize,
  )
  const requests = tradeRequestsState.requests ?? []
  const queueItems = fulfillmentQueueState.items ?? []
  const cleanupItems = tradeSwapCleanupState.items ?? []
  const tradeWorkCount = requests.length + cleanupItems.length + queueItems.length
  const tradeStatusReady =
    tradeRequestsState.status === 'ready' &&
    tradeSwapCleanupState.status === 'ready' &&
    fulfillmentQueueState.status === 'ready'
  const hasActiveBrowseCriteria =
    tradeBoardSearchQuery.trim() !== '' ||
    inventoryJewelryType !== '' ||
    inventoryCollection !== ''
  const normalizedRevealedItemNumber = revealedItemNumber.trim().toUpperCase()
  const approvingSwap = swapApprovalDraft
    ? actionState.pendingKey === `approve:${swapApprovalDraft.requestId}`
    : false

  useEffect(() => {
    if (inventoryJewelryType === '' && inventoryCollection === '') return
    setIsFilterDisclosureOpen(true)
  }, [inventoryJewelryType, inventoryCollection])

  useEffect(() => {
    if (!hasMoreListings) return
    if (!hasActiveBrowseCriteria && !isFilterDisclosureOpen) return
    void onEnsureInventoryBrowseLoaded?.()
  }, [
    hasActiveBrowseCriteria,
    hasMoreListings,
    isFilterDisclosureOpen,
    onEnsureInventoryBrowseLoaded,
  ])

  function handleResetInventoryBrowse() {
    onTradeBoardSearchQueryChange('')
    setInventoryJewelryType('')
    setInventoryCollection('')
    setInventoryCarouselIndex(0)
    setIsFilterDisclosureOpen(false)
  }

  return (
    <div className={styles.stack}>
      <section className={styles.heroCard}>
        <div className={styles.heroHeader}>
          <div>
            <div className={surfaceStyles.cardTitle}>Trade Board</div>
            <div className={surfaceStyles.cardSubtitle}>
              Track active pieces, requests, and fulfillment from one place.
            </div>
          </div>
          <div className={styles.heroActions}>
            {onOpenCustomerBoardPreview ? (
              <button
                type="button"
                className={surfaceStyles.helperButton}
                onClick={onOpenCustomerBoardPreview}
              >
                View customer board
              </button>
            ) : (
              <a
                className={surfaceStyles.helperLink}
                href={customerBoardHref}
                target="_blank"
                rel="noreferrer"
              >
                View customer board
              </a>
            )}
            <span className={surfaceStyles.rosterTag}>Default landing section</span>
          </div>
        </div>
        {actionState.error ? (
          <div className={surfaceStyles.actionError}>{actionState.error}</div>
        ) : null}
        {actionState.helperMessage ? (
          <div className={surfaceStyles.helperMessage}>{actionState.helperMessage}</div>
        ) : null}
      </section>

      {swapApprovalDraft ? (
        <div
          className={styles.imagePreviewMask}
          role="dialog"
          aria-modal="true"
          aria-label={`Approve trade swap for ${swapApprovalDraft.customerName}`}
          onClick={() => {
            if (approvingSwap) return
            setSwapApprovalDraft(null)
          }}
        >
          <div
            className={styles.imagePreviewDialog}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.imagePreviewClose}
              onClick={() => setSwapApprovalDraft(null)}
              disabled={approvingSwap}
            >
              Close
            </button>
            <div className={surfaceStyles.walletSettingsTitle}>Approve trade</div>
            <p className={surfaceStyles.helperNote}>
              {swapApprovalDraft.customerName} gets the board piece. Add it now if you
              have it, or approve the trade and add the revealed piece later with
              Nic-Nac.
            </p>
            <label className={surfaceStyles.searchField}>
              <span className={surfaceStyles.searchLabel}>
                Revealed item number (optional)
              </span>
              <input
                type="text"
                className={`${surfaceStyles.searchInput} ph-no-capture`}
                value={revealedItemNumber}
                onChange={(event) =>
                  setRevealedItemNumber(event.target.value.toUpperCase())
                }
                placeholder="RG12345"
                disabled={approvingSwap}
              />
            </label>
            {normalizedRevealedItemNumber.startsWith('RG') ? (
              <label className={surfaceStyles.searchField}>
                <span className={surfaceStyles.searchLabel}>Ring size</span>
                <input
                  type="text"
                  className={`${surfaceStyles.searchInput} ph-no-capture`}
                  value={revealedRingSize}
                  onChange={(event) => setRevealedRingSize(event.target.value)}
                  placeholder="8"
                  disabled={approvingSwap}
                />
              </label>
            ) : null}
            <div className={surfaceStyles.actionRow}>
              <button
                type="button"
                className={surfaceStyles.helperButton}
                onClick={() => setSwapApprovalDraft(null)}
                disabled={approvingSwap}
              >
                Cancel
              </button>
              <button
                type="button"
                className={surfaceStyles.helperButton}
                onClick={() => {
                  onApproveRequest(swapApprovalDraft.requestId)
                  setSwapApprovalDraft(null)
                }}
                disabled={approvingSwap}
              >
                Approve without item number
              </button>
              <button
                type="button"
                className={surfaceStyles.actionButton}
                disabled={!normalizedRevealedItemNumber || approvingSwap}
                onClick={() => {
                  onApproveRequest(swapApprovalDraft.requestId, {
                    revealedItemNumber: normalizedRevealedItemNumber,
                    revealedRingSize,
                  })
                  setSwapApprovalDraft(null)
                }}
              >
                {approvingSwap ? 'Approving...' : 'Approve trade'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={styles.summaryCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={surfaceStyles.walletSettingsTitle}>Today&apos;s trade work</div>
            <div className={surfaceStyles.helperNote}>
              {tradeStatusReady
                ? tradeWorkCount > 0
                  ? `${tradeWorkCount} item${tradeWorkCount === 1 ? '' : 's'} need attention before the board is fully caught up.`
                  : 'No trade requests, cleanup, or fulfillment work needs attention right now.'
                : 'Checking requests, cleanup, and fulfillment.'}
            </div>
          </div>
        </div>
        <div className={styles.summaryStats} aria-label="Trade Board work summary">
          <div
            className={`${styles.summaryStat} ${
              requests.length > 0 ? styles.summaryStatActive : ''
            }`}
          >
            <span className={styles.summaryCount}>
              {tradeRequestsState.status === 'ready' ? requests.length : '...'}
            </span>
            <span className={styles.summaryLabel}>Pending requests</span>
          </div>
          <div
            className={`${styles.summaryStat} ${
              cleanupItems.length > 0 ? styles.summaryStatActive : ''
            }`}
          >
            <span className={styles.summaryCount}>
              {tradeSwapCleanupState.status === 'ready' ? cleanupItems.length : '...'}
            </span>
            <span className={styles.summaryLabel}>Cleanup follow-ups</span>
          </div>
          <div
            className={`${styles.summaryStat} ${
              queueItems.length > 0 ? styles.summaryStatActive : ''
            }`}
          >
            <span className={styles.summaryCount}>
              {fulfillmentQueueState.status === 'ready' ? queueItems.length : '...'}
            </span>
            <span className={styles.summaryLabel}>Fulfillment swaps</span>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={surfaceStyles.walletSettingsTitle}>Quick add</div>
            <div className={surfaceStyles.helperNote}>
              Add a known item fast when you already have the item number.
            </div>
          </div>
        </div>
        {tradeBoardState.status === 'ready' && boardSummary ? (
          <div className={styles.quickAddRow}>
            <label className={surfaceStyles.searchField}>
              <span className={surfaceStyles.searchLabel}>Quick add by item number</span>
              <input
                type="text"
                className={`${surfaceStyles.searchInput} ph-no-capture`}
                value={quickAddItemNumber}
                onChange={(event) =>
                  onQuickAddItemNumberChange(event.target.value.toUpperCase())
                }
                placeholder="RG100"
              />
            </label>
            <button
              type="button"
              className={surfaceStyles.actionButton}
              disabled={actionState.pendingKey === 'quick-add'}
              onClick={onQuickAddListing}
            >
              {actionState.pendingKey === 'quick-add' ? 'Adding...' : 'Add to board'}
            </button>
          </div>
        ) : (
          <div className={surfaceStyles.cardFill}>
            <div className={surfaceStyles.loadingLine} />
            <div className={surfaceStyles.loadingLineShort} />
          </div>
        )}
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={surfaceStyles.walletSettingsTitle}>Browse board</div>
            <div className={surfaceStyles.helperNote}>
              Search the active board first. Open filters only when you need to narrow it down.
            </div>
          </div>
          <span className={surfaceStyles.rosterTag}>
            {tradeBoardState.status === 'ready' && boardSummary
              ? `${boardSummary.totalPieces} live pieces`
              : 'Loading board'}
          </span>
        </div>
        {tradeBoardState.status === 'ready' && boardSummary ? (
          <>
            <label className={surfaceStyles.searchField}>
              <span className={surfaceStyles.searchLabel}>Search your active board</span>
              <input
                type="text"
                className={`${surfaceStyles.searchInput} ph-no-capture`}
                value={tradeBoardSearchQuery}
                onChange={(event) => {
                  setInventoryCarouselIndex(0)
                  onTradeBoardSearchQueryChange(event.target.value)
                }}
                placeholder="Search by item number, design, or collection"
              />
            </label>
            <details
              className={styles.filterDisclosure}
              open={isFilterDisclosureOpen}
              onToggle={(event) =>
                setIsFilterDisclosureOpen(event.currentTarget.open)
              }
            >
              <summary className={styles.filterSummary}>Filters</summary>
              <div className={styles.filterGrid}>
                <select
                  aria-label="Jewelry Type"
                  value={inventoryJewelryType}
                  className={`${surfaceStyles.selectInput} ${styles.boardInventorySelect}`}
                  disabled={boardListings.length === 0}
                  onChange={(event) => {
                    setInventoryCarouselIndex(0)
                    setInventoryJewelryType(event.target.value)
                  }}
                >
                  <option value="">Jewelry Type</option>
                  {inventoryOptions.jewelryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Collection"
                  value={inventoryCollection}
                  className={`${surfaceStyles.selectInput} ${styles.boardInventorySelect}`}
                  disabled={boardListings.length === 0}
                  onChange={(event) => {
                    setInventoryCarouselIndex(0)
                    setInventoryCollection(event.target.value)
                  }}
                >
                  <option value="">Collection</option>
                  {inventoryOptions.collections.map((collection) => (
                    <option key={collection} value={collection}>
                      {collection}
                    </option>
                  ))}
                </select>
                {hasActiveInventoryBrowse ? (
                  <button
                    type="button"
                    className={`${surfaceStyles.helperButton} ${styles.inventoryButton}`}
                    onClick={handleResetInventoryBrowse}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </details>
            {hasActiveInventoryBrowse ? (
              inventoryResults.length > 0 ? (
                <div
                  className={styles.boardInventoryCarousel}
                  aria-label="Filtered active board pieces"
                >
                  <div className={styles.boardInventoryCarouselHeader}>
                    <span className={surfaceStyles.helperNote}>{carousel.rangeLabel}</span>
                    <div className={styles.boardInventoryArrowGroup}>
                      <button
                        type="button"
                        className={`${surfaceStyles.helperButton} ${styles.inventoryButton}`}
                        disabled={!carousel.canGoPrevious}
                        onClick={() =>
                          setInventoryCarouselIndex(
                            Math.max(0, carousel.startIndex - inventoryCarouselPageSize),
                          )
                        }
                        aria-label="Previous board inventory pieces"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className={`${surfaceStyles.helperButton} ${styles.inventoryButton}`}
                        disabled={!carousel.canGoNext}
                        onClick={() =>
                          setInventoryCarouselIndex(
                            carousel.startIndex + inventoryCarouselPageSize,
                          )
                        }
                        aria-label="Next board inventory pieces"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  {isInventoryBrowseLoading ? (
                    <div className={surfaceStyles.helperNote}>Loading board pieces...</div>
                  ) : null}
                  <div className={styles.boardInventoryCarouselGrid}>
                    {carousel.visibleItems.map((listing) => {
                      const photoUrl = getTradeListingPhotoUrl(listing)
                      const display = getTradeListingDisplayFields(listing)
                      return (
                        <div key={listing.id} className={styles.boardInventoryPieceCard}>
                          <button
                            type="button"
                            className={styles.boardInventoryMediaButton}
                            aria-label={`Open image preview for ${display.designName}`}
                            onClick={() => setPreviewListing(listing)}
                          >
                            <span className={styles.boardInventoryMedia}>
                              {photoUrl ? (
                                <img
                                  className={styles.tradePieceImage}
                                  src={photoUrl}
                                  alt={display.designName}
                                  loading="lazy"
                                />
                              ) : (
                                <span className={styles.tradePieceFallback}>
                                  {display.typePrefix}
                                </span>
                              )}
                            </span>
                          </button>
                          <div className={styles.boardInventoryPieceBody}>
                            <div className={styles.customerName}>{display.designName}</div>
                            <div className={styles.tradePieceMetaLine}>
                              {display.itemNumber ?? display.repFacingNote}
                            </div>
                            <div className={styles.tradePieceMetaLine}>
                              {display.typePrefix}
                              {display.collectionName ? ` - ${display.collectionName}` : ''}
                            </div>
                            <div className={styles.timelineItem}>
                              {formatTradeMoney(display.bpMsrp)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`${surfaceStyles.helperButton} ${styles.inventoryButton} ${styles.boardInventoryRemoveButton}`}
                            disabled={actionState.pendingKey === `remove:${listing.id}`}
                            onClick={() => onRemoveListing(listing.id)}
                          >
                            {actionState.pendingKey === `remove:${listing.id}`
                              ? 'Removing...'
                              : 'Remove'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className={surfaceStyles.emptyState}>
                  {isInventoryBrowseLoading
                    ? 'Loading board pieces...'
                    : 'No board pieces match this search.'}
                </div>
              )
            ) : (
              <div className={styles.browseHint}>
                Search the board or open filters to find a live piece.
              </div>
            )}
            {previewListing ? (() => {
              const previewDisplay = getTradeListingDisplayFields(previewListing)
              const previewPhotoUrl = getTradeListingPhotoUrl(previewListing)
              return (
                <div
                  className={styles.imagePreviewMask}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${previewDisplay.designName} image preview`}
                  onClick={() => setPreviewListing(null)}
                >
                  <div
                    className={styles.imagePreviewDialog}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={styles.imagePreviewClose}
                      aria-label="Close image preview"
                      onClick={() => setPreviewListing(null)}
                    >
                      x
                    </button>
                    <div className={styles.imagePreviewFrame}>
                      {previewPhotoUrl ? (
                        <img
                          src={previewPhotoUrl}
                          alt={previewDisplay.designName}
                          className={styles.imagePreviewImage}
                        />
                      ) : (
                        <div className={styles.tradePieceFallback}>
                          {previewDisplay.typePrefix}
                        </div>
                      )}
                    </div>
                    <div className={surfaceStyles.walletSettingsTitle}>
                      {previewDisplay.designName}
                    </div>
                    <div className={surfaceStyles.helperNote}>
                      Image source: {getTradeListingPhotoSourceLabel(previewListing)}
                    </div>
                  </div>
                </div>
              )
            })() : null}
          </>
        ) : (
          <div className={surfaceStyles.cardFill}>
            <div className={surfaceStyles.loadingLine} />
            <div className={surfaceStyles.loadingLineShort} />
          </div>
        )}
      </section>

      {tradeRequestsState.status === 'ready' && requests.length > 0 ? (
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={surfaceStyles.walletSettingsTitle}>Request inbox</div>
              <div className={surfaceStyles.helperNote}>
                Review incoming trade requests and approve the right swaps.
              </div>
            </div>
            <span className={surfaceStyles.rosterTag}>{`${requests.length} pending`}</span>
          </div>
          <div className={styles.tradeList}>
            {requests.map((request) => {
              const ruleCheckTarget = request.listing.design.collectionName
                ? `${request.listing.design.typePrefix} / ${request.listing.design.collectionName}`
                : request.listing.design.typePrefix
              const requestedItemLabel = request.listing.design.itemNumber
                ? `${request.listing.design.itemNumber} - ${request.listing.design.designName}`
                : `${request.listing.design.designName}${
                    request.listing.repFacingNote ? ` ${request.listing.repFacingNote}` : ''
                  }`

              return (
                <div key={request.id} className={styles.tradeRow}>
                  <div className={styles.tradeIdentity}>
                    <div className={styles.customerName}>{request.customerName}</div>
                    <div className={styles.customerDate}>
                      Wants {requestedItemLabel}
                    </div>
                    <div className={surfaceStyles.helperNote}>{request.customerDescription}</div>
                    {request.revealScreenshot ? (
                      <a
                        className={styles.tradeScreenshotLink}
                        href={`/api/nic-nac/trade-requests/${request.id}/reveal-screenshot`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className={styles.tradeScreenshotThumb}
                          src={`/api/nic-nac/trade-requests/${request.id}/reveal-screenshot`}
                          alt={`Reveal screenshot from ${request.customerName}`}
                        />
                        <span>
                          <span className={styles.tradeScreenshotTitle}>
                            Reveal screenshot
                          </span>
                          <span className={styles.tradeScreenshotMeta}>
                            View customer upload
                          </span>
                        </span>
                      </a>
                    ) : null}
                    <div className={surfaceStyles.helperNote}>
                      Rule check: compare against {ruleCheckTarget}
                    </div>
                  </div>
                  <div className={surfaceStyles.actionRow}>
                    <button
                      type="button"
                      className={surfaceStyles.actionButton}
                      disabled={actionState.pendingKey === `approve:${request.id}`}
                      onClick={() => {
                        setSwapApprovalDraft({
                          requestId: request.id,
                          customerName: request.customerName,
                        })
                        setRevealedItemNumber('')
                        setRevealedRingSize('')
                      }}
                    >
                      {actionState.pendingKey === `approve:${request.id}`
                        ? 'Approving...'
                        : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className={surfaceStyles.helperButton}
                      disabled={actionState.pendingKey === `reject:${request.id}`}
                      onClick={() => onRejectRequest(request.id)}
                    >
                      {actionState.pendingKey === `reject:${request.id}`
                        ? 'Denying...'
                        : 'Deny'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {tradeSwapCleanupState.status === 'ready' && cleanupItems.length > 0 ? (
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={surfaceStyles.walletSettingsTitle}>Swap cleanup</div>
              <div className={surfaceStyles.helperNote}>
                Approved swaps land here when the replacement reveal still needs a
                ring size or catalog details before fulfillment can finish.
              </div>
            </div>
            <span className={surfaceStyles.rosterTag}>{`${cleanupItems.length} to finish`}</span>
          </div>
          <div className={styles.tradeList}>
            {cleanupItems.map((item) => (
              <div key={item.swapId} className={styles.tradeRow}>
                <div className={styles.tradeIdentity}>
                  <div className={styles.customerName}>{item.customerName}</div>
                  <div className={styles.customerDate}>
                    Revealed item number: {item.revealedItemNumber}
                  </div>
                  <div className={surfaceStyles.helperNote}>
                    {item.replacementStatus === 'needs_ring_size'
                      ? 'Add ring size to put this reveal back on the board.'
                      : 'Finish catalog details after the show to put this reveal back on the board.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {fulfillmentQueueState.status === 'ready' && queueItems.length > 0 ? (
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={surfaceStyles.walletSettingsTitle}>Fulfillment queue</div>
              <div className={surfaceStyles.helperNote}>
                Keep approved swaps moving until they are fully closed out.
              </div>
            </div>
            <span className={surfaceStyles.rosterTag}>{`${queueItems.length} active swaps`}</span>
          </div>
          <div className={styles.tradeList}>
            {queueItems.map((item) => {
              const nextStatus = getNextFulfillmentStatus(item.status)
              return (
                <div key={item.fulfillmentId} className={styles.tradeRow}>
                  <div className={styles.tradeIdentity}>
                    <div className={styles.customerName}>{item.customerName}</div>
                    <div className={styles.customerDate}>
                      {item.itemNumber ? `${item.itemNumber} - ${item.designName}` : item.designName}
                    </div>
                    <div className={surfaceStyles.helperNote}>
                      {item.daysSinceLastUpdate} day(s) since last update
                    </div>
                  </div>
                  <div className={styles.tradeMeta}>
                    <span className={styles.statusBadgeWarning}>{item.status}</span>
                  </div>
                  <div className={surfaceStyles.actionRow}>
                    {nextStatus ? (
                      <button
                        type="button"
                        className={surfaceStyles.actionButton}
                        disabled={actionState.pendingKey === `fulfillment:${item.requestId}`}
                        onClick={() => onAdvanceFulfillment(item.requestId, nextStatus)}
                      >
                        {actionState.pendingKey === `fulfillment:${item.requestId}`
                          ? 'Saving...'
                          : nextStatus === 'shipped'
                            ? 'Mark shipped'
                            : 'Mark completed'}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

