<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sparkle Suite Workspace

This repo is the active Sparkle Suite workspace and now contains both the code
and the former Codex binder/Open Brain files. Start future Codex desktop
sessions from this repo as the writable workspace:

`C:\Users\louis\sparkle-suite-repo`

Before doing Sparkle Suite work, read the current project memory from this repo:

- `vault\project-state.md`
- `vault\session-log.md`
- `vault\decisions.md`
- `vault\open-items.md`

Project skills live in this repo at `.agents\skills`. Use them when their
trigger rules apply, especially:

- `sparkle-suite-existing-site-migration`
- `sparkle-suite-production-smoke`
- `sparkle-nic-nac-agent-architecture`
- `sparkle-live-queue`

Use this repo for implementation, builds, tests, commits, pushes, deploys,
Supabase migrations, smoke tests, notes, memory, plans, handoffs, and skills.
The old `C:\Users\louis\sparkle-suite` folder is retained only as a redirect
and historical archive; do not depend on it for active instructions.

## Default Release Rule

Every approved Sparkle Suite code or content change includes committing the
legitimate session changes, pushing the current branch, deploying the exact
branch tip to Vercel production, confirming both `https://www.yoursparklesuite.com`
and `https://yoursparklesuite.com` resolve to that exact deployment, and
verifying the affected workflow on the live customer domain. Louis does not
need to request commit, push, or deploy separately each time. Skip any release
step only when Louis explicitly says the work is local-only, should not be
committed, should not be pushed, or should not be deployed.

Do not touch Chrome Web Store settings or local Sparkle Suite Chrome extension
code. Treat live queue extension files as protected live-show material. Read
`LIVE_EXTENSION_SAFETY.md` before any live extension discussion or handoff.

For Vercel production checks, logged-in workspace smoke tests, required setup
checks, Help & Resources checks, or Nic-Nac UI checks, use
`sparkle-suite-production-smoke` when available. Use reviewer-smoke/synthetic
sessions instead of Louis's personal account.

The only default deployed review target is
`https://www.yoursparklesuite.com`. The apex
`https://yoursparklesuite.com` must resolve to the same production deployment.
Sparkle Suite's "demo" is safe reviewer data/mode inside this live site, not a
separate environment, deployment lane, or review domain.
Raw Vercel deployment URLs and `sparkle-suite-demo.vercel.app` are provenance
evidence only. Do not promote them, hand them to Louis for ordinary review, or
describe work as complete because they respond. If Louis says something is
still wrong, verify the exact live-domain URL he has open, preferably through
the Chrome connector, before claiming the fix is live.

## Production Provenance and Account Safety

The July 31, 2026 production rollback/checkout incident is documented at
`docs\sparkle-suite\incidents\2026-07-31-production-rollback-and-checkout-routing.md`.
Read it before any production restore, alias change, authentication repair,
checkout repair, or Louis admin/demo-account work.

Sparkle Suite implementation and release work must use only:

- Local repo: `C:\Users\louis\sparkle-suite-repo`
- GitHub repo: `louis623/sparkle-suite`
- Active branch: `codex/nic-nac-trade-hardening`
- Live customer domain: `https://www.yoursparklesuite.com`
- Live review target: `https://www.yoursparklesuite.com`
- Environment model: one live Sparkle Suite surface; demo/reviewer mode uses
  safe data inside the live site

The active-branch source of truth is `config\active-branches.json`; the audited
status of every known branch/worktree is
`docs\sparkle-suite\operations\branch-register.md`. If the current branch is
not allowlisted, stop after read-only inspection. Do not edit, build, test,
commit, push, deploy, run migrations, or change production/account state from
that branch. Do not bypass `scripts\check-active-branch.mjs`. A branch-status
change requires Louis's explicit approval and must update the config, branch
register, GitHub default branch, and Vercel production branch together.

The old `C:\Users\louis\sparkle-suite` folder and old branches/deployments are
historical evidence only. Never build, restore, deploy, or move an alias from
them merely because they are available in session history.

Before any production deploy, rollback, promotion, or domain-alias change:

1. Read the four current `vault\` memory files.
2. Report and verify the absolute repo path, GitHub remote, current branch,
   exact HEAD commit, intended Vercel project, intended deployment, and every
   alias/domain that will move.
3. Inspect Git and Vercel history first. If Louis asks to restore a previous
   version, restore the known-good Git commit/deployment; do not rebuild the
   page from memory.
4. Preserve the currently served deployment URL and the suspected bad
   deployment URL for inspection before changing aliases.
5. Deploy the exact verified branch tip, then confirm the target aliases point
   to that exact deployment.
6. Smoke the exact live domain Louis uses, including landing-page stability,
   sign-in, post-auth destination, workspace identity, and representative
   customer-facing routes. A root-page HTTP 200 is not sufficient.

Louis's Google-auth account `louis@neonrabbit.net` is the original Sparkle Suite
admin/demo workspace, not a disposable signup or prospective customer. Its
production invariant is: rep status `active`, setup status
`dashboard_unlocked`, and a `$0`, non-live internal demo entitlement. It must
land in the Sparkle Suite Workspace and must never be sent to Stripe checkout.
Use `louis+sparkle-demo-2@neonrabbit.net` or the supported synthetic reviewer
flow for disposable signup/checkout testing.

If an existing admin, demo, beta, or customer account unexpectedly resolves to
`checkout_required`, stop before creating or opening a live checkout. Inspect
the rep, setup-session, entitlement/subscription, and pricing-reservation rows
together. Repair production data only with an exact identity guard, preserve an
audit note, release accidental pricing reservations, and use non-live `$0`
internal entitlements where that is the established account contract. Never
delete or mutate live Stripe provider objects merely to hide evidence.

Do not use voice mode for Sparkle Suite repo, deployment, authentication,
billing, or production-data work until Louis explicitly re-enables it. If voice
is re-enabled later, the session must still begin with the provenance preflight
above; a conversational reference to an old session is not authority to select
an old repo, branch, or deployment.

## Customer-Facing Flow Definition of Done

Any customer-facing Sparkle Suite workflow is not ready for Louis review until
it has a reviewer smoke path.

Required for signup, checkout, onboarding, customer-site, Nic-Nac, Live queue,
Trade board, email, SMS, and dashboard workflows:

- The exact live path on `https://www.yoursparklesuite.com` after release, or
  an explicit local URL only when Louis requested local-only work.
- Safe reviewer/test data so Louis does not need to use personal information.
- No live charges and no live customer/provider side effects.
- A reset or reseed path for repeated testing.
- Clear visual labeling when review/test mode is active.
- Documented click-through steps from the first page to the final expected
  state.
- Tests proving review mode is disabled in production.

If a reviewer smoke path cannot be provided, state the exact blocker before
calling the work ready.
