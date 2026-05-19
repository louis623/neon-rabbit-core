-- 20260519192500: Track Stripe subscription schedules for founder step-up billing

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_schedule
  ON subscriptions(stripe_subscription_schedule_id)
  WHERE stripe_subscription_schedule_id IS NOT NULL;
