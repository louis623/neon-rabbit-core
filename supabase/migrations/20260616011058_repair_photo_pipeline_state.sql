-- Repair remote environments where migration 040 is marked applied but its
-- schema/storage side effects are missing. This keeps the repair idempotent so
-- healthy databases simply no-op.

ALTER TABLE public.jewelry_designs
  ADD COLUMN IF NOT EXISTS photo_pipeline_original_path TEXT,
  ADD COLUMN IF NOT EXISTS photo_pipeline_original_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_pipeline_enhanced_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_pipeline_provider TEXT,
  ADD COLUMN IF NOT EXISTS photo_pipeline_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS photo_pipeline_preflight_score INTEGER,
  ADD COLUMN IF NOT EXISTS photo_pipeline_preflight_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS photo_pipeline_qa_decision TEXT,
  ADD COLUMN IF NOT EXISTS photo_pipeline_qa_confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS photo_pipeline_processed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jewelry_designs_photo_pipeline_status_check'
  ) THEN
    ALTER TABLE public.jewelry_designs
      ADD CONSTRAINT jewelry_designs_photo_pipeline_status_check
      CHECK (
        photo_pipeline_status IN (
          'pending',
          'staged',
          'preflight_failed',
          'ready',
          'processing',
          'qa_review',
          'approved',
          'rejected',
          'published',
          'error'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jewelry_designs_photo_pipeline_preflight_score_check'
  ) THEN
    ALTER TABLE public.jewelry_designs
      ADD CONSTRAINT jewelry_designs_photo_pipeline_preflight_score_check
      CHECK (
        photo_pipeline_preflight_score IS NULL
        OR (
          photo_pipeline_preflight_score >= 0
          AND photo_pipeline_preflight_score <= 100
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jewelry_designs_photo_pipeline_qa_decision_check'
  ) THEN
    ALTER TABLE public.jewelry_designs
      ADD CONSTRAINT jewelry_designs_photo_pipeline_qa_decision_check
      CHECK (
        photo_pipeline_qa_decision IS NULL
        OR photo_pipeline_qa_decision IN ('approve', 'review', 'hold', 'reject')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jewelry_designs_photo_pipeline_qa_confidence_check'
  ) THEN
    ALTER TABLE public.jewelry_designs
      ADD CONSTRAINT jewelry_designs_photo_pipeline_qa_confidence_check
      CHECK (
        photo_pipeline_qa_confidence IS NULL
        OR (
          photo_pipeline_qa_confidence >= 0
          AND photo_pipeline_qa_confidence <= 1
        )
      );
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('jewelry-photo-staging', 'jewelry-photo-staging', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "jewelry_photo_staging_rep_read" ON storage.objects;
CREATE POLICY "jewelry_photo_staging_rep_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'jewelry-photo-staging'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "jewelry_photo_staging_rep_insert" ON storage.objects;
CREATE POLICY "jewelry_photo_staging_rep_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'jewelry-photo-staging'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  );
