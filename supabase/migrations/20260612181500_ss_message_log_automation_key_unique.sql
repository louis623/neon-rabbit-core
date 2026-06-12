-- Sparkle Suite automated reminder duplicate guard
-- Why: query-before-send is not atomic. The database must prevent two workers
-- from queueing the same automated reminder key at the same time.

BEGIN;

ALTER TABLE message_log
  ADD COLUMN IF NOT EXISTS automation_key TEXT;

DROP INDEX IF EXISTS idx_messages_automation_key;

WITH ranked_automation_keys AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY automation_key
      ORDER BY created_at ASC, id ASC
    ) AS duplicate_rank
  FROM message_log
  WHERE is_automated IS TRUE
    AND automation_key IS NOT NULL
    AND delivery_status IN ('queued', 'sent', 'delivered')
)
UPDATE message_log
SET automation_key = NULL
FROM ranked_automation_keys
WHERE message_log.id = ranked_automation_keys.id
  AND ranked_automation_keys.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_automation_key_unique
  ON message_log(automation_key)
  WHERE is_automated IS TRUE
    AND automation_key IS NOT NULL
    AND delivery_status IN ('queued', 'sent', 'delivered');

COMMIT;
