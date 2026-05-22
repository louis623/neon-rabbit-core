alter table public.sparkle_suite_payment_gates
  add column if not exists launch_build_id uuid
    references public.sparkle_suite_launch_builds(id) on delete set null,
  add column if not exists stripe_subscription_id text,
  add column if not exists checkout_email_status text not null default 'not_attempted',
  add column if not exists checkout_email_provider_id text,
  add column if not exists checkout_email_error text,
  add column if not exists checkout_email_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_payment_gates_checkout_email_status_check'
      and conrelid = 'public.sparkle_suite_payment_gates'::regclass
  ) then
    alter table public.sparkle_suite_payment_gates
      add constraint sparkle_suite_payment_gates_checkout_email_status_check
      check (checkout_email_status in ('not_attempted', 'sent', 'skipped', 'failed'));
  end if;
end $$;

create index if not exists idx_sparkle_suite_payment_gates_launch_build
  on public.sparkle_suite_payment_gates(launch_build_id, gate_type, created_at desc)
  where launch_build_id is not null;
