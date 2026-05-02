-- 033_nr_hq_task_tools.sql
-- Add create_task / update_task build-tracker RPCs and widen build_action_log
-- actor support to include 'codex' across all build-tracker write RPCs.

BEGIN;

ALTER TABLE public.build_action_log
  DROP CONSTRAINT IF EXISTS build_action_log_actor_check;
ALTER TABLE public.build_action_log
  ADD CONSTRAINT build_action_log_actor_check
    CHECK (actor IS NULL OR actor IN ('chat', 'claude_code', 'codex'));

CREATE OR REPLACE FUNCTION public.rpc_update_task_status(
  p_project            text,
  p_task_key           text,
  p_status             text,
  p_completion_session text        default null,
  p_completion_date    timestamptz default null,
  p_notes              text        default null,
  p_actor              text        default 'claude_code'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_old      public.construction_tasks%rowtype;
  r_new      public.construction_tasks%rowtype;
  v_new_comp timestamptz;
  v_audit_id uuid;
  v_changed  boolean;
  v_multi    boolean;
  v_old_val  text;
  v_new_val  text;
  v_summary  text;
BEGIN
  IF p_actor IS NULL OR p_actor NOT IN ('chat','claude_code','codex') THEN
    RAISE EXCEPTION 'Invalid actor: expected ''chat'', ''claude_code'', or ''codex'', got: %', coalesce(p_actor, 'NULL');
  END IF;
  IF p_status NOT IN ('not_started','in_progress','complete','blocked') THEN
    RAISE EXCEPTION 'Invalid task status: expected one of not_started, in_progress, complete, blocked; got: %', coalesce(p_status, 'NULL');
  END IF;

  SELECT * INTO r_old
    FROM public.construction_tasks
   WHERE project = p_project AND task_key = p_task_key
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found: % (project=%)', p_task_key, p_project;
  END IF;

  IF p_completion_date IS NOT NULL THEN
    v_new_comp := p_completion_date;
  ELSIF p_status = 'complete' THEN
    v_new_comp := now();
  ELSE
    v_new_comp := r_old.completion_date;
  END IF;

  v_changed := (r_old.status             IS DISTINCT FROM p_status)
            OR (r_old.notes              IS DISTINCT FROM coalesce(p_notes,              r_old.notes))
            OR (r_old.completion_session IS DISTINCT FROM coalesce(p_completion_session, r_old.completion_session))
            OR (r_old.completion_date    IS DISTINCT FROM v_new_comp);

  IF NOT v_changed THEN
    RETURN jsonb_build_object('task', to_jsonb(r_old), 'audit_id', null, 'changed', false);
  END IF;

  UPDATE public.construction_tasks
     SET status             = p_status,
         notes              = coalesce(p_notes,              notes),
         completion_session = coalesce(p_completion_session, completion_session),
         completion_date    = v_new_comp,
         updated_at         = now()
   WHERE id = r_old.id
   RETURNING * INTO r_new;

  v_multi := (r_old.notes              IS DISTINCT FROM r_new.notes)
          OR (r_old.completion_session IS DISTINCT FROM r_new.completion_session)
          OR (r_old.completion_date    IS DISTINCT FROM r_new.completion_date);

  IF v_multi THEN
    v_old_val := jsonb_build_object(
      'status', r_old.status, 'notes', r_old.notes,
      'completion_session', r_old.completion_session,
      'completion_date',    r_old.completion_date
    )::text;
    v_new_val := jsonb_build_object(
      'status', r_new.status, 'notes', r_new.notes,
      'completion_session', r_new.completion_session,
      'completion_date',    r_new.completion_date
    )::text;
  ELSE
    v_old_val := r_old.status;
    v_new_val := r_new.status;
  END IF;
  v_summary := format('Task %s: %s -> %s', p_task_key, r_old.status, r_new.status);

  INSERT INTO public.build_action_log (
    project, position, title, is_active,
    entry_kind, target_type, target_key, actor, old_value, new_value, summary
  ) VALUES (
    p_project, p_task_key, v_summary, false,
    'audit', 'task', p_task_key, p_actor, v_old_val, v_new_val, v_summary
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object('task', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_update_phase_status(
  p_project   text,
  p_phase_key text,
  p_status    text,
  p_actor     text default 'claude_code'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_old      public.construction_phases%rowtype;
  r_new      public.construction_phases%rowtype;
  v_total    integer;
  v_done     integer;
  v_audit_id uuid;
  v_changed  boolean;
  v_summary  text;
BEGIN
  IF p_actor IS NULL OR p_actor NOT IN ('chat','claude_code','codex') THEN
    RAISE EXCEPTION 'Invalid actor: expected ''chat'', ''claude_code'', or ''codex'', got: %', coalesce(p_actor, 'NULL');
  END IF;
  IF p_status NOT IN ('not_started','in_progress','testing','complete') THEN
    RAISE EXCEPTION 'Invalid phase status: expected one of not_started, in_progress, testing, complete; got: %', coalesce(p_status, 'NULL');
  END IF;

  SELECT * INTO r_old
    FROM public.construction_phases
   WHERE project = p_project AND phase_key = p_phase_key
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phase not found: % (project=%)', p_phase_key, p_project;
  END IF;

  SELECT count(*) INTO v_total
    FROM public.construction_tasks WHERE phase_id = r_old.id;
  SELECT count(*) INTO v_done
    FROM public.construction_tasks WHERE phase_id = r_old.id AND status = 'complete';

  v_changed := r_old.status IS DISTINCT FROM p_status;

  UPDATE public.construction_phases
     SET status          = p_status,
         total_tasks     = v_total,
         completed_tasks = v_done,
         updated_at      = now()
   WHERE id = r_old.id
   RETURNING * INTO r_new;

  IF v_changed THEN
    v_summary := format('Phase %s: %s -> %s', p_phase_key, r_old.status, r_new.status);
    INSERT INTO public.build_action_log (
      project, position, title, is_active,
      entry_kind, target_type, target_key, actor, old_value, new_value, summary
    ) VALUES (
      p_project, p_phase_key, v_summary, false,
      'audit', 'phase', p_phase_key, p_actor, r_old.status, r_new.status, v_summary
    )
    RETURNING id INTO v_audit_id;
  END IF;

  RETURN jsonb_build_object('phase', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', v_changed);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_update_gate_status(
  p_project  text,
  p_gate_key text,
  p_status   text,
  p_actor    text default 'claude_code'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_old      public.construction_gates%rowtype;
  r_new      public.construction_gates%rowtype;
  v_audit_id uuid;
  v_summary  text;
BEGIN
  IF p_actor IS NULL OR p_actor NOT IN ('chat','claude_code','codex') THEN
    RAISE EXCEPTION 'Invalid actor: expected ''chat'', ''claude_code'', or ''codex'', got: %', coalesce(p_actor, 'NULL');
  END IF;
  IF p_status NOT IN ('locked','testing','passed','failed') THEN
    RAISE EXCEPTION 'Invalid gate status: expected one of locked, testing, passed, failed; got: %', coalesce(p_status, 'NULL');
  END IF;

  SELECT * INTO r_old
    FROM public.construction_gates
   WHERE project = p_project AND gate_key = p_gate_key
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gate not found: % (project=%)', p_gate_key, p_project;
  END IF;

  IF r_old.status = p_status THEN
    RETURN jsonb_build_object('gate', to_jsonb(r_old), 'audit_id', null, 'changed', false);
  END IF;

  UPDATE public.construction_gates
     SET status = p_status, updated_at = now()
   WHERE id = r_old.id
   RETURNING * INTO r_new;

  v_summary := format('Gate %s: %s -> %s', p_gate_key, r_old.status, r_new.status);
  INSERT INTO public.build_action_log (
    project, position, title, is_active,
    entry_kind, target_type, target_key, actor, old_value, new_value, summary
  ) VALUES (
    p_project, p_gate_key, v_summary, false,
    'audit', 'gate', p_gate_key, p_actor, r_old.status, r_new.status, v_summary
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object('gate', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_update_action_cards(
  p_project text,
  p_cards   jsonb,
  p_actor   text default 'claude_code'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_map   jsonb := '{}'::jsonb;
  r_old       record;
  pos         text;
  v_card      jsonb;
  v_title     text;
  v_desc      text;
  v_old_card  jsonb;
  v_summary   text;
  v_audit_id  uuid;
  v_audit_ids uuid[] := array[]::uuid[];
  v_previous  jsonb;
  v_current   jsonb;
  v_next      jsonb;
  v_inserted  record;
BEGIN
  IF p_actor IS NULL OR p_actor NOT IN ('chat','claude_code','codex') THEN
    RAISE EXCEPTION 'Invalid actor: expected ''chat'', ''claude_code'', or ''codex'', got: %', coalesce(p_actor, 'NULL');
  END IF;

  FOR r_old IN
    SELECT position, title, description
      FROM public.build_action_log
     WHERE project = p_project
       AND is_active = true
       AND entry_kind = 'card_snapshot'
     FOR UPDATE
  LOOP
    v_old_map := v_old_map || jsonb_build_object(
      r_old.position,
      jsonb_build_object('title', r_old.title, 'description', r_old.description)
    );
  END LOOP;

  UPDATE public.build_action_log
     SET is_active  = false,
         updated_at = now(),
         entry_kind = coalesce(entry_kind, 'card_snapshot')
   WHERE project = p_project
     AND is_active = true
     AND (entry_kind = 'card_snapshot' OR entry_kind IS NULL);

  FOREACH pos IN ARRAY array['previous','current','next'] LOOP
    v_card  := p_cards -> pos;
    IF v_card IS NULL THEN
      RAISE EXCEPTION 'Missing card for position: %', pos;
    END IF;
    v_title := v_card ->> 'title';
    v_desc  := v_card ->> 'description';
    IF v_title IS NULL OR length(trim(v_title)) = 0 THEN
      RAISE EXCEPTION 'Empty title for position: %', pos;
    END IF;

    INSERT INTO public.build_action_log (
      project, position, title, description, is_active, entry_kind, target_type, target_key
    ) VALUES (
      p_project, pos, v_title, v_desc, true, 'card_snapshot', 'action_card', pos
    )
    RETURNING * INTO v_inserted;
    IF pos = 'previous'     THEN v_previous := to_jsonb(v_inserted);
    ELSIF pos = 'current'   THEN v_current  := to_jsonb(v_inserted);
    ELSE                         v_next     := to_jsonb(v_inserted);
    END IF;

    v_old_card := v_old_map -> pos;
    IF v_old_card IS NULL
       OR (v_old_card ->> 'title')       IS DISTINCT FROM v_title
       OR (v_old_card ->> 'description') IS DISTINCT FROM v_desc
    THEN
      v_summary := format('Action card (%s): %s -> %s',
        pos,
        coalesce(v_old_card ->> 'title', 'NULL'),
        v_title);
      INSERT INTO public.build_action_log (
        project, position, title, is_active,
        entry_kind, target_type, target_key, actor, old_value, new_value, summary
      ) VALUES (
        p_project, pos, v_summary, false,
        'audit', 'action_card', pos, p_actor,
        coalesce(v_old_card::text, 'null'),
        jsonb_build_object('title', v_title, 'description', v_desc)::text,
        v_summary
      )
      RETURNING id INTO v_audit_id;
      v_audit_ids := array_append(v_audit_ids, v_audit_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'cards', jsonb_build_object('previous', v_previous, 'current', v_current, 'next', v_next),
    'audit_ids', to_jsonb(v_audit_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_create_task(
  p_project            text,
  p_phase_id           uuid,
  p_task_number        text,
  p_task_key           text default null,
  p_task_name          text default null,
  p_status             text default 'not_started',
  p_execution_mode     text default 'standard',
  p_assignee           text default 'claude_code',
  p_can_run_overnight  boolean default false,
  p_time_estimate      text default 'medium',
  p_notes              text default null,
  p_display_order      integer default null,
  p_actor              text default 'claude_code'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_phase          public.construction_phases%rowtype;
  r_new            public.construction_tasks%rowtype;
  v_task_key       text;
  v_display_order  integer;
  v_audit_id       uuid;
  v_summary        text;
  v_total          integer;
  v_done           integer;
BEGIN
  IF p_actor IS NULL OR p_actor NOT IN ('chat','claude_code','codex') THEN
    RAISE EXCEPTION 'Invalid actor: expected ''chat'', ''claude_code'', or ''codex'', got: %', coalesce(p_actor, 'NULL');
  END IF;
  IF p_task_name IS NULL OR length(trim(p_task_name)) = 0 THEN
    RAISE EXCEPTION 'Task name must be at least 1 character.';
  END IF;
  IF p_task_number IS NULL OR length(trim(p_task_number)) = 0 THEN
    RAISE EXCEPTION 'Task number must be at least 1 character.';
  END IF;
  IF p_status NOT IN ('not_started','in_progress','complete','blocked') THEN
    RAISE EXCEPTION 'Invalid task status: expected one of not_started, in_progress, complete, blocked; got: %', coalesce(p_status, 'NULL');
  END IF;
  IF p_execution_mode NOT IN ('ultraplan','standard','claude_chat','manual') THEN
    RAISE EXCEPTION 'Invalid execution_mode: expected one of ultraplan, standard, claude_chat, manual; got: %', coalesce(p_execution_mode, 'NULL');
  END IF;
  IF p_assignee NOT IN ('claude_code','louis','both','opus_chat') THEN
    RAISE EXCEPTION 'Invalid assignee: expected one of claude_code, louis, both, opus_chat; got: %', coalesce(p_assignee, 'NULL');
  END IF;
  IF p_time_estimate NOT IN ('quick','medium','large','multi_day') THEN
    RAISE EXCEPTION 'Invalid time_estimate: expected one of quick, medium, large, multi_day; got: %', coalesce(p_time_estimate, 'NULL');
  END IF;
  IF p_display_order IS NOT NULL AND p_display_order < 0 THEN
    RAISE EXCEPTION 'display_order must be >= 0; got: %', p_display_order;
  END IF;

  SELECT * INTO r_phase
    FROM public.construction_phases
   WHERE project = p_project AND id = p_phase_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phase not found for project=% (phase_id=%)', p_project, p_phase_id;
  END IF;

  v_task_key := coalesce(nullif(trim(p_task_key), ''), 'task_' || replace(p_task_number, '.', '_'));
  IF EXISTS (
    SELECT 1
      FROM public.construction_tasks
     WHERE project = p_project
       AND task_key = v_task_key
  ) THEN
    RAISE EXCEPTION 'Task key ''%'' already exists in project ''%''', v_task_key, p_project;
  END IF;

  IF p_display_order IS NULL THEN
    SELECT coalesce(max(display_order), 0) + 1 INTO v_display_order
      FROM public.construction_tasks
     WHERE project = p_project
       AND phase_id = p_phase_id;
  ELSE
    v_display_order := p_display_order;
  END IF;

  INSERT INTO public.construction_tasks (
    project, phase_id, task_number, task_key, task_name, status,
    execution_mode, assignee, can_run_overnight, time_estimate,
    notes, display_order
  ) VALUES (
    p_project, p_phase_id, p_task_number, v_task_key, p_task_name, p_status,
    p_execution_mode, p_assignee, p_can_run_overnight, p_time_estimate,
    p_notes, v_display_order
  )
  RETURNING * INTO r_new;

  SELECT count(*) INTO v_total
    FROM public.construction_tasks
   WHERE phase_id = r_phase.id;
  SELECT count(*) INTO v_done
    FROM public.construction_tasks
   WHERE phase_id = r_phase.id
     AND status = 'complete';

  UPDATE public.construction_phases
     SET total_tasks     = v_total,
         completed_tasks = v_done,
         updated_at      = now()
   WHERE id = r_phase.id;

  v_summary := format('Task %s created', v_task_key);
  INSERT INTO public.build_action_log (
    project, position, title, is_active,
    entry_kind, target_type, target_key, actor, old_value, new_value, summary
  ) VALUES (
    p_project, v_task_key, v_summary, false,
    'audit', 'task', v_task_key, p_actor, 'null', to_jsonb(r_new)::text, v_summary
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object('task', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_update_task(
  p_project           text,
  p_task_key          text,
  p_task_name         text default null,
  p_task_number       text default null,
  p_execution_mode    text default null,
  p_assignee          text default null,
  p_can_run_overnight boolean default null,
  p_time_estimate     text default null,
  p_display_order     integer default null,
  p_actor             text default 'claude_code'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_old      public.construction_tasks%rowtype;
  r_new      public.construction_tasks%rowtype;
  v_old_val  jsonb := '{}'::jsonb;
  v_new_val  jsonb := '{}'::jsonb;
  v_changed  boolean := false;
  v_audit_id uuid;
  v_summary  text;
BEGIN
  IF p_actor IS NULL OR p_actor NOT IN ('chat','claude_code','codex') THEN
    RAISE EXCEPTION 'Invalid actor: expected ''chat'', ''claude_code'', or ''codex'', got: %', coalesce(p_actor, 'NULL');
  END IF;
  IF p_task_name IS NULL
     AND p_task_number IS NULL
     AND p_execution_mode IS NULL
     AND p_assignee IS NULL
     AND p_can_run_overnight IS NULL
     AND p_time_estimate IS NULL
     AND p_display_order IS NULL
  THEN
    RAISE EXCEPTION 'At least one updatable field must be provided for update_task.';
  END IF;
  IF p_task_name IS NOT NULL AND length(trim(p_task_name)) = 0 THEN
    RAISE EXCEPTION 'Task name must be at least 1 character.';
  END IF;
  IF p_task_number IS NOT NULL AND length(trim(p_task_number)) = 0 THEN
    RAISE EXCEPTION 'Task number must be at least 1 character.';
  END IF;
  IF p_execution_mode IS NOT NULL AND p_execution_mode NOT IN ('ultraplan','standard','claude_chat','manual') THEN
    RAISE EXCEPTION 'Invalid execution_mode: expected one of ultraplan, standard, claude_chat, manual; got: %', p_execution_mode;
  END IF;
  IF p_assignee IS NOT NULL AND p_assignee NOT IN ('claude_code','louis','both','opus_chat') THEN
    RAISE EXCEPTION 'Invalid assignee: expected one of claude_code, louis, both, opus_chat; got: %', p_assignee;
  END IF;
  IF p_time_estimate IS NOT NULL AND p_time_estimate NOT IN ('quick','medium','large','multi_day') THEN
    RAISE EXCEPTION 'Invalid time_estimate: expected one of quick, medium, large, multi_day; got: %', p_time_estimate;
  END IF;
  IF p_display_order IS NOT NULL AND p_display_order < 0 THEN
    RAISE EXCEPTION 'display_order must be >= 0; got: %', p_display_order;
  END IF;

  SELECT * INTO r_old
    FROM public.construction_tasks
   WHERE project = p_project
     AND task_key = p_task_key
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found: % (project=%)', p_task_key, p_project;
  END IF;

  IF p_task_name IS NOT NULL AND r_old.task_name IS DISTINCT FROM p_task_name THEN
    v_old_val := v_old_val || jsonb_build_object('task_name', r_old.task_name);
    v_new_val := v_new_val || jsonb_build_object('task_name', p_task_name);
    v_changed := true;
  END IF;
  IF p_task_number IS NOT NULL AND r_old.task_number IS DISTINCT FROM p_task_number THEN
    v_old_val := v_old_val || jsonb_build_object('task_number', r_old.task_number);
    v_new_val := v_new_val || jsonb_build_object('task_number', p_task_number);
    v_changed := true;
  END IF;
  IF p_execution_mode IS NOT NULL AND r_old.execution_mode IS DISTINCT FROM p_execution_mode THEN
    v_old_val := v_old_val || jsonb_build_object('execution_mode', r_old.execution_mode);
    v_new_val := v_new_val || jsonb_build_object('execution_mode', p_execution_mode);
    v_changed := true;
  END IF;
  IF p_assignee IS NOT NULL AND r_old.assignee IS DISTINCT FROM p_assignee THEN
    v_old_val := v_old_val || jsonb_build_object('assignee', r_old.assignee);
    v_new_val := v_new_val || jsonb_build_object('assignee', p_assignee);
    v_changed := true;
  END IF;
  IF p_can_run_overnight IS NOT NULL AND r_old.can_run_overnight IS DISTINCT FROM p_can_run_overnight THEN
    v_old_val := v_old_val || jsonb_build_object('can_run_overnight', r_old.can_run_overnight);
    v_new_val := v_new_val || jsonb_build_object('can_run_overnight', p_can_run_overnight);
    v_changed := true;
  END IF;
  IF p_time_estimate IS NOT NULL AND r_old.time_estimate IS DISTINCT FROM p_time_estimate THEN
    v_old_val := v_old_val || jsonb_build_object('time_estimate', r_old.time_estimate);
    v_new_val := v_new_val || jsonb_build_object('time_estimate', p_time_estimate);
    v_changed := true;
  END IF;
  IF p_display_order IS NOT NULL AND r_old.display_order IS DISTINCT FROM p_display_order THEN
    v_old_val := v_old_val || jsonb_build_object('display_order', r_old.display_order);
    v_new_val := v_new_val || jsonb_build_object('display_order', p_display_order);
    v_changed := true;
  END IF;

  IF NOT v_changed THEN
    RETURN jsonb_build_object('task', to_jsonb(r_old), 'audit_id', null, 'changed', false);
  END IF;

  UPDATE public.construction_tasks
     SET task_name          = CASE WHEN p_task_name IS NULL THEN task_name ELSE p_task_name END,
         task_number        = CASE WHEN p_task_number IS NULL THEN task_number ELSE p_task_number END,
         execution_mode     = CASE WHEN p_execution_mode IS NULL THEN execution_mode ELSE p_execution_mode END,
         assignee           = CASE WHEN p_assignee IS NULL THEN assignee ELSE p_assignee END,
         can_run_overnight  = CASE WHEN p_can_run_overnight IS NULL THEN can_run_overnight ELSE p_can_run_overnight END,
         time_estimate      = CASE WHEN p_time_estimate IS NULL THEN time_estimate ELSE p_time_estimate END,
         display_order      = CASE WHEN p_display_order IS NULL THEN display_order ELSE p_display_order END,
         updated_at         = now()
   WHERE id = r_old.id
   RETURNING * INTO r_new;

  v_summary := format('Task %s metadata updated', p_task_key);
  INSERT INTO public.build_action_log (
    project, position, title, is_active,
    entry_kind, target_type, target_key, actor, old_value, new_value, summary
  ) VALUES (
    p_project, p_task_key, v_summary, false,
    'audit', 'task', p_task_key, p_actor, v_old_val::text, v_new_val::text, v_summary
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object('task', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', true);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_update_task_status(text,text,text,text,timestamptz,text,text) FROM public;
REVOKE ALL ON FUNCTION public.rpc_update_phase_status(text,text,text,text) FROM public;
REVOKE ALL ON FUNCTION public.rpc_update_gate_status(text,text,text,text) FROM public;
REVOKE ALL ON FUNCTION public.rpc_update_action_cards(text,jsonb,text) FROM public;
REVOKE ALL ON FUNCTION public.rpc_create_task(text,uuid,text,text,text,text,text,text,boolean,text,text,integer,text) FROM public;
REVOKE ALL ON FUNCTION public.rpc_update_task(text,text,text,text,text,text,boolean,text,integer,text) FROM public;

GRANT EXECUTE ON FUNCTION public.rpc_update_task_status(text,text,text,text,timestamptz,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_phase_status(text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_gate_status(text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_action_cards(text,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_create_task(text,uuid,text,text,text,text,text,text,boolean,text,text,integer,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_task(text,text,text,text,text,text,boolean,text,integer,text) TO service_role;

COMMIT;
