# Sparkle Finder Silver Auth Environment Readiness

Created: 2026-06-01

## Current Status

Production rollout is not complete.

- Production deployment has not been run for the Silver auth/billing work.
- Remote Supabase migrations have not been applied.
- Local Supabase is not linked. `supabase migration list --linked` failed with: `Cannot find project ref. Have you run supabase link?`
- The linked Vercel project is `sparkle-finder-dev`.
- `npx vercel env ls` reported no environment variables.
- Latest implemented Silver/auth smoke commit before this rollout document: `758ceb5 test: assert account silver trial smoke copy`.

## Required Vercel Environment Variables

Configure these in Vercel before a production deploy. Production values should be set for the Production environment first. Preview and Development can be added after Louis decides whether they should point at the same Supabase project or a separate staging project.

| Variable | Scope | Required For | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public browser/server | Auth redirects, billing return URLs | Production value: `https://yoursparklefinder.com`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public browser/server | Supabase Auth and client reads | From the linked Supabase project API settings. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public browser/server | Supabase browser/server client | Use the publishable/anon key, not the service role key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Stripe webhook membership writes | Keep out of client code. Required for webhook-driven paid Silver updates. |
| `STRIPE_SECRET_KEY` | Server only | Checkout, billing portal, webhook API reads | Use the live key for production rollout. |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signature verification | From the production webhook endpoint configured in Stripe. |
| `STRIPE_SILVER_PRICE_ID` | Server only | Paid Silver checkout | Recurring monthly price ID for the Silver Membership product. Target price is `$4.99/month`. |

Do not deploy full production paid auth/billing until all required variables are present. The current code is designed to fail closed for paid billing when Stripe or Supabase service-role configuration is missing.

## Vercel Commands

Use these after Louis supplies production values:

```powershell
npx vercel env add NEXT_PUBLIC_SITE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add STRIPE_SILVER_PRICE_ID production
npx vercel env ls
```

Expected production values:

```text
NEXT_PUBLIC_SITE_URL=https://yoursparklefinder.com
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase publishable or anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>
STRIPE_SECRET_KEY=<stripe live secret key>
STRIPE_WEBHOOK_SECRET=<stripe live webhook signing secret>
STRIPE_SILVER_PRICE_ID=<stripe recurring monthly price id>
```

## Supabase Requirements

Official Supabase SSR auth docs checked for this rollout:

- `https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs`
- `https://supabase.com/docs/guides/auth/auth-email-templates`

Link the local project before applying the migration:

```powershell
supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase migration list --linked
supabase db push
```

The remote project must receive the Sparkle Finder account schema migration that creates and protects:

- `sparkle_finder_profiles`
- `sparkle_finder_memberships`
- `sparkle_finder_communication_consents`
- `sparkle_finder_collection_items`
- account creation trigger for the default 45-day Silver trial
- RLS policies for user-owned profile, membership, consent, and collection rows

Supabase Auth configuration:

- Site URL should be `https://yoursparklefinder.com`.
- Redirect allow-list should include `https://yoursparklefinder.com/**`.
- If `www` remains a public entry point, also allow `https://www.yoursparklefinder.com/**`.
- Password signup confirmation and magic-link emails should target Sparkle Finder's server-side confirm route.
- The current confirm route expects `token_hash`, `type`, and optional `next`.
- Supabase SSR email-template docs support `TokenHash` for custom server-side auth links.
- A suitable production Confirm signup template target is:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account
```

- A suitable production Magic link template target is:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/silver?from=signup
```

Verify exact template placement and variable names in the Supabase dashboard before enabling templates. Do not rely only on Supabase's default `{{ .ConfirmationURL }}` redirect flow for SSR confirmation, because Sparkle Finder's `/auth/confirm` route exchanges `token_hash` directly.

## Stripe Requirements

Create or verify in live Stripe:

- Product: `Silver Membership`
- Price: recurring monthly, `$4.99/month`
- Production price ID stored as `STRIPE_SILVER_PRICE_ID`
- Billing Portal enabled for subscription management
- Production webhook endpoint:

```text
https://yoursparklefinder.com/api/stripe/webhook
```

Webhook events needed by the current server route:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET`.

## Deployment Command

After Vercel env vars are present, Supabase is linked, migrations are applied, Supabase Auth is configured, and Stripe webhook/product setup is complete:

```powershell
npx vercel --prod --yes
```

Record the production deployment URL and verify the custom domain alias before calling the rollout complete.

## Privacy And Product Guardrails

- Phone numbers may be collected for identity, recovery, verification, trial abuse prevention, and security notices.
- Phone number collection does not create promotional SMS consent.
- Promotional email and promotional SMS must stay separate optional opt-ins.
- Promotional SMS must remain unchecked by default.
- Do not send SMS marketing without explicit consent and a chosen compliant provider.
- Do not sell customer personal information.
- Do not publish affiliate links, exact product selections, live prices, copied reviews, ratings, or retailer images without Louis approval and current program-term confirmation.
- Every affiliate placement needs nearby disclosure plus issue-reporting/trust copy.
- Sparkle Finder remains a discovery hub, not a jewelry marketplace.
- Do not imply official Bomb Party affiliation.
