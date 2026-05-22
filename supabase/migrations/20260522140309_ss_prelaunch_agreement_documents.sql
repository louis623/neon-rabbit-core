create table public.sparkle_suite_agreement_documents (
  id uuid primary key default gen_random_uuid(),
  launch_build_id uuid not null references public.sparkle_suite_launch_builds(id) on delete cascade,
  waitlist_id uuid references public.sparkle_suite_waitlist(id) on delete set null,
  intake_submission_id uuid references public.sparkle_suite_intake_submissions(id) on delete set null,
  provider text not null default 'signwell',
  mode text not null default 'sandbox',
  gate_type text not null default 'service_agreement',
  status text not null default 'draft',
  template_id text not null,
  template_label text not null default 'Sparkle Suite service agreement',
  pricing_cohort text not null default 'founder_first_20',
  provider_document_id text,
  recipient_name text not null,
  recipient_email text not null,
  send_email boolean not null default false,
  draft boolean not null default true,
  test_mode boolean not null default true,
  provider_status integer,
  signed_at timestamptz,
  signed_pdf_url text,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_by_rep_id uuid references public.reps(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparkle_suite_agreement_documents_provider_check
    check (provider in ('signwell')),
  constraint sparkle_suite_agreement_documents_mode_check
    check (mode in ('sandbox', 'live')),
  constraint sparkle_suite_agreement_documents_gate_type_check
    check (gate_type in ('service_agreement')),
  constraint sparkle_suite_agreement_documents_status_check
    check (status in ('draft', 'created', 'sent', 'signed', 'failed', 'voided')),
  constraint sparkle_suite_agreement_documents_current_unique
    unique (launch_build_id, provider, mode, gate_type),
  constraint sparkle_suite_agreement_documents_subject_check
    check (waitlist_id is not null or intake_submission_id is not null)
);

create index idx_sparkle_suite_agreement_documents_build
  on public.sparkle_suite_agreement_documents(launch_build_id);

create index idx_sparkle_suite_agreement_documents_provider_document
  on public.sparkle_suite_agreement_documents(provider_document_id)
  where provider_document_id is not null;

drop trigger if exists trg_sparkle_suite_agreement_documents_updated_at
  on public.sparkle_suite_agreement_documents;
create trigger trg_sparkle_suite_agreement_documents_updated_at
  before update on public.sparkle_suite_agreement_documents
  for each row execute function public.update_updated_at_column();

alter table public.sparkle_suite_agreement_documents enable row level security;

revoke all on table public.sparkle_suite_agreement_documents from anon, authenticated;
grant select, insert, update on table public.sparkle_suite_agreement_documents to service_role;
