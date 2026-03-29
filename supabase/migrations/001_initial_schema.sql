-- Enable pgvector
create extension if not exists vector;

-- OPEN BRAIN — semantic memory store
create table if not exists open_brain (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),
  source text,
  tags text[],
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  platform text default 'readdy',
  tier text default 'sparkle',
  status text default 'active',
  monthly_rate numeric(10,2),
  setup_fee numeric(10,2),
  site_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pipeline status
create table if not exists pipeline_status (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  stage text not null,
  notes text,
  updated_at timestamptz default now()
);

-- Builds
create table if not exists builds (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  build_type text,
  status text default 'in_progress',
  checklist jsonb default '[]',
  notes text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_type text default 'monthly',
  status text default 'pending',
  stripe_payment_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: enable on all tables
alter table open_brain enable row level security;
alter table clients enable row level security;
alter table pipeline_status enable row level security;
alter table builds enable row level security;
alter table payments enable row level security;
