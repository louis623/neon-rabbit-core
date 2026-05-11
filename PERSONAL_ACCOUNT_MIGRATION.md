# Personal Account Migration Pack

Generated from the current `C:\Users\louis\neon-rabbit-core` session on 2026-05-03.

This file is meant to help recreate the working Codex setup on a new personal account with minimal re-prompting.

Important:
- This document is intentionally redacted.
- It captures structure, paths, rules, tools, and setup order.
- It does not include live secrets, tokens, API keys, or passwords.

## What Will Carry Over Automatically

If the new personal account is on the same machine, these local assets already exist:
- local repos and folders on disk
- repo instruction files like `AGENTS.md` and `CLAUDE.md`
- repo-local custom skills under `.agents/skills/`
- local code, snapshots, scripts, and env files already stored on disk

What is usually account-scoped and should be reconnected manually:
- Codex plugins/connectors
- MCP connections and auth headers/keys
- any saved approvals or account-level preferences
- any account-side memory or personalization

## Current Working Set

### Core repos and folders

- `C:\Users\louis\neon-rabbit-core`
  - main application repo
  - Supabase migrations
  - Edge Functions including `open-brain-mcp` and `nr-hq-mcp`
  - Chrome extension for Sparkle Suite Live Queue
- `C:\Users\louis\neon-rabbit-hq`
  - CEO dashboard / HQ app
  - Next.js 16 / React 19
  - live URL: `https://neon-rabbit-hq.vercel.app`
- `C:\Users\louis\vac-case-reference`
  - VA compensation reference site
  - password-gated, read-only
- `C:\Users\louis\rabbit-hole`
  - observed on disk during audit
- `C:\Users\louis\Downloads\Thumper_UI_Files`
  - read-only reference UI files mentioned in repo guidance

### Repo-level behavior to preserve

These rules repeat across the repos I inspected and should be treated as part of the setup:

- main branch only unless Louis explicitly asks otherwise
- do not create worktrees, temp repos, or extra branches automatically
- confirm before `git push` to `main`
- do not revert unrelated user changes
- use `feat`, `fix`, or `chore` commit prefixes
- `close session` is the correct desktop close-out phrase
- browser verification by Louis is the real definition of complete

### Framework warning that must stay active

Both `neon-rabbit-core` and `neon-rabbit-hq` include the same standing warning:

- This is not legacy Next.js behavior.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

## Plugins To Reconnect In Codex

These plugins were active in the current session and should be re-enabled on the personal account if available:

- Browser Use
- Build Web Apps
- CircleCI
- Cloudflare
- CodeRabbit
- Codex Security
- Documents
- GitHub
- Gmail
- Google Calendar
- Google Drive
- Hugging Face
- Presentations
- Spreadsheets
- Supabase
- Superpowers
- Vercel

## Custom Skills To Preserve

The most important custom project skills I found are repo-local and should remain available:

- `C:\Users\louis\neon-rabbit-core\.agents\skills\neon-rabbit-hq\SKILL.md`
- `C:\Users\louis\neon-rabbit-core\.agents\skills\sparkle-live-queue\SKILL.md`

Mirrored copies also exist in:

- `C:\Users\louis\neon-rabbit-core\.claude\skills\neon-rabbit-hq\SKILL.md`
- `C:\Users\louis\neon-rabbit-core\.claude\skills\sparkle-live-queue\SKILL.md`
- `C:\Users\louis\neon-rabbit-hq\.agents\`

Meaning:
- if the personal account is using Codex in these repos on the same machine, the repo-local skills should already be present
- if a tool or account setup expects global skills, mirror the repo-local skill files into the appropriate account-visible skill directory

## MCP / Connector Surface To Recreate

### Supabase project

- project name: `neon-rabbit-core`
- ref: `bqhzfkgkjyuhlsozpylf`
- region: `us-east-1`

### Active custom MCP endpoints

- Open Brain MCP
  - function name: `open-brain-mcp`
  - URL: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/open-brain-mcp`
- NR HQ MCP
  - function name: `nr-hq-mcp`
  - URL: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/nr-hq-mcp`

Observed behavior:
- these functions use secret-gated access
- the auth pattern references an `x-brain-key` or equivalent key-based gate
- do not hardcode secrets into prompts or shared docs
- source the actual keys from secure storage or the existing connector configuration

Operational note:
- after MCP tool-surface changes, the connector may need a disconnect/reconnect refresh to pick up the new tool list

## Environment Variables To Port

Do not copy values into this file. Only ensure the new account still has access to the existing local env files or secure secret source.

### `neon-rabbit-core`

From `.env.example`, `CODEBASE_SNAPSHOT.md`, and repo guidance:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `MCP_ACCESS_KEY`
- `MCP_ACCESS_KEY_MARCH`
- `OPENROUTER_API_KEY`
- `LIVE_QUEUE_SYNC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_QUARTERLY`
- `STRIPE_PRICE_ANNUAL`
- `NEXT_PUBLIC_APP_URL`

### `neon-rabbit-hq`

From `CLAUDE.md`, `CODEBASE_SNAPSHOT.md`, and local env usage:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `STRIPE_SECRET_KEY`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV`
- `NEXT_PUBLIC_PLAID_ENV`
- `SYNC_SECRET`
- `OWNER_UUID`

### `vac-case-reference`

From `.env.local.example` and `AGENTS.md`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_VAC_READER_EMAIL`
- `SUPABASE_VAC_READER_PASSWORD`
- `SITE_PASSWORD`
- `COOKIE_SECRET`

## Repo-Specific Notes Worth Re-Telling The New Account

### `neon-rabbit-core`

- linked Vercel project observed in `.vercel/project.json`: `sparkle-suite`
- test commands:
  - `npm test`
  - `npm run test:attack5`
- important files:
  - system prompt: `lib/thumper/system-prompt.ts`
  - shared Thumper libs: `lib/thumper/auth.ts`, `lib/thumper/persistence.ts`, `lib/thumper/tools/*`
  - trade board service: `lib/services/trade-board.ts`
  - active Edge Functions: `supabase/functions/open-brain-mcp/`, `supabase/functions/nr-hq-mcp/`
- `CODEBASE_SNAPSHOT.md` is treated as a hand-maintained orientation file and should be updated after major work

### `neon-rabbit-hq`

- single-user internal dashboard for Louis Chapman
- desktop-first, TV-ready, dark mode only
- stack: Next.js 16.2, React 19, TypeScript, Tailwind v4, Supabase, Vercel
- important UI conventions:
  - `NRCard`
  - pill selectors
  - click-to-copy affordances
  - no mobile-first work
  - no light mode
  - `useState` for tab state instead of URL-state machinery

### `vac-case-reference`

- password-gated, read-only reference site
- writes do not belong here; schema changes belong in `neon-rabbit-core`
- app root is `src/app`
- protected route group is `src/app/(gated)`
- server-only Supabase helper is `src/lib/supabase-server.ts`
- route truth matters; for example `/errors` is correct, not `/va-errors`

## Safe Migration Order

1. Sign into the personal account in Codex on the same machine.
2. Re-enable the plugins/connectors listed above.
3. Reconnect the custom MCP endpoints using the same URLs and secure keys.
4. Open these repos at least once in Codex:
   - `C:\Users\louis\neon-rabbit-core`
   - `C:\Users\louis\neon-rabbit-hq`
   - `C:\Users\louis\vac-case-reference`
5. Confirm Codex can see the repo-local instruction files:
   - `AGENTS.md`
   - `CLAUDE.md` where present
   - `.agents/skills/*`
6. Confirm local secret sources still exist:
   - `.env.local`
   - secure password manager / secret notes for MCP keys
7. Run one low-risk verification task per repo:
   - `neon-rabbit-core`: inspect `CODEBASE_SNAPSHOT.md` and report the active MCP endpoints
   - `neon-rabbit-hq`: summarize the top tabs and design rules
   - `vac-case-reference`: summarize gated routes and env requirements
8. Paste the bootstrap prompt below into a fresh chat on the new personal account.

## Bootstrap Prompt For The New Personal Account

Copy and paste this into the first serious Codex chat on the new personal account:

```md
You are working with Louis Chapman on the same Windows machine and should assume the local repos already exist.

Primary working set:
- `C:\Users\louis\neon-rabbit-core`
- `C:\Users\louis\neon-rabbit-hq`
- `C:\Users\louis\vac-case-reference`

Core standing rules:
- Main branch only unless Louis explicitly says otherwise.
- Do not create worktrees, extra branches, or temp repos automatically.
- Confirm before pushing to `main`.
- Do not revert unrelated local changes.
- "Complete" means Louis verifies in the browser, not just passing tests.
- If ending the session in Desktop, the phrase is `close session`.

Critical framework rule:
- This is not the older Next.js behavior you may remember.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

Project-specific context:
- `neon-rabbit-core` is the main app repo and includes Supabase migrations, Stripe work, shared Thumper code, and Edge Functions including `open-brain-mcp` and `nr-hq-mcp`.
- `neon-rabbit-hq` is Louis's dark-mode-only, desktop-first CEO dashboard. Favor simple state, especially `useState` for tabs. Preserve the existing design language: `NRCard`, pill selectors, high contrast, no light mode, no unnecessary abstraction.
- `vac-case-reference` is a password-gated, read-only case reference site. It must never become a write path for Supabase. Schema changes belong in `neon-rabbit-core`.

Custom skills likely relevant in this workspace:
- `neon-rabbit-hq`
- `sparkle-live-queue`

Available custom MCPs to reconnect when needed:
- Open Brain MCP: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/open-brain-mcp`
- NR HQ MCP: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/nr-hq-mcp`

How to start:
1. Read the repo's `AGENTS.md` first.
2. Read `CLAUDE.md` if present.
3. Read `CODEBASE_SNAPSHOT.md` before making assumptions on large tasks.
4. For existing tables or MCP surfaces, inspect live reality before coding against memory.
5. Be concise, practical, and collaborative with Louis.

If anything conflicts, prefer the repo files over this prompt.
```

## What This Does Not Preserve

This pack helps preserve working context, but it does not itself migrate:

- account-side memory or personalization state
- plugin auth tokens
- MCP secrets
- CLI login state if the new account or app session requires re-auth
- any hidden prompt history not represented in repo files or the current local setup

## Recommended First Test On The New Account

Ask the new account to do this:

1. open `C:\Users\louis\neon-rabbit-core`
2. summarize `AGENTS.md`, `CLAUDE.md`, and the custom skills it finds
3. list the active MCP endpoints it can infer from the repo
4. explain the difference between `neon-rabbit-core`, `neon-rabbit-hq`, and `vac-case-reference`

If it answers that cleanly, the migration is close enough to productive.

## Notes For Louis

- I observed live secrets in local config and env surfaces during the audit, so keep this document redacted.
- If you want a truly exact clone, the next step is a second private checklist that maps each connector and secret source one-by-one without storing the secret values in the repo.
- If you want, I can generate that next as a separate local-only checklist.
