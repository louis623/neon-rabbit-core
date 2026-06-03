ALTER TABLE stripe_events
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'processed'
    CHECK (processing_status IN ('processing', 'processed', 'failed')),
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE light_box_fulfillment_tasks
  ADD COLUMN IF NOT EXISTS alert_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS alert_error TEXT;

UPDATE stripe_events
SET
  processing_status = 'processed',
  processing_finished_at = COALESCE(processing_finished_at, processed_at, now())
WHERE processing_status = 'processed'
  AND processing_finished_at IS NULL;

CREATE OR REPLACE FUNCTION claim_stripe_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_retry_after INTERVAL DEFAULT INTERVAL '10 minutes'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed BOOLEAN := FALSE;
BEGIN
  INSERT INTO stripe_events (
    id,
    event_type,
    processed_at,
    processing_status,
    processing_started_at,
    processing_finished_at,
    retry_count,
    last_error
  )
  VALUES (
    p_event_id,
    p_event_type,
    NULL,
    'processing',
    now(),
    NULL,
    0,
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    event_type = EXCLUDED.event_type,
    processing_status = 'processing',
    processing_started_at = now(),
    processing_finished_at = NULL,
    retry_count = stripe_events.retry_count + 1,
    last_error = NULL
  WHERE stripe_events.processing_status = 'failed'
     OR (
       stripe_events.processing_status = 'processing'
       AND stripe_events.processing_started_at < now() - p_retry_after
     )
  RETURNING TRUE INTO claimed;

  RETURN COALESCE(claimed, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION mark_stripe_event_processed(
  p_event_id TEXT,
  p_event_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO stripe_events (
    id,
    event_type,
    processed_at,
    processing_status,
    processing_started_at,
    processing_finished_at,
    last_error
  )
  VALUES (
    p_event_id,
    p_event_type,
    now(),
    'processed',
    now(),
    now(),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    event_type = EXCLUDED.event_type,
    processed_at = now(),
    processing_status = 'processed',
    processing_finished_at = now(),
    last_error = NULL;
END;
$$;

CREATE OR REPLACE FUNCTION mark_stripe_event_failed(
  p_event_id TEXT,
  p_event_type TEXT,
  p_error TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO stripe_events (
    id,
    event_type,
    processing_status,
    processing_started_at,
    processing_finished_at,
    last_error
  )
  VALUES (
    p_event_id,
    p_event_type,
    'failed',
    now(),
    now(),
    LEFT(p_error, 1000)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    event_type = EXCLUDED.event_type,
    processing_status = 'failed',
    processing_finished_at = now(),
    last_error = LEFT(p_error, 1000);
END;
$$;

REVOKE ALL ON FUNCTION claim_stripe_event(TEXT, TEXT, INTERVAL) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION mark_stripe_event_processed(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION mark_stripe_event_failed(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION claim_stripe_event(TEXT, TEXT, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION mark_stripe_event_processed(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION mark_stripe_event_failed(TEXT, TEXT, TEXT) TO service_role;
