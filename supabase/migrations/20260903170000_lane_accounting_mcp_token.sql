-- Dedicated Lane connector credential. Only the SHA-256 digest is retained;
-- the bearer itself exists only in Lane's secure connector field.
create table if not exists public.lane_accounting_mcp_tokens (
  id text primary key check (id = 'lane'),
  token_digest text not null check (token_digest ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);

alter table public.lane_accounting_mcp_tokens enable row level security;

insert into public.lane_accounting_mcp_tokens (id, token_digest)
values ('lane', '42e8c781ac59e4bd78bdcfac2a5426ea43f6458d0dde241eb2e94543a3ac501d')
on conflict (id) do update
  set token_digest = excluded.token_digest,
      created_at = now(),
      revoked = false;

comment on table public.lane_accounting_mcp_tokens is
  'Dedicated Lane Accounting MCP credential digests. Bearer values are never stored here.';
