---
name: sparkle-live-queue
description: "Use this skill whenever working on the Sparkle Suite Live Queue Chrome extension — the Bomb Party dashboard scraper that pushes reveal queue data to Supabase. Triggers include: any work in the /chrome-extension/ directory, any mention of 'live queue', 'live reveal', 'bomb party scraper', 'party orders', 'reveal queue', 'sparkle sync', or 'chrome extension' in the context of Sparkle Suite. Also use when debugging sync issues, modifying the content script, updating the popup UI, changing the Edge Function, or preparing for Chrome Web Store submission. This skill contains the exact HTML structure of the Bomb Party dashboard (confirmed April 2026), architectural decisions, and three absolute safety rules that must never be violated. ALWAYS read this skill before making any change to the extension code."
---

# Sparkle Suite Live Queue — Chrome Extension Skill

## What This Extension Does

Scrapes the Bomb Party "Party Orders" dashboard and pushes the live reveal queue to each rep's Sparkle Suite website via Supabase. Used during live jewelry reveal shows where 300+ customers may be watching.

**Data flow:** Chrome extension (reads BP table) → Supabase Edge Function → `live_queue` table → Website (Supabase Realtime subscription)

**Repo location:** `sparkle-suite` repo, `/chrome-extension/` directory

---

## Three Absolute Rules — NEVER VIOLATE

**Every build, every fix, every change MUST comply. Verify after every modification.**

1. **NEVER refresh the Bomb Party page** — no `window.location.reload()`, no `location.href`, no `location.replace()`. The extension only READS.
2. **NEVER modify the DOM** — no `createElement`, no `appendChild`, no `innerHTML` writes, no style changes, no injected elements.
3. **NEVER show alerts or popups** — no `alert()`, `confirm()`, `prompt()`. All errors logged silently to `console.log`.

**Mandatory verification after every change to content.js:**
```bash
# All must return zero results
grep -n "reload\|location\.reload\|location\.href\|location\.replace" chrome-extension/content.js
grep -n "document\.createElement\|appendChild\|innerHTML\|insertAdjacentHTML" chrome-extension/content.js
grep -n "alert(\|confirm(\|prompt(" chrome-extension/content.js
```

---

## Known Past Incidents

| # | What Happened | Root Cause | Prevention |
|---|--------------|-----------|------------|
| 001 | Browser refresh loop during live show (300+ viewers) | `window.location.reload()` on 2-min timer | Rule #1 — zero reload calls |
| 002 | Rep's name appeared in queue | Wrong data scraped | Scrape First Name column only |
| 003 | MutationObserver infinite loop crashed browser | Observer too broadly scoped, fired on own DOM changes | Observer on tbody only + zero DOM modifications |
| 004 | "Table not found" despite table existing | `th.textContent` included "Ascending/Descending" dropdown text | Use `data-sort-by` attributes, not textContent |
| 005 | Table not found on initial load | BP renders table via JS after page load | MutationObserver on document.body + polling fallback |

---

## Bomb Party Dashboard HTML Structure

**CONFIRMED: April 10, 2026. This is the source of truth.**

**URL:** `https://myoffice.bombparty.com/live-party-orders`

**CRITICAL:** Table loads dynamically via JavaScript AFTER initial page render. A spinner appears briefly before the table data renders. Never assume the table exists at `document_idle`.

### Table Element

```html
<div class="table-responsive">
  <table class="table" id="party-order-table">
    <thead><!-- headers --></thead>
    <tbody><!-- data rows --></tbody>
  </table>
</div>
```

**Find by:** `document.getElementById("party-order-table")`

### Header Structure — USE data-sort-by, NOT textContent

Each `<th>` contains dropdown menus with "Ascending" / "Descending" text. Using `th.textContent` returns garbage like `"First Name Ascending Descending"`. Use the `data-sort-by` attribute instead.

```html
<th class="table-header-with-dropdown" data-sort-by="FirstName">
  <div class="header-content">
    <span>First Name</span>
    <i class="fa fa-chevron-down header-dropdown-icon"></i>
  </div>
  <div class="header-dropdown-menu">
    <div class="dropdown-item sort-option" data-sort="asc">Ascending</div>
    <div class="dropdown-item sort-option" data-sort="desc">Descending</div>
  </div>
</th>
```

**Column detection — match by attribute:**

| data-sort-by | Column | Use |
|-------------|--------|-----|
| `FirstName` | First Name | **SCRAPE THIS** |
| `IsRevealed` | Revealed | **CHECK THIS** |
| `OrderID` | Order ID | — |
| `OrderDate` | Order Date | — |
| `LastName` | Last Name | — |
| `PartyID` | Party ID | — |
| `PartyOrderStatusID` | Status | — |
| `Notes` | Notes | — |

### Data Row Structure

```html
<tr class="product product-row" data-partyid="" data-orderid="">
  <td><a href="...">17903663</a></td>               <!-- Order ID -->
  <td class="order-date-cell">04/09/2026</td>       <!-- Order Date -->
  <td> Danielle </td>                                <!-- First Name — HAS WHITESPACE, TRIM IT -->
  <td> Ingargiola </td>                              <!-- Last Name -->
  <td><a href="...">1780304</a></td>                 <!-- Party ID -->
  <td><span class="status-badge">Pending</span></td> <!-- Status -->
  <td class="text-center">                            <!-- Revealed -->
    <input type="checkbox" class="checkbox-small" 
           checked="checked" 
           id="isrevealed-17903663" 
           data-order-revealed-status="17903663">
  </td>
  <td>...</td>                                        <!-- Notes -->
  <td>...</td>                                        <!-- Edit/Cancel buttons -->
</tr>
```

### Revealed Checkbox

- `checked="checked"` present → **REVEALED** → skip this row
- No `checked` attribute → **NOT REVEALED** → add to queue
- JavaScript check: `element.checked === true` or `element.checked === false`

### Queue Building Logic (Inverted List)

1. Table shows newest orders at TOP, oldest at BOTTOM
2. Get all `<tr class="product product-row">` from `<tbody>`
3. For each row: get First Name (`cells[firstNameIdx].textContent.trim()`)
4. For each row: check Revealed (`cells[revealedIdx].querySelector('input[type="checkbox"]').checked`)
5. Collect names where `checked === false`
6. **REVERSE the list** — oldest unrevealed first
7. `queue[0]` = "Currently Unboxing", `queue[1]` = on deck, etc.

### Empty Table State

When no orders exist: table element exists but tbody has no `tr.product` rows. Shows "There are no matching results." This is valid — push empty array `[]`.

---

## Extension Architecture

### File Structure

```
/chrome-extension/
├── manifest.json       # Manifest V3
├── content.js          # BP scraper — the critical file
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── popup.css           # Popup styling
├── background.js       # Service worker (60s alarm)
└── icons/              # 16, 48, 128px icons
```

### content.js — Key Patterns

**Table discovery:** MutationObserver on `document.body` watches for `#party-order-table`. Polling fallback every 2 seconds. Never stops retrying.

**Column detection:** Loop through `<th>` elements, match `data-sort-by` attribute values.

**Sync trigger:** MutationObserver on `<tbody>` with 2-second debounce. Backup: 60-second alarm from service worker.

**Data push:** POST to Edge Function with `{ sync_code, queue, timestamp }` and `x-sync-key` header. Silent failure on errors.

**Constants at top of file:**
- `EDGE_FUNCTION_URL` — Supabase Edge Function endpoint
- `SYNC_KEY` — static auth key

### manifest.json — Key Config

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "alarms"],
  "host_permissions": ["https://myoffice.bombparty.com/*"],
  "content_scripts": [{
    "matches": ["https://myoffice.bombparty.com/live-party-orders*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "background": { "service_worker": "background.js" }
}
```

### Popup UI

- First-time: sync code input + save
- After setup: sync code display, on/off toggle, last sync time, status dot (green/yellow/red), reset link
- State in `chrome.storage.sync`

---

## Supabase Components

**Project:** neon-rabbit-core (ref: bqhzfkgkjyuhlsozpylf)

### live_queue Table

```sql
CREATE TABLE live_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL,
  sync_code TEXT NOT NULL UNIQUE,
  queue JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: public read, service-role write only. Realtime enabled.

### Edge Function: live-queue-sync

- **POST** with `x-sync-key` header
- Body: `{ sync_code, queue, timestamp }`
- Validates key → looks up sync_code → upserts queue + last_updated
- Returns: 200 OK, 400 invalid code, 401 unauthorized

---

## Debugging Checklist

If the extension isn't syncing:

1. **Console shows "Table not found"** → BP changed their HTML. Copy their table HTML with `copy(document.getElementById("party-order-table").outerHTML)` and update column detection logic.
2. **Console shows fetch errors** → Edge Function may be down. Check Supabase dashboard → Edge Functions → logs.
3. **Green dot but no data in Supabase** → Check the sync_code matches between popup and live_queue table.
4. **Data in Supabase but website not updating** → Check Realtime is enabled on live_queue table. Check website component's Supabase subscription.
5. **Queue has wrong names or wrong order** → Check column indices. Verify Revealed checkbox detection. Verify reverse logic.

---

## Rebuild From Scratch

If the extension needs a complete rebuild:

1. Read this entire SKILL.md first
2. Create `/chrome-extension/` in sparkle-suite repo
3. Build against the BP HTML structure documented above
4. Use `data-sort-by` attributes for column detection — NEVER textContent
5. Use MutationObserver on document.body for table discovery
6. Verify the Three Absolute Rules after build
7. Test on Lindsey's BP dashboard (Louis has access)
8. Run through Codex adversarial review before deploying to other clients

---

## Standing Rules for Claude Code Sessions

```
Work on main branch only at C:\Users\louis\sparkle-suite — do not create worktrees, new branches, or temporary directories unless Louis explicitly requests one.
```

Regenerate `CODEBASE_SNAPSHOT.md` at end of every session. Commit and push.
