// Public barrel for the shared service layer. Both Nic-Nac tool handlers
// and dashboard routes can import from '@/lib/services'. Existing tool
// callers that import from '@/lib/services/trade-board' continue to work
// (trade-board.ts remains the stable facade for those names).

// Errors
export { ServiceError, TradeBoardError, errors } from './errors'

// Types
export type {
  ListingStatus,
  TradeRequestStatus,
  FulfillmentStatus,
  JewelryType,
  RemovalReason,
  RejectionReason,
  TradeListingWithDesign,
  BoardResult,
  RemoveListingResult,
  RestoreListingInput,
  RestoreListingResult,
  PurgeRemovedListingsResult,
  GetMyBoardFilters,
  AddListingInput,
  AddListingResult,
  BatchListingItem,
  AddListingBatchInput,
  AddListingBatchResult,
  UpdateListingInput,
  UpdateListingResult,
  EventStatus,
  DiscountCode,
  RecurringShowInput,
  CalendarEvent,
  AddShowInput,
  AddShowResult,
  ListShowsInput,
  ListShowsResult,
  UpdateShowInput,
  UpdateShowResult,
  CancelShowResult,
  SubmitTradeRequestInput,
  SubmitTradeRequestResult,
  GetTradeRequestsFilters,
  TradeRequestWithListing,
  ApproveTradeResult,
  RejectTradeResult,
  GetTradeHistoryOptions,
  TradeHistoryItem,
  TradeHistoryResult,
  UpdateFulfillmentInput,
  UpdateFulfillmentResult,
  FulfillmentQueueItem,
  SearchJewelryInput,
  JewelryDatabaseResult,
  ResolveItemNumberResult,
  CreateDesignInput,
  CreateDesignResult,
  JewelryCatalogChangeType,
  JewelryCatalogIssueType,
  WriteJewelryCatalogChangeInput,
  JewelryCatalogCorrectionPatch,
  ReportJewelryCatalogIssueInput,
  ReportJewelryCatalogIssueResult,
  UpdateCanonicalPhotoResult,
} from './types'
export type {
  JewelryPhotoIssueCode,
  JewelryPhotoIssueSeverity,
  JewelryPhotoPreflightInput,
  JewelryPhotoPreflightIssue,
  JewelryPhotoPreflightResult,
} from './jewelry-photo-preflight'

// Trade Board
export {
  getMyBoard,
  removeListing,
  restoreListing,
  purgeExpiredRemovedListings,
  addListing,
  addListingBatch,
  updateListing,
} from './trade-board'

// Trade Requests
export {
  submitTradeRequest,
  getTradeRequests,
  approveTrade,
  rejectTrade,
  getTradeHistory,
} from './trade-requests'

// Calendar / Shows
export { addShow, listMyShows, updateShow, cancelShow } from './calendar'

// Trade Fulfillment
export { updateFulfillmentStatus, getFulfillmentQueue } from './trade-fulfillment'

// Jewelry Database
export {
  resolveItemNumber,
  searchJewelryDatabase,
  createDesign,
  updateCanonicalPhoto,
} from './jewelry-database'
export { writeJewelryCatalogChange } from './jewelry-catalog-audit'
export { reportJewelryCatalogIssue } from './jewelry-catalog-corrections'
export {
  deriveJewelryCatalogTags,
  normalizeJewelryCatalogTags,
} from './jewelry-catalog-tags'

// Jewelry Photo Pre-Flight
export { assessJewelryPhotoPreflight } from './jewelry-photo-preflight'
