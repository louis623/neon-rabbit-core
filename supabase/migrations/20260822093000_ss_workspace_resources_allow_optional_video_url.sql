-- Resource Publisher now permits an operator to publish an unfinished video
-- entry. A video link is optional in the simplified operator UI; when it is
-- provided, the Workspace Resource Library derives YouTube's own thumbnail.
DO $$
DECLARE
  video_url_constraint TEXT;
BEGIN
  SELECT conname
    INTO video_url_constraint
    FROM pg_constraint
   WHERE conrelid = 'public.workspace_resources'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) LIKE '%video_url IS NOT NULL%'
   LIMIT 1;

  IF video_url_constraint IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.workspace_resources DROP CONSTRAINT %I',
      video_url_constraint
    );
  END IF;
END;
$$;
