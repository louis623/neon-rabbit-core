# Sparkle Suite Board Inventory Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current always-visible active board list inside the rep workspace Board Inventory card with a clean search/filter-driven carousel. By default, the card should stay quiet and show only the prompt: "Use search or filters to browse pieces currently on your board." Reps can search, filter by Jewelry Type and Collection, browse matching board pieces in a carousel, reset the browse state, and remove listings without leaving the workspace.

**Architecture:** Keep the customer-facing board grid separate behind the existing "View customer board" action. The rep workspace Board Inventory card becomes a focused lookup/browse tool for active board pieces. Add pure filtering/carousel helpers with unit coverage, then wire the helpers into `TradeBoardWorkspaceCard`. Preserve existing quick-add and remove flows. Use currently active board listings as the data source, and add a controlled "load all active board listings for inventory browsing" path so larger boards do not silently filter only the first paged set.

**Tech Stack:** Next.js App Router, React/TypeScript, CSS Modules, Vitest, existing Nic-Nac trade board APIs/state.

---

## Scope

- [ ] Update the rep workspace Board Inventory card only.
- [ ] Do not change the customer-facing board page or "View customer board" behavior.
- [ ] Do not add sounds, popups, checkout, onboarding, auth, extension work, live queue work, deploys, commits, or pushes.
- [ ] Keep the request inbox placement and Nic-Nac trade request live card behavior intact.

## Acceptance Criteria

- [ ] The Board Inventory header remains `Board Inventory` with the existing live pieces pill.
- [ ] Quick add by item number remains at the top of the Board Inventory body.
- [ ] The typed search remains available and searches pieces already on the active board.
- [ ] Add two placeholder-style dropdowns:
  - [ ] `Jewelry Type`
  - [ ] `Collection`
- [ ] Dropdown options include only values present on active board listings.
- [ ] Selecting either dropdown immediately shows matching board pieces.
- [ ] Selecting both dropdowns narrows results to the intersection.
- [ ] Typed search combines with both dropdown filters.
- [ ] Default state shows no pieces and displays exactly: `Use search or filters to browse pieces currently on your board.`
- [ ] Search/filter active with no matches displays exactly: `No board pieces match this search.`
- [ ] Reset button appears only when search or filters are active.
- [ ] Carousel shows newest-added matching pieces first.
- [ ] Desktop carousel shows 3 items at a time.
- [ ] Mobile carousel shows 1 item at a time.
- [ ] Left/right arrows are disabled at the beginning/end.
- [ ] Carousel displays a count/range indicator such as `Showing 1-3 of 12`.
- [ ] Piece cards include image/fallback, item number, design name, jewelry type, collection, MSRP, and a compact Remove button if it fits without clutter.
- [ ] The old full active-board grid is not shown inside this card; reps use `View customer board` for that view.

## Files

- [ ] Modify `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\board-inventory-view.ts`
  - New pure helper module.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Wire Board Inventory filters, carousel state, reset behavior, and optional load-all hook.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`
  - Add responsive Board Inventory controls and carousel styles.
- [ ] Add `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-board-inventory-view.test.ts`
  - Unit tests for helper behavior.
- [ ] Update `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`
  - Static UI contract tests for the workspace card.

## Implementation Steps

### 1. Start From The Active Workbench

- [ ] Switch all implementation work to `C:\Users\louis\sparkle-suite-repo`.
- [ ] Check current worktree status before editing:

```powershell
git -C C:\Users\louis\sparkle-suite-repo status --short
```

- [ ] Read the current Board Inventory code in:
  - `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`

### 2. Add Pure Board Inventory Helpers First

- [ ] Create `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-board-inventory-view.test.ts`.
- [ ] Cover these behaviors before implementation:
  - [ ] No active search/filter returns no visible results.
  - [ ] Default prompt state is represented by helper state, not by showing all pieces.
  - [ ] Jewelry type options come only from available board listings.
  - [ ] Collection options come only from available board listings.
  - [ ] Search matches item number, design name, jewelry type, and collection.
  - [ ] Jewelry type and collection filters combine.
  - [ ] Results sort newest added first.
  - [ ] Carousel window clamps start index and disables arrows at boundaries.
  - [ ] Count label formats as `Showing 1-3 of 12`.

Expected helper shape:

```ts
export type BoardInventoryFilters = {
  search: string
  jewelryType: string
  collection: string
}

export type BoardInventoryOptions = {
  jewelryTypes: string[]
  collections: string[]
}

export function hasActiveBoardInventoryBrowse(filters: BoardInventoryFilters): boolean

export function getBoardInventoryOptions(
  listings: TradeListingWithDesign[],
): BoardInventoryOptions

export function getBoardInventoryResults(
  listings: TradeListingWithDesign[],
  filters: BoardInventoryFilters,
): TradeListingWithDesign[]

export function getCarouselWindow<T>(
  items: T[],
  startIndex: number,
  pageSize: number,
): {
  startIndex: number
  endIndex: number
  visibleItems: T[]
  canGoPrevious: boolean
  canGoNext: boolean
  rangeLabel: string
}
```

- [ ] Implement `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\board-inventory-view.ts`.
- [ ] Treat only `status === 'available'` listings as browsable inventory.
- [ ] Normalize matching with trim/lowercase.
- [ ] Sort dropdown option labels alphabetically.
- [ ] Sort results by `listed_at` descending, with stable fallback by item number.

### 3. Wire Filters And Carousel Into The Workspace Card

- [ ] In `TradeBoardWorkspaceCard`, keep the existing quick-add form unchanged.
- [ ] Reuse the existing `tradeBoardSearchQuery` prop for the search input.
- [ ] Add local filter/carousel state:

```tsx
const [inventoryJewelryType, setInventoryJewelryType] = useState('')
const [inventoryCollection, setInventoryCollection] = useState('')
const [inventoryCarouselIndex, setInventoryCarouselIndex] = useState(0)
```

- [ ] Derive filters and results from the new helper:

```tsx
const inventoryFilters = {
  search: tradeBoardSearchQuery,
  jewelryType: inventoryJewelryType,
  collection: inventoryCollection,
}
const hasActiveInventoryBrowse = hasActiveBoardInventoryBrowse(inventoryFilters)
const inventoryOptions = getBoardInventoryOptions(boardListings)
const inventoryResults = getBoardInventoryResults(boardListings, inventoryFilters)
const carouselPageSize = 3
const carousel = getCarouselWindow(inventoryResults, inventoryCarouselIndex, carouselPageSize)
```

- [ ] Reset carousel index whenever search/filter/result count changes:

```tsx
useEffect(() => {
  setInventoryCarouselIndex(0)
}, [tradeBoardSearchQuery, inventoryJewelryType, inventoryCollection, inventoryResults.length])
```

- [ ] Add reset behavior:

```tsx
function handleResetInventoryBrowse() {
  onTradeBoardSearchQueryChange('')
  setInventoryJewelryType('')
  setInventoryCollection('')
  setInventoryCarouselIndex(0)
}
```

- [ ] Replace the old full `tradePieceGrid` rendering with:
  - [ ] default prompt when inactive
  - [ ] no-match prompt when active with zero matches
  - [ ] carousel when active with matches

### 4. Add Dropdown Controls

- [ ] Place dropdowns directly below `Search your active board`.
- [ ] Use placeholder-style select controls, not large decorative pills.
- [ ] Keep the first option selectable so reps can clear either filter independently:

```tsx
<select
  aria-label="Jewelry Type"
  value={inventoryJewelryType}
  onChange={(event) => setInventoryJewelryType(event.target.value)}
>
  <option value="">Jewelry Type</option>
  {inventoryOptions.jewelryTypes.map((type) => (
    <option key={type} value={type}>
      {type}
    </option>
  ))}
</select>
```

- [ ] Mirror the same pattern for `Collection`.
- [ ] Disable a dropdown only when there are no active board listings at all.
- [ ] Show the reset button only when `hasActiveInventoryBrowse` is true.

### 5. Preserve Larger Inventory Correctness

- [ ] Inspect the current trade board pagination path in `DashboardPlaceholder.tsx` before wiring the final browse behavior.
- [ ] If the active board can have more listings than the initial loaded page, add a parent-level handler that drains the existing trade board pagination in controlled pages when browse starts.
- [ ] Pass that handler into `TradeBoardWorkspaceCard` as an optional prop:

```ts
onEnsureInventoryBrowseLoaded?: () => Promise<void>
isInventoryBrowseLoading?: boolean
```

- [ ] Trigger the handler when search or filters become active and `hasMoreListings` is still true:

```tsx
useEffect(() => {
  if (!hasActiveInventoryBrowse || !hasMoreListings) return
  void onEnsureInventoryBrowseLoaded?.()
}, [hasActiveInventoryBrowse, hasMoreListings, onEnsureInventoryBrowseLoaded])
```

- [ ] Guard the parent loader against duplicate concurrent loads with a ref.
- [ ] Stop loading if a page returns zero new listings.
- [ ] Do not show the old full grid while loading more pages.
- [ ] Show a compact loading line near the carousel controls only while inventory browse loading is active, such as `Loading board pieces...`.

### 6. Build The Carousel UI

- [ ] Use existing piece image/fallback rendering where possible.
- [ ] Reuse existing remove handler and pending remove state.
- [ ] Keep cards compact enough for three across on desktop.
- [ ] Include these fields on each card:
  - [ ] image or fallback
  - [ ] item number
  - [ ] design name
  - [ ] jewelry type
  - [ ] collection
  - [ ] MSRP
  - [ ] Remove button
- [ ] Keep image click preview only if the existing preview code remains clean and does not add clutter.
- [ ] Arrow behavior:

```tsx
<button
  type="button"
  disabled={!carousel.canGoPrevious}
  onClick={() => setInventoryCarouselIndex(Math.max(0, carousel.startIndex - carouselPageSize))}
>
  Previous
</button>
```

```tsx
<button
  type="button"
  disabled={!carousel.canGoNext}
  onClick={() => setInventoryCarouselIndex(carousel.startIndex + carouselPageSize)}
>
  Next
</button>
```

- [ ] Use visible text labels or existing icon conventions that fit the current workspace styling.

### 7. Add Responsive CSS

- [ ] Add CSS Module classes for:
  - [ ] filter row
  - [ ] select controls
  - [ ] reset button
  - [ ] carousel header/count row
  - [ ] arrow buttons
  - [ ] carousel viewport
  - [ ] carousel item layout
  - [ ] empty/default message
- [ ] Desktop: three item cards in one row.
- [ ] Mobile: one item card per row/window.
- [ ] Use stable dimensions so image loading, remove pending state, and long item names do not shift the panel.
- [ ] Ensure long item numbers and collection names wrap cleanly.
- [ ] Avoid turning the whole section into nested cards; only the repeated piece items should be card-like.

### 8. Update Static UI Contract Tests

- [ ] Extend `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`.
- [ ] Verify the source contains:
  - [ ] `Use search or filters to browse pieces currently on your board.`
  - [ ] `Jewelry Type`
  - [ ] `Collection`
  - [ ] `No board pieces match this search.`
  - [ ] carousel range behavior or helper usage
  - [ ] reset behavior
- [ ] Verify the old summary metrics remain absent.
- [ ] Verify the old full active-board grid is not the default Board Inventory behavior.

### 9. Run Focused Verification

- [ ] Run targeted unit/static tests from the active repo:

```powershell
npm exec vitest run tests/nic-nac-board-inventory-view.test.ts tests/reviewer-smoke-ui.test.ts
```

- [ ] Run the broader focused Nic-Nac suite if those tests pass:

```powershell
npm exec vitest run tests/nic-nac-board-inventory-view.test.ts tests/reviewer-smoke-ui.test.ts tests/nic-nac-trade-request-notifications.test.ts tests/nic-nac-client-message-refresh.test.ts tests/nic-nac-persistence.test.ts tests/nic-nac-trade-request-card-parts.test.ts tests/nic-nac-chat-body-ui.test.ts
```

- [ ] If `npx tsc --noEmit --pretty false` still fails from known unrelated repository issues, capture and report only the relevant new errors, if any.

### 10. Browser Smoke Review

- [ ] Use the in-app browser against the existing local workspace URL:

```text
http://localhost:3001/nic-nac?conversationId=45764110-0330-4a5d-964b-5b5ff49fb662
```

- [ ] Verify empty-board/default review state:
  - [ ] Board Inventory appears below Request inbox.
  - [ ] Quick add remains usable visually.
  - [ ] Search input remains visible.
  - [ ] Dropdowns show `Jewelry Type` and `Collection`.
  - [ ] Default prompt is visible.
  - [ ] Reset is hidden.
  - [ ] No old full grid is visible.
- [ ] Verify desktop layout has no overlapping text or controls.
- [ ] Verify mobile layout shows one carousel item at a time when test data is available.
- [ ] If local data has no board pieces, rely on helper/unit tests for carousel behavior and document that the browser smoke covered empty/default workspace behavior only.

## Notes For Implementation Agent

- [ ] This is an agent-driven implementation, but keep the blast radius small.
- [ ] Do not touch protected live queue extension files.
- [ ] Do not rerun onboarding or checkout.
- [ ] Do not deploy, commit, or push unless Louis explicitly asks for that after review.
- [ ] Preserve the calm workspace feel: this is a lookup tool for a rep in the middle of a show, not a catalog page.
