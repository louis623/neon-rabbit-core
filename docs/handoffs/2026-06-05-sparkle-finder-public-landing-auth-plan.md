# Sparkle Finder Public Landing And Auth Plan Handoff

Created: 2026-06-05

## Status

IMPLEMENTED_WITH_GOOGLE_AUTH_ENABLED.

The lockdown implementation has been applied in the active local repo workbench and verified locally. Google Auth has now been enabled through the authenticated Supabase Chrome dashboard session and verified externally.

## Local Routing

- Binder: `C:\Users\louis\sparkle-finder`
- Active repo workbench: `C:\Users\louis\sparkle-finder-repo`
- GitHub repo: `louis623/sparkle-finder`
- Branch: `codex-sparkle-finder-v1`
- Codespaces: paused unless Louis explicitly reselects them

Do not implement, build, test, commit, or push from the binder.

## Key Decisions

- Sparkle Finder should visually match the Sparkle Suite brand ecosystem.
- Use the Sparkle Suite seal/brand cues, bright pink accent, ivory/blush surfaces, and dark plum/espresso header/footer direction.
- Anonymous visitors should be funneled into account creation instead of seeing full tools.
- Public landing page should use the first reference concept: simple, trust-first, no live jewelry cards, no marketplace feel.
- Sparkle Finder must clearly state it does not sell Bomb Party jewelry and is not Bomb Party, a Bomb Party affiliate, or a Bomb Party rep.
- Public landing should avoid live Bomb Party jewelry imagery even though the underlying database supports jewelry discovery.
- Traditional sign-in should work like Sparkle Suite.
- Google Auth should be added, but Google users must still complete required account details before full Silver/tool access.
- Phone, state, and privacy acknowledgment remain important for trial protection, account support, and user data integrity.

## Work Completed In This Session

- Recovered and confirmed the Sparkle Finder local-first repo model.
- Kept the binder lightweight and separate from the active repo.
- Reviewed Sparkle Finder locally at `http://127.0.0.1:3000/`.
- Polished Sparkle Finder toward the Sparkle Suite brand standard.
- Updated logo/wordmark direction so the header uses bright pink Sparkle Finder treatment.
- Reviewed and corrected font usage so title/headline surfaces use the Sparkle Suite display font direction.
- Planned and implemented the safe catalog direction so Sparkle Finder reads from the shared Sparkle Suite jewelry data without creating a second source of truth.
- Discussed anonymous visitor experience and selected an account-first funnel.
- Created/refined public landing reference concepts and selected the first trust-first direction.
- Reviewed the implementation plan for gaps.
- Saved the final lockdown plan.
- Implemented the trust-first anonymous public landing page in `C:\Users\louis\sparkle-finder-repo`.
- Removed anonymous homepage exposure of live/demo jewelry/show/rep data.
- Added traditional email/password sign-in UI.
- Added Supabase Google OAuth client entry points for sign-in and sign-up.
- Added dedicated OAuth callback route at `/api/auth/callback`.
- Reused safe relative redirect handling across email confirmation and OAuth callback flows.
- Added account-completion handling for Google users missing required details.
- Preserved local preview auth controls as dev-only.
- Updated deployment docs for Google OAuth, redirect URLs, Vercel env state, and Supabase Management API fields.
- Added Vercel production public auth env vars: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Added Vercel development public Supabase env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Enabled Google Auth in Supabase through the Chrome dashboard session.
- Added Sparkle Finder production callback/confirm redirect URLs and `http://127.0.0.1:3000/**` to Supabase URL Configuration.
- Verified public Supabase Auth settings with anon key: `external.google=true`.
- Verified Supabase OAuth start returns `302` to Google for `https://yoursparklefinder.com/api/auth/callback?next=/account`.
- Applied Sparkle Finder account/consent migrations through the authenticated Supabase SQL Editor.
- Verified `sparkle_finder_profiles` returns `200 OK` through Supabase REST after schema reload.

## Lockdown Plan

Primary plan file:

`C:\Users\louis\sparkle-finder\docs\superpowers\plans\2026-06-05-sparkle-finder-public-landing-auth-lockdown.md`

Important plan requirements:

- Do implementation in `C:\Users\louis\sparkle-finder-repo`.
- Do not expose live jewelry/demo data on the anonymous homepage.
- Add a public landing page that matches the selected first concept.
- Add traditional email/password sign-in.
- Add Google OAuth through Supabase.
- Add a dedicated OAuth callback route.
- Extract and reuse safe redirect handling.
- Add account-completion behavior for Google users missing required profile/privacy fields.
- Update tests before implementation.
- Verify with lint, tests, build, and browser QA.

## Current Repo Risk

The active repo has existing uncommitted Sparkle Finder work from this session and prior related local work. Do not revert it. Before implementation, run:

```powershell
git -C C:\Users\louis\sparkle-finder-repo status --short --branch
```

Known expected dirty work includes branding, font, catalog, and route/test changes.

## Latest Verification

Run from `C:\Users\louis\sparkle-finder-repo`:

- `npm run lint` passed.
- `npm run test` passed: 11 files, 181 tests.
- `npm run build` passed.
- `npm run smoke:sparkle-finder` passed: 9 Playwright tests.
- Secret grep found no app/component service-role or client-secret references.

## Remaining External Setup

- Supabase CLI project management access is unavailable: `supabase projects list -o json` returns `Unauthorized`.
- Vercel preview env is still empty because `sparkle-finder-dev` is not connected to a Git repository; Vercel rejects branch-scoped preview env setup until that is resolved.
- Supabase migration history may need later reconciliation because migrations were applied through SQL Editor rather than `supabase db push`.

## Next Move

Connect the Vercel project to GitHub before preview OAuth env setup is needed. If strict Supabase migration history is required later, authenticate Supabase CLI and reconcile migration history. Do not commit unless Louis approves.
