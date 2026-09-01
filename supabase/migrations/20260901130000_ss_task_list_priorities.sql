alter table public.sparkle_suite_bug_hunt_items
  add column priority text not null default 'medium'
  check (priority in ('urgent', 'high', 'medium', 'low'));

create index if not exists idx_sparkle_suite_bug_hunt_items_priority_updated
  on public.sparkle_suite_bug_hunt_items(priority, updated_at desc);
