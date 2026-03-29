# Supabase Migrations

## Applying migrations

Migration `001_initial_schema.sql` must be applied manually. You have two options:

### Option A — Supabase Dashboard SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste the contents of `migrations/001_initial_schema.sql` and run it

### Option B — Supabase CLI
```bash
supabase db push
```

## Prerequisites

**pgvector must be enabled before running the migration.** The migration includes `create extension if not exists vector;` which handles this, but the extension must be available on your Supabase plan (it is enabled by default on all Supabase projects).

## Security

The `service_role` key grants full database access, bypassing Row Level Security. It is **not** stored in this repository or in `.env.local`. Retrieve it from **Bitwarden** when needed for admin operations (e.g., seeding, migrations run server-side).

Never expose the `service_role` key client-side or commit it to version control.
