alter table public.sparkle_suite_waitlist
  alter column tiktok_handle drop not null,
  alter column team_rep_name drop not null,
  add column if not exists operator_notes text,
  add column if not exists account_activated_at timestamptz,
  add column if not exists account_activated_by_rep_id uuid
    references public.reps(id) on delete set null;

create index if not exists idx_sparkle_suite_waitlist_account_activated
  on public.sparkle_suite_waitlist(account_activated_at desc, created_at desc);
