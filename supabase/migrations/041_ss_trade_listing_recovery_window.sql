-- Phase 3 launch hardening: soft-delete recovery window support.
-- `status='removed'` remains the soft-delete marker; deleted_at makes the
-- recovery/purge window explicit and configurable in app code.

ALTER TABLE trade_listings
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trade_listings_removed_deleted_at
  ON trade_listings (deleted_at)
  WHERE status = 'removed';
