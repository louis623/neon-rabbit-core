create table if not exists public.sparkle_finder_brand_settings (
  id text primary key check (id = 'global'),
  appearance_preset text not null default 'amethyst' check (
    appearance_preset in (
      'amethyst',
      'sparkle_suite_morganite',
      'black_diamond',
      'moonstone',
      'alpine_opal',
      'emerald_garden',
      'rose_gold',
      'garnet',
      'amber',
      'velvet',
      'rose_quartz'
    )
  ),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.sparkle_finder_brand_settings enable row level security;

revoke all on table public.sparkle_finder_brand_settings from anon, authenticated;
grant select, insert, update on table public.sparkle_finder_brand_settings to service_role;

insert into public.sparkle_finder_brand_settings (id, appearance_preset, updated_by)
values ('global', 'amethyst', 'migration:20260826110000')
on conflict (id) do nothing;

comment on table public.sparkle_finder_brand_settings is
  'Suite-owned global visual configuration for the separately deployed Sparkle Finder app.';
