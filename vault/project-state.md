# Project State

**Last updated:** August 1, 2026

---

## Current Phase

**Phase 1 closing into Phase 2**

---

## Platform

- **Live URL:** yoursparklesuite.com
- **Hosting:** Vercel
- **Framework:** Next.js 16
- **Repo:** louis623/sparkle-suite on GitHub
- **Active local workbench:** `C:\Users\louis\sparkle-suite-repo`
- **Active local branch:** `codex/nic-nac-trade-hardening`
- **Latest local implementation checkpoint:** `83ea2de feat: add workspace header quick references`
- **Latest local docs/memory checkpoint:** July 31 single-live-surface rule
  correction: Sparkle Suite live and demo are one surface at
  `yoursparklesuite.com`; all approved work flows to Vercel production and is
  verified on the live domain. This sits on top of the production
  rollback/checkout-routing incident closeout, repaired admin/demo-account
  invariant, deny-unlisted branch guards, audited preservation checkpoints,
  and permanent provenance/post-auth safeguards.
- **Latest local/deployed checkpoints:** The Nic-Nac-first workspace still includes the Live Site Preview workbench with centered equal-size 2x2 controls for Back to workspace, Refresh preview, Open full site, and Open/Close Nic-Nac. Its persistent header now shows the account's canonical public-site address with a one-click copy control and the exact stored Live Queue code; both remain visible in the responsive mobile header. This display is read-only and does not create, reset, or mutate Live Queue data. The right rail preserves the useful `Public Site` status card while omitting the removed oversized `Sparkle with us.` preview bubble and redundant `Preview site` controls. On top of the July 10 shell, the right-hand Upcoming Show card shows the actual next show details when a real upcoming event exists: weekday, date, time, time zone, and show name, and the detail area clicks through to Calendar. When no upcoming event exists, the card shows `No upcoming shows` with an `Add a show` link into the existing calendar flow. The Trade Board top-right action label is now `Customer view`. The rep workspace still uses the compact Sparkle Suite / Workspace header with no redundant top Nic-Nac search box, a pink Sparkle Suite seal, a compact pink Nic-Nac mark, simplified data-backed side cards, `Trade follow-up` terminology, and an `Open Trade Workspace` action. The workspace shell remains viewport-contained: Nic-Nac conversation content scrolls inside the app while the header, composer, and bottom navigation remain available. Final navigation sizing/padding keeps icons inside the shell. These patterns are account-generic for current customers, future accounts, and reviewer demos rather than Heather-specific.
- **Live production URL / Louis review target:** `https://www.yoursparklesuite.com`
- **Apex production URL:** `https://yoursparklesuite.com`
- **Environment model:** Sparkle Suite live and demo are one surface. Demo
  means safe reviewer data/mode on `yoursparklesuite.com`, not a separate
  domain or deployment lane.
- **Production deployment provenance:** Inspect both live domains in Vercel
  before every release or incident response; do not treat a raw deployment ID
  recorded in memory as the current source of truth.
- **Last application-bearing branch-containment deployment:**
  `dpl_HHZmsd7AK6iVTtKdDRKtZUmLfxA2`
- **Production deploy rule:** Louis reviews Sparkle Suite work at
  `https://www.yoursparklesuite.com/`. Every approved release deploys the exact
  active-branch tip to Vercel production, confirms the `www` and apex domains
  resolve to that deployment, and verifies the affected live path. Raw Vercel
  deployment URLs and `sparkle-suite-demo.vercel.app` are provenance evidence
  only and are never the default handoff target.
- **Local review URL:** `http://localhost:3000/`
- **Local signup URL:** `http://localhost:3000/start`

---

## July 31 Production Recovery and Safeguard State

- Production provenance drift from historical branches/deployments temporarily reverted `yoursparklesuite.com`, the workspace, and customer-facing sites to old application state. Recovery used exact Git/Vercel history rather than rebuilding from memory.
- Current verified application checkpoint is `af7cef25 fix: restore landing account sign-in controls` on `codex/nic-nac-trade-hardening`, deployed as `dpl_3WtzJMr5fK7LMEqTrVqJCJLZSWqL`.
- Louis's Google-auth account `louis@neonrabbit.net` is the original admin/demo workspace. Its production state was incorrectly `onboarding` / `checkout_required` with no entitlement and an accidental founder reservation, which caused the post-auth Stripe redirect.
- The account was repaired to `active` / `dashboard_unlocked` with a `$0`, non-live `internal_demo` entitlement; the accidental founder reservation was released. No live Stripe subscription or charge was created during the repair.
- Signed-in Chrome verification on the exact live custom domain reached and remained in Louis Chapman's `/nic-nac` workspace. Louis confirmed the platform was back in business.
- `AGENTS.md`, the production-smoke skill, and the incident runbook now require repo/branch/commit/deployment/alias provenance before production changes, exact-domain and post-auth verification afterward, and preservation of deployment evidence.
- Voice mode is paused for Sparkle Suite repository, deployment, authentication, billing, and production-data work until Louis explicitly re-enables it.
- Full incident record and reusable session prompts:
  `docs\sparkle-suite\incidents\2026-07-31-production-rollback-and-checkout-routing.md`.
- Branch containment now uses a machine-readable deny-unlisted allowlist at
  `config\active-branches.json`, a build/push guard at
  `scripts\check-active-branch.mjs`, and the audited register at
  `docs\sparkle-suite\operations\branch-register.md`.
- GitHub's default branch and local `origin/HEAD` now point to
  `codex/nic-nac-trade-hardening`. Vercel's authenticated project record
  confirms the same branch is its production branch.
- Every audited branch tip was preserved with an annotated GitHub
  safety/archive tag. A verified all-ref Git bundle and a separate zip of the
  detached `c385` uncommitted demo files are stored under the ignored
  `.local\git-backups\2026-07-31-branch-containment\` directory.
- No branch, worktree, or commit was deleted, renamed, reset, or rewritten.
  Unique/divergent work remains quarantined for explicit review.
- A GitHub ruleset that freezes creation, updates, deletion, and force-pushes
  for every branch except the active allowlisted branch is fully configured
  but still requires GitHub's identity-verification email before creation.
- Branch-containment implementation shipped in `973195e0` with the Vercel
  provenance adapter corrected in `37c89c86`. Five focused policy tests and the
  full local build passed. Vercel deployment
  `dpl_HHZmsd7AK6iVTtKdDRKtZUmLfxA2` visibly passed the active
  repository/branch gate and became READY. Its former demo-alias promotion is
  historical evidence only and no longer defines the release target.

---

## July 26 Emerald Garden and Brianna Beta State

- Emerald Garden is a standard selectable Amethyst customer-site skin, not a bespoke Brianna-only build. It carries the green, neutral, botanical/spa direction from Brianna's former Readdy site while keeping the shared Sparkle Suite site structure and editing behavior.
- Brianna Williams now has an active standard beta workspace for `Bri's Glowtique`, public slug `brisglowtique`, with Emerald Garden selected. The account is Bomb Party focused, uses her real business/team/shop/social information, and has no fabricated listings, customers, trades, or calendar events.
- Brianna's beta uses an internal `$0` subscription record with no Stripe customer or live charge. Preserve the earlier decision to honor her original `$39/month` rate when billing begins. Do not restore bespoke-site scope or add Scentsy, Celesty, Monat, or other side-business content.
- The public review paths are `/brisglowtique`, `/brisglowtique/trade`, and
  `/brisglowtique/join` on `https://www.yoursparklesuite.com`.
  `brisglowtique.com` is not connected and must remain unchanged until Louis
  explicitly approves a later domain cutover.
- Focused verification passed across five files / 111 tests, the local and Vercel production builds passed, Brianna's credentials successfully authenticated, and bounded live checks confirmed Emerald Garden on Home/Trade/Join with no framework overlay or legacy Join placeholders. Louis still wants to perform the final hands-on workspace and customer-site smoke before treating Brianna's beta onboarding as accepted.
- Brianna's temporary credential is intentionally stored in Louis's private Open Brain recall entry and is not committed to the Git repository. Rotate it after handoff or first use.

---

## July 25 Workspace Card and Release Flow State

- Shipped workspace-card polish in `5ad2b43 feat: show next event in workspace card`. The Upcoming Show card no longer shows a dead `Calendar` label. It now renders the next real upcoming show summary when one exists and links that detail area into Calendar. The empty state is explicit: `No upcoming shows` plus `Add a show`.
- Shipped Trade Board copy polish in the same branch tip: the top-right button now reads `Customer view` instead of `View customer board`.
- Focused verification for the July 25 workspace-card pass: the workspace dashboard/card suite passed with 116 tests after the Upcoming Show work, and the focused Trade Board/dashboard label suite passed with 93 tests after the button-copy update.
- Local Next.js production builds passed for both release steps. Vercel previews were built and the stable alias was promoted after each approved change.
- The former `7cafd213 chore: standardize Sparkle Suite release flow` demo-alias
  rule is superseded on July 31, 2026. Approved Sparkle Suite code/content
  changes now include commit, push, exact-tip Vercel production deployment,
  live-domain confirmation, and verification at
  `https://www.yoursparklesuite.com` unless Louis explicitly opts out.

---

## July 10 Workspace UI State

- Commits shipped in this UI pass: `b96b7e84` live-preview Nic-Nac sidecar, `50051b8c` toggleable/closed-by-default sidecar, `9f26d1ed` simplified Nic-Nac branding, `56383876` Sparkle Suite Workspace lockup, `a71e25ed` Trade follow-up copy, `55cd428e` duplicate glance-card removal, `cb48f80b` contained workspace chat shell, `1f2b6a6e` duplicate-header removal attempt, and `a8b7e1d4` final compact-header correction.
- The Sparkle Suite Workspace header retains product identity, notifications, and a responsive rep profile. The profile now opens an account menu with `Log out`; the redundant top Nic-Nac search field and `Preview site` action are intentionally absent.
- The final bottom navigation uses shorter fixed tab heights and additional shell/safe-area padding so icons and labels remain contained instead of clipping below the viewport.
- Focused workspace suites passed with 115 tests; adjacent branding/font-scale suites passed with 15 tests; local and Vercel Next.js 16.2.1 production builds passed.
- Local synthetic reviewer smoke reached the final desktop workspace and verified a visible 56px header, no `Ask Nic-Nac anything...` header input, a document height equal to the 720px viewport, all five 46px bottom tabs ending above the viewport edge, no framework overlay, and no console warnings/errors. The in-app Browser DOM snapshot capability failed, so checks used bounded page evaluation and screenshot evidence. Louis elected to perform the final deployed/manual smoke after release.
- The released workspace is verified at the canonical live surface, `https://www.yoursparklesuite.com`.

---

## Unified Workspace

As of June 19, 2026, the Sparkle Suite binder/Open Brain files have been folded back into the active repo. Future Codex sessions should open `C:\Users\louis\sparkle-suite-repo` as the workspace so code, docs, memory, plans, handoffs, and project skills all sit under one sandbox boundary.

The old `C:\Users\louis\sparkle-suite` folder remains on disk only as a redirect/archive. Active memory now lives in this repo:

- `vault\project-state.md`
- `vault\session-log.md`
- `vault\decisions.md`
- `vault\open-items.md`
- `.agents\skills`
- `docs\sparkle-suite`
- `docs\superpowers\plans`

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Platform (Vercel + Next.js) | Live | Connected to GitHub repo |
| Supabase | Active for Sparkle Suite referrals, Trade Board, and Team Management beta | Non-item-number Trade Board migrations `20260629150000` and `20260629151000` were applied with Supabase CLI on June 29, 2026; Alpine Opal appearance preset migration `20260702005259` was applied July 2, 2026 and Mile High Fizz persisted settings were verified as `alpine_opal`; Team Management onboarding migration `20260702120000` was applied July 2, 2026 with Brittany enabled as `manual_beta`; `trade_listings.design_id` is nullable only for `listing_source = 'non_item_number'`; `rep_referral_paid_months` and `trade_listings.ring_size` are applied/verified |
| GitHub vault | Active | Being set up this session — bridge memory system |
| Open Brain | Planned | Phase 2 — Supabase + pgvector + Discord capture bot |
| Chrome extension | Live (sideload) | Live Reveal Queue exists as sideload band-aid — rebuild as Web Store extension is Phase 2 parallel track |
| Nic-Nac | Shared-core architecture priority | Sparkle Suite is the launch priority, but Nic-Nac should be one shared ecosystem agent for Sparkle Suite and Sparkle Finder, with product-scoped permissions/tools/destinations rather than copied assistants |

---

## Nic-Nac Ecosystem Architecture

Forefront decision as of June 16, 2026: Nic-Nac should be one shared Sparkle ecosystem agent. Sparkle Suite and Sparkle Finder should route into the same Nic-Nac core: shared model adapter, workflow engine, jewelry intake state, photo-role rules, catalog truth, tool registry, evals, and smoke harness.

Sparkle Suite remains the priority product for launch. Sparkle Finder can wait, but future Suite-side Nic-Nac changes should avoid Suite-only assumptions that would prevent shared use later. When Sparkle Finder Silver needs jewelry-library intake, it should plug into this same core with different product context, permissions, account tier, and final mutation destination.

June 21 architecture lock: linked Sparkle Suite reps should experience the same production Nic-Nac across Sparkle Suite and Sparkle Finder, with shared memory and surface-gated actions. The private rep code is now the Secret Rep ID Number: it remains the Live Queue sync code and also becomes the Sparkle Finder rep-claim code that links a Finder user to the durable Sparkle Suite `rep_id`. Claimed reps receive Sparkle Finder Silver tier and a visible BP Rep / verified rep badge, but no extra Finder powers beyond Silver.

Nic-Nac's public personality foundation is now locked as September Virgo: organized, detail-minded, service-oriented, practical, warm, sweet, professional, and lightly quirky/funny. He is named after one of Louis's pet rabbits, and should keep that origin warm/simple if asked about his name. He may mention being a Virgo only if asked directly or during light/playful conversation; he should not volunteer astrology in normal work sessions. He should stay mission-focused around Sparkle Suite, Sparkle Finder, Bomb Party, live shows, social selling, business goals, collectors, jewelry, streaming/hardware guidance, and system help. Off-scope general chatbot, therapy, or grocery-list use should be politely redirected.

Sparkle Lab is the separate proactive improvement loop. It belongs inside Control Center and may create internal findings, replay/eval cases, trouble-ticket analyses, business-health reports, research briefs, and recommendations across Nic-Nac, Sparkle Suite, Sparkle Finder, Ops, and Research. Neither production Nic-Nac nor Lab Nic-Nac may mutate production behavior without approval. Sparkle Lab should not run continuously; default direction is a weekly scheduled run, initially Sunday at 2:00 AM America/New_York for Monday morning results, with explicit usage reporting. Initial hard caps are $5 weekly run, $20 monthly scheduled cap, $2 manual/on-demand run, $3 urgent issue run unless raised, 20 weekly model calls max with 4 premium/deep calls max, 20 minutes weekly runtime, 250 candidate records, 25 deep-analyzed items, 3 headline findings, and 2 active work priorities.

Current implementation progress toward that architecture: Suite Nic-Nac now has OpenAI-only model/provider routing for Nic-Nac runtime, model/product/surface/actor/cost telemetry, a shared product context contract, a Suite route surface-gated tool intent policy with explicit per-intent capability requirements, reusable core persona/surface prompts, automatic bounded safe memory context from existing `rep_notes`, deterministic duplicate physical Trade Board listing confirmation, and internal Sparkle Lab budget cap helpers. Linked Finder contexts can keep the `memory` intent available at the core-policy level while Suite workspace mutation intents remain blocked until the user is in Sparkle Suite. Suite also has server-only `/api/internal/finder/rep-claim` and `/api/internal/finder/rep-memory` bridges for Finder. Rep claim validates the Secret Rep ID Number with a server token and requires the matched rep to be active and public-Finder eligible through a paid workspace or ready launch-build path. Rep memory uses a separate server token and returns only bounded safe linked-human summaries assembled from Suite `rep_notes`. `SPARKLE_FINDER_TO_SUITE_REP_MEMORY_TOKEN` and `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN` are configured in Suite and Finder Vercel production/preview. Sparkle Lab has an applied schema for bounded runs/findings/artifacts, a read-only internal `/control-center/lab` page, a feature-flagged deterministic manual runner endpoint, an authenticated weekly cron route wired for Sunday overnight but disabled by default, deterministic recommendation artifacts with usage/limit summaries, and a default-off model synthesis harness that can create Lab report artifacts only when `SPARKLE_LAB_MODEL_SYNTHESIS_ENABLED=true`. Lab synthesis now requires an approved Nic-Nac pricing entry before it makes a paid model call, so unapproved model overrides are skipped with a lab note instead of undercounting spend. Finder Nic-Nac route code now uses an OpenAI-only policy adapter instead of hardcoded Anthropic Haiku, its system prompt receives linked-rep surface context so Suite mutations are redirected back to Sparkle Suite while preserving same-assistant identity, automatically preloads safe Finder customer memory, merges safe Suite linked-rep memory for linked reps only, and filters requested Finder intents through a product-context tool policy before building active tools. Finder Studio now has a `read_my_studio_intake_status` tool that reads app-owned upload/submission state and redirects missing/replacement files back to `/silver#showcase-studio` instead of pretending chat can accept files. Linked reps asking for Suite workspace mutations from Finder receive a blocked-action boundary and no Finder tools exposed for that turn, including mixed mutation+memory asks, while ordinary Finder memory/discovery remains allowed. Suite and Finder Nic-Nac routes now also apply a conservative mission guard that redirects clear off-mission therapy, grocery-list, homework/content, travel, medical, legal/financial, and general-chatbot requests before expensive memory/tool/model setup. Suite has deterministic route-order and route-runtime proof that the redirect persists/logs a zero-cost static response before Suite memory, workflow, tool, or model setup. Finder has a repeatable local `smoke:finder-nic-nac` configured-model harness plus explicit `smoke:finder-nic-nac:guard` missing-key guard harness. Deployed Finder now has `OPENAI_API_KEY`, explicit model env vars, Secret Rep ID claim storage, service-role table grants, a passed deployed browser claim smoke, a passed deployed linked-rep Nic-Nac OpenAI stream smoke, an applied/verified Nic-Nac telemetry schema on the remote Finder Supabase project, and a secured deployed telemetry runtime smoke that passed with zero residual rows. Baseline Nic-Nac AI/memory disclosure is now implemented, pushed, deployed, and live-checked in Suite and Finder privacy policies, terms, and signup/account acknowledgment copy; attorney review and broader marketing copy remain launch-readiness follow-up. Suite deployment `dpl_4yTnu2v4T3gyPvHe1B52ZGRLMct1` is on `https://sparkle-suite-demo.vercel.app`. Finder deployment `dpl_Fp6ZPoRVKhzsJkGXZMwFMZPKjo8p` is on `https://sparkle-finder-dev.vercel.app`. Remaining shared-Nic-Nac work is deeper Finder tool parity and a deployed Finder auth/smoke path for non-personal verification when preview auth is disabled.

---

## Current Priority

As of June 21, the immediate migration/control-center priorities are:

1. Louis/Brittany need a safe logged-in smoke of Brittany's Team Management beta: create one real/test-by-Louis onboarding participant, open the Start Strong invite, sync progress/messages, and archive when finished. Do not create fake rep accounts.
2. Louis/Brittany still need to review/accept Britt With Bling, with extra attention on editable Join Team cards.
3. Louis/Heather still need to review BlingKitchen on
   `https://www.yoursparklesuite.com` before any custom-domain cutover.
4. Louis/Lindsey still need to review Mile High Fizz on Alpine Opal at
   `https://www.yoursparklesuite.com` before any domain cutover; the Trade Board
   should stay empty until Lindsey adds real pieces.
5. Control Center is now growing into the internal operating workspace; customer/demo account database polish, editable account status/notes, and richer billing details remain next-step work.
6. Continue Phase 1 closeout and Phase 2 prep after these migrated public sites and Control Center v1 workflows are accepted.

Older priority notes below are retained as historical context until fully cleaned up.

1. Finish Bri's Glowtique (last two Readdy builds — pending client review and launch)
2. Finish Bling Kitchen (last two Readdy builds — calendar automation next)
3. Phase 2 starts immediately after both are complete

---

## Recent Migration State

- **Brittany Team Management beta:** Local checkpoint `1b36629 feat: add team onboarding management beta` adds entitlement-backed Team Management access, private onboarding participants, public invite-token APIs, progress/message sync, archive controls, and the standalone `apps/rep-onboarding` Start Strong app deployed at `https://britt-with-bling-start-strong.vercel.app`. Follow-up checkpoints `78d6e26 feat: add team public card manager` and `74ca64b test: unlock team management reviewer smoke` add dashboard-managed public Join Team cards and a passing stable-demo synthetic reviewer-smoke for the unlocked Team Management UI. Brittany's `brittwithbling` demo/live-transition account was verified in the linked DB as `active` with Team Management `manual_beta` access. No fake participant rows or rep accounts were created. First real invite smoke should use Louis or Brittany with a real invite link.
- **Mile High Fizz:** July 2 supersedes the earlier bespoke-only framing. The Mile High Fizz look is now reusable **Alpine Opal** (`alpine_opal`, `AO-01`) and Mile High Fizz itself uses the standard Amethyst Home/Trade/Join template model with normal skin switching. Its default/persisted demo skin is Alpine Opal, team copy is `Diamond Peak Society` / `The Virtuous Fizzers`, and its public Trade Board is intentionally empty until Lindsey adds pieces.
- **Britt With Bling:** Pushed checkpoint `2617b8c feat: migrate Britt With Bling public site`. Route shape follows Mile High Fizz; diamonds/unicorns/FAQ are intentionally not carried forward. Join Team remains important and must keep team-member cards/photos/links/copy editable by Nic-Nac/site data.
- **BlingKitchen:** Pushed/deployed checkpoint `ccd4456 feat: migrate BlingKitchen public site` uses Heather's Ready.ai/Readdy export and keeps a special Pantry/recipe page at `/blingkitchen/in-the-pantry`. Recipes are DB-backed and editable through Nic-Nac plus the dashboard Recipes section.
- **Recipe content model:** Public-site recipes include title, slug, category, prep time, servings, description, ingredients, steps, note, TikTok URL, card/modal images, image alt/crop, order, and visibility. Public loader should be DB-first with BlingKitchen fallback recipes only when needed.
- **Tenant/account:** Heather's BlingKitchen username is `blingkitchen19@gmail.com`. A temporary password was set during the session; keep it out of long-term docs and rotate after handoff.

### July 2, 2026 Alpine Opal + Mile High Fizz Standard Site Model

- Alpine Opal (`alpine_opal`, `AO-01`) is a reusable Sparkle Suite skin derived from Mile High Fizz's visual direction. It is available for any rep, not a Lindsey-only fork.
- Mile High Fizz now follows the same standard switchable public-site model used by BlingKitchen after Moonstone: shared Home, Trade, and Join templates with active skin tokens.
- Mile High Fizz default/persisted demo state is Alpine Opal. Supabase read-back verified `milehighfizz | alpine_opal | Diamond Peak Society`.
- Public copy uses Lindsey's actual context: `Diamond Peak Society` is Lindsey's team and `The Virtuous Fizzers` is the team Lindsey belongs to.
- Mile High Fizz Trade Board should be empty until Lindsey adds pieces; an empty customer board is expected, not a missing-data bug.
- Alpine Opal implementation checkpoint: `c8f8d92 fix: apply Alpine Opal demo migration`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app`.
- Alpine Opal closeout demo target: `https://sparkle-suite-i8vavj4do-louis-2849s-projects.vercel.app`.
- Alpine Opal closeout deployment id: `dpl_EJYJE6nHpMLgtrXWcgPbNVGRegSh`.
- Verification passed: focused Mile High Fizz/skin/site-settings tests, `npm run qa:amethyst`, local `npm run build`, isolated local Playwright smoke for the three Mile High Fizz routes, Supabase migration/read-back, stable route 200 checks, stable template payload checks, and final stable screenshot review for Trade hero readability.

### June 21, 2026 Control Center + Public-Site Header/Ticker Hardening

- Control Center now has the plain title `Sparkle Suite Control Center`, a left-hand options column, Trouble Tickets, Customer Database, and Demo Database sections.
- Customer Database shows only the active customer accounts Louis named: Mile High Fizz/Lindsey, Britt With Bling/Brittany, and BlingKitchen/Heather. Other operator-visible reps belong in Demo Database until durable account classification exists.
- Customer/Demo databases are collapsible so future Control Center sections can sit below them without forcing long scrolling.
- Customer rows track phone, promo code, and promo-code usage fields; known paying-client phone numbers were not found in repo-local Open Brain/HQ memory and remain open fields until supplied or discovered from an authorized source.
- BlingKitchen purple-screen/live-preview issue was repaired with public asset cache busting and stable-demo verification.
- BlingKitchen public-site audit/repair fixed missing CTA labels, hero contrast, asset cache issues, and route rendering.
- Customer-site header hardening is now based on a single shared `SparkleSuiteHeaderStack` in `public/amethyst/homepage.jsx`. Mile High Fizz, Britt With Bling, BlingKitchen, and the default Amethyst homepage all call this same header/ticker/Live Queue code path instead of maintaining bespoke header copies.
- Trade Board and Live Queue are wired into the public homepage payload and header stack from workspace-backed data, not merely static placeholder text.
- Public ticker behavior now uses one casual/medium speed everywhere: default/preset `tickerSpeed: 1`, shared homepage/join/trade CSS uses `72s`, and both announcement and Trade Board rows use the same duration. The static design-system ticker examples and React site shell were aligned to the same `72s` setting.
- Latest stable demo closeout: `https://sparkle-suite-demo.vercel.app/blingkitchen` served the new `20260620-ticker-casual` assets; stable CSS had two `calc(72s / var(--ticker-speed, 1))` durations and no old `26s`/`68s` ticker durations.

---

## Memory Architecture

| Layer | Status | Description |
|-------|--------|-------------|
| GitHub vault | Active (bridge) | This folder — plain Markdown, readable by any AI |
| Supabase context store | Phase 2 | Postgres-backed structured context |
| Open Brain | Phase 2 | pgvector semantic search + Discord capture bot |
| Obsidian | Phase 2 | Visual interface layered over the same vault files |

---

## Sparkle Suite Cloud Work Direction

Louis wants Sparkle Suite work to use bigger autonomous batch missions without forcing him to manage small pipeline chunks. As of June 2, 2026, the near-term operating model is local-first because Codespaces/GitHub OAuth tooling blocked progress. GitHub remains the source-control backup, and cloud workbenches can be reselected later by Louis.

- one current local repo/session finished safely at a time
- commit and push completed or meaningful checkpoints to GitHub
- use `C:\Users\louis\sparkle-suite-repo` for Sparkle Suite implementation/build/test/commit/push
- keep `C:\Users\louis\sparkle-suite` as the lightweight binder/Open Brain bridge only
- keep the laptop as the active local Sparkle Suite workbench unless Louis reselects Codespaces
- let Vercel serve deployed sites from GitHub and Supabase serve live app data

Codespaces candidates remain paused reference items:

| Product/Repo | Current local/GitHub name | Target name | Notes |
|--------------|---------------------------|-------------|-------|
| Sparkle Suite | `neon-rabbit-core` | `sparkle-suite` | Main rep-side platform, workspace, public site, and product logic. |
| Sparkle Finder | `sparkle-suite-customer` | `sparkle-finder` | Customer/collector hub for rep discovery, live calendars, trade browsing, jewelry search, customer profiles, and Silver/Nic-Nac collector features. |
| Sparkle Rep Onboarding | `britt-with-bling-start-strong` | `sparkle-rep-onboarding` | Productized onboarding/resource launchpad for reps; not a replacement for Bomb Party University training. |
| Sparkle Marketing | `sparkle-suite-marketing` | `sparkle-marketing` | Marketing source of truth for Suite and Finder. Can stay local/lightweight unless it becomes build-heavy. |

### June 1, 2026 Update

The cloud-first workflow is now partially implemented.

- Sparkle Suite and Sparkle Finder Codespaces were created and smoke-tested as 4-core cloud workbenches.
- GitHub currently allows two running Codespaces at once, so Sparkle Suite is the likely always-on primary while Sparkle Finder and Sparkle Rep Onboarding rotate in the second slot.
- Sparkle Finder local folder is now a lightweight binder at `C:\Users\louis\sparkle-suite-customer`.
- Sparkle Rep Onboarding local folder is now a lightweight binder at `C:\Users\louis\britt-with-bling-start-strong`.
- Full old repo archives are preserved under `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01`.
- Sparkle Suite full old local repo is archived at `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\neon-rabbit-core`.
- Sparkle Suite lightweight binder is staged at `C:\Users\louis\Sparkle-Suite-Binder-Staging\neon-rabbit-core`.
- Sparkle Suite local folder swap is pending and must be completed from a neutral Codex chat because this session is running from `C:\Users\louis\neon-rabbit-core`.
- Sparkle Suite Chrome extension/live queue source and package history are protected. Reps use the Chrome Web Store extension, but future extension work must read `.agents/skills/sparkle-live-queue/SKILL.md` first.

### June 2, 2026 Update

Local repo recovery replaced the pending Sparkle Suite swap path for current work:

- Binder: `C:\Users\louis\sparkle-suite`
- Active repo: `C:\Users\louis\sparkle-suite-repo`
- GitHub repo: `louis623/sparkle-suite`
- Current work branch: `codex/sparkle-cross-phase-hardening`
- Current local preview: `http://localhost:3000/`
- Codespaces are paused unless Louis explicitly reselects them.

The first local review checkpoint was pushed to GitHub as `8ca775d feat: polish public signup Nic-Nac flow`. It covers the simplified landing header, espresso `/start` form card, compact pink Ask Nic-Nac buttons, fixed `/start` compact launcher layout, and signup-process Nic-Nac knowledge/tests.

### June 10, 2026 Update

Current Sparkle Suite work remains local-first in `C:\Users\louis\sparkle-suite-repo` on `codex/sparkle-cross-phase-hardening`, with the binder at `C:\Users\louis\sparkle-suite` used only for notes and Open Brain bridge memory.

- Stable demo alias: `https://sparkle-suite-demo.vercel.app`
- Stable demo target at that time: `https://sparkle-suite-kkz9729yp-louis-2849s-projects.vercel.app`
- Sparkle Suite repo is clean and synced with `origin/codex/sparkle-cross-phase-hardening`.
- Referral program is implemented for demo/review: reps can see/copy their referral code/link in Account, referred paid months are tracked, and one credited month is earned after a referred rep has three paid subscription months.
- Louis confirmed there is no hard cap on referrals at launch.
- The pre-launch Stripe live smoke and webhook gate remains open and must be completed before real paid launch.
- Account/Billing layout was fixed to fill the available workspace column at 100% browser zoom beside the fixed Nic-Nac panel, with compact account typography and no horizontal overflow.
- Chrome reviewer-smoke was completed against the stable demo Account view after the Chrome connector was activated.
- Local implementation now includes ring-size capture for Trade Board ring listings: RG/ring adds carry `ringSize`, Trade Board listings have a `ring_size` column migration pending deploy/application, and Nic-Nac's add-listing prompt tells him to ask for size when it is not visible on the box/details photo.
- Ring-size intake and migration are pushed and deployed. Supabase migration `20260610131500_trade_listing_ring_size.sql` was manually applied through the Dashboard, verified, and hardened in commit `23f8a04` for future CLI sync.
- Fulfillment queue audit completed against code, tests, build, and stable Chrome reviewer-smoke. Backend/API/tool/UI wiring is present and passing focused verification. Stable demo reviewer workspace shows the Trade Board fulfillment queue empty state with `0 active swaps` and no console warnings/errors. Remaining gap: no seeded reviewer data yet for a full fulfillment mutation smoke.
- Fulfillment reviewer-smoke improvements are now implemented and pushed: `8988e7c feat: seed reviewer fulfillment smoke path` and `e42c251 fix: preserve fulfillment completion feedback`. Verified deployment `https://sparkle-suite-kkz9729yp-louis-2849s-projects.vercel.app` passed Chrome reviewer-smoke for seeded fulfillment: approved -> shipped -> completed, queue emptied, history showed one completed trade, received-piece prompt appeared, and Trade Board panels loaded without the previous `ring_size` 500. Stable alias now points to this deployment.

### June 14, 2026 Update

Sparkle Suite theme/readability hardening was completed on branch `codex/sparkle-cross-phase-hardening`.

- Latest pushed checkpoint: `b441fc7 fix: harden theme readability across workspace`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app/`.
- Current stable demo target: `https://sparkle-suite-1wz21xae9-louis-2849s-projects.vercel.app`.
- Deployment rule clarified after a miss: for Sparkle Suite demo work, deploy/review means the stable demo alias. Do not tell Louis work is deployed if it only exists on a raw Vercel preview URL, unless he explicitly requested that preview URL.
- Verification passed: focused theme tests, local `npm run build`, Vercel preview build, stable demo alias update, and HTTP smoke checks for `/amethyst/Homepage.html` and `/amethyst/Trade.html` on the stable demo alias.

### June 14, 2026 Morganite Auto-Save Update

Sparkle Suite theme selection has been simplified and deployed for review.

- Current pushed checkpoint: `c784149 fix: lock workspace theme to morganite autosave`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app/`.
- Current stable demo target: `https://sparkle-suite-40lfm648i-louis-2849s-projects.vercel.app`.
- Sparkle Suite workspace, Site Settings service updates, Nic-Nac site-setting tool updates, required setup draft/publish paths, and Amethyst preview template data now coerce site appearance to `sparkle_suite_morganite`.
- Site Settings no longer renders the bottom `Save site settings` button. Changes auto-save with visible status text such as `Changes will auto-save.` and `All changes saved.`.
- Required setup no longer presents alternate Look/skin choices; it confirms Sparkle Suite/Morganite only.
- Verification passed locally: focused suite `7 files / 137 tests`, adjacent public-site/setup suite `9 files / 167 tests`, local `npm run build`, in-app browser synthetic reviewer-smoke workspace check, auto-save interaction, live-site preview payload check, and final local `npm run build`.
- Vercel preview build passed and stable demo alias was updated.
- Deployed smoke passed: `/`, `/start`, `/amethyst/Homepage.html`, and `/api/amethyst/homepage-template` on `https://sparkle-suite-demo.vercel.app/`; homepage-template payload contains `sparkle_suite_morganite`.
- Standing operating rule added to binder decisions: implementation changes intended for Louis smoke testing should be committed, pushed, deployed, and promoted to the stable demo alias by default unless Louis says not to.

### June 15, 2026 Customer-Site Skin Precedence Lesson

The customer-facing skin bug was traced to stale required-setup answers overriding saved Site Settings after the dashboard was already unlocked.

- Current pushed checkpoint: `0b1563c fix: honor saved customer site skin after setup`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app/`.
- Current stable demo target: `https://sparkle-suite-jwth5hebr-louis-2849s-projects.vercel.app`.
- Root cause: `self_serve_setup_sessions.answers.site_skin.selectedLook='AM-01'` could override saved `site_settings.appearance_preset`, forcing Amethyst on the customer-facing route.
- Correct rule: after `dashboard_unlocked`, saved Site Settings own customer-facing public site appearance; setup drafts only influence active setup states.
- Verification rule: do not call theme/skin bugs fixed unless the exact stable-demo customer route/live-preview route is checked after saving, including a stale required-setup state audit.
- Dedicated lesson: `docs\sparkle-suite\lessons\2026-06-15-customer-site-skin-precedence.md`.

### June 15, 2026 Sparkle Suite Polish Closeout

The active Sparkle Suite branch is clean, pushed, and deployed for Louis review at the stable demo alias.

- Current pushed checkpoint: `a440944 fix: move site settings save into settings header`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app/`.
- Current stable demo target: `https://sparkle-suite-ni9tlg2a6-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_DuW2PuoQfYFiZjrAqRpYbhbia7nN`.
- Customer-facing site skins are editable again from Site Settings; the workspace itself remains on the standard Sparkle Suite workspace look.
- The Site Settings manual save action now lives in the Site Settings card header with the status text beside it. The floating bottom-right save dock was removed.
- Verified save behavior on stable demo reviewer-smoke: edit a setting, status changes to `Unsaved changes.`, `Save site settings` enables, save succeeds, status changes to `Site settings saved.`, and the button disables again.
- Browser verification used reviewer-smoke/synthetic workspace, not Louis's personal account.
- Focused test passed: `tests/nic-nac-dashboard-placeholder.test.ts` with 68 tests.
- Local `npm run build` passed, Vercel preview build passed, and stable demo alias was promoted to the new deployment.

### June 11, 2026 Update

Founder pricing checkout hardening is implemented and pushed in active repo commit `4aea52b fix: harden founder pricing checkout`.

- First 20 paid reps receive founder monthly pricing; rep 21 starts standard monthly pricing.
- Checkout requires `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, and `STRIPE_PRICE_STANDARD_MONTHLY`.
- New migration `20260611133605_ss_founder_pricing_uniqueness.sql` adds unique founder sequence guards plus atomic assign/release RPCs.
- Founder slot assignment reuses the lowest available slot after an unpaid checkout release.
- Standard pricing is not permanently written to `reps` before payment succeeds.
- Stripe webhook handling now includes `checkout.session.expired` so unpaid founder reservations can be released.
- Live/test webhook setup helpers now include `checkout.session.expired`.
- Vercel preview deployed: `https://sparkle-suite-m0hk7hofl-louis-2849s-projects.vercel.app`.
- Verification passed locally: focused billing/referral/live-readiness bundle passed 142 tests, `npm run build` passed, and preview Chrome reviewer-smoke opened the synthetic reviewer workspace and Account/Billing with no console warnings/errors.

Live paid launch is still blocked until the Supabase migration is applied remotely, live Stripe prices/webhook are created or verified, Vercel production env vars are set, and a controlled live Stripe preflight/checkout smoke passes with Louis's action-time approval.

### June 11, 2026 Live Stripe Preflight Update

Louis approved pulling Vercel Production env and running the live Stripe preflight. Production env was pulled to the ignored local file `C:\Users\louis\sparkle-suite-repo\.local\vercel-production.env`.

- Focused founder/Stripe/referral tests still pass: 103 tests across pricing, checkout, webhook, referral, migration SQL checks, and live-preflight guardrails.
- Live preflight blocked before any live checkout/payment action.
- Current Production env issue: `STRIPE_SECRET_KEY` is present but test-mode.
- Current Production env issue: `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, `STRIPE_PRICE_STANDARD_MONTHLY`, and `NEXT_PUBLIC_APP_URL` are present but empty in the pull.
- Current Production env issue: live approval marker envs are missing: `STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID`, `STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID`, `STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID`, `STRIPE_LIVE_APPROVED_SMOKE_PATH`, and `STRIPE_LIVE_APPROVED_AT`.
- `STRIPE_LIVE_SMOKE_CONFIRMED` remains unset, which is correct until Louis explicitly approves a final controlled live checkout smoke.

### June 11, 2026 Production Self-Serve Signup Update

Production self-serve signup is enabled and live checkout open-only smoke passed.

- Current branch: `codex/sparkle-cross-phase-hardening`.
- Current pushed checkpoint: `a60ceff fix: preserve Supabase RPC binding in checkout`.
- Production deployment: `dpl_58RLxmtyi14FzMx7CM29g3fvn53X` / `https://sparkle-suite-jib4a2a9h-louis-2849s-projects.vercel.app`.
- Production public app: `https://www.yoursparklesuite.com`.
- Vercel Production now has `SPARKLE_SELF_SERVE_ENABLED=true` plus live Stripe pricing/webhook env.
- Live Stripe prices:
  - Build fee: `price_1ThAmIQYwdFOcEdvyAlTox0V`.
  - Founder monthly: `price_1ThAmIQYwdFOcEdvWmNm96yG`.
  - Standard monthly: `price_1ThAmJQYwdFOcEdv3HQwDV0V`.
- Supabase Dashboard SQL editor was used to apply and verify:
  - `20260611133605_ss_founder_pricing_uniqueness.sql`.
  - `20260602150000_ss_stripe_event_processing_status.sql`.
- Live `/start` smoke created a synthetic account and opened Stripe Checkout showing `$99.98` today, then `$49.99/month`, with the expected founder line items.
- The smoke Checkout Session was expired without payment; replayed expiration webhook returned 200 and released founder slot `1`.
- Repo is clean and synced with `origin/codex/sparkle-cross-phase-hardening`.

Remaining caveat: no real live payment was submitted. The first actual paid signup should be watched for `checkout.session.completed`, `invoice.payment_succeeded`, subscription row creation, required setup state, and referral reward tracking.

### June 12, 2026 Live Trade Swap Workflow Update

The live Trade Board swap workflow is implemented, pushed, deployed to production, smoke tested, and pressure tested on `codex/sparkle-cross-phase-hardening`.

- Current branch: `codex/sparkle-cross-phase-hardening`.
- Current pushed checkpoint: `f0e573a chore: add trade swap smoke script`.
- Related commits:
  - `8cc4916 docs: plan live trade swap workflow`.
  - `a7e283a feat: capture live trade swap replacements`.
  - `f0e573a chore: add trade swap smoke script`.
- Repo is clean and synced with `origin/codex/sparkle-cross-phase-hardening`.
- Production deployment: `dpl_6W9CwLuwJEsJcytPV2eWnuJrfEXE` / `https://sparkle-suite-auzh791m0-louis-2849s-projects.vercel.app`.
- Production public app: `https://www.yoursparklesuite.com`.
- Vercel aliases confirmed for production include `https://sparkle-suite.vercel.app`, `https://www.yoursparklesuite.com`, `https://sparkle-suite-louis-2849s-projects.vercel.app`, `https://sparkle-suite-louis-2849-louis-2849s-projects.vercel.app`, and `https://yoursparklesuite.com`.
- Stable demo alias was not changed this session; production was updated.

New workflow behavior:

- Trade approval asks the rep: `Which item number was just revealed for the customer?`
- Known non-ring jewelry design: approves the trade and auto-adds the revealed item back to the Trade Board.
- Known ring with size: approves the trade and auto-adds the revealed ring with `ring_size`.
- Known ring without size: approves the trade and records cleanup status `needs_ring_size`.
- Unknown item number: approves the trade and records cleanup status `needs_catalog_details`.
- Swap cleanup queue gives the rep an after-show list of approved swaps that still need catalog details or ring size.

Schema state:

- Supabase project verified: `bqhzfkgkjyuhlsozpylf`.
- Migration `20260611190000_trade_swap_revealed_item_capture.sql` was manually applied through Supabase Dashboard SQL editor.
- `public.trade_swaps` is present with RLS enabled, owner/admin policies, replacement status tracking, revealed item fields, replacement listing linkage, and expected indexes.
- Verification query returned table present, RLS enabled, 11 columns, expected policies, and expected indexes.
- Manual Dashboard SQL apply was used because Supabase CLI auth/linking remains unresolved; the committed migration is idempotent for future CLI sync.

Verification state:

- Focused trade-swap tests passed: 16 files, 233 tests.
- Public/customer board language tests passed: 2 files, 87 tests.
- Standard Nic-Nac tests passed: 14 files, 157 tests.
- Tight smoke suite passed: 7 files, 101 tests.
- `npm run build` passed locally.
- Vercel production build passed.
- DB-backed trade swap smoke passed and cleaned all synthetic rows.
- Production browser UI smoke passed and cleaned all synthetic rows.
- Pressure test passed across backend race handling, duplicate request blocking, blank validation, cross-rep blocking, rapid double-submit, cleanup persistence, and public request validation.

Remaining caveats:

- Real live-show extension timing and multi-device human behavior were not tested directly.
- Stronger rep notification/alert escalation is still tabled pending Louis's own timing research and smoke testing.
- Supabase CLI auth/linking still needs restoration.
- Fulfillment received-piece link-back remains open.
- First real paid signup still needs monitoring because no real live payment has been submitted.

### June 12, 2026 Support Report Intake Update

Support report intake is implemented, pushed, deployed to production, and smoke tested on `codex/sparkle-cross-phase-hardening`.

- Current pushed checkpoints:
  - `69d04af feat: add support report intake`.
  - `502a0c0 chore: add support report smoke script`.
- Production deployment:
  - `dpl_Gj9u8FvFs83j4tBDww4qCmKsSnHm`.
  - `https://sparkle-suite-6es8y9mh5-louis-2849s-projects.vercel.app`.
  - Public app: `https://www.yoursparklesuite.com`.
- Added Help & Resources support form for site issues, bugs, suggested upgrades, and workflow ideas.
- Added Nic-Nac `submit_support_report` tool and routing so Nic-Nac can file user feedback/reports.
- Added `public.support_reports` migration with RLS, operator-ready status fields, urgency ranking, notification status, and dashboard sorting/filtering support.
- Added operator support report API for the future backend dashboard.
- Created Google Chat space `Sparkle Suite Support Reports` and configured the incoming webhook through server-only env `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL`.
- Added `npm run smoke:support-report` to create a synthetic support report, require Google Chat delivery, verify the DB row, and clean synthetic data.

Verification passed:

- Focused support-report tests: 8 files, 35 tests.
- Local `npm run build`.
- Supabase migration applied and verified in project `bqhzfkgkjyuhlsozpylf`: table present, RLS enabled, 20 columns, admin/owner-select policies, no rep insert policy, and expected indexes.
- Vercel env list shows encrypted `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` for Production and Preview branch `codex/sparkle-cross-phase-hardening`.
- `npm run smoke:support-report` passed with `notification=delivered`, `google_chat_configured=true`, and `cleanup=true`.
- Synthetic report cleanup verified: `support_smoke_residual_count=0`.
- Vercel production build passed.
- Production unauthenticated route protection passed for `/api/nic-nac/support-reports` and `/api/control-center/support-reports` with `401`.

### June 12, 2026 Support Report E2E Demo Verification

- Support report UX fix is deployed at current production `dpl_AGEtbyJXSckPU6AJHZC8JycVGesf` / `https://sparkle-suite-kvlid78g9-louis-2849s-projects.vercel.app`.
- Stable demo alias was updated from stale June 10 preview `dpl_BBUswPb5yksSADfMEr41ZRtq8wig` to current preview `dpl_4oTDBVaXzu9CdoGZZC7J6WvNncFW` / `https://sparkle-suite-dpvm5rn6z-louis-2849s-projects.vercel.app`.
- Chrome reviewer-smoke verified the stable demo workspace without using Louis's personal account.
- Help & Resources Support Path now has a visible `Send a report to support` callout and working `Start report` button.
- Help form E2E passed: UI success, `support_reports` row persisted as `source=help_form`, Google Chat delivery status `delivered`, operator queue visibility/update verified, synthetic row cleaned up.
- Nic-Nac report path E2E passed at the backend/deployed-tool level: live Nic-Nac created a `source=nic_nac` row, Google Chat delivery status was `delivered`, assistant completion persisted, synthetic row cleaned up.
- Caveat: the live Nic-Nac browser stream did not display the persisted assistant completion until reload. After reload, `Report saved... Louis notified.` was visible and the input was enabled. Track as Nic-Nac streaming/hydration polish; delivery/storage worked.

### June 12, 2026 Nic-Nac Stream Recovery Polish

- Stream recovery polish is implemented, pushed, and deployed from checkpoint `4ef57bb fix: recover completed Nic-Nac streams`.
- Production deployment: `dpl_2ZYXiBykKP4a3wLWMuoe2SXD4CkT` / `https://sparkle-suite-cwrfjue9o-louis-2849s-projects.vercel.app`.
- Stable demo alias updated to preview deployment `dpl_Lh1fTTsAfXQF4ShXEdrbEaKLaPEo` / `https://sparkle-suite-o3hqf93no-louis-2849s-projects.vercel.app`.
- Nic-Nac now recovers when a tool-backed assistant response is completed in persisted conversation state while the active chat UI is still stuck in `submitted` or `streaming`.
- Verification passed: focused Nic-Nac/support report suite, local production build, Vercel production/preview builds, Vercel alias inspect, and live stable-demo Nic-Nac support-report smoke at the database/tool-delivery level.
- Live smoke row `1ee07cdb-42f1-4fed-80cb-c605ef30aaed` was created with `source=nic_nac` and `notification_status=delivered`, the assistant completion persisted, and the synthetic support report was cleaned up.
- Chrome automation caveat: the active conversation tab could be claimed and URL-confirmed, but DOM/screenshot capture timed out after the smoke. Reloading the conversation remains an acceptable visual fallback if Chrome capture stalls.

### June 12, 2026 Support Command Center and Support Auditor

- Support Command Center v1 is implemented, pushed, deployed, and stable-demo verified.
- Current pushed checkpoint: `597e5c4 fix: align support smoke with production env` on `codex/sparkle-cross-phase-hardening`.
- Production deployment: `dpl_HqowEV7A7hKgytjz32aDNSgbqQxX` / `https://sparkle-suite-sjcx33xt3-louis-2849s-projects.vercel.app`.
- Public app aliases include `https://www.yoursparklesuite.com`, `https://yoursparklesuite.com`, and `https://sparkle-suite.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` now points to the same deployment.
- `/control-center` now renders the support command center for operators instead of redirecting to old intake.
- New support schema is applied and verified in Supabase project `bqhzfkgkjyuhlsozpylf`: `client_account_profiles`, `support_audits`, `support_lessons`, support report audit/profile/resolution columns, RLS, policies, and indexes.
- Support report intake now snapshots the client profile, runs `Support Auditor`, stores an audit row, then sends a single enriched Google Chat alert with client/show/phone/email, issue summary, audit status, findings, and recommended first action.
- Support lessons can be captured on resolution closeout for future reuse.
- Verification passed: focused support suite (12 files, 50 tests), local production build, Vercel production build, DB-backed smoke with Google Chat delivery/audit/lesson/cleanup, and stable-demo Help & Resources UI submission with Supabase cleanup.
- Vercel Production `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` was corrected after verification found the key existed but was empty.
- Caveat: Supabase CLI link/auth is still unresolved, so Dashboard SQL editor was used for this migration.
- Follow-up pressure test checkpoint `2f7e0c8 chore: pressure test support system` added `npm run pressure:support-system`.
- Pressure script passed twice: 3 synthetic reps, 14 reports, 14 captured alerts, 14 completed audits, 1 forced notification failure verified, 1 reusable lesson, 0 cleanup residuals.
- Pressure test found and fixed one UI weak point: Support Path could still be collapsed behind a generic disclosure in the live demo. It now opens by default so the support form is visible immediately.
- Latest production deployment after the pressure fix: `dpl_B4WwrW71eXUN6E1nq2SL5uXUuTE4` / `https://sparkle-suite-my21lhpsy-louis-2849s-projects.vercel.app`.
- Stable demo alias points to the latest deployment and Chrome verified `Send a report to support`, `Start report`, form fields, and `Send report` are visible immediately.
- Follow-up copy gate checkpoint `d2cd203 fix: clarify support report workflow gate` clarified Support Path instructions and added a required workflow-first confirmation checkbox to the support report form.
- Support Path now tells reps to start at the top of Help & Resources, use the relevant workflow guide, follow applicable steps, ask Nic-Nac if still blocked, then submit a support report.
- Production deployment for the support workflow gate: `dpl_3qYAoEcftAKq9VFBWGXWZsWzVzVd` / `https://sparkle-suite-3jlon2lad-louis-2849s-projects.vercel.app`; later dashboard-link deployments superseded it.

### June 12, 2026 Permanent Dashboard Link

- Permanent dashboard link is live: `https://www.yoursparklesuite.com/dashboard`.
- Stable demo dashboard link is live: `https://sparkle-suite-demo.vercel.app/dashboard`.
- `/dashboard` redirects to `/control-center` so the Support Command Center remains the canonical dashboard implementation.
- Current pushed checkpoints:
  - `e8d8632 feat: add permanent dashboard link`
  - `acb2866 fix: preserve control center login redirect`
- Latest production deployment: `dpl_1263MMazGNtj5asngnGfazcVnXGi` / `https://sparkle-suite-kf9ahff5v-louis-2849s-projects.vercel.app`.
- Vercel stable demo alias was updated to the same deployment.
- Verification passed: focused redirect test, local `npm run build`, Vercel production build, and deployed HTTP checks showing `/dashboard` redirects to `/control-center` on both demo and public domains.
- Supabase Auth URL Configuration was corrected after Louis saw HQ open from the permanent link:
  - `SITE_URL` changed from `https://neon-rabbit-hq.vercel.app` to `https://www.yoursparklesuite.com`.
  - Added Sparkle Suite redirect wildcards for `www.yoursparklesuite.com`, `yoursparklesuite.com`, `sparkle-suite.vercel.app`, and `sparkle-suite-demo.vercel.app`.
  - Left the old HQ redirect wildcard in place for legacy safety, but the default auth Site URL no longer points to HQ.
- Post-fix live checks confirmed `https://www.yoursparklesuite.com/dashboard` lands on Sparkle Suite login at `/login?redirect=%2Fcontrol-center`, with no HQ content.

### June 12, 2026 Workspace Blank Panel Fix

- Louis reported the stable demo workspace center pane was blank after clicking Trade Board, Calendar, and other sections.
- Root cause: `/api/nic-nac/account-billing` returned `500`, and dashboard section rendering was gated on account billing resolving to `hasPaidWorkspace=true`. Other workspace endpoints such as Trade Board were healthy.
- Fix checkpoints on `codex/sparkle-cross-phase-hardening`:
  - `4240396 fix: prevent blank locked workspace sections`
  - `84ebca7 fix: keep workspace access when billing details degrade`
- The dashboard now shows a visible account/access fallback instead of a blank center panel when access is loading or missing.
- Account billing now keeps subscription/access status usable even if optional Stripe billing details or referral summary lookups degrade.
- Latest production deployment: `dpl_5Qwqc4EL6fUkWpRQzRcWkC2Ei7mt` / `https://sparkle-suite-5md5qf0f5-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` points to the fixed deployment.
- Verification passed: focused account-billing/dashboard tests, local `npm run build`, Vercel production build, Vercel logs showing account-billing `200`, and Chrome click smoke on Louis's demo tab for Trade Board, Jewelry Library, Calendar, Site Settings, Help & Resources, and Account.

### June 12, 2026 Nic-Nac Durable Preference Memory Fix

- General persistent rep preference memory is now implemented for explicit future-memory requests in Nic-Nac.
- Current pushed checkpoints:
  - `1d18458 fix: route explicit Nic-Nac memory preferences`.
  - `ce70136 fix: timestamp Nic-Nac memory writes server-side`.
- Latest production deployment: `dpl_3vFJ3ZTYmb6soijYM8ByEEzBZTLr` / `https://sparkle-suite-4t8jjh33k-louis-2849s-projects.vercel.app`.
- Stable demo alias `https://sparkle-suite-demo.vercel.app` points to the final deployment.
- Explicit future preference requests now route to both `memory` and `show_memory` when live-show context is present, while "for this show" stays scoped to show-session memory.
- `write_rep_note` now stores `conversation_date` from the server clock so new memories remain recent even if the model supplies a stale date.
- Verification passed: focused Nic-Nac memory/show tests (7 files, 62 tests), local `npm run build`, Vercel production build, Chrome stable-demo memory smoke, Supabase run/note verification, and synthetic row cleanup.
- Caveat: broad unrelated Nic-Nac/support sweep still has stale branding/shared-knowledge test expectations; Vercel logs also showed two unrelated public Sparkle Finder 500s during the final scan.

### June 13, 2026 Mile High Fizz Sparkle Suite Shell

- Mile High Fizz is now provisioned in production Supabase as a Sparkle Suite tenant, without DNS/domain cutover.
- Rep id: `f82734fd-6964-42c7-b67d-c2445528c3b4`; auth user id: `16a8f68e-92a8-41fd-889d-9e61ce5017bb`.
- Public slug is `milehighfizz`; production `custom_domain` is intentionally `null` until cutover.
- Live Queue sync code is `MHF-9446`.
- Site settings use Amethyst / Black Diamond, `show_join_page=false`, and Mile High Fizz/Lindsey TikTok links.
- New local routes are `/milehighfizz` and `/milehighfizz/trade`; the Trade Board is the standard shared rep-scoped Sparkle Suite board.
- Local verification passed focused tests, local build, production Supabase read-back, Supabase Auth temp-login check, local route/template checks, and Playwright-rendered screenshots.
- Not yet pushed or deployed from this local checkpoint.

### June 15, 2026 Nic-Nac Trade Board Intake and Smoke Harness State

- Active Sparkle Suite repo: `C:\Users\louis\sparkle-suite-repo`.
- Active branch: `codex/sparkle-cross-phase-hardening`.
- Stable demo URL remains `https://sparkle-suite-demo.vercel.app`.
- Latest shipped stable demo before the current in-progress regression fix: deployment `dpl_EbYmG5BAwdSVFKi2puZV9BovAoWA`, preview `https://sparkle-suite-q58ia542f-louis-2849s-projects.vercel.app`, commit `8450bdb fix: separate label photos from listing photos`.
- Current active repo is dirty with an uncommitted Nic-Nac Trade Board intake fix. Do not describe this newest fix as deployed until it is committed, pushed, deployed, and stable-demo alias verified.
- In-progress fix scope:
  - Keep Trade Board tools active when the rep corrects Nic-Nac for mistaking a label photo as a jewelry photo.
  - Preserve `add_listing` on correction/retry turns.
  - Clarify prompt hierarchy: label/details photos are label-only; boxed display photos are valid only when provided as the customer-facing jewelry photo.
  - Add regression tests for the exact failure language Louis saw.
- Verification already run on the in-progress state:
  - `npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/tool-routing.test.ts` passed: 52 tests.
  - `npm exec vitest run tests/nic-nac` passed: 579 tests, 1 skipped.
  - `npm run build` passed.
- Smoke-test gap remains open:
  - Local Next server startup in Codex was blocked by Windows/session process restrictions.
  - Use stable demo reviewer-smoke/browser automation with synthetic rep accounts and local fixture photos for true end-to-end Nic-Nac add-listing smoke.

### June 16, 2026 Nic-Nac ER13229 Stable-Demo Closeout

- The June 15 Nic-Nac Trade Board in-progress warning is superseded. The ER13229 workflow-truth and boxed-photo confirmation fixes are now committed, pushed, deployed, and stable-demo verified.
- Latest pushed checkpoint: `bbb66a4 fix: promote boxed photo after collection confirmation`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-6c0807k4k-louis-2849s-projects.vercel.app`.
- Verification passed: focused required-setup test, full Nic-Nac suite, local `npm run build`, Vercel preview build, and three consecutive deployed ER13229 replay smokes with reviewer account `sparkle-reviewer+preview@neonrabbit.net`.
- Caveat carried forward: one successful smoke branch still used awkward/internal-sounding confirmation wording around workflow/photo indexes. Future Nic-Nac edits should polish that rep-facing language without weakening workflow-state truth.
- Future architecture follow-up: Sparkle Finder Silver should share this jewelry intake architecture for adding missing pieces to the jewelry library/catalog. The target mutation differs from Trade Board listing creation, but photo-role rules, collection acceptance, hard-fail gates, and real uploaded-image smoke should match.

### June 16, 2026 Public Site Context Routing Hardening

- Louis's light post-fix test confirmed the ER13229 listing could be added, then exposed a customer-site/workspace mismatch: the rep workspace Trade Board showed `ER13229 / The Florence Earrings`, but the public customer-site Trade Board showed old seeded/default inventory such as `Birthday Bloom Ring`.
- Root cause: public slug rendering could start with the right rep context, but browser refresh/API requests like `/api/amethyst/trade-board` did not always carry the same `repId`/`publicSiteSlug`, so targeted pages could fall back to demo/default data.
- Latest pushed checkpoint: `68fc332 fix: harden public site context routing`.
- Stable demo alias: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-1k5a4e5xv-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_EopEe8p6QKN6ZTqGdUoFnFH3DaWM`.
- Architectural fix: added shared public-site request target resolution for `c`/`repId`, `publicSiteSlug`, slug path/referrer context, and real custom domains; preserved both rep id and slug in runtime template data; excluded canonical platform hosts from custom-domain matching; made targeted public loaders fail closed; and made public trade requests verify expected rep ownership where possible.
- Browser static public JS now merges runtime context into Trade Board refresh, trade request, signup/audience, and unsubscribe API/form calls so hydration and client-side refreshes do not drop the target.
- Verification passed locally: explicit Amethyst/public-site/trade-request service suite, 24 files and 175 tests; local `npm run build`; Vercel preview build; stable demo alias confirmation; and a stable-demo root curl returning Sparkle Suite HTML.
- Caveat: Codex did not run a full Chrome reviewer-smoke/Nic-Nac UI flow after this deploy. Louis ran a light manual test on the stable demo and reported everything seemed to be working.

### June 18, 2026 Mile High Fizz Hybrid Migration and Site Migration Skill

- Active Sparkle Suite repo: `C:\Users\louis\sparkle-suite-repo`.
- Active branch: `codex/sparkle-cross-phase-hardening`.
- Latest pushed checkpoint: `899db82 fix: restyle mile high fizz join page`.
- Stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-ovf2bqfy6-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_E1wE9yon1Ai82nBusv4VXwYbxjcF`.
- Active repo is clean and synced through `899db82`.
- Post-`68fc332` shipped checkpoints:
  - `fd4ea3e fix: silence accepted photo warnings in Nic-Nac`
  - `486d68e fix: require years in birthday collection names`
  - `c1bcfbf fix: stack trade board workspace cards`
  - `fa67db5 feat: add reveal screenshots to trade requests`
  - `55a2ae9 docs: update trade request help flow`
  - `99a7597 fix: tune customer ticker speed`
  - `2baf30c fix: speed up customer tickers`
  - `28c3fb9 fix: unlock Mile High Fizz migration workspace`
  - `23cbad0 feat: add Mile High Fizz hybrid public site`
  - `90a2ecb fix: migrate mile high fizz homepage shell`
  - `7356a90 fix: restyle mile high fizz homepage sections`
  - `2191355 fix: restyle mile high fizz trade board`
  - `899db82 fix: restyle mile high fizz join page`
- Mile High Fizz public site is now a bespoke hybrid migration rather than a generic Black Diamond/Amethyst skin. Homepage, Trade Board, and Join page have Mile High Fizz visual direction, copy, and routing while keeping Sparkle Suite automation behavior.
- Final Join-page verification passed: focused Mile High Fizz public-site suite (11 tests), `npm run qa:amethyst` (64 tests plus local link checks), local `npm run build`, Vercel build, stable alias promotion, and stable desktop/mobile screenshot review.
- New project skill created: `C:\Users\louis\sparkle-suite\.agents\skills\sparkle-suite-existing-site-migration\SKILL.md`. It should be used for the next two rep website migrations and any future existing-site import into Sparkle Suite.

### June 18, 2026 Trade Request Confirmation Fix

- Louis reported that a customer Trade Board request with an uploaded reveal screenshot flashed away after submit and did not show a success confirmation.
- Root cause was customer UI state, not the screenshot/storage migration: a demo-sheet effect depended on `availableSamples`, so the post-submit board refresh cleared `requesting`, `success`, and `requestError`.
- Latest pushed checkpoint: `1635ce1 fix: keep trade request confirmation visible`.
- Stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-pyfv4xpp7-louis-2849s-projects.vercel.app`.
- Branch: `codex/sparkle-cross-phase-hardening`.
- Active repo `C:\Users\louis\sparkle-suite-repo` is clean and synced through `1635ce1`.
- Verification passed:
  - TDD regression for customer success/error sheet visibility.
  - Focused Trade Board/request/storage/Nic-Nac suite: 7 files, 59 tests.
  - `npm run qa:amethyst`: 3 files, 65 tests, plus local link checks.
  - Local `npm run build`.
  - Local screenshot-backed multipart smoke and 6-request pressure smoke.
  - Vercel preview build.
  - Stable alias HTTP check.
  - Deployed screenshot-backed API smoke.
  - Deployed rendered customer-page smoke showing `Request sent.` remained visible after refresh with no console errors.
- Synthetic smoke data and uploaded screenshot objects were cleaned up locally and after deployed stable smoke.

### June 27, 2026 Nic-Nac Front Photo Handoff Confirmation Fix

- Latest code checkpoint: `bfd443b fix: recover Nic-Nac front photo handoff confirmations`.
- Stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-ld0rnr0nn-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_D91GuAWK1RQ3bjhJ5aZij23TKy7F`.
- Branch: `codex/sparkle-cross-phase-hardening`.
- Louis reported a remaining add-listing edge where several pieces saved successfully, then a perfect front jewelry photo was visually accepted by Nic-Nac but the save step claimed the photo handoff was still stuck.
- Root cause: workflow photo role promotion did not recognize the rep repair phrase `Push it through, please. It's a good photo.` after Nic-Nac's `I've got the front photo visually...` save-handoff warning, leaving the stored image URL as an unknown photo instead of a confirmed `jewelry_front` photo.
- Fix: expanded the guarded workflow confirmation recognizers for push-through/good-photo language and save-handoff/front-photo visual acknowledgment language. This only promotes stored photos when Nic-Nac already asked to confirm or identified the front jewelry photo context.
- Verification passed: red/green regression for the exact path, focused route-context suite, add-listing recovery suite, full Nic-Nac suite, local production build, Vercel preview build, stable alias check, stable health check, and deployed reviewer-smoke Trade Board intake replay with synthetic account cleanup.
- Practical lesson: if the model can see the image but the save tool cannot, inspect workflow photo state (`declared_role`, `role_confirmed`, `image_url`) before treating the photo itself as bad.

### June 27, 2026 Trade Board Ticker Detail Simplification

- Latest code checkpoint: `3becf3d fix: simplify trade board ticker details`.
- Stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-a7zpv3cez-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_57EfLWMfoKCyTNEvJaznK3vLKhEC`.
- Branch: `codex/sparkle-cross-phase-hardening`.
- Customer-facing Trade Board ticker now shows item name, item type, and collection instead of MSRP/price.
- Verification passed: homepage ticker regression, Amethyst homepage/join/trade unit phase, broader Amethyst static/template tests, Vercel preview build, stable alias update, stable root 200, and deployed homepage asset inspection confirming the new ticker line with no old price fallback.
- Caveat: local `npm run build` hung in the Codex shell without compiler output; Vercel's production build completed successfully.

### July 3, 2026 Nic-Nac Durable Calendar Tool Context

- Active branch: `codex/sparkle-cross-phase-hardening`.
- Stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Nic-Nac Calendar work now has durable app-owned workflow state in Supabase table `public.nic_nac_calendar_workflows`; tool routing merges active workflow intents with the latest turn so Calendar tools stay available through long conversations, corrections, and short replies.
- `add_show` treats description as optional, and "no description"/"leave blank" keeps Calendar tools available instead of falling back to memory-only handling.
- Targeted public sites no longer use generated BlingKitchen fallback cards after Supabase resolves a real rep with zero events. Missing real rows must now be fixed in `calendar_events`.
- Real BlingKitchen event inserted: `4cbba9fe-cd32-46df-ad62-24bc7c689894`, Friday July 3, 2026 8:00 PM EDT, TikTok Live, duration 150 minutes, description blank, discount code `bling123`, featured collection `July Birthday Collection`.
- Verification passed locally: focused Nic-Nac/public calendar suites, production `npm run build`, Supabase migration push/list verification, linked DB query, and local service smoke returning the real BlingKitchen event.

### July 4, 2026 Nic-Nac Calendar Tool Contract and Weekday Recurrence

- Latest pushed checkpoints:
  - `9e14d46 fix: support weekday calendar series`
  - `0aa1996 fix: guard calendar update duration patches`
- Stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Current stable demo target: `https://sparkle-suite-c1b192dk4-louis-2849s-projects.vercel.app`.
- Deployment id: `dpl_BYfWohZhHq1kw2rGYdpGXPPJGJrS`.
- Calendar recurrence now treats `weekday` / Monday-Friday as first-class structured cadence, separate from daily and weekly. Ongoing weekday requests materialize as 130 future weekday rows, skipping Saturdays and Sundays.
- Calendar workflow state now stores normalized local start time, parses shorthand time ranges and durations, and combines date-only follow-ups with previously captured time.
- Calendar mutation tools now defend against model drift: `add_show` strips recurrence that was not captured by workflow state, and `update_show` drops `durationMinutes` unless the latest rep turn explicitly asks to change duration/length.
- Workspace Calendar now loads a wider event window and has previous/current/next month controls, so generated recurring rows can be inspected beyond the first visible week.
- The working architectural lesson is now explicit: Nic-Nac is filling an app-owned workflow form with model-assisted extraction. The form/state machine must be smarter, durable, and safer; do not try to script every possible rep phrasing.
- Verification passed locally: focused Calendar/route/dashboard tests, broad Nic-Nac suite with 915 passing tests and 1 skipped, and production `npm run build`.
- Stable-demo pressure smoke passed against the deployed alias with conversation `6ea818bc-820b-4476-acfd-5223eb336f76`, run tag `0703200456`, and cleanup of 147 synthetic calendar rows.
- Pressure smoke verified one-time shows, exact-count two-Tuesday repeat, weekly recurring series, weekday recurring series, code/collection updates, single-occurrence skip, bounded pause, one-time cancel, future-series cancel, public-site visibility, and cleanup.
- Carry-forward for Trade Board and Trade tools: apply the same durable workflow contract, active tool retention, model-input sanitization, DB assertions, public visibility checks, and deployed pressure smoke pattern before declaring those tools hardened.
