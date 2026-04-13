-- 008: Stripe billing infrastructure
-- Adds idempotency ledger, refund state machine, and schema additions for billing

-- Add 'trialing' to subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';

-- Add missing columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_livemode BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS stripe_event_timestamp BIGINT;

-- Add stripe_customer_id to reps for direct customer lookup
ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_reps_stripe_customer
  ON reps(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Stripe event idempotency ledger
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,  -- Stripe event.id (evt_xxx)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Refund operation state machine
CREATE TABLE IF NOT EXISTS refund_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_subscription_id TEXT NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  refund_amount_cents INTEGER NOT NULL,
  stripe_refund_id TEXT,
  stripe_livemode BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, cancelled, refunded, failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (stripe_subscription_id, billing_period_start)
);

-- RLS policies
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_operations ENABLE ROW LEVEL SECURITY;

-- Only service role can access stripe_events (webhook handler uses admin client)
CREATE POLICY "stripe_events_service_only" ON stripe_events
  FOR ALL USING (false);

-- Only service role can access refund_operations
CREATE POLICY "refund_operations_service_only" ON refund_operations
  FOR ALL USING (false);
