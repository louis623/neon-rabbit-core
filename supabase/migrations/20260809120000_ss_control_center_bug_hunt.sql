create table if not exists public.sparkle_suite_bug_hunt_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  details text,
  item_type text not null default 'bug' check (item_type in ('bug', 'update', 'research', 'content', 'operations')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'blocked', 'complete')),
  owner text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_sparkle_suite_bug_hunt_items_status_updated
  on public.sparkle_suite_bug_hunt_items(status, updated_at desc);

alter table public.sparkle_suite_bug_hunt_items enable row level security;

insert into public.sparkle_suite_bug_hunt_items (title, item_type, owner, source) values
  ('Fix Trade Board interface text color to white where required.', 'bug', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Restore the missing Live Queue image in the public-site popup.', 'bug', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Fix the Stripe Billing and payment-history link so it opens the correct Stripe portal.', 'bug', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Investigate Google sign-in failures if Heather reports them.', 'bug', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Hide the SMS/mobile wallet until texting is functional.', 'update', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Make Soft Glow replace the Sparkles animation setting.', 'bug', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Fix the extra or incorrectly filtered public-site links.', 'bug', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Review and fix recipe upload or formatting bugs found during Heather testing.', 'bug', 'Heather + Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Clean up In the Pantry gallery so Heather’s approved photos display correctly.', 'content', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Add Customer List export/download.', 'update', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Create a monthly birthday report for upcoming customer birthdays.', 'update', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Create instructions for embedding TikTok videos.', 'content', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Keep Team Management and the master FAQ restricted as Coming soon.', 'update', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Build Heather’s affiliate shop area for recipes and kitchen tools.', 'update', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Add Heather’s Whatnot general and promo links after she provides them.', 'content', 'Louis + Heather', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Research the appropriate Whatnot integration strategy.', 'research', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Create a reviewable mockup for Heather’s shop/content structure.', 'content', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Migrate Heather’s approved old-site About copy, photos, and videos.', 'content', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Create and link a light-box and Nic-Nac jewelry cataloging tutorial.', 'content', 'Louis', 'Heather onboarding meeting — Aug 9, 2026'),
  ('Purchase and ship Heather’s product-photography light box.', 'operations', 'Louis', 'Heather onboarding meeting — Aug 9, 2026')
on conflict do nothing;
