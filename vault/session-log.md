# Sparkle Finder Session Log

## 2026-06-22

- Moved Finder `/api/finder/nic-nac` off hardcoded Anthropic Haiku and onto an OpenAI-only Nic-Nac model policy adapter using `human_default`.
- Added Finder-local `lib/nic-nac/core/model-policy.ts` and `lib/nic-nac/core/model-provider.ts` so route files select policies instead of raw provider/model strings.
- Replaced `@ai-sdk/anthropic` with `@ai-sdk/openai` in Finder dependencies.
- Added route tests proving authenticated Silver Finder Nic-Nac streams through the OpenAI policy, passes OpenAI reasoning provider options, and keeps Anthropic/Haiku out of route/package config.
- Added `.env.example` placeholders for `OPENAI_API_KEY` and Nic-Nac model overrides.
- Added linked-rep Finder surface context to the Nic-Nac prompt. When a Finder account is linked to a Sparkle Suite rep, Nic-Nac is told to behave as the same assistant while limiting current-surface actions to Finder and directing Sparkle Suite mutations back to Sparkle Suite.
- Verification passed: focused Finder Nic-Nac route test, related Finder account/entitlement tests, full Finder Vitest suite, and production `next build`.
- Deployment blocker found: linked Vercel project `sparkle-finder-dev` does not currently list `OPENAI_API_KEY`, so deployed Silver Nic-Nac model streaming needs that secret before runtime-ready smoke.

## 2026-06-20

- Folded the old Sparkle Finder binder/Open Brain files into the active implementation repo.
- Preserved durable binder docs, plans, handoffs, and top-level Markdown notes in repo-local `docs/`.
- Added repo-local vault memory files so future Codex sessions can start from the implementation repo without needing the old binder.
- Redirected future workspace expectations to `C:\Users\louis\sparkle-finder-repo`.
