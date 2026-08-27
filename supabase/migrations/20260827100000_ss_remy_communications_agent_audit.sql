-- Remy is a narrowly scoped Communications Center integration. These rows
-- deliberately retain only operation metadata and digests, never raw message
-- bodies, credentials, or attachment data.

create table if not exists public.remy_communications_agent_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null default 'remy-communications',
  operation text not null,
  tool_name text not null,
  outcome text not null,
  request_digest text not null,
  resource_ids jsonb not null default '[]'::jsonb,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint remy_communications_agent_audit_events_outcome_check
    check (outcome in ('success', 'tool_error', 'rate_limited')),
  constraint remy_communications_agent_audit_events_digest_check
    check (request_digest ~ '^[a-f0-9]{64}$'),
  constraint remy_communications_agent_audit_events_resource_ids_array
    check (jsonb_typeof(resource_ids) = 'array'),
  constraint remy_communications_agent_audit_events_details_object
    check (jsonb_typeof(details) = 'object')
);

create index if not exists remy_communications_agent_audit_events_actor_created_idx
  on public.remy_communications_agent_audit_events (actor_key, created_at desc);

create index if not exists remy_communications_agent_audit_events_tool_created_idx
  on public.remy_communications_agent_audit_events (tool_name, created_at desc);

alter table public.remy_communications_agent_audit_events enable row level security;
revoke all on table public.remy_communications_agent_audit_events from anon, authenticated;

comment on table public.remy_communications_agent_audit_events is
  'Audit metadata for the draft-only Remy Communications MCP integration. Raw request and message content must not be stored here.';

-- A reply can only leave the system after an internal operator approves this
-- exact body. This table intentionally stores the approved body because it is
-- the durable record of what was authorized and later sent.
create table if not exists public.remy_communications_reply_approvals (
  id uuid primary key default gen_random_uuid(),
  support_report_id uuid not null references public.support_reports(id) on delete cascade,
  conversation_id uuid not null references public.workspace_conversations(id) on delete cascade,
  proposed_reply text not null,
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  approved_at timestamptz,
  approved_by_operator_id text,
  approved_by_operator_email text,
  decision_note text,
  claimed_at timestamptz,
  executed_at timestamptz,
  sent_message_id uuid references public.workspace_conversation_messages(id) on delete set null,
  constraint remy_communications_reply_approvals_status_check
    check (status in ('requested', 'approved', 'declined', 'executing', 'executed', 'expired')),
  constraint remy_communications_reply_approvals_body_check
    check (char_length(btrim(proposed_reply)) between 3 and 5000),
  constraint remy_communications_reply_approvals_expiry_check
    check (expires_at > requested_at),
  constraint remy_communications_reply_approvals_approval_check
    check ((status in ('approved', 'executing', 'executed')) = (approved_at is not null)),
  constraint remy_communications_reply_approvals_execution_check
    check ((status = 'executed') = (executed_at is not null))
);

create index if not exists remy_communications_reply_approvals_pending_idx
  on public.remy_communications_reply_approvals (status, expires_at, requested_at desc);
create index if not exists remy_communications_reply_approvals_report_idx
  on public.remy_communications_reply_approvals (support_report_id, requested_at desc);

alter table public.remy_communications_reply_approvals enable row level security;
revoke all on table public.remy_communications_reply_approvals from anon, authenticated;

comment on table public.remy_communications_reply_approvals is
  'One-time, internal-operator approvals for exact Remy-drafted Support replies. No broadcast, safety, status, or Task List action is permitted here.';
