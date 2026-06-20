# Sparkle Finder Active Workspace

This repository is the active Sparkle Finder workspace.

Use this path for future Codex sessions:

`C:\Users\louis\sparkle-finder-repo`

This repo contains both the Sparkle Finder implementation code and the former binder/Open Brain project files. Code, docs, vault memory, plans, handoffs, and repo-local skills should all live under this workspace root so normal repo work stays inside the Codex workspace sandbox.

Do not start Sparkle Finder implementation work from the old lightweight binder at `C:\Users\louis\sparkle-finder`.

## Startup Memory

At the start of a Sparkle Finder session, read repo-local memory from:

- `vault/project-state.md`
- `vault/session-log.md`
- `vault/decisions.md`
- `vault/open-items.md`

Use repo-local skills from:

- `.agents/skills`

## Workspace Rules

1. Build, test, commit, push, and deploy from `C:\Users\louis\sparkle-finder-repo`.
2. Treat `C:\Users\louis\sparkle-finder` as an archived redirect folder only.
3. Keep durable project memory in `vault/` and durable plans, handoffs, decisions, and research in `docs/`.
4. Do not copy temp files, screenshots, logs, build output, smoke artifacts, `.tmp`, or `outputs` into durable memory.
5. Standing auth rule: each customer-facing product must have its own auth boundary by default. Do not share or repoint Sparkle Finder customer auth through Neon Rabbit HQ, Sparkle Suite, or another product unless Louis explicitly approves that architecture for the specific product. Shared product data APIs are acceptable; shared login redirects, OAuth fallback URLs, Site URLs, Google OAuth branding, and customer auth user pools require explicit review.

