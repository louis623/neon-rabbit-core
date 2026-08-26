-- Close rollout gaps for canonical workspace communications.
-- Safe to rerun: historical support reports are linked once and all child rows
-- use stable uniqueness/idempotency keys.

-- Migration 15000 originally schema-qualified PostgreSQL's GREATEST special
-- expression. Recreate the function here so databases that already applied
-- that migration receive the corrected trigger body before new writes begin.
create or replace function public.update_workspace_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.workspace_conversations set
    last_message_at = new.created_at,
    latest_message_preview = pg_catalog.left(pg_catalog.regexp_replace(pg_catalog.btrim(new.body), '\s+', ' ', 'g'), 180),
    latest_message_sender_display_name = new.sender_display_name,
    updated_at = greatest(updated_at, new.created_at)
  where id = new.conversation_id;

  update public.workspace_conversation_participants participant set
    unread_count = participant.unread_count + 1,
    updated_at = greatest(participant.updated_at, new.created_at)
  where participant.conversation_id = new.conversation_id
    and participant.membership_state in ('pending', 'active')
    and coalesce((new.metadata ->> 'suppressUnread')::boolean, false) = false
    and not (
      (new.sender_principal_type = 'rep'
        and participant.rep_id is not distinct from new.sender_rep_id)
      or (new.sender_principal_type = 'onboarding_guest'
        and participant.team_onboarding_participant_id is not distinct from new.sender_team_onboarding_participant_id)
      or (new.sender_principal_type = 'support_queue'
        and participant.principal_type = 'support_queue'
        and participant.principal_key is not distinct from new.sender_principal_key)
      or (new.sender_principal_type = 'system'
        and participant.principal_type = 'support_queue')
    );
  return new;
end;
$$;

revoke all on function public.update_workspace_conversation_after_message()
  from public, anon, authenticated;

create or replace function public.reconcile_workspace_support_conversations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  report record;
  v_conversation_id uuid;
  v_rep_display_name text;
  v_conversation_state text;
  v_status_label text;
  v_reconciled integer := 0;
begin
  for report in
    select support.*
    from public.support_reports support
    where support.workspace_conversation_id is null
    order by support.created_at, support.id
  loop
    perform pg_advisory_xact_lock(
      hashtextextended('workspace-support-reconcile:' || report.id::text, 0)
    );

    -- Recheck after obtaining the report-specific lock so concurrent repair
    -- callers cannot create duplicate canonical threads.
    if exists (
      select 1
      from public.support_reports current_report
      where current_report.id = report.id
        and current_report.workspace_conversation_id is not null
    ) then
      continue;
    end if;

    select conversation.id
      into v_conversation_id
    from public.workspace_conversations conversation
    where conversation.context_type = 'support_report'
      and conversation.context_id = report.id::text
    order by conversation.created_at, conversation.id
    limit 1;

    v_conversation_state := case report.status
      when 'resolved' then 'resolved'
      when 'closed' then 'closed'
      else 'open'
    end;
    v_status_label := case report.status
      when 'reviewing' then 'Under review'
      when 'planned' then 'Planned'
      when 'resolved' then 'Resolved'
      when 'closed' then 'Closed'
      else 'Received'
    end;

    if v_conversation_id is null then
      insert into public.workspace_conversations (
        conversation_type, state, subject, created_by_rep_id,
        context_type, context_id, context_snapshot,
        last_message_at, closed_at, closed_by_actor, created_at, updated_at
      ) values (
        'support', v_conversation_state,
        pg_catalog.left(
          coalesce(nullif(pg_catalog.btrim(report.title), ''), 'Support request'),
          160
        ),
        report.rep_id, 'support_report', report.id::text,
        jsonb_strip_nulls(jsonb_build_object(
          'supportReportId', report.id,
          'supportType', report.report_type,
          'status', v_status_label,
          'pageOrWorkflow', report.page_or_workflow,
          'legacySource', report.source
        )),
        coalesce(report.updated_at, report.created_at, now()),
        case when report.status = 'closed'
          then coalesce(report.updated_at, report.created_at, now())
          else null
        end,
        case when report.status = 'closed' then 'legacy-support-reconciliation' else null end,
        coalesce(report.created_at, now()),
        coalesce(report.updated_at, report.created_at, now())
      ) returning id into v_conversation_id;
    else
      update public.workspace_conversations set
        state = v_conversation_state,
        context_snapshot = context_snapshot || jsonb_build_object(
          'supportReportId', report.id,
          'supportType', report.report_type,
          'status', v_status_label
        ),
        closed_at = case when report.status = 'closed'
          then coalesce(report.updated_at, report.created_at, now())
          else null
        end,
        closed_by_actor = case when report.status = 'closed'
          then 'legacy-support-reconciliation'
          else null
        end,
        updated_at = greatest(
          workspace_conversations.updated_at,
          coalesce(report.updated_at, report.created_at, now())
        )
      where id = v_conversation_id;
    end if;

    update public.support_reports
    set workspace_conversation_id = v_conversation_id
    where id = report.id
      and workspace_conversation_id is null;

    insert into public.workspace_conversation_participants (
      conversation_id, principal_type, rep_id, role, membership_state, joined_at
    ) values (
      v_conversation_id, 'rep', report.rep_id, 'requester', 'active',
      coalesce(report.created_at, now())
    ) on conflict do nothing;

    insert into public.workspace_conversation_participants (
      conversation_id, principal_type, principal_key, role, membership_state, joined_at
    ) values (
      v_conversation_id, 'support_queue', 'sparkle_suite_support', 'support', 'active',
      coalesce(report.created_at, now())
    ) on conflict do nothing;

    select coalesce(
      nullif(pg_catalog.btrim(rep.business_name), ''),
      nullif(pg_catalog.btrim(rep.display_name), ''),
      'Sparkle Suite rep'
    ) into v_rep_display_name
    from public.reps rep
    where rep.id = report.rep_id;

    insert into public.workspace_conversation_messages (
      conversation_id, sender_principal_type, sender_identity_key, sender_rep_id,
      sender_display_name, kind, body, client_request_id, metadata, created_at
    ) values (
      v_conversation_id, 'rep', 'rep:' || report.rep_id::text, report.rep_id,
      pg_catalog.left(coalesce(v_rep_display_name, 'Sparkle Suite rep'), 120),
      'message',
      pg_catalog.left(
        coalesce(
          nullif(pg_catalog.btrim(report.details), ''),
          nullif(pg_catalog.btrim(report.title), ''),
          'Support request details unavailable.'
        ),
        10000
      ),
      'legacy-support-report:' || report.id::text,
      jsonb_build_object(
        'legacySourceTable', 'support_reports',
        'legacySourceId', report.id
      ),
      coalesce(report.created_at, now())
    ) on conflict (conversation_id, sender_identity_key, client_request_id) do nothing;

    insert into public.workspace_conversation_messages (
      conversation_id, sender_principal_type, sender_identity_key,
      sender_principal_key, sender_display_name, kind, body,
      client_request_id, metadata, created_at
    ) values (
      v_conversation_id, 'system', 'system', 'system', 'Sparkle Suite Support',
      'system_status', v_status_label,
      'legacy-support-status:' || report.id::text || ':' || report.status,
      jsonb_build_object(
        'supportReportId', report.id,
        'status', report.status,
        'suppressUnread', true,
        'legacyReconciled', true
      ),
      coalesce(report.updated_at, report.created_at, now())
    ) on conflict (conversation_id, sender_identity_key, client_request_id) do nothing;

    insert into public.workspace_conversation_audit_events (
      conversation_id, actor_type, actor_id, event_type, details, idempotency_key
    ) values (
      v_conversation_id, 'legacy', report.id::text,
      'support_conversation_backfilled',
      jsonb_build_object('supportReportId', report.id, 'legacySource', report.source),
      'support-conversation-backfill:' || report.id::text
    ) on conflict (idempotency_key) do nothing;

    v_reconciled := v_reconciled + 1;
  end loop;

  return v_reconciled;
end;
$$;

revoke all on function public.reconcile_workspace_support_conversations()
  from public, anon, authenticated;
grant execute on function public.reconcile_workspace_support_conversations()
  to service_role;

select public.reconcile_workspace_support_conversations();

-- A single joined, filtered query prevents the caller from limiting an
-- arbitrary membership prefix before applying conversation type/order. The
-- total_unread scalar is calculated over the complete filtered view, not just
-- the returned page. Cursor inputs support stable keyset pagination.
create or replace function public.list_workspace_rep_conversation_page(
  p_rep_id uuid,
  p_conversation_type text,
  p_archived boolean,
  p_limit integer,
  p_before_last_message_at timestamptz,
  p_before_id uuid,
  p_equal_timestamp_mode text
)
returns table (
  id uuid,
  conversation_type text,
  state text,
  subject text,
  context_snapshot jsonb,
  last_message_at timestamptz,
  latest_message_preview text,
  latest_message_sender_display_name text,
  updated_at timestamptz,
  participant_id uuid,
  participant_role text,
  participant_membership_state text,
  participant_last_read_at timestamptz,
  participant_archived_at timestamptz,
  participant_muted_at timestamptz,
  participant_unread_count integer,
  total_unread bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with eligible as materialized (
    select
      conversation.id,
      conversation.conversation_type,
      conversation.state,
      conversation.subject,
      conversation.context_snapshot,
      conversation.last_message_at,
      conversation.latest_message_preview,
      conversation.latest_message_sender_display_name,
      conversation.updated_at,
      participant.id as participant_id,
      participant.role as participant_role,
      participant.membership_state as participant_membership_state,
      participant.last_read_at as participant_last_read_at,
      participant.archived_at as participant_archived_at,
      participant.muted_at as participant_muted_at,
      participant.unread_count as participant_unread_count
    from public.workspace_conversation_participants participant
    join public.workspace_conversations conversation
      on conversation.id = participant.conversation_id
    where participant.principal_type = 'rep'
      and participant.rep_id = p_rep_id
      and participant.membership_state in ('pending', 'active')
      and (
        (p_archived and participant.archived_at is not null)
        or (not p_archived and participant.archived_at is null)
      )
      and (p_conversation_type is null or conversation.conversation_type = p_conversation_type)
  ), page as (
    select eligible.*
    from eligible
    where (
      (p_before_last_message_at is null and p_before_id is null)
      or (
        p_before_last_message_at is not null
        and (
          eligible.last_message_at < p_before_last_message_at
          or (
            eligible.last_message_at = p_before_last_message_at
            and (
              p_equal_timestamp_mode = 'include_all'
              or (
                p_equal_timestamp_mode = 'same_kind'
                and p_before_id is not null
                and eligible.id < p_before_id
              )
            )
          )
        )
      )
    )
    order by eligible.last_message_at desc, eligible.id desc
    limit least(greatest(coalesce(p_limit, 50), 1), 1000)
  )
  select
    page.id,
    page.conversation_type,
    page.state,
    page.subject,
    page.context_snapshot,
    page.last_message_at,
    page.latest_message_preview,
    page.latest_message_sender_display_name,
    page.updated_at,
    page.participant_id,
    page.participant_role,
    page.participant_membership_state,
    page.participant_last_read_at,
    page.participant_archived_at,
    page.participant_muted_at,
    page.participant_unread_count,
    coalesce((select pg_catalog.sum(eligible.participant_unread_count) from eligible), 0)::bigint
      as total_unread
  from page
  order by page.last_message_at desc, page.id desc
$$;

revoke all on function public.list_workspace_rep_conversation_page(
  uuid, text, boolean, integer, timestamptz, uuid, text
) from public, anon, authenticated;
grant execute on function public.list_workspace_rep_conversation_page(
  uuid, text, boolean, integer, timestamptz, uuid, text
) to service_role;

notify pgrst, 'reload schema';
