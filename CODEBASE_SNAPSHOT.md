# Codebase Snapshot — Sparkle Suite
_Generated: 2026-04-12 (updated)_

## Project
**Sparkle Suite** — Louis's operational HQ and client platform for his social selling / live-sales business (Neon Rabbit brand). Built on Next.js 16 + React 19, Supabase (Postgres + Edge Functions), and Telegram Bot integration.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, TypeScript 5 |
| Chrome Extension | Manifest V3, vanilla JS, chrome.storage + chrome.alarms APIs |
| Backend / DB | Supabase (Postgres, pgvector, pgmq, pg_net, pg_cron) |
| Edge Functions | Deno + Hono (MCP) or plain Deno.serve |
| AI / Embeddings | OpenRouter API (openai/text-embedding-3-small) |
| Messaging | Telegram Bot API (node-telegram-bot-api) |
| Deployment | Supabase Cloud (us-east-1, ref: bqhzfkgkjyuhlsozpylf) |

---

## Database Schema

### `open_brain`
Semantic memory store for Louis's AI brain.
- `id`, `content TEXT`, `embedding halfvec(1536)`, `source TEXT`, `tags TEXT[]`, `metadata JSONB`, `created_at`
- HNSW index on embedding
- RPC: `match_open_brain(query_embedding, match_threshold, match_count)`

### `clients` (original)
CRM-style client records.
- `id`, `name`, `email`, `phone`, `platform`, `tier`, `status`, `monthly_rate`, `setup_fee`, `site_url`, `notes`, `created_at`

### `pipeline_status`
Client pipeline stage tracking.

### `builds`
Client build tracking with checklists.

### `payments`
Payment records (Stripe integration placeholder).

### `projects` (neon_rabbit_hq)
Business project management.
- `id`, `name`, `tier` (1–4), `status`, `scope`, `tool`, `next_action`, `category`, `history JSONB`, `clients JSONB`, `milestones JSONB`, `user_id`

### `financial_snapshots`
Monthly financial health snapshots.
- `id`, `mrr`, `revenue`, `expenses`, `net`, `runway_months`, `personal_balance`, `business_balance`, `recorded_at`, `user_id`

### `expenses`
Recurring expenses tracker.
- `id`, `name`, `amount`, `category`, `billing_cycle`, `active`, `user_id`

### `clients` (neon_rabbit_hq schema)
Full CRM with launch tracking.
- `id`, `name`, `site_name`, `site_url`, `status`, `tier`, `mrr`, `launched_at`, `notes`, `user_id`

### `queue_items`
Todo/task queue with priority and due dates.

### `ideas`
Captured ideas/notes.

### `maintenance_items`
Recurring maintenance tasks with `next_due`.

### `pa_items`
Personal assistant items.

### `thoughts_march`
Isolated Open Brain instance for user March.
- `id`, `content`, `embedding vector(1536)`, `type`, `topics TEXT[]`, `people TEXT[]`, `action_items TEXT[]`, `metadata JSONB`
- RPCs: `match_thoughts_march()`, `upsert_thought_march()`

### `live_queue`
Live sales queue sync table — Chrome extension writes, website reads via Realtime.
- `id UUID PK`, `rep_id UUID`, `sync_code TEXT UNIQUE`, `queue JSONB DEFAULT '[]'`, `last_updated TIMESTAMPTZ`, `created_at TIMESTAMPTZ`
- Index: `idx_live_queue_sync_code`
- RLS: Public SELECT (anyone can read), writes via service role only
- Realtime: enabled via `supabase_realtime` publication

**Seeded reps:**
| Rep | Client | Sync Code |
|-----|--------|-----------|
| Lindsey | Mile High Fizz | MHF-7342 |
| Brittany | BrittwithBling | BWB-5819 |
| Bri | Bri's Glowtique | BGL-2463 |
| Heather | The Bling Kitchen | TBK-9157 |
| Kara | Sprinkled in Diamonds | SID-6284 |

### Sparkle Suite Tables (16 tables — migration 006)

**Core:**
- `reps` — central table, linked to auth.users. Columns: display_name, business_name, email, phone, custom_domain, template_id, shop_link, streaming_links (JSONB), social_handles (JSONB), profile_photo_url, camera_source, status (rep_status enum)
- `collections` — Bomb Party jewelry collections (shared across all reps). Columns: name (UNIQUE)
- `jewelry_designs` — proprietary BP jewelry database. Columns: item_number (UNIQUE), design_name, collection_id (FK), material, main_stone, bp_msrp, canonical_photo_url, special_features, length_info, type_prefix (jewelry_type enum), times_traded, times_listed

**Trade Board:**
- `trade_listings` — individual listings on a rep's board. Columns: rep_id (FK), design_id (FK), listing_photo_url, uses_canonical_photo, trade_preferences, rep_notes, status (listing_status enum), removal_reason, listed_at
- `trade_requests` — customer-submitted trade requests. Columns: listing_id (FK), customer_name, customer_description, status (trade_request_status enum), rejection_reason, rep_notes
- `trade_fulfillment` — post-approval pipeline (approved → shipped → completed). Columns: request_id (FK UNIQUE), fulfillment_status, shipping_notes, received_listing_id (FK), status_updated_at, completed_at

**Rep Operations:**
- `calendar_events` — show schedule. Columns: rep_id (FK), platform, event_time, duration_minutes, discount_code, discount_description, description, is_recurring, recurrence_rule, status (event_status enum)
- `customer_audience` — TCPA/CAN-SPAM compliant subscriber list. Columns: rep_id (FK), name, phone, email, sms_consent, email_consent, marketing_consent, consent_date, sms_opted_out_at, email_opted_out_at, stop_keyword_received_at
- `sms_wallet` — pre-loaded SMS balance ($25 min load). Columns: rep_id (FK UNIQUE), balance, auto_recharge_enabled, auto_recharge_threshold, auto_recharge_amount, minimum_load_amount, last_loaded_at
- `wallet_transactions` — wallet load/charge log. Columns: wallet_id (FK), type (wallet_transaction_type enum), amount, stripe_fee, stripe_payment_intent_id, description
- `message_log` — SMS/email send records. Columns: rep_id (FK), channel (message_channel enum), recipient, content_preview, screening_result, screening_notes, delivery_status, cost, is_automated, sent_at
- `rep_notes` — Thumper memory (chronological summaries). Columns: rep_id (FK), summary, conversation_date
- `rep_messages` — dashboard-delivered messages (reports, newsletters, support). Columns: rep_id (FK), message_type (rep_message_type enum), direction (message_direction enum), subject, body, is_read, read_at
- `site_settings` — per-rep website customization. Columns: rep_id (FK UNIQUE), banner_text, banner_visible, ticker_text, ticker_visible, tagline, hero_image_url, hero_animation_type, team_name, show_join_page
- `subscriptions` — Stripe subscription management. Columns: rep_id (FK UNIQUE), stripe_subscription_id (UNIQUE), stripe_customer_id, plan_tier (plan_tier enum), status (subscription_status enum), monthly_amount, current_period_start, current_period_end, cancelled_at, cancelled_reason, cancellation_effective_date
- `onboarding_status` — onboarding pipeline with photography kit tracking. Columns: rep_id (FK UNIQUE), current_stage (onboarding_stage enum), completed_steps (JSONB), camera_type, camera_quality_passed, lightbox_shipped, lightbox_shipped_at, kit_received, kit_received_at, started_at, completed_at

**17 Enums:** rep_status, listing_status, trade_request_status, fulfillment_status, event_status, plan_tier, subscription_status, wallet_transaction_type, message_channel, screening_result, delivery_status, rep_message_type, message_direction, onboarding_stage, removal_reason, rejection_reason, jewelry_type

**RLS:** Enabled on all 16 tables. Standard pattern: rep sees own data, admin (louis@neonrabbit.net) sees all. Special cases: jewelry_designs/collections have shared read; trade_requests allows public INSERT.

**Realtime:** trade_requests, trade_listings, calendar_events, rep_messages

**RPC Functions (SECURITY DEFINER):**
- `rpc_submit_trade_request(p_listing_id, p_customer_name, p_customer_description)` — atomic: insert request + set listing to pending_trade
- `rpc_approve_trade(p_request_id, p_rep_notes)` — atomic: approve request + set listing traded + create fulfillment + increment times_traded
- `rpc_reject_trade(p_request_id, p_reason, p_rep_notes)` — atomic: deny request + restore listing to available

**Notable Indexes:**
- `idx_one_pending_request_per_listing` — partial unique index enforcing one pending request per listing
- `idx_designs_fulltext` — GIN index for full-text search on design_name, material, main_stone

---

## Edge Functions

### `open-brain-mcp`
MCP server for Louis's Open Brain — semantic thought storage and search.
- Auth: `MCP_ACCESS_KEY` header
- Tools: `search_thoughts`, `list_thoughts`, `thought_stats`, `capture_thought`
- Tech: Hono + @modelcontextprotocol/sdk + Zod
- Tables: `open_brain` (via RPCs `match_open_brain`, `upsert_thought` — presumed)
- URL: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/open-brain-mcp`

### `open-brain-mcp-march`
Mirror of open-brain-mcp for user March.
- Auth: `MCP_ACCESS_KEY_MARCH` header
- Tables: `thoughts_march` (via `match_thoughts_march`, `upsert_thought_march`)
- URL: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/open-brain-mcp-march`

### `embed`
Background worker: reads from `embed_jobs` pgmq queue, generates OpenAI embeddings, writes back to `open_brain`.

### `live-queue-sync` ← NEW
REST endpoint for Chrome extension → live_queue table sync.
- Auth: `x-sync-key: LIVE_QUEUE_SYNC_KEY` header (32-char alphanumeric secret)
- Method: `POST`
- Body: `{ sync_code: string, queue: string[], timestamp: string }`
- Returns: `{ status: "ok" }` or error object
- Uses service role key internally to bypass RLS for writes
- CORS: open (`*`) for Chrome extension access
- URL: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/live-queue-sync`

---

## Next.js App (app/)

### API Routes
- `POST /api/telegram` — Telegram webhook → `handleTelegramUpdate()` → inserts to `open_brain`
- `POST /api/open-brain/context` — Semantic search: takes `{ query, count }`, generates embedding, calls `match_open_brain()` RPC

### Pages
- `app/page.tsx` — Default Next.js home (placeholder, not customized yet)
- `app/layout.tsx` — Root layout with Geist fonts

---

## Lib

### `lib/supabase.ts`
Singleton Supabase client (anon key).

### `lib/telegram-bot.ts`
Telegram message handler:
- `generateEmbedding(text)` — OpenAI embeddings
- `handleTelegramUpdate(body)` — receives webhook, stores message to `open_brain`

---

## Supabase Migrations (in order)

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Base schema: open_brain, clients, pipeline_status, builds, payments |
| `002_open_brain_embedding_pipeline.sql` | pgvector, pgmq, pg_net, pg_cron; embed pipeline; HNSW index |
| `003_neon_rabbit_hq.sql` | Business management tables: projects, financials, expenses, clients, todos, ideas |
| `004_march_open_brain.sql` | Isolated thoughts_march table + RPCs for user March |
| `005_live_queue.sql` | live_queue table, RLS, seeded 5 rep rows, Realtime enabled |
| `006_sparkle_suite_schema.sql` | Sparkle Suite platform: 16 tables, 17 enums, all indexes, RLS policies, Realtime (4 tables), 3 RPC functions |

---

## Key Environment Variables

| Variable | Used In |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend + API routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend (public read access) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side + edge functions (bypasses RLS) |
| `OPENAI_API_KEY` | Telegram bot embeddings, context API route |
| `TELEGRAM_BOT_TOKEN` | Telegram webhook handler |
| `MCP_ACCESS_KEY` | open-brain-mcp auth |
| `MCP_ACCESS_KEY_MARCH` | open-brain-mcp-march auth |
| `OPENROUTER_API_KEY` | open-brain-mcp embeddings + metadata extraction |
| `LIVE_QUEUE_SYNC_KEY` | live-queue-sync auth (Chrome extension secret) |

---

## Data Flows

```
Telegram message
  → /api/telegram (Next.js)
  → handleTelegramUpdate()
  → generateEmbedding() [OpenAI]
  → INSERT open_brain

User query
  → /api/open-brain/context (Next.js)
  → generateEmbedding() [OpenAI]
  → match_open_brain() [Supabase RPC]
  → return results

MCP client (Claude Desktop etc.)
  → open-brain-mcp Edge Function
  → capture_thought / search_thoughts / etc.
  → Supabase RPCs

Chrome extension (live show)
  → live-queue-sync Edge Function [x-sync-key auth]
  → UPDATE live_queue WHERE sync_code = ?

Website component
  → Supabase Realtime subscription on live_queue
  → Real-time queue display to viewers
```

---

## Claude Skills (`.claude/skills/`)

Local-only (gitignored). Not committed to the repo.

| Skill | Trigger | Description |
|-------|---------|-------------|
| `sparkle-live-queue` | chrome-extension work, "live queue", "bomb party scraper", "party orders", "reveal queue", "sparkle sync" | Complete reference for the Live Queue Chrome extension — BP HTML structure (confirmed April 2026), three absolute safety rules, past incidents, architecture, debugging checklist |

---

## Chrome Extension (`chrome-extension/`)

Manifest V3 extension that scrapes the Bomb Party back-office live-party-orders page and syncs the unrevealed queue to the `live-queue-sync` edge function.

**Three inviolable rules:** No page refreshes. No DOM writes on the BP page. No alerts/popups/thrown errors.

### Files

| File | Purpose |
|------|---------|
| `manifest.json` | MV3 manifest: permissions (storage, alarms), host (myoffice.bombparty.com), content script + service worker + popup |
| `content.js` | Read-only DOM scraper — finds the orders table by `#party-order-table` ID only (no fallbacks); uses `data-sort-by` attribute on `<th>` elements (`FirstName`, `IsRevealed`) for column detection, not textContent; selects `<tr class="product product-row">` rows from tbody; reads checkbox.checked for revealed state; attaches MutationObserver on document.body to detect table appearance (5s timeout then falls back to 2s polling); observes tbody for row/attribute changes; reverses DOM order for oldest-first queue; pushes to edge function |
| `background.js` | Service worker — 60s alarm triggers content script sync via message passing |
| `popup.html/css/js` | Setup UI (sync code input) and status UI (toggle, last sync time, status dot) |
| `icons/` | Pink (#ec4899) placeholder icons with white sparkle (16/48/128px) |

### Hardening (Codex-reviewed)

- **Table discovery:** `document.getElementById("party-order-table")` — single stable ID, no fallbacks.
- **Table appearance timing:** MutationObserver on `document.body` detects table insertion after JS renders it. If table isn't found within 5 seconds, falls back to `setInterval` polling every 2 seconds indefinitely. Checks for existing table immediately on init (fast-load case).
- **Column detection:** Reads `data-sort-by` attribute on each `<th>` — `"FirstName"` → firstNameIdx, `"IsRevealed"` → revealedIdx. Never uses textContent (avoids "Ascending"/"Descending" noise from sort dropdowns).
- **Row selection:** `tbody.querySelectorAll("tr.product.product-row")` — matches Bomb Party's exact row classes.
- **Revealed check:** `cells[revealedIdx].querySelector('input[type="checkbox"]').checked` — direct native checkbox property.
- **Queue ordering:** Reverses DOM order (oldest unrevealed = currently being unboxed comes first). No date-column sort.
- **Row filtering:** Skips revealed rows, skips names < 2 chars, deduplicates by name.
- **Observer:** Attaches to `<tbody>` (`subtree: false`) or `<table>` (`subtree: true`) with `attributeFilter: ["checked"]`. 3-second debounce.
- **Deduplication:** Queue hash comparison skips push if unchanged since last successful push.
- **In-flight lock:** `isSyncing` flag prevents overlapping requests.
- **Fetch timeout:** 8-second AbortController timeout.
- **Auth failure:** 401 response pauses syncing until popup re-enables.
- **Dead DOM recovery:** Checks `tbody.isConnected` before each scrape; re-discovers table if detached.
- **Storage split:** `chrome.storage.sync` for settings (sync_code, enabled). `chrome.storage.local` for runtime state (lastSyncTime, lastSyncStatus).
- **Message errors:** `chrome.runtime.lastError` silently consumed in background.js.

### Data Flow

```
Bomb Party live-party-orders page
  → content.js scrapes <tbody> rows
  → Filters: unrevealed, not canceled, name >= 2 chars, deduplicated
  → Sorts oldest-first (by Order Date or reversed DOM order)
  → Hashes queue, skips if unchanged
  → POST to live-queue-sync edge function (x-sync-key header)
  → Edge function updates live_queue table
  → Supabase Realtime pushes to website subscribers
```
