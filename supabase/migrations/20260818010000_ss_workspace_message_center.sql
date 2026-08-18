-- Sparkle Suite receive-only workspace Message Center.
--
-- Publications contain immutable shared content. Deliveries freeze recipients
-- and own the only state a rep may change (read/archive timestamps). All
-- sender, audience, publication, outbox, and audit writes are service-side.

CREATE TABLE IF NOT EXISTS workspace_message_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_message_senders_key_not_blank
    CHECK (btrim(sender_key) <> ''),
  CONSTRAINT workspace_message_senders_display_name_not_blank
    CHECK (btrim(display_name) <> ''),
  CONSTRAINT workspace_message_senders_type_check
    CHECK (sender_type IN ('owner', 'agent', 'automation', 'legacy')),
  CONSTRAINT workspace_message_senders_capabilities_object
    CHECK (jsonb_typeof(capabilities) = 'object')
);

CREATE TABLE IF NOT EXISTS workspace_message_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES workspace_message_senders(id),
  sender_key TEXT NOT NULL REFERENCES workspace_message_senders(sender_key),
  sender_display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  summary TEXT,
  body JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_label TEXT,
  action_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  audience_rule JSONB NOT NULL DEFAULT '{}'::jsonb,
  audience_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  audience_count INTEGER NOT NULL DEFAULT 0,
  source_type TEXT,
  source_id TEXT,
  idempotency_key TEXT UNIQUE,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_message_publications_category_check CHECK (
    category IN (
      'customer_activity',
      'business_update',
      'monthly_report',
      'platform_update',
      'help_update',
      'blog',
      'video',
      'announcement'
    )
  ),
  CONSTRAINT workspace_message_publications_priority_check
    CHECK (priority IN ('normal', 'important', 'action_required')),
  CONSTRAINT workspace_message_publications_status_check CHECK (
    status IN ('draft', 'scheduled', 'publishing', 'published', 'cancelled', 'failed')
  ),
  CONSTRAINT workspace_message_publications_title_not_blank
    CHECK (btrim(title) <> '' AND char_length(title) <= 160),
  CONSTRAINT workspace_message_publications_summary_length
    CHECK (summary IS NULL OR char_length(summary) <= 500),
  CONSTRAINT workspace_message_publications_body_shape
    CHECK (jsonb_typeof(body) IN ('array', 'object')),
  CONSTRAINT workspace_message_publications_audience_rule_object
    CHECK (jsonb_typeof(audience_rule) = 'object'),
  CONSTRAINT workspace_message_publications_audience_snapshot_array
    CHECK (jsonb_typeof(audience_snapshot) = 'array'),
  CONSTRAINT workspace_message_publications_audience_count_nonnegative
    CHECK (audience_count >= 0),
  CONSTRAINT workspace_message_publications_action_pair CHECK (
    (action_label IS NULL AND action_url IS NULL)
    OR (btrim(action_label) <> '' AND btrim(action_url) <> '')
  ),
  CONSTRAINT workspace_message_publications_publish_state CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR status <> 'published'
  ),
  CONSTRAINT workspace_message_publications_schedule_state CHECK (
    (status = 'scheduled' AND scheduled_at IS NOT NULL)
    OR status <> 'scheduled'
  )
);

CREATE TABLE IF NOT EXISTS workspace_message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL
    REFERENCES workspace_message_publications(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  first_action_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_message_deliveries_publication_rep_unique
    UNIQUE (publication_id, rep_id)
);

CREATE TABLE IF NOT EXISTS workspace_message_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES workspace_message_publications(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES workspace_message_deliveries(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_message_audit_actor_type_check
    CHECK (actor_type IN ('owner', 'agent', 'automation', 'rep', 'system', 'legacy')),
  CONSTRAINT workspace_message_audit_event_not_blank CHECK (btrim(event_type) <> ''),
  CONSTRAINT workspace_message_audit_details_object
    CHECK (jsonb_typeof(details) = 'object')
);

CREATE TABLE IF NOT EXISTS workspace_message_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  claimed_by TEXT,
  last_error TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_message_outbox_event_not_blank CHECK (btrim(event_type) <> ''),
  CONSTRAINT workspace_message_outbox_key_not_blank CHECK (btrim(idempotency_key) <> ''),
  CONSTRAINT workspace_message_outbox_payload_object
    CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT workspace_message_outbox_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT workspace_message_outbox_attempt_count_nonnegative CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_workspace_message_publications_status_schedule
  ON workspace_message_publications(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workspace_message_publications_operator_history
  ON workspace_message_publications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_message_publications_source
  ON workspace_message_publications(source_type, source_id)
  WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_message_deliveries_rep_recent
  ON workspace_message_deliveries(rep_id, delivered_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_message_deliveries_rep_unread
  ON workspace_message_deliveries(rep_id, delivered_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_message_deliveries_rep_archived
  ON workspace_message_deliveries(rep_id, archived_at DESC)
  WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_message_audit_publication_recent
  ON workspace_message_audit_events(publication_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_message_outbox_due
  ON workspace_message_outbox(next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_workspace_message_outbox_stale_processing
  ON workspace_message_outbox(claimed_at)
  WHERE status = 'processing';

INSERT INTO workspace_message_senders (
  sender_key,
  display_name,
  sender_type,
  capabilities
)
VALUES
  (
    'owner',
    'Sparkle Suite',
    'owner',
    '{"categories":["customer_activity","business_update","monthly_report","platform_update","help_update","blog","video","announcement"],"audiences":["all_active","selected"]}'::jsonb
  ),
  (
    'legacy_neon_rabbit',
    'Sparkle Suite',
    'legacy',
    '{"categories":[],"audiences":[]}'::jsonb
  ),
  (
    'customer_signup_notifier',
    'Sparkle Suite',
    'automation',
    '{"categories":["customer_activity"],"audiences":["selected"]}'::jsonb
  ),
  (
    'monthly_reporter',
    'Sparkle Suite',
    'automation',
    '{"categories":["monthly_report"],"audiences":["selected"]}'::jsonb
  ),
  (
    'resource_publisher',
    'Sparkle Suite',
    'automation',
    '{"categories":["help_update","blog","video"],"audiences":["all_active","selected"]}'::jsonb
  )
ON CONFLICT (sender_key) DO NOTHING;

-- Preserve legitimate historical Neon-Rabbit-to-rep rows in the new inbox.
INSERT INTO workspace_message_publications (
  sender_id,
  sender_key,
  sender_display_name,
  category,
  priority,
  title,
  summary,
  body,
  status,
  audience_rule,
  audience_snapshot,
  audience_count,
  source_type,
  source_id,
  idempotency_key,
  published_at,
  created_at,
  updated_at
)
SELECT
  sender.id,
  sender.sender_key,
  sender.display_name,
  CASE legacy.message_type::text
    WHEN 'monthly_report' THEN 'monthly_report'
    WHEN 'newsletter' THEN 'platform_update'
    WHEN 'support_response' THEN 'help_update'
    ELSE 'announcement'
  END,
  'normal',
  COALESCE(NULLIF(btrim(legacy.subject), ''), 'Message from Sparkle Suite'),
  NULL,
  jsonb_build_array(jsonb_build_object('type', 'paragraph', 'text', legacy.body)),
  'published',
  jsonb_build_object('kind', 'selected'),
  jsonb_build_array(jsonb_build_object('repId', legacy.rep_id)),
  1,
  'legacy_rep_message',
  legacy.id::text,
  'legacy-rep-message:' || legacy.id::text,
  legacy.created_at,
  legacy.created_at,
  legacy.created_at
FROM rep_messages legacy
JOIN workspace_message_senders sender ON sender.sender_key = 'legacy_neon_rabbit'
WHERE legacy.direction = 'nr_to_rep'
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO workspace_message_deliveries (
  publication_id,
  rep_id,
  delivered_at,
  read_at,
  created_at,
  updated_at
)
SELECT
  publication.id,
  legacy.rep_id,
  legacy.created_at,
  CASE WHEN legacy.is_read THEN COALESCE(legacy.read_at, legacy.created_at) ELSE NULL END,
  legacy.created_at,
  legacy.created_at
FROM rep_messages legacy
JOIN workspace_message_publications publication
  ON publication.idempotency_key = 'legacy-rep-message:' || legacy.id::text
WHERE legacy.direction = 'nr_to_rep'
ON CONFLICT (publication_id, rep_id) DO NOTHING;

INSERT INTO workspace_message_audit_events (
  publication_id,
  actor_type,
  actor_id,
  event_type,
  details,
  created_at
)
SELECT
  publication.id,
  'legacy',
  'legacy_neon_rabbit',
  'legacy_message_backfilled',
  jsonb_build_object('legacyMessageId', legacy.id),
  legacy.created_at
FROM rep_messages legacy
JOIN workspace_message_publications publication
  ON publication.idempotency_key = 'legacy-rep-message:' || legacy.id::text
WHERE legacy.direction = 'nr_to_rep'
  AND NOT EXISTS (
    SELECT 1
    FROM workspace_message_audit_events audit
    WHERE audit.publication_id = publication.id
      AND audit.event_type = 'legacy_message_backfilled'
  );

ALTER TABLE workspace_message_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_message_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_message_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_message_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_message_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_message_publications_assigned_read" ON workspace_message_publications;
CREATE POLICY "workspace_message_publications_assigned_read"
  ON workspace_message_publications
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM workspace_message_deliveries delivery
      WHERE delivery.publication_id = workspace_message_publications.id
        AND delivery.rep_id = (
          SELECT rep.id FROM reps rep WHERE rep.auth_user_id = (SELECT auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "workspace_message_deliveries_own_read" ON workspace_message_deliveries;
CREATE POLICY "workspace_message_deliveries_own_read"
  ON workspace_message_deliveries
  FOR SELECT
  TO authenticated
  USING (
    rep_id = (
      SELECT rep.id FROM reps rep WHERE rep.auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "workspace_message_deliveries_own_state_update" ON workspace_message_deliveries;
CREATE POLICY "workspace_message_deliveries_own_state_update"
  ON workspace_message_deliveries
  FOR UPDATE
  TO authenticated
  USING (
    rep_id = (
      SELECT rep.id FROM reps rep WHERE rep.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    rep_id = (
      SELECT rep.id FROM reps rep WHERE rep.auth_user_id = (SELECT auth.uid())
    )
  );

-- Trigger-written audit trail for recipient state. SECURITY DEFINER is needed
-- because reps deliberately receive no INSERT grant on the audit table.
CREATE OR REPLACE FUNCTION audit_workspace_message_delivery_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.read_at IS DISTINCT FROM NEW.read_at THEN
    INSERT INTO workspace_message_audit_events (
      publication_id, delivery_id, actor_type, actor_id, event_type, details
    ) VALUES (
      NEW.publication_id,
      NEW.id,
      'rep',
      NEW.rep_id::text,
      CASE WHEN NEW.read_at IS NULL THEN 'delivery_marked_unread' ELSE 'delivery_marked_read' END,
      '{}'::jsonb
    );
  END IF;

  IF OLD.archived_at IS DISTINCT FROM NEW.archived_at THEN
    INSERT INTO workspace_message_audit_events (
      publication_id, delivery_id, actor_type, actor_id, event_type, details
    ) VALUES (
      NEW.publication_id,
      NEW.id,
      'rep',
      NEW.rep_id::text,
      CASE WHEN NEW.archived_at IS NULL THEN 'delivery_unarchived' ELSE 'delivery_archived' END,
      '{}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_message_delivery_state_audit
  ON workspace_message_deliveries;
CREATE TRIGGER trg_workspace_message_delivery_state_audit
AFTER UPDATE OF read_at, archived_at ON workspace_message_deliveries
FOR EACH ROW
WHEN (
  OLD.read_at IS DISTINCT FROM NEW.read_at
  OR OLD.archived_at IS DISTINCT FROM NEW.archived_at
)
EXECUTE FUNCTION audit_workspace_message_delivery_state();

REVOKE ALL ON FUNCTION audit_workspace_message_delivery_state()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON workspace_message_senders FROM anon, authenticated;
REVOKE ALL ON workspace_message_publications FROM anon, authenticated;
REVOKE ALL ON workspace_message_deliveries FROM anon, authenticated;
REVOKE ALL ON workspace_message_audit_events FROM anon, authenticated;
REVOKE ALL ON workspace_message_outbox FROM anon, authenticated;

GRANT SELECT (
  id,
  sender_key,
  sender_display_name,
  category,
  priority,
  title,
  summary,
  body,
  action_label,
  action_url,
  status,
  published_at,
  created_at
) ON workspace_message_publications TO authenticated;
GRANT SELECT ON workspace_message_deliveries TO authenticated;
GRANT UPDATE (read_at, archived_at) ON workspace_message_deliveries TO authenticated;

-- Atomic, concurrency-safe worker claim. Only the server service role may call
-- it; SKIP LOCKED lets multiple bounded workers run without double-processing.
CREATE OR REPLACE FUNCTION claim_workspace_message_outbox(
  p_worker_id TEXT,
  p_limit INTEGER DEFAULT 25
)
RETURNS SETOF workspace_message_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF btrim(COALESCE(p_worker_id, '')) = '' THEN
    RAISE EXCEPTION 'worker id required';
  END IF;
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'claim limit must be between 1 and 100';
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT outbox.id
    FROM workspace_message_outbox outbox
    WHERE (
      outbox.status IN ('pending', 'failed')
      AND outbox.next_attempt_at <= now()
    ) OR (
      outbox.status = 'processing'
      AND outbox.claimed_at < now() - INTERVAL '15 minutes'
    )
    ORDER BY outbox.next_attempt_at, outbox.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE workspace_message_outbox outbox
  SET
    status = 'processing',
    attempt_count = outbox.attempt_count + 1,
    claimed_at = now(),
    claimed_by = p_worker_id,
    last_error = NULL,
    updated_at = now()
  FROM due
  WHERE outbox.id = due.id
  RETURNING outbox.*;
END;
$$;

REVOKE ALL ON FUNCTION claim_workspace_message_outbox(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_workspace_message_outbox(TEXT, INTEGER)
  TO service_role;

-- Close the legacy rep compose/write surface while leaving old rows readable
-- during the compatibility window. service_role retains its RLS bypass.
DROP POLICY IF EXISTS "rep_messages_own_data" ON rep_messages;
DROP POLICY IF EXISTS "rep_messages_admin_full_access" ON rep_messages;
CREATE POLICY "rep_messages_own_read"
  ON rep_messages
  FOR SELECT
  TO authenticated
  USING (
    rep_id = (
      SELECT rep.id FROM reps rep WHERE rep.auth_user_id = (SELECT auth.uid())
    )
  );
REVOKE ALL ON rep_messages FROM anon, authenticated;
GRANT SELECT ON rep_messages TO authenticated;

COMMENT ON TABLE workspace_message_publications IS
  'Shared receive-only Message Center content with frozen audience metadata.';
COMMENT ON TABLE workspace_message_deliveries IS
  'Per-rep Message Center delivery and recipient-controlled read/archive state.';
COMMENT ON TABLE workspace_message_outbox IS
  'Durable idempotent internal events for approved Message Center automations.';
