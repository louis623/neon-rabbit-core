alter table public.sparkle_finder_nic_nac_intake_submissions
  drop constraint if exists sparkle_finder_nic_nac_intake_submissions_status_check;

alter table public.sparkle_finder_nic_nac_intake_submissions
  add constraint sparkle_finder_nic_nac_intake_submissions_status_check
  check (
    status in (
      'draft',
      'uploading',
      'submitted',
      'needs_label',
      'needs_confirmation',
      'needs_jewelry_photo',
      'photo_rejected',
      'saved_pending_sync',
      'accepted',
      'publish_queued',
      'published',
      'rejected',
      'publish_failed'
    )
  );

create unique index if not exists sparkle_finder_nic_nac_intake_assets_submission_kind_key
  on public.sparkle_finder_nic_nac_intake_assets (submission_id, asset_kind);

revoke insert, update, delete
  on public.sparkle_finder_nic_nac_intake_submissions
  from authenticated;

revoke insert, update, delete
  on public.sparkle_finder_nic_nac_intake_assets
  from authenticated;

drop policy if exists "Silver users can insert their own draft intake submissions"
  on public.sparkle_finder_nic_nac_intake_submissions;
drop policy if exists "Silver users can update their own non-published intake submissions"
  on public.sparkle_finder_nic_nac_intake_submissions;
drop policy if exists "Silver users can delete their own draft intake submissions"
  on public.sparkle_finder_nic_nac_intake_submissions;

drop policy if exists "Silver users can insert their own intake assets"
  on public.sparkle_finder_nic_nac_intake_assets;
drop policy if exists "Silver users can update their own pending intake assets"
  on public.sparkle_finder_nic_nac_intake_assets;
drop policy if exists "Silver users can delete their own intake assets"
  on public.sparkle_finder_nic_nac_intake_assets;

drop policy if exists "Silver users can create their own Studio upload objects"
  on storage.objects;
drop policy if exists "Silver users can replace their own pending Studio upload objects"
  on storage.objects;
drop policy if exists "Silver users can remove their own Studio upload objects"
  on storage.objects;
