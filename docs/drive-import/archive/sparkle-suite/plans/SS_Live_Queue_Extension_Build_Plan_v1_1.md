# Sparkle Suite — Live Reveal Queue Chrome Extension Build Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (primary), Claude Code (build execution)
🔄 UPDATE TRIGGER: Extension rebuild, architecture change, or Chrome Web Store submission

**Version:** 1.1 | **Created:** April 10, 2026 | **Last Updated:** April 10, 2026 | **Status:** ACTIVE — Extension built and tested. Website component rewire next.

---

## What This Is

A Chrome Web Store extension that scrapes the Bomb Party "Party Orders" dashboard and pushes the live reveal queue to each rep's Sparkle Suite website via Supabase. Replaces the old sideloaded Gemini-built extension that had browser refresh bugs.

**Current clients deployed to:** Lindsey (Mile High Fizz) — tested and working
**Remaining clients:** Brittany (BrittwithBling), Bri (Bri's Glowtique), Heather (The Bling Kitchen), Kara (Sprinkled in Diamonds)

---

## Architecture

```
Rep's PC (Chrome)                    Server                          Customer's Phone
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────────┐
│ Bomb Party       │          │ Supabase          │          │ Rep's Sparkle Suite  │
│ Dashboard        │          │ (neon-rabbit-core) │          │ Website              │
│                  │          │                    │          │                      │
│ Party Orders ────┼── ext ──▶│ Edge Function      │          │ Live Queue Card      │
│ table            │  reads   │ live-queue-sync    │          │                      │
│                  │  names   │       │            │          │ Reads from Supabase  │
│ (never touched)  │  &       │       ▼            │◀─────────│ via Realtime         │
│                  │  pushes  │ live_queue table   │  subscribes                     │
└─────────────────┘          └──────────────────┘          └─────────────────────┘
```

**Old architecture (eliminated):**
Chrome extension → Google Apps Script (per-client) → Website polls GAS URL

**New architecture (live):**
Chrome extension → Supabase Edge Function (single endpoint) → live_queue table → Website reads via Supabase Realtime

**What the new architecture eliminates:**
- Per-client Google Apps Script deployments
- Per-client code customization (sync code configured once in popup)
- 60-second polling delay (Supabase Realtime = near-instant)
- Sideloading friction (Chrome Web Store = one-click install)
- Page refresh bugs (extension NEVER touches the BP page)

---

## Three Absolute Rules

These rules are non-negotiable. Every build, rebuild, or fix must verify compliance.

1. **NEVER refresh, reload, or navigate the Bomb Party page** — no `window.location.reload()`, no `location.href`, no `location.replace()`. The extension only READS the page.
2. **NEVER modify the DOM of the Bomb Party page** — no `createElement`, no `appendChild`, no `innerHTML` writes, no style changes, no injected buttons or overlays.
3. **NEVER show alerts, prompts, or popups on the Bomb Party page** — all errors logged silently to console.

**Verification after every build:**
```
Search content.js for: "reload", "location.reload", "location.href", "location.replace" → must be ZERO
Search content.js for: "document.createElement", "appendChild", "innerHTML", "insertAdjacentHTML" → must be ZERO
Search content.js for: "alert(", "confirm(", "prompt(" → must be ZERO
```

---

## Known Past Incidents

| # | Incident | Root Cause | Prevention in New Build |
|---|----------|-----------|----------------------|
| 001 | Browser refresh loop on Brittany's show (300+ viewers) | Old extension had `window.location.reload()` on 2-min timer | Absolute Rule #1 — zero reload calls in codebase |
| 002 | Rep's name appeared in queue | Scraping logic grabbed wrong data | Queue built from First Name column only, filtered by Revealed checkbox |
| 003 | MutationObserver infinite loop crashed browser | Observer was too broadly scoped, fired on its own DOM changes | Observer on tbody only, extension makes ZERO DOM modifications |

---

## Bomb Party Dashboard HTML Structure

**Confirmed:** April 10, 2026
**URL:** `https://myoffice.bombparty.com/live-party-orders`
**Important:** Table loads dynamically via JavaScript AFTER initial page render (shows spinner briefly). Must use MutationObserver on document.body or delayed polling to detect.

### Table Element

```html
<div class="table-responsive">
  <table class="table" id="party-order-table">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

### Header Structure

Each `<th>` contains a `data-sort-by` attribute — **USE THIS FOR COLUMN DETECTION, NOT TEXT CONTENT.**

The text content of each `<th>` includes "Ascending" and "Descending" from dropdown menus, making text matching unreliable.

```html
<th class="table-header-with-dropdown" data-sort-by="FirstName">
  <div class="header-content">
    <span>First Name</span>
    <i class="fa fa-chevron-down header-dropdown-icon"></i>
  </div>
  <div class="header-dropdown-menu">
    <div class="dropdown-item sort-option" data-sort="asc">
      <i class="fa fa-sort-amount-up"></i> Ascending
    </div>
    <div class="dropdown-item sort-option" data-sort="desc">
      <i class="fa fa-sort-amount-down"></i> Descending
    </div>
  </div>
</th>
```

**All data-sort-by values:**

| data-sort-by | Column |
|-------------|--------|
| OrderID | Order ID |
| OrderDate | Order Date |
| FirstName | First Name ← **WE SCRAPE THIS** |
| LastName | Last Name |
| PartyID | Party ID |
| PartyOrderStatusID | Status |
| IsRevealed | Revealed ← **WE CHECK THIS** |
| Notes | Notes |

### Data Row Structure

```html
<tr class="product product-row" data-partyid="" data-orderid="">
  <td><a href="/invoice?...">17903663</a></td>                    <!-- Order ID -->
  <td class="order-date-cell" data-order-utc-ms="...">04/09/2026, 10:26 PM</td>  <!-- Order Date -->
  <td>Danielle</td>                                                <!-- First Name (has whitespace, TRIM IT) -->
  <td>Ingargiola</td>                                              <!-- Last Name -->
  <td><a href="/summary/...">1780304</a></td>                     <!-- Party ID -->
  <td><span class="status-badge status-badge-pending">Pending</span></td>  <!-- Status -->
  <td class="text-center">                                         <!-- Revealed -->
    <input type="checkbox" class="checkbox-small" checked="checked"
           id="isrevealed-17903663" data-order-revealed-status="17903663">
  </td>
  <td>...</td>                                                     <!-- Notes -->
  <td class="text-center">...</td>                                 <!-- Edit/Cancel buttons -->
</tr>
```

### Revealed Checkbox Logic

- `checked="checked"` attribute present → **REVEALED** (skip this row)
- No `checked` attribute → **NOT REVEALED** (add to queue)
- Check via JavaScript: `checkbox.checked` returns `true` or `false`

### Queue Building Logic (Inverted List)

1. Table shows newest orders at TOP, oldest at BOTTOM
2. Get all `<tr class="product product-row">` from `<tbody>`
3. For each row, check the Revealed checkbox
4. Collect first names where `checkbox.checked === false`
5. **REVERSE the collected list** — oldest unrevealed first
6. Result: `queue[0]` = "Currently Unboxing", `queue[1]` = "On Deck", etc.

### Empty Table State

When no orders exist for the selected date, BP shows:
```html
<tbody>
  <!-- "There are no matching results." text, no tr.product rows -->
</tbody>
```

The extension handles this as a valid state → pushes empty array `[]` to Supabase.

---

## Supabase Components

### Table: `live_queue` (LIVE on neon-rabbit-core)

```sql
CREATE TABLE live_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL,
  sync_code TEXT NOT NULL UNIQUE,
  queue JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_live_queue_sync_code ON live_queue(sync_code);
ALTER TABLE live_queue ENABLE ROW LEVEL SECURITY;

-- Public read (website reads without auth)
CREATE POLICY "Public can read live queue"
  ON live_queue FOR SELECT USING (true);

-- Realtime enabled for instant website updates
```

### Seeded Rep Data

| Rep | Client | Sync Code | Status |
|-----|--------|-----------|--------|
| Lindsey | Mile High Fizz | MHF-7342 | ✅ Tested & working |
| Brittany | BrittwithBling | BWB-5819 | Seeded, not deployed |
| Bri | Bri's Glowtique | BGL-2463 | Seeded, not deployed |
| Heather | The Bling Kitchen | TBK-9157 | Seeded, not deployed |
| Kara | Sprinkled in Diamonds | SID-6284 | Seeded, not deployed |

### Edge Function: `live-queue-sync` (LIVE)

**Endpoint:** `POST https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/live-queue-sync`

**Auth:** `x-sync-key` header with static key (stored in password manager)

**Body:** `{ "sync_code": "MHF-7342", "queue": ["Kimberly", "Louis", "Danielle"], "timestamp": "..." }`

**Responses:** 200 OK, 400 invalid_sync_code, 401 unauthorized

**Tested:** All three response paths verified.

---

## Chrome Extension Components

### File Structure (in sparkle-suite repo)

```
/chrome-extension/
├── manifest.json          # Manifest V3 config
├── content.js             # Runs on BP dashboard — scrapes table, pushes data
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic — sync code input, toggle, status
├── popup.css              # Popup styling (pink/purple Sparkle Suite branding)
├── background.js          # Service worker — 60-second backup sync alarm
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

**Total size:** ~20KB across 9 files

### manifest.json — Key Configuration

```json
{
  "manifest_version": 3,
  "name": "Sparkle Suite Live Queue",
  "version": "1.0.0",
  "permissions": ["storage", "alarms"],
  "host_permissions": ["https://myoffice.bombparty.com/*"],
  "content_scripts": [{
    "matches": ["https://myoffice.bombparty.com/live-party-orders*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "background": { "service_worker": "background.js" },
  "action": { "default_popup": "popup.html" }
}
```

### content.js — How It Works

**Table Discovery:**
1. Uses MutationObserver on `document.body` to watch for `#party-order-table` appearing in the DOM
2. Fallback: polls `document.getElementById("party-order-table")` every 2 seconds
3. Never stops retrying — table may not exist until a show starts

**Column Detection:**
1. Gets all `<th>` elements in `<thead>`
2. Matches columns by `data-sort-by` attribute — NOT by text content
3. `data-sort-by="FirstName"` → firstName column index
4. `data-sort-by="IsRevealed"` → revealed column index

**Scraping:**
1. Gets all `<tr class="product product-row">` from `<tbody>`
2. For each row: `cells[firstNameIdx].textContent.trim()` = name
3. For each row: `cells[revealedIdx].querySelector('input[type="checkbox"]').checked` = revealed status
4. Collects names where `checked === false`
5. Reverses list (oldest unrevealed = first = "Currently Unboxing")

**Sync Trigger:**
1. MutationObserver on `<tbody>` detects changes (new orders, checkbox toggles)
2. Debounced: waits 2 seconds after mutation before processing
3. Backup: 60-second alarm from service worker triggers sync if observer misses something

**Data Push:**
1. POST to Edge Function URL with `{ sync_code, queue, timestamp }`
2. `x-sync-key` header for authentication
3. On failure: log to console, retry on next cycle. No alerts, no disruption.

**Constants hardcoded in content.js:**
- `EDGE_FUNCTION_URL` — the Supabase Edge Function endpoint
- `SYNC_KEY` — the static authentication key

### popup — User Interface

**First-time setup:** Text input for sync code → Save button
**After setup:** Shows sync code, on/off toggle, last sync time, status dot (green/yellow/red), Reset link

**State stored in:** `chrome.storage.sync` (syncs across Chrome instances)

### background.js — Service Worker

- Creates Chrome alarm "sparkle-sync" every 60 seconds
- On alarm: sends message to content script to trigger sync
- No other logic

---

## Website Component (NOT YET BUILT)

The Live Queue card on each rep's Readdy.ai site needs to be rewired from Google Apps Script to Supabase.

**Current:** Fetches from per-client Google Apps Script URL every 60 seconds
**New:** Subscribes to Supabase Realtime on live_queue table, filtered by rep's sync code

**Key changes:**
- Uses Supabase anon key for public read access
- Realtime subscription for instant updates (no polling)
- Fallback: polls every 30 seconds if Realtime unavailable
- No live/offline indicator in this version — shows queue data or "Ready to Reveal!" when empty
- Live indicator will be added when calendar system (Phase 4) is built

**Configuration per rep (paste into Readdy.ai):**
```
SUPABASE_URL = "https://bqhzfkgkjyuhlsozpylf.supabase.co"
SUPABASE_ANON_KEY = [stored in password manager]
REP_SYNC_CODE = [unique per rep]
REP_NAME = [rep's business name]
THEME_COLOR = [rep's brand gradient]
```

---

## Credentials (Stored in Password Manager)

| Credential | Value | Used By |
|-----------|-------|---------|
| LIVE_QUEUE_SYNC_KEY | [in password manager] | Chrome extension (content.js) |
| Edge Function URL | https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/live-queue-sync | Chrome extension (content.js) |
| Supabase Anon Key | [in password manager] | Website component (Readdy.ai) |
| MHF-7342 | Lindsey / Mile High Fizz | Extension popup setup |
| BWB-5819 | Brittany / BrittwithBling | Extension popup setup |
| BGL-2463 | Bri / Bri's Glowtique | Extension popup setup |
| TBK-9157 | Heather / The Bling Kitchen | Extension popup setup |
| SID-6284 | Kara / Sprinkled in Diamonds | Extension popup setup |

---

## Debugging Lessons Learned

### Bug: "Table not found" despite table existing on page

**Symptom:** Extension logged `[SparkleSync] Table not found, retrying in 30s...` indefinitely. Manual `document.getElementById("party-order-table")` in console returned the table successfully.

**Root cause chain:**
1. Extension found table by ID ✓
2. Extension tried to match column headers using `th.textContent` ✗
3. BP's `<th>` elements contain dropdown menus with "Ascending" / "Descending" text inside the same `<th>`
4. `th.textContent.trim().toLowerCase()` returned `"first name ascending descending"` instead of `"first name"`
5. Column matching failed → `findColumnIndices()` returned false → `findTargetTable()` returned null
6. Extension treated this as "table not found"

**Fix:** Use `data-sort-by` attributes on `<th>` elements instead of text content matching. `data-sort-by="FirstName"` and `data-sort-by="IsRevealed"` are stable, clean selectors that don't include dropdown menu text.

**Lesson:** Never use `textContent` on complex HTML elements for matching. Use data attributes, IDs, or classes instead.

### Bug: Table not found on initial load

**Symptom:** Extension ran at `document_idle` but table wasn't in the DOM yet.

**Root cause:** BP renders the table via JavaScript after the initial page load (shows a spinner briefly).

**Fix:** Use MutationObserver on `document.body` to detect when the table appears, with polling fallback. Never stop retrying — table may not exist until orders come in during a live show.

---

## Test Checklist

- [x] Extension finds table by ID party-order-table
- [x] Columns detected by data-sort-by attributes (not text content)
- [x] No browser refresh — verified by codebase search
- [x] No DOM modification — verified by codebase search
- [x] No alerts/popups — verified by codebase search
- [x] Silent failure on network errors
- [x] Popup shows sync code, toggle, last sync time, status dot
- [x] Toggle on/off works
- [x] Data flows to Supabase live_queue table
- [x] Queue order is correct (oldest unrevealed first)
- [x] Empty queue (all revealed) pushes empty array []
- [x] Works on Lindsey's dashboard
- [ ] Works on Brittany's dashboard
- [ ] Works on Bri's dashboard
- [ ] Works on Heather's dashboard
- [ ] Works on Kara's dashboard
- [ ] Website component reads from Supabase and displays queue
- [ ] Chrome Web Store listing live and installable
- [ ] Codex validation pass

---

## Future Integration Points

When the full Sparkle Suite platform is built:
- `rep_id` in `live_queue` gets linked to `sparkle_clients` table via FK
- Sync codes auto-generated during onboarding (Phase 8)
- Live/offline indicator on website driven by native calendar (Phase 4)
- Thumper monitors sync during scheduled shows, nudges reps if stale (Phase 1)
- Two-tier alert: Thumper nudges rep first → escalates to Louis if unresolved
- NR HQ dashboard shows sync status per rep

---

## Rebuild Instructions

If the extension ever needs to be rebuilt from scratch:

1. Use this document as the spec — it contains the exact BP HTML structure and all architectural decisions
2. Create `/chrome-extension/` in sparkle-suite repo
3. Follow the Three Absolute Rules — verify after every build
4. Use `data-sort-by` attributes for column detection — NEVER use textContent on th elements
5. Use MutationObserver on document.body for table discovery — NEVER assume table exists at page load
6. Test with Lindsey's dashboard first (Louis has BP access)
7. Run through Codex for adversarial review before deploying to other clients
8. Standing rules: main branch only, CODEBASE_SNAPSHOT.md at end, commit and push

---

*This plan is the operational reference for the Live Reveal Queue Chrome Extension. Update it when the extension changes. Do not update it for planned-but-not-built features — those go to Open Brain or the main SS_Master_Build_Plan.*
