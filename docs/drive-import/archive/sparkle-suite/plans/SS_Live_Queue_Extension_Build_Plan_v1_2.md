# Sparkle Suite — Live Reveal Queue Chrome Extension Build Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (primary), Claude Code (build execution)
🔄 UPDATE TRIGGER: Extension rebuild, architecture change, or Chrome Web Store submission

**Version:** 1.2 | **Created:** April 10, 2026 | **Last Updated:** April 12, 2026 | **Status:** ACTIVE — Extension built, tested, and deployed to Lindsey. Website component live on milehighfizz.com. Remaining 4 clients ready for deployment.

---

## What This Is

A Chrome Web Store extension that scrapes the Bomb Party "Party Orders" dashboard and pushes the live reveal queue to each rep's Sparkle Suite website via Supabase. Replaces the old sideloaded Gemini-built extension that had browser refresh bugs.

**Current clients deployed to:** Lindsey (Mile High Fizz) — extension + website component tested and working
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

### Queue Building Logic (Inverted List with Consecutive Collapse)

1. Table shows newest orders at TOP, oldest at BOTTOM
2. Get all `<tr class="product product-row">` from `<tbody>`
3. For each row, check the Revealed checkbox
4. Collect first names where `checkbox.checked === false`
5. **REVERSE the collected list** — oldest unrevealed first
6. **COLLAPSE consecutive duplicates** — if the same name appears back-to-back, collapse to one entry. Non-consecutive duplicates are preserved (e.g., `[Danielle, Danielle, Pamela, Danielle]` → `[Danielle, Pamela, Danielle]`)
7. Result: `queue[0]` = "Currently Unboxing", `queue[1]` = "On Deck", etc.

**Collapse function:**
```javascript
function collapseConsecutive(arr) {
  return arr.filter(function(name, i) {
    return i === 0 || name !== arr[i - 1];
  });
}
```

### Known Bug — Individual Order Tracking (DEFERRED to Sparkle Suite build)

The current queue is name-based, not order-based. When a customer has multiple orders (e.g., Crystal ordered 6 times) and one is revealed, the consecutive collapse may remove more visual entries than expected because the underlying logic collapses by name. Each order is a separate reveal, so the queue should ideally track individual orders, not just names. This will be fixed properly in the Sparkle Suite platform build by using OrderID as the unique identifier rather than first name alone. Acceptable as-is for temporary Readdy sites.

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
| Lindsey | Mile High Fizz | MHF-7342 | ✅ Deployed & tested |
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
6. Collapses consecutive duplicate names (same name back-to-back → one entry)

**Sync Trigger:**
1. MutationObserver on `<tbody>` detects changes (new orders, checkbox toggles)
2. Debounced: waits 2 seconds after mutation before processing
3. Backup: 60-second alarm from service worker triggers sync if observer misses something (NOTE: Chrome MV3 may suspend service worker — the MutationObserver is the primary and reliable trigger)

**Data Push:**
1. POST to Edge Function URL with `{ sync_code, queue, timestamp }`
2. `x-sync-key` header for authentication
3. On failure: log to console, set lastSyncStatus to "error" in chrome.storage, retry on next cycle. No alerts, no disruption.

**Constants hardcoded in content.js:**
- `EDGE_FUNCTION_URL` — the Supabase Edge Function endpoint
- `SYNC_KEY` — the static authentication key

### popup — User Interface

**First-time setup:** Text input for sync code → Save button
**After setup:** Shows sync code, on/off toggle, status indicator (Connected/Error/Paused), Reset link

**Status states:**
- **Connected** (green dot) — syncing toggle is ON, no errors on last push
- **Error** (red dot) — syncing toggle is ON but last push failed (network error, timeout)
- **Paused** (no dot) — syncing toggle is OFF

**No timestamp counter.** The popup does not show "Last Sync: Xs ago" — this was removed because during quiet periods with no table changes, the counter climbed and created false anxiety for reps. Reps just need to know the extension is on and working.

**State stored in:** `chrome.storage.sync` (syncs across Chrome instances) for sync code and toggle state. `chrome.storage.local` for lastSyncStatus (error tracking). Popup listens to `storage.onChanged` for real-time status updates without polling.

### background.js — Service Worker

- Creates Chrome alarm "sparkle-sync" every 60 seconds
- On alarm: sends message to content script to trigger sync
- No other logic
- NOTE: Chrome MV3 aggressively suspends service workers after ~30 seconds of inactivity. This alarm is a last-resort backup — the MutationObserver in content.js is the primary and reliable sync trigger.

---

## Website Component (DEPLOYED to Lindsey)

The Live Queue card on each rep's Readdy.ai site reads from the Supabase `live_queue` table.

**Old (eliminated):** Fetches from per-client Google Apps Script URL every 60 seconds
**New (live):** Subscribes to Supabase Realtime on live_queue table, filtered by rep's sync code. Falls back to 30-second polling if Realtime unavailable.

**Current Readdy behavior:** Readdy's agent converts the HTML component to a React component (LiveQueueEmbed). The conversion preserves the data plumbing but the Supabase Realtime subscription may not be fully functional in Readdy's React environment. Observed update latency on milehighfizz.com: ~54 seconds (polling, not Realtime). Accepted for temporary Readdy sites — Realtime will work properly on the real Sparkle Suite platform.

**Website component features:**
- Shows queue with numbered positions
- Position 1 labeled "Currently Unboxing" (or rep's equivalent branding)
- Position 2 labeled "On Deck" / "Coming Up Next"
- Empty queue shows "Ready to Reveal!" state
- Card design and branding handled by Readdy per rep's existing site theme
- No live/offline indicator in this version — deferred to Phase 4 (calendar system)

**Configuration per rep (embedded in Readdy site):**
```
SUPABASE_URL = "https://bqhzfkgkjyuhlsozpylf.supabase.co"
SUPABASE_ANON_KEY = [stored in password manager]
REP_SYNC_CODE = [unique per rep]
```

**Deployment method:** Paste raw HTML component into Readdy.ai site, Readdy agent converts to React and applies rep's existing branding. Only the sync code changes per rep.

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

### Bug: Queue showed each name only once (full dedup)

**Symptom:** Customer who ordered 6 times appeared only once in queue. Queue order was incorrect because non-consecutive duplicates were removed.

**Root cause:** Original queue building logic used full deduplication (Set, indexOf, or similar) to remove all duplicate names. Each order is a separate reveal — if a customer ordered 6 times, they should appear in the queue for each unrevealed order.

**Fix (commit 07a61f3):** Removed full dedup. Replaced with consecutive-collapse filter: same name back-to-back collapses into one entry (they'll be unboxed consecutively), but when a different name breaks the streak, the name reappears in its correct position. See Queue Building Logic section above.

### Known Issue: Extension toggle off/on does not auto-resume sync

**Symptom:** After toggling the extension OFF then back ON via the popup, sync does not resume. Status shows Error (red).

**Root cause:** Chrome MV3 suspends the service worker during the OFF period. When toggled back ON, the alarm is no longer firing and the content script may be disconnected.

**Workaround (documented in rep instructions):** Refresh the BP dashboard tab (F5) to inject a fresh content script. Alternatively, refresh the extension at `chrome://extensions` AND then refresh the BP tab.

**Status:** Accepted as known behavior. Reps rarely toggle the extension during a show. Proper fix deferred to future session.

### Known Issue: "Extension context invalidated" error after extension refresh

**Symptom:** After refreshing the extension at `chrome://extensions`, the console shows `Uncaught (in promise) Error: Extension context invalidated` at content.js.

**Root cause:** Refreshing the extension kills the old content script's connection to the service worker, but the old script remains injected on the BP page as a zombie. It can no longer call `chrome.storage` or communicate with the extension.

**Fix:** Always refresh the BP dashboard tab (F5) after refreshing the extension. This injects a fresh content script and clears the zombie. The error is harmless — it's the old script dying, not the new one breaking.

### Known Issue: Service worker 60-second alarm unreliable

**Symptom:** "Last Sync" climbed past 2 minutes during idle testing even though the 60-second alarm should have fired.

**Root cause:** Chrome MV3 aggressively suspends service workers after ~30 seconds of inactivity. The `chrome.alarms` API fires the alarm, but the service worker may not wake reliably, and the message to the content script may not get through.

**Accepted behavior:** The MutationObserver in content.js is the primary and reliable sync trigger — it fires instantly on any table change. The service worker alarm is a last-resort backup only. During a live show, the table is constantly changing (new orders, checkbox toggles), so the MutationObserver keeps sync active. During quiet periods with no changes, there is nothing new to push — the queue data in Supabase is already current.

---

## Test Checklist

- [x] Extension finds table by ID party-order-table
- [x] Columns detected by data-sort-by attributes (not text content)
- [x] No browser refresh — verified by codebase search
- [x] No DOM modification — verified by codebase search
- [x] No alerts/popups — verified by codebase search
- [x] Silent failure on network errors
- [x] Popup shows sync code, toggle, Connected/Error/Paused status
- [x] Toggle on/off works (known: must refresh BP tab to resume after toggle)
- [x] Data flows to Supabase live_queue table
- [x] Queue order is correct (oldest unrevealed first)
- [x] Consecutive duplicate names collapsed correctly
- [x] Non-consecutive duplicate names preserved correctly
- [x] Empty queue (all revealed) pushes empty array []
- [x] Rapid-fire checkbox toggles handled cleanly (debounce working)
- [x] Works on Lindsey's dashboard (extension + website)
- [ ] Works on Brittany's dashboard
- [ ] Works on Bri's dashboard
- [ ] Works on Heather's dashboard
- [ ] Works on Kara's dashboard
- [ ] Chrome Web Store listing live and installable
- [ ] Codex validation pass

---

## Rep Instructions (for extension users)

1. **Install:** Install from Chrome Web Store (or Load Unpacked from `chrome-extension/` folder for now)
2. **Setup:** Click the Sparkle Suite extension icon → enter your sync code → Save
3. **Using:** Toggle Syncing ON before your show starts. Open your Bomb Party Live Party Orders page. The extension syncs automatically — you don't need to do anything else.
4. **After show:** You can leave it on or toggle it off. Doesn't matter.
5. **If status shows Error (red):** Refresh your Bomb Party page (F5). This fixes it 99% of the time.
6. **If that doesn't fix it:** Go to `chrome://extensions`, click the refresh icon on Sparkle Suite Live Queue, then refresh your Bomb Party page.

---

## Future Integration Points

When the full Sparkle Suite platform is built:
- `rep_id` in `live_queue` gets linked to `sparkle_clients` table via FK
- Sync codes auto-generated during onboarding (Phase 8)
- Live/offline indicator on website driven by native calendar (Phase 4)
- Thumper monitors sync during scheduled shows, nudges reps if stale (Phase 1)
- Two-tier alert: Thumper nudges rep first → escalates to Louis if unresolved
- NR HQ dashboard shows sync status per rep
- Individual order tracking by OrderID instead of name-based queue (fixes the consecutive collapse edge case where revealing one order for a multi-order customer removes more visual entries than expected)

---

## Rebuild Instructions

If the extension ever needs to be rebuilt from scratch:

1. Use this document as the spec — it contains the exact BP HTML structure and all architectural decisions
2. Create `/chrome-extension/` in sparkle-suite repo
3. Follow the Three Absolute Rules — verify after every build
4. Use `data-sort-by` attributes for column detection — NEVER use textContent on th elements
5. Use MutationObserver on document.body for table discovery — NEVER assume table exists at page load
6. Implement consecutive duplicate collapsing — NOT full deduplication
7. Popup shows Connected/Error/Paused — NO timestamp counter
8. Test with Lindsey's dashboard first (Louis has BP access)
9. Run through Codex for adversarial review before deploying to other clients
10. Standing rules: main branch only, CODEBASE_SNAPSHOT.md at end, commit and push

---

*This plan is the operational reference for the Live Reveal Queue Chrome Extension. Update it when the extension changes. Do not update it for planned-but-not-built features — those go to Open Brain or the main SS_Master_Build_Plan.*
