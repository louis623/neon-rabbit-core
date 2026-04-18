-- ─── 017: neon_rabbit_clients reconcile + reseed ─────────────────────────────
-- Drops 8 stale rows from the April 4 double-seed (BlingKitchen×2,
-- Bri's Glowtique×2, Capital C×2, Sprinkled in Diamonds×2), adds the columns
-- the HQ ClientDirectory needs to render live, then reseeds the 6 real
-- clients verbatim from src/components/ClientDirectory.tsx CLIENTS const.
--
-- Stripe-cron columns (payment_status, stripe_customer_id, current_plan,
-- next_charge_date, lifetime_revenue, mrr) are NOT touched — Financial tab
-- will use them later.
--
-- status_color (NEW)  → dashboard dot ('green'|'yellow'|'red')
-- status (existing)   → lifecycle ('active'|'paused'|'maintenance') — for cron
--
-- user_id is RLS-bound; reuses the owner UUID already on every prior row.

BEGIN;

-- A. Drop the 8 known stale rows by UUID (targeted; never table-wide).
DELETE FROM public.neon_rabbit_clients
  WHERE id IN (
    '6cec7ee4-bc1e-4b08-a755-6c394565c813', -- Sprinkled in Diamonds (1)
    '005ebf08-8829-4840-bbbd-e01d9c90b88c', -- Capital C (1)
    '01f7602c-ec50-40a6-b2f5-1fecba02d220', -- Bri's Glowtique (1)
    'a7bb4c30-620e-4f2d-a74a-e8080a5a0e9a', -- BlingKitchen (1)
    'ab860ec3-f4bd-47f6-9fc2-46aacd208e31', -- Sprinkled in Diamonds (2)
    '8e03dc2a-3703-44d2-a90b-96c56704b3f1', -- Capital C (2)
    '76632a6b-2b4e-4699-b35d-844e70028ba7', -- Bri's Glowtique (2)
    '6800f962-9ce1-4e61-82ff-c0ce28a693a1'  -- BlingKitchen (2)
  );

-- B. Add columns ClientDirectory needs.
ALTER TABLE public.neon_rabbit_clients
  ADD COLUMN IF NOT EXISTS code               text,
  ADD COLUMN IF NOT EXISTS phone              text,
  ADD COLUMN IF NOT EXISTS email              text,
  ADD COLUMN IF NOT EXISTS status_color       text,
  ADD COLUMN IF NOT EXISTS status_description text,
  ADD COLUMN IF NOT EXISTS website            text,
  ADD COLUMN IF NOT EXISTS socials            jsonb,
  ADD COLUMN IF NOT EXISTS time_zone          text,
  ADD COLUMN IF NOT EXISTS monthly_rate       text,
  ADD COLUMN IF NOT EXISTS team               text,
  ADD COLUMN IF NOT EXISTS display_order      integer;

-- B.1 Partial unique index on code so ON CONFLICT (code) is well-defined.
--     NULL codes (Desie) are allowed; non-NULL codes must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS neon_rabbit_clients_code_key
  ON public.neon_rabbit_clients (code) WHERE code IS NOT NULL;

-- C. Reseed 6 real clients. ON CONFLICT (code) DO NOTHING makes re-runs
--    a no-op for the 5 coded clients; Desie's NULL-coded row is guarded
--    by a separate WHERE NOT EXISTS so the migration is fully idempotent.
INSERT INTO public.neon_rabbit_clients
  (user_id, name, code, phone, email,
   status, status_color, status_description,
   website, socials, time_zone, monthly_rate, team, display_order)
VALUES
  ('40ddb0a2-6de7-494b-b0b6-22cbfc41fd36',
   'Lindsey Chapman', 'MHF-7342', '720-448-4254', 'lindseychapman1188@gmail.com',
   'active', 'green',
   'Active — Mile High Fizz, first SS client, live test environment',
   'https://milehighfizz.com',
   '[{"label":"TikTok","url":"https://www.tiktok.com/@lindze1188"}]'::jsonb,
   'Mountain (CO)', '$0 (family)', 'Fizz City', 1),

  ('40ddb0a2-6de7-494b-b0b6-22cbfc41fd36',
   'Brittany Osborne', 'BWB-5819', '813-730-0345', 'braxtonsherri33@gmail.com',
   'active', 'green',
   'Active — Team lead, referral pipeline',
   'https://brittwithbling.com',
   '[{"label":"TikTok","url":"https://www.tiktok.com/@brittwithbling"}]'::jsonb,
   'Eastern (FL)', '$39/mo', 'Fizz City', 2),

  ('40ddb0a2-6de7-494b-b0b6-22cbfc41fd36',
   'Brianna Williams', 'BGL-2463', '(520) 720-8840', 'williams.brianna19@yahoo.com',
   'paused', 'yellow',
   'Paused — Bri''s Glowtique, project on hold pending decision',
   'https://brisglowtique.com',
   '[{"label":"TikTok","url":"https://www.tiktok.com/@mrs.briannawilliams19"},{"label":"Facebook VIP Group","url":"https://www.facebook.com/groups/1485026002799524"}]'::jsonb,
   'Central (KS)', '$39/mo', 'Fizz City / Hustle and Heart', 3),

  ('40ddb0a2-6de7-494b-b0b6-22cbfc41fd36',
   'Heather Daugherty', 'TBK-9157', '(614) 571-2561', 'blingkitchen19@gmail.com',
   'active', 'green',
   'Active — The Bling Kitchen, remaining bespoke work (recipe cards, business cards, social branding)',
   'https://theblingkitchen.com',
   '[{"label":"TikTok","url":"https://www.tiktok.com/@blingkitchen"},{"label":"Facebook VIP Group","url":"https://www.facebook.com/groups/1485026002799524"}]'::jsonb,
   'Eastern (OH)', '$39/mo', 'Opal Sparkling Gems (under Karen, Fizz City umbrella)', 4),

  ('40ddb0a2-6de7-494b-b0b6-22cbfc41fd36',
   'Kara Weeks', 'SID-6284', '714-323-9071', 'kararweeks@gmail.com',
   'active', 'green',
   'Active — Sprinkled in Diamonds, remaining bespoke work (business cards, social branding)',
   'https://sprinkledindiamonds.com',
   '[{"label":"TikTok","url":"https://www.tiktok.com/@kararweeks"}]'::jsonb,
   'Pacific (CA)', '$39/mo', 'Fizz City', 5)
ON CONFLICT (code) WHERE code IS NOT NULL DO NOTHING;

-- Desie has no project code; guard with NOT EXISTS on email.
INSERT INTO public.neon_rabbit_clients
  (user_id, name, code, phone, email,
   status, status_color, status_description,
   website, socials, time_zone, monthly_rate, team, display_order)
SELECT
  '40ddb0a2-6de7-494b-b0b6-22cbfc41fd36',
  'Desie Roberts', NULL, '617-733-2938', 'robertsphotostudio840@gmail.com',
  'maintenance', 'green',
  'Maintenance only — Roberts Photo Studio',
  'https://mybostonpassportphotos.com',
  NULL,
  'Eastern (MA)', '$0 (pro bono / family)', NULL, 6
WHERE NOT EXISTS (
  SELECT 1 FROM public.neon_rabbit_clients
   WHERE email = 'robertsphotostudio840@gmail.com'
);

COMMIT;
