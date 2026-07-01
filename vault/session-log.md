# Session Log

Running log of significant work sessions. Most recent first.

---

## July 1, 2026 - BlingKitchen Recipe Images Moved Off Readdy and Recipe Builder Simplified

**What changed:**
- Louis clarified Heather's recipe workspace must not depend on Ready/Readdy image URLs because that source will be temporary.
- Updated the Recipes workspace builder so the main flow is upload-first: title, category, prep time, servings, food photo uploads, recipe-card uploads, Nic-Nac draft, and save.
- Removed the editable raw image URL field from the main recipe image controls. Stored image URLs remain internal plumbing after upload.
- Added a visible category dropdown for Heather's Pantry categories instead of burying category in Advanced edit.
- Added `npm run migrate:bling-kitchen-recipe-images`, a repeatable migration script that finds Readdy/Ready-hosted BlingKitchen recipe images, copies them into Sparkle Supabase `public-site-media`, and updates only Heather's `public_site_recipes` rows.
- Ran the migration for Heather's live account: 26 recipes scanned, 33 recipe image fields migrated to Sparkle storage, 0 skipped.
- Replaced Readdy URLs in BlingKitchen static recipe seed/fallback data and copied/replaced 4 BlingKitchen profile/hero images into Sparkle storage.

**Verification:**
- Dry run before migration found 26 recipes / 33 image fields to migrate.
- Live migration completed successfully for rep `9a971c05-3631-443e-bcb8-4e9a26e15885`.
- Dry run after migration found 0 remaining Readdy/Ready recipe image fields in Heather's live `public_site_recipes`.
- Repo scan found no remaining Readdy/Ready URLs under `lib/bling-kitchen`, `scripts/seed-bling-kitchen-recipes.ts`, or the recipe workspace component.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts tests/nic-nac-site-recipes-route.test.ts tests/services/site-recipes.test.ts tests/bling-kitchen-recipes-db-loader.test.ts tests/bling-kitchen-public-site.test.ts` passed: 6 files, 104 tests.
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts` passed after the parallel build/test timeout rerun.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `abfbd40 fix: simplify Heather recipe images`.
- Vercel preview build passed at `https://sparkle-suite-coe8a6uio-louis-2849s-projects.vercel.app` / deployment `dpl_D3td3AsK1BhGLYStBkbZ9Tj4Xajx`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo health checks passed for `/api/prelaunch/health` and `/api/nic-nac/health`.
- Stable demo BlingKitchen Pantry template check returned `hasReaddy:false` and `supabaseCount:34`.

---

## July 1, 2026 - Heather Recipe Smoke Fix Deployed to Stable Demo

**What changed:**
- Deployed the latest `codex/sparkle-cross-phase-hardening` branch after Heather recipe smoke hardening and checklist cleanup.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to Vercel deployment `dpl_GFQ3pDozn9J9nE3dmP8MbpvbDara` / preview `https://sparkle-suite-ju9u16g38-louis-2849s-projects.vercel.app`.
- Latest pushed code checkpoint is `ab3ad0b chore: mark Heather recipe smoke complete`.

**Verification:**
- Vercel inspect confirmed the stable demo alias resolves to `dpl_GFQ3pDozn9J9nE3dmP8MbpvbDara` with status Ready.
- Stable demo `/api/prelaunch/health` returned `ok:true`, `service:"sparkle-suite-prelaunch"`, and `status:"ready"`.
- Stable demo `/api/nic-nac/health` returned `api_reachable:true`, `db_reachable:true`, and `recent_error_rate:0`.

---

## July 1, 2026 - OpenAI Recipe Replay Unblocked

**What changed:**
- Louis added OpenAI API credits, so the Heather image-first recipe flow could be tested with real OpenAI calls.
- `npm run smoke:nic-nac:recipe-chat -- --expect-model --output .local/launch-readiness-results/nic-nac-recipe-chat.json` passed against the stable demo reviewer-smoke account.
- The passing replay observed `build_site_recipe_draft` on the draft turn, waited for save approval, observed `manage_site_recipes` on the save turn, verified the saved recipe row included the fixture recipe-card facts and public display images, then cleaned up the smoke recipe row.
- `npm run report:launch-readiness -- --dashboard-nic-nac-report .local/launch-readiness-results/nic-nac-recipe-chat.json --json` now marks Dashboard / Nic-Nac as `covered` with `smokeProof.ok:true` and `stepCount:2`. The overall launch report remains not ready because unrelated Phase 11 journeys are still partial/missing.
- Fixed the direct recipe-builder smoke harness so its model probe uploads generated fixture images through `/api/nic-nac/site-recipes/image` before calling `/api/nic-nac/site-recipes/draft`. The previous data-URL shortcut was unrealistic because the production draft builder normalizes image URLs to normal URL lengths.

**Verification:**
- Initial `npm run smoke:nic-nac:recipe-builder -- --expect-model` reached stable demo but failed at the model probe because the old smoke harness sent oversized data URLs directly to the draft endpoint.
- After the harness fix, `npm run smoke:nic-nac:recipe-builder -- --expect-model` passed against the stable demo reviewer-smoke account.
- `npm run smoke:nic-nac:recipe-chat -- --expect-model --output .local/launch-readiness-results/nic-nac-recipe-chat.json` passed against the stable demo reviewer-smoke account.
- `npm run report:launch-readiness -- --dashboard-nic-nac-report .local/launch-readiness-results/nic-nac-recipe-chat.json --json` showed Dashboard / Nic-Nac covered from the passing artifact.
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts` passed after the harness update.

**Follow-up completed later July 1:**
- The exact Heather/BlingKitchen account public Pantry smoke passed after Louis allowed temporary runtime use of Heather's demo password. See `July 1, 2026 - Heather Recipe Nic-Nac Exact Smoke and Pantry Assertion Hardening` below.

## July 1, 2026 - Quota Artifact Readiness Guard

**What changed:**
- Ran the reviewer-safe stable-demo recipe smokes again while OpenAI billing remains blocked.
- Hardened launch readiness so `RecipeChatSmokeResult` artifacts only count as successful Dashboard / Nic-Nac proof when `status === 'passed'`.
- This prevents the provider-free `model_unavailable` recipe chat artifact from accidentally marking Dashboard / Nic-Nac as covered just because the smoke command exits cleanly without `--expect-model`.

**Verification:**
- `npm run smoke:nic-nac:recipe-builder` passed against `https://sparkle-suite-demo.vercel.app` using reviewer-smoke auth.
- `npm run smoke:nic-nac:recipe-chat -- --output .local/launch-readiness-results/nic-nac-recipe-chat-latest.json` first hit Windows sandbox `spawn EPERM`; rerun outside the sandbox reached stable demo and wrote the artifact with `status:"model_unavailable"` and the OpenAI `insufficient_quota` message.
- `npm run report:launch-readiness -- --dashboard-nic-nac-report .local/launch-readiness-results/nic-nac-recipe-chat-latest.json --json` first hit Windows sandbox `spawn EPERM`; rerun outside the sandbox correctly reported Dashboard / Nic-Nac as `partial`, `smokeProof.ok:false`, `stepCount:0`, with the quota message in `blockedItems`.
- `npm exec vitest run tests/launch-readiness-report-runner.test.ts tests/phase-11-smoke-manifest.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts` passed: 3 files, 19 tests.

**Remaining blocker:**
- Final launch-ready recipe proof still requires rerunning `npm run smoke:nic-nac:recipe-builder -- --expect-model` and `npm run smoke:nic-nac:recipe-chat -- --expect-model --output .local/launch-readiness-results/nic-nac-recipe-chat.json` after OpenAI quota/billing is fixed.

## July 1, 2026 - Dashboard/Nic-Nac Recipe Chat Readiness Artifact

**What changed:**
- Added Dashboard/Nic-Nac recipe chat smoke artifact support to the launch-readiness report runner.
- `npm run report:launch-readiness` now accepts `--dashboard-nic-nac-report <path>` and attaches the `npm run smoke:nic-nac:recipe-chat` JSON replay to the Dashboard / Nic-Nac journey.
- Recipe chat artifacts count `turns` as proof steps, so the expected draft/save replay reports two steps.
- Failed attached recipe chat artifacts now downgrade Dashboard / Nic-Nac to `partial` and carry the smoke failure message into `blockedItems`, preventing a false beta-readiness green light.
- Updated the Phase 11 manifest and open item with the post-quota command path for Heather's image-first recipe builder replay and readiness report attachment.

**Verification:**
- `npm exec vitest run tests/launch-readiness-report-runner.test.ts` passed: 9 tests.
- `npm exec vitest run tests/launch-readiness-report-runner.test.ts tests/phase-11-smoke-manifest.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts` passed: 3 files, 17 tests.
- `npm run smoke:nic-nac:recipe-tool-contract` first hit Windows sandbox `spawn EPERM`; rerun outside the sandbox passed: 4 files, 71 tests.
- `npm run build` passed locally with Next.js 16.2.1.

**Remaining blocker:**
- Final model-in-loop proof for Heather's image-first recipe flow is still waiting on the OpenAI quota/billing fix. After quota clears, run the `--expect-model` recipe builder and chat smokes, save the chat JSON, and attach it to launch readiness with `--dashboard-nic-nac-report`.

## July 1, 2026 - Recipe Chat Smoke Output Path

**What changed:**
- Added `--output <path>` / `--output=<path>` support to `scripts/smoke-nic-nac-recipe-chat.ts`.
- The recipe chat smoke now writes the full JSON result to a requested artifact path, creating parent directories as needed, while preserving the existing JSON stdout behavior.
- Updated the Phase 11 Dashboard/Nic-Nac next action and Open Items TODO to use `.local/launch-readiness-results/nic-nac-recipe-chat.json` or `.local/launch-readiness-results/bling-kitchen-recipe-chat.json` as direct post-quota replay artifact paths.

**Verification:**
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts tests/phase-11-smoke-manifest.test.ts tests/launch-readiness-report-runner.test.ts` passed: 3 files, 18 tests.
- `npm run build` passed locally with Next.js 16.2.1.

**Remaining blocker:**
- The final Heather/reviewer model replay still cannot be completed until OpenAI quota/billing is fixed.


## July 1, 2026 - Heather Image-First Recipe Chat Handoff

**What changed:**
- Hardened the BlingKitchen image-first recipe flow so Heather can give Nic-Nac a title, public food/display photos, and recipe-card photos without needing image URLs or a long manual form.
- Added `build_site_recipe_draft`, a Nic-Nac site tool that reads recent chat image uploads by 1-based photo order, uploads display photos as public recipe media, stages recipe-card photos as short-lived source URLs, and builds a draft without saving it.
- Recipe-card photos are explicitly source material for ingredients/steps, not public recipe images; only unreadable recipe cards or genuinely bad public display photos should block the flow.
- Site tool routing now keeps recipe tools active for photo-only recipe follow-ups, and successful `manage_site_recipes` saves now trigger workspace/site refresh events.
- Added deterministic `/api/nic-nac` route coverage proving recipe wording and photo-only recipe follow-ups expose `build_site_recipe_draft`, `list_site_recipes`, and `manage_site_recipes` to the model without needing a live OpenAI call.
- The OpenAI quota/billing blocker still gates final model-in-loop proof. The open item now explicitly calls for a real replay that observes `tool-build_site_recipe_draft` followed by `manage_site_recipes`.
- Added a provider-free local smoke command, `npm run smoke:nic-nac:recipe-tool-contract`, and tied the recipe chat-tool contract into the Phase 11 Dashboard / Nic-Nac smoke manifest.
- Added a post-quota full chat replay harness, `npm run smoke:nic-nac:recipe-chat`, that signs into reviewer-smoke or Heather's BlingKitchen account, posts real image parts to `/api/nic-nac`, observes `build_site_recipe_draft` then `manage_site_recipes`, verifies the saved recipe row contains the fixture card facts and public display images, checks Heather's public Pantry page when `--target=bling-kitchen` is used, and cleans up smoke recipes by default.
- Hardened the recipe chat replay harness so `manage_site_recipes` must be absent from the draft turn and present only on the save turn, saved recipe lookup requires the exact unique smoke title, cleanup deletes only the exact created recipe id/title, and `--target=bling-kitchen` returns a structured missing-env result when `BLING_KITCHEN_RECIPE_SMOKE_PASSWORD` is not supplied.
- Added the post-quota recipe chat replay harness to the Phase 11 Dashboard / Nic-Nac smoke manifest evidence and pinned the exact post-quota commands in the manifest next action.
- Fixed the workspace refresh follow-through: when Nic-Nac saves a Pantry recipe through chat, the open Recipes workspace reloads its recipe list and preserves the selected recipe when possible.

**Verification:**
- `npm exec vitest run tests/nic-nac/site-recipe-draft-tool.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac-workspace-refresh-events.test.ts tests/nic-nac-site-recipes-route.test.ts` passed: 4 files, 73 tests.
- `npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/site-recipe-draft-tool.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac-workspace-refresh-events.test.ts` passed: 4 files, 70 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `5892898 feat: add Nic-Nac recipe draft chat tool` to `origin/codex/sparkle-cross-phase-hardening`.
- Vercel preview build passed at `https://sparkle-suite-n60j59mvf-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that preview.
- Stable demo health checks passed for `/api/prelaunch/health` and `/api/nic-nac/health`.
- `npm run smoke:nic-nac:recipe-builder` passed against the stable demo with reviewer-smoke auth.
- `npm run smoke:nic-nac:recipe-builder -- --probe-model` passed against the stable demo by confirming the expected friendly `MODEL_UNAVAILABLE` response while OpenAI quota remains blocked.
- `npm run smoke:nic-nac:recipe-tool-contract` passed locally: 3 files, 65 tests.
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts tests/phase-11-smoke-manifest.test.ts` passed: 2 files, 6 tests.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-workspace-refresh-events.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts tests/phase-11-smoke-manifest.test.ts` passed: 4 files, 91 tests.
- `npm exec vitest run tests/nic-nac/nic-nac-calendar-route-routing-smoke.test.ts` passed after adding the `/api/nic-nac` recipe route cases: 1 file, 6 tests.
- `npm run smoke:nic-nac:recipe-tool-contract` passed with route coverage included: 4 files, 71 tests.
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts` passed: 1 file, 1 test.
- `npx tsx -e "import('./scripts/smoke-nic-nac-recipe-chat.ts').then((m)=>console.log(Object.keys(m.default ?? {}).join(','), typeof (m.default ?? {}).runRecipeChatSmoke))"` passed after rerunning outside the Windows sandbox; the first sandboxed attempt hit `spawn EPERM` while starting `tsx`/esbuild.
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts` passed after adding the callable provider-free env guard checks: 1 file, 2 tests.
- `npm run smoke:nic-nac:recipe-tool-contract` passed after the recipe chat replay harness hardening: 4 files, 71 tests.
- `npm exec vitest run tests/phase-11-smoke-manifest.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts` passed after wiring the recipe chat replay into the Phase 11 manifest: 2 files, 8 tests.
- `npm exec vitest run tests/launch-readiness-report-runner.test.ts` passed: 1 file, 8 tests.
- `npm run build` passed after the Recipes workspace refresh follow-through.
- Pushed `a0e3d9f fix: refresh recipes after Nic-Nac site saves`.
- Vercel preview build passed at `https://sparkle-suite-9j1hje02g-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that preview.
- Stable demo health checks passed again for `/api/prelaunch/health` and `/api/nic-nac/health`.
- Stable demo `npm run smoke:nic-nac:recipe-builder` passed again with reviewer-smoke auth.
- Stable demo `npm run smoke:nic-nac:recipe-builder -- --probe-model` passed again by confirming the friendly `MODEL_UNAVAILABLE` response while OpenAI quota remains blocked.

---

## July 1, 2026 - Open Brain and HQ Closeout for Optional Trade Approval Work

**What was captured:**
- Open Brain/vault memory now reflects the optional revealed item-number approval update, Nic-Nac busy-show guidance, and guarded shared catalog photo correction behavior.
- Headquarters was refreshed with a Sparkle Suite closeout handoff and current project-link/snapshot notes for the stable demo target.
- Project state now points to the final docs/memory checkpoint `12b6bcc docs: update Open Brain closeout memory`.

**Key decisions and lessons carried forward:**
- Trade approval item-number capture is preferred when available, but must never block a busy live show. Reps can approve now and add the revealed piece later with Nic-Nac.
- Nic-Nac should use `report_jewelry_catalog_issue` for routine shared jewelry catalog photo problems instead of saying the tool is unavailable.
- Canonical catalog photo replacement must stay guarded: approved jewelry-front asset only; never label/details, tag, back-of-card, or unapproved raw upload.
- Stable demo remains the normal Sparkle Suite review target: `https://sparkle-suite-demo.vercel.app`.

---

## June 29, 2026 - Nic-Nac Non-Item-Number Trade Board Listings

**What changed:**
- Louis and Codex finalized the V1 design for reps who have current/recent trade pieces but no item number/tag details: call them **non-item-number pieces** internally, do not label them differently to customers, and route creation only through Nic-Nac for now.
- Shipped `0d4e9fa feat: support non-item-number trade listings`.
- Added Supabase migrations:
  - `20260629150000_non_item_number_trade_listings.sql`
  - `20260629151000_trade_board_intake_non_item_number_mode.sql`
- `trade_listings.design_id` is now nullable only for `listing_source = 'non_item_number'`; catalog rows still require a design.
- Non-item-number listings store listing-local controlled fields: jewelry type, broad collection, exact collection when known, size when applicable, and managed photo URL.
- `rpc_approve_trade` now increments `jewelry_designs.times_traded` only when a listing has a design.
- Nic-Nac add-listing workflow now supports `catalogMode: item_number | non_item_number`, asks for `Collection Type and Size`, and writes through the dedicated non-item-number listing service without catalog design creation.
- Rep-facing surfaces can show `(non-item number piece)` for clarity; customer-facing Trade Board cards, request flow, tickers, and public APIs do not expose source labels.
- Sparkle Finder availability/count queries explicitly exclude non-item-number listings in V1.
- Added dedicated smoke/pressure harnesses:
  - `npm run smoke:nic-nac:trade-board-non-item-number`
  - `npm run pressure:non-item-number-trade-listings`

**Verification:**
- Focused regression matrix passed: 27 files, 369 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Full `npx tsc --noEmit --pretty false` still fails on pre-existing unrelated test fixture typing issues; no feature-owned source/script errors remained after fixing the pressure-script `rejectTrade` call.
- Supabase changelog was checked; CLI `2.84.2` was available; `supabase db push --dry-run` showed only the two intended migrations.
- `supabase db push --yes` applied both migrations, and `supabase migration list` confirmed them on remote.
- DB-backed pressure test passed and cleaned up: `listings=2 board=2 requests=1 rejected=1 remove_restore=true designs_before=13 designs_after=13 public_leaks=0 cleanup_residuals=0`.
- Vercel preview build passed: `https://sparkle-suite-jdkqdsl61-louis-2849s-projects.vercel.app` / deployment `dpl_9kqJkDx7cr2ap82yjzMHqcf1bn8s`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable `/api/nic-nac/health` returned API/DB reachable with recent error rate 0.
- Stable live Nic-Nac smoke passed using synthetic reviewer rep `sparkle-reviewer+preview@neonrabbit.net`, conversation `2b7d11e6-25e8-4326-b1f4-b4288f2c81fe`, workflow `1aa05d7b-8abe-4939-a3e6-e48c15b7555f`, temporary listing `e5918d9b-9eed-42c4-bc4f-6b1afb7b05ec`, `design_id = null`, `listing_source = non_item_number`, public payload presence, no forbidden public source wording, and cleanup.
- Stable route sweep returned 200 for `/milehighfizz/trade`, `/louisfizzfest/trade`, `/amethyst/Trade.html`, and reviewer Trade Board API after cleanup.

**Lesson carried forward:**
- Non-item-number Trade Board support should stay listing-local and workflow-local. Do not create fake item numbers, do not write these rows into `jewelry_designs`, and do not introduce customer-facing labels that make the listing feel different. Public smoke must prove both no source-language leak and actual public payload presence, not just absence of bad words.

---

## June 28, 2026 - Constant Pixel-Speed Customer Tickers

**What changed:**
- Audited the active customer-facing ticker paths for Home, Trade Board, Join, public slug routes, and the shared Amethyst React shell.
- Removed the hidden `12s` minimum-duration floor from the measured ticker math so short/sparse Trade Boards do not slow down below the universal pixel speed.
- Added delayed, resize, orientation, page-show, font-ready, and visibility resync hooks so iframe/live-preview layouts are less likely to stay on fallback timing.
- Bumped the Amethyst asset version to `20260628-constant-pixel-ticker` across Home, Trade, Join, Pantry, and Unsubscribe exports so existing and future customer accounts load the corrected bundle.

**Verification and deploy:**
- TDD regression failed first for the old asset version and `Math.max(12, distance / pixelsPerSecond)` floor, then passed after the fix.
- Focused route/template tests passed: 3 files, 50 tests.
- Amethyst template suite passed: 3 files, 70 tests.
- Local Amethyst link verifier passed against a temporary `localhost:3001` dev server.
- Local `npm run build` passed.
- Implementation checkpoint: `4196985 fix: keep customer tickers at constant pixel speed`.
- Vercel preview deployment passed: `https://sparkle-suite-fonzls0c1-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable deployed checks confirmed `milehighfizz/trade`, `louisfizzfest/trade`, and `/amethyst/Trade.html` serve the new `20260628-constant-pixel-ticker` assets, and deployed `homepage.jsx`, `trade.jsx`, and `join.jsx` contain direct `${distance / pixelsPerSecond}s` timing plus resync hooks.

**Lesson carried forward:**
- A measured ticker can still be content-length dependent if it clamps to a fixed minimum duration. For Louis's customer-facing tickers, preserve the pixel-speed formula itself: duration equals measured segment distance divided by the row's pixels-per-second constant.

---

## June 27, 2026 - Nic-Nac Item-Number Plating Variants

**What changed:**
- Fixed the catalog identity assumption Louis found during Nic-Nac testing: one item number can have multiple plating/material variants.
- Supabase migration `20260627134500_jewelry_design_item_number_material_variants.sql` replaced the old item-number-only uniqueness with item number plus normalized material/plating uniqueness.
- `resolveItemNumber`, Trade Board add-listing, duplicate physical listing checks, and `prepare_trade_board_work` now pass/use material when known.
- If the same item number has multiple variants and plating is missing, Nic-Nac asks which plating/material. If a provided plating is new for a known item number, Nic-Nac treats it as a new catalog variant, not a wrong-material correction to the existing variant.
- Prompt guardrails now teach Nic-Nac to pass visible plating as `material` and avoid framing different plating as a catalog mistake.

**Verification and deploy:**
- TDD regressions failed first for resolver, prepare-tool, and add-listing variant behavior, then passed.
- Focused variant suite passed: 4 files, 59 tests.
- Nearby prompt/catalog suite passed: 7 files, 42 tests.
- Full Nic-Nac suite passed: 112 files passed, 1 skipped; 792 tests passed, 1 skipped.
- Local `npm run build` passed.
- Supabase migration applied remotely with `supabase db push`.
- Implementation checkpoint: `f1e225a fix: support Nic-Nac plating variants`.
- Vercel deployment `https://sparkle-suite-4ypdz0zr4-louis-2849s-projects.vercel.app` is READY.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo health check passed with API and DB reachable, recent error rate 0.
- Deployed stable-demo Nic-Nac Trade Board intake smoke passed through the real `/api/nic-nac` route with reviewer-smoke rep `sparkle-reviewer+preview@neonrabbit.net`; workflow completed, listing was verified, and smoke listing cleanup succeeded.

**Lesson carried forward:**
- Bomb Party item number is not always the full catalog identity. When plating/material is visible, use it as the variant discriminator before deciding whether a design is duplicate, new, or incorrect.

---

## June 27, 2026 - Nic-Nac Confirmed Listing Photo Retry Fix

**What changed:**
- Fixed the Trade Board add-listing flow where Nic-Nac could accept a good boxed display jewelry photo, then fail to reuse it when saving the listing.
- The exact rep-facing confirmation phrase Nic-Nac suggested, `use this photo`, now promotes the latest identified image to a confirmed jewelry-front workflow photo.
- When multiple prior jewelry photo attempts exist, `add_listing` now defaults to the latest confirmed workflow jewelry-front photo if the model retries without an explicit photo index.
- Boxed/display jewelry photo rules remain unchanged: clear, centered, close boxed display shots are valid customer-facing listing photos.

**Verification and deploy:**
- TDD regressions failed first, then passed for `use this photo` confirmation and no-index latest confirmed photo reuse.
- Focused photo/tool tests passed: 2 files, 56 tests.
- Broader Nic-Nac photo/tool guard passed: 4 files, 70 tests.
- Full Nic-Nac suite passed: 112 files passed, 1 skipped; 789 tests passed, 1 skipped.
- Local `npm run build` passed.
- Implementation checkpoint: `b6c9b92 fix: reuse confirmed Nic-Nac listing photos`.
- Vercel deployment `dpl_3g5XE1YxDqDRa4SUL5wVpRYyGhQx` / `https://sparkle-suite-g3nyffkqu-louis-2849s-projects.vercel.app` is READY.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Deployed stable-demo Nic-Nac Trade Board intake smoke passed through the real `/api/nic-nac` route with reviewer-smoke rep `sparkle-reviewer+preview@neonrabbit.net`; workflow completed, listing was verified, and smoke listing cleanup succeeded.

**Lesson carried forward:**
- If Nic-Nac tells a rep to type a confirmation phrase, that exact phrase must be recognized by workflow state. Do not rely on the model to pass a perfect photo index when app-owned workflow state already knows the latest accepted jewelry photo.

## June 23, 2026 - Wispr Flow Business Tool

**What changed:**
- Simplified the `Business Tools` workspace section so `Business Calculator` and `Business Cards` now render as plain `Coming Soon` placeholders only.
- Removed the in-page calculator UI and BP dashboard number-import research note from the current Business Tools surface.
- Added the usable Wispr Flow section with Louis's invite link: `https://wisprflow.ai/r?LOUIS20696`.
- Grounded the Wispr Flow copy in the official Wispr Flow site positioning: voice-to-text across apps, faster dictation, AI cleanup/auto-edits, and ready-to-send formatting.
- No Chrome Web Store settings, local extension code, or protected live-show extension files were touched.

**Verification and deploy:**
- TDD regression failed first, then passed for the new Business Tools behavior.
- Focused dashboard/Nic-Nac suite passed: 15 files, 265 tests.
- `npm run build` passed locally.
- `npm run lint` passed with existing warnings only.
- `git diff --check` passed with line-ending warnings only.
- Local reviewer-smoke production server passed with synthetic reviewer rep: Business Tools loaded, Wispr Flow copy/link was visible, exactly two `Coming Soon` placeholders rendered, and calculator fields were absent.
- Local mobile smoke passed with no horizontal overflow.
- Stable demo reviewer-smoke passed against `https://sparkle-suite-demo.vercel.app/nic-nac?section=business-tools` with synthetic reviewer rep.
- Implementation checkpoint: `9181e64 feat: add Wispr Flow business tool`.
- Vercel deployment `dpl_2UdN5CDapP577wJysYaRJ8stmktz` / `https://sparkle-suite-puc81mud5-louis-2849s-projects.vercel.app` is READY.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.

**Still open:**
- Business Calculator remains a future Business Tools upgrade and should stay a simple `Coming Soon` placeholder until Louis asks to build it out.
- Business Cards remains a future paid proof/order/contractor workflow and should stay a simple `Coming Soon` placeholder until that workflow is designed.
- Any Bomb Party dashboard number import research remains separate and must respect the protected Live Queue extension rules.

---

## June 23, 2026 - Recipes Workspace Gate

**What changed:**
- Fixed the rep workspace sidebar so `Recipes` only appears for Heather's BlingKitchen workspace.
- Added a BlingKitchen recipe-workspace access gate based on Heather's known rep id and BlingKitchen public site slug.
- Direct `?section=recipes` access now resolves back to Trade Board for non-BlingKitchen reps instead of showing the recipe editor.

**Verification and deploy:**
- TDD regression passed: `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts`.
- `npm run build` passed.
- `npm run lint` passed with existing warnings only.
- Local reviewer-smoke render with the synthetic reviewer rep confirmed Recipes was absent from the sidebar and direct `?section=recipes` showed Trade Board content.
- Implementation checkpoint: `5784701 fix: limit Recipes workspace to BlingKitchen`.
- Vercel deployment `dpl_2YYgaK7VpsUBxWzJ9AkVWEk2cfb8` / `https://sparkle-suite-1dvfw3tit-louis-2849s-projects.vercel.app` is READY.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` was moved to that deployment and the login route returned `200`.

## June 23, 2026 - Business Tools Workspace Hub

**What changed:**
- Replaced the disabled `Business Calculator` workspace nav item with an unlocked `Business Tools` hub.
- Kept the existing calculator inside the hub and preserved old `?section=business-calculator` deep links by routing them to `?section=business-tools`.
- Added first-pass tool cards for Business Calculator, Wispr Flow, and Business Cards, plus a research note for future BP dashboard number import.
- Left Live Queue/Bomb Party dashboard scraping as research only; no extension or Chrome Web Store files were touched.

**Verification and deploy:**
- Focused dashboard test passed: `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts`.
- Local `npm run build` passed.
- `npm run lint` passed with existing warnings only.
- Local reviewer-smoke render passed on a token-enabled local server with synthetic reviewer rep, including Business Tools route load and calculator Single Show tab interaction.
- Implementation checkpoint: `ffedb31 feat: add Business Tools workspace hub`.
- Vercel deployment `dpl_APXSZbTNkQvnq7AE37yvsdiGDVh4` / `https://sparkle-suite-dx805vff7-louis-2849s-projects.vercel.app` is READY.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` was moved to that deployment and the login route returned `200`.

**Still open:**
- Make the calculator more robust and rep-friendly for actual show/month planning.
- Decide whether BP dashboard number import is feasible without violating Live Queue safety rules or changing live-show behavior.
- Add Wispr Flow affiliate link/content after Louis has the partner details.
- Design the paid business-card proof/order/contractor workflow before taking orders.

## June 23, 2026 - Nic-Nac Live Calendar and Reminder Hardening

**What changed:**
- Hardened Nic-Nac's live calendar workflow beyond prompt wording: added app-owned calendar preflight, approval-gated skip-one-show, cancel-series, and pause-series tools, and clearer approval detail copy.
- Added durable show reminder preferences and per-show reminder overrides so reps can ask for recurring defaults like "text my people 45 before every show" and one-night exceptions like "turn off SMS tonight but keep email."
- Extended pre-show reminder planning to support SMS and email channels, default preferences, event overrides, dry-run/live gating, and durable run/item observability.
- Seeded reviewer-smoke calendar/audience data for repeatable Nic-Nac calendar tests, including a same-day upcoming show and a future recurring occurrence.
- Added `npm run smoke:nic-nac:calendar-reminders`, which drives messy rep wording through real `/api/nic-nac`, approval flow, and database assertions.

**Schema and deploy:**
- Applied Supabase migration `20260623120000_show_reminder_preferences.sql` remotely with `show_reminder_preferences`, `show_reminder_overrides`, `show_reminder_runs`, and `show_reminder_run_items`.
- Added a composite ownership constraint tying reminder overrides to the rep-owned calendar event.
- Deployed clean Vercel preview `dpl_3iz33huJwPMqkSGSNReFVxYsTCoM` / `https://sparkle-suite-5v9qyopkd-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now resolves to that deployment.

**Verification:**
- Focused calendar/reminder/Nic-Nac suite passed: 14 files, 147 tests.
- Standard `npm test` passed: 14 files, 191 tests.
- `npm run lint` passed with the existing warning set only.
- `npm run build` passed locally and during Vercel deploy.
- `git diff --check` passed with line-ending warnings only.
- Local real API/model smoke passed after prompt/preflight/seed hardening.
- Stable-demo smoke passed against `https://sparkle-suite-demo.vercel.app` with reviewer rep `sparkle-reviewer+preview@neonrabbit.net`, conversation `57bef99e-56c1-4991-87f7-e894fe57ae50`, approval flow, tool observation, and database assertions.

**Lessons carried forward:**
- Calendar automation needs the same Nic-Nac reliability standard as Trade Board: app-owned preflight, durable workflow state, approval-gated mutations, DB assertions, and deployed smoke.
- Approval-gated tools should emit the confirmation dialog directly after preflight; Nic-Nac should not ask a separate natural-language confirmation first when the app already knows the proposed mutation.
- Future outbound SMS/email reminder launch should be enabled by channel flags and provider/compliance readiness, not by changing the core calendar intent routing again.

---

## June 22, 2026 - Nic-Nac Name Origin Identity Context

**What changed:**
- Added Nic-Nac's name origin to the shared core persona prompt and legacy static prompt: Louis named Nic-Nac after one of his pet rabbits.
- Added prompt tests so routed Nic-Nac prompts keep that identity fact.
- Updated vault memory so future sessions preserve the origin.

**Verification:**
- Focused prompt tests passed.
- Touched-file lint passed.
- Suite standard `npm test` passed.
- `npm run build` passed.
- Stable demo alias points to Vercel deployment `dpl_5kqjagcaoChLQCmVM9XMecdp2zfQ`.
- Deployed reviewer-smoke `/api/nic-nac` question smoke passed: Nic-Nac answered that Louis named him after one of his pet rabbits.

**Memory/HQ closeout:**
- Open Brain captured the status update, identity decision, prompt-budget lesson, deployed-smoke lesson, and Louis's broader tool/workflow reliability expectation.
- HQ task `task_11_10_nic_nac_stable_baseline` was updated to `in_progress` with this session's verification notes.
- HQ open item `61be6866-a661-4b4c-9ef8-2f4bb5bae99d` was created for durable Nic-Nac Trade Board and jewelry database tool knowledge.

---

## June 22, 2026 - Nic-Nac Caveat Cleanup: Suite Lint And Finder Deployed Smoke

**What changed:**
- Cleaned the remaining full-suite ESLint errors that were blocking `npm run lint`, without changing Nic-Nac workflow behavior.
- Added a token-gated Finder internal reviewer-smoke session route at `/api/internal/finder/reviewer-smoke-session`.
- Finder smoke now creates a temporary confirmed Silver smoke user, captures real Supabase auth cookies, calls deployed `/api/finder/nic-nac`, and cleans the smoke user afterward.
- Rotated Finder production `SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN` and deployed Finder production `dpl_FYgnoBbT1VW6iwwmSkP5Jn16x9L7`, aliased at `https://sparkle-finder-dev.vercel.app`.
- Deployed Suite preview `dpl_5RVUZD6xmWKwFMa41VwPthiLEaBq` / `https://sparkle-suite-ku7hgxqm6-louis-2849s-projects.vercel.app` and moved `https://sparkle-suite-demo.vercel.app` to that deployment.

**Verification:**
- Suite `npm run lint` now passes with warnings only.
- Suite `npm test` passed: 14 files, 179 tests.
- Suite `npm run build` passed.
- Finder focused reviewer-smoke/session tests passed.
- Finder `npm run lint` passed.
- Finder `npm run build` passed.
- Finder full Sparkle Finder suite passed after rerun: 38 files, 496 tests. The first run had one unrelated timeout in `auth-routes.test.ts`; rerunning that file and then the full suite passed.
- Deployed Finder Nic-Nac smoke passed against `https://sparkle-finder-dev.vercel.app` with `stream_ok` and no hard-fail phrases.
- Live URL checks returned `200` for both `https://sparkle-suite-demo.vercel.app/` and `https://sparkle-finder-dev.vercel.app/`.

**Result:**
- The two prior caveats are closed: Suite repo-wide lint no longer fails, and Finder has a non-personal deployed Nic-Nac smoke path while preview auth stays disabled in production.

---

## June 22, 2026 - Finder Nic-Nac Telemetry Migration Applied

**What changed:**
- Applied Sparkle Finder migration `20260622173000_finder_nic_nac_conversation_telemetry.sql` through the Supabase Dashboard SQL editor for Finder project `sparkle-finder-auth` / `pzksocboqauqjdtsgpdp`.
- Deployed Finder commit `c7eaf2c feat: persist Finder Nic-Nac telemetry` to production deployment `dpl_1Q9mZ7WG4eNFWnzhbG7Loco3PbDU`, aliased at `https://sparkle-finder-dev.vercel.app`.

**Verification:**
- Supabase verification query passed with all checks `true`: telemetry tables exist, RLS is enabled, authenticated users have select-only access, service-role has select/insert/update/delete, read-own policies exist, expected updated-at triggers exist, expected indexes exist, and no required columns are missing.

**Follow-up completed:**
- Added a secured Finder internal smoke route and `npm run smoke:finder-telemetry-runtime`, rotated the Vercel Production `SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN`, and deployed Finder production `dpl_8tjDSHhUZ2cfvrJtQM61yAXAtNZa`.
- `https://sparkle-finder-dev.vercel.app` now points at that deployment.
- Deployed telemetry runtime smoke passed with row counts `{"conversations":2,"messages":4,"runs":2}`, all telemetry checks true, cleanup `ok:true`, and residual telemetry rows at zero.
- The internal smoke route returns `401` without the bearer token.

---

## June 22, 2026 - Nic-Nac AI And Memory Disclosure Baseline

**What changed:**
- Updated Sparkle Suite privacy policy and terms to disclose Nic-Nac AI assistance, memory, telemetry/tool context, possible bounded Suite/Finder memory sharing for linked reps, operator/Lab review for support and quality, model/service-provider processing, sensitive-info caution, surface-gated tool access, output review responsibility, and off-mission/excessive-use limits.
- Updated Sparkle Suite `/start` agreement copy so new reps acknowledge Terms, Privacy Policy, and Nic-Nac AI assistance/memory before starting account creation.
- Updated Sparkle Finder privacy policy and terms with matching Finder-specific disclosure for Silver, Showcase, Wishlist, Favorite Reps, linked-rep context, and shared Nic-Nac memory.
- Updated Finder signup/account privacy acknowledgment copy to clearly mention Nic-Nac AI assistance and memory.

**Verification:**
- Suite focused legal/start tests passed.
- Suite curated `npm test` passed.
- Suite `npm run build` passed.
- Finder focused route/legal tests passed.
- Finder full `npm run test` passed.
- Finder `npm run build` passed.
- Suite deployment `dpl_6ukmGgSaWQWdF8WGzFNjNDec4YdA` is aliased at `https://sparkle-suite-demo.vercel.app`; live checks confirmed updated `/start`, `/privacy-policy`, and `/terms-and-conditions` disclosure text.
- Finder deployment `dpl_7Ao34Wu45BvhCmyCeXDWjn6T4NTE` is aliased at `https://sparkle-finder-dev.vercel.app`; live checks confirmed updated `/auth/sign-up`, `/privacy-policy`, and `/terms-and-conditions` disclosure text.

**Still open:**
- This is a product disclosure baseline, not attorney-approved legal advice. Before broad rollout, complete attorney/final policy review and polish public marketing/onboarding copy around Nic-Nac memory.

---

## June 22, 2026 - Secret Rep ID Claim Deployment And Finder Smoke

**What changed:**
- Configured `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN` as a shared sensitive Vercel env var for Suite and Finder production/preview.
- Deployed Suite production to `dpl_6LUJB79BHeYsfMWLSUtEsRqWUMbY` / `https://sparkle-suite-kkh37c6w7-louis-2849s-projects.vercel.app`.
- Moved `https://sparkle-suite-demo.vercel.app` to the same Suite deployment.
- Deployed Finder production to `dpl_6FAPcdx2SgZoxGhmdw4UuYx2Eyfc` / `https://sparkle-finder-oimbu0wl1-louis-2849s-projects.vercel.app`, aliased at `https://sparkle-finder-dev.vercel.app`.
- Refreshed Finder Vercel production/preview Supabase runtime envs from the dedicated Finder Supabase project.

**Verification:**
- Suite internal claim endpoint now returns `401 unauthorized` instead of `503 not configured` on `www.yoursparklesuite.com` and `sparkle-suite-demo.vercel.app` when called without the bearer token.
- Finder deployed browser smoke created a temporary confirmed Finder auth user, signed in through `https://sparkle-finder-dev.vercel.app`, submitted the Secret Rep ID claim form, verified the profile rep link and `silver_rep_included` membership in Supabase, then deleted the temporary user and rows.
- Finder deployed linked-rep Nic-Nac smoke returned HTTP `200` from `/api/finder/nic-nac`, streamed through OpenAI, and found zero hard-fail phrases; the temporary user and rows were cleaned up.

**Issue found and fixed:**
- The deployed claim smoke exposed missing `service_role` grants on Finder `sparkle_finder_profiles` and `sparkle_finder_memberships`. Finder migration `20260622155712_finder_rep_claim_service_role_grants.sql` now grants the server-side claim writer the needed table privileges.

---

## June 22, 2026 - Secret Rep ID Number Bridge Copy

**What changed:**
- `/api/nic-nac/me` now returns `secret_rep_id_number` as a compatibility alias for the saved Live Queue sync code.
- The Sparkle Suite workspace topbar now labels the private rep number as `Secret Rep ID Number`.
- Required Live Queue setup now tells reps to keep that number private and use it when the extension asks for their code.
- Required setup prompt guidance now tells Nic-Nac to say `Secret Rep ID Number` in rep-facing setup language while still using the internal `liveQueueSyncCode` field/tool results.

**Verification:**
- Focused Suite regression passed: 20 files, 311 tests.
- Suite curated `npm test` passed: 14 files, 179 tests.
- Suite `npm run build` passed.
- Full Suite Vitest sweep still has unrelated pre-existing failures in start/prelaunch server-page render tests and master brand doc expectations; the touched Suite tests passed.

---

## June 22, 2026 - Nic-Nac OpenAI Runtime Env Alignment

**What changed:**
- Confirmed Suite Vercel already had `OPENAI_API_KEY` for production, preview, and development.
- Added explicit Suite Vercel model env vars across production, preview, and development:
  - `NIC_NAC_HUMAN_DEFAULT_MODEL=gpt-5.4`
  - `NIC_NAC_HUMAN_ESCALATED_MODEL=gpt-5.5`
  - `NIC_NAC_UTILITY_MODEL=gpt-5.4-mini`
  - `NIC_NAC_LAB_SYNTHESIS_MODEL=gpt-5.5`
- Added Finder Vercel `OPENAI_API_KEY` for production and preview, then deployed Finder production so the env is live.
- Direct OpenAI API verification passed for `gpt-5.4` and `gpt-5.4-mini`.

**Caveat:**
- Finder deployed route smoke still requires a real authenticated Silver session. Production preview auth remains disabled, which is correct for safety.

---

## June 22, 2026 - Nic-Nac Mission Guardrails

**What changed:**
- Added a conservative Nic-Nac mission-scope classifier in Suite and Finder.
- Suite `/api/nic-nac` now redirects clear off-mission requests before memory-card loading, workflow setup, tool building, and model streaming. The redirect persists the user/assistant messages, logs a zero-token/zero-cost `mission_redirect` run, and streams a normal UI-message response.
- Finder `/api/finder/nic-nac` now redirects clear off-mission Silver requests before OpenAI configuration checks, Supabase memory setup, tool setup, or model streaming. Redirect streams use generated assistant ids, not a fixed id.
- Explicit off-mission categories include therapy, grocery lists, homework/content drafting, travel planning, medical advice, legal/financial advice, and general-chatbot use. The guard checks explicit redirect patterns before broad Sparkle/BP mission keywords so mixed prompts like "therapist for rep burnout" or "grocery list for live show snacks" are still redirected.

**Verification:**
- Independent review agent found the mission-keyword false-negative risk and a weak Suite route-order test; both were fixed before closeout.
- Suite focused mission-guard suite passed: 3 files, 19 tests.
- Suite route-runtime mission redirect regression now calls `/api/nic-nac` with mocked paid auth and proves the static redirect persists/logs a zero-cost response before Suite memory, workflow, tool, model setup, or model streaming.
- Finder focused mission-guard/route suite passed: 3 files, 24 tests.
- Broad Suite Nic-Nac sweep passed: 106 files passed, 1 skipped; 735 tests passed, 1 skipped.
- Finder full Vitest suite passed: 34 files, 455 tests.
- Suite `npm run build` passed.
- Finder `npm run build` passed.
- Finder Nic-Nac missing-key guard smoke passed against a local `next start` server with `blocked_missing_model`.
- Finder Nic-Nac off-mission route smoke passed with `stream_ok` for prompt `Make my grocery list for live show snacks.` while `OPENAI_API_KEY` was empty.
- Broader Finder local smoke passed: 17 Playwright tests passed, 2 skipped.

**Still open:**
- Finder deployed authenticated model-stream smoke still needs Finder Vercel `OPENAI_API_KEY`.
- Suite now has deterministic route-order and route-runtime proof for the static mission redirect path. A true deployed authenticated browser/API smoke for that exact path remains optional future proof if the risk level warrants it.
- Secret Rep ID rep-facing copy/UI, Finder claim UI/storage, and legal/privacy/onboarding disclosure remain future slices and were not changed in this Nic-Nac-only closeout.

## June 22, 2026 - Finder Nic-Nac Route Smoke Harness

**What changed:**
- Added `npm run smoke:finder-nic-nac` and `npm run smoke:finder-nic-nac:guard` in `C:\Users\louis\sparkle-finder-repo`.
- The smoke script builds Finder, starts a local production server on `127.0.0.1:4310`, obtains a local Silver preview-auth cookie, posts a UI-message request to `/api/finder/nic-nac`, and checks the response.
- `smoke:finder-nic-nac` is the configured-model smoke and should fail if Finder returns `model_not_configured`. `smoke:finder-nic-nac:guard` is the explicit missing-key guard smoke and treats `503 { error: "model_not_configured" }` as the expected safe blocked state.
- Successful streams are checked for Nic-Nac hard-fail phrases, including phrases split across framed AI SDK text deltas.
- Fixed Finder `/api/finder/nic-nac` to pass the local preview-auth cookie into `getCurrentSparkleFinderAccount`, guarded by the existing local preview-auth flag, so route smoke reaches the Nic-Nac model guard instead of failing at `401 unauthenticated`.

**Verification:**
- TDD red/green completed for local preview-auth pass-through on the Finder Nic-Nac route.
- TDD red/green completed for the configured-model default, explicit guard command, and framed-stream hard-fail phrase detection.
- Focused Finder Nic-Nac route/smoke-script tests passed: 2 files, 19 tests.
- `npm run smoke:finder-nic-nac:guard` passed with `blocked_missing_model` at `http://127.0.0.1:4310`.
- Full Finder Vitest suite passed: 32 files, 441 tests.
- Finder `npm run build` passed and includes `/api/finder/nic-nac`.
- Broader Finder local smoke passed: 17 Playwright tests passed, 2 skipped, with local preview auth at `http://127.0.0.1:4310`.
- Independent review agent found the initial smoke naming/stream-text risks; both were fixed and reverified.

**Still open:**
- Deployed Finder Nic-Nac model-stream smoke still needs Finder Vercel `OPENAI_API_KEY`. After that secret is configured and deployed, rerun `smoke:finder-nic-nac` in configured mode against the deployed Finder URL.

## June 22, 2026 - Finder Nic-Nac Surface Tool Policy

**What changed:**
- Added a Finder-local Nic-Nac product/tool policy that classifies every Finder routed intent by required capability.
- Finder `/api/finder/nic-nac` now filters requested intents through product context before active tools and prompt text are built.
- Linked Sparkle Suite reps asking for Sparkle Suite workspace mutations from Sparkle Finder now get the Suite-login boundary with no Finder tools exposed for that turn.
- Mixed turns such as "add this to my Trade Board and remember..." suppress Finder memory tools for the same blocked Suite mutation turn instead of using Finder memory as a workaround.
- Common Suite mutation shorthand is covered, including `my board`, trade status, homepage/hero edits, and live-show scheduling, while read/discovery wording such as "show me my Trade Board" stays out of the mutation block.
- Added a Finder Nic-Nac model configuration guard: authenticated Silver route calls now fail fast with `503 { error: "model_not_configured" }` when `OPENAI_API_KEY` is missing instead of starting a broken model stream.

**Verification:**
- TDD red/green completed for the Finder product-context policy, route-level no-tools boundary, shorthand mutation wording, mixed mutation+memory suppression, and board discovery vs mutation wording.
- TDD red/green completed for the missing-OpenAI-key route guard.
- Adjacent Finder Nic-Nac suite passed: 7 files, 34 tests.
- Full Finder Vitest suite passed: 31 files, 431 tests.
- Finder `npm run build` passed and includes `/api/finder/nic-nac`.
- Finder local smoke passed: 17 Playwright tests passed, 2 skipped, with local preview auth at `http://127.0.0.1:4310`.
- Suite focused core policy/prompt/linked-memory sweep passed: 4 files, 22 tests.
- Independent reviewer agent found two policy gaps; both were reproduced with failing tests and fixed before this checkpoint.

**Still open:**
- Deployed Finder Nic-Nac smoke still needs Finder Vercel `OPENAI_API_KEY`; `SPARKLE_FINDER_TO_SUITE_REP_MEMORY_TOKEN` is configured for production and preview in both Suite and Finder, but new deployments/smoke are still needed before calling the deployed bridge ready.
- Finder Secret Rep ID claim UI/storage, rep-facing Suite Secret Rep ID copy, legal/privacy/onboarding disclosures, and authenticated deployed smoke remain future slices.

## June 22, 2026 - Finder Linked Rep Suite Memory Bridge

**What changed:**
- Added Suite server-only `/api/internal/finder/rep-memory`, protected by `SPARKLE_FINDER_TO_SUITE_REP_MEMORY_TOKEN`, for Sparkle Finder to load bounded safe Suite rep memory for an already linked rep.
- The Suite bridge reuses existing `rep_notes` memory-card mapping and the Nic-Nac context assembler, so unsafe/prompt-injection notes are blocked and only linked-human summaries are returned.
- Added Finder `suite-linked-rep-memory` client that calls the Suite internal memory endpoint only for linked reps, verifies the response `suiteRepId`, filters unsafe returned text again, caps summaries, and fails closed on missing env, network errors, non-OK responses, malformed payloads, or rep mismatch.
- Finder `/api/finder/nic-nac` now merges safe Finder customer memory with safe linked Suite rep memory before building the system prompt. Unlinked collectors do not call the Suite memory bridge.
- Added `SPARKLE_FINDER_TO_SUITE_REP_MEMORY_TOKEN` placeholders to both repos' `.env.example` files.

**Verification:**
- Suite focused linked-memory bridge test passed: 7 tests.
- Finder focused route/client tests passed: 2 files, 11 tests.
- Related Suite memory/internal sweep passed: 5 files, 27 tests.
- Related Finder account/tool/prompt/route sweep passed: 6 files, 56 tests.
- Broad Suite Nic-Nac/internal-Finder sweep passed: 106 files passed, 1 skipped; 745 tests passed, 1 skipped.
- Finder full test suite passed: 29 files, 421 tests.
- Suite `npm run build` passed and includes `/api/internal/finder/rep-memory`.
- Finder `npm run build` passed and includes `/api/finder/nic-nac`.

**Still open:**
- `SPARKLE_FINDER_TO_SUITE_REP_MEMORY_TOKEN` is now configured in Suite and Finder Vercel production/preview; the deployed bridge still needs a fresh deployment and smoke before it is called live-ready.
- Finder Vercel project still needs `OPENAI_API_KEY` before authenticated Silver Finder Nic-Nac model streaming can be smoked live.
- Suite cannot independently prove Finder's user-to-rep link; the bridge relies on Finder server-side authenticated account state plus the internal bearer token. Future claim/storage work should make the link durable and auditable in Finder.

## June 22, 2026 - Finder Nic-Nac OpenAI Adapter

**What changed:**
- In `C:\Users\louis\sparkle-finder-repo`, moved Finder `/api/finder/nic-nac` from hardcoded Anthropic Haiku to an OpenAI-only Nic-Nac model policy adapter.
- Added Finder-local Nic-Nac model policy/provider helpers matching the Suite policy shape.
- Replaced Finder's unused `@ai-sdk/anthropic` dependency with `@ai-sdk/openai`.
- Added `.env.example` placeholders for `OPENAI_API_KEY` and Nic-Nac model override vars.
- Added Finder linked-rep prompt context so Nic-Nac knows the current surface is Sparkle Finder, treats linked reps as the same assistant identity when safe memory context exists, and tells reps to open/log into Sparkle Suite before Sparkle Suite workspace mutations.
- Added automatic safe Finder-memory prompt preload so Finder Nic-Nac receives bounded safe customer memory before the model answers, while unsafe memory is filtered before prompt assembly.

**Verification:**
- TDD red/green completed for route-level OpenAI policy routing, no Anthropic/Haiku hardcoding, and env placeholder coverage.
- Focused Finder route test passed: 1 file, 4 tests.
- Related Finder account/entitlement tests passed: 3 files, 43 tests.
- Full Finder Vitest suite passed: 28 files, 416 tests after the linked-rep prompt boundary and Finder memory preload.
- Finder production `npm run build` passed and included `/api/finder/nic-nac`.

**Still open:**
- Vercel project `sparkle-finder-dev` is missing `OPENAI_API_KEY`, so deployed authenticated Silver Finder Nic-Nac model streaming cannot be called runtime-ready until Louis configures/provides that secret.
- Finder still needs shared linked-human memory, product-context tool policy, Secret Rep ID claim UI/storage, and authenticated deployed smoke after env setup.

## June 21, 2026 - Nic-Nac OpenAI-Only Provider

**What changed:**
- Removed the Anthropic fallback from Nic-Nac's shared model provider.
- Nic-Nac model policy now exposes OpenAI as the only current provider.
- Removed the stale Anthropic cache-control option from the authenticated workspace Nic-Nac route.
- Updated public Nic-Nac route tests and telemetry fixtures so active Nic-Nac tests no longer mock or fixture old Haiku routing.

**Verification:**
- TDD red/green completed for the OpenAI-only Nic-Nac provider guard.
- Focused provider/model/public-route/telemetry tests passed: 5 files, 62 tests.
- Broad internal Nic-Nac/Lab/Finder/public sweep passed: 117 files passed, 1 skipped; 886 tests passed, 1 skipped.
- `npm run build` passed locally.
- Vercel preview deployment passed and built successfully: `https://sparkle-suite-4rpgzoala-louis-2849s-projects.vercel.app`.
- Stable demo alias now points to `https://sparkle-suite-4rpgzoala-louis-2849s-projects.vercel.app` / deployment `dpl_EHfC3sakh8jM5yhn8TqSdk6fGrxE`.
- Stable deployed smoke passed with Node fetch: root `/` returned `200`, `/control-center/lab` redirected unauthenticated users to `/login?redirect=%2Fcontrol-center%2Flab`, `/api/internal/sparkle-lab/weekly` returned `401` without cron auth, and `/api/internal/finder/rep-claim` returned `503` closed/not configured because the rep-claim token is not configured.

**Still open:**
- `lib/prelaunch/scout.ts` still uses Anthropic/Haiku, but it is outside Nic-Nac runtime and was left untouched under Louis's boundary.
- Sparkle Finder's separate repo still needs its own Nic-Nac model adapter migration later.

## June 21, 2026 - Nic-Nac Model Cost Guardrail

**What changed:**
- Tightened Nic-Nac OpenAI model-cost matching so approved base models and dated snapshots are priced, but unapproved suffix families such as `gpt-5.5-pro`, `gpt-5.4-pro`, and `gpt-5.4-nano` cannot accidentally reuse base `gpt-5.5` / `gpt-5.4` pricing.
- Added a Sparkle Lab preflight guard: if `lab_synthesis` is configured to a model without an approved Nic-Nac pricing entry, Lab records a `lab_note` and skips the model call instead of spending credits and treating the run as free.
- Confirmed the current OpenAI docs still list GPT-5.5 as latest and the local Standard short-context pricing table matches the documented GPT-5.5, GPT-5.4, and GPT-5.4-mini prices.

**Verification:**
- TDD red/green completed for strict model-family pricing and Lab synthesis skip behavior.
- Focused model/Lab tests passed: 2 files, 11 tests.
- Adjacent model/Lab route tests passed: 9 files, 39 tests.
- Broad internal Nic-Nac/Lab/Finder/public sweep passed: 117 files passed, 1 skipped; 885 tests passed, 1 skipped.
- `npm run build` passed locally.
- Vercel preview deployment passed and built successfully: `https://sparkle-suite-24186fjqa-louis-2849s-projects.vercel.app`.
- Stable demo alias now points to `https://sparkle-suite-24186fjqa-louis-2849s-projects.vercel.app` / deployment `dpl_9kq8Ugc2bJZ1dXXm1zk7FaeW3Yqn`.
- Stable deployed smoke passed with Node fetch: root `/` returned `200`, `/control-center/lab` redirected unauthenticated users to `/login?redirect=%2Fcontrol-center%2Flab`, `/api/internal/sparkle-lab/weekly` returned `401` without cron auth, and `/api/internal/finder/rep-claim` returned `503` closed/not configured because the rep-claim token is not configured.

**Still open:**
- Lab model synthesis remains feature-flagged off in Vercel.
- Pro/nano model families are intentionally not approved for Lab spend until an explicit pricing/policy decision adds them.

## June 21, 2026 - Nic-Nac Surface Tool Policy Refinement

**What changed:**
- Added explicit capability metadata for every Nic-Nac routed tool intent so future product adapters cannot accidentally treat mixed Suite tool packs as safe in Finder or public surfaces.
- Split shared memory from Suite workspace mutation requirements in the core tool policy.
- Linked Sparkle Finder reps can now keep the `memory` intent available at the core-policy level while Suite workspace mutation intents such as Trade Board and Calendar remain blocked with the Sparkle Suite login boundary message.
- Kept mixed packs such as `resources` and `catalog` conservative as Suite-workspace requirements until product-specific Finder/public tool registries split read-only actions from mutation/reporting actions.

**Verification:**
- TDD red/green completed for linked Finder memory plus explicit intent-capability coverage.
- Focused core/prompt/model/telemetry suite passed: 6 files, 29 tests.
- Broader core/prompt/routing suite passed: 6 files, 69 tests.
- Adjacent Trade Board workflow suite passed: 4 files, 62 tests.
- Adjacent internal Finder/public Nic-Nac suite passed: 4 files, 128 tests.
- Broad internal Nic-Nac/Lab/Finder/public sweep passed: 117 files passed, 1 skipped; 882 tests passed, 1 skipped.
- `npm run build` passed locally.
- Vercel preview deployment passed and built successfully: `https://sparkle-suite-6d18n6auo-louis-2849s-projects.vercel.app`.
- Stable demo alias now points to `https://sparkle-suite-6d18n6auo-louis-2849s-projects.vercel.app` / deployment `dpl_AArXn4oSUHG4BujyZQ7H5dGSJSNc`.
- Stable deployed smoke passed with Node fetch: root `/` returned `200`, `/control-center/lab` redirected unauthenticated users to `/login?redirect=%2Fcontrol-center%2Flab`, `/api/internal/sparkle-lab/weekly` returned `401` without cron auth, and `/api/internal/finder/rep-claim` returned `503` closed/not configured because the rep-claim token is not configured.

**Still open:**
- No Sparkle Finder repo, Finder UI, rep-facing Secret Rep ID UI/copy, customer-facing site, or legal/privacy/onboarding copy was changed.
- Future Finder adapter work still needs product-specific tool packs so Finder-safe catalog/resources actions can be allowed without exposing Suite mutation tools.

## June 21, 2026 - Nic-Nac Duplicate Listing And Finder Claim Hardening

**What changed:**
- Hardened the `add_listing` tool so an item number/design already active on the rep's Trade Board no longer gets treated as a flat duplicate refusal. Nic-Nac now requires the follow-up: `That item number is already on your Trade Board. Are we adding another physical piece of the same design?`
- Allowed the duplicate add to proceed only when the latest rep context clearly confirms another/additional/second physical piece, an explicit quantity, or a yes after Nic-Nac asked the duplicate-physical-piece question.
- Tightened Suite's internal Sparkle Finder rep-claim validator so a Secret Rep ID Number must map to an active rep that is also public-Finder eligible through a paid workspace or ready launch-build path.
- Removed the stale `plain background` instruction from the internal Finder jewelry intake rejection copy and replaced it with clear/centered Nic-Nac photo-QA language.
- Added the missing `SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN` placeholder to `.env.example` and aligned the cross-ecosystem plan with the implemented `SPARKLE_LAB_WEEKLY_RUNS_ENABLED` flag.

**Verification:**
- Focused internal regression passed: 11 files, 158 tests.
- Broad internal Nic-Nac/Lab/Finder sweep passed: 115 files passed, 1 skipped; 774 tests passed, 1 skipped.
- `npm run build` passed locally.
- Vercel preview deployment passed and built successfully: `https://sparkle-suite-ks5ypptkz-louis-2849s-projects.vercel.app`.
- Stable demo alias now points to `https://sparkle-suite-ks5ypptkz-louis-2849s-projects.vercel.app` / deployment `dpl_BdNddYtiBUp2eWnCQPLowkwLsGPq`.
- Stable deployed smoke passed with Node fetch: root `/` returned `200`, `/control-center/lab` redirected unauthenticated users to `/login?redirect=%2Fcontrol-center%2Flab`, and `/api/internal/sparkle-lab/weekly` returned `401` without cron auth.

**Still open:**
- `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN` and preview `SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN` are not configured, so Suite internal Finder routes correctly return `503` closed/not configured on stable demo.
- Sparkle Finder repo claim UI/storage, Finder Nic-Nac adapter work, rep-facing Secret Rep ID copy/UI, and legal/privacy/onboarding disclosure remain untouched pending Louis approval.

## June 21, 2026 - Sparkle Lab Model Synthesis Harness

**What changed:**
- Added a model synthesis harness to the Sparkle Lab runner, gated behind `SPARKLE_LAB_MODEL_SYNTHESIS_ENABLED=true`.
- Synthesis uses the existing `lab_synthesis` Nic-Nac model policy only when explicitly enabled and only after model-call, premium-call, and cost caps allow it.
- When enabled, the Lab can create a `report` artifact in `sparkle_lab_artifacts`, record model/premium call counts, and estimate model cost from returned usage.
- If synthesis is disabled, the current manual and weekly Lab runners remain deterministic and make no model calls.
- Added the synthesis flag to `.env.example`.

**Verification:**
- Focused Lab tests passed: 6 files, 21 tests.
- Broad Nic-Nac/Lab/Finder-claim sweep passed: 114 files passed, 1 skipped; 760 tests passed, 1 skipped.
- `npm run build` passed locally.
- Vercel preview deployment for commit `0089964` completed after the local CLI deploy timed out; latest ready preview was `https://sparkle-suite-ozj1u1i2d-louis-2849s-projects.vercel.app`.
- Stable demo alias now points to `https://sparkle-suite-ozj1u1i2d-louis-2849s-projects.vercel.app` / deployment `dpl_Hq9gc8iG99ZrX9iL2zdUH68fvG4H`.
- Stable deployed smoke passed with Node fetch: root `/` returned `200`, `/api/internal/sparkle-lab/weekly` returned `401` without auth and with wrong auth, and `/control-center/lab` redirected unauthenticated users to `/login?redirect=%2Fcontrol-center%2Flab`.

**Still open:**
- `SPARKLE_LAB_MODEL_SYNTHESIS_ENABLED` is not enabled in Vercel, so no model-powered Lab spend is active.
- Finder integration, Finder claim UI/storage, and Suite rep-facing Secret Rep ID copy/UI remain untouched pending Louis approval.

## June 21, 2026 - Sparkle Lab Weekly Guardrail Loop

**What changed:**
- Added authenticated internal weekly Sparkle Lab route at `/api/internal/sparkle-lab/weekly`.
- Wired the weekly route into `vercel.json` at `0 6 * * 0` for the current Sunday overnight beta window.
- Kept weekly runs disabled by default unless `SPARKLE_LAB_WEEKLY_RUNS_ENABLED=true`.
- Hardened Lab budget behavior so reaching an allowed reporting cap is recorded, while only exceeding a hard cap marks the run stopped.
- Added monthly scheduled spend pre-checks so weekly runs stop before sampling when the $20 monthly scheduled cap is already reached.
- Updated `.env.example` with OpenAI-first model policy keys, Lab flags, cron secret, and Finder-to-Suite rep-claim token placeholders.

**Verification:**
- Focused Lab/cron/page tests passed: 8 files, 26 tests.
- Broad Nic-Nac/Lab/Finder-claim sweep passed: 114 files passed, 1 skipped; 759 tests passed, 1 skipped.
- `npm run build` passed locally and Vercel preview build passed.
- Stable demo alias now points to `https://sparkle-suite-pi79zhpzq-louis-2849s-projects.vercel.app`.
- Stable deployed smoke passed with Node fetch: root `/` returned `200`, `/api/internal/sparkle-lab/weekly` returned `401` without auth and with wrong auth, and `/control-center/lab` redirected unauthenticated users to `/login?redirect=%2Fcontrol-center%2Flab`.

**Still open:**
- Weekly and manual Lab runners remain feature-flagged off and deterministic/no-model-call.
- Model-powered Lab synthesis, enabling flags, and authenticated operator/manual run smoke remain future work.
- Finder repo integration and rep-facing Secret Rep ID copy/UI were not changed in this checkpoint.

## June 21, 2026 - Nic-Nac Shared Core Implementation Started

**What changed locally:**
- Added OpenAI-first Nic-Nac model policy/provider routing in Sparkle Suite, replacing hardcoded route-level Haiku model usage with configurable policy keys.
- Added model/run/tool telemetry fields for policy, provider, reasoning, estimated cost, product, surface, actor type, account tier, linked human id, and tool run id.
- Added shared product context and surface-gated Suite tool intent policy. The authenticated Suite route now builds `sparkle_suite` / `rep_workspace` context and filters requested tool intents through that policy before building tools.
- Added reusable core persona/surface prompts for Nic-Nac, including Virgo behavior, mission focus, off-scope redirect, Sparkle Finder/Suite boundary messages, and Lab researcher/recommender boundaries.
- Added bounded context assembly plus automatic safe memory cards from existing `rep_notes`. The Suite route now feeds safe, scoped, capped memory into the prompt without relying on the model to call `read_recent_rep_notes` first. Unsafe/prompt-injection memory is blocked before prompt assembly.
- Added memory-context telemetry fields for card count, blocked-card count, memory scopes, and truncation.
- Added internal Sparkle Lab budget cap helpers for weekly, manual, and urgent runs.
- Added Sparkle Lab schema migration for bounded runs, findings, and artifacts with service-role-only RLS. The migration has since been applied and remote RLS/policies were verified service-role-only.
- Added read-only internal Sparkle Lab Control Center page at `/control-center/lab`, linked from `/control-center`, with Nic-Nac Lab, Sparkle Suite Lab, Sparkle Finder Lab, Ops Lab, Research Desk, latest run, usage caps, findings, priorities, and artifacts.
- Added feature-flagged manual Sparkle Lab runner endpoint at `/api/control-center/sparkle-lab/run`. It is disabled unless `SPARKLE_LAB_MANUAL_RUNS_ENABLED=true`, is deterministic-only for now, and makes no model calls or provider-credit spend.
- Added authenticated weekly Sparkle Lab cron route at `/api/internal/sparkle-lab/weekly`, wired to Vercel cron for Sunday overnight, disabled by default unless `SPARKLE_LAB_WEEKLY_RUNS_ENABLED=true`, with monthly scheduled cap checks before sampling and no model calls in the deterministic runner.
- Hardened duplicate Trade Board item-number behavior so an existing board item prompts for another physical piece instead of refusing as a duplicate.
- Added a server-only Suite internal API at `/api/internal/finder/rep-claim` for Sparkle Finder to validate a Secret Rep ID Number with a server token. It reads `live_queue.sync_code`, then `reps`, and returns only safe rep-link/Silver badge entitlement data. It does not change live queue sync behavior and does not update Finder yet.

**Finder audit:**
- A read-only sub-agent confirmed `C:\Users\louis\sparkle-finder-repo` exists, is clean on `codex-sparkle-finder-v1`, and already has `sparkle_suite_rep_id`, `silver_rep_included`, a Rep badge, Finder Nic-Nac route/prompt/tools/tests, and Suite public Finder API consumers.
- Finder still has hardcoded Anthropic Haiku in its Nic-Nac route, fixture-backed rep entitlement, no Secret Rep ID claim route, and thinner conversation persistence than Suite.

**Verification:**
- Focused Nic-Nac/Public Nic-Nac suite passed: 14 files, 137 tests.
- Full Nic-Nac suite passed: 100 files passed, 1 skipped; 695 tests passed, 1 skipped.
- Latest broad internal sweep passed: `npm exec vitest run tests/nic-nac tests/sparkle-lab tests/control-center-page.test.ts tests/control-center-sparkle-lab-page.test.ts tests/control-center-sparkle-lab-run-route.test.ts tests/sparkle-finder-rep-claim.test.ts tests/sparkle-finder-internal-intake.test.ts` returned 111 passed files, 1 skipped, 748 passed tests, 1 skipped.
- `npm run build` passed and includes `/control-center/lab`, `/api/control-center/sparkle-lab/run`, and `/api/internal/finder/rep-claim`.
- `git diff --check` passed with only normal CRLF warnings.

**Still open:**
- Finder repo changes have not been made.
- Secret Rep ID user-facing copy/UI has not been changed because that touches rep-facing setup/account surfaces and requires a stop-and-notify checkpoint first. Finder claim UI/storage is also not implemented yet.
- Sparkle Lab model-powered synthesis and real deployed Lab smoke are not implemented yet. Manual and weekly runners are feature-flagged off by default; the current deterministic runner makes no model calls.
- No deployed stable-demo smoke was run for this local implementation slice yet.

---

## June 21, 2026 - Nic-Nac And Sparkle Lab Scalable Memory Architecture Locked

**What happened:**
- Louis clarified the long-term Nic-Nac product expectation: one production Nic-Nac should flow across Sparkle Suite and Sparkle Finder like the same assistant, with shared memory for linked humans and tool execution gated only by the current product/security surface.
- Louis also clarified that the proactive loop should be more than passive logs. Sparkle Lab should study failures, trouble tickets, business health, Sparkle Suite, Sparkle Finder, internal operations, and research opportunities, then recommend improvements without mutating production.

**Locked decisions:**
- The private code formerly described as the Live Queue code is now the Secret Rep ID Number. It remains private to the rep, keeps its Live Queue sync use, and becomes the Sparkle Finder rep-claim code.
- A linked Sparkle Finder rep account maps to the durable Sparkle Suite `rep_id`; Nic-Nac follows that durable link rather than the visible code.
- Linked reps get shared Nic-Nac memory across Sparkle Suite and Sparkle Finder, but Sparkle Suite mutations must happen from Sparkle Suite and Finder mutations from Finder.
- A claimed Sparkle Finder rep receives Silver tier and a BP Rep / verified rep badge, but no extra Finder powers beyond Silver.
- Production Nic-Nac cannot self-mutate. Lab Nic-Nac can study, test, draft, and recommend only.
- Sparkle Lab should live inside Control Center with Nic-Nac Lab, Sparkle Suite Lab, Sparkle Finder Lab, Ops Lab, and Research Desk sections.
- Sparkle Lab can automatically create internal findings, replay/eval cases, analyses, reports, research briefs, and proposals, but cannot change production behavior.
- Sparkle Lab should not run continuously. Default direction is a weekly scheduled run, initially Sunday at 2:00 AM America/New_York for Monday morning results, with adjustable cadence and explicit max cost/model-call/runtime/reviewed-record limits.
- Initial lab caps are intentionally small: $5 weekly run, $20 monthly scheduled cap, $2 manual/on-demand run, $3 urgent issue run unless raised, 20 weekly model calls max with 4 premium/deep calls max, 20 minutes weekly runtime, 250 candidate records, 25 deep-analyzed items, at most 3 headline findings, and at most 2 active work priorities.
- Nic-Nac memory is a marketed product feature and should be clear in privacy policy, terms, onboarding, and marketing. Broad user memory controls are not planned for beta.
- Nic-Nac's personality foundation is September Virgo: organized, detail-minded, service-oriented, practical, warm, sweet, professional, and lightly quirky/funny. He may mention being a Virgo only if asked directly or during light/playful conversation, while staying mission-focused and redirecting unrelated chatbot/therapy/grocery-list use.

**Artifact created:**
- `docs/superpowers/specs/2026-06-21-nic-nac-sparkle-lab-scalable-memory-loop.md`

**Implementation posture:**
- This is architecture/spec work only. Implementation should not start until the current Sparkle Finder account/schema model, the existing Live Queue code storage, account-linking shape, OpenAI model choice, legal/privacy copy requirements, and Control Center route convention are inspected or clarified.

## June 21, 2026 - Content-Independent Ticker Speed Rule

**What changed:**
- Louis clarified the product rule: ticker speed must be dynamic and visually consistent regardless of whether a customer Trade Board has 2 pieces or 40 pieces.
- The static public Amethyst homepage, Trade Board, and Join templates now render duplicate ticker loop segments and measure the actual distance between segment starts in the browser.
- Animation duration is computed from rendered distance:
  - Announcements target `46px/s`.
  - Trade Board target `55.2px/s`, roughly 20% faster.
- The shared React `AmethystSiteShell` now uses the same browser-measured ticker rule for future shell-rendered customer sites.
- Static Amethyst public assets were cache-busted to `20260621-ticker-pps`.

**Verification:**
- Regression updated so hardcoded duration-only ticker behavior cannot silently return.
- Local focused tests passed: Amethyst homepage/static asset/public slug/join/trade template suites.
- `npm run qa:amethyst` passed against local `localhost:3001`.
- `npm run build` passed locally and in Vercel.
- Stable demo alias now points to `https://sparkle-suite-o3oczruc9-louis-2849s-projects.vercel.app`.
- Stable live measurement on `https://sparkle-suite-demo.vercel.app`:
  - BlingKitchen: announcements `46px/s`, Trade Board `55.2px/s`.
  - Britt With Bling and Mile High Fizz: announcements `46px/s`; their Trade Board ticker rows currently render the empty-listing message, so there is no scrolling Trade Board content to measure.
  - Synthetic 2-piece Trade Board: `55.2px/s`.
  - Synthetic 40-piece Trade Board: `55.2px/s`.

---

## June 21, 2026 - Trade Board Ticker Rendered-Speed Fix

**What happened:**
- Louis reported the BlingKitchen live-site preview Trade Board ticker still looked slow after the earlier `60s` duration change.
- Rendered screenshot comparison confirmed he was right: the announcement row moved about `50px/s`, while the short BlingKitchen Trade Board row moved only about `7.5px/s`.
- Root cause was not the CSS duration by itself. The Trade Board loop only repeated the available trade items three times, so customer sites with one or two ticker items had a very short track and a tiny actual pixel distance to animate.

**Fix:**
- The public Amethyst homepage, Trade Board, and Join templates now pad Trade Board ticker content to a minimum of 30 rendered items before animation.
- The approved timing remains `72s` for announcements and `60s` for the Trade Board row, but short customer data now has enough rendered track width to move at the intended visual pace.
- Static Amethyst HTML asset versions were cache-busted to `20260621-trade-ticker-distance`.

**Verification:**
- TDD regression added to block reintroducing three-copy Trade Board loops.
- Local BlingKitchen DOM transform measurement after tuning:
  - Announcements: 12 items, `72s`, about `45.9px/s`.
  - Trade Board: 30 items, `60s`, about `56.7px/s`.
  - Trade Board is therefore roughly 23% faster than announcements instead of crawling.
- Focused route/cache tests passed.
- `npm run qa:amethyst` passed against local `localhost:3001`.
- `npm run build` passed locally and in Vercel.
- Stable demo alias now points to `https://sparkle-suite-3p0hczqvy-louis-2849s-projects.vercel.app`.
- Stable `https://sparkle-suite-demo.vercel.app/blingkitchen` served the new `20260621-trade-ticker-distance` assets and measured live at `45.9px/s` announcements vs. `56.7px/s` Trade Board, about 23.5% faster.

---

## June 21, 2026 - Customer-Site Trade Board Ticker Pace Hardening

**Issue fixed:**
- Louis reported the customer-facing announcement ticker finally felt right, but the Trade Board ticker row beneath it was still too slow.
- This had recurred across several sessions because the previous shared rule made announcement and Trade Board ticker rows use the same `72s` duration.

**Template rule now:**
- Customer-site announcement ticker remains at the approved casual speed: `72s`.
- Customer-site Trade Board ticker is about 20% faster: `60s`.
- The timing is encoded as shared template variables, not one-off page styling:
  - `--hp-ticker-duration: 72s`
  - `--hp-trade-ticker-duration: 60s`
  - design-system dual ticker mirrors the same `72s` / `60s` split.
- The React Amethyst site shell also uses `60s` for the Trade Board reverse row so future shell-rendered sites do not drift from the static customer-site template.
- Static Amethyst public assets were cache-busted to `20260621-trade-ticker-pace`.

**Verification completed locally before deploy:**
- Regression was written red first, then green.
- Focused ticker/template suite passed.
- Static asset route and public slug route tests passed.
- `npm run qa:amethyst` passed after starting the local Amethyst dev server.
- `npm run build` passed after clearing a stale generated `.next\dev` type file left by the local dev server.

**Lesson carried forward:**
- Do not describe ticker pacing as "one shared speed" anymore. The correct shared template contract is one shared relationship: announcements at the approved casual pace and Trade Board roughly 20% faster on every current and future Sparkle Suite customer site.

---

## June 21, 2026 - Control Center and Customer-Site Header/Ticker Hardening

**Control Center work completed:**
- Renamed `/control-center` to `Sparkle Suite Control Center`.
- Added a left-hand Control Center options column with Trouble Tickets, Customer Database, and Demo Database.
- Built expandable customer/demo account rows instead of a spreadsheet-style table.
- Customer rows include contact, billing/subscription signals, website/domain/shop/social links, setup status, internal notes, phone field, promo code, and promo-code usage fields.
- Split active customers from demo accounts. Active customers are Mile High Fizz/Lindsey, Britt With Bling/Brittany, and BlingKitchen/Heather. Everything else is in Demo Database.
- Made Customer Database and Demo Database collapsible so future Control Center sections can sit below them cleanly.
- Searched repo-local Open Brain/HQ memory for paying-client phone numbers; no reliable client phone numbers were found in accessible project memory, so phone fields remain present but blank/pending.

**BlingKitchen/public-site work completed:**
- Fixed the BlingKitchen purple-screen/live-preview issue by repairing deployed public assets and cache busting the Amethyst static bundle.
- Audited and repaired BlingKitchen visual issues that Louis flagged, including missing CTA labels/contrast and public route rendering.
- Wired public homepage ticker payloads to real workspace-backed Trade Board and Live Queue state.
- Replaced the bespoke Mile High Fizz/Britt With Bling/BlingKitchen public-site headers with one shared `SparkleSuiteHeaderStack` using the existing Sparkle Suite template header/ticker/Live Queue code path.
- Improved black-velvet/shared-header readability after Louis showed the header text was unreadable above the ticker.
- Standardized ticker speed everywhere to the same medium/casual setting:
  - `tickerSpeed: 1` in homepage/join/trade defaults and all Amethyst appearance presets.
  - `72s` ticker duration in shared homepage CSS, design-system component CSS, and React site shell.
  - Announcement and Trade Board ticker rows now use the same duration.

**Stable demo deploys and checkpoints:**
- `eace754 docs: clarify Sparkle Suite review target`
- `d8d284a fix: wire homepage ticker to live workspace features`
- `b717419 fix: include workspace features in bespoke tickers`
- `623c86b fix: bust Amethyst workspace feature assets`
- `11f545a fix: reuse Sparkle Suite header on hybrid sites`
- `6a4ba4e fix: tune shared site header readability`
- `411c580 fix: standardize ticker speed`
- Final stable demo alias: `https://sparkle-suite-demo.vercel.app`
- Final stable demo target: `https://sparkle-suite-7hwm9e9bs-louis-2849s-projects.vercel.app`
- Verified stable BlingKitchen route: `https://sparkle-suite-demo.vercel.app/blingkitchen`

**Verification completed:**
- Focused Control Center/customer-profile tests passed during Control Center work.
- Focused Amethyst/public-site tests passed across the header/ticker work.
- `npm run qa:amethyst` passed after relevant public-site changes.
- `npm run build` passed after relevant public-site changes; one local Next build left a stale generated `.next\lock` after timeout and was cleared before rerunning successfully.
- Vercel production builds passed and the stable demo alias was promoted after each Louis-reviewable change.
- Playwright screenshots visually verified the stable BlingKitchen header/readability/ticker placement after deploys.
- Final stable CSS verification showed the new `20260620-ticker-casual` asset, two matching `calc(72s / var(--ticker-speed, 1))` durations, and no old `26s`/`68s` ticker durations.

**Lessons learned:**
- For migrated public sites, do not create a lookalike header pattern when Louis asks for the Sparkle Suite template header. Reuse the same code path.
- Shared public-site elements such as header, ticker, Trade Board, and Live Queue must be centralized so fixes land across Mile High Fizz, Britt With Bling, BlingKitchen, and default Amethyst together.
- Cache busting static Amethyst assets is required for visible public-site fixes; otherwise Louis may refresh and still see the old bundle.
- Do not claim a public-site fix is live until `https://sparkle-suite-demo.vercel.app` is promoted and the exact route/assets are verified.
- Ticker speed should be a single global casual/medium setting, not two row-specific speeds.
- Keep Louis-facing closeouts bottom-line-first: what changed, where to review, verification, commit. Avoid cluttering responses with raw preview URLs unless he asks.

**Follow-up:**
- Louis/Brittany still need to accept Britt With Bling.
- Louis/Heather still need to accept BlingKitchen before any domain cutover.
- Control Center needs search/filtering, editable notes/status, richer billing details, and durable customer/demo classification metadata.
- Paying-client phone numbers still need an authorized source or manual entry.

---

## June 20, 2026 - Control Center Title and Customer Database v1

**Work completed:**
- Renamed the main `/control-center` title from `Support Command Center` to `Sparkle Suite Control Center`.
- Added a left-hand `Control Center Options` column with Trouble Tickets and Customer Database navigation.
- Added a Customer Database section that lists reps/customers as expandable rows rather than a spreadsheet.
- Each rep row now shows contact details, billing/subscription signals, public site/domain/shop links, social/streaming links, setup status/current step, and internal notes when present.
- Added `listOperatorCustomerProfiles` so the Control Center starts from all reps and merges profile, subscription, setup, website, social, and notes data.

**Verification:**
- Focused tests passed: `tests/control-center-page.test.ts` and `tests/services/client-account-profiles.test.ts`.
- Local `npm run build` passed.
- Local in-app browser QA passed on `http://127.0.0.1:3001/control-center`: title, left nav, Customer Database, 25 expandable rep rows, BlingKitchen profile expansion, and console health.

**Follow-up:**
- Customer Database v1 is read-only. Inline editing for internal notes/status, filtering/search, and richer billing history remain future Control Center polish.

---

## June 19, 2026 - Binder Folded Back Into Repo

**Problem fixed:**
- Sparkle Suite had drifted into a split workspace: `C:\Users\louis\sparkle-suite` held binder/Open Brain instructions while `C:\Users\louis\sparkle-suite-repo` held the implementation repo.
- Codex Desktop sessions opened from the binder kept hitting sandbox prompts when implementation work touched the repo.

**Change completed:**
- Copied durable binder memory/docs/plans/skills into `C:\Users\louis\sparkle-suite-repo`.
- Updated repo `AGENTS.md` so future agents read repo-local memory from `vault\project-state.md`, `vault\session-log.md`, `vault\decisions.md`, and `vault\open-items.md`.
- Added the missing project skills into repo `.agents\skills`, including `sparkle-suite-existing-site-migration`, `sparkle-suite-demo-smoke`, and `sparkle-nic-nac-agent-architecture`.
- Preserved top-level binder Markdown files under `docs\binder-archive\legacy-root`.
- Updated the old binder `AGENTS.md` to act as a redirect/archive notice, not active workspace instructions.

**Operating rule now:**
- Open future Sparkle Suite Codex sessions from `C:\Users\louis\sparkle-suite-repo`.
- Use workspace-write settings for that repo so code, docs, memory, plans, handoffs, and skills all fall under the same sandbox boundary.
- Leave `C:\Users\louis\sparkle-suite` on disk for now as a redirect/archive; do not delete it.

---

## June 19, 2026 - Britt With Bling, BlingKitchen, Recipes, and Workspace Bridge

**Migration work completed or staged:**
- Britt With Bling was migrated using the Mile High Fizz hybrid strategy from the Ready.ai/Readdy source export at `C:\Users\louis\Downloads\BWB Code\`.
- The Britt With Bling route shape intentionally follows Mile High Fizz rather than preserving every original page. The old diamonds, unicorns, and FAQ pages were dropped; Home, Trade, and Join remain the important public-site surfaces.
- The Britt With Bling Join Team page is a special preservation target because Brittany has many team-member cards. Team names, images, links, and copy need to stay in the right spots and remain editable through Nic-Nac/site data rather than becoming static one-off markup.
- BlingKitchen was migrated from the Ready.ai/Readdy source export at `C:\Users\louis\Downloads\BK Code\` as Heather's custom Sparkle Suite hybrid site.
- BlingKitchen keeps the same Lindsey/Britt migration pattern, with one extra retained route: `/blingkitchen/in-the-pantry` for recipes.

**Nic-Nac recipe editability:**
- Louis confirmed the recipe cards should be led by Nic-Nac and Heather, not maintained as hardcoded source forever.
- A Nic-Nac recipe editing plan was saved at `C:\Users\louis\sparkle-suite\docs\superpowers\plans\2026-06-19-bling-kitchen-nic-nac-recipes.md`.
- Implementation work is staged locally in `C:\Users\louis\sparkle-suite-repo`: DB-backed public-site recipes, media upload support, Nic-Nac tools, dashboard Recipes workspace UI, public Pantry DB-first loader with BlingKitchen fallback recipes, seed script, and BlingKitchen tenant attach helper.

**Repo and operations status:**
- Active branch: `codex/sparkle-cross-phase-hardening`.
- Latest pushed checkpoint after closeout: `ccd4456 feat: migrate BlingKitchen public site`.
- The Sparkle Suite implementation repo was clean and synced with origin after the BlingKitchen closeout.
- Supabase migration `20260619140000_ss_public_site_recipes.sql` was pushed and `supabase db push` reported the remote database up to date.
- Heather/BlingKitchen account provisioning and login were verified for `blingkitchen19@gmail.com`; the temporary password should be rotated after handoff.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to `https://sparkle-suite-5w9d59ald-louis-2849s-projects.vercel.app`.
- Deployed route smoke passed for `/blingkitchen`, `/blingkitchen/trade`, `/blingkitchen/join`, `/blingkitchen/in-the-pantry`, and the Pantry template endpoint. The deployed Pantry template carried the `bling_kitchen_hybrid` variant and 26 recipe entries.

**Workflow lesson:**
- The repeated approval prompts came from the Codex Desktop workspace being opened with write access to the binder instead of the implementation repo, not from Louis changing the intended workflow.
- Durable fix: future Sparkle Suite implementation sessions should start with `C:\Users\louis\sparkle-suite-repo` as the writable workspace, while repo `AGENTS.md` tells the agent to read `C:\Users\louis\sparkle-suite` first for binder/Open Brain instructions.
- The same binder-bridge pattern should be applied to Sparkle Finder so agents can read binder context first without losing write access to the actual repo.

---

## June 16, 2026 - Nic-Nac Smoke Closeout and Sparkle Finder Alignment Note

**Closeout status:**
- Nic-Nac Trade Board ER13229 hardening is now committed, pushed, deployed, and stable-demo verified through active repo commit `bbb66a4 fix: promote boxed photo after collection confirmation`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` points to `https://sparkle-suite-6c0807k4k-louis-2849s-projects.vercel.app`.
- Verification passed: focused required-setup test, full Nic-Nac suite, local build, Vercel build, and three consecutive deployed ER13229 replay smokes using the synthetic reviewer account and real uploaded image parts.

**Caveat to carry forward:**
- One successful smoke still took the confirmation branch and used awkward/internal-sounding wording around photo indexes/workflow state. The tool path was correct and completed the listing, but the next Nic-Nac wording pass should make that branch sound like a natural rep conversation while preserving workflow truth.

**Sparkle Finder alignment note:**
- Louis flagged that Sparkle Finder Silver should eventually use the same Nic-Nac jewelry intake architecture for adding missing jewelry to the library/catalog. The intake rules should match Sparkle Suite: label/details photos are facts only, boxed customer-facing jewelry photos can be valid, typed collection names are accepted, and smoke/eval gates should use real uploaded image parts. The main difference is target mutation: Sparkle Finder adds/updates the jewelry library/catalog rather than adding a Trade Board listing.
- Follow-up clarification from Louis: this should be the exact same shared Nic-Nac core, not a copied Sparkle Finder assistant. Sparkle Suite and Sparkle Finder should route into the same model/agent/toolbox plumbing, with product context deciding permissions and destination. This is a forefront architecture success condition for the whole Sparkle ecosystem.

---

## June 14, 2026 - Theme Readability Fix and Stable Demo Deploy Target Correction

**Issue found:**
- Louis reported that Black Diamond workspace readability was still broken after the first theme-readability fix.
- The first deploy was pushed only to a raw Vercel preview URL, which did not update the Sparkle Suite demo URL Louis actually refreshes.

**Fix completed:**
- Hardened Black Diamond workspace theme overrides across Trade Board, Site Settings, Account, Help & Resources, Calendar, and Jewelry Library surfaces.
- Fixed public light-accent badge/filter readability for homepage step numbers and trade active filter pills.
- Added regression coverage for late Black Diamond workspace overrides and public light-accent controls.
- Clarified memory: Sparkle Suite demo deploy/review target is `https://sparkle-suite-demo.vercel.app/`, not a raw Vercel preview URL.

**Current checkpoint and deploy:**
- Commit pushed: `b441fc7 fix: harden theme readability across workspace`.
- Vercel preview deployment: `https://sparkle-suite-1wz21xae9-louis-2849s-projects.vercel.app`.
- Stable demo alias updated: `https://sparkle-suite-demo.vercel.app/` now points to `https://sparkle-suite-1wz21xae9-louis-2849s-projects.vercel.app`.

**Verification:**
- Focused tests passed: 2 files, 77 tests.
- `npm run build` passed locally.
- Vercel preview build passed.
- Stable demo HTTP smoke passed for `/amethyst/Homepage.html` and `/amethyst/Trade.html`.

**Operational correction:**
- Future Sparkle Suite demo deploy reports must confirm the stable alias before telling Louis the work is deployed.
- Raw Vercel preview URLs can be mentioned as build artifacts, but they are not the default review link.

---

## June 12, 2026 - Nic-Nac Durable Preference Memory Fix

**Issue found:**
- Live UI memory audit proved current-show memory already works across conversations through `nic_nac_show_sessions` and `nic_nac_show_session_events`.
- General durable rep preference memory did not work from the UI: when asked to "remember this preference for future chats" and the prompt mentioned live shows, Nic-Nac routed only to current-show memory and refused to store a lasting preference.

**Fix completed:**
- Added explicit durable-memory routing for safe future preference/process requests such as "remember this for future chats", "from now on", "going forward", or "I prefer".
- Kept current-show-only language, such as "remember that for this show", routed to show memory only.
- Updated Nic-Nac's routed prompt so safe operational preferences are supported and saved with `memoryType:'preference'` and `memorySource:'explicit'` instead of being refused.
- Hardened `write_rep_note` so the server owns `conversation_date`; model-supplied stale dates can no longer bury a new memory outside recent-note retrieval.

**Current checkpoints:**
- `1d18458 fix: route explicit Nic-Nac memory preferences`
- `ce70136 fix: timestamp Nic-Nac memory writes server-side`
- Branch `codex/sparkle-cross-phase-hardening` is clean and synced with origin.

**Deployment and verification:**
- Production deployment: `dpl_3vFJ3ZTYmb6soijYM8ByEEzBZTLr` / `https://sparkle-suite-4t8jjh33k-louis-2849s-projects.vercel.app`.
- Stable demo alias updated to the final deployment: `https://sparkle-suite-demo.vercel.app`.
- Focused Nic-Nac memory/show tests passed: 7 files, 62 tests.
- `npm run build` passed locally and Vercel production build passed.
- Chrome stable-demo smoke passed: Nic-Nac saved the explicit future preference and replied with the requested marker instead of refusing.
- Supabase verification showed the run routed to both `memory` and `show_memory`, included `write_rep_note`, and saved an explicit preference note with a current server timestamp.
- Synthetic smoke note, tool execution, run, and conversation rows were cleaned up.

**Caveats noted:**
- A broad unrelated Nic-Nac/support test sweep still has stale failures in branding/shared-knowledge expectations.
- Vercel log scan during the final window showed two unrelated public Sparkle Finder 500s; the Nic-Nac memory path was clean.

---

## June 10, 2026 - Ring Size Migration Applied and Stable Demo Promoted

**Topics covered:**
- Continued the fulfillment/ring-size blocker after Louis opened Supabase in Chrome and signed in.
- Confirmed Supabase CLI remained unauthorized/unlinked for remote project work, so the migration was applied through the signed-in Supabase Dashboard SQL editor for project `bqhzfkgkjyuhlsozpylf` / `neon-rabbit-core` on `main` production.
- Hardened local migration `supabase/migrations/20260610131500_trade_listing_ring_size.sql` before manual apply: schema-qualified `public.trade_listings`, duplicate-safe constraint guard, and `NOTIFY pgrst, 'reload schema'`.
- Added `tests/trade-listing-ring-size-migration.test.ts` to lock the migration idempotence and PostgREST schema-cache reload behavior.

**Commits pushed:**
- `23f8a04 fix: harden trade listing ring size migration`

**Verification:**
- Supabase SQL verification returned `ring_size_column_present = true` and `ring_size_constraint_present = true`.
- `npm exec vitest run tests/trade-listing-ring-size-migration.test.ts tests/services/trade-board-add-listing.test.ts` passed: 10 tests.
- `npm run build` passed.
- Vercel preview deployed: `https://sparkle-suite-kkz9729yp-louis-2849s-projects.vercel.app`.
- Chrome reviewer-smoke on the preview passed:
  - `/start` reviewer controls showed `Open workspace preview`.
  - Workspace seeded `Jamie Smoke` / `RG-SMOKE-001`.
  - Board Inventory and Trade history loaded without the previous `ring_size` 500.
  - Fulfillment moved approved -> shipped -> completed.
  - Queue showed `0 active swaps`, Trade history showed `1 completed` and `$38.00`, and the received-piece prompt stayed visible.
  - Chrome console showed no warnings/errors during the checked path.
- Stable alias moved: `https://sparkle-suite-demo.vercel.app` now points to `https://sparkle-suite-kkz9729yp-louis-2849s-projects.vercel.app`.
- Chrome reviewer-smoke on the stable alias confirmed workspace preview loads with Board Inventory, Fulfillment queue, and Trade history without console warnings/errors.

**Remaining notes:**
- Supabase CLI auth/linking is still not fixed; the blocker was cleared manually through the dashboard, and the local migration is now safe for future CLI sync.
- Pre-launch live-mode Stripe smoke remains the major launch gate.

---

## June 10, 2026 - Ring Size Intake for Trade Board Listings

**Topics covered:**
- Louis learned from live jewelry handling that Bomb Party ring size numbers are usually on the box somewhere, not on the label.
- Updated Sparkle Suite implementation from `C:\Users\louis\sparkle-suite-repo` only; binder remains notes/memory only.
- Added a rep-side trade listing `ring_size` field so ring size is stored on the physical Trade Board listing, not the shared jewelry design.
- Updated Nic-Nac's add-listing workflow and tool schema so RG/ring entries capture `ringSize`; if the size is not visible from a box/details photo, Nic-Nac should ask for the ring size before `add_listing`.
- Surfaced `ringSize` through the board listing tool and API path so downstream board views/tool results can retain it.

**Verification:**
- `npm exec vitest run tests/services/trade-board-add-listing.test.ts tests/nic-nac/add-listing-batch.test.ts tests/nic-nac/system-prompt-add-listing.test.ts` passed.
- `npm exec vitest run tests/nic-nac-trade-board-route.test.ts tests/nic-nac-board-inventory-view.test.ts tests/nic-nac/trade-board-tools.test.ts` passed.
- `npm run build` passed after rerunning with a longer timeout.
- `npx tsc --noEmit --pretty false --incremental false` still reports existing repo-wide test type issues unrelated to this change.

**Open items carried forward:**
- Commit `6d48151 feat: capture ring size on trade listings` was pushed to GitHub branch `codex/sparkle-cross-phase-hardening`.
- Vercel preview deployed: `https://sparkle-suite-3bhbscrs5-louis-2849s-projects.vercel.app`.
- Supabase migration application is blocked in this session: `supabase db push` reported the checkout was not linked; `supabase link` returned `Unauthorized`; a read-only REST schema check showed `trade_listings.ring_size` is missing.
- Stable demo alias was intentionally not moved to the new preview because the deployed Trade Board code selects `ring_size` and would likely break without the migration.
- Chrome reviewer-smoke confirmed the existing stable demo setup preview still loads, and the new preview `/start` plus setup preview load. Full Trade Board smoke remains blocked until migration `20260610131500_trade_listing_ring_size.sql` is applied.

---

## June 10, 2026 - Referrals, Workspace Layout, and Chrome Reviewer Smoke

**Topics covered:**
- Continued Sparkle Suite work from the binder rules: implementation happened in `C:\Users\louis\sparkle-suite-repo`; this binder remains notes/memory only.
- Fixed the public Sparkle Suite header so the logo stays anchored left and logout/header actions stay anchored right across browser zoom levels.
- Researched and implemented the Sparkle Suite referral program: reps get a referral code/link, referred paid subscription months are tracked, and the referring account earns one credited month after a referred rep has three paid subscription months.
- Louis confirmed there should be no hard referral cap at launch. Abuse review can stay manual unless real usage shows a need for limits.
- Applied and verified the Supabase migration for `rep_referral_paid_months` with RLS, indexes, and policies.
- Read-only checked Stripe test webhook coverage for `checkout.session.completed` and `invoice.payment_succeeded`; no live Stripe dashboard changes were made.
- Added the pre-launch Stripe live smoke and webhook gate as a high-priority launch item.
- Audited the Account/Billing screenshot at 100% zoom: the workspace left column had a hard internal width cap that created empty space beside Nic-Nac, and account cards used typography that felt too large compared with the rest of the workspace.
- Fixed the Account/Billing layout so the workspace fills the available left column beside the fixed Nic-Nac panel, clips accidental horizontal overflow, and uses more compact operational dashboard typography.
- Louis noted that Chrome reviewer-smoke should have been used for the deployed UI review; after the Chrome connector was activated, the stable demo was verified in Chrome with reviewer-smoke.

**Implementation checkpoints:**
- `82e93a5 fix: anchor Sparkle Suite public header actions`
- `4ab9fbd feat: add Sparkle Suite referral automation`
- `cda1325 fix: tighten workspace account layout scale`

**Deployment and verification:**
- Stable demo alias: `https://sparkle-suite-demo.vercel.app`
- Current stable target after the layout fix: `https://sparkle-suite-2wz1eso65-louis-2849s-projects.vercel.app`
- Sparkle Suite repo branch: `codex/sparkle-cross-phase-hardening`, currently ahead of origin by 3 local commits.
- Local tests passed for referral and layout work, including `tests/nic-nac-font-scale.test.ts` and `tests/reviewer-smoke-ui.test.ts`.
- `npm run build` passed locally and Vercel preview build passed.
- Chrome reviewer-smoke loaded the stable demo `/start`, opened setup preview, signed out, and reviewed `/nic-nac?conversationId=chrome-layout-qa-account&section=account`.
- Chrome smoke confirmed Account, Referral program, SMS Wallet, and Nic-Nac rendered with no framework overlay, no console errors/warnings, no horizontal overflow, a `1166px` account content width, `380px` Nic-Nac panel, `20px` card titles, `21px` referral code text, and `18px` metric values.
- Chrome screenshot saved to `C:\Users\louis\AppData\Local\Temp\sparkle-suite-account-layout-chrome-crop.png`.

**Open items carried forward:**
- Before launch, live-mode Stripe must be smoke-tested end to end with the production webhook, Vercel secret, required events, checkout flow, and referral credit behavior.
- Push the three local Sparkle Suite commits to GitHub when Louis is ready for the branch backup/deploy-source checkpoint.

---

## June 2, 2026 - Required Nic-Nac Setup Planning

**Topics covered:**
- Sparkle Suite review started from the active local repo workbench `C:\Users\louis\sparkle-suite-repo` on branch `codex/sparkle-cross-phase-hardening`; binder remains memory/instructions only.
- Louis clarified the work target is the logged-in rep workspace after signup, not the public landing page.
- The current `/nic-nac` self-serve setup checklist was judged confusing and visually disconnected from the Sparkle Suite landing page brand polish.
- Product direction changed to a required Nic-Nac setup flow: tiny account creation, Stripe checkout, required Nic-Nac chat setup, then full dashboard unlock.
- Required setup should happen in one chat conversation with Nic-Nac, one question at a time, so reps learn the same interaction model they will use after launch.
- Full dashboard should stay locked until Nic-Nac gets the customer site to a good-looking Sparkle Suite standard.
- Google sign-in should be supported to reduce friction and increase trust; email/password remains a backup path.
- Setup state must persist structurally so reps who close Sparkle Suite resume the same Nic-Nac setup step after signing back in.
- Louis should be notified immediately for setup errors Nic-Nac cannot fix, paid reps blocked before setup completion, and successful payment/light-box ordering tasks.
- Louis is leaning toward Telegram for low-friction alerts.
- Sparkle Suite must collect a shipping address at checkout and create a 24-hour task for Louis to order a light box through Amazon Prime after first payment.
- Trade Board first-run setup is education only; do not require reps to populate trade items before unlocking the dashboard.
- Team management is deferred as an in-workspace add-on and is not part of initial checkout.

**Documents created:**
- Required setup design/spec:
  `C:\Users\louis\sparkle-suite-repo\docs\superpowers\specs\2026-06-02-sparkle-suite-required-nic-nac-setup-design.md`
- Detailed implementation plan:
  `C:\Users\louis\sparkle-suite-repo\docs\superpowers\plans\2026-06-02-required-nic-nac-setup.md`

**Implementation status:**
- No required setup implementation code has been written yet.
- Existing uncommitted state includes the new spec, the new plan, and an earlier `DashboardPlaceholder.module.css` polish change that the new plan supersedes.

**Next expected flow:**
Use `/goal` or a fresh Codex session to execute the implementation plan, preferably with subagent-driven development. Start with preflight guardrails, then batch through durable setup state, tiny signup/Google auth, Stripe shipping/light-box tasks, Nic-Nac setup tools, branded setup UI, and verification.

---

## June 2, 2026

**Topics covered:**
- Recovered the active Sparkle Suite local workbench at `C:\Users\louis\sparkle-suite-repo` from GitHub and confirmed the binder at `C:\Users\louis\sparkle-suite` remains notes/memory only.
- Shifted near-term Sparkle Suite work back to local-first because Codespaces/GitHub OAuth tooling blocked progress for multiple days. GitHub remains the saved source of truth; Codespaces are paused unless Louis explicitly reselects them.
- Continued post-launch landing/signup review on branch `codex/sparkle-cross-phase-hardening` with local preview at `http://localhost:3000/`.
- Removed the landing header nav links for `Customer site`, `Workspace`, and `Pricing`.
- Updated `/start` so the form card uses the Sparkle Suite espresso panel treatment and added a compact `Ask Nic-Nac` button under the form.
- Fixed the first compact Nic-Nac integration bug where the signup page inherited a full-page landing background/min-height.
- Turned both public Ask Nic-Nac buttons pink to match Sparkle Suite primary buttons.
- Expanded public Nic-Nac so it can answer signup-page questions about the form, requested fields, no-card-first step, no charge/customer messaging/provider changes on submit, and next steps after account creation.

**Verification:**
- `npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-landing.test.ts tests/start-page.test.ts` passed with 89 tests.
- `npm run build` passed.
- GitHub push completed for `louis623/sparkle-suite`, branch `codex/sparkle-cross-phase-hardening`, commit `8ca775d feat: polish public signup Nic-Nac flow`.

**Next expected flow:**
Start a fresh Sparkle Suite workspace session from `C:\Users\louis\sparkle-suite-repo`, confirm branch `codex/sparkle-cross-phase-hardening`, open `http://localhost:3000/`, navigate to `/start` if needed, and stand by for Louis's visual review instructions.

---

## June 10, 2026 - fulfillment queue audit

**Topics covered:**
- Audited the Trade Board fulfillment queue process after Louis asked to verify the backend/code wiring and smoke-test it.
- Confirmed the active implementation repo `C:\Users\louis\sparkle-suite-repo` is clean on `codex/sparkle-cross-phase-hardening` and tracking origin.
- Verified the backend path: approving a trade validates rep ownership, calls `rpc_approve_trade`, creates one `trade_fulfillment` row, and the fulfillment queue/status routes use the authenticated paid Nic-Nac context.
- Verified schema/RLS intent in `supabase/migrations/006_sparkle_suite_schema.sql`: `trade_fulfillment` is keyed by request, indexed by request/status, and scoped through request -> listing -> rep.
- Verified Nic-Nac tools and prompt wiring for `get_fulfillment_queue` and `update_fulfillment_status`.
- Verified the dashboard Trade Board panel fetches `/api/nic-nac/fulfillment-queue`, shows the active swap count, and renders the empty state.

**Verification:**
- `npm exec vitest run tests/nic-nac/trade-fulfillment.test.ts tests/nic-nac-fulfillment-queue-route.test.ts tests/nic-nac/trade-requests.test.ts tests/nic-nac-trade-requests-route.test.ts tests/live-show-smoke.test.ts` passed: 37 tests.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts` passed: 59 tests.
- `npm run build` passed.
- Chrome reviewer-smoke used the stable demo `https://sparkle-suite-demo.vercel.app` with the synthetic reviewer workspace tab. The Trade Board fulfillment queue was visible with `0 active swaps` and "No open fulfillment work right now."; no console warnings/errors were present.

**Notes and follow-up:**
- No code changes were made during the audit.
- Direct Chrome navigation to `/api/nic-nac/fulfillment-queue` was blocked by the Chrome extension with `ERR_BLOCKED_BY_CLIENT`; route behavior is covered by local route tests.
- A full mutation smoke was not possible from current stable demo data because the synthetic reviewer workspace had no pending requests or active fulfillment rows.
- Improvement candidate: same-status fulfillment updates currently reset `status_updated_at`; consider making same-status updates a no-op or explicit validation error so aging/nudges cannot be reset accidentally.

---

## June 10, 2026 - fulfillment reviewer-smoke implementation

## June 11, 2026

**Topics covered:**
- Implemented the first-20 founder pricing correction in `C:\Users\louis\sparkle-suite-repo` on `codex/sparkle-cross-phase-hardening`.
- Hardened checkout pricing so reps 1-20 receive founder monthly pricing and rep 21 starts standard monthly pricing.
- Added Supabase founder pricing guards:
  - unique founder sequence indexes for reps/subscriptions
  - atomic checkout pricing assignment RPC
  - unpaid/failed checkout reservation release RPC
  - lowest-available founder slot reuse after abandoned checkout release
- Added `checkout.session.expired` webhook handling so unpaid founder checkout reservations can be released.
- Updated live/test Stripe webhook setup scripts to include `checkout.session.expired`.
- Kept standard pricing from being permanently written to `reps` before payment succeeds.

**Commit pushed:**
- `4aea52b fix: harden founder pricing checkout`

**Preview:**
- Vercel preview deployed: `https://sparkle-suite-m0hk7hofl-louis-2849s-projects.vercel.app`

**Verification:**
- `npm exec vitest run tests/stripe-sparkle-suite-pricing.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/stripe-sync-route.test.ts tests/stripe-create-portal-session-route.test.ts tests/nic-nac-account-billing-route.test.ts tests/services/account-billing.test.ts tests/sparkle-suite-referrals.test.ts tests/sparkle-suite-pricing-referrals-migration.test.ts tests/sparkle-suite-referral-paid-months-migration.test.ts tests/prepare-stripe-demo-price.test.ts tests/prepare-stripe-live-prices.test.ts tests/ensure-stripe-test-webhook-endpoint.test.ts tests/ensure-stripe-live-webhook-endpoint.test.ts tests/smoke-demo-readiness.test.ts` passed: 142 tests.
- `npm run build` passed locally.
- Vercel preview build passed.
- Chrome reviewer-smoke on the preview used the synthetic reviewer workspace, not Louis's personal account. `/start` showed reviewer controls, workspace opened with seeded `Jamie Smoke` / `RG-SMOKE-001 - Reviewer Smoke Ring`, Account/Billing loaded, referral status was visible, and console had no warnings/errors.

**Still open before real paid launch:**
- Apply Supabase migration `20260611133605_ss_founder_pricing_uniqueness.sql` remotely.
- Confirm production domain for live Stripe webhook target.
- Create/verify live Stripe prices for build fee, founder monthly, and standard monthly.
- Create/update live Stripe webhook with `checkout.session.completed`, `checkout.session.expired`, subscription update/delete, and invoice payment events.
- Set matching Vercel production env vars and run live preflight/controlled live checkout smoke with Louis's action-time approval.

---

**Topics covered:**
- Implemented the fulfillment queue audit improvements in `C:\Users\louis\sparkle-suite-repo` on `codex/sparkle-cross-phase-hardening`.
- Added a first-class `/start` reviewer button: `Open workspace preview`.
- Added deterministic dashboard-unlocked reviewer seed data: `Jamie Smoke` requesting `RG-SMOKE-001 - Reviewer Smoke Ring`, with one active fulfillment row reset to `approved` on each reviewer workspace reset.
- Changed same-status fulfillment updates into no-ops that do not rewrite `status_updated_at`, preserving aging/nudge logic.
- Dashboard completion now sends `addToBoard` for completed fulfillment and shows the received-piece next-step prompt.
- Fulfillment status updates now preserve success feedback even if another workspace panel fails to refresh.

**Commits pushed:**
- `8988e7c feat: seed reviewer fulfillment smoke path`
- `e42c251 fix: preserve fulfillment completion feedback`

**Verification:**
- `npm exec vitest run tests/nic-nac/trade-fulfillment.test.ts tests/nic-nac-fulfillment-queue-route.test.ts tests/nic-nac/trade-requests.test.ts tests/nic-nac-trade-requests-route.test.ts tests/live-show-smoke.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/reviewer-smoke-ui.test.ts tests/reviewer-smoke-session.test.ts tests/services/trade-fulfillment-service.test.ts` passed: 117 tests.
- `npm run build` passed.
- Vercel preview deployed: `https://sparkle-suite-duhkm8fzq-louis-2849s-projects.vercel.app`.
- Chrome reviewer-smoke on the preview passed the fulfillment mutation path:
  - `/start` showed `Open workspace preview`.
  - Workspace opened with seeded `Jamie Smoke` / `RG-SMOKE-001` fulfillment item.
  - `Mark shipped` moved status to `shipped`.
  - `Mark completed` moved queue to `0 active swaps`, trade history to `1 completed`, and showed `Fulfillment marked completed. Add the received piece to your board when you are ready.`

**Known blocker:**
- Stable alias was not moved. Supabase CLI `supabase db push --dry-run` still fails with `Cannot find project ref. Have you run supabase link?`; the pending ring-size migration remains unapplied, so preview workspace refresh shows the expected Trade Board refresh warning/console 500 until `trade_listings.ring_size` exists in the remote DB.

---

## June 1, 2026

**Topics covered:**
- Moved Sparkle work toward a cloud-first workflow: GitHub is the main saved source, GitHub Codespaces is the workbench, and the older Windows laptop is primarily the control/review surface.
- Confirmed and smoke-tested Sparkle Suite and Sparkle Finder Codespaces. Both are reachable through Chrome VS Code tabs, can run terminals in `/workspaces/...`, and report 4 CPU cores.
- Hit GitHub's current running Codespaces limit: only two Codespaces can run at once. Standing workflow is Sparkle Suite usually stays running, while Sparkle Finder and Sparkle Rep Onboarding rotate in the second slot.
- Added local guardrails so old local project folders act as Codex chat binders instead of workbenches.
- Converted `C:\Users\louis\sparkle-suite-customer` into a lightweight Sparkle Finder binder. The full old repo was moved intact to `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\sparkle-suite-customer`.
- Converted `C:\Users\louis\britt-with-bling-start-strong` into a lightweight Sparkle Rep Onboarding binder. The full old repo was preserved intact at `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\britt-with-bling-start-strong`.
- Created a full Sparkle Suite archive copy at `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\neon-rabbit-core`.
- Prepared a staged Sparkle Suite binder at `C:\Users\louis\Sparkle-Suite-Binder-Staging\neon-rabbit-core`, but did not swap it into `C:\Users\louis\neon-rabbit-core` because this active Codex session is running from that folder.
- Preserved Sparkle Suite Live Queue Chrome extension safety context. Reps use the Chrome Web Store extension, but local `chrome-extension/`, `dist/`, and `.agents/skills/sparkle-live-queue/SKILL.md` remain protected source/package history.

**Key decisions:**
- Local Codex project folders should be lightweight binders for organization, instructions, and selected markdown memory.
- Actual implementation, builds, tests, commits, and pushes should happen in the matching GitHub Codespace unless Louis explicitly asks for local laptop work.
- Do not delete local archives until Louis has an external backup drive and confirms the archive has been copied there.
- Sparkle Suite local folder swap must happen from a neutral/new Codex chat, not from this active `neon-rabbit-core` session.

**Next expected flow:**
Start a neutral Codex chat and complete the Sparkle Suite binder swap using staged binder `C:\Users\louis\Sparkle-Suite-Binder-Staging\neon-rabbit-core`, original folder `C:\Users\louis\neon-rabbit-core`, and archive `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\neon-rabbit-core`.

---

## May 31, 2026

**Topics covered:**
- Louis clarified that the desired workflow is large batch work through `/goal`, not small chunk-by-chunk management.
- The older Windows laptop was identified as both a speed bottleneck and a local-work risk when multiple serious repos run builds/dev servers at the same time.
- Locked the plain-English safety model: commit saves locally; push backs up to GitHub; Vercel runs deployed sites; Supabase holds app data; the laptop is only the workshop/control surface.
- Agreed that Codespaces or equivalent cloud workspaces are the right next step for parallel heavy repo work once active stopped sessions are safely closed.
- Decided the next rollout should cover three heavy Sparkle repos first: Sparkle Suite, Sparkle Finder, and Sparkle Rep Onboarding. Sparkle Marketing can stay local/lightweight unless it becomes build-heavy.
- Captured repo naming direction: `neon-rabbit-core` to `sparkle-suite`, `sparkle-suite-customer` to `sparkle-finder`, `sparkle-suite-marketing` to `sparkle-marketing`, and `britt-with-bling-start-strong` to `sparkle-rep-onboarding`.
- Clarified Sparkle Finder as the customer/collector hub for the Sparkle Suite ecosystem, not merely a generic discovery tool.

**Next expected flow:**
Louis will finish the three stopped repo sessions one at a time and make sure completed work is pushed to GitHub. After that, run a repo inventory, clean up naming/linking, and stand up GitHub Codespaces for the three heavy Sparkle repos.

---

## March 29, 2026

**Topics covered:**
- Memory architecture finalized
- Open Brain confirmed as Phase 2 priority alongside vault
- GitHub vault created this session
- Redundancy plan established across all tiers
- AI tool philosophy locked — Claude and Gemini equal compatibility, no lock-in
- NotebookLM added to stack as research tool
- Cost analysis completed — full Phase 2 stack runs $164–204/mo, already covered by current clients
- Multitask by default established as standing operating principle
- Master doc update to v1.8 pending
## June 11, 2026 - Live Stripe Preflight Blocker

**Topics covered:**
- Verified the founder pricing implementation in `C:\Users\louis\sparkle-suite-repo` still matches Louis's correction: first 20 paid reps receive founder monthly pricing, and rep 21 starts standard monthly pricing.
- Pulled Vercel Production env to ignored local file `C:\Users\louis\sparkle-suite-repo\.local\vercel-production.env` after Louis approved the pull.
- Ran the Stripe live preflight path; it blocked safely before any live checkout/payment action.
- Reviewed the repo's live Stripe helper scripts. Live price setup and live webhook setup both have explicit approval gates and are designed for idempotent provider setup once live credentials are present.

**Verification:**
- `npm exec vitest run tests/stripe-sparkle-suite-pricing.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/sparkle-suite-pricing-referrals-migration.test.ts tests/sparkle-suite-referrals.test.ts tests/smoke-demo-readiness.test.ts` passed: 103 tests.

**Current blocker:**
- Vercel Production env is not live-billing ready: `STRIPE_SECRET_KEY` is still test-mode; `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, `STRIPE_PRICE_STANDARD_MONTHLY`, and `NEXT_PUBLIC_APP_URL` are empty; live approval marker envs are missing.
- `STRIPE_LIVE_SMOKE_CONFIRMED` is correctly unset until Louis explicitly approves a final controlled live checkout smoke.

---

## June 11, 2026 - Production Self-Serve Signup and Live Checkout Smoke

**Topics covered:**
- Completed the live Stripe setup path for Sparkle Suite production self-serve signup.
- Created/verified live Stripe prices:
  - Build fee: `price_1ThAmIQYwdFOcEdvyAlTox0V` at `$49.99` one-time.
  - Founder monthly: `price_1ThAmIQYwdFOcEdvWmNm96yG` at `$49.99/mo`.
  - Standard monthly: `price_1ThAmJQYwdFOcEdv3HQwDV0V` at `$74.99/mo`.
- Created the live Stripe webhook endpoint for `https://www.yoursparklesuite.com/api/stripe/webhook`.
- Set Vercel Production billing env and enabled `SPARKLE_SELF_SERVE_ENABLED=true`.
- Manually applied and verified Supabase migration `20260611133605_ss_founder_pricing_uniqueness.sql`.
- During live smoke, found production checkout was failing because the route detached Supabase `rpc` from the client object.
- Fixed and pushed `a60ceff fix: preserve Supabase RPC binding in checkout`.
- Deployed production `dpl_58RLxmtyi14FzMx7CM29g3fvn53X` / `https://sparkle-suite-jib4a2a9h-louis-2849s-projects.vercel.app`.
- Live `/start` smoke created synthetic rep `louis+sparkle-live-smoke-1781197885226@neonrabbit.net` and opened live Stripe Checkout without submitting payment.
- Checkout showed expected founder pricing: `$99.98` today, then `$49.99/month`, with line items `Sparkle Suite build fee` and `Sparkle Suite Founding Rep Monthly`.
- Expired the live Checkout Session instead of paying.
- The first expiration webhook attempts failed because production Supabase was missing `20260602150000_ss_stripe_event_processing_status.sql`.
- Manually applied and verified that migration through Supabase SQL editor, sent `NOTIFY pgrst, 'reload schema'`, and replayed the failed live Stripe event.
- Webhook replay returned `200 {"received":true}`; Vercel logs showed `checkout_expired` with `reservation_released:true`.
- Database verification showed the smoke rep has `pricing_tier = null`, `founder_sequence = null`, and Stripe event `evt_1ThC9eQYwdFOcEdvGyukOOiK` is `processed` with no error.

**Verification:**
- `npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/stripe-sparkle-suite-pricing.test.ts` passed: 38 tests.
- `npm run build` passed.
- Production live checkout open-only smoke passed through Stripe Checkout page.
- Live expired-checkout webhook cleanup path passed after applying missing Stripe event-processing RPC migration.

**Remaining caveat:**
- No real live card/payment was submitted. The live Checkout page is open-ready for payments, and the expiration webhook path is verified live. The paid completion/invoice/referral paths remain code/test verified but should be watched closely on the first real paid signup.

---

## June 12, 2026 - Live Trade Swap Workflow and Pressure Test

**Topics covered:**
- Completed a full audit of the Trade Board/trade process, then rebuilt the plan around Louis's clarified live-show flow:
  - Customer buys jewelry to be revealed live.
  - Rep reveals it on the show.
  - Customer dislikes the surprise item and swaps for an existing Trade Board piece.
  - Customer never has the just-revealed item, has no photos, and does not ship anything.
  - Both pieces are physically in the rep's possession.
  - Rep removes/ships the selected Trade Board piece and adds the just-revealed item back to the board.
- Confirmed the correct rep-facing prompt wording: `Which item number was just revealed for the customer?`
- Dropped the idea of matching against Live Queue/current show context for this workflow. Live Queue only scrapes the ordered Bomb Party customer queue and reveal checked-off state; it does not know revealed item numbers or cue IDs.
- Tabled stronger rep notification/alert escalation until Louis can smoke test real timing and research whether immediate live-show trades need more alerting.
- Implemented and pushed the live trade swap workflow:
  - `8cc4916 docs: plan live trade swap workflow`.
  - `a7e283a feat: capture live trade swap replacements`.
  - `f0e573a chore: add trade swap smoke script`.
- Added Supabase migration `20260611190000_trade_swap_revealed_item_capture.sql` for `public.trade_swaps`, including RLS, owner/admin policies, indexes, replacement status tracking, and PostgREST schema reload.
- Applied and verified the migration manually through Supabase Dashboard project `bqhzfkgkjyuhlsozpylf` because CLI linking/auth remains unresolved.
- Added the trade swap service, Nic-Nac tools, prompt/HITL copy, dashboard approval modal, cleanup queue, public/customer wording updates, and Amethyst trade board ring-size mapping.
- Deployed production:
  - Deployment: `dpl_6W9CwLuwJEsJcytPV2eWnuJrfEXE`.
  - Deployment URL: `https://sparkle-suite-auzh791m0-louis-2849s-projects.vercel.app`.
  - Public app verified at `https://www.yoursparklesuite.com`.
- Verified the protected production cleanup route returns the expected unauthenticated response at `https://www.yoursparklesuite.com/api/nic-nac/trade-swap-cleanup`.

**Verification:**
- Focused trade-swap suite passed: 16 test files, 233 tests.
- Public-language/customer board tests passed: 2 files, 87 tests.
- Standard Nic-Nac suite passed: 14 files, 157 tests.
- Tight smoke suite passed: 7 test files, 101 tests.
- `npm run build` passed locally after implementation and after the smoke script commit.
- Vercel production build passed.
- DB-backed smoke script passed:
  - Known non-ring item auto-added back to the board.
  - Known ring without size went to cleanup.
  - Unknown item number went to cleanup.
  - Cleanup queue returned the unresolved swaps.
  - Smoke data cleanup left zero residual rows.
- Production browser UI smoke passed with a synthetic account:
  - Trade Board loaded.
  - Pending request appeared.
  - Approval modal opened with the exact item-number prompt.
  - Unknown item number approval succeeded.
  - Request left the pending list.
  - Swap cleanup showed the after-show action.
  - Fulfillment/history updated.
  - Synthetic data cleanup left zero residual rows.
- Pressure test passed:
  - Parallel approval race allowed exactly one success and cleanly rejected the rest.
  - Repeat approval rejected.
  - Duplicate pending customer request blocked.
  - Lowercase/padded item number normalized.
  - Known ring without size went to cleanup.
  - Known ring with size auto-added with the captured size.
  - Unknown item number captured for cleanup.
  - Cross-rep approval blocked.
  - Blank item number rejected before approval and left request pending.
  - Production UI blank submit was disabled.
  - Rapid double-click submit did not duplicate swaps or fulfillment.
  - Public customer request API returned expected duplicate and validation errors.
  - Backend/UI pressure cleanup left zero residual rows.

**Current state:**
- Active repo is clean and synced with `origin/codex/sparkle-cross-phase-hardening`.
- Current pushed checkpoint is `f0e573a chore: add trade swap smoke script`.
- Production is trade-swap workflow ready for the tested paths.
- Stable demo alias was not changed this session; production was updated.

**Remaining caveats:**
- Real live-show extension timing and multi-device human behavior were not tested directly. Backend concurrency and production UI pressure covered the core duplicate approval risk.
- Stronger rep notification/alert escalation remains tabled pending Louis's real-flow smoke testing and timing research.
- Supabase CLI auth/linking still needs restoration so future migrations do not require Dashboard SQL editor.
- First real paid beta signup still needs monitoring because no real live payment was submitted during billing smoke.
- Fulfillment received-piece link-back remains open.

---

## June 12, 2026 - Support Report Intake and Google Chat Plan

**Topics covered:**
- Planned and implemented support-report intake for Help & Resources and Nic-Nac so beta reps can report site issues, bugs, suggested upgrades, and workflow ideas.
- Kept Help & Resources as the independent fallback path when Nic-Nac itself is confusing, broken, or unavailable.
- Chose Google Chat incoming webhooks as the first alert channel instead of Telegram. The webhook URL is treated as a secret and must be stored in Vercel env as `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL`.
- Added future-dashboard-ready records through `public.support_reports` and an operator API for status filtering/updates.

**Implementation checkpoints:**
- `69d04af feat: add support report intake`.
- `502a0c0 chore: add support report smoke script`.
- Branch `codex/sparkle-cross-phase-hardening` is pushed and synced.
- Latest preview after the smoke-script checkpoint is Ready:
  - `dpl_HwrSVNcY9N5ZfbNQTwY2gEXjvP5u`
  - `https://sparkle-suite-mo2hast69-louis-2849s-projects.vercel.app`

**Verification so far:**
- Focused support-report suite passed: 8 files, 35 tests.
- `npm run build` passed locally after the smoke-script addition.
- Vercel preview build passed.
- `npm run smoke:support-report` correctly blocked before data writes because local `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` is not configured.

**Remaining before completion:**
- Louis needs to create a Google Chat incoming webhook and store it in Vercel as `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` for Production and preferably Preview.
- Supabase migration `20260612100000_support_reports.sql` still needs to be applied to project `bqhzfkgkjyuhlsozpylf`; CLI remains unlinked, so Dashboard SQL editor is still the expected path unless CLI auth/linking is repaired first.
- After those two external setup steps, run `npm run smoke:support-report`, verify Google Chat receives the synthetic report alert, deploy/promote to production, and run final smoke against production.

---

## June 12, 2026 - Support Report Intake Completed

**Production completion:**
- Created Google Chat space `Sparkle Suite Support Reports` and configured the `Sparkle Suite Reports` incoming webhook.
- Rotated the first webhook after it appeared in an automation DOM read; the fresh webhook was stored in Vercel and the clipboard was cleared after use.
- Added Vercel env `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL`:
  - Production.
  - Preview scoped to `codex/sparkle-cross-phase-hardening`.
- Applied and verified Supabase migration `20260612100000_support_reports.sql` in project `bqhzfkgkjyuhlsozpylf`.
- Production deployment:
  - `dpl_Gj9u8FvFs83j4tBDww4qCmKsSnHm`.
  - `https://sparkle-suite-6es8y9mh5-louis-2849s-projects.vercel.app`.
  - Aliases include `https://www.yoursparklesuite.com`, `https://yoursparklesuite.com`, `https://sparkle-suite.vercel.app`, and project aliases.

**Verification:**
- Supabase verification returned `table=true | rls=true | columns=20 | policies=support_reports_admin_full_access,support_reports_own_select | no_rep_insert=true | indexes=idx_support_reports_rep_created,idx_support_reports_status_urgency_rank_created,support_reports_pkey`.
- Vercel env list shows `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` as encrypted for Production and Preview branch `codex/sparkle-cross-phase-hardening`.
- `npm run smoke:support-report` passed with `notification=delivered`, `google_chat_configured=true`, and `cleanup=true`.
- Synthetic smoke report `51d793a5-0a20-4f97-99ef-2929bd6d9144` was verified removed: `support_smoke_residual_count=0`.
- Vercel production build passed.
- Production API route checks:
  - `POST https://www.yoursparklesuite.com/api/nic-nac/support-reports` returns `401` unauthenticated.
  - `GET https://www.yoursparklesuite.com/api/control-center/support-reports` returns `401` unauthenticated.

**Current state:**
- Active repo `C:\Users\louis\sparkle-suite-repo` is clean and synced with `origin/codex/sparkle-cross-phase-hardening`.
- Current pushed checkpoint: `502a0c0 chore: add support report smoke script`.
- Support report intake is production-ready for Help & Resources form, Nic-Nac tool submissions, dashboard-ready storage, and Google Chat delivery.

---

## June 12, 2026 - Support Report Form Entry UX Fix

**Issue:**
- Louis refreshed the demo account and saw the Support Path section with button-like quick-action chips, but no obvious clickable way to pull up the report form.
- Root cause: the quick-action chips in Support Path were static text, while the actual form was lower in the section.

**Fix:**
- Replaced the misleading static quick-action row with a clear `Send a report to support` callout.
- Added a real `Start report` button that scrolls/focuses the support report form title field.
- Kept the full report form in Help & Resources and preserved the Nic-Nac-independent fallback path.

**Verification and deployment:**
- Focused Help & Resources regression passed: 1 file, 4 tests.
- Focused support/dashboard suite passed: 6 files, 85 tests.
- `npm run build` passed locally.
- Deployed production:
  - `dpl_AGEtbyJXSckPU6AJHZC8JycVGesf`.
  - `https://sparkle-suite-kvlid78g9-louis-2849s-projects.vercel.app`.
  - Public app aliases include `https://www.yoursparklesuite.com`.
- Current pushed checkpoint: `0d871e7 fix: clarify support report form entry`.

---

## June 12, 2026 - Support Report End-to-End Demo Check

**What changed during verification:**
- Found the stable demo alias `https://sparkle-suite-demo.vercel.app` was still pointing at the June 10 preview `dpl_BBUswPb5yksSADfMEr41ZRtq8wig`, which predated support-report intake and the UX fix.
- Repointed the stable demo alias to today's preview `dpl_4oTDBVaXzu9CdoGZZC7J6WvNncFW` / `https://sparkle-suite-dpvm5rn6z-louis-2849s-projects.vercel.app`.
- Confirmed production still points at `dpl_AGEtbyJXSckPU6AJHZC8JycVGesf` / `https://sparkle-suite-kvlid78g9-louis-2849s-projects.vercel.app`.

**End-to-end verification:**
- Stable demo reviewer workspace opened through Chrome reviewer-smoke; no personal Louis account was used.
- Help & Resources loads with collapsed workflow sections and clear `Open section` indicators.
- Support Path expands and shows the new `Send a report to support` callout plus real `Start report` button.
- `Start report` scrolls/focuses the `Short title` input.
- Synthetic Help form submission succeeded in the live demo UI with `Report saved. Support has the details.`
- Supabase verified the synthetic Help form row with `source=help_form`, `report_type=bug`, `status=open`, `notification_status=delivered`, `notification_error=null`, and `contact_ok=false`; the row was cleaned up.
- Operator support-report service verified the row appeared in the open queue, could be moved to `reviewing`, and was cleaned up.
- Production unauthenticated route protection still returns `401` for both `/api/nic-nac/support-reports` and `/api/control-center/support-reports`.
- Nic-Nac live tool path was tested through the deployed reviewer workspace. It created a `source=nic_nac` support report, delivered Google Chat, persisted the assistant completion, and the synthetic row was cleaned up.

**Caveat found:**
- During the live Nic-Nac browser submission, the server completed and persisted the assistant reply (`Report saved... Louis notified.`), but the active chat panel did not render that final assistant message until the page was reloaded. After reload, the response was visible and the input was enabled. Track this as a Nic-Nac streaming/hydration polish item; the report delivery path itself worked.

---

## June 12, 2026 - Nic-Nac Tool Report Stream Recovery Polish

**Fix:**
- Added client-side recovery for Nic-Nac conversations that remain in `submitted` or `streaming` after a server-side tool run has already completed.
- The chat panel now polls conversation state after a short timeout, detects a completed assistant message after the latest local user message, merges the saved server message into the active chat, stops the stale stream, hides the thinking indicator, and refocuses the input.
- Added regression coverage for completed-assistant-after-latest-user detection and component wiring.

**Deployment:**
- Current pushed checkpoint: `4ef57bb fix: recover completed Nic-Nac streams`.
- Production deployment: `dpl_2ZYXiBykKP4a3wLWMuoe2SXD4CkT` / `https://sparkle-suite-cwrfjue9o-louis-2849s-projects.vercel.app`.
- Stable demo alias now points at preview deployment `dpl_Lh1fTTsAfXQF4ShXEdrbEaKLaPEo` / `https://sparkle-suite-o3hqf93no-louis-2849s-projects.vercel.app`.

**Verification:**
- Focused Nic-Nac/support report suite passed: 7 files, 66 tests.
- `npm run build` passed locally.
- Production and preview Vercel builds passed, and stable demo alias was inspected after update.
- Live stable-demo Nic-Nac smoke created synthetic report `1ee07cdb-42f1-4fed-80cb-c605ef30aaed` with `source=nic_nac`, `notification_status=delivered`, and `notification_error=null`.
- Matching conversation `90124e70-bac8-4aa3-8bb6-f211bf1c7ab6` persisted a completed assistant response containing `Report filed... notification delivered to Louis... this response is now live in chat.`
- The synthetic support report row was cleaned up and verified removed.

**Remaining note:**
- Chrome automation could claim the active demo tab and confirm the correct URL, but DOM/screenshot capture timed out on that long-lived conversation tab after the smoke. Server-side completion and cleanup were verified directly; future visual checks can reload the demo conversation if Chrome capture stalls.

---

## June 12, 2026 - Support Command Center and Support Auditor

**What changed:**
- Built the v1 Support Command Center and made `/control-center` the internal support landing page instead of redirecting to old intake.
- Added canonical `client_account_profiles`, `support_audits`, and `support_lessons` tables.
- Extended `support_reports` with client snapshots, audit status/timestamps/errors, and resolution snapshots.
- Added `Support Auditor`, which runs directly after each support report, gathers report/profile/history/lesson facts, stores an audit row, and sends one enriched Google Chat alert after audit completion or fallback.
- Enriched Google Chat alerts now include client name, show name, phone, email, issue summary, Support Auditor status, findings, and recommended first action.
- Added reusable support lessons on resolution closeout for the future dashboard workflow.
- Hardened the support smoke to verify profile creation, report snapshot, audit completion, Google Chat delivery, reusable lesson creation, and cleanup.

**Operational fixes during verification:**
- Supabase migration `20260612172908_support_command_center_auditor.sql` was applied manually through Supabase Dashboard SQL editor because CLI linking remains unresolved.
- Remote verification passed in project `bqhzfkgkjyuhlsozpylf`: new tables exist, RLS is enabled, seven new support report columns exist, and expected policies/indexes are present.
- Found Vercel Production had `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` present but empty; replaced it with the Google Chat webhook value and redeployed so production alerts work.
- Fixed `client-account-profiles` to use real production subscription fields `plan_tier` / `pricing_tier` instead of nonexistent `subscriptions.tier`.

**Verification and deployment:**
- Focused support suite passed: 12 files, 50 tests.
- `npm run build` passed locally after the production-field fix.
- DB-backed support smoke passed: `notification=delivered`, `profile=true`, `audit=completed`, `lesson=true`, `cleanup=true`.
- Stable demo Help & Resources UI smoke passed through Chrome: Support Path expands, report form appears, and synthetic UI submission showed `Report saved. Support has the details.`
- Supabase verified the UI-submitted synthetic report with `notification_status=delivered`, `audit_status=completed`, completed audit row, client snapshot present, and cleanup complete.
- Branch pushed to `origin/codex/sparkle-cross-phase-hardening`.
- Production deployment: `dpl_HqowEV7A7hKgytjz32aDNSgbqQxX` / `https://sparkle-suite-sjcx33xt3-louis-2849s-projects.vercel.app`.
- Public aliases on the deployment include `https://www.yoursparklesuite.com`, `https://yoursparklesuite.com`, and `https://sparkle-suite.vercel.app`.
- Stable demo alias updated to the same deployment: `https://sparkle-suite-demo.vercel.app`.
- Current pushed checkpoint: `597e5c4 fix: align support smoke with production env`.

**Remaining caveats:**
- Supabase CLI auth/linking still needs restoration so migrations can move through CLI instead of Dashboard SQL editor.
- First real paid beta signup still needs monitoring.
- The Support Command Center resolution panel is intentionally display-only for v1; editable operator workflows can come with the fuller dashboard rebuild.

---

## June 12, 2026 - Support System Pressure Test

**Pressure test added and run:**
- Added `npm run pressure:support-system`.
- The pressure script creates 3 synthetic reps and 14 synthetic support reports, runs them through the real Supabase-backed support services, uses a local capture webhook to avoid spamming Google Chat, verifies 14 completed audits, verifies 14 captured alert payloads, forces 1 webhook failure, creates 1 reusable support lesson, exercises operator list/status/resolution paths, and cleans all synthetic rows.
- Pressure run passed twice with: `reps=3 reports=14 alerts=14 audits=14 notification_failures=1 lessons=1 cleanup_residuals=0`.

**Failure found and fixed:**
- Stable demo browser check found Support Path could still show as a collapsed generic disclosure row without exposing the support form, recreating Louis's original "nothing's clickable" concern in some live states.
- Fixed by making the Support Path `<details>` open by default so `Send a report to support`, `Start report`, fields, and `Send report` are visible without depending on the disclosure click.
- Added regression coverage asserting Support Path is default-open.

**Verification and deployment:**
- Expanded focused support regression suite passed: 15 files, 117 tests.
- `npm run build` passed locally.
- Production deployment: `dpl_B4WwrW71eXUN6E1nq2SL5uXUuTE4` / `https://sparkle-suite-my21lhpsy-louis-2849s-projects.vercel.app`.
- Public aliases include `https://www.yoursparklesuite.com`, `https://yoursparklesuite.com`, and `https://sparkle-suite.vercel.app`.
- Stable demo alias now points to this deployment.
- Final stable demo Chrome check passed: Help & Resources shows Support Path with `Send a report to support`, `Start report`, `Short title`, `Details`, and `Send report` visible immediately.
- Current pushed checkpoint: `2f7e0c8 chore: pressure test support system`.

---

## June 12, 2026 - Support Workflow Gate Copy

**What changed:**
- Clarified Help & Resources Support Path copy after Louis said the prior instructions felt vague/fake and should not assume reps know professional support workflow.
- Support Path now tells reps to start at the top of Help & Resources, open the relevant workflow guide, follow the applicable steps, and ask Nic-Nac if still blocked before submitting.
- Support form heading is `Submit a support report`.
- Added a required workflow-first checkbox confirming the rep started at the top of Help & Resources, used the relevant workflow guide, followed applicable steps, and still needs support.
- Removed casual gendered language concerns from the support workflow wording.

**Verification and deployment:**
- Focused support copy/regression tests passed.
- `npm run build` passed locally.
- Current pushed checkpoint: `d2cd203 fix: clarify support report workflow gate`.
- Production deployment: `dpl_3qYAoEcftAKq9VFBWGXWZsWzVzVd` / `https://sparkle-suite-3jlon2lad-louis-2849s-projects.vercel.app`.
- Stable demo alias was updated to the same deployment before the later dashboard-link deployment superseded it.

---

## June 12, 2026 - Permanent Dashboard Link

**What changed:**
- Added a friendly permanent dashboard route at `/dashboard`.
- `/dashboard` redirects to `/control-center`, keeping the Support Command Center as the single source of truth while giving Louis a memorable link.
- Follow-up fix after Louis reported the permanent link opened Neon Rabbit HQ:
  - Root cause was Supabase Auth URL Configuration, not the Next.js route: Supabase `SITE_URL` was still `https://neon-rabbit-hq.vercel.app`.
  - Updated Supabase Auth `SITE_URL` to `https://www.yoursparklesuite.com`.
  - Added Sparkle Suite redirect URL wildcards:
    - `https://www.yoursparklesuite.com/**`
    - `https://yoursparklesuite.com/**`
    - `https://sparkle-suite.vercel.app/**`
    - `https://sparkle-suite-demo.vercel.app/**`
  - Left the old HQ redirect wildcard in place for now to avoid breaking any legacy flow tied to the shared Supabase project; the default Site URL no longer points to HQ.
  - Added app-side login redirect preservation so `/control-center` sends unauthenticated users to `/login?redirect=%2Fcontrol-center`.

**Verification and deployment:**
- Focused redirect test passed: `tests/dashboard-page.test.ts`.
- `npm run build` passed locally and Vercel production build passed.
- Current pushed checkpoint: `e8d8632 feat: add permanent dashboard link`.
- Production deployment: `dpl_9vyzrTUdukkihrq3bbDnFbn5bZg7` / `https://sparkle-suite-i0wjd7bhh-louis-2849s-projects.vercel.app`.
- Stable demo alias updated: `https://sparkle-suite-demo.vercel.app`.
- HTTP checks confirmed both `https://sparkle-suite-demo.vercel.app/dashboard` and `https://www.yoursparklesuite.com/dashboard` return `307` to `/control-center`.
- Follow-up checkpoint: `acb2866 fix: preserve control center login redirect`.
- Follow-up production deployment: `dpl_1263MMazGNtj5asngnGfazcVnXGi` / `https://sparkle-suite-kf9ahff5v-louis-2849s-projects.vercel.app`.
- Stable demo alias updated to the follow-up deployment.
- Post-fix HTTP check confirmed `https://www.yoursparklesuite.com/dashboard` routes to `/control-center`, then `/login?redirect=%2Fcontrol-center`.
- Chrome check confirmed the public dashboard link lands on Sparkle Suite login with no HQ content.

---

## June 12, 2026 - Workspace Blank Panel Incident

**Issue found:**
- Louis reported the Sparkle Suite demo workspace was broken: clicking Trade Board, Calendar, and other dashboard sections left the center panel blank.
- Chrome inspection confirmed the center workspace section existed but rendered no content.
- Root cause had two parts:
  - The dashboard gated section content on `hasPaidWorkspace`; if account billing failed or had not resolved, paid sections rendered nothing.
  - `/api/nic-nac/account-billing` was returning `500` for the demo account, even though Trade Board and related workspace data endpoints were returning `200`.

**Fix completed:**
- Added a visible workspace access fallback so locked/loading sections show clear account guidance instead of a blank panel.
- Hardened account billing so optional Stripe billing-detail or referral-summary lookup failures no longer block subscription/access status.
- Current pushed checkpoints:
  - `4240396 fix: prevent blank locked workspace sections`
  - `84ebca7 fix: keep workspace access when billing details degrade`

**Verification and deployment:**
- Focused tests passed: `tests/services/account-billing.test.ts` and `tests/nic-nac-dashboard-placeholder.test.ts` with 70 tests.
- `npm run build` passed locally and Vercel production build passed.
- Final production deployment: `dpl_5Qwqc4EL6fUkWpRQzRcWkC2Ei7mt` / `https://sparkle-suite-5md5qf0f5-louis-2849s-projects.vercel.app`.
- Stable demo alias updated to the fixed deployment: `https://sparkle-suite-demo.vercel.app`.
- Chrome smoke on Louis's demo tab verified Trade Board, Jewelry Library, Calendar, Site Settings, Help & Resources, and Account all render visible center content with no console errors.
- Vercel logs confirmed `/api/nic-nac/account-billing` now returns `200`; the new warning is expected when optional details degrade and no longer blocks workspace access.

---

## June 13, 2026 - Mile High Fizz Sparkle Suite Shell

**What changed:**
- Built the Mile High Fizz tenant attachment path in the active Sparkle Suite repo without moving DNS or changing the live Ready.ai site.
- Added Lindsey / Mile High Fizz production tenant wiring:
  - Rep id: `f82734fd-6964-42c7-b67d-c2445528c3b4`
  - Email: `lindseychapman1188@gmail.com`
  - Public slug: `milehighfizz`
  - Custom domain reserved in Sparkle Suite: `milehighfizz.com`
  - Live Queue sync code: `MHF-9446`
- Added friendly customer routes for the Sparkle Suite shell:
  - `/milehighfizz`
  - `/milehighfizz/trade`
- Confirmed this uses the standard shared Sparkle Suite Trade Board; there is no custom one-off board.
- Hid the Join Team customer surface for phase one when `show_join_page=false`, including header/footer links.
- Added friendly slug link rewriting so customer Home/Trade Board links stay on `/milehighfizz` and `/milehighfizz/trade`.

**Verification:**
- Production Supabase read-back confirmed rep, site settings, active workspace gate, onboarding status, and live queue.
- Follow-up audit corrected the production rep row so `custom_domain=null`; the active customer link is the Sparkle Suite slug until cutover.
- Workspace customer site and Trade Board preview links were tightened to prefer `/milehighfizz` and `/milehighfizz/trade` when a public slug exists.
- Lindsey temporary login was verified through Supabase Auth; the password is not stored in binder notes.
- Focused tests passed after audit tightening: 7 files, 114 tests.
- `npm run build` passed locally.
- Local Playwright screenshots verified the homepage and Trade Board render with Mile High Fizz identity, standard empty Trade Board shell, and no visible Join Team nav.

**Caveats:**
- Code is implemented locally on `codex/sparkle-cross-phase-hardening` but not yet pushed or deployed from this checkpoint.
- DNS/domain cutover has not happened; `https://milehighfizz.com/` should stay on Ready.ai until Louis explicitly says to move it.
- Ready.ai assets and transferred email/SMS signups are still future migration work.

---

## June 15, 2026 - Customer-Site Skin Precedence Incident

**What happened:**
- Louis repeatedly reported that changing the customer-facing site skin in the Sparkle Suite workspace did not change the deployed live preview or customer-facing site.
- Earlier verification was too shallow and created a frustrating loop: the workspace save path looked healthy, but the stable demo customer route still rendered Amethyst.

**Root cause:**
- `loadAmethystPreviewTemplateData` was applying stale required-setup draft answers over saved `site_settings` even after the setup session was `dashboard_unlocked`.
- Louis's Fizz Fest had saved `site_settings.appearance_preset='amber'`, while stale setup answers still had `site_skin.selectedLook='AM-01'`.
- The public template emitted `preset:"amethyst"` from the stale setup answer, so the customer site ignored the saved workspace skin.

**Fix and deployment:**
- Fixed the precedence rule so required-setup draft answers only influence public template data while setup is active, not after dashboard unlock.
- Related checkpoint: `0b1563c fix: honor saved customer site skin after setup`.
- Deployment: `dpl_7Hg2Wk43ow7hCJoWPHucUq8Z33AF` / `https://sparkle-suite-jwth5hebr-louis-2849s-projects.vercel.app`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app`.

**Verification that passed:**
- Focused tests passed across public template and Site Settings routes: 7 files, 104 tests.
- `npm run build` passed.
- Stable demo template endpoint changed from `preset:"amethyst"` before the fix to the saved preset after the fix.
- Synthetic reviewer save path saved `black_diamond`; public template returned `black_diamond` instead of Amethyst.
- Stable slug HTML used the rep-scoped `data-template-src`.
- Rendered screenshot was captured at `C:\Users\louis\AppData\Local\Temp\sparkle-louisfizzfest-afterfix.png`.

**Lesson logged:**
- Customer-facing settings fixes must be verified on the exact stable-demo route Louis uses, not just local, API, or raw preview checks.
- For theme/skin bugs, always compare saved Site Settings against required-setup/session state so stale onboarding answers cannot silently win.
- Dedicated lesson file: `docs\sparkle-suite\lessons\2026-06-15-customer-site-skin-precedence.md`.

---

## June 15, 2026 - Sparkle Suite Polish Closeout and Stable Demo Handoff

**What changed this session:**
- Cleaned seeded/demo jewelry records out of the Sparkle Suite Finder catalog source so Sparkle Finder no longer receives the leaked demo items through `/api/public/finder/catalog`.
- Fixed the customer-facing site skin persistence bug where saved workspace Site Settings were overridden by stale required-setup answers after `dashboard_unlocked`.
- Preserved the product decision that Sparkle Suite workspace styling stays on the standard Sparkle Suite workspace look, while the customer-facing site skin remains editable from Site Settings.
- Removed the floating bottom-right Site Settings save dock after Louis reviewed it and decided it felt clunky.
- Moved `Save site settings` into the Site Settings card header with the save status beside it.

**Key decisions:**
- Louis reviews Sparkle Suite demo work at `https://sparkle-suite-demo.vercel.app/`; raw Vercel preview URLs are supporting evidence only.
- Future customer-facing theme/skin fixes must prove the exact deployed live preview/customer route after save, not only local state or API payloads.
- Site Settings uses explicit manual save, not auto-save, for public/customer-facing changes.
- The save control belongs on the Site Settings screen where the edits happen, not floating globally over the workspace.

**Current repo/deploy state:**
- Active repo: `C:\Users\louis\sparkle-suite-repo`.
- Branch: `codex/sparkle-cross-phase-hardening`.
- Current pushed checkpoint: `a440944 fix: move site settings save into settings header`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app/`.
- Current stable demo target: `https://sparkle-suite-ni9tlg2a6-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_DuW2PuoQfYFiZjrAqRpYbhbia7nN`.
- Active repo was clean and synced with origin after the closeout.

**Verification completed:**
- Finder catalog cleanup verified that seeded/demo records were removed and legitimate uploaded jewelry such as `ER76003 / The Elodie Luxe` remained.
- Customer-site skin fix verified that saved Site Settings win over stale setup answers after dashboard unlock.
- Focused Site Settings/dashboard regression passed: 1 file, 68 tests.
- Local `npm run build` passed.
- Vercel preview build passed.
- Stable demo reviewer-smoke verified the Site Settings header save action:
  - `No unsaved changes.` appears beside the header button initially.
  - Editing a setting changes status to `Unsaved changes.` and enables `Save site settings`.
  - Saving changes status to `Site settings saved.` and disables the button again.
  - No floating save dock remained.
  - No console warnings/errors were seen during the tested flow.

**Continuation guidance:**
- New sessions should start from binder/Open Brain bridge at `C:\Users\louis\sparkle-suite`, then use `C:\Users\louis\sparkle-suite-repo` for implementation only after Louis gives a concrete task.
- Use reviewer-smoke/synthetic sessions for logged-in stable-demo workspace checks, not Louis's personal account.
- Continue polishing/editing Sparkle Suite only when Louis gives the next specific item.

---

## June 15, 2026 - Nic-Nac Trade Board Intake Regression and Smoke-Test Gap

**What happened:**
- Louis repeatedly hit the same failure while trying to add `ER13229 / The Florence Earrings` to the Trade Board and jewelry database through Nic-Nac.
- Nic-Nac confused a label/details photo with a customer-facing jewelry photo and criticized it as though it were the boxed display jewelry shot.
- After Louis corrected Nic-Nac with language like "I didn't give you any photos. I only gave you a photo with a label in it," Nic-Nac dropped the add-listing workflow and incorrectly claimed he could not add listings from chat.

**Root cause found during debugging:**
- The active tool router did not treat that correction sentence as a Trade Board continuation.
- The turn fell back to `memory` intent, which removed `add_listing` from the active tool list.
- Once `add_listing` was unavailable, the model produced the bad manual-workaround answer.
- A conflicting prompt section also still let a label/details photo be described as a boxed display photo if jewelry was visible somewhere in the frame.

**Work in progress in the active repo:**
- Active repo: `C:\Users\louis\sparkle-suite-repo`.
- Branch: `codex/sparkle-cross-phase-hardening`.
- Current working tree has uncommitted changes in:
  - `lib/nic-nac/tools/index.ts`
  - `lib/nic-nac/prompt-builder.ts`
  - `lib/nic-nac/system-prompt.ts`
  - `tests/nic-nac/tool-routing.test.ts`
  - `tests/nic-nac/prompt-routing.test.ts`
  - `tests/nic-nac/system-prompt-add-listing.test.ts`
- Added deterministic regression coverage for the exact correction path; before the fix it returned `['memory']` instead of keeping Trade Board tools active.
- Latest verification before pausing:
  - Targeted regression files passed: 3 files, 52 tests.
  - Full Nic-Nac suite passed: 77 files, 579 tests, 1 skipped.
  - `npm run build` passed.

**Smoke-test issue:**
- Prior verification was too shallow. It checked prompt strings, tests, build, stable alias, and health, but did not replay the actual logged-in Nic-Nac add-listing conversation end-to-end.
- A true smoke must use a synthetic/reviewer rep session, the real chat route/UI or real `/api/nic-nac`, real uploaded image parts, and the actual model/tool loop.
- Local Next server startup from Codex hit Windows/session barriers (`spawn EPERM` for `next dev`, and PowerShell background-job permission issues), so stable-demo/reviewer-smoke browser automation is the preferred path.

**New QA direction:**
- Create a local fixture folder, recommended path: `C:\Users\louis\sparkle-suite-smoke-assets`.
- Store test images such as:
  - `ER13229-label.jpg`
  - `ER13229-jewelry-boxed-front.jpg`
  - bad/edge-case examples for coached retakes.
- Store `cases.txt` with item details and expected behavior.
- Codex should use browser/Chrome automation and reviewer-smoke/synthetic accounts to act like a rep, upload those files, and rerun the same flows until Nic-Nac behaves correctly.
- Capped real model calls are needed for final confidence because the failure is in the live LLM/tool loop, not only deterministic code.

---

## June 16, 2026 - Nic-Nac ER13229 Workflow Truth Hardening

**What changed:**
- Implemented the Trade Board workflow truth fix for the latest `ER13229 / The Florence Earrings` failure.
- Added regression coverage for the exact live failure shape:
  - `search_jewelry_database` found `ER13229`, but workflow state did not learn the catalog truth.
  - The confirmation sentence `That is correct. This is the July Birthday collection, 2026.` previously parsed as `collectionName: "ection"`.
  - `add_listing` previously let stale workflow readiness veto a valid current tool call with `itemNumber`, collection, and confirmed jewelry-front photo.
- Created `lib/nic-nac/workflows/trade-board-known-fields.ts` so known-field extraction and catalog tool-output ingestion live outside the route context.
- Added `computeTradeBoardAddAttemptReadiness` so `add_listing` still enforces photo-role safety but lets current tool input complete stale workflow facts before service-level validation.
- Added an `ER13229` live-sequence fixture for the required rep-like turn order and hard-fail phrases.

**Implementation checkpoints in active repo:**
- `eb2816d fix: sync trade board workflow with catalog truth`
- `23effe6 fix: allow valid add listing attempts from current input`
- `867e240 test: capture ER13229 live intake sequence`
- `6f7c93b fix: type catalog tool part extraction`

**Verification completed locally:**
- Focused tests passed: `tests/nic-nac/trade-board-intake-route-context.test.ts`, `tests/nic-nac/trade-board-intake-controller.test.ts`, `tests/nic-nac/add-listing-recovery.test.ts`, `tests/nic-nac/trade-board-intake-live-sequence.test.ts` — 4 files, 53 tests.
- Full Nic-Nac suite passed: 86 files passed, 1 skipped; 629 tests passed, 1 skipped. Vitest printed worker-termination timeout warnings after the passing run.
- `npm run build` passed after a TypeScript cast cleanup in catalog tool-part extraction.

**Still not proven fixed:**
- `C:\Users\louis\sparkle-suite-smoke-assets` does not currently contain `ER13229-label.jpg` or `ER13229-jewelry-boxed-front.jpg`.
- `scripts/smoke-nic-nac-trade-board-intake.ts` is still a parser/stub and reports `not_implemented_for_live_calls`.
- No model-in-loop replay, browser reviewer-smoke, deployed stable-demo smoke, or database assertion has been completed for this new fix yet.

**Next required steps before saying fixed:**
- Push and deploy the new commits to the stable Sparkle Suite demo target.
- Add or locate the ER13229 smoke fixture photos.
- Implement or finish the real `smoke:nic-nac:trade-board-intake` replay so it uploads real image parts and checks tool calls, final text, workflow completion, listing database state, and hard-fail phrases.
- Run the replay three consecutive times and run one stable-demo reviewer-smoke pass against `https://sparkle-suite-demo.vercel.app/`.

**Later update in same session:**
- Added active repo checkpoint `057bc64 chore: add Nic-Nac trade board smoke replay`.
- `scripts/smoke-nic-nac-trade-board-intake.ts` is no longer a parser/stub. It signs in the demo rep, posts real `/api/nic-nac` turns with image data parts, checks assistant hard-fail phrases, observes `search_jewelry_database` and `add_listing`, verifies workflow/listing DB state, and soft-removes smoke listings by default.
- Re-verified after the replay harness: focused Nic-Nac + smoke-script tests passed (5 files, 57 tests), full Nic-Nac suite with the smoke-script test passed (86 files passed, 1 skipped; 631 tests passed, 1 skipped), and `npm run build` passed.
- `npm run smoke:nic-nac:trade-board-intake` now reaches the real harness and fails safely with `status: "missing_assets"` because `C:\Users\louis\sparkle-suite-smoke-assets` still lacks `ER13229-label.jpg` and `ER13229-jewelry-boxed-front.jpg`.
- Remaining proof gap: no model-in-loop replay, browser reviewer-smoke, deployed stable-demo smoke, or database assertion has completed yet because the fixture photos are missing.

**Final update in same session:**
- Found the real ER13229 label/details photo beside Louis's boxed jewelry photo and created the canonical fixture folder `C:\Users\louis\sparkle-suite-smoke-assets` with:
  - `ER13229-label.jpg`
  - `ER13229-jewelry-boxed-front.jpg`
  - `cases.txt`
- Added and pushed additional smoke-harness checkpoints:
  - `7362be7 chore: default Nic-Nac smoke to reviewer account`
  - `22e4a98 chore: target stable demo in Nic-Nac smoke`
  - `d67a342 chore: use uuid conversations in Nic-Nac smoke`
  - `60152d2 chore: clean ER13229 smoke listings before replay`
- Stable demo alias now points to the final verified app deployment: `https://sparkle-suite-demo.vercel.app` -> `https://sparkle-suite-cqjhr6sif-louis-2849s-projects.vercel.app`.
- Stable-demo ER13229 replay smoke passed three consecutive model/tool/API runs, then passed once more after the final alias update, and once more after clean-state harness hardening. Each pass used reviewer-smoke workspace `sparkle-reviewer+preview@neonrabbit.net`, real `/api/nic-nac`, real image data parts, `search_jewelry_database`, `add_listing`, workflow/listing DB verification, hard-fail phrase gates, and smoke listing cleanup.
- Active repo `C:\Users\louis\sparkle-suite-repo` is clean and synced with origin on `codex/sparkle-cross-phase-hardening` through `60152d2`.

---

## June 16, 2026 - Public Site Context Routing Hardening

**What happened:**
- After the Nic-Nac ER13229 flow finally added `The Florence Earrings` to the workspace Trade Board, Louis found the customer-facing public site still showed stale/default inventory instead of the newly added listing.
- Screenshot comparison showed the workspace board had `ER13229 / The Florence Earrings` with the boxed earrings photo, while the public Trade Board page showed a seeded/default item such as `Birthday Bloom Ring`.

**Root cause:**
- The customer route could render with the correct initial slug/rep context, but client-side public API refreshes could call `/api/amethyst/trade-board` without the same target identity.
- When target identity was lost, the public page could fall back to demo/default data instead of failing closed for the intended rep.

**What changed:**
- Added a shared public-site request target contract in `lib/amethyst/request-rep-target.ts`.
- Public routes now resolve `c`/`repId`, `publicSiteSlug`, slug path/referrer context, and real custom domains through the same helper.
- Template runtime context now preserves both `repId` and `publicSiteSlug`.
- Public browser code now merges that runtime context into Trade Board refreshes, trade requests, signup/audience actions, and unsubscribe requests.
- Targeted loaders now fail closed rather than silently showing default/demo data when rep context cannot be resolved.
- Public trade request submission can verify the listing belongs to the expected rep before the RPC submit path.
- Canonical platform hosts such as `yoursparklesuite.com` and `www.yoursparklesuite.com` are excluded from rep custom-domain matching.

**Implementation checkpoint:**
- `68fc332 fix: harden public site context routing`
- Branch: `codex/sparkle-cross-phase-hardening`
- Active repo: `C:\Users\louis\sparkle-suite-repo`

**Verification and deploy:**
- Focused public-site/trade-request regression suite passed: 24 files, 175 tests.
- `npm run build` passed.
- Vercel preview build passed.
- Stable demo alias now points to `https://sparkle-suite-1k5a4e5xv-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_EopEe8p6QKN6ZTqGdUoFnFH3DaWM`.
- Stable demo root returned Sparkle Suite HTML after alias promotion.
- Louis ran a light manual smoke on `https://sparkle-suite-demo.vercel.app` and reported that everything seemed to be working.

**Lessons carried forward:**
- Public-site/workspace plumbing is not a place for one-off patches. Rep/site identity must be a contract shared by templates, browser JS, APIs, loaders, and mutation services.
- For future customer-site bugs, compare workspace state against the actual public route after hydration/API refresh, not just the initial HTML or one route payload.
- Do not let targeted public pages silently fall back to seeded/demo inventory.

---

## June 18, 2026 - Trade Board Polish and Mile High Fizz Hybrid Migration

**Active repo state:**
- Active implementation repo: `C:\Users\louis\sparkle-suite-repo`
- Branch: `codex/sparkle-cross-phase-hardening`
- Latest pushed checkpoint: `899db82 fix: restyle mile high fizz join page`
- Stable demo alias: `https://sparkle-suite-demo.vercel.app`
- Current stable demo target: `https://sparkle-suite-ovf2bqfy6-louis-2849s-projects.vercel.app`
- Deployment id: `dpl_E1wE9yon1Ai82nBusv4VXwYbxjcF`
- Repo was clean and synced after the closeout.

**Trade Board and Nic-Nac polish completed after the June 16 context-routing work:**
- `fd4ea3e fix: silence accepted photo warnings in Nic-Nac`
  - Nic-Nac should not push back on an accepted Trade Board jewelry photo.
  - If the photo is acceptable, he should add the listing and avoid quality commentary like "background is busy" or "a bit small."
  - Only genuinely unacceptable photos should trigger coaching/retake requests.
- `486d68e fix: require years in birthday collection names`
  - Birthday collections must include the year in database/catalog/trade-board naming, e.g. `April Birthday 2026`, `May Birthday 2026`, `July Birthday 2026`.
  - Nic-Nac/tools should collect the year going forward so future `2027` sets stay distinct while still allowing trades across years.
- `c1bcfbf fix: stack trade board workspace cards`
  - Trade Board workspace layout was tightened so the cards flow down the page rather than leaving a large blank middle/right gap beside Nic-Nac.
- `fa67db5 feat: add reveal screenshots to trade requests`
  - Customer trade request flow now supports a short-lived revealed-piece screenshot to help reps identify the piece being swapped.
  - The customer-facing request copy asks for a brief description including collection and type instead of leaning on an item number.
  - Rep-side trade inbox/detail surfaces can show the screenshot with the trade request.
- `55a2ae9 docs: update trade request help flow`
  - Help & Resources was updated so reps understand how the trade process works, including customer descriptions and optional reveal screenshots.
- `99a7597 fix: tune customer ticker speed` and `2baf30c fix: speed up customer tickers`
  - Customer-facing Trade Board ticker and announcement ticker were sped up from the too-slow/NASDAQ crawl behavior while remaining readable/clickable.

**Mile High Fizz migration turning point:**
- Initial attempts treated Mile High Fizz too much like a generic Amethyst/Black Diamond skin and did not preserve the original site closely enough.
- Louis clarified the true target: the same MileHighFizz.com site, with Sparkle Suite automations built in and styled to match. Not "recognizable"; the same site as close as possible.
- Screenshots and the live URL were useful for discussion, but the migration did not become faithful until Louis provided the Ready.ai/Readdy project source at `C:\Users\louis\Downloads\project-8286539 (1)\`.
- Important source assets included the original React/Vite code, page components, copy, styles, and hero video.

**Mile High Fizz implementation checkpoints:**
- `28c3fb9 fix: unlock Mile High Fizz migration workspace`
- `23cbad0 feat: add Mile High Fizz hybrid public site`
- `90a2ecb fix: migrate mile high fizz homepage shell`
- `7356a90 fix: restyle mile high fizz homepage sections`
- `2191355 fix: restyle mile high fizz trade board`
- `899db82 fix: restyle mile high fizz join page`

**Mile High Fizz migration outcome as of this closeout:**
- Public slug remains `milehighfizz`.
- Homepage now carries the Mile High Fizz hero feel, video/visual direction, copy, colors, and brand language while keeping Sparkle Suite header/ticker/live-queue standards where Louis requested them.
- Trade Board has its own page/route and keeps normal Sparkle Suite Trade Board behavior, but is dressed in Mile High Fizz branding.
- Join page now restores the missing/miscarried `Diamond Peak Society` language, launch-pack/diamond copy, and Mile High Fizz styling instead of leaking Black Diamond/default Amethyst styling.
- Lindsey's workspace remains standard Sparkle Suite; the public website is the custom hybrid surface.
- Nic-Nac/site settings should still be able to update migrated branding/copy like a normal rep unless a future section is explicitly locked.

**Verification and deploy for the final Join pass:**
- Focused Mile High Fizz public-site suite passed: 1 file, 11 tests.
- `npm run qa:amethyst` passed: 3 files, 64 tests, plus local Amethyst link checks.
- `npm run build` passed locally.
- Vercel preview build passed.
- Stable demo alias was promoted to `https://sparkle-suite-ovf2bqfy6-louis-2849s-projects.vercel.app`.
- Stable desktop and mobile screenshots were captured for `https://sparkle-suite-demo.vercel.app/milehighfizz/join`.

**New reusable skill created in Open Brain:**
- Created `C:\Users\louis\sparkle-suite\.agents\skills\sparkle-suite-existing-site-migration\SKILL.md`.
- Added `agents/openai.yaml` for the skill.
- The skill encodes the main lesson: for exact rep-site migrations, source code/project export is the intake gate. Screenshots and live URLs are references, not enough for a faithful migration unless Louis explicitly accepts a close recreation.
- The skill instructs future agents to ask one question at a time, beginning with the current site source code/export/repo, and to avoid dumping long questionnaires.

**Key lessons:**
- For existing-site migrations, "same site with Sparkle Suite automations inserted" is the correct mental model.
- Do not overbuild a reusable skin when the ask is a bespoke rep migration.
- The public automations should keep their normal Sparkle Suite behavior; only the surrounding presentation should become rep-branded.
- Source code/project exports beat screenshots for preserving copy, layout, media, and section hierarchy.
- Hero media can carry a large portion of the brand identity and should be migrated when available.

---

## June 18, 2026 - Trade Request Confirmation Fix and Pressure Smoke

**What happened:**
- Louis tested the upgraded customer Trade Board request flow on a demo/preview account for Louis' Fizz Fest.
- He filled out the trade request form, uploaded a reveal screenshot, submitted it, and the sheet flashed away without a visible success confirmation.
- No request appeared in the expected Trade Board inbox/Nic-Nac path from that manual attempt.

**Root cause:**
- The customer Trade Board component submitted successfully or hit an error, then refreshed the board and updated submitted/available listings.
- A demo-sheet synchronization effect depended on `availableSamples`, so the board refresh retriggered that effect with `demoSheet === "closed"`.
- That cleared `requesting`, `success`, and `requestError`, making the customer sheet disappear immediately after submit.
- The backend request/screenshot path was not the root failure. Multipart screenshot submit, request insert, listing `pending_trade` transition, screenshot persistence, and rep-scoped inbox visibility all worked when tested directly.

**What changed:**
- `public/amethyst/trade.jsx`
  - Added a ref for the latest available samples.
  - Limited the demo-sheet effect dependency to `t.demoSheet`.
  - Kept the tuning-panel demo behavior intact while preventing real board refreshes from clearing the customer success/error sheet.
- `tests/amethyst-trade-template.test.ts`
  - Added a regression test proving success and error sheets stay visible after board refreshes.

**Implementation checkpoint:**
- `1635ce1 fix: keep trade request confirmation visible`
- Branch: `codex/sparkle-cross-phase-hardening`
- Active repo: `C:\Users\louis\sparkle-suite-repo`

**Verification and deploy:**
- TDD red/green was run against `tests/amethyst-trade-template.test.ts`.
- Focused Trade Board/request/storage/Nic-Nac regression suite passed: 7 files, 59 tests.
- `npm run qa:amethyst` passed after starting local `localhost:3001`: 3 files, 65 tests, plus local Amethyst homepage/Trade Board link checks.
- `npm run build` passed locally.
- Local synthetic multipart smoke passed:
  - created a temporary paid rep and public slug,
  - submitted a trade request with `ER13229-jewelry-boxed-front.jpg` as a reveal screenshot,
  - verified request status `pending`, listing status `pending_trade`, screenshot metadata, and rep-scoped inbox visibility.
- Local pressure smoke passed:
  - 6 synthetic submissions,
  - 3 with screenshots and 3 without,
  - all requests landed as rep-scoped pending requests and all listings moved to `pending_trade`.
- Vercel preview build passed.
- Stable demo alias now points to `https://sparkle-suite-pyfv4xpp7-louis-2849s-projects.vercel.app`.
- Stable demo `https://sparkle-suite-demo.vercel.app/amethyst/Trade.html` returned `200 OK`.
- Deployed stable smoke passed:
  - screenshot-backed API submit persisted screenshot metadata,
  - rendered customer-page submit showed `Request sent.` and kept it visible after refresh,
  - no console errors,
  - rep-scoped data path saw both smoke requests.
- All synthetic local and deployed smoke rows, auth users, reps, listings, designs, collections, subscriptions, and uploaded screenshot objects were cleaned up.

**Lessons carried forward:**
- Customer success/error UI must not depend on mutable listing collections that can change during the same submit cycle.
- Optional screenshot upload should be smoke tested separately from the visual customer confirmation. The screenshot can be valid even when the UI confirmation is broken.
- Public-site smoke slugs must obey Sparkle Suite slug validation: lowercase letters and digits only, no hyphens.
- Browser plugin may block local/stable URLs with `ERR_BLOCKED_BY_CLIENT`; if that happens after trying it first, cached/headless Playwright is an acceptable rendered-verification fallback.
- Preview/static Trade Board URLs can appear to work while showing fallback sample inventory if target context is invalid or missing. Always verify the public board endpoint returns the intended synthetic listing before testing form behavior.

---

## June 20, 2026 - Control Center Customer and Demo Database Split

**What changed:**
- `/control-center` now separates the left-nav account views into `Customer Database` and `Demo Database`.
- The Customer Database is limited to the three active customer public sites Louis named: Mile High Fizz, Britt With Bling, and BlingKitchen.
- All other operator-visible account profiles render in the Demo Database and are labeled `Demo Account` in the expandable row.
- Control Center summary cards now show `Active accounts` and `Demo accounts` instead of mixing all profiles into a single active/customer count.

**Verification:**
- Added a focused page test proving the three named active customer accounts stay in Customer Database while an extra account moves to Demo Database.
- Focused Control Center page and customer-profile service tests passed.
- Local production build passed.

**Follow-up note:**
- The current split is derived from known active customer site identifiers. If Louis wants this editable from Nic-Nac/dashboard later, add durable account classification metadata so customer/demo status is not code-defined.

---

## June 20, 2026 - Stable Demo Review Target Correction

**What happened:**
- During BlingKitchen follow-up verification, the assistant described production and demo as separate surfaces and initially verified the wrong public target before checking Louis's actual Chrome tab.
- Louis clarified that `https://sparkle-suite-demo.vercel.app/` is the Sparkle Suite review/deploy target he uses, and he should not have to chase other Vercel links.

**Rule going forward:**
- Treat `https://sparkle-suite-demo.vercel.app/` as the canonical Louis review target for ordinary Sparkle Suite work.
- Raw Vercel deployment URLs are internal implementation details unless Louis explicitly asks for them.
- Before reporting a fix as live, promote/confirm the stable demo alias and verify the exact route at that URL.
- If Louis says a fix is not visible, use the Chrome connector to inspect the exact tab/URL and loaded assets before making another deployment claim.

---

## June 22, 2026 - Nic-Nac Batch Hardening and Sparkle Lab Guardrails

**What changed:**
- Suite commit `8ed7d7d fix: harden Nic-Nac intake and Lab guardrails`.
- Finder commit `28e0890 feat: add Finder Studio intake status tool`.
- Suite `add_listing` now treats an existing item number on a rep's Trade Board as physical inventory, asks whether the rep is adding a second physical piece of that same design, and hard-fails duplicate-listing refusal language in evals.
- Suite Trade Board intake role inference now distinguishes extracted item details from an actual label/details photo request. Root cause of the ER13229 smoke failure was the phrase "got the details for ER13229 ... need the customer-facing jewelry photo" being misclassified as both details-photo and jewelry-photo context, which stored the boxed jewelry upload as `unknown`.
- Sparkle Lab manual/weekly routes now return deterministic recommendation artifacts, artifact counts/summaries, mutation mode, model-synthesis status, and visible usage/limits reporting while preserving the no-production-self-mutation boundary.
- Finder Nic-Nac Studio pack now includes `read_my_studio_intake_status`, reading app-owned Showcase Studio upload/submission state and directing missing/replacement files to `/silver#showcase-studio` instead of pretending chat can accept Studio files.

**Deployments:**
- Suite preview deployment `dpl_4yTnu2v4T3gyPvHe1B52ZGRLMct1` / `https://sparkle-suite-p7kwbf9om-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that Suite deployment.
- Finder production deployment `dpl_Fp6ZPoRVKhzsJkGXZMwFMZPKjo8p` / `https://sparkle-finder-5jpiavcgk-louis-2849s-projects.vercel.app`, aliased to `https://sparkle-finder-dev.vercel.app`.

**Verification:**
- Suite focused Nic-Nac/Lab suite passed: 13 files, 152 tests.
- Suite standard `npm test` passed: 14 files, 179 tests.
- Suite touched-file lint passed.
- Suite `npm run build` passed locally, and Vercel build passed.
- Suite local ER13229 smoke failed before the classifier fix, then passed after rebuild.
- Suite stable demo ER13229 smoke passed three consecutive deployed replays against `https://sparkle-suite-demo.vercel.app`, each through real `/api/nic-nac`, real image data parts, tool observation, workflow/listing DB verification, and smoke listing cleanup.
- Suite `npm run lint` still fails on pre-existing unrelated repo-wide lint debt: 27 errors and 39 warnings, mainly old Link/no-unescaped-entities/no-explicit-any/set-state-in-effect issues outside this batch.
- Finder Sparkle Finder suite passed: 37 files, 492 tests.
- Finder `npm run lint` passed.
- Finder `npm run build` passed locally, and Vercel production build passed.
- Finder `smoke:finder-nic-nac:guard` passed locally with the expected `model_not_configured` guard.
- Finder deployed `smoke:finder-nic-nac` was blocked because deployed preview auth is disabled and no non-personal cookie/test auth path was available in the environment.

**Remaining:**
- Deeper Finder tool parity.
- A deployed Finder Nic-Nac smoke path that does not depend on personal browser auth when preview auth is disabled.
- Broader Suite repo lint cleanup remains separate from this Nic-Nac/Lab batch.

---

## June 22, 2026 - Nic-Nac Stable Baseline Closeout Plan and Memory Writeback

**What changed:**
- Added and pushed `docs/superpowers/plans/2026-06-22-nic-nac-stable-baseline-closure.md` in commit `d81f938 docs: add Nic-Nac stable baseline closure plan`.
- The plan freezes the shippable Nic-Nac beta baseline and separates it from continuing enhancement work.
- Baseline gates cover Suite local/deployed tests, Finder local/deployed tests, linked-rep memory, Lab guardrails, model policy/cost telemetry, browser smoke, release notes, and vault closeout.
- HQ now has Phase 11 task `task_11_10_nic_nac_stable_baseline` for executing that matrix.
- Open Brain was updated with standalone memories for shared architecture, OpenAI model policy, implementation summary, verification summary, lessons learned, and risk watchlist.
- Headquarters was updated to correct stale Nic-Nac model/cost assumptions and preserve the new shared-agent/surface-gated action decision.

**Key locked decisions:**
- Nic-Nac remains one shared Sparkle ecosystem agent across Sparkle Suite and Sparkle Finder.
- Secret Rep ID Number is the private rep-linking credential and is not the public referral code.
- Sparkle Suite workspace actions stay gated to Sparkle Suite login; Finder Nic-Nac can share identity/memory but must redirect Suite mutations back to Suite.
- Nic-Nac model policy is OpenAI-only for the current baseline: `human_default` => `gpt-5.4`, `human_escalated` => `gpt-5.5`, `utility_fast` => `gpt-5.4-mini`, `lab_synthesis` => `gpt-5.5`.
- Sparkle Lab is a bounded recommendation loop, not a self-mutating production agent.

**Lessons carried forward:**
- Prompt-only fixes are not enough for Nic-Nac reliability. App-owned workflow state, tool availability, validation, database assertions, and real replay smoke need to own the hard behavior.
- Do not call a Nic-Nac customer-facing fix done until the exact deployed/reviewer surface has been smoked.
- Non-personal reviewer smoke paths are mandatory for Suite and Finder so Louis does not become the test harness.
- Stale HQ/vault model assumptions can mislead future sessions; model/provider decisions need explicit memory updates when they change.

**Risk watchlist:**
- Execute the stable baseline closure matrix before calling the upgraded Nic-Nac stable.
- Deeper Finder tool parity and broader shared-core consolidation remain backlog after baseline closure.
- Keep Lab model synthesis disabled until Louis approves a guarded live synthesis smoke with spend limits.
- Attorney review and final marketing/onboarding positioning remain needed for Nic-Nac memory disclosure.
- Full Suite Vitest still has unrelated start/prelaunch/master-brand failures; do not confuse those with focused Nic-Nac baseline gates.
- Investigate unrelated public Finder API 500s separately if Finder public discovery/catalog reliability comes into scope.

---

## June 23, 2026 - Help & Resources Quick Support Report Simplification

**What changed:**
- Replaced the Help & Resources support report monster form with a one-field quick report: reps now only type what happened, what is confusing, or what they want improved.
- The UI still posts structured support data by inferring report type, urgency, and title from the description, with contact follow-up enabled by default.
- `/api/nic-nac/support-reports` now also accepts details-only submissions and normalizes them before calling the existing support report service, preserving Control Center, Support Auditor, Google Chat, and Sparkle Lab downstream automation wiring.

**Verification:**
- Focused support/automation suite passed: 6 files, 32 tests.
- Standard `npm test` passed: 14 files, 191 tests.
- `npm run lint` passed with existing warnings only.
- `npm run build` passed locally and in Vercel.
- Vercel preview: `https://sparkle-suite-minjgq4dj-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that preview.
- Stable demo `/start` returned 200, `/api/nic-nac/health` returned API/DB reachable, and unauthenticated one-field support report POST returned the expected 401 auth guard.
- Full Google Chat support smoke was intentionally not run in this pass because it sends a real synthetic support alert; the service/auditor/Google Chat wiring is covered by tests.

---

## June 27, 2026 - Open Brain and HQ Handoff for Beta-Readiness Session

**What was captured:**
- Open Brain now has standalone memories for the June beta-readiness session: Nic-Nac duplicate physical listing smoke/root-cause work, the Help & Resources quick support report simplification, and the verification lesson about stale smoke failures.
- HQ activity log now has note `120fd02d-13af-4e01-b9ed-e4144854be35` summarizing the session, key decisions, and lessons learned.

**Session work summarized:**
- Audited beta readiness for Sparkle Suite/Nic-Nac with Louis, including how close the system is to a 2-3 rep beta.
- Re-investigated the duplicate physical listing concern after Louis reported he had already smoke-tested the path successfully.
- Found that the remaining problem was a mix of smoke/harness drift and a direct-tool edge, not the core product path being broadly broken.
- Shipped `1c8bf7f fix: stabilize Nic-Nac duplicate listing smoke` and `200b220 fix: align Nic-Nac trade smoke with canonical photos`.
- Simplified Help & Resources support intake from a high-friction multi-field form to a one-field quick report while preserving structured downstream support automation.
- Shipped `ced7467 fix: simplify Help Resources support reports` and promoted it to `https://sparkle-suite-demo.vercel.app`.

**Key decisions and lessons:**
- Treat `https://sparkle-suite-demo.vercel.app` as the ordinary Louis review target and verify the stable alias before calling work live.
- Beta support intake should be low-friction for reps; enrichment/classification belongs behind the scenes in Sparkle Suite, not in a long rep-facing form.
- Preserve Control Center, Support Auditor, Google Chat, and Sparkle Lab automation while reducing the form to a simple report surface.
- Do not treat old smoke failures as current product blockers without rechecking the exact deployed build, URL, harness, and product behavior.
- Separate true product bugs from smoke harness drift, and use non-personal reviewer/synthetic data for beta verification.

---

## June 27, 2026 - Nic-Nac Front Photo Handoff Confirmation Recovery

**What changed:**
- Louis found a remaining Nic-Nac add-listing save edge after several successful pieces: the uploaded jewelry photo was visually accepted in chat, but the save step still treated the front photo handoff as missing.
- Root cause was workflow-state confirmation language, not photo quality. The image URL could already be stored as an unknown workflow photo, but phrases like `Push it through, please. It's a good photo.` after Nic-Nac's `I've got the front photo visually...` message did not promote that stored photo into the confirmed customer-facing jewelry photo slot.
- Shipped `bfd443b fix: recover Nic-Nac front photo handoff confirmations`.
- The intake context now treats push-through/good-photo confirmations as positive only in the guarded context where Nic-Nac had already asked to confirm or identified the front jewelry photo/save-handoff state.
- Added a regression test for the exact ER18012-style path so the saved image URL is promoted, `jewelryFrontPhoto` clears from missing fields, and the workflow becomes ready to add.

**Verification:**
- First ran the new regression test red against the old behavior.
- `npm exec vitest run tests/nic-nac/trade-board-intake-route-context.test.ts` passed: 18 tests.
- `npm exec vitest run tests/nic-nac/trade-board-intake-route-context.test.ts tests/nic-nac/add-listing-recovery.test.ts` passed: 58 tests.
- `npm exec vitest run tests/nic-nac` passed: 793 tests, 1 skipped.
- `npm run build` passed locally.
- Vercel preview build passed at `https://sparkle-suite-ld0rnr0nn-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that preview.
- Stable demo root returned 200; `/api/nic-nac/health` returned API/DB reachable with recent error rate 0.
- Deployed reviewer-smoke Trade Board intake replay passed against stable demo with synthetic reviewer account `sparkle-reviewer+preview@neonrabbit.net`, verified listing creation, and cleaned up listing `9b30355e-26c8-4c3d-9d08-a6104fa25ca5`.

**Lesson:**
- When Nic-Nac says it can see a photo but the save handoff is stuck, first check whether workflow photo role promotion failed before asking the rep for another photo. The app-owned workflow state should preserve and confirm already-uploaded image URLs whenever the rep clearly approves the photo.

---

## June 27, 2026 - Trade Board Ticker Detail Simplification

**What changed:**
- Louis asked for the customer-facing Trade Board ticker to stop showing MSRP and instead show the item's name, item type, and collection.
- Shipped `3becf3d fix: simplify trade board ticker details`.
- `tradeBoardTickerItems` now carries `name`, `type`, and `collection` instead of `name`, `price`, and `tier`.
- The public homepage ticker now renders entries as `Item Name - Type - Collection`; fallback ticker entries were updated to remove MSRP values.

**Verification:**
- Added/updated homepage regression coverage for the new ticker payload.
- `npm exec vitest run tests/amethyst-homepage-template.test.ts` passed: 32 tests.
- `npm run qa:amethyst` unit phase passed: 70 tests. The local link verifier portion failed only because no local server was running at `http://localhost:3001`.
- `npm exec vitest run tests/amethyst-homepage-template.test.ts tests/amethyst-static-assets-route.test.ts tests/amethyst-preview-template-data.test.ts tests/amethyst-targeted-site-data-scrub.test.ts` passed: 69 tests.
- Local `npm run build` hung in the shell environment without actionable compiler output; stale Node build workers were stopped.
- Vercel preview build passed at `https://sparkle-suite-a7zpv3cez-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that preview.
- Stable demo root returned 200.
- Deployed `/amethyst/homepage.jsx` contains the new ticker line and no old ticker price/MSRP fallback.

---

## June 28, 2026 - Universal Customer Ticker Audit and Stable Demo Fix

**What changed:**
- Louis reported the Trade Board ticker was still extremely slow on the Louis's Fizz Fest / Mile High Fizz Trade Board page even after the earlier ticker-speed work.
- Audited every active customer-facing ticker path: static Home, static Trade, static Join, and the shared React customer shell.
- Found the previous fix did not fully apply everywhere:
  - Home used workspace-backed `tradeBoardTickerItems`, but Trade and Join still had older fallback-only ticker payloads.
  - The shared React shell still rendered ticker entries as item title plus MSRP.
  - Static Amethyst HTML still used the older `20260621-ticker-pps` asset query, so browser/CDN cache could keep serving stale ticker code after fixes.
- Shipped `1ed4137 fix: unify customer ticker trade details`.
- Shipped the earlier verified Nic-Nac site-edit continuation fix as `1450d22 fix: route Nic-Nac site edit continuations`.
- Home, Trade, Join, and the shared shell now use the same trade ticker display contract: item name, item type, and collection. MSRP is not rendered in the moving Trade Board ticker.
- Join now receives workspace trade-board listings in its bootstrap payload, so subpages can use the same ticker items as Home/Trade.
- Static asset cache key was bumped to `20260628-universal-ticker` across Home, Trade, Join, Pantry, and Unsubscribe exports.

**Verification:**
- Regression test was first observed failing on the old drift: shared shell still had MSRP and Join still used `TICKER_TRADES`.
- `npm exec vitest run tests/amethyst-homepage-template.test.ts` passed: 32 tests.
- `npm exec vitest run tests/amethyst-homepage-template.test.ts tests/amethyst-trade-template.test.ts tests/amethyst-join-template.test.ts tests/amethyst-static-assets-route.test.ts tests/public-site-slug-route.test.ts` passed: 88 tests.
- `npm exec vitest run tests/nic-nac/tool-routing.test.ts tests/nic-nac/site-customization-tools.test.ts tests/nic-nac/core-tool-policy.test.ts` passed: 69 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Full `npx tsc --noEmit --pretty false` still fails on pre-existing test fixture typing issues unrelated to this patch; production app type-check passed during `next build`.
- Pushed branch `codex/sparkle-cross-phase-hardening` through `1450d22`.
- Vercel preview `https://sparkle-suite-kt9pijhz0-louis-2849s-projects.vercel.app` / deployment `dpl_DyfmwNFVGXiGpa5WUkoWm8pJgAxv` is Ready.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo checks:
  - `/milehighfizz/trade` returned 200 and loaded `20260628-universal-ticker`.
  - Deployed `/amethyst/trade.jsx?v=20260628-universal-ticker` contains `TRADE_TICKER_SPEED_PPS = 55.2`, uses `CONTENT.tradeBoardTickerItems`, renders `name - type - collection`, and no longer contains the old `trade.meta` path.
  - `/api/amethyst/trade-template?publicSiteSlug=milehighfizz` returned 200 and contains `tradeBoardTickerItems`.
  - `/milehighfizz` and `/milehighfizz/join` returned 200 and load `20260628-universal-ticker`.
  - Deployed `/amethyst/join.jsx?v=20260628-universal-ticker` uses `CONTENT.tradeBoardTickerItems`, renders `name - type - collection`, and no longer contains the old `trade.price` path.
  - `/api/amethyst/join-template?publicSiteSlug=milehighfizz` returned 200 and contains `tradeBoardTickerItems`.

**Lesson:**
- A ticker-speed fix is not complete if only one page's ticker payload is updated. The active contract must cover Home, Trade, Join, shared shell, and cache-busted static assets, and the exact stable demo route Louis used must be checked before calling it fixed.
## June 30, 2026 - Optional Revealed Item Capture and Catalog Photo Correction Guard

**What changed:**
- Louis and a BP smoke tester found that the workspace Trade Board `Approve trade` modal forced reps to enter the just-revealed item number during a busy show.
- Shipped `bd935e6 fix: let reps approve trades without revealed item numbers`.
- The modal now labels the field `Revealed item number (optional)` and adds `Approve without item number`.
- The skip path uses the existing fallback approval API instead of the live-show swap capture path and shows: `Trade approved. Add the revealed piece later with Nic-Nac when you are ready.`
- Nic-Nac prompt guidance now mirrors the same busy-show branch: prefer captured live-show swap approval, but use plain `approve_trade` when the rep wants to skip item-number capture and add the revealed piece later.
- Louis also caught a Nic-Nac catalog-photo bug where a label/details image became the canonical shared jewelry photo for ER34579 / The Essential Shine Hoops and Nic-Nac claimed the photo correction tool was unavailable.
- The existing `report_jewelry_catalog_issue` tool was hardened in description/system guidance so Nic-Nac should use it for routine shared catalog photo corrections instead of deflecting to Louis. Canonical photo replacement remains guarded: use only an approved jewelry-front replacement asset, never a label/details/back-of-card photo.

**Verification:**
- Red/green tests covered optional approve UI/source wiring, API fallback approval without `revealedItemNumber`, Nic-Nac prompt guidance, catalog correction tool payloads, and approved canonical photo replacement service behavior.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-trade-requests-route.test.ts tests/nic-nac/report-jewelry-catalog-issue.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/system-prompt-post-show.test.ts tests/nic-nac/prompt-routing.test.ts tests/jewelry-catalog-corrections.test.ts tests/nic-nac/add-listing-recovery.test.ts` passed: 8 files, 146 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `bd935e6` to `origin/codex/sparkle-cross-phase-hardening`.
- Vercel preview build passed at `https://sparkle-suite-oefreyqkl-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that preview; Vercel inspect confirmed deployment `dpl_9uEjtUMUZsvUMnQwCMoQbbDTbXw9` is Ready.
- Stable demo health checks passed:
  - `/api/prelaunch/health` returned 200.
  - `/api/nic-nac/health` returned 200 with `api_reachable:true`, `db_reachable:true`, and `recent_error_rate:0`.
- DB-backed `npx tsx scripts/smoke-trade-swap.ts` passed all swap assertions and cleaned up its synthetic rows.
- Attempted isolated Playwright reviewer workspace smoke against stable demo, but this repo does not have Playwright installed as a local dependency and `npx` module resolution could not load the browser/test package from a temporary spec. No Louis personal browser/session was used.

**Lesson:**
- Item-number capture during trade approval must remain helpful, not blocking. For busy live-show workflows, reps need a clean approve-now/add-later path.
- Nic-Nac should not tell reps a shared catalog photo correction is unavailable when `report_jewelry_catalog_issue` is active. The safe correction rule is: report/fix the catalog issue through Nic-Nac, but only replace canonical catalog photos with approved jewelry-front assets.

---

## July 1, 2026 - Heather Recipe Nic-Nac Exact Smoke and Pantry Assertion Hardening

**What changed:**
- Louis confirmed Heather's BlingKitchen demo temp password may be used for exact runtime smoke testing while the account is being prepared for beta handoff.
- Hardened `scripts/smoke-nic-nac-recipe-chat.ts` so the BlingKitchen target verifies the real customer Pantry data handoff through `/api/amethyst/pantry-template?c=<repId>&publicSiteSlug=blingkitchen`, not only the first `/blingkitchen/in-the-pantry` HTML shell.
- Added a 30-second retry loop for the Pantry template assertion.
- Added cleanup-on-failure for post-save recipe assertions so smoke recipes are removed even if DB facts, public image fields, or public Pantry visibility checks fail.

**Verification:**
- `npm exec vitest run tests/nic-nac-recipe-builder-smoke-script.test.ts tests/launch-readiness-report-runner.test.ts tests/phase-11-smoke-manifest.test.ts` passed: 3 files, 19 tests.
- Exact Heather stable-demo smoke passed with `--target=bling-kitchen --expect-model`; the smoke logged in as `blingkitchen19@gmail.com`, observed `build_site_recipe_draft` on the draft turn, observed `manage_site_recipes` on save, verified the saved recipe row and public Pantry template, then cleaned up recipe `d7f916dc-835e-4e9b-b1db-e06f7b705e70`.
- The smoke artifact was written to `.local/launch-readiness-results/bling-kitchen-recipe-chat.json`.
- `npm run build` passed locally with Next.js 16.2.1.

**Lesson:**
- For Heather's Pantry, the route HTML is only the shell. Customer-facing recipe visibility must be verified through the Pantry template bootstrap data that hydrates the page.
- Exact beta-account smokes should clean up their created rows on every post-save failure path, not only on full success.

---

## July 1, 2026 - Heather Recipe Workspace Simplified Builder

**What changed:**
- Louis flagged the left-side `Pantry order` panel in Heather's Recipes workspace as unnecessary filler.
- Removed the separate Pantry order/list/reorder UI and its extra `Add recipe` button.
- The Recipes workspace now presents the recipe builder as the main surface. New recipes keep their insertion order, and Heather can use the category field for section placement.
- After saving a brand-new recipe, the builder clears back to a fresh recipe draft so Heather can keep adding recipes without managing a separate order panel.

**Verification:**
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts` passed: 75 tests.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts tests/nic-nac-site-recipes-route.test.ts tests/services/site-recipes.test.ts` passed: 4 files, 93 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `a9a6ec8 fix: simplify Heather recipe builder` to `origin/codex/sparkle-cross-phase-hardening`.
- Vercel preview `https://sparkle-suite-9rk2w8mo8-louis-2849s-projects.vercel.app` / deployment `dpl_BwaFkHKyz5qjYf7fgwmCBVP7CejX` is Ready.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo health checks passed:
  - `/api/prelaunch/health` returned `ok:true`.
  - `/api/nic-nac/health` returned `api_reachable:true`, `db_reachable:true`, and `recent_error_rate:0`.
- A browser-based logged-in reviewer-smoke check was not completed in this environment because Chrome control was not available and the temporary Playwright package import still failed with local module resolution. No Louis personal browser/session was used.

**Lesson:**
- Heather's recipe workflow should stay image-first and simple: title, category/section, photos, recipe-card photos, build/save. Manual pantry ordering is not part of the beta workflow unless Louis asks for it later.

---

## July 1, 2026 - Heather Recipe Header Build Action

**What changed:**
- Louis caught that Heather's Recipes workspace still had two `Save recipe` buttons after the builder simplification.
- Changed the top header action to `Build recipe with Nic-Nac` and left the bottom `Save recipe` action as the only save button.
- Removed the duplicate lower build action so the workspace now has one build button and one save button.

**Verification:**
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts` passed: 75 tests.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts tests/nic-nac-site-recipes-route.test.ts tests/services/site-recipes.test.ts` passed: 4 files, 93 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `9bf9729 fix: make Heather recipe header build action` to `origin/codex/sparkle-cross-phase-hardening`.
- Vercel preview `https://sparkle-suite-ch9tvhk6j-louis-2849s-projects.vercel.app` / deployment `dpl_FfVBoqQwGVcHQ5WH2kGMMkzBYqVQ` is Ready.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo health checks passed:
  - `/api/prelaunch/health` returned `ok:true`.
  - `/api/nic-nac/health` returned `api_reachable:true`, `db_reachable:true`, and `recent_error_rate:0`.

**Lesson:**
- Heather's recipe editor should present one clear next action per stage: build with Nic-Nac from the header, then save from the bottom after the draft looks right.

---

## July 1, 2026 - Heather Manual Recipe Editor Mode

**What changed:**
- Louis asked to remove the bottom `Advanced edit` card because it felt too complicated.
- Replaced the `New Recipe Builder` heading with a mode dropdown.
- The default mode is `New Recipe Builder`, preserving the image-first Nic-Nac recipe flow.
- Added `Manual Edit Recipes` mode with a saved recipe picker, a new manual recipe option, and the compact edit fields needed to update an existing recipe.
- Removed the old advanced-edit UI and related styling.

**Verification:**
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts` passed: 76 tests.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts tests/nic-nac-site-recipes-route.test.ts tests/services/site-recipes.test.ts` passed: 4 files, 94 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `29c506b fix: add manual Heather recipe editor mode` to `origin/codex/sparkle-cross-phase-hardening`.
- Vercel preview `https://sparkle-suite-jil8hru2z-louis-2849s-projects.vercel.app` / deployment `dpl_CBtM7e5WjtimrbY6M7m4k7k9FAas` is Ready.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo health checks passed:
  - `/api/prelaunch/health` returned `ok:true`.
  - `/api/nic-nac/health` returned `api_reachable:true`, `db_reachable:true`, and `recent_error_rate:0`.

**Lesson:**
- Keep Heather's default recipe flow simple and image-led. Put manual correction/editing behind an explicit mode choice with a recipe picker instead of a dense always-visible advanced card.

---

## July 1, 2026 - Heather Recipe Preview Label

**What changed:**
- Louis chose `Recipe Preview` as the clearer label for the old `Nic-Nac draft preview` area in Heather's recipe builder.
- Updated the builder preview card label and matching dashboard test expectations.

**Verification:**
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts` passed: 76 tests.
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-recipe-builder-smoke-script.test.ts tests/nic-nac-site-recipes-route.test.ts tests/services/site-recipes.test.ts` passed: 4 files, 94 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- Pushed `8d2cc95 fix: rename Heather recipe preview label` to `origin/codex/sparkle-cross-phase-hardening`.
- Vercel preview `https://sparkle-suite-o1q9tahqu-louis-2849s-projects.vercel.app` / deployment `dpl_GTfzueZQKHuHyDMXGnsUm8fFDRUB` is Ready.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to that deployment.
- Stable demo health checks passed:
  - `/api/prelaunch/health` returned `ok:true`.
  - `/api/nic-nac/health` returned `api_reachable:true`, `db_reachable:true`, and `recent_error_rate:0`.

**Lesson:**
- Heather-facing recipe labels should describe the action/result plainly; `Recipe Preview` is clearer than model/tool-oriented wording.

---

## July 1, 2026 - Moonstone Skin and Heather Standard Public Site

**What changed:**
- Added reusable Moonstone (`moonstone`, `MS-01`) as a generic purple, silver, and charcoal Sparkle Suite skin any rep can choose.
- Returned Heather/BlingKitchen's public Home, Trade, and Join pages to the standard Amethyst-style template structure instead of bespoke kitchen-themed variants.
- Kept Heather's `In the Pantry` link visible on the standard public navigation/footer.
- Updated the Pantry template so it receives and applies the active appearance preset; Heather's Pantry now follows Moonstone today and should follow any other selected skin later.
- Added the Supabase constraint migration for the `moonstone` appearance preset and updated Heather's remote demo setting to Moonstone.

**Verification:**
- `npm exec vitest run tests/amethyst-appearance-presets.test.ts tests/amethyst-homepage-template.test.ts tests/amethyst-trade-template.test.ts tests/amethyst-join-template.test.ts tests/bling-kitchen-public-site.test.ts tests/services/site-settings.test.ts tests/nic-nac/site-customization-tools.test.ts` passed: 7 files, 118 tests.
- `npm exec vitest run tests/amethyst-preview-template-data.test.ts tests/public-site-slug-route.test.ts tests/bling-kitchen-recipes-db-loader.test.ts tests/nic-nac-dashboard-placeholder.test.ts` passed: 4 files, 108 tests.
- `npm run build` passed locally with Next.js 16.2.1.
- `supabase db push` applied migration `20260701150000_ss_add_moonstone_appearance_preset.sql` to the remote project.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` was moved to deployment `dpl_YVsvhHE8SJs515ZrmesUer9e158P` at preview `https://sparkle-suite-eig0qya6k-louis-2849s-projects.vercel.app`.
- Stable health checks passed for `/api/prelaunch/health` and `/api/nic-nac/health`.
- Stable template checks confirmed BlingKitchen homepage uses `preset:"moonstone"`, standard Sparkle Suite hero copy, and `pantryPageUrl:"/blingkitchen/in-the-pantry"`; Pantry template confirmed `appearancePreset:"moonstone"` and `recipeCount:26`.
- Raw `npx tsc --noEmit --pretty false` still fails on unrelated repo-wide test typing issues; the one touched-test type issue it surfaced was fixed, and the production build passed TypeScript.
- No Chrome reviewer-smoke or Louis personal browser/session was used.

**Lesson:**
- Heather's public site should be standard Sparkle Suite with a selectable skin. The only special customer-facing surface is Pantry, and Pantry must inherit the selected skin instead of being manually restyled.
