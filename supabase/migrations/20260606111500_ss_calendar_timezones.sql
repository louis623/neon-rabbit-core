alter table public.reps
  add column if not exists time_zone text not null default 'America/New_York';

alter table public.calendar_events
  add column if not exists time_zone text not null default 'America/New_York';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reps_time_zone_not_blank'
  ) then
    alter table public.reps
      add constraint reps_time_zone_not_blank
      check (length(trim(time_zone)) > 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_events_time_zone_not_blank'
  ) then
    alter table public.calendar_events
      add constraint calendar_events_time_zone_not_blank
      check (length(trim(time_zone)) > 0)
      not valid;
  end if;
end $$;
