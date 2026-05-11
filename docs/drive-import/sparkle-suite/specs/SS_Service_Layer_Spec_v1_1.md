# Sparkle Suite — Shared Service Layer Specification

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any service function added, business rule changed, or error handling pattern modified

**Version:** 1.1 | **Created:** April 11, 2026 | **Last Updated:** April 30, 2026 | **Status:** LIVE — Aligned to deployed repo after Task 1.5D ship

**v1.1 CHANGES (April 30, 2026):**

Aligned spec to deployed reality after Tasks 1.5A–1.5D shipped. Codex adversarial review of Task 1.5D prompt (April 30, 2026) surfaced 3 HIGH severity drift findings between this spec and the actual repo. All three service function signatures had evolved during implementation. This bump captures the built signatures, not the designed ones.

1. **`searchJewelryDatabase`** — spec v1.0 listed 10 filter/sort params. Repo only accepts `{ query, limit }`. Stripped to match. Filter-only use cases (e.g., "show me RG pieces under $100") are not supported until the service is extended.
2. **`getTradeHistory`** — spec v1.0 listed 8 filter/sort/date params. Repo only accepts `{ limit }` and hardcodes status filter to `approved|denied`. Stripped to match.
3. **`updateListing`** — spec v1.0 had `itemNumber` as alternative lookup. Repo requires `(supabase, repId, listingId, patch)` — no item number fallback. Stripped to match.
4. **`updateFulfillmentStatus`** — REMOVED from Thumper scope. Thumper facilitates trades and manages the board/database. Fulfillment (shipping, handoff) is handled by the rep offline. The service function and database table still exist but are NOT exposed as a Thumper tool.
5. **Supabase Storage** — added `jewelry-photos` bucket documentation (shipped in Task 1.5B, migration 029).
6. **Service function signatures** — all signatures now reflect the actual `(supabase, repId, ...)` pattern used in the repo, not the spec v1.0 shorthand.

**Source session:** Original spec Session #23 (April 11, 2026). This bump from April 30, 2026 session.

---

## What This Is (Plain Language)

The shared service layer is the single set of functions that actually do all trade board work. Both Thumper (conversational chatbot) and the rep dashboard (buttons and forms) call these same functions. Neither interface contains business logic — all rules live here in the service layer.

Think of it as the kitchen in a restaurant. Thumper is one waiter. The dashboard is another. Both send orders to the same kitchen. The kitchen cooks identically regardless of who took the order.

**Why it matters:** One place to fix bugs. One place to change business rules. No risk of Thumper and the dashboard behaving differently.

---

## Architecture Pattern

```
Thumper Tool Handler              Dashboard API Route
  (app/api/thumper/tools/)          (app/api/dashboard/)
        │                                  │
        │   Handles auth, extracts         │   Handles auth, extracts
        │   rep_id, validates input        │   rep_id, validates input
        │   shape, formats response        │   shape, returns JSON
        │   as conversation                │
        │                                  │
        └──────────────┐   ┌───────────────┘
                       ▼   ▼
               Service Layer Function
                (lib/services/*.ts)
                       │
                       │   Validates business rules
                       │   Executes database operations
                       │   Returns typed result
                       │
                       ▼
              Supabase Client (server)
                (lib/supabase.ts)
```

**Key constraint:** Service functions receive a Supabase client instance, `rep_id` (UUID), and validated input. They return a typed result. The caller handles everything else (auth, input parsing, response formatting). The Supabase client is passed in by the caller — auth client for rep-scoped operations, service client for cross-rep reads.

---

## File Organization

Four service files plus two supporting files. All in `lib/services/` in the neon-rabbit-core repo.

| File | Domain | Functions |
|------|--------|-----------|
| `trade-board.ts` | Listings — adding, viewing, removing, updating pieces on a rep's board | addListing, addListingBatch, getMyBoard, removeListing, updateListing |
| `trade-requests.ts` | Trade requests — customer submissions, rep approvals/rejections, history | submitTradeRequest, getTradeRequests, approveTrade, rejectTrade, getTradeHistory |
| `trade-fulfillment.ts` | Fulfillment — post-approval tracking (NOT exposed via Thumper) | updateFulfillmentStatus, getFulfillmentQueue |
| `jewelry-database.ts` | Jewelry catalog — searching, resolving item numbers, creating new designs | searchJewelryDatabase, resolveItemNumber, createDesign, updateCanonicalPhoto |
| `types.ts` | All shared TypeScript types, input/output interfaces, enums | — |
| `errors.ts` | Custom error classes and predefined error messages | — |

---

## Critical Business Rule: One Request Per Piece

**Decided Session #23 (April 11, 2026). Supersedes Gap 22 Session #21 design.**

Only ONE trade request can exist per listing at a time. When a customer submits a trade request:

1. Listing status changes from "available" to "pending_trade" immediately
2. The piece DISAPPEARS from the public trade board completely
3. No other customer can request it
4. First-come, first-served

If the rep APPROVES: listing → "traded", fulfillment row created. Piece is gone permanently.
If the rep REJECTS: listing → "available", piece reappears on the board. Another customer can try.

**Why:** Simpler for reps (no inbox of competing requests to sort through), fairer for customers (first to click wins), eliminates favoritism and conflict, simpler code.

**Enforcement:**
- Customer-facing form: "I Want This" button only renders when `listing.status === 'available'`
- Supabase Realtime on `trade_listings` table: if another customer is viewing the board when a request is submitted, the piece disappears in real-time
- Database safety net: partial unique index `CREATE UNIQUE INDEX ON trade_requests(listing_id) WHERE status = 'pending'` prevents duplicate pending requests at the database level
- Service function validates listing status is "available" before accepting request

---

## Postgres RPC Functions (Atomic Operations)

Three database-level functions ensure multi-table operations succeed or fail as a unit. These are called by the service layer — NOT directly by Thumper or dashboard routes.

### 1. `rpc_submit_trade_request`

Called when a customer submits a trade request from the public board.

**Atomic steps (all or nothing):**
1. Validate listing exists and status is "available"
2. INSERT into `trade_requests` (status: "pending")
3. UPDATE `trade_listings` SET status = "pending_trade"

**If listing is not "available":** Returns error — another customer got there first.

### 2. `rpc_approve_trade`

Called when a rep approves a pending trade request.

**Atomic steps (all or nothing):**
1. UPDATE `trade_requests` SET status = "approved"
2. UPDATE `trade_listings` SET status = "traded"
3. INSERT into `trade_fulfillment` (status: "approved")
4. UPDATE `jewelry_designs` INCREMENT `times_traded`

**Returns:** `fulfillment_id` for the newly created fulfillment record.

### 3. `rpc_reject_trade`

Called when a rep rejects a pending trade request.

**Atomic steps (all or nothing):**
1. UPDATE `trade_requests` SET status = "denied", reason, rep_notes
2. UPDATE `trade_listings` SET status = "available" (piece reappears on board)

---

## Service Functions — Complete Reference

### File: `lib/services/trade-board.ts`

Covers listings — everything about managing pieces on a rep's board.

---

#### `addListing` (Single)

**Purpose:** Add one piece to the rep's trade board.

**Signature (repo):**
```typescript
export async function addListing(
  supabase: SupabaseClient,
  repId: string,
  input: {
    itemNumber?: string;
    labelPhotoUrl?: string;
    listingPhotoUrl?: string;
    tradePreferences?: string;
    collectionName?: string;
    designName?: string;
    material?: string;
    mainStone?: string;
    bpMsrp?: number;
    piecePhotoUrl?: string;
    specialFeatures?: string;
    lengthInfo?: string;
    clickwrapAcknowledged: boolean;
  }
): Promise<AddListingResult>
```

**Resolution logic (internal):**
1. Get `itemNumber` — provided directly OR extracted from label photo via OCR (OCR is handled by Thumper BEFORE calling this function; service receives the extracted item number)
2. Call `resolveItemNumber(itemNumber)` from `jewelry-database.ts`
3. IF FOUND + collection populated → INSERT `trade_listings` with canonical photo. Done.
4. IF FOUND + collection NULL → caller must provide `collectionName`. UPDATE `jewelry_designs.collection_id`. INSERT `trade_listings`. Done.
5. IF NOT FOUND → caller must provide all new design fields including `piecePhotoUrl`. Call `createDesign()`. INSERT `trade_listings`. Done.

**Validation rules:**
- At least one of `itemNumber` or `labelPhotoUrl` must be provided → error `MISSING_ITEM_INPUT`
- `clickwrapAcknowledged` must be `true` → error `CLICKWRAP_REQUIRED`
- If design not found in DB, `piecePhotoUrl` is REQUIRED → error `MISSING_PIECE_PHOTO`
- Duplicate check: same rep + same design + status "available" → error `DUPLICATE_LISTING`
- Sets `listed_at = now()` explicitly on INSERT (separate from `created_at`)
- Increments `jewelry_designs.times_listed` on EVERY listing, not just new designs

**Return:**
```typescript
interface AddListingResult {
  listingId: string;
  designId: string;
  status: 'available';
  isNewDesign: boolean;
  designName: string;
  itemNumber: string;
  photoSource: 'canonical' | 'custom';
}
```

---

#### `addListingBatch` (Batch)

**Purpose:** Add multiple pieces in one operation. Same logic as `addListing` looped.

**Signature (repo):**
```typescript
export async function addListingBatch(
  supabase: SupabaseClient,
  repId: string,
  items: Array<{
    itemNumber?: string;
    labelPhotoUrl?: string;
    listingPhotoUrl?: string;
    tradePreferences?: string;
    collectionName?: string;
    designName?: string;
    material?: string;
    mainStone?: string;
    bpMsrp?: number;
    piecePhotoUrl?: string;
    specialFeatures?: string;
    lengthInfo?: string;
  }>,
  clickwrapAcknowledged: boolean
): Promise<AddListingBatchResult>
```

**Behavior:**
- Batch-queries database for all item numbers
- Sorts into three buckets: ready to list / need collection / need full info and photo
- Auto-lists ready items immediately
- Returns pending items array for caller to collect missing info

**Return:**
```typescript
interface AddListingBatchResult {
  total: number;
  listed: number;
  needsInput: number;
  pending: Array<{
    itemNumber: string;
    needs: 'collection' | 'full_info_and_photo';
  }>;
  completed: string[]; // listing IDs
}
```

---

#### `getMyBoard`

**Purpose:** Return the rep's current trade board with filters and summary stats.

**Signature (repo):**
```typescript
export async function getMyBoard(
  supabase: SupabaseClient,
  repId: string,
  filters?: {
    statusFilter?: ListingStatus;
    collectionFilter?: string;
    typeFilter?: JewelryType;
    sortBy?: 'created_at' | 'listed_at' | 'msrp' | 'design_name' | 'collection';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
): Promise<BoardResult>
```

**Return:**
```typescript
interface BoardResult {
  listings: TradeListingWithDesign[];
  summary: {
    totalPieces: number;
    totalMsrp: number;
    typeBreakdown: Record<JewelryType, number>;
    pendingRequestCount: number;
  };
}
```

**Notes:**
- Pure read operation
- Joins `trade_listings` → `jewelry_designs` → `collections`
- `pendingRequestCount` counts requests with status "pending" across all rep's listings
- Default sort: `listed_at` descending (newest first)

---

#### `removeListing`

**Purpose:** Soft-remove a listing from the rep's board.

**Signature (repo):**
```typescript
export async function removeListing(
  supabase: SupabaseClient,
  repId: string,
  input: {
    listingId?: string;
    itemNumber?: string;
    reason?: RemovalReason;
  }
): Promise<RemoveListingResult>
```

**Behavior:**
- Sets listing status → "removed" (soft delete — never hard delete)
- If a pending trade request exists for this listing → auto-cancel it (status → "cancelled")
- Returns warning to caller if a request was cancelled so Thumper/dashboard can inform the rep

**Validation:**
- Listing must belong to `repId` → error `UNAUTHORIZED`
- At least one of `listingId` or `itemNumber` required → error `LISTING_NOT_FOUND`

**Return:**
```typescript
interface RemoveListingResult {
  listingId: string;
  designName: string;
  previousStatus: ListingStatus;
  cancelledRequestId?: string;
  cancelledRequestCustomerName?: string;
}
```

---

#### `updateListing`

**Purpose:** Modify an existing listing's trade preferences, photo, or notes.

**Signature (repo):**
```typescript
export async function updateListing(
  supabase: SupabaseClient,
  repId: string,
  listingId: string,
  patch: {
    tradePreferences?: string;
    listingPhotoUrl?: string;
    useCanonicalPhoto?: boolean;
    repNotes?: string;
  }
): Promise<UpdateListingResult>
```

**Behavior:**
- Partial update — only provided fields change
- If `useCanonicalPhoto` is true, clears `listing_photo_url` and sets `uses_canonical_photo = true`
- `listingId` is REQUIRED — no item number fallback at the service level. Thumper uses `list_my_trade_board` to resolve a rep's verbal reference to a listing ID first.

**Validation:**
- Listing must belong to `repId` → error `UNAUTHORIZED`
- Listing must be in "available" or "pending_trade" status (can't edit traded/removed listings)

**Return:**
```typescript
interface UpdateListingResult {
  listingId: string;
  updatedFields: string[];
}
```

---

### File: `lib/services/trade-requests.ts`

Covers trade request management plus customer submission.

---

#### `submitTradeRequest` (Customer-Facing — NOT a Thumper tool)

**Purpose:** Customer submits a trade request from the public board. This is a public API operation, not rep-authenticated.

**Signature (repo):**
```typescript
export async function submitTradeRequest(
  supabase: SupabaseClient,
  input: {
    listingId: string;
    customerName: string;
    customerDescription: string;
    clickwrapAcknowledged: boolean;
  }
): Promise<SubmitTradeRequestResult>
```

**Behavior:**
- Calls `rpc_submit_trade_request` Postgres function (atomic)
- INSERT `trade_requests` + UPDATE `trade_listings.status` → "pending_trade" in one transaction
- Piece disappears from public board immediately (Supabase Realtime broadcasts the status change)

**Validation:**
- `clickwrapAcknowledged` must be true → error `CLICKWRAP_REQUIRED`
- Listing must exist → error `LISTING_NOT_FOUND`
- Listing status must be "available" → error `REQUEST_ALREADY_EXISTS` (another customer got there first)
- `customerName` and `customerDescription` must be non-empty

**Return:**
```typescript
interface SubmitTradeRequestResult {
  requestId: string;
  listingId: string;
  designName: string;
  customerName: string;
}
```

---

#### `getTradeRequests`

**Purpose:** Return the rep's incoming trade request inbox.

**Signature (repo):**
```typescript
export async function getTradeRequests(
  supabase: SupabaseClient,
  repId: string,
  filters?: {
    statusFilter?: TradeRequestStatus;
    listingId?: string;
    sortBy?: 'created_at' | 'customer_name';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
): Promise<TradeRequestsResult>
```

**Return:**
```typescript
interface TradeRequestsResult {
  requests: Array<{
    requestId: string;
    customerName: string;
    customerDescription: string;
    createdAt: string;
    status: TradeRequestStatus;
    listing: {
      listingId: string;
      designName: string;
      itemNumber: string;
      bpMsrp: number;
      photoUrl: string;
      collection: string;
    };
  }>;
  totalCount: number;
}
```

**Notes:**
- Pure read operation
- Default status filter is "pending" — shows actionable items first
- MSRP match quality flagging is NOT in this function — that's a Thumper presentation concern

---

#### `approveTrade`

**Purpose:** Approve a pending trade request.

**Signature (repo):**
```typescript
export async function approveTrade(
  supabase: SupabaseClient,
  repId: string,
  input: {
    requestId: string;
    repNotes?: string;
  }
): Promise<ApproveTradeResult>
```

**Behavior:**
- Calls `rpc_approve_trade` Postgres function (atomic — 4 steps)
- Request status → "approved"
- Listing status → "traded"
- Creates `trade_fulfillment` row (status: "approved")
- Increments `jewelry_designs.times_traded`

**Validation:**
- Request must exist and belong to rep's listing → error `UNAUTHORIZED`
- Request must be in "pending" status → error `REQUEST_NOT_PENDING`

**Return:**
```typescript
interface ApproveTradeResult {
  requestId: string;
  fulfillmentId: string;
  designName: string;
  customerName: string;
}
```

---

#### `rejectTrade`

**Purpose:** Reject a pending trade request. Piece reappears on board.

**Signature (repo):**
```typescript
export async function rejectTrade(
  supabase: SupabaseClient,
  repId: string,
  input: {
    requestId: string;
    reason?: RejectionReason;
    repNotes?: string;
  }
): Promise<RejectTradeResult>
```

**Behavior:**
- Calls `rpc_reject_trade` Postgres function (atomic — 2 steps)
- Request status → "denied"
- Listing status → "available" (piece reappears on public board via Realtime)
- No fulfillment row created
- No customer notification sent

**Validation:**
- Request must exist and belong to rep's listing → error `UNAUTHORIZED`
- Request must be in "pending" status → error `REQUEST_NOT_PENDING`

**Return:**
```typescript
interface RejectTradeResult {
  requestId: string;
  listingId: string;
  designName: string;
  listingRestoredToAvailable: boolean;
}
```

---

#### `getTradeHistory`

**Purpose:** Return past trades with summary analytics.

**Signature (repo):**
```typescript
export async function getTradeHistory(
  supabase: SupabaseClient,
  repId: string,
  options?: {
    limit?: number;
  }
): Promise<TradeHistoryResult>
```

**Behavior:**
- Hardcodes status filter to `approved` and `denied` internally — caller cannot override
- Joins: `trade_requests` → `trade_fulfillment` → `trade_listings` → `jewelry_designs` → `collections`
- Summary analytics computed from trades with fulfillment status `completed`

**Return:**
```typescript
interface TradeHistoryResult {
  trades: TradeHistoryEntry[];
  summary: {
    totalCompleted: number;
    totalMsrpTraded: number;
    avgFulfillmentDays: number;
    topDesign: { designName: string; timesTraded: number } | null;
    repeatCustomers: Array<{ name: string; tradeCount: number }>;
  };
  totalCount: number;
}
```

**Notes:**
- Pure read operation
- `avgFulfillmentDays` only calculated from trades with fulfillment status "completed"
- No filter, sort, date range, or customer name parameters — if these are needed in the future, the service function must be extended

**Future expansion candidates (not built):** statusFilter, customerName, itemNumber, collectionFilter, dateFrom, dateTo, sortBy, sortOrder. These were in the v1.0 design spec but were not implemented. Add them as needed — each requires a service layer change.

---

### File: `lib/services/trade-fulfillment.ts`

Covers fulfillment tracking. **NOT exposed via Thumper** — Thumper facilitates trades and manages the board/database. Fulfillment (shipping, handoff) is handled by the rep offline. These functions exist for the dashboard and future automated checks.

---

#### `updateFulfillmentStatus`

**Purpose:** Move an approved trade through the fulfillment pipeline.

**Signature (repo):**
```typescript
export async function updateFulfillmentStatus(
  supabase: SupabaseClient,
  repId: string,
  input: {
    requestId?: string;
    customerName?: string;
    newStatus: FulfillmentStatus;
    shippingNotes?: string;
  }
): Promise<UpdateFulfillmentResult>
```

**Behavior:**
- Forward-only status progression: approved → shipped → completed (no backwards)
- If lookup by `customerName` and multiple active fulfillments match → error `AMBIGUOUS_CUSTOMER`

**Validation:**
- Fulfillment must exist and belong to rep → error `UNAUTHORIZED`
- Status must progress forward → error `INVALID_STATUS_TRANSITION`
- At least one of `requestId` or `customerName` required

**Return:**
```typescript
interface UpdateFulfillmentResult {
  requestId: string;
  fulfillmentId: string;
  previousStatus: FulfillmentStatus;
  newStatus: FulfillmentStatus;
  customerName: string;
}
```

---

#### `getFulfillmentQueue` (Dashboard Helper — NOT a Thumper Tool)

**Purpose:** Return all active fulfillment work items for the rep's dashboard.

**Signature (repo):**
```typescript
export async function getFulfillmentQueue(
  supabase: SupabaseClient,
  repId: string,
  filters?: {
    statusFilter?: FulfillmentStatus;
    limit?: number;
    offset?: number;
  }
): Promise<FulfillmentQueueResult>
```

**Return:**
```typescript
interface FulfillmentQueueResult {
  items: Array<{
    fulfillmentId: string;
    requestId: string;
    customerName: string;
    designName: string;
    itemNumber: string;
    photoUrl: string;
    bpMsrp: number;
    customerDescription: string;
    fulfillmentStatus: FulfillmentStatus;
    approvedAt: string;
    statusUpdatedAt: string;
    shippingNotes?: string;
    daysSinceLastUpdate: number;
  }>;
  totalCount: number;
}
```

**Notes:**
- Pure read operation
- Only returns non-completed fulfillments (active work items)
- Completed items are accessed via `getTradeHistory` instead
- `daysSinceLastUpdate` helps identify stale items in the dashboard UI

---

### File: `lib/services/jewelry-database.ts`

Covers jewelry catalog operations plus internal helpers used by `addListing`.

---

#### `searchJewelryDatabase`

**Purpose:** Search the jewelry catalog by free-text query. Aggregate stats only — no individual rep identification.

**Signature (repo):**
```typescript
export async function searchJewelryDatabase(
  supabase: SupabaseClient,
  repId: string,
  input: {
    query?: string;
    limit?: number;
  }
): Promise<JewelrySearchResult>
```

**Behavior:**
- Free-text search across `design_name`, `material`, and `main_stone` fields
- Returns empty array when `query` is blank
- Uses service client (cross-rep aggregate data) but needs `repId` for the `isOnMyBoard` flag
- GIN fulltext index required for performance (migration 006)

**Privacy rule:** `activeListingsCount` is aggregate only. Reps cannot see WHICH other reps have a piece listed. No individual rep identification.

**Return:**
```typescript
interface JewelrySearchResult {
  designs: Array<{
    designId: string;
    itemNumber: string;
    designName: string;
    collection: string | null;
    material: string;
    mainStone: string;
    bpMsrp: number;
    canonicalPhotoUrl: string | null;
    typePrefix: JewelryType;
    timesTraded: number;
    timesListed: number;
    specialFeatures?: string;
    lengthInfo?: string;
    isOnMyBoard: boolean;
    activeListingsCount: number;
  }>;
  totalCount: number;
}
```

**Future expansion candidates (not built):** itemNumber exact match, collectionFilter, typeFilter, materialFilter, msrpMin/msrpMax, stoneFilter, sortBy/sortOrder. These were in the v1.0 design spec but were not implemented. Add them as needed — each requires a service layer change.

---

#### `resolveItemNumber` (Internal Helper)

**Purpose:** Look up a jewelry design by item number. Used internally by `addListing`.

**Signature (repo):**
```typescript
export async function resolveItemNumber(
  supabase: SupabaseClient,
  itemNumber: string
): Promise<DesignLookupResult>
```

**Return:**
```typescript
interface DesignLookupResult {
  found: boolean;
  design?: JewelryDesign;
  hasCollection: boolean;
  collectionName?: string;
}
```

---

#### `createDesign` (Internal Helper)

**Purpose:** Create a new jewelry design record when it doesn't exist in the database. Used internally by `addListing`.

**Signature (repo):**
```typescript
export async function createDesign(
  supabase: SupabaseClient,
  input: {
    itemNumber: string;
    designName: string;
    material: string;
    mainStone: string;
    bpMsrp: number;
    piecePhotoUrl: string;
    collectionName?: string;
    specialFeatures?: string;
    lengthInfo?: string;
  }
): Promise<JewelryDesign>
```

**Behavior:**
- Extracts `type_prefix` from the first two characters of `itemNumber` (RG, NK, ER, ST, BR)
- If `collectionName` provided → look up or create `collections` row, set `collection_id`
- `piecePhotoUrl` becomes `canonical_photo_url`
- `times_traded` and `times_listed` initialized to 0

---

#### `updateCanonicalPhoto` (Internal Helper)

**Purpose:** Update the canonical photo for a design when a rep uploads a better one.

**Signature (repo):**
```typescript
export async function updateCanonicalPhoto(
  supabase: SupabaseClient,
  designId: string,
  photoUrl: string
): Promise<void>
```

**Notes:**
- Admin-level operation — Louis curates best photos
- Future: Thumper prompts reps "Your photo looks better than what we have. Want to update the database photo?"

---

## Supabase Storage — Jewelry Photos (Task 1.5B)

**Bucket:** `jewelry-photos` (migration 029)
**Access:** Private bucket, server-side upload only

Jewelry photos arrive as base64 image data in Thumper chat message parts. The add_listing tool handler extracts the image from persisted conversation parts, uploads it server-side to the `jewelry-photos` bucket, and passes the resulting URL to the service function.

**Hard constraint (Louis):** Base64 or raw image payloads are NEVER passed into tool arguments. Upload happens server-side from persisted message parts.

**RLS:** Upload scoped to authenticated rep. Read access for canonical photos.

---

## Error Handling

### Error Class

```typescript
// lib/services/errors.ts

export class ServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public userMessage: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}
```

### How Callers Use Errors

**Thumper tool handler:** Catches `ServiceError`, uses `userMessage` as Thumper's conversational response to the rep.

**Dashboard API route:** Catches `ServiceError`, returns JSON `{ error: code, message: userMessage }` with the HTTP `statusCode`.

### Predefined Errors

```typescript
export const Errors = {

  // Input validation
  MISSING_ITEM_INPUT: new ServiceError(
    'MISSING_ITEM_INPUT',
    'No item number or label photo provided',
    'I need either the item number or a photo of the label to get started.',
    400
  ),

  MISSING_PIECE_PHOTO: new ServiceError(
    'MISSING_PIECE_PHOTO',
    'New design requires piece photo for canonical image',
    'This is a new design — I need a photo from your lightbox to add it to the database.',
    400
  ),

  CLICKWRAP_REQUIRED: new ServiceError(
    'CLICKWRAP_REQUIRED',
    'Clickwrap acknowledgment not provided',
    'You need to confirm ownership and MSRP accuracy before listing.',
    400
  ),

  // Listing errors
  LISTING_NOT_FOUND: new ServiceError(
    'LISTING_NOT_FOUND',
    'Trade listing not found or does not belong to this rep',
    'I couldn\'t find that listing on your board.',
    404
  ),

  DUPLICATE_LISTING: new ServiceError(
    'DUPLICATE_LISTING',
    'Design already listed by this rep with status available',
    'You already have this piece on your board. Want to update it instead?',
    409
  ),

  // Trade request errors
  REQUEST_NOT_PENDING: new ServiceError(
    'REQUEST_NOT_PENDING',
    'Trade request is not in pending status',
    'That trade request has already been handled.',
    409
  ),

  REQUEST_ALREADY_EXISTS: new ServiceError(
    'REQUEST_ALREADY_EXISTS',
    'Listing already has a pending trade request from another customer',
    'This piece already has a pending trade request. Check back later — it may become available again.',
    409
  ),

  // Fulfillment errors
  INVALID_STATUS_TRANSITION: new ServiceError(
    'INVALID_STATUS_TRANSITION',
    'Cannot move fulfillment status backwards',
    'You can only move trades forward: approved → shipped → completed.',
    400
  ),

  AMBIGUOUS_CUSTOMER: new ServiceError(
    'AMBIGUOUS_CUSTOMER',
    'Multiple active fulfillments match this customer name',
    'You have more than one active trade with that customer. Which one do you mean?',
    400
  ),

  FULFILLMENT_NOT_FOUND: new ServiceError(
    'FULFILLMENT_NOT_FOUND',
    'Fulfillment record not found',
    'I couldn\'t find that trade in your fulfillment queue.',
    404
  ),

  // Authorization
  UNAUTHORIZED: new ServiceError(
    'UNAUTHORIZED',
    'Rep does not own this resource',
    'Something went wrong — that doesn\'t seem to be yours.',
    403
  ),

} as const;
```

---

## Security: Two Layers

### Layer 1 — Supabase RLS (Database Level)

RLS policies restrict every query to the authenticated rep's data. Even if the service code has a bug, the database won't return another rep's data.

### Layer 2 — Service Function Validation (Application Level)

Every write operation double-checks that the target resource belongs to `repId` before modifying it. Belt and suspenders.

### Supabase Client Strategy

```typescript
// lib/supabase.ts

// For rep-authenticated operations (most service functions)
// Uses the rep's auth token — RLS enforces data isolation
export function createAuthClient(authToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${authToken}` } } }
  );
}

// For cross-rep reads and admin operations ONLY
// Bypasses RLS — use with extreme caution
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**Which client each function uses:**
- `searchJewelryDatabase` → service client (reads aggregate data across all reps)
- `submitTradeRequest` → service client (customer is not authenticated as a rep)
- `resolveItemNumber`, `createDesign` → service client (shared data, not rep-scoped)
- ALL other functions → auth client (rep-scoped operations)

---

## Enum Types (TypeScript)

These mirror the Postgres enums from SS_Supabase_Schema:

```typescript
// lib/services/types.ts

type ListingStatus = 'available' | 'pending_trade' | 'traded' | 'removed';
type TradeRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
type FulfillmentStatus = 'approved' | 'shipped' | 'completed';
type JewelryType = 'RG' | 'NK' | 'ER' | 'ST' | 'BR';
type RemovalReason = 'sold' | 'keeping' | 'mistake' | 'other';
type RejectionReason = 'msrp_mismatch' | 'not_interested' | 'changed_mind' | 'other';
```

---

## Thumper Tool ↔ Service Function Mapping

As of Task 1.5D ship (April 30, 2026), 9 Thumper tools map to these service functions:

| Thumper Tool | Service Function | File | Client | HITL? |
|---|---|---|---|---|
| `add_listing` | `addListing` | trade-board.ts | auth | No |
| `list_my_trade_board` | `getMyBoard` | trade-board.ts | auth | No |
| `remove_listing` | `removeListing` | trade-board.ts | auth | Yes |
| `update_listing` | `updateListing` | trade-board.ts | auth | No |
| `get_trade_requests` | `getTradeRequests` | trade-requests.ts | auth | No |
| `approve_trade` | `approveTrade` | trade-requests.ts | auth | Yes |
| `reject_trade` | `rejectTrade` | trade-requests.ts | auth | Yes |
| `get_trade_history` | `getTradeHistory` | trade-requests.ts | auth | No |
| `search_jewelry_database` | `searchJewelryDatabase` | jewelry-database.ts | service | No |

**Not exposed via Thumper:** `updateFulfillmentStatus`, `getFulfillmentQueue`, `submitTradeRequest` (customer-facing), `resolveItemNumber` (internal), `createDesign` (internal), `updateCanonicalPhoto` (internal).

---

## What This Spec Does NOT Cover

These are handled by OTHER phases and other service modules:

- **Thumper conversation management** — message history, streaming, model routing (Phase 1.1–1.4)
- **Calendar operations** — add/update/cancel events, show cards (Phase 1.6, Phase 4)
- **Site customization** — banner, ticker, tagline, hero image (Phase 1.7)
- **SMS/Email sending** — Telnyx, Resend, wallet billing, content screening (Phase 5)
- **Thumper memory** — rep notes, conversation summaries (Phase 1.9)
- **AI photo enhancement** — pre-flight check, Photoroom API, QA inspector (Phase 7)
- **Onboarding pipeline** — agents, gates, intake form (Phase 8)
- **OCR / label photo extraction** — Thumper handles this BEFORE calling `addListing`. The service function receives the already-extracted item number.
- **MSRP match quality flagging** — Thumper interprets the data returned by `getTradeRequests` and adds its own commentary. Not a service function.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | April 30, 2026 | Aligned to deployed repo after Tasks 1.5A–1.5D. Fixed 3 HIGH drifts (searchJewelryDatabase, getTradeHistory, updateListing signatures). Removed update_fulfillment_status from Thumper scope. Added Supabase Storage jewelry-photos bucket. Added Thumper Tool ↔ Service Function mapping table. All signatures now show `(supabase, repId, ...)` repo pattern. |
| 1.0 | April 11, 2026 | Initial spec. All 10 trade board tools + customer submission + fulfillment queue helper. One-request-per-piece rule (Session #23 decision). Three Postgres RPC functions. Two-layer security. |

---

*This spec is the single source of truth for the Sparkle Suite shared service layer. Claude Code reads this when building Phase 1.5 (Thumper tools), Phase 3 (Trade Board UI), and Phase 6 (Rep Dashboard). Update it when business rules change. Do not update for features still in brainstorming — those go to Open Brain.*
