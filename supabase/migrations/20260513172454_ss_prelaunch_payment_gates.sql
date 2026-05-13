create table if not exists public.sparkle_suite_payment_gates (
  id uuid primary key default gen_random_uuid(),
  gate_type text not null
    check (gate_type in ('start_work_fee', 'launch_fee')),
  status text not null default 'not_started'
    check (status in (
      'not_started',
      'checkout_created',
      'paid',
      'cancelled',
      'failed',
      'expired'
    )),
  rep_id uuid references public.reps(id) on delete set null,
  operator_rep_id uuid references public.reps(id) on delete set null,
  intake_submission_id uuid
    references public.sparkle_suite_intake_submissions(id) on delete set null,
  waitlist_id uuid references public.sparkle_suite_waitlist(id) on delete set null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_price_id text,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  currency text not null default 'usd',
  livemode boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  checkout_created_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  failed_at timestamptz,
  expired_at timestamptz
);

create unique index if not exists idx_sparkle_suite_payment_gates_intake_gate
  on public.sparkle_suite_payment_gates(intake_submission_id, gate_type)
  where intake_submission_id is not null;

create index if not exists idx_sparkle_suite_payment_gates_waitlist
  on public.sparkle_suite_payment_gates(waitlist_id, gate_type, created_at desc)
  where waitlist_id is not null;

create index if not exists idx_sparkle_suite_payment_gates_status
  on public.sparkle_suite_payment_gates(status, created_at desc);

alter table public.sparkle_suite_payment_gates enable row level security;

revoke all on table public.sparkle_suite_payment_gates from anon, authenticated;
grant select, insert, update on table public.sparkle_suite_payment_gates to service_role;
