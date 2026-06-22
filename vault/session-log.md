# Sparkle Finder Session Log

## 2026-06-22

- Added the Sparkle Suite Secret Rep ID claim path for Finder accounts. The account page now shows a `Claim your BP Rep badge` panel for authenticated non-rep users and a linked status panel after claim.
- Added `lib/sparkle-finder/rep-claim.ts`, which verifies the private Secret Rep ID Number against Suite's internal `/api/internal/finder/rep-claim` endpoint using `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN`, then writes the proven rep link and `silver_rep_included` membership with Finder's service-role client.
- Added a Supabase migration for persisted claim metadata on `sparkle_finder_profiles`: business name, public site slug, and claim timestamp.
- Finder account mapping now treats persisted live Suite rep claims as active Rep Silver even when the rep is not in local fixture data.
- Finder Nic-Nac now treats private rep entitlements as linked Suite rep context, so linked reps get shared memory/context without exposing Suite mutation tools from Finder.
- Added `.env.example` documentation for `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN`.
- Verification passed: focused claim/account/Nic-Nac/account-page tests, full Finder Vitest suite, and Finder production build.
- Deployment follow-up: apply the new Finder Supabase migration and configure the Suite claim token before deployed claim smoke.

- Added Finder Nic-Nac mission guardrails. Clear off-mission requests such as therapy, grocery lists, homework/content drafting, travel planning, medical/legal/financial advice, and general-chatbot use now receive a static Nic-Nac redirect stream before OpenAI configuration, Supabase memory setup, tool setup, or model streaming.
- The mission guard checks explicit off-mission patterns before broad Sparkle/BP/Finder allow words, so mixed prompts like "therapist for rep burnout" and "grocery list for live show snacks" are still redirected.
- Redirect streams use generated assistant message ids.
- Mission-guard verification passed: focused Finder guard/route tests, full Finder Vitest suite, production build, missing-key route smoke, off-mission route smoke with `OPENAI_API_KEY` empty, and broader Finder local smoke.
- Moved Finder `/api/finder/nic-nac` off hardcoded Anthropic Haiku and onto an OpenAI-only Nic-Nac model policy adapter using `human_default`.
- Added Finder-local `lib/nic-nac/core/model-policy.ts` and `lib/nic-nac/core/model-provider.ts` so route files select policies instead of raw provider/model strings.
- Replaced `@ai-sdk/anthropic` with `@ai-sdk/openai` in Finder dependencies.
- Added route tests proving authenticated Silver Finder Nic-Nac streams through the OpenAI policy, passes OpenAI reasoning provider options, and keeps Anthropic/Haiku out of route/package config.
- Added `.env.example` placeholders for `OPENAI_API_KEY` and Nic-Nac model overrides.
- Added linked-rep Finder surface context to the Nic-Nac prompt. When a Finder account is linked to a Sparkle Suite rep, Nic-Nac is told to behave as the same assistant while limiting current-surface actions to Finder and directing Sparkle Suite mutations back to Sparkle Suite.
- Added automatic safe Finder customer-memory preload in the Finder Nic-Nac route so safe memory summaries appear in the system prompt without requiring a model tool call; unsafe memory is filtered before prompt assembly.
- Verification passed: focused Finder Nic-Nac route test, related Finder account/entitlement tests, full Finder Vitest suite, and production `next build`.
- Deployment blocker found: linked Vercel project `sparkle-finder-dev` does not currently list `OPENAI_API_KEY`, so deployed Silver Nic-Nac model streaming needs that secret before runtime-ready smoke.

## 2026-06-20

- Folded the old Sparkle Finder binder/Open Brain files into the active implementation repo.
- Preserved durable binder docs, plans, handoffs, and top-level Markdown notes in repo-local `docs/`.
- Added repo-local vault memory files so future Codex sessions can start from the implementation repo without needing the old binder.
- Redirected future workspace expectations to `C:\Users\louis\sparkle-finder-repo`.
