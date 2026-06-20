# Decision Log

All key architectural, tooling, and operational decisions — logged with date and rationale.

---

## June 20, 2026

**Sparkle Suite task closeout should commit, push, deploy, and promote the stable demo by default**
Louis reiterated that finished Sparkle Suite tasks should be committed, pushed, deployed, and made available for review automatically unless he explicitly says not to. For demo/review work, the closeout target remains the stable alias `https://sparkle-suite-demo.vercel.app`, not only a raw Vercel preview URL.

**Control Center is becoming the internal operating workspace**
The `/control-center` surface should use the plain title `Sparkle Suite Control Center` and grow beyond support tickets into operator/customer management. Customer records should be clean, expandable rep profiles with contact, billing, website/social, status, and notes instead of a spreadsheet-style dump.

---

## June 19, 2026

**Sparkle Suite binder now lives inside the repo**
The durable Sparkle Suite binder/Open Brain files were folded back into `C:\Users\louis\sparkle-suite-repo` so code, docs, vault memory, plans, handoffs, and project skills share one Codex workspace boundary. Future Sparkle Suite sessions should open the repo directly with workspace-write access. The old `C:\Users\louis\sparkle-suite` folder is retained only as a redirect/archive.

**Existing-site migrations use the Mile High Fizz route shape unless Louis says otherwise**
For rep-owned Ready.ai/Readdy migrations, do not preserve every page by default. Preserve the outside site's brand and important content, then fit it into the Sparkle Suite hybrid public-site shape. Britt With Bling keeps Home, Trade, and Join; BlingKitchen keeps Home, Trade, Join, plus the special recipe route.

**Source export remains the intake gate for faithful migrations**
The Britt With Bling and BlingKitchen passes reinforced the Mile High Fizz lesson: exact migrations require the source/project export/repo. Live URLs and screenshots are useful references, but they are not enough for faithful layout, asset, and content transfer unless Louis explicitly accepts a close recreation.

**Rep-maintained migrated content must become Nic-Nac/dashboard editable**
If a migrated site has content the rep will reasonably change, do not leave it hardcoded after initial import. Britt With Bling team cards and BlingKitchen recipes are the current examples. Nic-Nac and the dashboard should be able to add, edit, remove, reorder, hide/show, and update images/links/copy for those content groups.

**BlingKitchen recipes are a first-class public-site content type**
Recipes should be DB-backed public-site content with Nic-Nac tools and a dashboard Recipes section. The public Pantry page should load database recipes first and fall back to the migrated Ready.ai recipe set only for BlingKitchen when no DB recipes exist.

**New Supabase public tables need explicit Data API grants**
When adding new public-schema app tables, include explicit grants for `authenticated` and `service_role` as appropriate in the migration. Supabase CLI/changelog checks during the recipe work showed that relying on old default grants can create avoidable runtime surprises.

**Binder/repo split needs a repo-side bridge**
The current Sparkle Suite setup is a binder plus separate implementation repo. To avoid repeated approval prompts while preserving Open Brain instructions, future implementation sessions should open the repo as the writable workspace and let repo `AGENTS.md` instruct agents to read the binder first. This pattern should also be used for Sparkle Finder.

---

## June 16, 2026

**Nic-Nac must be one shared ecosystem agent, not copied per product**
Sparkle Suite and Sparkle Finder should not have separate copy-pasted Nic-Nac assistants. The long-term architecture decision is one shared Nic-Nac core used by the whole Sparkle ecosystem: shared model adapter, workflow engine, jewelry intake logic, photo-role rules, catalog truth, tool registry, evals, and smoke harness. Each product should pass product context, permissions, account tier, and destination into that shared core.

**Sparkle Suite remains launch priority while preserving shared-core architecture**
Sparkle Suite is still the priority product for launch and near-term hardening. Sparkle Finder work can wait, but Sparkle Suite Nic-Nac changes should avoid Suite-only assumptions that would make a later shared Sparkle Finder integration a rewrite. When Nic-Nac reaches launch-good-enough in Sparkle Suite, Sparkle Finder Silver should plug into the same Nic-Nac core rather than receiving a fork.

**Product context changes the destination, not Nic-Nac's identity**
For Sparkle Suite, the shared Nic-Nac core may end a jewelry intake workflow by adding a rep Trade Board listing. For Sparkle Finder Silver, the same core should end the equivalent workflow by adding or updating jewelry library/catalog data. The rules, tools, intake state, and eval expectations should stay shared; only allowed capabilities and mutation destination differ by product/account.

**`/Nic-Nac` is the house command for loading the Nic-Nac skill**
When Louis or a future teammate starts a request with `/Nic-Nac`, the agent should treat it as an explicit instruction to load and follow `sparkle-nic-nac-agent-architecture`. This convention is now included in the skill metadata, body, and UI metadata so future sessions should recognize it before touching Nic-Nac architecture, tools, photo roles, routing, evals, or smoke tests.

**Public customer-site context is a first-class contract**
Sparkle Suite public/customer routes and APIs must carry rep/site identity through one shared target resolver and runtime context, not through per-page assumptions. Valid target sources include explicit `c`/`repId`, `publicSiteSlug`, slug path/referrer context, and real rep custom domains. Canonical platform hosts such as `yoursparklesuite.com` and `www.yoursparklesuite.com` must not be treated as rep custom domains.

**Targeted public pages must fail closed instead of falling back to demo data**
When a customer-facing page is targeted to a rep or public slug, missing or unresolved data should show an empty/closed state for that target rather than silently showing seeded/default/demo inventory. The June 16 Trade Board mismatch proved that a page can initially render the right rep context and then lose it during client-side refreshes if the browser API call does not preserve the same target.

**Public mutations must bind to the resolved rep context**
Customer-facing actions such as Trade Board refresh, trade requests, signup/audience actions, and unsubscribe must carry stable rep/site context into API calls. Mutations should verify that submitted ids belong to the expected rep when possible so a stale card, wrong listing id, or lost target cannot act against another rep's board.

---

## June 15, 2026

**Saved customer-site settings own the live customer site after setup is unlocked**
After a rep reaches `dashboard_unlocked`, stale required-setup draft answers must not override workspace Site Settings for the public customer site or live preview. Required setup can guide onboarding while setup is active, but once the workspace is unlocked the saved Site Settings record is the source of truth for customer-facing skin, copy, routes, and visibility.

**Customer-site theme fixes require stable-demo route verification**
Do not mark a customer-facing theme/skin bug fixed from workspace state, API save response, or template payload alone. The required proof is: save through the real workspace path, read back persisted Site Settings, inspect required-setup state for stale values, verify the public template endpoint for the same rep/slug emits the selected preset, then verify the rendered stable-demo customer route and live-preview route at `https://sparkle-suite-demo.vercel.app/`. If the bug was "I saved a skin but the live site still shows Amethyst," the closeout must prove the rendered route no longer shows Amethyst.

**Stable demo is the only default review target for Sparkle Suite demo fixes**
Louis reviews Sparkle Suite demo behavior at `https://sparkle-suite-demo.vercel.app/`. A raw Vercel preview URL is only supporting evidence unless Louis explicitly asks to review that preview. Deployment closeout must include alias promotion/confirmation for the stable demo target.

**Site Settings uses an explicit save on the settings screen**
Sparkle Suite public/customer-facing Site Settings should use an explicit `Save site settings` action with visible status text. The save control belongs inside the Site Settings screen where the edits happen, not as a floating global dock over the workspace. This keeps the action scoped to the settings it changes and avoids confusion with unrelated workspace sections.

## June 10, 2026

**Ring size is physical listing data**
Bomb Party ring sizes are usually on the ring box, not the jewelry label. Sparkle Suite should treat ring size as data about the rep's physical Trade Board listing rather than shared catalog/design metadata. Nic-Nac should ask for the ring size before adding an RG/ring listing whenever it cannot read the size from a box/details photo.

**Sparkle Suite referrals launch without a hard cap**
Referral rewards should not have an artificial cap at launch. If a rep sends many legitimate paid referrals, Sparkle Suite should reward that behavior. Any abuse handling can start as manual review until real usage proves a need for automated limits.

**Referral reward rule**
The working referral rule is: after a referred rep has three paid subscription months, the referring rep earns one credited month. The user-facing Account section should explain this plainly and show the rep's code/link plus pending, earned, and credited counts.

**Stripe live smoke is a launch gate**
The referral automation is not considered launch-ready until live Stripe is checked immediately before launch: live webhook endpoint, live webhook secret in Vercel, required Stripe events, checkout flow, and referral credit behavior all need one controlled smoke test.

**Chrome reviewer-smoke is required for stable demo UI checks**
For Sparkle Suite demo verification, logged-in workspace smoke tests, Help & Resources checks, Account/Billing checks, and Nic-Nac UI checks, use the `sparkle-suite-demo-smoke` workflow and Chrome reviewer-smoke when the Chrome connector is available. If Chrome reviewer-smoke is skipped, say so explicitly and explain why.

**Stable demo alias is the Sparkle Suite demo deploy target**
For Sparkle Suite demo work, Louis expects to refresh `https://sparkle-suite-demo.vercel.app/`. A raw Vercel preview deployment URL does not count as deployed for Louis's review unless he explicitly asks for a one-off preview. After deploying a preview, move or confirm the stable alias points to the intended deployment before reporting that demo work is deployed.

**Sparkle Suite code changes should be pushed and deployed for Louis review**
When Sparkle Suite implementation changes are made for Louis to smoke test, the default closeout is: commit the active repo work, push the branch, deploy to Vercel, and update/confirm `https://sparkle-suite-demo.vercel.app/` points at the new deployment. Do not stop at local verification unless Louis explicitly asks not to deploy.

**Workspace pages should fill the available app column**
The rep workspace should not have an internal max-width that creates a large blank gutter beside the fixed Nic-Nac panel at 100% browser zoom. Keep the left workspace column fluid within the app shell, with stable spacing and no accidental horizontal overflow.

**Account/Billing typography should be compact**
Nic-Nac chat can remain intentionally larger for on-the-fly reading, but Account/Billing and similar operational dashboard areas should use smaller, consistent dashboard typography so cards feel like the rest of the workspace.

---

## March 29, 2026

**Open Brain confirmed as first-class Phase 2 requirement**
Supabase + pgvector confirmed as the permanent memory solution. Not optional. Must be completed before any other Phase 2 orchestration work begins.

**GitHub vault confirmed as bridge**
The `/vault/` folder in this repo is the interim memory system until Open Brain is live. All AI tools should read it at session start.

**AI tool compatibility — no proprietary lock-in**
Everything built must work equally with Claude and Gemini. No proprietary formats. Plain Markdown, standard SQL, open formats only. Rationale: race between Anthropic and Google means no safe bet on a single provider.

**NotebookLM added to confirmed stack**
NotebookLM confirmed as primary research tool. Use cases: intelligence reports, source synthesis, Bomb Party knowledge base building.

**Multitask by default**
Any task that can run via Claude Code or Co-work runs in parallel, never sequentially. This is a standing operating principle.

**Redundancy plan established**
- GitLab mirror for repo
- Supabase Pro daily backups plus weekly SQL export to Google Drive
- Make.com scenarios exported monthly
- 2FA required on all accounts
- API keys in `.env` only — never committed to repo
- Bitwarden for password management
- Key rotation every 90 days

**AI tool philosophy locked**
Claude is primary. Gemini is active backup. Both must work equally. No lock-in to either.

**Disaster recovery runbook flagged**
Flagged as a Co-work task to be completed once vault is live.

---

## Earlier Decisions (from master doc)

**Framework: Next.js 16 + TypeScript + Tailwind CSS + App Router**
Selected for Vercel-native deployment, strong ecosystem, and App Router for modern routing patterns.

**Hosting: Vercel**
Selected for seamless Next.js integration, preview deployments, and zero-config CI/CD from GitHub.

**Automation: Make.com**
Selected at $9/mo entry point. n8n identified as hot-swap if Make.com is outgrown.

**Email: Resend**
Selected for developer-friendly API. Postmark and SendGrid identified as hot-swaps.

**Scheduling: Cal.com**
Selected for open-source flexibility and clean embed experience.

**Payments: Stripe**
Standard selection for reliability and ecosystem.

**Agreements: SignWell**
Selected for e-signature workflow.

**DNS split strategy**
Cloudflare manages neonrabbit.net. Cheapnames manages client domains.

**Chrome extension — sideload first, Web Store second**
Live Reveal Queue shipped as sideload to unblock clients. Web Store rebuild is a Phase 2 parallel track.

**Obsidian as visual interface**
Obsidian layered over the same GitHub vault files for a visual knowledge graph. Does not replace the vault — it reads from it.

---

## May 31, 2026

**Sparkle Suite work moves toward cloud batch execution**
Louis wants large batch work to continue through `/goal` instead of many small stop/start chunks. The correct operating model is not to shrink the work; it is to move heavy repo work off the older Windows laptop and into GitHub Codespaces or equivalent cloud workspaces. The laptop should become the control panel, not the build machine.

**One big batch per repo, not many local builds at once**
Do not run multiple serious local repo builds/dev servers in parallel on Louis's laptop. Big batches are allowed and preferred, but each heavy repo should run in its own cloud workspace once Codespaces is stood up. Until then, work one heavy repo at a time locally.

**End-of-session safety rule locked**
Commit means a checkpoint saved locally. Push means backed up to GitHub. At session close, important work must be committed and pushed to GitHub so another machine or Codespace can resume it. Vercel deploys from GitHub; Supabase hosts app data; the laptop is not the production host.

**Codespaces pilot approved**
After current stopped sessions are safely closed, inventory the Sparkle Suite repos, make sure important work is pushed, then stand up GitHub Codespaces for the three heavy repos first: Sparkle Suite, Sparkle Finder, and Sparkle Rep Onboarding. Marketing can stay local/lightweight unless it becomes build-heavy.

**Sparkle repo naming direction**
Rename repo concepts toward clear product names:
- `neon-rabbit-core` should become `sparkle-suite` for the main rep-side platform and workspace.
- `sparkle-suite-customer` should become `sparkle-finder` for the customer/collector hub.
- `sparkle-suite-marketing` should become or remain `sparkle-marketing` for campaigns, videos, content plans, and marketing assets for Suite and Finder.
- `britt-with-bling-start-strong` should become `sparkle-rep-onboarding` because it organizes rep setup/access/resources rather than replacing Bomb Party University training.

---

## June 2, 2026

**Sparkle Suite near-term work is local-first again**
Codespaces remain useful in theory, but Codex Windows GitHub/OAuth tooling created a multi-day blocker. Near-term Sparkle Suite implementation, build, test, commit, and push work should happen in `C:\Users\louis\sparkle-suite-repo`, with GitHub as source control and backup. Codespaces are paused unless Louis explicitly reselects them.

**Binder and active repo are separate**
`C:\Users\louis\sparkle-suite` is the lightweight binder/Open Brain bridge only. Do not build, test, commit, push, install dependencies, or place app source/build artifacts there. `C:\Users\louis\sparkle-suite-repo` is the active local Sparkle Suite repo workbench.

**Post-launch landing review branch**
The post-launch landing/signup review is on branch `codex/sparkle-cross-phase-hardening` in `louis623/sparkle-suite`. Latest pushed checkpoint after the first local review pass: `8ca775d feat: polish public signup Nic-Nac flow`.

---

## June 10, 2026

**Ring size belongs on rep Trade Board listings**
Ring size is physical-item inventory data for Trade Board ring listings, not shared jewelry design data. Nic-Nac should capture `ringSize` when adding RG/ring items, and if the size is not visible from the label/photo/details, he should ask the rep for the size before adding the listing.

**Ring labels do not reliably include size**
Louis confirmed from live jewelry handling that Bomb Party ring size numbers are usually on the box somewhere but not on the label. Nic-Nac should not assume OCR/label capture will provide ring size.

**Manual Supabase dashboard apply is acceptable only as a recovery path**
When Supabase CLI auth/linking is blocked but Louis has opened and authorized Supabase in Chrome, a narrow dashboard SQL apply is acceptable for an active blocker if the local migration is first made idempotent, schema-qualified, and followed by a direct SQL verification query. CLI auth/linking still needs to be restored later.

**PostgREST schema cache reload belongs in schema migrations that unblock deployed app reads**
For deployed Sparkle Suite changes that add columns read by Supabase/PostgREST-backed app routes, include `NOTIFY pgrst, 'reload schema'` in the migration so the deployed app does not keep seeing a stale schema after the column exists.

**Stable demo alias moves only after reviewer-smoke clears the path**
Do not promote `https://sparkle-suite-demo.vercel.app` to a new preview merely because build/deploy succeeds. For logged-in workspace changes, use Chrome reviewer-smoke first and confirm the affected dashboard panels load without console errors/warnings.

**Fulfillment completion should guide the rep to add the received piece**
When a fulfillment item is marked completed, the UI should preserve a next-step prompt telling the rep to add the received piece to the board when ready. Automatic linking from `trade_fulfillment.received_listing_id` to a newly added listing remains a separate product decision.

---

## June 11, 2026

**Production self-serve signup can be enabled for beta once live checkout opens and unpaid sessions clean up**
Sparkle Suite production self-serve signup is acceptable for soft beta after live Stripe prices, live webhook endpoint, Vercel Production env, Supabase pricing RPCs, and expired-checkout cleanup are verified together. The June 11 smoke opened live Stripe Checkout and verified unpaid founder slot release without submitting payment.

**Open-only live Stripe smoke is the safe pre-payment gate**
For production billing readiness, it is acceptable to create a synthetic rep and open live Stripe Checkout without entering card details, then expire the Checkout Session and verify webhook cleanup. Do not submit real payment during this smoke unless Louis explicitly approves a real paid transaction at action time.

**Founder pricing slots are reservations until payment completes**
Founder pricing sequence numbers should be reserved during checkout to prevent race conditions, but unpaid/expired sessions must release the slot. A paid subscription is what makes the founder sequence durable.

**Manual Supabase dashboard apply remains a recovery path when CLI linking is blocked**
Because Supabase CLI linking is still not restored, manual Dashboard SQL application is acceptable for launch-blocking production migrations only when the migration is idempotent, directly verified, and PostgREST schema cache is reloaded. This was used for `20260611133605_ss_founder_pricing_uniqueness.sql` and `20260602150000_ss_stripe_event_processing_status.sql`.

**First real paid beta signup should be watched**
The production checkout page and expired-session webhook are verified live, but no real card/payment was submitted. The first actual paid signup should be actively monitored for `checkout.session.completed`, `invoice.payment_succeeded`, subscription row creation, required setup/Nic-Nac onboarding state, and referral reward tracking.

**Trade Board rep alert escalation is tabled until smoke testing**
Stronger rep alert status for new trade requests is a good candidate idea, but it should not be built yet. Louis wants to smoke test the actual live trade/swap workflow first and research the real timing pattern, because the expected flow is usually an immediate live-show swap between the rep and customer rather than a delayed request hours later.

---

## June 12, 2026

**Live trade requests are reveal swaps, not customer-shipped trades**
The canonical Trade Board workflow is a live-show swap: the customer dislikes the item just revealed, chooses an existing board piece, and the rep swaps the pieces while both pieces are still physically with the rep. The customer never has the just-revealed item, has no photos, and does not ship anything back.

**Item-number capture is the fast live-show anchor**
The rep-facing workflow should ask: `Which item number was just revealed for the customer?` That item number is the minimal reliable capture during a live show. If the jewelry design already exists in the catalog, Sparkle Suite can add the replacement board listing quickly; if not, the item number preserves the after-show cleanup trail.

**Do not depend on Live Queue for revealed item identity**
Live Queue remains useful for ordered reveal workflow, but it should not be used to infer the trade swap item number. It scrapes the Bomb Party ordered customer queue and reveal checked-off state; it does not provide revealed item numbers, reveal IDs, cue codes, or enough item-level context to strengthen trade capture.

**Unknown or incomplete replacement pieces should not block the show**
If the just-revealed item is unknown to the jewelry database, or if it is a ring missing size, approve the trade and put the swap into cleanup instead of forcing full Nic-Nac catalog intake during the live show. This preserves speed while keeping the rep accountable for after-show completion.

**Production pressure test clears tested trade-swap paths**
The June 12 implementation and pressure test found no functional issue in the tested backend/API/UI paths. Parallel approvals, duplicate requests, blank item numbers, cross-rep approval, rapid double-submit, known/unknown item handling, and cleanup persistence all behaved correctly. This is not the same as a real multi-device live-show timing test with extension behavior, so that remains a separate caveat.

**Additional rep alert escalation remains tabled**
Do not build stronger rep notifications for new trades yet. Louis wants to smoke test/research real timing first because most trades are expected to be immediate live-show conversations rather than delayed requests.

**Support reports should alert after Support Auditor, not before**
For v1 support intake, a report submission should save the report, run `Support Auditor` directly, store the audit, and then send one enriched Google Chat alert. Do not add a recurring cron for this path unless future volume/reliability evidence justifies it.

**Google Chat is the support messenger for now**
Louis prefers Google Chat over Telegram for support alerts. Vercel Production must have a non-empty `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL`; June 12 verification found and fixed an empty production value.

**One independent rep equals one client account profile for v1**
Sparkle Suite beta clients are independent reps, one client/account per rep. The canonical support-facing profile should live in `client_account_profiles` and be refreshed/snapshotted from existing rep/setup/subscription data when support reports come in.

**Support learning belongs in reusable lessons at resolution**
Support memory should accumulate when issues are resolved, not during raw intake. Approved resolution closeouts should create reusable `support_lessons` rows with affected area, symptom, root cause, fix/workaround, and tags so future Support Auditor runs can surface prior lessons.

**Support Command Center v1 is display-first**
The current `/control-center` replacement should be simple and reliable: support inbox, report detail, client profile, audit summary/findings, and display-only resolution/lesson state. Rich editing workflows can be added during the fuller dashboard rebuild.

**Support form should require the workflow-first confirmation**
Help & Resources support reporting should tell reps to start at the top of Help & Resources, open the relevant workflow guide, follow applicable steps, and ask Nic-Nac if still blocked before submitting. The form should include a required checkbox confirming those steps were tried so support reports do not become the first stop for ordinary workflow confusion.

**Permanent dashboard link is the public `/dashboard` path**
Louis-facing dashboard handoff should use one simple bookmark: `https://www.yoursparklesuite.com/dashboard`. Do not hand Louis raw Vercel deployment URLs as the regular dashboard link. `/dashboard` should redirect to `/control-center`, and protected dashboard access should preserve the post-login target with `/login?redirect=%2Fcontrol-center`.

**Supabase Auth Site URL must match Sparkle Suite, not HQ**
Sparkle Suite Supabase Auth URL Configuration should use `https://www.yoursparklesuite.com` as `SITE_URL`. The June 12 HQ redirect incident came from Supabase still pointing to `https://neon-rabbit-hq.vercel.app`, even though the app route itself was correct. Sparkle Suite redirect wildcards should remain allowed for `www.yoursparklesuite.com`, `yoursparklesuite.com`, `sparkle-suite.vercel.app`, and `sparkle-suite-demo.vercel.app`.

**Workspace sections must never blank because optional billing details degrade**
Paid workspace access may depend on subscription status, but optional account details such as Stripe payment method/invoice lookup or referral summary should degrade gracefully. If account/access state is loading or missing, the dashboard should show a visible account/access fallback rather than rendering an empty center panel.

**Durable Nic-Nac rep preferences require explicit future-memory language**
Nic-Nac should store lasting rep preferences/processes only when the rep clearly asks for future memory, such as "remember this for future chats", "from now on", "going forward", or "I prefer". Current-show language like "remember that for this show" should remain in show-session memory, not durable profile memory.

**Nic-Nac memory timestamps are server-owned**
Durable rep notes must use the server's current timestamp for `conversation_date`. The model may summarize the memory, category, and source, but it should not decide the stored timestamp because stale or invented dates can bury a new preference outside recent memory retrieval.

---

## June 15, 2026

**Nic-Nac Trade Board intake must be smoked like a real rep conversation**
Nic-Nac Trade Board add-listing QA cannot rely on prompt-text tests, route health checks, or unit tests alone. The workflow must be smoke tested end-to-end as a rep would use it: logged-in synthetic/reviewer account, real chat UI or real `/api/nic-nac` route, real upload parts, and the actual model/tool loop. A smoke run is not complete unless it proves the assistant keeps `add_listing` active, handles label photos and jewelry photos as separate inputs, and avoids manual-workaround language.

**Label/details photos are label-only**
For Trade Board intake, a label/details/tag/back-of-card photo is only a source for item details. Even if visible jewelry appears in that label/details photo, it does not satisfy the customer-facing jewelry photo requirement and must not be critiqued as the jewelry photo. Nic-Nac should extract details from the label, accept rep-provided collection/details, then ask for a separate customer-facing jewelry photo when that photo is still missing.

**Boxed jewelry display photos are valid customer-facing jewelry photos**
Earrings, necklaces, rings, and similar pieces may be photographed in their original Bomb Party box/display packaging. A boxed display photo is acceptable when the jewelry is centered, close, clear, and website-worthy. Nic-Nac should not demand unboxed, no-packaging, or plain-background retakes for a clear boxed display shot.

**Create a local smoke asset fixture folder**
Use a local folder such as `C:\Users\louis\sparkle-suite-smoke-assets` for repeatable Sparkle Suite smoke fixtures. It should hold known label photos, boxed jewelry photos, deliberately bad photos, and a simple cases file describing expected outcomes. Codex should use browser/Chrome automation with reviewer-smoke/synthetic sessions to run those fixtures through Nic-Nac rather than making Louis manually discover every edge.

---

## June 18, 2026

**Accepted Trade Board photos should not get extra pushback**
When a customer-facing jewelry photo is good enough to accept, Nic-Nac should add the listing and avoid quality caveats or "want to swap it?" language. Only genuinely unacceptable photos should trigger coaching or a retake request.

**Birthday collection names must include the year**
Birthday collection names must include the year in database, catalog, Trade Board, and Nic-Nac intake contexts, e.g. `April Birthday 2026`, `May Birthday 2026`, `July Birthday 2026`. Future years such as 2027 should remain distinct for set clarity, even when trades across years are allowed.

**Trade request descriptions replace item-number pressure**
Customer trade request copy should ask for a brief description of the just-revealed piece, including collection and type, rather than asking primarily for an item number. The form should recommend an optional reveal screenshot because it materially helps the rep facilitate the live trade.

**Reveal screenshots are short-lived trade-request evidence**
Reveal screenshots should be visible to the rep from the Trade Board request inbox/detail context. They do not need indefinite storage; short-lived retention is preferred so Sparkle Suite helps the rep during the trade without accumulating unnecessary image data.

**Mile High Fizz is a bespoke migration, not a reusable skin preset**
Mile High Fizz should remain a custom hybrid site: original MileHighFizz.com look/feel/content as closely as possible, with Sparkle Suite automations inserted and styled to match. It is not a generic Amethyst skin preset.

**Existing-site migrations require source code for exact work**
For rep websites that already exist, the migration intake gate is source code, a project export, or a repository. Screenshots and live URLs can guide comparison, but they are not enough for an exact migration unless Louis explicitly accepts a close recreation.

**Ask migration questions one at a time**
For fuzzy migrations, ask Louis one focused next question at a time. Long questionnaires are inefficient because early answers often resolve later questions.

**Sparkle Suite automations keep their behavior inside custom sites**
Trade Board, Live Queue, Calendar, Join, tickers, and Nic-Nac-managed settings should behave like standard Sparkle Suite automations even when placed inside a custom rep-branded website. The customization is the presentation layer unless Louis explicitly asks for behavior changes.

**Rep workspaces stay standard unless explicitly customized**
For Mile High Fizz-style public-site migrations, the rep workspace can remain normal Sparkle Suite. Custom branding belongs to the public customer site unless Louis asks otherwise.

**Trade request confirmation state must survive board refresh**
Customer trade request success/error state should be owned by the request sheet, not reset by changes to the available listing collection. A successful request normally removes or hides the requested listing, so customer confirmation cannot depend on `availableSamples` staying stable after submit.

**Trade request screenshot smoke needs two checks**
For reveal screenshot work, smoke both the backend evidence path and the visible customer confirmation path. The backend path must prove request creation, listing `pending_trade`, screenshot metadata/storage, and rep-scoped inbox visibility. The rendered customer path must prove `Request sent.` remains visible after the board refresh.

**Synthetic public-site smoke slugs must be valid public slugs**
Use lowercase alphanumeric slugs only, such as `codex45e01bea`. Do not use hyphenated smoke slugs for public-site route or targeted board smoke, because Sparkle Suite public-site slugs reject hyphens and invalid slugs can silently exercise fallback/demo inventory instead of the intended rep board.

**Control Center keeps demo accounts separate from active customer accounts**
The Control Center customer view should not mix smoke/reviewer/sample/demo reps with real customer accounts. Until durable account classification exists, treat Mile High Fizz, Britt With Bling, and BlingKitchen as the active customer database and render all other operator-visible profiles in a separate Demo Database with a visible Demo Account label.
