# Sparkle Suite — Supabase Schema Specification

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any table added, column changed, relationship modified, or enum value added

**Version:** 1.0 | **Created:** April 11, 2026 | **Status:** APPROVED — Ready for Phase 0 build

---

## Overview

This schema defines all 16 Supabase tables for the Sparkle Suite platform. It is the single source of truth for Phase 0 Task 0.2 (create all tables + RLS policies). Every table, column, relationship, enum, and index is specified here.

**Supabase project:** neon-rabbit-core (us-east-1, ref: bqhzfkgkjyuhlsozpylf)

**Key architectural decisions baked into this schema:**
- One board per rep (no multi-board support)
- One-for-one trades only (no purchases, no cash transactions)
- 3-status fulfillment pipeline (approved → shipped → completed)
- Simple exact-match dedup on BP item numbers
- SMS wallet with $25 minimum load, Stripe fees absorbed into NR margin
- Universal pro-rata cancellation policy (cancel anytime, refund unused time)
- Three subscription tiers: monthly, quarterly, annual (forever tier eliminated)
- TCPA/CAN-SPAM compliance built into customer_audience table
- Thumper memory as simple chronological notes (no vector search at launch)
- Dashboard-delivered messages (monthly reports, newsletters — not email)
- Photography kit tracking in onboarding (three-tier camera model)

---

## Enums

Define these as PostgreSQL enums before creating tables.

```sql
-- Rep status
CREATE TYPE rep_status AS ENUM ('onboarding', 'active', 'inactive', 'suspended', 'churned');

-- Trade listing status
CREATE TYPE listing_status AS ENUM ('available', 'pending_trade', 'traded', 'removed');

-- Trade request status
CREATE TYPE trade_request_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');

-- Fulfillment status (3-status pipeline — simplified from original 5)
CREATE TYPE fulfillment_status AS ENUM ('approved', 'shipped', 'completed');

-- Calendar event status
CREATE TYPE event_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- Subscription plan tier (forever tier eliminated)
CREATE TYPE plan_tier AS ENUM ('monthly', 'quarterly', 'annual');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'paused');

-- Wallet transaction type
CREATE TYPE wallet_transaction_type AS ENUM ('load', 'sms_charge', 'refund', 'adjustment');

-- Message channel
CREATE TYPE message_channel AS ENUM ('sms', 'email');

-- Content screening result
CREATE TYPE screening_result AS ENUM ('passed', 'flagged', 'blocked');

-- Message delivery status
CREATE TYPE delivery_status AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');

-- Rep message type (dashboard messages)
CREATE TYPE rep_message_type AS ENUM ('monthly_report', 'newsletter', 'announcement', 'support_request', 'support_response');

-- Rep message direction
CREATE TYPE message_direction AS ENUM ('nr_to_rep', 'rep_to_nr');

-- Onboarding stage
CREATE TYPE onboarding_stage AS ENUM (
  'signup_received', 'agreement_sent', 'agreement_signed',
  'payment_received', 'intake_started', 'intake_completed',
  'site_building', 'site_review', 'site_revisions',
  'camera_setup', 'kit_shipped', 'kit_received',
  'thumper_intro', 'launch_ready', 'launched'
);

-- Listing removal reason
CREATE TYPE removal_reason AS ENUM ('sold', 'keeping', 'mistake', 'other');

-- Trade rejection reason
CREATE TYPE rejection_reason AS ENUM ('msrp_mismatch', 'not_interested', 'changed_mind', 'other');

-- Jewelry type prefix
CREATE TYPE jewelry_type AS ENUM ('RG', 'NK', 'ER', 'ST', 'BR');
```

---

## Tables

### 1. reps

The central table. Every other table connects back to this. Linked to Supabase Auth via `auth_user_id`.

```sql
CREATE TABLE reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  custom_domain TEXT UNIQUE,
  template_id TEXT DEFAULT 'default',
  shop_link TEXT,
  streaming_links JSONB DEFAULT '{}',
  social_handles JSONB DEFAULT '{}',
  profile_photo_url TEXT,
  camera_source TEXT DEFAULT 'device',
  status rep_status DEFAULT 'onboarding',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reps_auth_user ON reps(auth_user_id);
CREATE INDEX idx_reps_custom_domain ON reps(custom_domain);
CREATE INDEX idx_reps_status ON reps(status);
```

**Notes:**
- `display_name` is rep-chosen during Thumper onboarding
- `streaming_links` stores TikTok, Facebook Live, YouTube, etc. as JSON
- `social_handles` stores Instagram, TikTok handle, etc.
- `camera_source` tracks whether rep uses lightbox USB webcam or device camera (set during onboarding)
- `template_id` references the design template (4–5 at launch, bundled font+color packages)

---

### 2. collections

Bomb Party jewelry collections. Shared across all reps.

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collections_name ON collections(name);
```

**Notes:**
- Collection is NOT on BP labels — Thumper asks the rep when it's missing
- First rep to add a piece supplies the collection; all future reps inherit it

---

### 3. jewelry_designs

The proprietary Bomb Party jewelry database. Every piece flowing through any rep's trade board gets cataloged here. This is the data asset that doesn't exist publicly.

```sql
CREATE TABLE jewelry_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_number TEXT UNIQUE NOT NULL,
  design_name TEXT NOT NULL,
  collection_id UUID REFERENCES collections(id),
  material TEXT,
  main_stone TEXT,
  bp_msrp DECIMAL(10,2),
  canonical_photo_url TEXT,
  special_features TEXT,
  length_info TEXT,
  type_prefix jewelry_type NOT NULL,
  times_traded INTEGER DEFAULT 0,
  times_listed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_designs_item_number ON jewelry_designs(item_number);
CREATE INDEX idx_designs_collection ON jewelry_designs(collection_id);
CREATE INDEX idx_designs_type ON jewelry_designs(type_prefix);
CREATE INDEX idx_designs_msrp ON jewelry_designs(bp_msrp);
```

**Notes:**
- `item_number` format: two-letter type prefix + 5 digits (e.g., RG31452, NK66139)
- `type_prefix` extracted from item_number: RG=Ring, NK=Necklace, ER=Earrings, ST=Stack, BR=Bracelet
- `collection_id` is nullable — Thumper asks rep when missing, first rep to supply it sets it for all
- `canonical_photo_url` is the best photo in the database for this design; upgradeable by future reps
- `times_traded` increments on every successful trade across all reps
- `times_listed` increments every time any rep lists this design
- Dedup is SIMPLE exact match on `item_number` — no fuzzy matching needed

---

### 4. trade_listings

Individual listings on a rep's trade board. Each listing links one rep to one jewelry design.

```sql
CREATE TABLE trade_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES jewelry_designs(id),
  listing_photo_url TEXT,
  uses_canonical_photo BOOLEAN DEFAULT true,
  trade_preferences TEXT,
  rep_notes TEXT,
  status listing_status DEFAULT 'available',
  removal_reason removal_reason,
  listed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_listings_rep ON trade_listings(rep_id);
CREATE INDEX idx_listings_design ON trade_listings(design_id);
CREATE INDEX idx_listings_status ON trade_listings(status);
CREATE INDEX idx_listings_rep_status ON trade_listings(rep_id, status);
```

**Notes:**
- One board per rep (KISS) — no board_id needed
- `uses_canonical_photo` = true means listing displays the database canonical photo, false means rep uploaded their own
- `listed_at` is separate from `created_at` — a listing can be created as draft then published
- `removal_reason` populated when status changes to 'removed' (sold/keeping/mistake/other)
- Soft-remove only — no hard deletes. Status changes to 'removed', pending trade requests auto-cancelled.
- When status is 'pending_trade', the piece temporarily disappears from the public board

---

### 5. trade_requests

Customer-submitted trade requests. Simple three-field form: name, description, submit.

```sql
CREATE TABLE trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES trade_listings(id),
  customer_name TEXT NOT NULL,
  customer_description TEXT NOT NULL,
  status trade_request_status DEFAULT 'pending',
  rejection_reason rejection_reason,
  rep_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_requests_listing ON trade_requests(listing_id);
CREATE INDEX idx_requests_status ON trade_requests(status);
```

**Notes:**
- No MSRP field — rep is the value gatekeeper, not the platform
- No photo upload from customer
- On submission: linked listing status changes to 'pending_trade' (piece temporarily disappears from public board)
- On approval: listing status → 'traded', other pending requests for same listing → auto-cancelled
- On rejection: listing status reverts to 'available' (piece reappears)
- Trade board enforces one-for-one trades ONLY. No purchases. No cash transactions.

---

### 6. trade_fulfillment

Post-approval pipeline. 3 statuses: approved → shipped → completed. One-way shipping only (rep → customer).

```sql
CREATE TABLE trade_fulfillment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE NOT NULL REFERENCES trade_requests(id),
  fulfillment_status fulfillment_status DEFAULT 'approved',
  shipping_notes TEXT,
  received_listing_id UUID REFERENCES trade_listings(id),
  status_updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fulfillment_request ON trade_fulfillment(request_id);
CREATE INDEX idx_fulfillment_status ON trade_fulfillment(fulfillment_status);
```

**Notes:**
- Created automatically when approve_trade runs
- Forward-only status progression: approved → shipped → completed. No going backward.
- `shipping_notes` = tracking number, shipping method, address for rep → customer shipment
- `received_listing_id` = if rep adds the revealed piece to their board on completion, this links to the new listing
- One-way shipping ONLY: rep ships board piece to customer. Rep already has customer's revealed piece from the show.
- Thumper nudges: 3+ days at 'approved', 5+ days at 'shipped'
- On completion: Thumper asks "Want to add the piece you got from [customer] to your board?" → kicks off add_listing if yes

---

### 7. calendar_events

Rep show schedule. Drives pre-show reminders and the "What is a Bomb Party?" section on the homepage.

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  discount_code TEXT,
  discount_description TEXT,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  status event_status DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_rep ON calendar_events(rep_id);
CREATE INDEX idx_events_time ON calendar_events(event_time);
CREATE INDEX idx_events_rep_status ON calendar_events(rep_id, status);
```

**Notes:**
- Homepage shows next two upcoming events
- Event times display in viewer's local timezone (not rep's)
- Discount codes copy to clipboard on tap
- "Add to Calendar" generates .ics download
- Pre-show SMS reminder wired to this table (Phase 5)

---

### 8. customer_audience

Rep's opt-in subscriber list. TCPA/CAN-SPAM compliant from day one.

```sql
CREATE TABLE customer_audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sms_consent BOOLEAN DEFAULT false,
  email_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  sms_opted_out_at TIMESTAMPTZ,
  email_opted_out_at TIMESTAMPTZ,
  stop_keyword_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audience_rep ON customer_audience(rep_id);
CREATE INDEX idx_audience_phone ON customer_audience(phone);
CREATE INDEX idx_audience_email ON customer_audience(email);
```

**Notes:**
- Consent checkboxes must be UNCHECKED by default on signup forms (TCPA requirement)
- Marketing consent is separate from transactional consent
- `stop_keyword_received_at` tracks when customer sent STOP/QUIT/CANCEL/UNSUBSCRIBE/END — required for TCPA compliance
- `sms_opted_out_at` and `email_opted_out_at` track opt-out timestamps separately
- Consent records must be retainable for 5 years (TCPA)
- Sending hours enforced: 8am–9pm recipient's local timezone

---

### 9. sms_wallet

Rep's pre-loaded SMS balance. Stripe-backed. $25 minimum load. Fees absorbed into NR margin.

```sql
CREATE TABLE sms_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID UNIQUE NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  auto_recharge_enabled BOOLEAN DEFAULT false,
  auto_recharge_threshold DECIMAL(10,2) DEFAULT 5.00,
  auto_recharge_amount DECIMAL(10,2) DEFAULT 25.00,
  minimum_load_amount DECIMAL(10,2) DEFAULT 25.00,
  last_loaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wallet_rep ON sms_wallet(rep_id);
```

**Notes:**
- $25 minimum load (adjustable later based on data)
- $0.009/msg deduction per SMS send ($0.007 Telnyx cost + $0.002 NR margin)
- Stripe transaction fees absorbed into NR margin — rep sees clean round numbers
- Hard stop if wallet empty — no negative balance, no sends
- Auto-recharge kicks in when balance drops below threshold
- NR HQ dashboard tracks: total wallet loads, Stripe fees paid, SMS margin collected, net profit/loss

---

### 10. wallet_transactions

Every wallet load and SMS charge logged. Feeds NR HQ margin tracking dashboard.

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES sms_wallet(id) ON DELETE CASCADE,
  type wallet_transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_fee DECIMAL(10,4),
  stripe_payment_intent_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at);
```

**Notes:**
- `stripe_fee` recorded on every 'load' transaction — this is how Louis tracks whether the margin covers Stripe fees
- 'sms_charge' type deducts $0.009 per message
- 'refund' type for any wallet balance refunds
- 'adjustment' type for manual corrections by Louis

---

### 11. message_log

Record of every SMS and email sent through the platform. Content screening results logged.

```sql
CREATE TABLE message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  channel message_channel NOT NULL,
  recipient TEXT NOT NULL,
  content_preview TEXT,
  screening_result screening_result,
  screening_notes TEXT,
  delivery_status delivery_status DEFAULT 'queued',
  cost DECIMAL(10,4),
  is_automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_rep ON message_log(rep_id);
CREATE INDEX idx_messages_channel ON message_log(channel);
CREATE INDEX idx_messages_sent ON message_log(sent_at);
```

**Notes:**
- All manual (rep-composed) messages screened by AI agent before sending
- Automated messages (pre-show reminders) are pre-approved templates — no screening needed
- `is_automated` distinguishes between automated reminders and manual messages
- Send caps enforced by Thumper: 1 automated pre-show reminder per show, 3 manual SMS/week, 3 manual emails/week
- `cost` tracks the $0.009 SMS charge (email has no per-message cost)

---

### 12. rep_notes

Thumper's memory. Simple chronological conversation summaries per rep. No vector search at launch.

```sql
CREATE TABLE rep_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  conversation_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_rep ON rep_notes(rep_id);
CREATE INDEX idx_notes_date ON rep_notes(conversation_date DESC);
```

**Notes:**
- End-of-conversation summary write by Thumper
- Next conversation loads recent notes for context
- KISS approach — no vector search, no embeddings. Simple chronological text.
- Can be upgraded to vector search post-launch if needed

---

### 13. rep_messages

Dashboard-delivered messages: monthly reports, newsletters, NR announcements, rep-to-NR support.

```sql
CREATE TABLE rep_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  message_type rep_message_type NOT NULL,
  direction message_direction NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rep_messages_rep ON rep_messages(rep_id);
CREATE INDEX idx_rep_messages_type ON rep_messages(message_type);
CREATE INDEX idx_rep_messages_unread ON rep_messages(rep_id, is_read) WHERE is_read = false;
```

**Notes:**
- Monthly report + newsletter delivered here, NOT via email
- Serves three purposes: (1) report/newsletter delivery, (2) rep-to-NR communication, (3) NR-to-rep announcements
- `is_read` + `read_at` enables read/unread tracking — Louis can see in NR HQ who has seen their report
- If Thumper is down, reps can contact NR through this channel as backup
- Report delivery: within 7 days of month end, automated generation + human QA

---

### 14. site_settings

Per-rep website customization. Controls banner, ticker, hero, and page visibility.

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID UNIQUE NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  banner_text TEXT,
  banner_visible BOOLEAN DEFAULT false,
  ticker_text TEXT,
  ticker_visible BOOLEAN DEFAULT false,
  tagline TEXT,
  hero_image_url TEXT,
  hero_animation_type TEXT DEFAULT 'zoom',
  team_name TEXT,
  show_join_page BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_site_settings_rep ON site_settings(rep_id);
```

**Notes:**
- All settings controllable by rep via Thumper tools (update_banner_text, toggle_banner, etc.)
- Template variable system pulls from reps table (name, business_name, shop_link, etc.) and this table
- `show_join_page` = false hides the Join Team page from nav (rep can opt out)
- `hero_animation_type` controls the hero image animation (zoom, pan — from site spec)

---

### 15. subscriptions

Stripe subscription management. Universal pro-rata cancellation policy.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID UNIQUE NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_tier plan_tier NOT NULL,
  status subscription_status DEFAULT 'active',
  monthly_amount DECIMAL(10,2),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  cancellation_effective_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_rep ON subscriptions(rep_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**Notes:**
- Three tiers only: monthly, quarterly, annual. Forever tier eliminated.
- Universal cancellation policy: cancel anytime, service through end of current month, pro-rata refund for unused time
- `cancelled_reason` tracks why reps leave — business intelligence for Louis
- `cancellation_effective_date` = end of the current calendar month when cancellation was requested
- Self-service cancellation button in rep dashboard (FTC Click-to-Cancel compliant)
- Automated renewal reminder 30 days before annual renewal (Florida § 501.165)
- Stripe webhooks update this table on subscription create/update/cancel events

---

### 16. onboarding_status

Tracks each rep's progress through the onboarding pipeline. Photography kit tracking included.

```sql
CREATE TABLE onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID UNIQUE NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  current_stage onboarding_stage DEFAULT 'signup_received',
  completed_steps JSONB DEFAULT '[]',
  camera_type TEXT,
  camera_quality_passed BOOLEAN,
  lightbox_shipped BOOLEAN DEFAULT false,
  lightbox_shipped_at TIMESTAMPTZ,
  kit_received BOOLEAN DEFAULT false,
  kit_received_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_onboarding_rep ON onboarding_status(rep_id);
CREATE INDEX idx_onboarding_stage ON onboarding_status(current_stage);
```

**Notes:**
- Photography kit three-tier model: (1) rep has own camera that passes quality bar — lightbox only shipped, (2) rep needs camera — lightbox + NR webcam shipped, (3) fallback — phone/device camera with lightbox
- `camera_type` records what the rep is using (own_camera, nr_webcam, phone_fallback)
- `camera_quality_passed` = Thumper's vision evaluation of test photo during onboarding
- `completed_steps` JSONB array tracks granular step completion within the current stage
- Onboarding stages align with the lifecycle workflow in NR HQ

---

## Row-Level Security (RLS)

Every table has RLS enabled. Two roles: rep (can only see own data) and admin (Louis — sees all).

### RLS Policy Pattern

```sql
-- Enable RLS on every table
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Rep can only see/modify their own data
CREATE POLICY "reps_own_data" ON [table_name]
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

-- Admin (Louis) can see all data
CREATE POLICY "admin_full_access" ON [table_name]
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );
```

### Special Cases

**jewelry_designs** — shared across all reps (read access for all authenticated users, write restricted):
```sql
-- All reps can read (for search_jewelry_database tool)
CREATE POLICY "designs_read_all" ON jewelry_designs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin can insert/update (via shared service layer)
CREATE POLICY "designs_write_admin" ON jewelry_designs
  FOR INSERT
  USING (true);  -- Service layer handles write permissions
```

**collections** — same pattern as jewelry_designs (shared read, controlled write).

**trade_requests** — public insert (customers submit without auth), rep reads own:
```sql
-- Customers can submit trade requests (no auth required)
CREATE POLICY "requests_public_insert" ON trade_requests
  FOR INSERT
  WITH CHECK (true);

-- Reps can read requests for their own listings
CREATE POLICY "requests_rep_read" ON trade_requests
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM trade_listings
      WHERE rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  );
```

---

## Realtime

Enable Supabase Realtime on these tables for live updates:

- `trade_requests` — real-time trade notifications during live shows
- `trade_listings` — board updates reflected immediately
- `calendar_events` — dynamic show schedule updates
- `rep_messages` — notification badge for new messages

---

## Seed Data (Task 0.6 — Lindsey Prototype)

```sql
-- Create Lindsey's rep profile (after auth account exists)
INSERT INTO reps (auth_user_id, display_name, business_name, email, custom_domain, template_id, status)
VALUES ('[lindsey_auth_id]', 'Lindsey', 'Mile High Fizz', 'lindsey@email.com', 'milehighfizz.com', 'default', 'active');

-- Create her site settings
INSERT INTO site_settings (rep_id, tagline, show_join_page) VALUES ('[lindsey_rep_id]', 'Your Fizzy Jewelry Destination', true);

-- Create her SMS wallet
INSERT INTO sms_wallet (rep_id, balance) VALUES ('[lindsey_rep_id]', 25.00);

-- Create her subscription
INSERT INTO subscriptions (rep_id, plan_tier, status, monthly_amount) VALUES ('[lindsey_rep_id]', 'monthly', 'active', 0.00);

-- Create her onboarding status
INSERT INTO onboarding_status (rep_id, current_stage) VALUES ('[lindsey_rep_id]', 'launched');

-- Seed a few test collections
INSERT INTO collections (name) VALUES ('March 2026'), ('Galaxy'), ('Celestial');

-- Seed a few test jewelry designs
INSERT INTO jewelry_designs (item_number, design_name, collection_id, material, main_stone, bp_msrp, type_prefix)
VALUES
  ('RG31452', 'The Celeste Ring', (SELECT id FROM collections WHERE name = 'Celestial'), 'Rhodium Plating', 'Lab-Created Emerald', 128.00, 'RG'),
  ('NK66139', 'In The Orbit Of Grace', (SELECT id FROM collections WHERE name = 'Galaxy'), 'Rose Gold Plating', 'Lab Created Citrine', 134.00, 'NK'),
  ('ER84972', 'Sculpted To Shimmer', (SELECT id FROM collections WHERE name = 'March 2026'), 'Rhodium Plating', 'Garnet Cubic Zirconia', 138.00, 'ER');

-- Seed a few test listings on Lindsey's board
INSERT INTO trade_listings (rep_id, design_id, uses_canonical_photo, status, listed_at)
VALUES
  ('[lindsey_rep_id]', (SELECT id FROM jewelry_designs WHERE item_number = 'RG31452'), true, 'available', now()),
  ('[lindsey_rep_id]', (SELECT id FROM jewelry_designs WHERE item_number = 'NK66139'), true, 'available', now());
```

---

## Cross-Reference: Schema ↔ Thumper Tools

Every tool from Gap 22 (Session #21) maps to these tables:

| Tool | Tables Read | Tables Written |
|------|------------|----------------|
| add_listing | jewelry_designs, collections | jewelry_designs (INSERT/UPDATE), trade_listings (INSERT), collections (INSERT) |
| get_my_board | trade_listings, jewelry_designs, collections, trade_requests | — (pure read) |
| remove_listing | trade_listings, trade_requests | trade_listings (UPDATE), trade_requests (UPDATE) |
| get_trade_requests | trade_requests, trade_listings, jewelry_designs | — (pure read) |
| approve_trade | trade_requests, trade_listings, trade_fulfillment, jewelry_designs | trade_requests (UPDATE), trade_listings (UPDATE), trade_fulfillment (INSERT), jewelry_designs (UPDATE times_traded) |
| reject_trade | trade_requests, trade_listings | trade_requests (UPDATE), trade_listings (UPDATE) |
| search_jewelry_database | jewelry_designs, collections, trade_listings | — (pure read, aggregate only) |
| update_listing | trade_listings | trade_listings (UPDATE) |
| get_trade_history | trade_requests, trade_fulfillment, trade_listings, jewelry_designs, collections | — (pure read) |
| update_fulfillment_status | trade_fulfillment | trade_fulfillment (UPDATE) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 11, 2026 | Initial schema — 16 tables, all enums, RLS policies, Realtime config, seed data, tool cross-reference |

---

*This schema is the single source of truth for all Sparkle Suite database tables. Update it when tables change. Do not update it for planned-but-not-yet-built features — those go to Open Brain or the parking lot in SS_KB_OpenItems.*
