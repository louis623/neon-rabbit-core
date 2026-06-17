-- Temporary reveal screenshots for customer-submitted Trade Board requests.
-- Screenshots help reps confirm the just-revealed piece, but they are not
-- long-term Trade Board assets and are eligible for cleanup after 48 hours.

ALTER TABLE public.trade_requests
  ADD COLUMN IF NOT EXISTS reveal_screenshot_path TEXT,
  ADD COLUMN IF NOT EXISTS reveal_screenshot_content_type TEXT,
  ADD COLUMN IF NOT EXISTS reveal_screenshot_size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS reveal_screenshot_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reveal_screenshot_expires_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trade_requests_reveal_screenshot_content_type_check'
  ) THEN
    ALTER TABLE public.trade_requests
      ADD CONSTRAINT trade_requests_reveal_screenshot_content_type_check
      CHECK (
        reveal_screenshot_content_type IS NULL
        OR reveal_screenshot_content_type IN (
          'image/jpeg',
          'image/png',
          'image/webp'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trade_requests_reveal_screenshot_size_bytes_check'
  ) THEN
    ALTER TABLE public.trade_requests
      ADD CONSTRAINT trade_requests_reveal_screenshot_size_bytes_check
      CHECK (
        reveal_screenshot_size_bytes IS NULL
        OR (
          reveal_screenshot_size_bytes > 0
          AND reveal_screenshot_size_bytes <= 8388608
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trade_requests_reveal_screenshot_expiry_check'
  ) THEN
    ALTER TABLE public.trade_requests
      ADD CONSTRAINT trade_requests_reveal_screenshot_expiry_check
      CHECK (
        reveal_screenshot_expires_at IS NULL
        OR reveal_screenshot_uploaded_at IS NULL
        OR reveal_screenshot_expires_at > reveal_screenshot_uploaded_at
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trade_requests_reveal_screenshot_expiry
  ON public.trade_requests(reveal_screenshot_expires_at)
  WHERE reveal_screenshot_path IS NOT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-request-screenshots', 'trade-request-screenshots', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "trade_request_screenshots_rep_read" ON storage.objects;
CREATE POLICY "trade_request_screenshots_rep_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trade-request-screenshots'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "trade_request_screenshots_rep_insert" ON storage.objects;
CREATE POLICY "trade_request_screenshots_rep_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trade-request-screenshots'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  );

-- No public read policy. The app generates short-lived signed URLs only after
-- a rep has passed the Trade Board request ownership check.
