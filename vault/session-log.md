# Sparkle Finder Session Log

## 2026-07-03

- Added the simple customer-facing Reps main tab:
  - Added `Reps` to the primary Sparkle Finder app navigation and created `/reps` as a signed-in hub route.
  - Built a mobile-first Reps directory with search, status chips, small profile/avatar treatment, state badges, next-show timing, View Rep links, Board links when a board URL is available, and existing favorite-rep controls.
  - Added a Sparkle Suite public Finder API adapter for `/api/public/finder/reps?limit=200`, with preview/test fixture fallback and mapping into existing Finder rep, live-show, and board-link models.
  - Revalidated `/reps` after favorite/unfavorite actions so the new tab stays in sync with favorite reps.
  - Fixed `CustomerShowTime` browser hydration by replacing the invalid `Intl.DateTimeFormat` `dateStyle`/`timeStyle` plus `timeZoneName` combination with explicit date/time fields.
  - Verification passed: focused Reps route tests, focused catalog-service adapter tests, `npm run lint`, full `npm run test` (`38` files, `512` tests), `npm run build`, and `npm run smoke:sparkle-finder` (`18` passed, `2` optional API checks skipped), including desktop/mobile Reps screenshots.

- Implemented the mobile-first Sparkle Finder homepage overhaul:
  - Replaced the signed-in command-center opening with a simple app home built around `Find the pieces you love. Build your collection with Sparkle Finder.`
  - Simplified primary app navigation to `Home`, `Library`, `Find`, and account status while keeping advanced feature routes reachable from the guided `Find a Piece` panel.
  - Moved live shows, rep boards, favorite reps, collectors, Photo Setup, missing-piece flow, and Nic-Nac help into contextual find paths without removing backend plumbing or feature routes.
  - Applied the Sparkle Suite Amethyst customer-site direction through shared theme tokens, app nav/footer surfaces, CTAs, Nic-Nac accents, and the authenticated homepage collection layer.
  - Preserved collection stats, Bling Vault lazy loading, Wishlist and owned-item persistence, the Nic-Nac `FindThisForMe` helper, customer profile/TikTok details, and route/account gating behavior.
  - Added the active Silver missing-piece anchor to the Nic-Nac curator workspace so `/silver#showcase-studio` lands on the current missing-piece helper area.
  - Removed the old `FinderCommandCenter` component after replacing its capabilities with `SimpleFinderHome` and `FindPiecePanel`.
  - Stabilized the growing Next route test suite by raising Vitest's default test timeout to `20_000` ms; the affected tests were timing out during full-suite transforms while passing in isolation.
  - Verification passed: `npm run lint`, `npm exec vitest run tests/sparkle-finder/routes.test.ts`, plain `npm run test` (`38` files, `508` tests), `npm run build`, `npm run smoke:sparkle-finder` (`17` passed, `2` optional API checks skipped), direct homepage smoke earlier in the final pass (`11` passed, `2` skipped), authenticated 390/430/768/1440 viewport screenshots, and route pressure checks for 11 Silver-preview routes plus 7 anonymous gates.

- Updated the homepage collector profile statistics:
  - Replaced the weak `Featured` and `Saved` homepage stats with `Diamonds`, `Unicorns`, and `Found by Sparkle Finder`, while keeping `Owned` and `Wishlist`.
  - Added durable collection acquisition tracking on `sparkle_finder_collection_items` with `acquisition_source`, `acquisition_context`, and `acquisition_marked_at`.
  - Finder-assisted finds count only owned collection items whose source is `sparkle_finder_lead` or `nic_nac_request`; Wishlist saves default to `wishlist`, and normal owned saves default to `manual`.
  - Wired acquisition source through collection persistence, Silver collection actions, Nic-Nac collection save/read tools, authenticated homepage Bling Vault data, fixtures, and tests.
  - Applied migration `20260702235634_collection_acquisition_source.sql` to the linked `sparkle-finder-auth` Supabase project (`pzksocboqauqjdtsgpdp`) using `supabase db query --linked --file ...`, then verified the new columns and index remotely. Plain `supabase db push` still hits the existing historical migration-history mismatch and tries to replay older migrations.
  - Verification passed: `npm run lint`, focused profile/acquisition tests (`133` tests), full `npm run test` (`38` files, `507` tests), local `npm run build`, and `npm run smoke:sparkle-finder` (`17` passed, `2` skipped).
  - Committed and pushed `786df5f feat: update collector profile stats`.
  - Deployed Finder production `dpl_GX6Dzj8DAM61ERf59JHbFTRwUKcf`, aliased at `https://sparkle-finder-dev.vercel.app`; Vercel inspect shows `READY`, and live checks returned `200` for `/`, `/library`, and `/auth/sign-in`.

- Cleaned up Sparkle Finder Supabase migration history:
  - The live `supabase_migrations.schema_migrations` table was empty even though several early migrations were already reflected in the database, which caused `supabase db push` to replay old SQL.
  - Verified live artifacts, repaired already-present migrations as applied, then ran `supabase db push --yes --include-all` to apply the genuinely missing additive migrations for Showcase social collections, customer memory, social favorites/follows/blocks/reports, block-boundary policies, and rep-claim profile/grant metadata.
  - Normalized the old short local migration filename from `20260613_sparkle_showcase_social_collections.sql` to `20260613000000_sparkle_showcase_social_collections.sql`, repaired the remote history row to match, and confirmed `supabase db push --yes` now reports `Remote database is up to date.`

## 2026-06-22

- Cleaned Finder lint health:
  - Replaced the local-time `setState`-inside-effect patterns in `components/live/CustomerShowTime.tsx` and `components/nic-nac/FinderNicNacChatbot.tsx` with a shared hydration-safe `useClientFormattedTime` hook based on `useSyncExternalStore`.
  - Cleared the remaining lint warnings by documenting the intentional direct catalog `<img>` fallback, removing dead Showcase preview state, avoiding a JSX `satisfies` expression that upset the JSX lint utility, and removing unused test/script parameters.
  - Verification passed: `npm run lint` is quiet, `npx eslint . --max-warnings=0` is quiet, full Finder Vitest suite passes (`37` files, `488` tests), and production `next build` passes locally and in Vercel.
  - Deployed Finder production `dpl_2ysBkLzjEXBUSzas94nmbMpA3i5s`, aliased at `https://sparkle-finder-dev.vercel.app`, and confirmed Vercel inspect shows `READY` with the stable alias attached.
  - Live public checks passed for `/`, `/library`, and `/auth/sign-in`; the secured internal telemetry smoke route returned `401` without a bearer token as expected.

- Added Finder Nic-Nac owner save/mutation tools:
  - Added `save_my_collection_item`, an explicit owner-scoped collection/Wishlist save tool backed by existing Sparkle Finder persistence. It trims and verifies the catalog item with fixture fallback disabled before saving, writes using the signed-in customer id, supports owned/wishlist/private-note states, highlight flags, notes, and optional Showcase Collection assignment, and returns a `saved` result only after persistence succeeds.
  - Added `save_my_showcase_piece`, an explicit owner-scoped Showcase piece save tool backed by existing Showcase persistence. It verifies the catalog item before saving and supports Showcase status, public/private piece visibility, reveal story, note, and rarest-reveal flag.
  - Added `update_my_profile`, an explicit profile text/visibility save tool backed by existing profile persistence. It preserves unspecified display name, bio, TikTok handle, and visibility from current account context and keeps profile photo changes in the account upload flow.
  - Wired the new save tools through Finder intent policy, route active tool exposure, route telemetry, and prompt-visible active tool names.
  - Verification passed: failing tests were added first, focused Finder Nic-Nac tools/policy/curator/route tests now pass (`44` tests), full Finder Vitest suite passes (`37` files, `488` tests), and production `next build` passes locally and in Vercel.
  - Deployed Finder production `dpl_2ykVW81bq6FhEzoNAyad8nQDDhHP`, aliased at `https://sparkle-finder-dev.vercel.app`, and confirmed Vercel inspect shows `READY` with the stable alias attached.
  - Live public checks passed for `/`, `/library`, and `/auth/sign-in`; the secured internal telemetry smoke route returned `401` without a bearer token as expected.
  - `npm run lint` still fails on pre-existing unrelated React hook lint errors in `components/live/CustomerShowTime.tsx` and `components/nic-nac/FinderNicNacChatbot.tsx`, plus warnings.
  - Remaining follow-up: full Studio file-intake workflow exposure through app-owned uploaded file state, attorney/final policy review, broader marketing/onboarding positioning, and eventually an authenticated deployed Nic-Nac save smoke when local smoke credentials are available.

- Added Finder Nic-Nac collection/Showcase/Studio/profile read-status parity:
  - Added `list_customer_collection`, a bounded owner-scoped collection read tool that reads persisted `sparkle_finder_collection_items`, enriches rows with catalog context, and returns state counts, note presence, visibility, Showcase status, rarest-reveal flags, and reveal-story presence.
  - Added `summarize_my_showcase`, a bounded owner-scoped Showcase readiness tool that reads public/private piece counts, rarest reveal count, reveal-story count, and Showcase collection summaries.
  - Added `get_showcase_studio_requirements`, a non-mutating Studio readiness tool that reports required photo roles, max photo size, and whether the Suite intake endpoint appears configured without submitting missing-piece intake from chat.
  - Added `read_my_profile_status`, a current-account profile status tool that reports tier, membership state, visibility, bio/TikTok/photo presence, and linked Suite rep identity when present.
  - Wired these tool names through Finder intent policy, `/api/finder/nic-nac` active tool exposure, current account context, and route telemetry.
  - Verification passed: focused Finder Nic-Nac tools/policy/curator/route tests (`39` tests), full Finder Vitest suite (`37` files, `483` tests), and production `next build`.
  - Deployed Finder production `dpl_9rdCEsULSz7DUEFFw59aJBbKARfM`, aliased at `https://sparkle-finder-dev.vercel.app`, and confirmed Vercel inspect shows `READY` with the stable alias attached.
  - Live public checks passed for `/`, `/library`, and `/auth/sign-in`; the secured internal telemetry smoke route returned `401` without a bearer token as expected.
  - `npm run lint` still fails on pre-existing unrelated React hook lint errors in `components/live/CustomerShowTime.tsx` and `components/nic-nac/FinderNicNacChatbot.tsx`, plus warnings.
  - Deployed authenticated Nic-Nac chat smoke still needs a local/available authenticated smoke credential path; the stable alias and unauthenticated protection checks are verified.

- Added Finder Nic-Nac availability/live-show tool parity:
  - Added `find_rep_board_availability`, a bounded read-only tool backed by the existing Sparkle Suite public Finder availability API service. It returns requested item context, exact leads first, same collection/type fallback leads second, public customer-site links, listing photo context, and next-show timing without mutating Sparkle Suite Trade Boards.
  - Added `list_upcoming_live_shows`, a bounded read-only tool backed by the existing Sparkle Suite public Finder live-shows API service. It returns public show id, show name, rep first name, start time, status, and customer-site link for timing/discovery only.
  - Wired the `availability` intent through tool policy, active tool names, route prompt exposure, and telemetry so “who has this / next show” Finder turns can use real discovery tools while Suite workspace mutation requests remain blocked on the Finder surface.
  - Verification passed: focused Finder Nic-Nac tools/policy/curator/route tests, full Finder Vitest suite (`37` files, `476` tests), and production `next build`.
  - Deployed Finder production `dpl_Bj2YRSp9evCtTEzmR2iD7hmybUHu`, aliased at `https://sparkle-finder-dev.vercel.app`, and confirmed Vercel inspect shows `READY` with the stable alias attached.
  - Live public checks passed for `/`, `/library`, and `/auth/sign-in`; the secured internal telemetry smoke route returned `401` without a bearer token as expected.
  - Deployed authenticated Nic-Nac chat smoke was blocked because production preview auth did not issue a cookie and `SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN` is not available in this terminal. A real authenticated smoke or secured telemetry smoke still needs Louis-provided/local smoke credentials.

- Added baseline Nic-Nac AI and memory disclosures:
  - Updated Finder privacy policy and terms to disclose Nic-Nac AI assistance, memory, telemetry/tool context, linked-rep context, possible bounded Suite/Finder memory sharing for linked reps, operator/Lab review for support and quality, model/service-provider processing, sensitive-info caution, surface-gated tool access, output review responsibility, and off-mission/excessive-use limits.
  - Updated Finder signup and account privacy acknowledgment copy so Silver users see that Nic-Nac AI assistance and memory may use account, collection, Showcase, Wishlist, request, linked-rep, conversation, and saved memory details to provide Finder/Silver support.
  - Verification passed: focused Finder route/legal tests, full Finder Vitest suite (`37` files, `472` tests), and production `next build`.
  - Deployed Finder production `dpl_7Ao34Wu45BvhCmyCeXDWjn6T4NTE`, aliased at `https://sparkle-finder-dev.vercel.app`, and live-checked `/auth/sign-up`, `/privacy-policy`, and `/terms-and-conditions` for the new disclosure text.
  - Remaining launch-readiness caveat: this is a product disclosure baseline, not attorney-approved legal advice. Attorney/final policy review and broader marketing/onboarding positioning remain.

- Added the secured Finder Nic-Nac telemetry runtime smoke:
  - Added token-gated internal route `/api/internal/finder/nic-nac-telemetry-smoke` and script `npm run smoke:finder-telemetry-runtime`.
  - The smoke uses Vercel production server-side secrets, creates a temporary confirmed Finder auth user, exercises the actual telemetry persistence helpers for a mission redirect and completed run, verifies conversations/messages/runs, and cleans up telemetry rows plus the auth user.
  - Rotated `SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN` in Vercel Production as a sensitive env var, deployed Finder production `dpl_8tjDSHhUZ2cfvrJtQM61yAXAtNZa`, and confirmed `https://sparkle-finder-dev.vercel.app` points at that deployment.
  - Deployed runtime smoke passed with row counts `{"conversations":2,"messages":4,"runs":2}`, checks `completedRun`, `conversations`, `messages`, and `redirectedRun` all true, cleanup `ok:true`, and residual counts at zero.
  - Protection check passed: the internal smoke route returns `401` without the bearer token.
  - Verification passed after cleanup hardening: focused smoke route/script tests, full Finder Vitest suite (`37` files, `472` tests), and production `next build`.

- Added Finder Nic-Nac durable conversation/run telemetry in code:
  - Added migration `20260622173000_finder_nic_nac_conversation_telemetry.sql` for `sparkle_finder_nic_nac_conversations`, `sparkle_finder_nic_nac_messages`, and `sparkle_finder_nic_nac_runs`, with owner-readable RLS and service-role writes.
  - Added fail-open route persistence for `/api/finder/nic-nac`: mission redirects write zero-token `redirected` rows, model-backed streams write `started` rows and complete/fail rows with model policy, tool intents, memory counts, token usage, latency, and optional env-based cost estimates.
  - Added `scripts/smoke-finder-linked-runtime.ts` plus `npm run smoke:finder-linked-runtime` to create a temporary confirmed Finder user, sign in through the deployed site with Playwright, claim a Secret Rep ID, verify Finder DB rows, call linked Nic-Nac, verify telemetry, and clean up.
  - Verification passed locally: full Finder Vitest suite (`36` files, `470` tests) and production `next build`.
  - Remote migration was applied manually through the Supabase Dashboard SQL editor in project `sparkle-finder-auth` (`pzksocboqauqjdtsgpdp`) after CLI auth/linking stayed blocked.
  - Supabase verification passed with all checks `true`: telemetry tables exist, RLS is enabled, authenticated users have select-only access, service-role has select/insert/update/delete, read-own policies exist, expected updated-at triggers exist, expected indexes exist, and no required columns are missing.
  - Deployed Finder production from commit `c7eaf2c` to `dpl_1Q9mZ7WG4eNFWnzhbG7Loco3PbDU` / `https://sparkle-finder-nx2hyh8l8-louis-2849s-projects.vercel.app`, aliased at `https://sparkle-finder-dev.vercel.app`.
  - Deployed linked-runtime smoke is still pending. `vercel env pull --environment=production` confirms the keys exist, but sensitive values such as `SUPABASE_SERVICE_ROLE_KEY`, `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN`, and `OPENAI_API_KEY` are pulled locally as empty strings, so `npm run smoke:finder-linked-runtime` cannot create/clean the temporary confirmed Finder user from this terminal.

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
