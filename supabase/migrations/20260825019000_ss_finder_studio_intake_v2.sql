-- Versioned Sparkle Finder Showcase Studio continuation ledger.
--
-- This is intentionally isolated from jewelry_designs, trade_listings, and the
-- rep-scoped listing idempotency ledger. Finder evidence can resolve an
-- existing exact design or enter this private review queue, but it cannot
-- publish a catalog row or assign a canonical Suite photo.

create table if not exists public.finder_studio_intake_v2 (
  finder_submission_id uuid not null,
  resolve_fingerprint text not null,
  resolve_input jsonb not null,
  resolve_result jsonb,
  candidate_ids uuid[] not null default '{}'::uuid[],
  confirmation_design_id uuid,
  confirmation_result jsonb,
  review_design_id uuid,
  review_result jsonb,
  reviewed_by_email text,
  reviewed_by_rep_id uuid,
  reviewed_at timestamptz,
  review_note text,
  last_failure jsonb,
  stage text not null,
  active_action text,
  operation_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (finder_submission_id),
  constraint finder_studio_intake_v2_fingerprint_check
    check (resolve_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint finder_studio_intake_v2_input_object_check
    check (jsonb_typeof(resolve_input) = 'object'),
  constraint finder_studio_intake_v2_input_size_check
    check (octet_length(resolve_input::text) <= 65536),
  constraint finder_studio_intake_v2_candidate_count_check
    check (cardinality(candidate_ids) <= 50),
  constraint finder_studio_intake_v2_stage_check
    check (stage in (
      'resolving',
      'resolve_retryable',
      'awaiting_confirmation',
      'accepted',
      'publish_queued',
      'review_completed',
      'rejected',
      'confirming',
      'confirm_retryable',
      'confirmed'
    )),
  constraint finder_studio_intake_v2_active_action_check
    check (active_action is null or active_action in ('resolve', 'confirm')),
  constraint finder_studio_intake_v2_lease_shape_check
    check (
      (active_action is null and operation_token is null and lease_expires_at is null)
      or
      (active_action is not null and operation_token is not null and lease_expires_at is not null)
    ),
  constraint finder_studio_intake_v2_review_note_size_check
    check (review_note is null or length(review_note) <= 2000),
  constraint finder_studio_intake_v2_review_audit_shape_check
    check (
      (review_result is null and reviewed_by_email is null
        and reviewed_by_rep_id is null and reviewed_at is null)
      or
      (review_result is not null and reviewed_by_email is not null
        and reviewed_by_rep_id is not null and reviewed_at is not null)
    )
);

comment on column public.finder_studio_intake_v2.resolve_input is
  'Normalized intake metadata. Finder photo asset identifiers remain untrusted manual-review evidence; temporary URLs are never stored here.';

alter table public.finder_studio_intake_v2 enable row level security;
revoke all on table public.finder_studio_intake_v2
  from public, anon, authenticated;
grant select, insert, update on table public.finder_studio_intake_v2 to service_role;

create index if not exists idx_finder_studio_intake_v2_pending_review
  on public.finder_studio_intake_v2 (created_at asc, finder_submission_id asc)
  where stage = 'publish_queued' and review_result is null;

create or replace function public.rpc_claim_finder_studio_intake_v2(
  p_finder_submission_id uuid,
  p_action text,
  p_resolve_fingerprint text default null,
  p_resolve_input jsonb default null,
  p_selected_design_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ledger public.finder_studio_intake_v2%rowtype;
  v_operation_token uuid := gen_random_uuid();
begin
  if p_finder_submission_id is null
    or p_action is null
    or p_action not in ('resolve', 'confirm', 'resume')
  then
    raise exception 'invalid Finder Studio intake claim'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('finder-studio-v2:' || p_finder_submission_id::text, 0)
  );

  select *
    into v_ledger
  from public.finder_studio_intake_v2
  where finder_submission_id = p_finder_submission_id
  for update;

  if p_action = 'resolve' then
    if p_resolve_fingerprint is null
      or p_resolve_fingerprint !~ '^[0-9a-f]{64}$'
      or p_resolve_input is null
      or jsonb_typeof(p_resolve_input) <> 'object'
      or octet_length(p_resolve_input::text) > 65536
    then
      raise exception 'invalid Finder Studio resolve identity'
        using errcode = '22023';
    end if;

    if not found then
      insert into public.finder_studio_intake_v2 (
        finder_submission_id,
        resolve_fingerprint,
        resolve_input,
        stage,
        active_action,
        operation_token,
        lease_expires_at
      ) values (
        p_finder_submission_id,
        p_resolve_fingerprint,
        p_resolve_input,
        'resolving',
        'resolve',
        v_operation_token,
        now() + interval '60 seconds'
      );

      return jsonb_build_object(
        'decision', 'claimed',
        'action', 'resolve',
        'operationToken', v_operation_token
      );
    end if;

    if v_ledger.resolve_fingerprint <> p_resolve_fingerprint
      or v_ledger.resolve_input <> p_resolve_input
    then
      return jsonb_build_object('decision', 'conflict');
    end if;

    if v_ledger.review_result is not null then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.review_result
      );
    end if;

    if v_ledger.resolve_result is not null then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.resolve_result
      );
    end if;

    if v_ledger.active_action = 'resolve'
      and v_ledger.lease_expires_at > now()
    then
      return jsonb_build_object('decision', 'in_progress');
    end if;

    update public.finder_studio_intake_v2
    set stage = 'resolving',
        active_action = 'resolve',
        operation_token = v_operation_token,
        lease_expires_at = now() + interval '60 seconds',
        updated_at = now()
    where finder_submission_id = p_finder_submission_id;

    return jsonb_build_object(
      'decision', 'claimed',
      'action', 'resolve',
      'operationToken', v_operation_token
    );
  end if;

  if not found then
    return jsonb_build_object('decision', 'missing');
  end if;

  if p_action = 'resume' then
    if v_ledger.review_result is not null then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.review_result
      );
    end if;
    if v_ledger.confirmation_result is not null then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.confirmation_result
      );
    end if;
    if v_ledger.resolve_result is not null then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.resolve_result
      );
    end if;
    if v_ledger.last_failure is not null then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.last_failure
      );
    end if;
    return jsonb_build_object('decision', 'in_progress');
  end if;

  if p_selected_design_id is null then
    return jsonb_build_object('decision', 'invalid_selection');
  end if;

  if v_ledger.confirmation_result is not null then
    if v_ledger.confirmation_design_id = p_selected_design_id then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.confirmation_result
      );
    end if;
    return jsonb_build_object('decision', 'conflict');
  end if;

  if v_ledger.confirmation_design_id is not null
    and v_ledger.confirmation_design_id <> p_selected_design_id
  then
    return jsonb_build_object('decision', 'conflict');
  end if;

  if v_ledger.resolve_result is null
    or v_ledger.resolve_result ->> 'status' <> 'needs_variant_confirmation'
    or not (p_selected_design_id = any(v_ledger.candidate_ids))
  then
    return jsonb_build_object('decision', 'invalid_selection');
  end if;

  if v_ledger.active_action = 'confirm'
    and v_ledger.lease_expires_at > now()
  then
    return jsonb_build_object('decision', 'in_progress');
  end if;

  update public.finder_studio_intake_v2
  set confirmation_design_id = p_selected_design_id,
      stage = 'confirming',
      active_action = 'confirm',
      operation_token = v_operation_token,
      lease_expires_at = now() + interval '60 seconds',
      updated_at = now()
  where finder_submission_id = p_finder_submission_id;

  return jsonb_build_object(
    'decision', 'claimed',
    'action', 'confirm',
    'operationToken', v_operation_token,
    'resolveResult', v_ledger.resolve_result
  );
end;
$$;

create or replace function public.rpc_complete_finder_studio_intake_v2(
  p_finder_submission_id uuid,
  p_action text,
  p_operation_token uuid,
  p_result jsonb,
  p_candidate_ids uuid[] default '{}'::uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ledger public.finder_studio_intake_v2%rowtype;
  v_ok boolean;
  v_retryable boolean;
  v_result_candidate_ids uuid[];
  v_status text;
begin
  if p_finder_submission_id is null
    or p_action is null
    or p_action not in ('resolve', 'confirm')
    or p_operation_token is null
    or p_result is null
    or jsonb_typeof(p_result) is distinct from 'object'
    or p_result -> 'schemaVersion' is distinct from '2'::jsonb
    or jsonb_typeof(p_result -> 'ok') is distinct from 'boolean'
    or jsonb_typeof(p_result -> 'retryable') is distinct from 'boolean'
    or jsonb_typeof(p_result -> 'status') is distinct from 'string'
    or cardinality(coalesce(p_candidate_ids, '{}'::uuid[])) > 50
  then
    raise exception 'invalid Finder Studio intake completion'
      using errcode = '22023';
  end if;

  v_ok := (p_result ->> 'ok')::boolean;
  v_retryable := (p_result ->> 'retryable')::boolean;
  v_status := p_result ->> 'status';

  if v_ok and v_retryable then
    raise exception 'successful Finder Studio completion cannot be retryable'
      using errcode = '22023';
  end if;

  if v_ok and (
    (p_action = 'resolve' and not (v_status = any(array[
      'needs_variant_confirmation', 'accepted', 'publish_queued'
    ]::text[])))
    or
    (p_action = 'confirm' and v_status <> 'accepted')
  ) then
    raise exception 'invalid successful Finder Studio status for action'
      using errcode = '22023';
  end if;

  if not v_ok and not (v_status = any(array[
    'invalid_details',
    'invalid_selection',
    'photo_rejected',
    'storage_failed',
    'database_failed',
    'temporary_failure',
    'conflicting_replay'
  ]::text[])) then
    raise exception 'invalid failed Finder Studio status'
      using errcode = '22023';
  end if;

  if not v_ok and (
    jsonb_typeof(p_result -> 'errorCode') is distinct from 'string'
    or jsonb_typeof(p_result -> 'customerMessage') is distinct from 'string'
  ) then
    raise exception 'failed Finder Studio completion requires typed messages'
      using errcode = '22023';
  end if;

  if v_ok and v_status in ('accepted') and (
    jsonb_typeof(p_result -> 'suiteDesignId') is distinct from 'string'
    or jsonb_typeof(p_result -> 'resolvedDesign') is distinct from 'object'
    or p_result ->> 'suiteDesignId' is distinct from p_result #>> '{resolvedDesign,designId}'
  ) then
    raise exception 'accepted Finder Studio completion requires one exact design'
      using errcode = '22023';
  end if;

  if v_ok and v_status = 'publish_queued'
    and jsonb_typeof(p_result -> 'catalogDraft') is distinct from 'object'
  then
    raise exception 'queued Finder Studio completion requires a catalog draft'
      using errcode = '22023';
  end if;

  if v_ok and v_status = 'needs_variant_confirmation' and (
    jsonb_typeof(p_result -> 'variantCandidates') is distinct from 'array'
    or jsonb_array_length(p_result -> 'variantCandidates') = 0
    or jsonb_array_length(p_result -> 'variantCandidates')
      <> cardinality(coalesce(p_candidate_ids, '{}'::uuid[]))
  ) then
    raise exception 'variant confirmation requires matching candidate metadata'
      using errcode = '22023';
  end if;

  if v_ok and v_status = 'needs_variant_confirmation' then
    if exists (
      select 1
      from jsonb_array_elements(p_result -> 'variantCandidates') as offered(candidate)
      where jsonb_typeof(candidate -> 'designId') is distinct from 'string'
        or candidate ->> 'designId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) then
      raise exception 'variant confirmation contains an invalid candidate id'
        using errcode = '22023';
    end if;

    select array_agg((candidate ->> 'designId')::uuid order by position)
      into v_result_candidate_ids
    from jsonb_array_elements(p_result -> 'variantCandidates')
      with ordinality as offered(candidate, position);

    if v_result_candidate_ids is distinct from p_candidate_ids
      or cardinality(p_candidate_ids) is distinct from (
        select count(distinct candidate_id)::integer
        from unnest(p_candidate_ids) as offered_id(candidate_id)
      )
    then
      raise exception 'variant confirmation candidate ids do not match the stored offer'
        using errcode = '22023';
    end if;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('finder-studio-v2:' || p_finder_submission_id::text, 0)
  );

  select *
    into v_ledger
  from public.finder_studio_intake_v2
  where finder_submission_id = p_finder_submission_id
  for update;

  if not found
    or v_ledger.active_action <> p_action
    or v_ledger.operation_token <> p_operation_token
  then
    raise exception 'stale Finder Studio intake completion'
      using errcode = '40001';
  end if;

  if p_action = 'resolve' then
    if v_retryable and p_result ->> 'ok' = 'false' then
      update public.finder_studio_intake_v2
      set stage = 'resolve_retryable',
          last_failure = p_result,
          active_action = null,
          operation_token = null,
          lease_expires_at = null,
          updated_at = now()
      where finder_submission_id = p_finder_submission_id;
    else
      if v_status = 'needs_variant_confirmation'
        and cardinality(coalesce(p_candidate_ids, '{}'::uuid[])) = 0
      then
        raise exception 'variant confirmation requires stored candidate ids'
          using errcode = '22023';
      end if;

      update public.finder_studio_intake_v2
      set resolve_result = p_result,
          candidate_ids = case
            when v_status = 'needs_variant_confirmation' then p_candidate_ids
            else '{}'::uuid[]
          end,
          last_failure = null,
          stage = case
            when v_status = 'needs_variant_confirmation' then 'awaiting_confirmation'
            when v_status = 'accepted' then 'accepted'
            when v_status = 'publish_queued' then 'publish_queued'
            else 'rejected'
          end,
          active_action = null,
          operation_token = null,
          lease_expires_at = null,
          updated_at = now()
      where finder_submission_id = p_finder_submission_id;
    end if;
  else
    if v_retryable and p_result ->> 'ok' = 'false' then
      update public.finder_studio_intake_v2
      set stage = 'confirm_retryable',
          last_failure = p_result,
          active_action = null,
          operation_token = null,
          lease_expires_at = null,
          updated_at = now()
      where finder_submission_id = p_finder_submission_id;
    else
      update public.finder_studio_intake_v2
      set confirmation_result = p_result,
          last_failure = null,
          stage = case
            when v_status = 'accepted' then 'confirmed'
            else 'rejected'
          end,
          active_action = null,
          operation_token = null,
          lease_expires_at = null,
          updated_at = now()
      where finder_submission_id = p_finder_submission_id;
    end if;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.rpc_finalize_finder_studio_review_v2(
  p_finder_submission_id uuid,
  p_suite_design_id uuid,
  p_reviewed_by_email text,
  p_reviewed_by_rep_id uuid,
  p_review_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ledger public.finder_studio_intake_v2%rowtype;
  v_design record;
  v_item_number text;
  v_result jsonb;
  v_reviewed_at timestamptz := now();
begin
  if p_finder_submission_id is null
    or p_suite_design_id is null
    or p_reviewed_by_rep_id is null
    or p_reviewed_by_email is null
    or trim(p_reviewed_by_email) = ''
    or length(trim(p_reviewed_by_email)) > 320
    or (p_review_note is not null and length(trim(p_review_note)) > 2000)
  then
    raise exception 'invalid Finder Studio review finalization'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.reps as reviewer
    where reviewer.id = p_reviewed_by_rep_id
      and lower(trim(reviewer.email)) = lower(trim(p_reviewed_by_email))
  ) then
    raise exception 'invalid Finder Studio reviewer identity'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('finder-studio-v2:' || p_finder_submission_id::text, 0)
  );

  select *
    into v_ledger
  from public.finder_studio_intake_v2
  where finder_submission_id = p_finder_submission_id
  for update;

  if not found then
    return jsonb_build_object('decision', 'missing');
  end if;

  if v_ledger.review_result is not null then
    if v_ledger.review_design_id = p_suite_design_id then
      return jsonb_build_object(
        'decision', 'replay',
        'result', v_ledger.review_result
      );
    end if;
    return jsonb_build_object('decision', 'conflict');
  end if;

  if v_ledger.resolve_result is null
    or v_ledger.resolve_result ->> 'status' is distinct from 'publish_queued'
    or v_ledger.stage is distinct from 'publish_queued'
    or v_ledger.active_action is not null
  then
    return jsonb_build_object('decision', 'invalid_stage');
  end if;

  v_item_number := upper(trim(v_ledger.resolve_input #>> '{labelDetails,itemNumber}'));
  if v_item_number is null or v_item_number = '' then
    return jsonb_build_object('decision', 'invalid_stage');
  end if;

  select
    design.id,
    design.item_number,
    design.design_name,
    design.material,
    design.main_stone,
    design.type_prefix,
    design.canonical_photo_url,
    collection.name as collection_name,
    collection.collection_year
  into v_design
  from public.jewelry_designs as design
  left join public.collections as collection on collection.id = design.collection_id
  where design.id = p_suite_design_id
    and upper(trim(design.item_number)) = v_item_number;

  if not found or v_design.type_prefix not in ('RG', 'NK', 'ER', 'ST', 'BR') then
    return jsonb_build_object('decision', 'invalid_selection');
  end if;

  v_result := jsonb_build_object(
    'schemaVersion', 2,
    'ok', true,
    'status', 'accepted',
    'retryable', false,
    'mutationReplayed', false,
    'suiteDesignId', v_design.id,
    'resolvedDesign', jsonb_build_object(
      'designId', v_design.id,
      'itemNumber', v_design.item_number,
      'designName', v_design.design_name,
      'material', v_design.material,
      'mainStone', v_design.main_stone,
      'jewelryType', case v_design.type_prefix
        when 'RG' then 'ring'
        when 'NK' then 'necklace'
        when 'ER' then 'earrings'
        when 'ST' then 'stack'
        when 'BR' then 'bracelet'
      end,
      'collectionName', v_design.collection_name,
      'collectionYear', v_design.collection_year,
      'canonicalPhotoUrl', v_design.canonical_photo_url,
      'description', null
    ),
    'reviewReceipt', jsonb_build_object(
      'status', 'review_completed',
      'reviewedAt', v_reviewed_at,
      'canonicalPhotoControl', case
        when v_design.canonical_photo_url is null then 'not_applicable'
        else 'not_automatically_verified'
      end
    )
  );

  update public.finder_studio_intake_v2
  set review_design_id = p_suite_design_id,
      review_result = v_result,
      reviewed_by_email = lower(trim(p_reviewed_by_email)),
      reviewed_by_rep_id = p_reviewed_by_rep_id,
      reviewed_at = v_reviewed_at,
      review_note = nullif(trim(p_review_note), ''),
      last_failure = null,
      stage = 'review_completed',
      active_action = null,
      operation_token = null,
      lease_expires_at = null,
      updated_at = now()
  where finder_submission_id = p_finder_submission_id;

  return jsonb_build_object('decision', 'finalized', 'result', v_result);
end;
$$;

revoke all on function public.rpc_claim_finder_studio_intake_v2(
  uuid, text, text, jsonb, uuid
) from public, anon, authenticated;
grant execute on function public.rpc_claim_finder_studio_intake_v2(
  uuid, text, text, jsonb, uuid
) to service_role;

revoke all on function public.rpc_complete_finder_studio_intake_v2(
  uuid, text, uuid, jsonb, uuid[]
) from public, anon, authenticated;
grant execute on function public.rpc_complete_finder_studio_intake_v2(
  uuid, text, uuid, jsonb, uuid[]
) to service_role;

revoke all on function public.rpc_finalize_finder_studio_review_v2(
  uuid, uuid, text, uuid, text
) from public, anon, authenticated;
grant execute on function public.rpc_finalize_finder_studio_review_v2(
  uuid, uuid, text, uuid, text
) to service_role;

notify pgrst, 'reload schema';
