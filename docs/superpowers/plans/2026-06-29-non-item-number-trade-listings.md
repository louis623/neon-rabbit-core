# Non-Item-Number Trade Listings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let reps add Trade Board pieces through Nic-Nac when they do not have an item number, without writing those pieces to the shared jewelry database, while customers experience them as ordinary Trade Board listings.

**Architecture:** Keep one Trade Board lifecycle. Add a nullable catalog relationship and listing-local controlled fields on `trade_listings`, then normalize catalog-backed and non-item-number rows into one shared display model for public Trade Board, requests, history, fulfillment, and Nic-Nac. Nic-Nac owns the V1 creation path and branches inside the existing add-listing workflow.

**Tech Stack:** Next.js app in this repo, Supabase/Postgres migrations and RPCs, TypeScript services, Amethyst public customer templates, Nic-Nac workflow/tool layer, Vitest, Playwright/reviewer smoke scripts, Vercel stable demo.

---

## Scope Guardrails

- [ ] Customer-facing pages must never label these listings as different.
- [ ] Rep/Nic-Nac surfaces may say `(non-item number piece)` when it helps explain missing catalog data.
- [ ] V1 is Nic-Nac only.
- [ ] V1 is one piece at a time.
- [ ] V1 has no board-photo batch cropper, no bulk importer, no dashboard manual form, and no conversion path.
- [ ] Non-item-number listings must never create or update `jewelry_designs`.
- [ ] Normal item-number listings must keep their existing catalog-backed behavior.
- [ ] Sparkle Finder/catalog/library intake must exclude non-item-number listings in V1.

Forbidden customer-facing words and phrases:

- `legacy`
- `miscellaneous`
- `grab bag`
- `unknown`
- `undocumented`
- `Board Pieces`
- `non-item number`
- `piece without item number`

Forbidden implementation shortcuts:

- fake item numbers such as `UNKNOWN`, `MANUAL`, `N/A`, `NOITEM`, or generated placeholders;
- scattering nullable `design` checks across UI code instead of using a normalized listing display model;
- silently branching to non-item-number mode without confirmation when the user provided only a photo and no visible item number;
- claiming Nic-Nac added a listing before the write tool succeeds.

---

## Subagent Audit Summary

- [ ] Schema/service audit: `trade_listings.design_id` is currently `NOT NULL`, `getMyBoard` drops no-design rows, and `rpc_approve_trade` increments `jewelry_designs.times_traded`; all need mode-aware updates.
- [ ] Public/customer audit: public Amethyst loaders and route tests must prove non-item-number listings appear in the same grid, filters, search, ticker inputs, and request flow without source language leaks.
- [ ] Nic-Nac audit: workflow state, tool routing, tool-choice policy, prompts, and final mutation gates need an explicit `catalogMode: item_number | non_item_number` branch inside the existing add Trade Board piece flow.
- [ ] Verification audit: add focused Vitest coverage, a dedicated Nic-Nac smoke script, a pressure script, stable demo reviewer smoke, and cleanup assertions for synthetic data.

---

## Phase 0: Baseline And Safety Checks

- [ ] Confirm workspace and branch.

```powershell
git status --short --branch
```

- [ ] Read current memory before implementation begins.

```powershell
Get-Content AGENTS.md
Get-Content vault\project-state.md
Get-Content vault\session-log.md
Get-Content vault\decisions.md
Get-Content vault\open-items.md
```

- [ ] Use required skills before coding:
  - `sparkle-nic-nac-agent-architecture` for Nic-Nac workflow/tool changes.
  - `sparkle-suite-demo-smoke` for Trade Board, Nic-Nac UI, customer-site, stable demo, and reviewer-smoke verification.
  - `superpowers:subagent-driven-development` for parallel implementation and review.
  - `superpowers:test-driven-development` for the first failing tests.
  - `superpowers:verification-before-completion` before calling the work ready.
- [ ] Read relevant Next.js docs from `node_modules/next/dist/docs/` before changing route handlers or app routes, per `AGENTS.md`.
- [ ] Confirm no Chrome Web Store or local extension files are touched.

---

## Phase 1: Lock The Contract With Tests First

- [ ] Add migration contract tests in `tests/non-item-number-trade-listings-migration.test.ts`.
  - [ ] Catalog listings require `design_id`.
  - [ ] Non-item-number listings require listing-local type, broad collection, and photo URL.
  - [ ] Ring-like non-item-number listings require size.
  - [ ] `design_id` may be null only for `listing_source = 'non_item_number'`.
  - [ ] No fake item-number columns or placeholder values are introduced.
- [ ] Add service contract tests in `tests/services/non-item-number-trade-listings.test.ts`.
  - [ ] Create non-item-number listing without writing `jewelry_designs`.
  - [ ] Create catalog-backed listing using the existing path unchanged.
  - [ ] Mixed board read returns both modes.
  - [ ] Remove and restore work through `trade_listings.id`.
  - [ ] Customer request submission works through `trade_requests.listing_id`.
  - [ ] Duplicate customer request guard works for non-item-number listings.
- [ ] Extend existing service tests:
  - [ ] `tests/services/trade-board-add-listing.test.ts`
  - [ ] `tests/services/trade-listing-recovery.test.ts`
  - [ ] `tests/services/trade-requests-submit.test.ts`
  - [ ] `tests/services/trade-fulfillment-service.test.ts`
- [ ] Add public/customer tests:
  - [ ] `tests/amethyst-trade-template.test.ts`
  - [ ] `tests/amethyst-trade-filters.test.ts`
  - [ ] `tests/amethyst-trade-board-route.test.ts`
  - [ ] `tests/amethyst-trade-request-route.test.ts`
  - [ ] `tests/amethyst-homepage-template.test.ts`
  - [ ] `tests/amethyst-join-template.test.ts`
- [ ] Public tests must assert:
  - [ ] mixed catalog and non-item-number listings render in one grid;
  - [ ] search works by collection, type, and size;
  - [ ] filters work by collection, type, and size;
  - [ ] request flow is identical for both modes;
  - [ ] no forbidden customer-facing language appears in route payloads, HTML, templates, tickers, or request sheets.
- [ ] Add Nic-Nac workflow tests:
  - [ ] `tests/nic-nac/non-item-number-trade-listing-workflow.test.ts`
  - [ ] `tests/nic-nac/trade-board-intake-controller.test.ts`
  - [ ] `tests/nic-nac/trade-board-intake-store.test.ts`
  - [ ] `tests/nic-nac/trade-board-intake-route-context.test.ts`
  - [ ] `tests/nic-nac/prepare-trade-board-work.test.ts`
  - [ ] `tests/nic-nac/tool-routing.test.ts`
  - [ ] `tests/nic-nac/tool-choice-policy.test.ts`
  - [ ] `tests/nic-nac/trade-board-intake-eval.test.ts`
- [ ] Nic-Nac tests must assert:
  - [ ] user can say they do not have an item number;
  - [ ] photo-only with no visible item number asks for confirmation before branching;
  - [ ] final form title is exactly `Collection Type and Size`;
  - [ ] required controlled fields are `jewelry type`, `collection`, and size when applicable;
  - [ ] broad collection is required and exact collection is optional;
  - [ ] successful write uses non-item-number service/tool only;
  - [ ] no `createDesign`, catalog creation, fake item number, or jewelry DB write happens in the non-item branch;
  - [ ] normal item-number branch still resolves and adds catalog listings.
- [ ] Add rep-side request/detail tests:
  - [ ] `tests/nic-nac/trade-requests.test.ts`
  - [ ] `tests/nic-nac/trade-request-notifications.test.ts`
  - [ ] `tests/nic-nac-trade-request-live-card.test.ts`
  - [ ] `tests/nic-nac-dashboard-placeholder.test.ts`
  - [ ] `tests/nic-nac-board-inventory-view.test.ts`
  - [ ] `tests/nic-nac-trade-history-route.test.ts`
  - [ ] `tests/nic-nac/fulfillment-queue-route.test.ts`
- [ ] Run the new failing tests before implementation and record expected failures in the implementation notes.

```powershell
npm exec vitest run tests/non-item-number-trade-listings-migration.test.ts tests/services/non-item-number-trade-listings.test.ts tests/nic-nac/non-item-number-trade-listing-workflow.test.ts
```

---

## Phase 2: Database Migration And RPC Updates

- [ ] Add a new migration under `supabase/migrations/` for non-item-number trade listings.
- [ ] Update `trade_listings`:
  - [ ] make `design_id` nullable;
  - [ ] add `listing_source` with allowed values `catalog` and `non_item_number`;
  - [ ] backfill existing rows to `listing_source = 'catalog'`;
  - [ ] add listing-local fields:
    - [ ] `manual_type_prefix`;
    - [ ] `manual_collection_family`;
    - [ ] `manual_collection_name`;
    - [ ] `manual_size`;
    - [ ] `manual_photo_url`.
- [ ] Add check constraints:
  - [ ] catalog rows require `design_id`;
  - [ ] non-item-number rows require null `design_id`;
  - [ ] non-item-number rows require type, broad collection, and photo URL;
  - [ ] ring rows require `manual_size`;
  - [ ] `listing_source` cannot be null.
- [ ] Update indexes:
  - [ ] keep or replace `idx_listings_design` as a partial catalog index;
  - [ ] add `idx_trade_listings_catalog_design` on `design_id` for catalog rows;
  - [ ] add `idx_trade_listings_rep_source_status` on `rep_id`, `listing_source`, and `status`.
- [ ] Update `rpc_approve_trade` so catalog metrics update only when `design_id` is present.
- [ ] Confirm `rpc_submit_trade_request`, `rpc_reject_trade`, fulfillment tables, `trade_swaps`, and RLS policies do not rely on `design_id` being present.
- [ ] Update seed/test fixtures where `trade_listings` inserts now require `listing_source` or listing-local fields.
- [ ] Run migration tests.

```powershell
npm exec vitest run tests/non-item-number-trade-listings-migration.test.ts
```

---

## Phase 3: Normalize Trade Listing Types And Services

- [ ] Update `lib/services/types.ts`.
  - [ ] Add `listingSource`.
  - [ ] Add a normalized display type for both catalog-backed and non-item-number listings.
  - [ ] Keep catalog design details available for internal catalog rows.
  - [ ] Prevent public payloads from exposing source labels.
- [ ] Add shared display helpers in `lib/services/trade-listing-display.ts`.
  - [ ] Compute public name from exact collection when available, otherwise broad collection family, then type, then size.
  - [ ] Normalize collection, type, size, photo URL, status, notes, requestability, and id.
  - [ ] Provide a rep-facing clarification string only for internal views.
- [ ] Update `lib/services/trade-board.ts`.
  - [ ] Change `LISTING_SELECT` so non-item-number rows are not dropped by design joins.
  - [ ] Update `getMyBoard` and public board readers to return normalized rows.
  - [ ] Keep `addListing` and `addListingBatch` catalog-backed.
  - [ ] Add `addNonItemNumberListing` or `addManualTradeListing` as a dedicated write path.
  - [ ] Validate controlled fields before insert.
  - [ ] Ensure non-item-number writes never call catalog design creation/update code.
- [ ] Update request lifecycle services:
  - [ ] `lib/services/trade-requests.ts`
  - [ ] `lib/services/trade-fulfillment.ts`
  - [ ] notification summary helpers;
  - [ ] history helpers.
- [ ] Update customer-site data mapping:
  - [ ] `lib/amethyst/trade-board-listings.ts`
  - [ ] ticker input helpers for homepage/join/trade templates.
- [ ] Update Sparkle Finder exclusion:
  - [ ] `lib/sparkle-finder/public-api.ts` must exclude `listing_source = 'non_item_number'` in V1.
- [ ] Run focused service tests.

```powershell
npm exec vitest run tests/services/trade-board-add-listing.test.ts tests/services/trade-requests-submit.test.ts tests/services/trade-listing-recovery.test.ts tests/services/trade-fulfillment-service.test.ts tests/services/non-item-number-trade-listings.test.ts
```

---

## Phase 4: Public Trade Board And Customer Routes

- [ ] Update public Amethyst loaders and route handlers:
  - [ ] `app/api/amethyst/trade-board/route.ts`
  - [ ] `app/api/amethyst/trade-template/route.ts`
  - [ ] `app/api/amethyst/homepage-template/route.ts`
  - [ ] `app/api/amethyst/join-template/route.ts`
  - [ ] `app/[publicSiteSlug]/trade/route.ts`
- [ ] Keep public rendering unchanged in spirit:
  - [ ] one grid;
  - [ ] one search box;
  - [ ] same collection/type/size filters;
  - [ ] same request flow;
  - [ ] no source badge, tab, section, or explanation.
- [ ] Confirm `public/amethyst/trade.jsx` can consume the normalized fields without customer-facing source labels.
- [ ] Confirm `public/amethyst/homepage.jsx` and `public/amethyst/join.jsx` ticker inputs include the same normalized item text rules already expected for Trade Board tickers.
- [ ] Add regression assertions that customer-facing source terms do not appear in HTML, JSON payloads, or visible strings.
- [ ] Run public focused tests.

```powershell
npm exec vitest run tests/amethyst-trade-template.test.ts tests/amethyst-trade-filters.test.ts tests/amethyst-trade-board-route.test.ts tests/amethyst-trade-request-route.test.ts tests/amethyst-homepage-template.test.ts tests/amethyst-join-template.test.ts tests/public-site-slug-route.test.ts
```

---

## Phase 5: Nic-Nac Workflow, Tools, And Prompts

- [ ] Update workflow state types:
  - [ ] `lib/nic-nac/workflows/trade-board-intake-types.ts`
  - [ ] add `catalogMode: item_number | non_item_number`;
  - [ ] add controlled fields for type, broad collection, exact collection, size, and photo role/quality;
  - [ ] represent confirmation state for "I do not see an item number in this photo. Do you want me to add it as a non-item number piece?"
- [ ] Update workflow controller/store/context:
  - [ ] `lib/nic-nac/workflows/trade-board-intake-controller.ts`
  - [ ] `lib/nic-nac/workflows/trade-board-intake-store.ts`
  - [ ] `lib/nic-nac/workflows/trade-board-intake-context.ts`
  - [ ] `lib/nic-nac/workflows/trade-board-intake-eval.ts`
- [ ] Update prompt guidance:
  - [ ] `lib/nic-nac/workflows/trade-board-intake-prompt.ts`
  - [ ] ask for either item number or clear customer-facing piece photo;
  - [ ] if no item number is visible, ask the confirmation question before branching;
  - [ ] use form title `Collection Type and Size`;
  - [ ] allow `(non-item number piece)` only in rep-facing clarification;
  - [ ] forbid invented item numbers and jewelry DB creation for this branch.
- [ ] Update tools:
  - [ ] `lib/nic-nac/tools/prepare-trade-board-work.ts`
  - [ ] `lib/nic-nac/tools/add-listing.ts`
  - [ ] `lib/nic-nac/tools/list-my-trade-board.ts`
  - [ ] `lib/nic-nac/tools/get-trade-requests.ts`
  - [ ] `lib/nic-nac/tools/get-trade-history.ts`
  - [ ] `lib/nic-nac/tools/get-fulfillment-queue.ts`
  - [ ] `lib/nic-nac/tools/index.ts`
- [ ] Update tool routing and tool-choice policy:
  - [ ] `lib/nic-nac/tool-choice-policy.ts`
  - [ ] active workflow keeps the Trade Board write path available until terminal state;
  - [ ] catalog mode uses catalog resolve/add tools;
  - [ ] non-item-number mode uses the dedicated non-item-number write path only.
- [ ] Update rep-side display components:
  - [ ] `app/nic-nac/components/DashboardPlaceholder.tsx`
  - [ ] `app/nic-nac/components/TradeRequestLiveCard.tsx`
  - [ ] `lib/nic-nac/trade-request-card-parts.ts`
  - [ ] `lib/nic-nac/trade-request-notifications.ts`
  - [ ] `lib/nic-nac/board-inventory-view.ts`
- [ ] Run Nic-Nac focused tests.

```powershell
npm exec vitest run tests/nic-nac/non-item-number-trade-listing-workflow.test.ts tests/nic-nac/prepare-trade-board-work.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac/tool-choice-policy.test.ts tests/nic-nac/trade-board-intake-route-context.test.ts tests/nic-nac/trade-board-intake-controller.test.ts tests/nic-nac/trade-board-intake-store.test.ts tests/nic-nac/trade-board-intake-eval.test.ts
```

- [ ] Run rep-side focused tests.

```powershell
npm exec vitest run tests/nic-nac/trade-requests.test.ts tests/nic-nac/trade-request-notifications.test.ts tests/nic-nac-trade-request-live-card.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-board-inventory-view.test.ts tests/nic-nac-trade-board-route.test.ts tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-trade-history-route.test.ts tests/nic-nac/fulfillment-queue-route.test.ts
```

---

## Phase 6: Reviewer Smoke And Pressure Scripts

- [ ] Keep the existing catalog-backed smoke script passing.

```powershell
npm run smoke:nic-nac:trade-board-intake
```

- [ ] Add `scripts/smoke-nic-nac-trade-board-non-item-number.ts`.
- [ ] Add package script:

```json
"smoke:nic-nac:trade-board-non-item-number": "tsx scripts/smoke-nic-nac-trade-board-non-item-number.ts"
```

- [ ] The non-item smoke must use reviewer/synthetic data and must not use Louis's personal browser/session.
- [ ] Smoke path:
  - [ ] start from `/start` or the existing reviewer-smoke entry;
  - [ ] open synthetic rep workspace;
  - [ ] ask Nic-Nac to add a Trade Board piece;
  - [ ] provide a clear single-piece photo with no item number;
  - [ ] confirm non-item-number branch;
  - [ ] provide jewelry type, broad collection, optional exact collection, and size when applicable;
  - [ ] verify tool success;
  - [ ] verify the public Trade Board card appears in normal search/filter results;
  - [ ] submit a customer request for the non-item-number listing;
  - [ ] verify rep request detail can show `(non-item number piece)`;
  - [ ] cleanup all synthetic rows and storage objects.
- [ ] Add `scripts/pressure-non-item-number-trade-listings.ts`.
- [ ] Add package script:

```json
"pressure:non-item-number-trade-listings": "tsx scripts/pressure-non-item-number-trade-listings.ts"
```

- [ ] Pressure script assertions:
  - [ ] `jewelry_designs` row count unchanged after non-item adds;
  - [ ] no fake item numbers;
  - [ ] catalog `times_listed` and `times_traded` are untouched by non-item rows;
  - [ ] public board search/filter/load-more sees both modes together;
  - [ ] request submit, duplicate guard, approve, deny, remove, restore, and history work through `listing_id`;
  - [ ] cross-rep leakage is zero;
  - [ ] forbidden customer-facing words do not appear in public payloads;
  - [ ] cleanup leaves no synthetic rows or storage objects.
- [ ] Use deterministic synthetic prefixes, for example `non_item_smoke_<timestamp>`, across emails, business names, notes, request customers, and storage paths.

---

## Phase 7: Full Local Verification

- [ ] Run TypeScript and lint/build checks used by this repo.

```powershell
npx tsc --noEmit --pretty false
npm run build
```

- [ ] Run focused non-item test suite.

```powershell
npm exec vitest run tests/non-item-number-trade-listings-migration.test.ts tests/services/non-item-number-trade-listings.test.ts tests/nic-nac/non-item-number-trade-listing-workflow.test.ts
```

- [ ] Run service, public, and Nic-Nac regression bundles.

```powershell
npm exec vitest run tests/services/trade-board-add-listing.test.ts tests/services/trade-requests-submit.test.ts tests/services/trade-listing-recovery.test.ts tests/services/trade-fulfillment-service.test.ts
npm exec vitest run tests/amethyst-trade-template.test.ts tests/amethyst-trade-filters.test.ts tests/amethyst-trade-board-route.test.ts tests/amethyst-trade-request-route.test.ts tests/amethyst-homepage-template.test.ts tests/amethyst-join-template.test.ts tests/public-site-slug-route.test.ts
npm exec vitest run tests/nic-nac/prepare-trade-board-work.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac/tool-choice-policy.test.ts tests/nic-nac/trade-board-intake-route-context.test.ts tests/nic-nac/trade-board-intake-controller.test.ts tests/nic-nac/trade-board-intake-store.test.ts tests/nic-nac/trade-board-intake-eval.test.ts tests/nic-nac/trade-requests.test.ts tests/nic-nac-trade-board-route.test.ts tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-trade-history-route.test.ts tests/nic-nac/fulfillment-queue-route.test.ts
```

- [ ] Run smoke and pressure scripts locally against a local app URL.

```powershell
$env:SPARKLE_NIC_NAC_SMOKE_APP_URL='http://localhost:3000'; npm run smoke:nic-nac:trade-board-intake
$env:SPARKLE_NIC_NAC_SMOKE_APP_URL='http://localhost:3000'; npm run smoke:nic-nac:trade-board-non-item-number
$env:SPARKLE_NIC_NAC_PRESSURE_APP_URL='http://localhost:3000'; npm run pressure:non-item-number-trade-listings
```

- [ ] Inspect generated screenshots, logs, and cleanup output.
- [ ] Search the codebase for forbidden customer-facing language regressions in public Trade Board paths.

```powershell
rg -n "legacy|miscellaneous|grab bag|unknown|undocumented|Board Pieces|non-item number|piece without item number" app public lib tests scripts
```

- [ ] Review every match and confirm customer-facing matches are absent while rep-facing/tests are intentional.

---

## Phase 8: Deploy And Stable Demo Verification

- [ ] Deploy a Vercel preview only after local verification passes.
- [ ] Apply Supabase migration to the correct demo database after reviewing migration impact.
- [ ] Promote or confirm `https://sparkle-suite-demo.vercel.app` points to the intended deployment before telling Louis it is ready.
- [ ] Run stable demo smoke with reviewer/synthetic data, not Louis's personal browser/session.
- [ ] Stable demo customer-facing routes to verify:
  - [ ] `https://sparkle-suite-demo.vercel.app/milehighfizz/trade`
  - [ ] `https://sparkle-suite-demo.vercel.app/louisfizzfest/trade`
  - [ ] `https://sparkle-suite-demo.vercel.app/amethyst/Trade.html`
- [ ] Stable demo reviewer flow to verify:
  - [ ] reviewer-smoke login/setup;
  - [ ] Nic-Nac add catalog-backed listing still works;
  - [ ] Nic-Nac add non-item-number listing works;
  - [ ] public Trade Board search/filter/request works for both listing modes;
  - [ ] rep request detail clarifies non-item-number listing;
  - [ ] cleanup/reset path works.
- [ ] Do not call the feature live until the stable alias is verified with the exact affected routes/assets.

---

## Phase 9: Documentation And Memory

- [ ] Update `vault/session-log.md` with:
  - [ ] implementation summary;
  - [ ] verification commands and results;
  - [ ] stable demo URL and route verification;
  - [ ] any residual risks.
- [ ] Update `vault/decisions.md` if implementation creates a lasting architecture decision beyond the existing spec.
- [ ] Update `vault/open-items.md` only for true remaining follow-up items.
- [ ] Record reviewer-smoke reset/cleanup instructions if scripts introduce a new synthetic data pattern.
- [ ] Commit implementation and docs separately if practical:
  - [ ] implementation checkpoint;
  - [ ] docs/memory checkpoint.

---

## Parallel Execution Strategy

- [ ] Subagent A: database migration, RPC, fixtures, and migration tests.
- [ ] Subagent B: service normalization, public board loaders, request lifecycle, and customer tests.
- [ ] Subagent C: Nic-Nac workflow state, prompts, tools, routing, and Nic-Nac tests.
- [ ] Subagent D: smoke/pressure scripts, forbidden-language sweep, cleanup assertions, and verification matrix.
- [ ] Main agent: coordinate contracts between subagents, review diffs, run full verification, resolve integration conflicts, deploy, and verify stable demo.

Subagents must not implement conflicting display models. The shared contract is the normalized listing display type from Phase 3.

---

## Completion Criteria

- [ ] Schema supports both listing modes with constraints.
- [ ] Non-item-number listings write only to rep-owned Trade Board listing records.
- [ ] Item-number listings keep current catalog behavior.
- [ ] Public Trade Board experience is indistinguishable between listing modes.
- [ ] Customer search, filters, request sheet, ticker inputs, and route payloads work for both modes.
- [ ] Rep/Nic-Nac request details clarify non-item-number listings where helpful.
- [ ] Nic-Nac branch is controlled, confirmed, one-piece-at-a-time, and tool-gated.
- [ ] Sparkle Finder does not ingest or expose non-item-number listings in V1.
- [ ] All focused tests, build checks, local smoke, pressure script, and stable demo reviewer smoke pass.
- [ ] Stable demo alias is confirmed before reporting readiness.
- [ ] Memory/docs reflect the implemented behavior and verification evidence.
