create table if not exists public.sparkle_finder_nic_nac_intake_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'needs_label',
      'needs_confirmation',
      'needs_jewelry_photo',
      'photo_rejected',
      'accepted',
      'publish_queued',
      'published',
      'rejected',
      'publish_failed'
    )
  ),
  existing_catalog_design_id text,
  suite_catalog_design_id text,
  suite_publish_request_id text,
  item_number text not null default '',
  design_name text not null default '',
  jewelry_type text not null default '',
  collection_name text not null default '',
  collection_year integer,
  main_stone text not null default '',
  material text not null default '',
  bp_label text not null default '',
  bp_msrp numeric(8, 2),
  customer_note text not null default '',
  extracted_catalog jsonb not null default '{}'::jsonb,
  photo_feedback jsonb not null default '[]'::jsonb,
  last_error text not null default '',
  submitted_at timestamptz,
  accepted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'sparkle-finder-private',
  'sparkle-finder-private',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.sparkle_finder_nic_nac_intake_submissions is
  'Private Sparkle Finder Silver missing-piece intake records. Accepted rows can publish curated catalog data to the shared Sparkle Suite master jewelry database through a server-only contract.';

create table if not exists public.sparkle_finder_nic_nac_intake_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references public.sparkle_finder_nic_nac_intake_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_kind text not null check (asset_kind in ('original_label', 'jewelry_front')),
  storage_bucket text not null default 'sparkle-finder-private',
  storage_path text not null,
  content_type text not null default '',
  byte_size integer,
  nic_nac_quality_status text not null default 'pending' check (
    nic_nac_quality_status in ('pending', 'accepted', 'rejected')
  ),
  nic_nac_quality_feedback jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.sparkle_finder_nic_nac_intake_assets is
  'Private evidence and light-box photo metadata for Sparkle Finder missing-piece intake. Paths are private storage references, not public image URLs.';

create index if not exists sparkle_finder_nic_nac_intake_submissions_user_id_idx
  on public.sparkle_finder_nic_nac_intake_submissions(user_id);

create index if not exists sparkle_finder_nic_nac_intake_submissions_status_idx
  on public.sparkle_finder_nic_nac_intake_submissions(status);

create unique index if not exists sparkle_finder_nic_nac_intake_submissions_suite_publish_request_key
  on public.sparkle_finder_nic_nac_intake_submissions(suite_publish_request_id)
  where suite_publish_request_id is not null;

create index if not exists sparkle_finder_nic_nac_intake_assets_submission_id_idx
  on public.sparkle_finder_nic_nac_intake_assets(submission_id);

create index if not exists sparkle_finder_nic_nac_intake_assets_user_id_idx
  on public.sparkle_finder_nic_nac_intake_assets(user_id);

alter table public.sparkle_finder_nic_nac_intake_submissions enable row level security;
alter table public.sparkle_finder_nic_nac_intake_assets enable row level security;

create trigger set_sparkle_finder_nic_nac_intake_submissions_updated_at
before update on public.sparkle_finder_nic_nac_intake_submissions
for each row execute function private.set_updated_at();

revoke all on public.sparkle_finder_nic_nac_intake_submissions from anon;
revoke all on public.sparkle_finder_nic_nac_intake_assets from anon;

grant select, insert, update, delete on public.sparkle_finder_nic_nac_intake_submissions to authenticated;
grant select, insert, update, delete on public.sparkle_finder_nic_nac_intake_assets to authenticated;

create policy "Silver users can select their own intake submissions"
on public.sparkle_finder_nic_nac_intake_submissions
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sparkle_finder_memberships as membership
    where membership.user_id = auth.uid()
      and membership.access_state in ('silver_trial', 'silver_paid', 'silver_rep_included')
      and (membership.silver_ends_at is null or membership.silver_ends_at > now())
  )
);

create policy "Silver users can insert their own draft intake submissions"
on public.sparkle_finder_nic_nac_intake_submissions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status in ('draft', 'submitted', 'needs_label')
  and suite_catalog_design_id is null
  and suite_publish_request_id is null
  and accepted_at is null
  and published_at is null
  and exists (
    select 1
    from public.sparkle_finder_memberships as membership
    where membership.user_id = auth.uid()
      and membership.access_state in ('silver_trial', 'silver_paid', 'silver_rep_included')
      and (membership.silver_ends_at is null or membership.silver_ends_at > now())
  )
);

create policy "Silver users can update their own non-published intake submissions"
on public.sparkle_finder_nic_nac_intake_submissions
for update
to authenticated
using (
  user_id = auth.uid()
  and status in ('draft', 'submitted', 'needs_label', 'needs_confirmation', 'needs_jewelry_photo', 'photo_rejected')
  and exists (
    select 1
    from public.sparkle_finder_memberships as membership
    where membership.user_id = auth.uid()
      and membership.access_state in ('silver_trial', 'silver_paid', 'silver_rep_included')
      and (membership.silver_ends_at is null or membership.silver_ends_at > now())
  )
)
with check (
  user_id = auth.uid()
  and status in ('draft', 'submitted', 'needs_label', 'needs_confirmation', 'needs_jewelry_photo', 'photo_rejected')
  and suite_catalog_design_id is null
  and suite_publish_request_id is null
  and accepted_at is null
  and published_at is null
);

create policy "Silver users can delete their own draft intake submissions"
on public.sparkle_finder_nic_nac_intake_submissions
for delete
to authenticated
using (
  user_id = auth.uid()
  and status in ('draft', 'needs_label', 'photo_rejected')
);

create policy "Silver users can select their own intake assets"
on public.sparkle_finder_nic_nac_intake_assets
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sparkle_finder_nic_nac_intake_submissions as submission
    where submission.id = submission_id
      and submission.user_id = auth.uid()
  )
);

create policy "Silver users can insert their own intake assets"
on public.sparkle_finder_nic_nac_intake_assets
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sparkle_finder_nic_nac_intake_submissions as submission
    where submission.id = submission_id
      and submission.user_id = auth.uid()
      and submission.status in ('draft', 'submitted', 'needs_label', 'needs_jewelry_photo', 'photo_rejected')
  )
);

create policy "Silver users can update their own pending intake assets"
on public.sparkle_finder_nic_nac_intake_assets
for update
to authenticated
using (
  user_id = auth.uid()
  and nic_nac_quality_status = 'pending'
)
with check (
  user_id = auth.uid()
  and nic_nac_quality_status = 'pending'
);

create policy "Silver users can delete their own intake assets"
on public.sparkle_finder_nic_nac_intake_assets
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sparkle_finder_nic_nac_intake_submissions as submission
    where submission.id = submission_id
      and submission.user_id = auth.uid()
      and submission.status in ('draft', 'needs_label', 'photo_rejected')
  )
);

create policy "Silver users can read their own Studio upload objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sparkle-finder-private'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = 'studio'
);

create policy "Silver users can create their own Studio upload objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sparkle-finder-private'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = 'studio'
  and exists (
    select 1
    from public.sparkle_finder_memberships as membership
    where membership.user_id = auth.uid()
      and membership.access_state in ('silver_trial', 'silver_paid', 'silver_rep_included')
      and (membership.silver_ends_at is null or membership.silver_ends_at > now())
  )
);

create policy "Silver users can replace their own pending Studio upload objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sparkle-finder-private'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = 'studio'
)
with check (
  bucket_id = 'sparkle-finder-private'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = 'studio'
);

create policy "Silver users can remove their own Studio upload objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sparkle-finder-private'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = 'studio'
);
