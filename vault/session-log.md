# Sparkle Finder Session Log

## 2026-06-22

- Added Finder Nic-Nac durable conversation/run telemetry in code:
  - Added migration `20260622173000_finder_nic_nac_conversation_telemetry.sql` for `sparkle_finder_nic_nac_conversations`, `sparkle_finder_nic_nac_messages`, and `sparkle_finder_nic_nac_runs`, with owner-readable RLS and service-role writes.
  - Added fail-open route persistence for `/api/finder/nic-nac`: mission redirects write zero-token `redirected` rows, model-backed streams write `started` rows and complete/fail rows with model policy, tool intents, memory counts, token usage, latency, and optional env-based cost estimates.
  - Added `scripts/smoke-finder-linked-runtime.ts` plus `npm run smoke:finder-linked-runtime` to create a temporary confirmed Finder user, sign in through the deployed site with Playwright, claim a Secret Rep ID, verify Finder DB rows, call linked Nic-Nac, verify telemetry, and clean up.
  - Verification passed locally: full Finder Vitest suite (`36` files, `470` tests) and production `next build`.
  - Remote migration/deployed smoke not yet run from this terminal because the Finder repo has no `supabase/config.toml`, `SUPABASE_ACCESS_TOKEN` is missing, and no DB URL env is available.

- Deployed and smoked Secret Rep ID claiming plus linked Finder Nic-Nac runtime:
  - Applied Finder migration `20260622144600_finder_rep_claim_profile_metadata.sql` to the remote Sparkle Finder Supabase project and verified the claim metadata columns/comments.
  - Configured shared sensitive `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN` in Suite and Finder Vercel production/preview.
  - Refreshed Finder Vercel production/preview Supabase runtime envs from the dedicated Finder Supabase project, including the server-only `SUPABASE_SERVICE_ROLE_KEY`.
  - Deployed Suite production `dpl_6LUJB79BHeYsfMWLSUtEsRqWUMbY` and moved `https://sparkle-suite-demo.vercel.app` to that deployment.
  - Deployed Finder production `dpl_6FAPcdx2SgZoxGhmdw4UuYx2Eyfc`, aliased at `https://sparkle-finder-dev.vercel.app`.
  - Found and fixed a deployed save-path bug: `service_role` lacked table grants on `sparkle_finder_profiles` and `sparkle_finder_memberships`. Added/applied migration `20260622155712_finder_rep_claim_service_role_grants.sql`.
  - Deployed browser claim smoke passed: temporary confirmed Finder auth user signed in, submitted a real eligible Secret Rep ID through the account form, saw `Rep badge linked`, verified `is_rep`, `sparkle_suite_rep_id`, claim timestamp, and `silver_rep_included` membership in Supabase, then cleaned up the temporary user and rows.
  - Deployed linked-rep Nic-Nac smoke passed: temporary linked rep account called `/api/finder/nic-nac`, received HTTP `200`, streamed 14,245 bytes through OpenAI, and hit zero hard-fail phrases. Temporary user and rows were cleaned up.

- Configured Finder Vercel OpenAI runtime:
  - Added `OPENAI_API_KEY` to `sparkle-finder-dev` production and preview as sensitive Vercel env vars.
  - Intentionally removed the development `OPENAI_API_KEY` after Vercel created it as non-sensitive; local dev should use local env files instead of a readable Vercel development secret.
  - Added explicit Nic-Nac model env vars across Finder production, preview, and development: `NIC_NAC_HUMAN_DEFAULT_MODEL=gpt-5.4`, `NIC_NAC_HUMAN_ESCALATED_MODEL=gpt-5.5`, `NIC_NAC_UTILITY_MODEL=gpt-5.4-mini`, and `NIC_NAC_LAB_SYNTHESIS_MODEL=gpt-5.5`.
  - Deployed Finder production after env setup. Deployment `dpl_78tx9hjdTZfAqkLADLJUZEnraGZH` is ready and aliased to `https://sparkle-finder-dev.vercel.app`.
  - Direct OpenAI Responses API check passed for `gpt-5.4` with medium reasoning and `gpt-5.4-mini` with low reasoning.
  - Superseded by later deployed linked-rep Nic-Nac smoke with a real authenticated temporary Finder account.

- Added the Sparkle Suite Secret Rep ID claim path for Finder accounts. The account page now shows a `Claim your BP Rep badge` panel for authenticated non-rep users and a linked status panel after claim.
- Added `lib/sparkle-finder/rep-claim.ts`, which verifies the private Secret Rep ID Number against Suite's internal `/api/internal/finder/rep-claim` endpoint using `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN`, then writes the proven rep link and `silver_rep_included` membership with Finder's service-role client.
- Added a Supabase migration for persisted claim metadata on `sparkle_finder_profiles`: business name, public site slug, and claim timestamp.
- Finder account mapping now treats persisted live Suite rep claims as active Rep Silver even when the rep is not in local fixture data.
- Finder Nic-Nac now treats private rep entitlements as linked Suite rep context, so linked reps get shared memory/context without exposing Suite mutation tools from Finder.
- Added `.env.example` documentation for `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN`.
- Verification passed: focused claim/account/Nic-Nac/account-page tests, full Finder Vitest suite, and Finder production build.
- Deployment follow-up completed later the same day: migration applied, claim token configured, production deployed, and deployed claim smoke passed.

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
