-- ============================================================================
-- Sparkle Suite Schema Migration
-- 16 tables, 17 enums, all indexes, RLS policies, Realtime, 3 RPC functions
-- Source: SS_Supabase_Schema_v1_0.md + SS_Service_Layer_Spec_v1_0.md
-- ============================================================================

-- ============================================================================
-- SECTION A: ENUMS (17 types)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE rep_status AS ENUM ('onboarding', 'active', 'inactive', 'suspended', 'churned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('available', 'pending_trade', 'traded', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trade_request_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_status AS ENUM ('approved', 'shipped', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('monthly', 'quarterly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_transaction_type AS ENUM ('load', 'sms_charge', 'refund', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_channel AS ENUM ('sms', 'email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE screening_result AS ENUM ('passed', 'flagged', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rep_message_type AS ENUM ('monthly_report', 'newsletter', 'announcement', 'support_request', 'support_response');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_direction AS ENUM ('nr_to_rep', 'rep_to_nr');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE onboarding_stage AS ENUM (
    'signup_received', 'agreement_sent', 'agreement_signed',
    'payment_received', 'intake_started', 'intake_completed',
    'site_building', 'site_review', 'site_revisions',
    'camera_setup', 'kit_shipped', 'kit_received',
    'thumper_intro', 'launch_ready', 'launched'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE removal_reason AS ENUM ('sold', 'keeping', 'mistake', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rejection_reason AS ENUM ('msrp_mismatch', 'not_interested', 'changed_mind', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE jewelry_type AS ENUM ('RG', 'NK', 'ER', 'ST', 'BR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION B: TABLES (16 tables in dependency order)
-- ============================================================================

-- 1. reps
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

-- 2. collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. jewelry_designs
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

-- 4. trade_listings
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

-- 5. trade_requests
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

-- 6. trade_fulfillment
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

-- 7. calendar_events
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

-- 8. customer_audience
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

-- 9. sms_wallet
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

-- 10. wallet_transactions
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

-- 11. message_log
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

-- 12. rep_notes
CREATE TABLE rep_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  conversation_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. rep_messages
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

-- 14. site_settings
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

-- 15. subscriptions
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

-- 16. onboarding_status
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

-- ============================================================================
-- SECTION C: INDEXES (from Schema Doc)
-- ============================================================================

-- reps indexes
CREATE INDEX idx_reps_auth_user ON reps(auth_user_id);
CREATE INDEX idx_reps_custom_domain ON reps(custom_domain);
CREATE INDEX idx_reps_status ON reps(status);

-- collections indexes
CREATE INDEX idx_collections_name ON collections(name);

-- jewelry_designs indexes
CREATE INDEX idx_designs_item_number ON jewelry_designs(item_number);
CREATE INDEX idx_designs_collection ON jewelry_designs(collection_id);
CREATE INDEX idx_designs_type ON jewelry_designs(type_prefix);
CREATE INDEX idx_designs_msrp ON jewelry_designs(bp_msrp);

-- trade_listings indexes
CREATE INDEX idx_listings_rep ON trade_listings(rep_id);
CREATE INDEX idx_listings_design ON trade_listings(design_id);
CREATE INDEX idx_listings_status ON trade_listings(status);
CREATE INDEX idx_listings_rep_status ON trade_listings(rep_id, status);

-- trade_requests indexes
CREATE INDEX idx_requests_listing ON trade_requests(listing_id);
CREATE INDEX idx_requests_status ON trade_requests(status);

-- trade_fulfillment indexes
CREATE INDEX idx_fulfillment_request ON trade_fulfillment(request_id);
CREATE INDEX idx_fulfillment_status ON trade_fulfillment(fulfillment_status);

-- calendar_events indexes
CREATE INDEX idx_events_rep ON calendar_events(rep_id);
CREATE INDEX idx_events_time ON calendar_events(event_time);
CREATE INDEX idx_events_rep_status ON calendar_events(rep_id, status);

-- customer_audience indexes
CREATE INDEX idx_audience_rep ON customer_audience(rep_id);
CREATE INDEX idx_audience_phone ON customer_audience(phone);
CREATE INDEX idx_audience_email ON customer_audience(email);

-- sms_wallet indexes
CREATE INDEX idx_wallet_rep ON sms_wallet(rep_id);

-- wallet_transactions indexes
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at);

-- message_log indexes
CREATE INDEX idx_messages_rep ON message_log(rep_id);
CREATE INDEX idx_messages_channel ON message_log(channel);
CREATE INDEX idx_messages_sent ON message_log(sent_at);

-- rep_notes indexes
CREATE INDEX idx_notes_rep ON rep_notes(rep_id);
CREATE INDEX idx_notes_date ON rep_notes(conversation_date DESC);

-- rep_messages indexes
CREATE INDEX idx_rep_messages_rep ON rep_messages(rep_id);
CREATE INDEX idx_rep_messages_type ON rep_messages(message_type);
CREATE INDEX idx_rep_messages_unread ON rep_messages(rep_id, is_read) WHERE is_read = false;

-- site_settings indexes
CREATE INDEX idx_site_settings_rep ON site_settings(rep_id);

-- subscriptions indexes
CREATE INDEX idx_subscriptions_rep ON subscriptions(rep_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- onboarding_status indexes
CREATE INDEX idx_onboarding_rep ON onboarding_status(rep_id);
CREATE INDEX idx_onboarding_stage ON onboarding_status(current_stage);

-- ============================================================================
-- SECTION D: ADDITIONAL INDEXES (from Service Layer Spec)
-- ============================================================================

-- One-request-per-piece rule: only one pending request per listing at a time
CREATE UNIQUE INDEX idx_one_pending_request_per_listing
  ON trade_requests(listing_id)
  WHERE status = 'pending';

-- Full-text search on jewelry designs (design_name, material, main_stone)
CREATE INDEX idx_designs_fulltext ON jewelry_designs
  USING GIN (to_tsvector('english',
    coalesce(design_name, '') || ' ' ||
    coalesce(material, '') || ' ' ||
    coalesce(main_stone, '')));

-- ============================================================================
-- SECTION E: ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all 16 tables
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_fulfillment ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_audience ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_status ENABLE ROW LEVEL SECURITY;

-- ---- reps (special: uses auth_user_id = auth.uid() directly) ----

CREATE POLICY "reps_own_data" ON reps
  FOR ALL
  USING (auth_user_id = auth.uid());

CREATE POLICY "reps_admin_full_access" ON reps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps r
      WHERE r.auth_user_id = auth.uid()
      AND r.email = 'louis@neonrabbit.net'
    )
  );

-- ---- collections (shared read, controlled write — same as jewelry_designs) ----

CREATE POLICY "collections_read_all" ON collections
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "collections_write_admin" ON collections
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "collections_admin_full_access" ON collections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- jewelry_designs (shared read, controlled write) ----

CREATE POLICY "designs_read_all" ON jewelry_designs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "designs_write_admin" ON jewelry_designs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "designs_admin_full_access" ON jewelry_designs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- trade_listings ----

CREATE POLICY "listings_own_data" ON trade_listings
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "listings_admin_full_access" ON trade_listings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- trade_requests (special: public INSERT, rep reads own listings' requests) ----

CREATE POLICY "requests_public_insert" ON trade_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "requests_rep_read" ON trade_requests
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM trade_listings
      WHERE rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "requests_admin_full_access" ON trade_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- trade_fulfillment ----

CREATE POLICY "fulfillment_own_data" ON trade_fulfillment
  FOR ALL
  USING (
    request_id IN (
      SELECT tr.id FROM trade_requests tr
      JOIN trade_listings tl ON tr.listing_id = tl.id
      WHERE tl.rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "fulfillment_admin_full_access" ON trade_fulfillment
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- calendar_events ----

CREATE POLICY "events_own_data" ON calendar_events
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "events_admin_full_access" ON calendar_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- customer_audience ----

CREATE POLICY "audience_own_data" ON customer_audience
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "audience_admin_full_access" ON customer_audience
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- sms_wallet ----

CREATE POLICY "wallet_own_data" ON sms_wallet
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "wallet_admin_full_access" ON sms_wallet
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- wallet_transactions ----

CREATE POLICY "wallet_tx_own_data" ON wallet_transactions
  FOR ALL
  USING (
    wallet_id IN (
      SELECT id FROM sms_wallet
      WHERE rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "wallet_tx_admin_full_access" ON wallet_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- message_log ----

CREATE POLICY "message_log_own_data" ON message_log
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "message_log_admin_full_access" ON message_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- rep_notes ----

CREATE POLICY "rep_notes_own_data" ON rep_notes
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "rep_notes_admin_full_access" ON rep_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- rep_messages ----

CREATE POLICY "rep_messages_own_data" ON rep_messages
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "rep_messages_admin_full_access" ON rep_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- site_settings ----

CREATE POLICY "site_settings_own_data" ON site_settings
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "site_settings_admin_full_access" ON site_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- subscriptions ----

CREATE POLICY "subscriptions_own_data" ON subscriptions
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "subscriptions_admin_full_access" ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ---- onboarding_status ----

CREATE POLICY "onboarding_own_data" ON onboarding_status
  FOR ALL
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "onboarding_admin_full_access" ON onboarding_status
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

-- ============================================================================
-- SECTION F: REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE trade_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE trade_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE rep_messages;

-- ============================================================================
-- SECTION G: RPC FUNCTIONS (3 atomic operations)
-- ============================================================================

-- 1. rpc_submit_trade_request
CREATE OR REPLACE FUNCTION rpc_submit_trade_request(
  p_listing_id UUID,
  p_customer_name TEXT,
  p_customer_description TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing RECORD;
  v_request_id UUID;
BEGIN
  -- Lock listing row to prevent race conditions
  SELECT id, status INTO v_listing
  FROM trade_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  -- Verify listing exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  -- Verify listing is available
  IF v_listing.status != 'available' THEN
    RAISE EXCEPTION 'REQUEST_ALREADY_EXISTS';
  END IF;

  -- Insert trade request
  INSERT INTO trade_requests (listing_id, customer_name, customer_description, status)
  VALUES (p_listing_id, p_customer_name, p_customer_description, 'pending')
  RETURNING id INTO v_request_id;

  -- Update listing status to pending_trade
  UPDATE trade_listings
  SET status = 'pending_trade', updated_at = now()
  WHERE id = p_listing_id;

  RETURN json_build_object(
    'request_id', v_request_id,
    'listing_id', p_listing_id
  );
END;
$$;

-- 2. rpc_approve_trade
CREATE OR REPLACE FUNCTION rpc_approve_trade(
  p_request_id UUID,
  p_rep_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_listing RECORD;
  v_fulfillment_id UUID;
BEGIN
  -- Lock and fetch the request
  SELECT id, listing_id, customer_name, status INTO v_request
  FROM trade_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'REQUEST_NOT_PENDING';
  END IF;

  -- Fetch the listing to get design_id
  SELECT id, design_id INTO v_listing
  FROM trade_listings
  WHERE id = v_request.listing_id
  FOR UPDATE;

  -- Step 1: Update trade request status to approved
  UPDATE trade_requests
  SET status = 'approved', rep_notes = p_rep_notes, updated_at = now()
  WHERE id = p_request_id;

  -- Step 2: Update listing status to traded
  UPDATE trade_listings
  SET status = 'traded', updated_at = now()
  WHERE id = v_request.listing_id;

  -- Step 3: Insert fulfillment row
  INSERT INTO trade_fulfillment (request_id, fulfillment_status)
  VALUES (p_request_id, 'approved')
  RETURNING id INTO v_fulfillment_id;

  -- Step 4: Increment times_traded on jewelry_designs
  UPDATE jewelry_designs
  SET times_traded = times_traded + 1, updated_at = now()
  WHERE id = v_listing.design_id;

  RETURN json_build_object(
    'request_id', p_request_id,
    'fulfillment_id', v_fulfillment_id,
    'listing_id', v_request.listing_id,
    'customer_name', v_request.customer_name
  );
END;
$$;

-- 3. rpc_reject_trade
CREATE OR REPLACE FUNCTION rpc_reject_trade(
  p_request_id UUID,
  p_reason rejection_reason DEFAULT NULL,
  p_rep_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Lock and fetch the request
  SELECT id, listing_id, customer_name, status INTO v_request
  FROM trade_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'REQUEST_NOT_PENDING';
  END IF;

  -- Step 1: Update request to denied
  UPDATE trade_requests
  SET status = 'denied', rejection_reason = p_reason, rep_notes = p_rep_notes, updated_at = now()
  WHERE id = p_request_id;

  -- Step 2: Restore listing to available
  UPDATE trade_listings
  SET status = 'available', updated_at = now()
  WHERE id = v_request.listing_id;

  RETURN json_build_object(
    'request_id', p_request_id,
    'listing_id', v_request.listing_id,
    'listing_restored', true
  );
END;
$$;
