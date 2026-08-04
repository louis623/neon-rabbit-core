alter table public.sparkle_suite_launch_builds
  add column if not exists source_removed_at timestamptz;

alter table public.sparkle_suite_launch_builds
  drop constraint if exists sparkle_suite_launch_builds_subject_check;

alter table public.sparkle_suite_launch_builds
  add constraint sparkle_suite_launch_builds_subject_check
  check (
    waitlist_id is not null
    or intake_submission_id is not null
    or source_removed_at is not null
  );

create or replace function public.archive_launch_build_source_before_waitlist_delete()
returns trigger
language plpgsql
as $$
begin
  update public.sparkle_suite_launch_builds
  set source_removed_at = coalesce(source_removed_at, now()),
      updated_at = now()
  where waitlist_id = old.id;

  return old;
end;
$$;

drop trigger if exists archive_launch_build_source_before_waitlist_delete
  on public.sparkle_suite_waitlist;

create trigger archive_launch_build_source_before_waitlist_delete
before delete on public.sparkle_suite_waitlist
for each row
execute function public.archive_launch_build_source_before_waitlist_delete();
