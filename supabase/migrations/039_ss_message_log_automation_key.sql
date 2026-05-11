-- Sparkle Suite message-log automation key
-- Why: automated show reminders need a stable idempotency key so we can
-- enforce one reminder per show before the Phase 5.7 calendar trigger lands.

BEGIN;

ALTER TABLE message_log
  ADD COLUMN IF NOT EXISTS automation_key TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_automation_key
  ON message_log(rep_id, channel, automation_key)
  WHERE automation_key IS NOT NULL;

COMMIT;
