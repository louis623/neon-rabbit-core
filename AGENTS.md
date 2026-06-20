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
- `sparkle-suite-demo-smoke`
- `sparkle-nic-nac-agent-architecture`
- `sparkle-live-queue`

Use this repo for implementation, builds, tests, commits, pushes, deploys,
Supabase migrations, smoke tests, notes, memory, plans, handoffs, and skills.
The old `C:\Users\louis\sparkle-suite` folder is retained only as a redirect
and historical archive; do not depend on it for active instructions.

Do not touch Chrome Web Store settings or local Sparkle Suite Chrome extension
code. Treat live queue extension files as protected live-show material. Read
`LIVE_EXTENSION_SAFETY.md` before any live extension discussion or handoff.

For Sparkle Suite demo verification, Vercel alias checks, logged-in workspace
smoke tests, required setup checks, Help & Resources checks, or Nic-Nac UI
checks, use `sparkle-suite-demo-smoke` when available. Prefer the stable demo
URL `https://sparkle-suite-demo.vercel.app` and Chrome reviewer-smoke sessions
instead of Louis's personal account.

For Sparkle Suite demo deploys, the expected review/deploy target is the stable
alias `https://sparkle-suite-demo.vercel.app/`. A raw Vercel preview URL is not
enough for Louis to review unless he explicitly asks for a one-off preview.
After creating a Vercel preview, move/confirm the stable demo alias points to
the intended deployment before telling Louis the work is deployed.

## Customer-Facing Flow Definition of Done

Any customer-facing Sparkle Suite workflow is not ready for Louis review until
it has a reviewer smoke path.

Required for signup, checkout, onboarding, customer-site, Nic-Nac, Live queue,
Trade board, email, SMS, and dashboard workflows:

- A Vercel preview URL or explicit local URL.
- Safe reviewer/test data so Louis does not need to use personal information.
- No live charges and no live customer/provider side effects.
- A reset or reseed path for repeated testing.
- Clear visual labeling when review/test mode is active.
- Documented click-through steps from the first page to the final expected
  state.
- Tests proving review mode is disabled in production.

If a reviewer smoke path cannot be provided, state the exact blocker before
calling the work ready.
