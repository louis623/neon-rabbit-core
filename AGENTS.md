<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sparkle Suite Binder Bridge

This repo is the active Sparkle Suite implementation workbench. For future
Codex desktop sessions, start with this repo as the writable workspace so code
edits, tests, commits, pushes, deploys, and Supabase/Vercel operations do not
trigger binder-only permission prompts.

Before doing Sparkle Suite work, read the binder instructions and current
project memory from:

- `C:\Users\louis\sparkle-suite\AGENTS.md`
- `C:\Users\louis\sparkle-suite\vault\project-state.md`
- `C:\Users\louis\sparkle-suite\vault\session-log.md`
- `C:\Users\louis\sparkle-suite\vault\decisions.md`
- `C:\Users\louis\sparkle-suite\vault\open-items.md`

Use the binder only for notes, memory, plans, handoffs, and skills. Use this
repo for implementation, builds, tests, commits, pushes, deploys, Supabase
migrations, and smoke tests.

Do not touch Chrome Web Store settings or local Sparkle Suite Chrome extension
code. Treat live queue extension files as protected live-show material.

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
