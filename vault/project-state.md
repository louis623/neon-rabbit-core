# Project State

## August 21-22, 2026 Session continuation - Nic-Nac history and Live Queue public-copy fixes

- **Nic-Nac Clear Conversation now prevents old-thread resurrection:** clearing is a durable, rep-scoped lifecycle action. The server now retires every active Nic-Nac conversation for that workspace while retaining message rows for audit continuity, so a stale tab or second persisted thread cannot become the next-login “latest” conversation. Focused persistence/routing/workspace tests passed (14 tests), the production build passed, and exact commit `62942282` was manually released as `dpl_AQosKipNWRHTzEPH2rx3ADe9qv5L`.
- **Live Queue popup close control is accessible:** the public shared customer-site close button now uses a visible dark glyph, hover/focus treatment, and an updated asset cache key. This was a customer-site template correction only; the protected Chrome extension was not touched. Commit `62a3c6f9` was manually released as `dpl_EKi7vdphq4QUyjWvpThfTp1ncS94` after 78 focused public-template tests and production build verification.
- **Live Queue public copy is deliberately calm and customer-facing:** retain **“Live Queue connected and ready”** while fresh; show **“Live Queue will open closer to the next show.”** when no queue snapshot exists; and show **“Live Queue is waiting for an update.”** when synchronization is delayed. Do not expose “stale,” “stale link,” or technical connector language to customers. Commit `60aca000` was manually released as `dpl_5DPXXN8qsjWDbt7KR9FC8xyCVim1`; focused public-template coverage passed (79 tests), both Sparkle Suite aliases resolve to it, and Heather’s public BlingKitchen template was read-only verified as currently receiving a live connected queue.
- **Heather’s assigned Live Queue code was verified read-only:** `BLI-3767` belongs to the BlingKitchen/Heather public-site record. Its `last_updated` field was null at the point checked, so it did not establish an active sync; no queue or extension state was changed.
- **Live verification remains account-safe:** authenticated synthetic browser acceptance is still unavailable because of the existing Codex browser/reviewer-runtime defects. Do not use Louis’s or a customer’s account as a workaround.

**Last updated:** August 22, 2026

---

## August 21, 2026 Session - Message Center audit, Control Center Task List, and Brittany handoff prep

- **Message Center automations audited healthy:** the daily recovery endpoint remains protected by `CRON_SECRET`; both required Message Center migrations are present; the customer-signup and resource-publication database triggers/functions are installed; and the outbox had no overdue retryable, failed, or stale-processing work. Focused automation coverage passed (83 tests). Current active-rep time zones are 12 `America/New_York` and 1 `America/Chicago`, so the 18:00 UTC daily run covers the present US-only audience. Revisit the schedule before adding a far-west or non-US rep.
- **Control Center terminology is now durable:** Louis's “Task List” and “bug tracker” mean the active, durable Task List inside the live Sparkle Suite Control Center—not `vault\\open-items.md`. The Control Center labels were renamed accordingly and released in exact commit `05486c8b` as production deployment `dpl_7AjjD1gQB8WMV4gbF21WEeAjw73c`.
- **Current operator tasks were added to the live Control Center Task List:** finish Heather's recipe-card updates using her new images; verify Heather's Live Queue Chrome connector; research and write Brittany's GoDaddy delegate/domain-reset instructions; complete Brittany's Workspace/customer-site handoff audit; and smoke-test Team Management plus generated New Rep Onboarding sites. The GoDaddy-instructions task is `in_progress`; the others remain open.
- **Gmail connection corrected and safe draft created:** Gmail now verifies as `louis@neonrabbit.net`, not the former `louischapman1@gmail.com` connector. An unsent draft to Brittany Osborne (`braxtonsherri33@gmail.com`) titled **A quick GoDaddy step so we can connect your new Sparkle Suite site** instructs her to invite **Louis Chapman** at `louis@neonrabbit.net` with **Domains Only** access and transfer actions. Nothing was sent.
- **GoDaddy delegate facts and current outcome:** accepted delegate access persists until the account owner removes or changes it; only a pending, unaccepted invitation expires after 48–72 hours. Louis manually signed in and confirmed he still has DNS-management access for `BrittWithBling.com`. Keep the final transfer acceptance with Brittany; delegates cannot accept an incoming GoDaddy domain transfer on the owner's behalf.
- **Chrome-control regression remains a Codex runtime issue:** the current bundled Chrome runtime (`26.818.21641`) still failed before tab discovery with the trusted-RPC path error referring to `browser-service.mjs`. Read-only audit reconfirmed the Chrome extension is installed in Profile 2, the direct native-messaging registry key and manifest exist, and the Chrome plugin `latest` junction resolves to the current version. Do not frame this as a user restart/setup failure. PC-control fallback could read the already-signed-in GoDaddy Products page, but GoDaddy's Delegate Access route presented its own sign-in screen; Louis completed the check himself.

**Last updated:** August 21, 2026

---

## August 18, 2026 Session - Codex in-app browser recovery note

- **Message Center release remains the current live baseline:** no application, database, account, or production state changed in this follow-up session.
- **Codex in-app browser issue is local-runtime lifecycle, not user error:** two tabs were successfully opened earlier for `/nic-nac` and `/control-center`. After Codex refreshed its bundled Browser plugin from `26.810.52044` to `26.814.41407`, the browser bootstrap repeatedly failed with `Trusted RPC dependency must resolve within a configured trusted code path` for the newly installed `browser-service.mjs`.
- **Important lesson:** Louis had already restarted the computer immediately before the retry. Do not ask him to restart again as the default response. Treat this as a Codex/plugin trusted-path handoff defect; preserve the in-app-browser constraint, do not fall back to Chrome, and do not use an authenticated Louis/customer session to work around reviewer smoke.
- **Local QA residue:** `artifacts/` and `test-results/` are untracked local test output. They are not part of the product release and should not be committed without a deliberate reason.

**Last updated:** August 18, 2026

---

## August 17, 2026 Session - Message Center and Resource Library released

- **Receive-only Message Center is live:** reps open it from the workspace header and can read/unread/archive only their own deliveries. Rep compose/reply routes and grants are closed; Help retains its separate support-report workflow.
- **Control Center publishing is live:** `/control-center/messages` supports frozen all-active or selected audiences, drafts, previews, explicit mass-send confirmation, and delivery/read history. `/control-center/resources` publishes versioned Blog/Video/FAQ/Help content.
- **Automations are durable:** public customer-site signup inserts atomically enqueue one owning-rep message; resource revisions enqueue linked announcements; a post-response worker gives both an immediate best-effort send, and a daily Hobby-compatible cron recovers failures and creates timezone-aware monthly snapshots/reports with current-month birthdays.
- **Release:** application commit `6e44ee20`, packaging guard `507d8da1`, and Hobby dispatch fix `9497b117` are production deployment `dpl_29K7Gb6FbyQEnQtugA8FgG3T6bDP` / `sparkle-suite-cizv4tivz-louis-2849s-projects.vercel.app`. Both Sparkle Suite aliases and all current Bri's Glowtique/Bling Kitchen aliases resolve to it.
- **Verification:** 211 focused feature tests passed before the Hobby adjustment; the adjustment's 18 focused tests and final production build passed. Production DB smoke verified selected delivery, read/archive, signup automation, resource versioning, and cleanup. Live HTTP/auth-boundary checks and Vercel error-log checks passed. Authenticated synthetic UI acceptance remains blocked because the in-app browser inherited a customer session; it was stopped read-only without changes.

**Last updated:** August 17, 2026

---

## August 17, 2026 Session - Message Center and Resource Library plan

- **Receive-only Message Center planned:** Reps receive only; Louis, designated internal agents, and approved automations are the only senders. The surface is standalone inside Sparkle Suite with no email, SMS, or external push delivery.
- **Header placement and secure boundary:** Message Center opens from a persistent workspace-header button with an unread badge. The dormant rep support composer will be removed at both UI and API layers, and RLS will restrict reps to reading and updating only their own delivery state.
- **Four releasable slices:** (1) receive-only inbox plus Control Center Communications Console, (2) new public Customer List signup notices, (3) immutable beginning-of-month reports with reliable tracked metrics and current-month birthdays, and (4) database-backed Blog/Video resources plus FAQ/Help update announcements.
- **Application-owned sender architecture:** Owner, agent, and automation messages use one audited publishing service with frozen audiences, sender capabilities, idempotency, and a durable retryable outbox. Agents never write message rows directly.
- **Plan:** `docs/superpowers/plans/2026-08-17-sparkle-suite-message-center-and-resources.md`.

**Last updated:** August 17, 2026

---

## August 17, 2026 Session - live-commerce channel research

- **TikTok LIVE is not a Trade Board purchase funnel:** TikTok's current LIVE guidance says that, in markets where TikTok Shop is available, commercial LIVE content directing people off-platform to buy is For You ineligible and may receive reduced visibility. TikTok Shop's seller guidance specifically cautions against purchase prompts through external websites, links, usernames, messaging services, or QR-code/link callouts. Do not position a Sparkle Suite Trade Board QR code, background URL, or spoken "scan/go to my website to buy or claim" CTA inside a BP selling LIVE as a workaround.
- **TikTok-safe role for Sparkle Suite:** Keep the Trade Board as the rep's operations and post-show customer experience. For Shop-enabled rep LIVEs, use native Shop product links for purchase intent; customer follow-up can use normal opted-in rep channels after the LIVE. A profile website link or TikTok-native destination link may be appropriate only when the account, market, and campaign are eligible, with commercial disclosure enabled where required.
- **YouTube is a viable technical channel, pending BP authorization:** YouTube supports LIVE product shelves, pinned products, and external retailer checkout for eligible channels. It does not impose TikTok Shop's equivalent general off-platform-LIVE restriction. However, whether an independent Bomb Party rep may use YouTube Live, a personal/external checkout, YouTube Shopping, or Sparkle Suite's Trade Board for BP orders is governed by current Bomb Party policy, not YouTube alone. Do not claim or build that sales path until Bomb Party confirms the exact approved channel and checkout method in writing.
- **Operational reminder:** Use licensed/original music in any YouTube LIVE; YouTube scans live streams for copyrighted content and may interrupt/terminate a stream. Do not confuse TikTok's internal QR-code tools (e.g. ad-preview/authorization codes) with permission to place an external purchase QR code in a consumer-facing LIVE.

**Last updated:** August 17, 2026

---

## August 16-17, 2026 Session Closeout

- **Recipe-source rebuild in editor:** The saved-recipe editor now exposes **Read source photos and replace details** whenever a recipe has source photos. It reuses the existing image-reading draft endpoint to replace the title, story, category, time, servings, ingredients, steps, Heather's note, and alt text in the local editable draft. Source photos remain saved; nothing is published until the rep separately selects **Save recipe**. This fixes the missing edit-mode trigger reported while Heather was revising Chocolate Chip Cookies and makes the established formatting flow available for future revisions as well as new recipes.
- **Release:** application commit `ac1dba71 fix: enable recipe source rebuild in editor` was manually released as `dpl_4igyTHMuroRcraEpuaqcPVQJFkpu`. Both Sparkle Suite aliases and active customer domains point to the deployment; canonical `/nic-nac?section=recipes` returned 200, the apex returned the canonical 307, and `theblingkitchen.com/in-the-pantry` returned 200. The targeted recipe-editor UI suite passed (105 tests) and the production build passed. Authenticated reviewer-browser confirmation remains blocked by the known too-short reviewer token; no Louis or customer account was used.
- **BlingKitchen Pantry recipe format standardized:** Production audit found 25 live BlingKitchen recipe records, each already carrying the recipe data needed for Heather's intended detail view (summary, category, timing, servings, card image, TikTok URL, ingredients, method, and note). The issue was one shared renderer rather than bad individual recipe records, so no customer recipe content was rewritten. The public modal now consistently uses a full-width hero, recipe heading and metadata, then a responsive Watch Heather make it / What You'll Need + How to Make It / Heather's Note layout. The same shared template covers every current recipe and future recipe saved through the existing tool.
- **Release:** application commit `e1a3ff33 fix: standardize BlingKitchen recipe detail layout` was manually released as `dpl_9zu1cNZ1GUEgeeWXpyDg97KmGkWN`. The new `20260817-recipe-detail-layout` cache key was confirmed on the canonical Sparkle Suite route and Heather's custom Pantry; both Sparkle Suite aliases and active customer domains resolve to this deployment. Focused public-site coverage passed (11 tests), the production build passed, and a no-auth live browser check opened Chocolate-Dipped Strawberries and visibly confirmed the full detail layout. The authenticated reviewer-token limitation is unchanged and was not bypassed.
- **Temporary Heather recipe-audit aid:** The Current recipes gallery now places an **Audited** checkbox beside each recipe’s edit action. Its check state is browser-local and recipe-ID keyed, so it survives refreshes for the auditor without changing a recipe row, public Pantry content, or the database. Remove this temporary aid after Heather completes the current audit.
- **Release:** application commit `ab12e076 feat: add temporary recipe audit checks` was manually released as `dpl_ErugKgQ9nzPKn3M6FLM6D5VerB6t`. Both Sparkle Suite aliases and the active customer domains resolve to that exact production deployment. Focused recipe UI coverage passed (105 tests) and the Vercel production build passed. The authenticated reviewer-browser check remains blocked by the known too-short reviewer token; no personal or customer account was used.
- **Site Settings clarity and ticker composition:** the ambiguous recruiting control is now clearly named **Show the “Join My Team” recruiting page on your public site**. The separate **Announcement ticker** has a built-in emoji picker, plain-language link controls, selection-only linking, safe `http`/`https` validation, and a repair action for legacy whole-message links.
- **Shared customer-site reliability:** a malformed shared Homepage JSX asset affected every workspace preview, slug route, and custom domain. The repair fixed the shared component and bumped the asset cache key; system-wide checks included Heather/Bling Kitchen and Brittany routes rather than treating the symptom as one customer-site issue.
- **Recipe editor hardening:** current recipes have direct edit actions, source-card photos persist through reopening/editing, deleting requires a second confirmation, and leaving unsaved work requires an explicit keep-editing/discard-changes decision. No recipes were removed during the work.
- **Release operations:** Vercel Git deployment creation is disabled. Pushes retain source provenance but do not deploy. The recipe safety follow-up was released manually after capacity returned as `dpl_36ubbhUBQf2WqvcyiSTh8TAsYBcw` from application-containing tip `27e62249`; the later documentation commit does not change the release artifact.
- **Ongoing limitation:** authenticated reviewer-browser acceptance remains blocked by the known too-short reviewer-token configuration. Never substitute Louis's or a customer's authenticated session.
- **Gmail connector account is wrong for Neon Rabbit mail:** the currently connected Gmail connector reports `louischapman1@gmail.com`, not `louis@neonrabbit.net`. Do not search, read, send, or claim results for the Neon Rabbit mailbox through that connector. The available Gmail tools in this session expose no connect/disconnect/account-switch action; Louis must reconnect it to the intended account before mailbox work resumes.

**Last updated:** August 17, 2026

---

## August 16 Recipe editor audit and hardening

- **Simpler navigation released:** Removed the redundant **Edit current recipes** tab. The recipe area now starts with **Current recipes** and **Upload new recipe**; each current recipe’s **Edit this recipe** button opens that recipe directly, with a return path to the gallery.
- **Audited data-flow repair released:** Recipe-source image URLs now persist on the recipe itself, so a reopened recipe retains its readable source-card photos for later editing or reformatting. The new `recipe_source_image_urls` column is additive, defaults to an empty list, and does not alter or delete existing recipes. Source-photo URLs are validated as `http`/`https`, and tool-driven recipe updates preserve them unless a replacement list is intentionally supplied.
- **Destructive-action hardening released:** Removing a recipe now requires a second explicit confirmation. No recipe rows were removed during this audit or release.
- **Unsaved-edit safety follow-up released:** Commit `c3e6a282 fix: guard unsaved recipe edits` adds a clear keep-editing/discard-changes gate before a rep leaves unfinished recipe work. It is now live in the manual production release listed below.
- **Released application baseline:** commit `388087c9 feat: harden recipe editing workflow` is production deployment `dpl_BLstSy7RpntTweaFMw5nFkYszeQg`, with both Sparkle Suite aliases and current customer domains attached. The additive Supabase migration `20260816200000_ss_persist_recipe_source_images.sql` is applied in production. Focused recipe UI, service, and Nic-Nac tool coverage passed (116 tests); the production build compiled successfully through TypeScript. Canonical `/nic-nac?section=recipes` returned 200, the apex returned its canonical 307, and `www.theblingkitchen.com` returned 200. Authenticated reviewer visual smoke remains blocked by the known too-short reviewer token; no Louis or customer account was used.
- **Manual production release:** exact branch tip `27e62249` (including `c3e6a282`) was released as `dpl_36ubbhUBQf2WqvcyiSTh8TAsYBcw` on August 17. Both Sparkle Suite aliases plus the active Bri's Glowtique and Bling Kitchen domains belong to that deployment. The focused recipe suite passed 116 tests, local and Vercel production builds passed, and the canonical recipe route returned 200 while the apex returned its canonical 307.

**Last updated:** August 16, 2026

---

## August 16 Recipe editor: current recipes and editing

- **Three clear tabs:** The Bling Kitchen recipe area now has **Current recipes**, **Upload new recipe**, and **Edit current recipes** tabs. This keeps reviewing existing recipes separate from creating a new one while retaining one familiar tool.
- **Existing recipes load as a complete edit package:** The current-recipes view shows each saved recipe’s food image, visibility, category, and story excerpt. Selecting **Edit this recipe** opens the recipe picker and loads the existing card photo, inside-recipe photo, source photos, title, narrative, ingredients, steps, note, visibility, crop positions, and TikTok URL into the editor.
- **No accidental new-record path in editing:** The editing picker is explicitly for current recipes and starts with **Select a current recipe**; new recipes belong only in the Upload new recipe tab.
- **Release and verification:** application commit `d31d6cc1 feat: add current recipe editor tabs` is Vercel production deployment `dpl_CmDubAkAyWu3CBf71N6HqA7uTJbH`. Focused recipe workspace coverage passed (105 tests) and `npm run build` compiled the production app after the allowlisted-branch safety gate. Both Sparkle Suite aliases are assigned to that deployment; the canonical `/nic-nac?section=recipes` route returned 200 and the apex returned its canonical 307. Authenticated reviewer visual smoke remains blocked by the known too-short reviewer-token configuration; no Louis or customer account was used as a workaround.

**Last updated:** August 16, 2026

---

## August 16 Inline announcement ticker links

- **Only selected words are clickable:** The Announcement ticker editor now tells reps to write an announcement, highlight the exact words to link, paste the destination, and choose **Link selected words**. It no longer asks reps to create a separate linked announcement or understand formatting syntax.
- **Easy repair for the current ticker:** If an older entry made an entire message clickable, **Make existing links plain text** removes only the old link formatting and keeps the announcement words. The rep can then highlight just the intended phrase and link it.
- **Public renderer follows the selection:** Homepage, Trade, and Join ticker parsers now preserve non-linked text and render only marked link segments as anchors. A ticker line can therefore say, for example, `Shop the new drop today` with only `new drop` clickable.
- **Release and verification:** application commits `5439e54e feat: simplify inline ticker links`, `929bca9f fix: simplify existing ticker link recovery`, and `cb70322d test: cover ticker link selection behavior` are Vercel production deployment `dpl_GqyeAM1q9zFo8i7YnDf5Bt6anmXS`. Focused Site Settings plus shared Homepage/Trade/Join/static-route coverage passed (200 tests), including an executable selection-only link case, unsafe-URL rejection, and old whole-message-link recovery; all three JSX exports parsed, and the production build passed. Both Sparkle Suite aliases and current customer domains resolve to the deployment; live response checks confirmed the new `homepage.jsx?v=20260816-inline-ticker-links` asset at both Sparkle Suite aliases and `theblingkitchen.com`, while the live Site Settings path returned 200 and the apex returned its canonical 307. Authenticated reviewer visual confirmation remains blocked by the known too-short reviewer-token configuration; no account was used.

**Last updated:** August 16, 2026

---

## August 16 Shared customer-site homepage recovery

- **System-wide fault repaired:** A mismatched closing tag in the shared `public/amethyst/homepage.jsx` Showcase-video component prevented every customer homepage from compiling in the browser. It affected Workspace previews, `www` slug routes, and custom customer domains alike—not a Heather- or Brittany-specific failure.
- **Cache recovery included:** The homepage script had a fixed stale cache key, so the first code-only repair could still load the broken browser-cached script. `Homepage.html` now uses `homepage.jsx?v=20260816-customer-video-renderer`, ensuring every public route receives the repaired shared asset.
- **Release and verification:** application commits `5475f06e fix: restore customer site homepage rendering` and `61a72945 fix: refresh customer site renderer cache` are Vercel production deployment `dpl_8HpwSpt4L1Zxo6Ub7Y8x2SbEou5D`. The deployment owns both Sparkle Suite aliases and the current customer domains. Expanded public-site coverage passed (74 tests), JSX parsing passed, and production build passed. Live no-auth browser checks confirmed rendered page content at `/blingkitchen` and `/brittwithbling`; live response checks confirmed the fresh cache key on those routes and `https://theblingkitchen.com/`.

**Last updated:** August 16, 2026

---

## August 16 Foolproof ticker entry controls

- **No raw formatting required:** The Announcement ticker editor now includes an eight-button emoji picker and a simple linked-announcement builder: type the customer-facing message, paste an `http`/`https` URL, then select **Add link**. The builder inserts a valid ticker item and the standard Save site settings action publishes it.
- **Easy composition:** Emoji buttons insert at the current text cursor. The link button is unavailable until both fields are filled; invalid destinations show a plain-language correction. The link builder becomes one column on mobile.
- **Release and verification:** application commit `4369ffd0 feat: simplify ticker emoji and link entry` is Vercel production deployment `dpl_6HsXDFhcqfo95ojFHnznyN4nZeZz`. Focused Site Settings and Amethyst ticker tests passed (142 tests); Vercel completed the production build. Both Sparkle Suite domains resolve to that exact deployment and the canonical `/nic-nac?section=site-settings` path returned 200. Authenticated reviewer-browser visual smoke remains blocked by the known too-short reviewer-token configuration; no personal or customer account was used.

**Last updated:** August 16, 2026

---

## August 16 Linked announcement ticker

- **Clear ticker controls:** Site Settings now uses **Announcement ticker and Join Team page**, **Announcement ticker messages**, and **Show announcement ticker on your public site**—removing the prior generic ticker wording.
- **Emoji and links:** Reps can use normal emoji in every announcement. Add one announcement per line; an item becomes a safe, underlined link with Markdown-style text such as `[Shop the new drop](https://example.com)`. Existing pipe-separated ticker copy remains supported. Only `http` and `https` destinations render as links.
- **Release and verification:** application commit `4129aba1 feat: support linked announcement tickers` is Vercel production deployment `dpl_HuhTRc7bFCC4EmJjKSHMVXRo5aK7`. Focused Site Settings and Amethyst Homepage/Trade/Join template coverage passed (209 tests). The live `homepage.jsx` script contains the link parser; `https://www.yoursparklesuite.com/nic-nac?section=site-settings` returned 200 and the apex canonically redirects there. Authenticated reviewer-browser visual confirmation remains blocked by the known too-short reviewer-token configuration; no personal or customer account was used.

**Last updated:** August 16, 2026

---

## August 16 Plain-language Join Team setting

- **Clear site-setting label:** The former ambiguous **Join page visible** checkbox now reads **Show the “Join My Team” recruiting page on your public site**. It controls the public recruiting page and its Join Team links; it does not affect the promotional ticker.
- **Release and verification:** application commit `af022579 fix: clarify join team page setting` is Vercel production deployment `dpl_6ysqHQsij5ZcfALmxmxpqhGbmKwy`. The focused Site Settings UI test passed (103 tests), the production build compiled after the active-branch guard, and both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` resolve to that deployment. The canonical `/nic-nac?section=site-settings` path returned 200; authenticated reviewer-browser confirmation remains blocked by the known too-short reviewer-token configuration, so no personal or customer account was used.

**Last updated:** August 16, 2026

---

## August 16 session closeout: Nic-Nac durability and shared customer media

- **Current production baseline:** Nic-Nac clearing is now durable across reloads and later sign-ins; customer-site media uses one shared, responsive editor with the About portrait at left and visible video guidance plus Showcase and three About-short slots at right on desktop.
- **Shared customer-site contract:** Portrait framing is stored media data with safe defaults and rep adjustment controls, never Heather-only styling. Video slots accept only public TikTok, YouTube, Instagram, or Facebook destinations; the same renderer serves Showcase and every About short for current and future Sparkle Suite sites.
- **Playback truthfulness:** TikTok and YouTube start muted, loop, and omit a host pause control. Instagram and Facebook use their native cross-origin players and retain provider-owned controls; Sparkle Suite does not promise controls it cannot reliably enforce.
- **Review limitation:** The known too-short production reviewer-token configuration still prevents an authenticated synthetic browser acceptance pass. This must be repaired before closing the outstanding upload/save/playback smoke work. Do not substitute Louis's or any customer account.

**Last updated:** August 16, 2026

---

## August 16 Always-visible video instructions

- **No disclosure control:** Replaced the unnecessary expandable Video Help control with a compact, permanently visible **Video links and embeds** instruction card at the top of the right-side video stack. There is no maximize/minimize arrow or hidden content.
- **Release and verification:** application commit `7dfabc06 fix: keep video instructions visible` is Vercel production deployment `dpl_EkAT2DMHngRMwR6zJSGMj5bAuwdB`. Focused Site Settings, customer-video template, and media service coverage passed (160 tests), explicitly confirming the rendered card contains no `<summary>` element. The production build compiled after the active-branch guard, and `https://www.yoursparklesuite.com/nic-nac?section=site-settings` returned 200 (the apex returned its canonical 307 redirect). Authenticated reviewer-browser visual smoke remains blocked by the known too-short reviewer-token configuration; no personal or customer account should be used instead.

**Last updated:** August 16, 2026

---

## August 16 In-stack Site Settings video help

- **Right-stack placement:** The expandable **Video help: links and embeds** card now sits inside the desktop video column directly above Showcase, rather than spanning the full Site Settings section.
- **Balanced controls:** The portrait occupies the left column while the compact help card plus the four video controls form the adjacent right-side stack. Video cards use reduced padding and gaps; narrow screens retain a natural one-column order.
- **Release and verification:** application commit `1ba3bbd9 fix: stack video help with media controls` is Vercel production deployment `dpl_Dj3Kzq3x3LuKX9dhdiwhb35NKWuW`. Focused Site Settings, customer-video template, and media service coverage passed (160 tests), the production build compiled after the active-branch guard, and `https://www.yoursparklesuite.com/nic-nac?section=site-settings` returned 200 (the apex returned its canonical 307 redirect). Authenticated reviewer-browser visual smoke remains blocked by the known too-short reviewer-token configuration; no personal or customer account should be used instead.

**Last updated:** August 16, 2026

---

## August 16 Four-provider customer video embeds

- **Supported providers:** Every Showcase or About short-video slot now accepts public TikTok, YouTube, Instagram Reel/video-post, and Facebook Reel/video links or embed code. Saved URLs are restricted to those supported providers, preventing an unsupported host from appearing as an empty customer card.
- **Provider-safe playback:** TikTok and YouTube auto-play muted, loop, and do not surface a pause control; TikTok no longer sends an offscreen pause command. Instagram and Facebook render through their native allowlisted players and retain those providers' controls rather than pretending Sparkle Suite can override them.
- **Simplified Site Settings:** Replaced four repeated provider-specific labels with **Video link or embed** and one expandable **Video help: links and embeds** panel above the controls.
- **Release and verification:** application commit `eed217d1 feat: support social short video embeds` is Vercel production deployment `dpl_9HgGBM56eLRfa543qWXvhwtJvRn1`. Focused public template, Site Settings, media validation, and Help coverage passed (180 tests), the production build compiled after the active-branch guard, `https://www.yoursparklesuite.com/nic-nac?section=site-settings` returned 200 (the apex returned its canonical 307 redirect), and `https://www.yoursparklesuite.com/blingkitchen` returned 200. Authenticated reviewer-browser visual smoke remains blocked by the known too-short reviewer-token configuration; no personal or customer account should be used instead.

**Last updated:** August 16, 2026

---

## August 16 Desktop Site Settings video stack

- **Immediate visibility:** The customer-site media controls now place the About portrait photo in the left desktop column and stack **Showcase video** plus **About short video 1–3** together in the right column. Reps can see every video destination without hunting through a mixed card grid.
- **Responsive behavior:** The layout is based on the slot roles, not their incidental position in an array. On narrower screens it returns to a straightforward one-column reading order.
- **Release and verification:** application commit `6dec7f2f fix: group site video controls on desktop` is Vercel production deployment `dpl_CDRXgMMkSZgJfQraBY67W8fktU67`. Focused Site Settings/workspace coverage passed (109 tests), the production build compiled after the active-branch guard, and `https://www.yoursparklesuite.com/nic-nac?section=site-settings` returned 200 (the apex returned the canonical 307 redirect). Authenticated reviewer-browser visual smoke remains blocked by the known too-short reviewer-token configuration; no personal or customer account should be used instead.

**Last updated:** August 16, 2026

---

## August 16 Durable Nic-Nac conversation clearing

- **Durable clear:** Clear conversation now marks the signed-in rep's persisted thread as cleared before the browser rotates to a new conversation ID. A later workspace visit, reload, or sign-in cannot select that cleared thread as the latest conversation.
- **Stale-link safety:** A prior `conversationId` URL cannot rehydrate a cleared thread either. The message rows are retained for operational audit continuity, but excluded from both latest-thread selection and client hydration.
- **Data model:** Migration `20260816154000_nic_nac_clear_conversations.sql` adds the nullable `cleared_at` marker and a partial active-thread lookup index. It was applied to production before the application release.
- **Release and verification:** application commit `20456551 fix: persist Nic-Nac conversation clearing` is Vercel production deployment `dpl_EjE7aHumdvzWsfy5FJ7epz44PSGq`. Focused persistence, workspace shell, paid-route, and HITL tests passed (37 tests); `https://www.yoursparklesuite.com/nic-nac` returned 200, the apex returned its canonical 307 redirect, and the new protected clear endpoint returned 401 without a session. Repository-wide test-fixture type errors remain pre-existing and unrelated. Authenticated reviewer-browser smoke is still blocked by the known too-short reviewer-token configuration; do not bypass it with Louis's or any customer account.

**Last updated:** August 16, 2026

---

## August 16 Smart Frame for shared About portraits

- **Reusable framing:** About portrait uploads now run browser face detection when available, save the resulting focus/zoom with the photo, and offer a matching 4:5 preview plus simple Zoom, vertical, and horizontal controls. If face detection is unavailable, the system uses a clean subject-forward fallback rather than failing.
- **Shared contract:** The public card reads the saved framing for each photo; Heather continues to use the same fallback framing as every existing photo, not a Heather-only CSS exception.
- **Release:** application commits `bf32df46`, `cd7979ba`, `f976df2a`, and the production TypeScript correction `4237eb97` are Vercel production deployment `dpl_HSAU4RuDtU9w7fbWd1rE2jdH6yqH`.
- **Verification:** 185 focused template/settings/workspace tests passed. Vercel's production build passed TypeScript and the live public check at `https://www.yoursparklesuite.com/blingkitchen` confirmed the subject-forward portrait with no nested edge; no account was signed into or changed. Both Sparkle Suite aliases belong to the deployment.

**Last updated:** August 16, 2026

---

## August 16 Single-edge About portrait correction

- **Top-edge repair:** Removed the nested border and nested radius from the portrait image. The outer card is now the only rounded clipping edge; the photo itself has a 0px border and 0px inner radius.
- **Release:** application commit `d4c47322 fix: remove nested about portrait border` is Vercel production deployment `dpl_74ECqMSV6MsG636AEUNzJQexqkkL`.
- **Verification:** 205 focused tests passed. A public live browser check on `https://www.yoursparklesuite.com/blingkitchen` confirmed the single 24px outer clip with no second image border or inset; no account was signed into or changed.

**Last updated:** August 16, 2026

---

## August 16 Photo-proportional About portrait frame

- **No interior mat:** The About portrait no longer forces every upload into a 3:4 container. Its rounded border now follows the uploaded image's natural aspect ratio, so there is no dark/empty gutter between the photo and its frame.
- **Heather proof:** On the live BlingKitchen page, Heather's card and photo both measure 500 × 688px with zero horizontal or vertical inset. The full photo remains visible, while the border is tight and clean.
- **Release:** application commit `053b4384 fix: fit about portrait to source image` is Vercel production deployment `dpl_74tnVQnAcFd74GpNroXsxJMqMW6i`. Vercel assigned `www.yoursparklesuite.com` and `yoursparklesuite.com` to that exact deployment.
- **Verification:** 205 focused tests passed and production compilation completed. A public, no-auth browser smoke visibly confirmed the tight photo border at `https://www.yoursparklesuite.com/blingkitchen`; both Sparkle Suite aliases return 200 for that path.

**Last updated:** August 16, 2026

---

## August 16 Native TikTok short-card sizing and playback

- **Native player dimensions:** About short cards now reserve TikTok's documented card width instead of capping at 280px: three 348 × 619px 9:16 cards at the desktop layout, two columns at narrower desktop/tablet widths, and one on mobile.
- **Playback contract:** TikTok player embeds load without a volume-lock query parameter, then receive `mute` and `play` only after the player-ready event. Reps' videos therefore start muted, retain the existing host **Unmute** button, and use TikTok's `loop=1` setting to replay the selected video rather than stopping into end content.
- **Release:** application commit `8c28cd78 fix: size and loop about short videos` is Vercel production deployment `dpl_Ewj5MHGR9wsCRV2dnrGpixQYjmiZ`. Vercel assigned `www.yoursparklesuite.com` and `yoursparklesuite.com` to that exact deployment.
- **Verification:** 205 focused tests passed and the production build compiled. Public browser verification on `https://www.yoursparklesuite.com/blingkitchen` confirmed three 348 × 619px 9:16 cards, the player query contract, and retained portrait `object-fit: contain`. Heather has no configured About short yet, so a real video’s mute/unmute interaction remains pending a safe reviewer-configured short.

**Last updated:** August 16, 2026

---

## August 16 Shared About portrait and short-video layout

- **All customer sites:** The shared customer-site About section now has one clean portrait photo beside the rep story and three portrait-format short-video cards beneath it. This is the default for current and future Sparkle Suite customer sites.
- **No forced photo crop:** The About portrait is rendered as an image with `object-fit: contain`, preserving the full uploaded photo inside a standard 3:4 portrait frame instead of cutting off the person or subject.
- **Video support and controls:** Site Settings exposes one **About portrait photo** upload plus **About short video 1–3**. Each short accepts TikTok embed/link input or a YouTube Short link; the existing Showcase video remains separate.
- **Release:** application commit `977c8eb5 feat: add portrait about video row` is Vercel production deployment `dpl_9z8wEmPMtZFYwHpabAT9RN7ggW8r`. Vercel assigned `www.yoursparklesuite.com`, `yoursparklesuite.com`, and configured customer domains to that exact deployment.
- **Verification:** 205 focused template/settings/workspace/help tests passed, and the production build completed. Public browser inspection on `https://www.yoursparklesuite.com/blingkitchen` visibly confirmed **Meet Heather**, the contained 3:4 portrait (`object-fit: contain`), and three 9:16 short cards. No Workspace, customer, or Control Center account was used.

**Last updated:** August 16, 2026

---

## August 16 Customer-list action uniformity

- **Compact primary actions:** Customer List now groups Add customer, Import spreadsheet, and Download full list (CSV) in one compact action set instead of spreading them across the heading row.
- **Visual contract:** The three actions have matching 190px desktop dimensions, 40px height, consistent icon/text alignment, 8px gaps, bright Sparkle Suite pink fill, white text, visible focus treatment, and a clean full-width mobile stack.
- **Release:** application commit `3eb63a4e style: unify customer list actions` is Vercel production deployment `dpl_3CGbPntNPGUYJfBaVXMG8u8L3B4f`. Vercel assigned `www.yoursparklesuite.com` and `yoursparklesuite.com` to that exact deployment.
- **Verification:** 102 focused dashboard tests and the production build passed. A live reviewer-safe workspace screenshot on `www.yoursparklesuite.com` visibly confirmed the equal pink action group at Tools → Customer List. No personal or customer account was used.

**Last updated:** August 16, 2026

---

## August 16 Customer-list ownership export

- **Rep-owned data export:** The Workspace **Tools → Customer List** now includes **Download full list (CSV)**. It is an authenticated, `no-store` download that returns the signed-in rep's entire customer list, not only the short batch currently displayed on screen.
- **Complete portable record:** The CSV includes contact and editable profile fields, tags, channel-consent/reachability fields, opt-out/STOP history, and timestamps. Customer-supplied spreadsheet formula prefixes are escaped before export.
- **Scale and isolation:** The export uses the same paid Workspace context and rep ID guard as the roster API, and paginates the database read in 1,000-row pages so larger lists remain complete.
- **Release:** application commit `ff3c1ab1 feat: export rep customer lists` is Vercel production deployment `dpl_5UijLM8dL4nbHUyQa4cobVnxVKs5`. Vercel assigned `www.yoursparklesuite.com` and `yoursparklesuite.com` (alongside configured customer domains) to that exact deployment.
- **Verification:** 120 focused customer-audience tests passed and the production build completed. A reviewer-safe Brittany Workspace session on the live `www.yoursparklesuite.com` opened Tools → Customer List and visibly showed the CSV download link. No personal or customer account was used.

**Last updated:** August 16, 2026

---

## August 16 Custom-domain customer-site navigation repair

- **Domain-first customer paths:** Customer sites served from a configured custom domain now emit root-relative public navigation for Home, Trade Board, Join Team, Pantry, and homepage collection links. This keeps each visitor on the rep's configured host instead of returning them to a Sparkle Suite slug or `/amethyst/*.html` URL.
- **Heather live proof:** `theblingkitchen.com`, `/trade`, `/join`, and `/in-the-pantry` all render on Heather's host and link only to `theblingkitchen.com` for internal customer-site navigation.
- **Routing guard:** Custom-host navigation is derived from the verified request hostname even when the internal template request carries its rep target in `?c=...`; the internal target can resolve the tenant but cannot override the public host.
- **Release:** application commits `a24bc545 fix: keep customer subpages on custom domains` and `f3f27d69 fix: preserve custom-domain navigation targets` are deployed as Vercel production deployment `dpl_6jf82p7d8GEeVTKHmdj9TDS1NSf9`. Vercel assigned `www.yoursparklesuite.com`, `yoursparklesuite.com`, `theblingkitchen.com`, and `www.theblingkitchen.com` to that exact deployment.
- **Verification:** 25 focused domain-routing tests passed, the production build passed, and an unauthenticated Codex-browser check confirmed Heather's customer paths and rendered navigation. The reviewer-token limit was irrelevant because no Workspace authentication was required.

**Last updated:** August 16, 2026

---

## August 15 Nic-Nac full About-section repair

- **Whole-section data model:** A customer site's About area now has independently persisted **heading**, optional **subheading/byline**, and narrative fields. Existing sites retain their current default headline until a rep saves an override.
- **Nic-Nac behavior:** `update_site_setting` accepts all three fields. When a rep supplies title, byline/location, and body copy, the active site prompt explicitly requires a single complete save rather than a body-only mutation.
- **Incomplete-save retry:** “You only added part of it—add the whole thing” is app-owned site-edit continuation state. Nic-Nac receives and is pinned to `update_site_setting` again, using the complete copy already in the conversation rather than sending the rep to a form.
- **Database:** production migration `20260815190000_ss_add_about_section_fields.sql` added `site_settings.about_heading` and `site_settings.about_subheading`.
- **Verification before release:** 134 focused Nic-Nac and Amethyst mapping tests passed, and `npm run build` completed successfully. The authenticated reviewer replay remains blocked by the known too-short reviewer-token configuration; neither Louis's nor Heather's account was used as a workaround.
- **Final live acceptance:** Louis retried Heather's complete About update in the real Nic-Nac conversation after the release and confirmed it finally worked. This is the first accepted live proof of the complete title/byline/body flow; retain the deterministic route replay and the user-confirmed production result together as the regression evidence.
- **Production provenance:** commit `28cabb2e fix: save complete Nic-Nac About sections` is Vercel production deployment `dpl_AKpuJmgpyzxZ37oySahT5cRJEK1n`. Vercel assigned both Sparkle Suite aliases; both domains returned 200 for `/nic-nac` and `/blingkitchen`.

**Last updated:** August 15, 2026

---

## August 15 Nic-Nac pasted About-copy execution repair

- **Live evidence corrected the first repair:** Vercel logs for Heather's actual conversation showed the initial About request did expose `update_site_setting`, but the pasted multi-paragraph narrative turn was classified only as `show_memory` (because it mentioned live shows) plus the calendar baseline. The site tool was absent on that turn, so Nic-Nac's denial was accurate to its supplied tool set but still product-wrong.
- **Final repair:** A substantive copy block following Nic-Nac's request for About text is now an app-owned site-edit continuation even when the block does not repeat "About" or "website." Its first model step is pinned to `update_site_setting`, preventing a text-only fallback or a calendar-tool detour.
- **Release and verification:** commit `1de5b0c6 fix: apply Nic-Nac About copy submissions` is production deployment `dpl_DAYiJDsQxx5Kac4boiPyEcG1Wpyu`. Vercel assigned both production aliases; both domains returned 200 for `/nic-nac` and `/blingkitchen`. The exact three-message transcript runs through the real route test, exposes `update_site_setting`, and forces that tool. Five focused suites passed 110 tests.
- **Verification limit:** The known too-short reviewer token still prevents a synthetic authenticated live chat replay. The customer Workspace was not used for a state-changing retest; Louis can now paste the copy again without a separate form.
- **Current-conversation retry guard:** commit `88d0cb1 fix: retain About copy after Nic-Nac denial` is production deployment `dpl_DRowkGoJGw371eHiYxVQFCFte5SB`. It also recognizes a substantive copy block after Nic-Nac's earlier "ready to paste into Heather's About section" denial, so the same open conversation can be retried without starting a new chat.

**Last updated:** August 15, 2026

---

## August 15 Nic-Nac site-tool continuity repair

- **Root cause:** Nic-Nac's turn router did not recognize natural About/website language as a customer-site request. After a draft, the rep's follow-up "I don't have an option to paste it there. You need to do that" also failed the site-work continuation check, so the model only received the always-present calendar tool pack and incorrectly claimed it could not edit the site.
- **Repair:** About narrative, website, homepage, story, bio, and hero-title language now route to the **site** intent. A follow-up that asks Nic-Nac to handle/publish/save/update the drafted copy retains the site tool and requires a tool call. One request can expose both relevant site and calendar tools; changing tasks in chat does not lock a rep into the previous tool category.
- **Release and verification:** commit `85b41630 fix: retain Nic-Nac site editing tools` is production deployment `dpl_4WgURX78pyZoYg8P8ecrggqLdoiK`, with both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` assigned. Both domain variants returned 200 for `/nic-nac` and `/blingkitchen` after release.
- **Verification limit:** 83 focused tool-routing, site-customization, and core-policy tests passed, including the exact Heather About-copy replay and a combined About-plus-calendar request. The authenticated reviewer replay remains blocked by the known too-short reviewer-token configuration; it was not bypassed with Louis's or Heather's account.

**Last updated:** August 15, 2026

---

## August 15 BlingKitchen hero personalization and reveal guidance

- **Editable customer homepage title:** Site Settings now gives every rep a persisted **Homepage title** field. A saved value replaces the default title on the public homepage while leaving the business name as the safe fallback. This is a rep-controlled presentation setting, not a tenant-code override.
- **Heather's BlingKitchen actions:** Heather's public hero keeps Shop Bomb Party plus her saved TikTok and Whatnot destinations in the first row; Browse the Trade Board is the full-width second-row action, and the BlingKitchen-only **In the Pantry** action appears below it at the same width.
- **Heather's explanation is platform-neutral:** In the "First time here?" card, BlingKitchen now says that customers can watch Heather open it live and "Join the reveal live." It no longer names TikTok or Facebook there. The real configured platform action buttons remain visible and unchanged.
- **Release and live proof:** commit `e5aa0184 fix: simplify BlingKitchen reveal guidance` is production deployment `dpl_92M5a2erpWWmPTEREvGdjmffofpA`. Vercel assigned both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` to it. Live inspection of `/blingkitchen` confirmed the platform-neutral paragraph and Watch Live step, alongside Shop Bomb Party, Watch on TikTok, Watch on Whatnot, Browse the Trade Board, and In the Pantry.
- **Verification:** 47 focused BlingKitchen/Amethyst public-site tests passed. The live public page was checked in the in-app browser without a customer or personal Workspace account. The authenticated reviewer-browser path remains blocked by the known too-short reviewer-token configuration and was not bypassed.

**Last updated:** August 15, 2026

---

## August 15 Dynamic hero action layout

- **Customer-site hero order:** Standard Amethyst customer homepages now place **Shop Bomb Party** and any saved TikTok/Whatnot watch actions in the first hero row. **Browse the Trade Board** is always a separate second-row primary action beneath them.
- **Responsive sizing rule:** The Trade Board action stretches to the exact rendered width of the first-row action group. This automatically adapts when a rep has Shop only, Shop plus one watch destination, or Shop plus both TikTok and Whatnot.
- **Release and direct live proof:** commit `f93ce618 fix: stack hero trade board action` is deployed as `dpl_rDRUDkrEue4HbtK1h6JU3fMtR6nG`; both Sparkle Suite production domains are assigned. Live `/blingkitchen` rendered Shop Bomb Party, Watch on TikTok, and Watch on Whatnot in one row (508px total), with Browse the Trade Board directly below at the same 508px width.
- **Verification:** 95 focused customer-site tests and 78 broader Amethyst-template tests passed. Local-link probes remain unavailable without a running local server. No customer account, reviewer token workaround, or state-changing browser action was used.

**Last updated:** August 15, 2026

---

## August 15 Hero live-platform actions

- **Customer-site live destinations:** A saved TikTok link and a saved Whatnot link each now create their own hero action button. If both are configured, both buttons appear together; a platform that was not saved is never shown as a hero action.
- **Shared coverage:** This is driven by the shared homepage template data and applies to the standard Amethyst homepage plus the Britt With Bling, BlingKitchen, and Mile High Fizz customer hero treatments. Whatnot also flows through `streamLinks` so any saved handle or supported full URL becomes a usable live destination.
- **Release and live evidence:** commit `aa110028 feat: add hero watch platform actions` is production deployment `dpl_9YjWh7TnvqCxSKCXVasitgfSTujp`. Vercel assigned both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` to that exact deployment. A direct live BlingKitchen check rendered distinct **Watch on TikTok** and **Watch on Whatnot** hero actions with Heather's stored destinations.
- **Verification:** 94 focused public-site/data tests passed; the Amethyst template suite passed 77 tests. The local-link portion could not fetch because no local server was running; `npm run build` passed and live-domain verification covered the affected customer path. The reviewer-browser path remains blocked by the known too-short token configuration and was not bypassed.

**Last updated:** August 15, 2026

---

## August 15 Hero Motion persistence repair

- **Root cause:** `heroAnimationType` was correctly saved by Site Settings, but the public Homepage bootstrap reapplied the selected appearance preset after mapping that saved setting. The preset's `heroMotion` silently overwrote the rep's saved choice, so a Moonstone/Morganite site could remain on Soft Glow after the rep saved Sparkle Rise.
- **Repair:** `buildAmethystHomepageTweakDefaults` now applies the visual skin first, then explicitly preserves the mapped/saved `heroMotion`. Appearance presets continue to provide all other visual defaults and no longer reset a rep's Hero motion control.
- **Release and direct live proof:** commit `e5e40653 fix: preserve saved hero motion` is deployed as `dpl_B9EY3RBVWfs2C71temz2pkBsaiW3`; both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` are assigned. The live BlingKitchen template payload returned `heroMotion: "sparkle_rise"` in both template data and bootstrap defaults while retaining Moonstone tokens. Rendered `/blingkitchen` had `hero-motion-sparkle-rise`, eight sparkle-rise elements, and no Soft Glow layer.
- **Verification:** 114 focused settings/template/preset tests passed, the Amethyst template suite passed 76 tests (local link probes fail-soft without a server), and the production build passed. The known too-short reviewer-token issue remains; this did not use a personal account to bypass it.

**Last updated:** August 15, 2026

---

## August 15 Customer-site animation audit and repair

- **Hero animation contract:** every selectable customer-site skin now has a deliberate hero profile: Sparkle Suite/Morganite, Moonstone, Emerald Garden, and Garnet use **Soft Glow** with subtle/no texture; Amethyst, Black Diamond, Alpine Opal, Rose Gold, Amber, Velvet, and Rose Quartz use **Sparkle Rise**. All eleven profiles are covered by a regression test.
- **Soft Glow is authoritative:** selecting Soft Glow now applies an explicit hero-motion state that disables a previously selected fixed sparkle texture or confetti layer in the hero. The glow itself is larger, more saturated, and gently animated so it reads over each skin’s hero background without competing particles.
- **Release and live evidence:** commit `726ffb99 fix: clarify customer site hero animations` is deployed as `dpl_BrKWaCpayfNyr4PNG6kEmpaC4TZQ`. Vercel assigned both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` to that exact deployment. Live inspection of `/amethyst/Homepage.html` confirmed `hero-motion-soft-glow`, the glow layer, the new 780px glow treatment, and no sparkle texture class; screenshot review confirmed a visible blush glow with no particles taking over.
- **Verification:** focused appearance/homepage tests passed (54 tests), `npm run qa:amethyst` template suite passed (74 tests; link probes were fail-soft because no local server was running), and `npm run build` passed. The authenticated reviewer-browser path is still blocked by the known too-short reviewer token and was not bypassed.

**Last updated:** August 15, 2026

---

## August 15 Control Center independent sign-in checkpoint

- **Control Center access:** Control Center has its own username/password sign-in and its own signed, HTTP-only session cookie. It does not read, replace, or depend on whichever Sparkle Suite Workspace account is already open in the browser. The credentials and operator audit identity exist only as protected Vercel production configuration, never in Git.
- **No access-code or Workspace-auth barrier:** The old access code is not used. The Control Center sign-in endpoint validates only its dedicated protected credentials, then creates the independent 12-hour operator session. The existing Sparkle Suite Workspace session remains separate.
- **Release and verification:** final commit `afa046de fix: separate Control Center credentials` is deployed as `dpl_7YCHxB3GTe2F7QsEno4JM7R2MFSb`. Vercel assigned both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` to that deployment. Focused Control Center authentication tests passed (16 tests) and the production build completed. Live browser verification submitted the independent Control Center credentials successfully and opened the Control Center while a separate Workspace session was left untouched.
- **Lesson:** Control Center independence means independent authentication, not merely an authorization check on the active Workspace account. Do not substitute a shared Sparkle Suite login or a static access code for the dedicated operator sign-in flow.

**Last updated:** August 15, 2026

---

## August 15 Customer Social Links and Whatnot checkpoint

- **Optional social contract:** Whatnot is now a supported Customer-facing site setup social handle alongside the existing platforms. A rep may enter either a handle or a full canonical Whatnot URL; the published destination uses `https://www.whatnot.com/user/<handle>` when given a handle.
- **Dynamic customer footers:** Homepage, Trade Board, and Join pages now render social icons/links only for values actually saved by that rep. Empty values and placeholder URLs are omitted. Standard footer navigation remains separate from this social row.
- **Custom-profile guard:** Britt With Bling, BlingKitchen, and Mile High Fizz now preserve the saved social-link collection rather than injecting hard-coded TikTok, VIP-group, Facebook, or Shop links. This prevents duplicate or unprovided social destinations from returning through tenant-specific overrides.
- **Release and live evidence:** commits `95a62f6c feat: add dynamic customer social links` and `50aa15c7 fix: honor saved footer social links` are deployed as `dpl_6c4JNQct8G9EoswBCTkAXauzZMs2`. Both `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` resolve to that release. On Brittany's live customer site, the footer contained only her saved TikTok and Facebook links; the prior duplicate VIP/Facebook and Shop entries were absent.
- **Lesson:** generic template tests alone are insufficient for shared customer-site rules. Tenant/profile overrides can reintroduce default or marketing links, so release verification must include a real affected tenant and assert the final rendered social row contains only that rep's saved values.

**Last updated:** August 15, 2026

---

## August 9 Control Center, customer-site, and billing checkpoint

- **Brittany Team Management re-enabled:** Team Management is no longer a globally disabled `Coming soon` tool. Entitled reps can open the existing private onboarding control plane; Brittany retains the already-verified `manual_beta` entitlement. It creates private participant links, tracks progress, receives participant questions, stores Brittany replies, archives access, and keeps public Join Team cards as a separate explicit publication path.
- **Brittany New Rep Onboarding Site:** A public-but-unlisted, no-index/private-link onboarding Site is live at `https://brittwithbling-start-strong.louis526569.chatgpt.site`. Each invite is still authenticated by its existing high-entropy URL token; the Site has no general directory or ChatGPT sign-in requirement. The production Sparkle Suite token APIs now permit only this Site origin to read onboarding state and submit progress/questions through explicit CORS/OPTIONS handling. The URL remains stable for continuity; all user-facing copy is named **New Rep Onboarding**.
- **Release:** application commits `20929d4b feat: open team management onboarding beta` and `98d8fa8f fix: route onboarding invites to Start Strong site` are deployed. The final Vercel production deployment is `dpl_9RtuFE9aZeZVMBU9PLmnvRme4MGn`, and both Sparkle Suite domains point to it. Focused Team Management/onboarding tests passed (116 tests) and the production build passed. The authenticated reviewer-browser path remains blocked by the known too-short reviewer token; it was not bypassed with Louis's account. No onboarding participant was created for release testing.

- **Control Center:** It has its own operator sign-in/session, independent of whichever Sparkle Suite rep account is active in the browser. Its new **Bug Hunt and Updates** area is the private backlog for bugs, improvements, content work, research, and operational follow-ups. A task marked completed moves to a bottom-of-page archive and can be restored to active work; it is not deleted. The Control Center was also updated for stronger light/dark readability and collapsible/compact section handling.
- **Customer-site quality:** The 11 selectable skins now use semantic foreground tokens on local surfaces. This fixes high-risk customer-visible contrast defects in Join final cards, icon tiles, shared actions, Trade request controls, active filters, and the expanded Trade collection search. Heather's custom-domain SSR now preserves the original validated host through the proxy rewrite, so `theblingkitchen.com` renders Heather/BlingKitchen rather than default Sasha/demo content.
- **Heather billing:** Heather's verified existing Stripe customer and active $39/month grandfathered subscription are linked to her exact Sparkle Suite rep/subscription rows. Do not use a checkout/payment-link fallback for her. Her account opens the Stripe Billing Portal when she chooses **Stripe Billing and Payments**.
- **Brittany onboarding and billing:** Brittany's Britt With Bling has a detailed, standalone **public/no-sign-in** beta welcome at `https://brittwithbling-beta-welcome.louis526569.chatgpt.site`; its companion Gmail message is an unsent draft. Her active Sparkle Suite rep/subscription rows are now linked only to the exact existing Stripe customer and active grandfathered $39/month subscription verified in Stripe. No Stripe provider object was created or changed. The Stripe customer record uses the same email as her Sparkle Suite account but retains a legacy customer-name label; keep the verified account/subscription linkage intact unless an identity correction is explicitly authorized.
- **Workspace billing contract:** For every current and future account, Sparkle Suite presents billing as a Stripe handoff. The Account UI must not duplicate card details, payment methods, invoices, billing history, cancellation controls, SMS wallet, or recharge controls. Existing active customers receive the Stripe portal action; accounts that still need to subscribe receive Stripe Checkout.
- **Messaging launch gate:** The SMS/mobile wallet is hidden and its workspace fetch is disabled until the customer texting/email product is actually launched. Messages remains a separate `Coming soon` tool; the wallet implementation is preserved but must not be re-exposed early.

**Latest production application release:** `3f82e581 fix: keep workspace billing in Stripe`, deployment `dpl_2irAn65qi1Jg8JNFoWWQyhXfEX7A`. Both Sparkle Suite aliases and Heather's custom domain were checked after release. The synthetic reviewer-browser route remains blocked by the known too-short reviewer-token configuration; do not bypass it with Louis's personal account.

**Last updated:** August 9, 2026

---

## August 8 Customer Onboarding, Domains, and Recipe Intake Checkpoint

- The active implementation line is `codex/nic-nac-trade-hardening`. Recent application checkpoint `e70a6029 feat: simplify BlingKitchen recipe intake` is deployed to production as `dpl_BEsTfA2TMeCzvdQT5kCzDPrtzZ4x`; both Sparkle Suite production domains and `theblingkitchen.com` resolve to that exact release.
- Heather's BlingKitchen recipe editor is a direct, image-first workflow: there is no Nic-Nac choice in the visible editor and no `Let Nic-Nac choose` category option. Heather adds two customer-facing food photos (outside Pantry card and inside recipe view) plus one or more private recipe-source photos containing ingredients, directions, and her tip; the tool reads and formats a draft for review before saving. Source photos are private and not customer-facing.
- Heather's domain `theblingkitchen.com` now routes to her customer-facing Sparkle Suite site. Her purple customer-site favicon/social identity uses the current BlingKitchen header-mark style and follows the reusable customer-site brand-asset pattern.
- Brianna's `brisglowtique.com` routes to Bri's Glowtique, not a demo/Sasha tenant. It uses the approved stable dark-background, white cursive `B` favicon and request-aware social preview. Her footer removes Contact and renders FAQ as non-interactive `FAQ · Coming soon`.
- Standard customer-site unused video/image placements now retain their intended card footprint and say `Coming soon`; this prevents a blank TikTok/media card from visually merging with adjacent content. The footer cleanup and empty-media treatment apply across standard customer-facing sites.
- Control Center now has a Customer Waitlist surface that combines landing-page signups and manual records, supports private notes, an account-activated tracker, and a deliberate two-click permanent delete. Historical linked launch/agreement records are preserved and unlinked before a waitlist row is removed. No real waitlist entries were deleted during development.
- Customer List is distinct from Messages: Customer List is a working editable contact roster/import tool; Messages remains a separate `Coming soon` communication tool. CSV/XLSX imports are rep-scoped, profile-only, and duplicate-aware by email/phone; they do not create marketing consent and skip ambiguous matches.
- Heather's standalone onboarding welcome page was updated and republished at `https://heather-blingkitchen-welcome.louis526569.chatgpt.site`. The related Gmail draft was updated in the Chrome session signed in as `louis@neonrabbit.net`, left unsent, and retains only a temporary-password placeholder. Never put credentials in this vault.

**Verification and limits:** focused dashboard test `tests/nic-nac-dashboard-placeholder.test.ts` passed (101 tests) and the Sparkle Suite production build passed for `e70a6029`. The welcome-site build/publish succeeded separately. The authenticated reviewer-browser path remains blocked by the known too-short reviewer-token configuration; do not bypass it with Louis's account.

**Last updated:** August 8, 2026

---

## August 4 Customer-Site Empty Media States

- Every standard customer-facing homepage now preserves the full designed card for an unused Showcase video or About image/video slot and labels it **Coming soon**. Empty media can no longer collapse or leave controls floating over adjacent content.
- TikTok embeds continue to render inline when a valid video ID is present. The fallback is intentionally a non-interactive placeholder, including for an invalid or absent video value, rather than a fake playable control.

**Last updated:** August 4, 2026

---

## August 4 Bri's Glowtique Footer Cleanup

- Bri's public customer-site footer no longer shows a Contact link. FAQ remains visible only as a non-interactive `FAQ · Coming soon` label until a real customer FAQ exists; it does not lead visitors to a placeholder or signup section.
- The same footer contract applies to the standard Amethyst Homepage, Trade Board, and Join pages. The Mile High Fizz hybrid's distinct curated footer remains unchanged.

**Last updated:** August 4, 2026

---

## August 4 Control Center Waitlist Removal Checkpoint

- Control Center operators can permanently remove a Customer Waitlist entry from both the visible list and `public.sparkle_suite_waitlist`. The confirmation is intentionally a clear second click: `Delete Jane Doe?` followed by an explicit `Delete Jane Doe` action. Errors remain visible in the dialog instead of appearing off-screen in the manual-entry form.
- The initial delete attempt exposed historical schema conflicts: deleting a waitlist source correctly clears the links on its old launch-build and agreement-document records, but both carried outdated constraints forbidding an archived source. Migrations `20260804250000_ss_archive_launch_build_sources.sql` and `20260804260000_ss_archive_waitlist_agreement_sources.sql` now timestamp source removal before deletion and allow those preserved historical records to remain valid. This does not delete a customer account, create account state, or change marketing consent.
- Focused waitlist/auth tests passed (13 tests), and a rollback-only linked-production test created a synthetic waitlist/build/agreement trio, deleted the synthetic waitlist row, asserted both historical records were preserved and unlinked, then rolled back all test data. No real waitlist entry was removed by Codex.

**Last updated:** August 4, 2026

---

## August 4 Control Center Customer Waitlist Checkpoint

- Control Center now has a dedicated **Customer Waitlist** section that combines coming-soon landing-page signups with operator-created manual entries. Each entry shows its source, contact details, private operator notes, and a non-destructive **Account activated** tracker.
- Manual entries require only name and email, accept optional phone and notes, and never create email/SMS marketing consent. Checking Account activated records operator-only tracking metadata; it does not create, charge, or alter a customer account.
- Production schema migration `20260804240000_ss_control_center_customer_waitlist.sql` adds optional operator notes, account-activation audit fields, and permits manual rows without landing-form-only TikTok/team fields. A no-op local witness `20260804230000_add_nfl_lab_saves.sql` documents the previously remote-only, unrelated NFL Lab migration so migration history remains aligned.

**Last updated:** August 4, 2026

---

## August 4 Customer-Site Brand Assets Checkpoint

- Bri's Glowtique now has the approved stable dark-and-white cursive `B` monogram on `brisglowtique.com` through the request-aware `/icon` route. The favicon is intentionally independent of a skin change.
- Customer-domain `/opengraph-image` now creates a 1200x630 share preview using the live customer-site business name, tagline, custom domain, and active appearance-preset palette. Bri's current card follows Emerald Garden; future skin changes update the card palette without replacing the approved mark.
- Reusable project guidance lives in `.agents/skills/sparkle-suite-customer-site-brand-assets/`. The standard keeps generic Sparkle Suite public assets on platform domains and applies rep assets only after validated custom-domain resolution.

**Last updated:** August 4, 2026

---

## August 4 Customer List and Import Checkpoint

- Tools now presents **Customer List** as a working, standalone customer-profile tool. **Messages** remains a separate, disabled `Coming soon` communications tool; the roster must never replace or imply that future communications work.
- Customer List accepts `.csv` and `.xlsx` files. Reps can download a Google Sheet as CSV or Excel, then import up to 250 rows at once. Recognized columns include name, email, phone, address, birthday, jewelry preferences, notes, and tags.
- Imports are profile-only. They never create SMS or email marketing consent, match existing contacts only within the authenticated rep's workspace by email or phone, preserve omitted values, and skip ambiguous email/phone matches rather than merging records.

**Last updated:** August 4, 2026

---

## Current Phase

**Phase 1 closing into Phase 2**

---

## August 4 Workspace, Billing, and Public Landing Checkpoint

- Nic-Nac retains its centered, full-workspace conversation layout. The only reset control is a small new-chat/refresh icon beside the Nic-Nac heading; the rejected side-panel/chat-slice treatment is not part of the product.
- The shared workspace header no longer shows a Notifications bell. Account billing calls-to-action use the plain label Stripe Billing and Payments.
- Brianna Williams / Bri's Glowtique has a grandfathered account presentation: $39/month grandfathered plan - no build fee, with the approved Stripe payment link shown through the shared billing handoff. Sparkle Suite does not duplicate Stripe's card, invoice, or payment-history UI. Temporary credentials remain private and must never be placed in tracked files.
- The old sparkle-suite-demo.vercel.app is legacy provenance only. It can legitimately show old UI; Louis reviews the single live surface at https://www.yoursparklesuite.com.
- The public landing page now uses real product proof: Trade Board in the hero, Nic-Nac workspace proof in the Rep Workspace section, and a customer-facing-site customization section directly after the hero. The customization section uses three provided real site screenshots in a deliberately vertical cascading stack so each design's hero remains readable. The hero must not repeat the Nic-Nac overlay once that proof is used below.
- Recent landing commits: d224bd3c, 17713c2d, c4133197, ec8ece67, 87ad21d7, e8216faf, and 3881da55. Every implementation checkpoint received focused landing tests, a production build, a Git push, and an automatic Vercel production deployment check. Preserve unrelated artifacts/ and test-results/ folders.
- Visual-review lesson: for layered product screenshots, inspect a rendered desktop capture before release. A stacked treatment must expose meaningful content from every rear card, not merely headers or thin strips.

---

## August 2 Customer-Facing Site Setup and Media Checkpoint

- The workspace tool formerly called `Site Settings` is now consistently named
  **Customer-facing site setup**. It includes a customer-site preview action.
- Public announcement copy now comes only from the configured ticker text; it
  no longer pulls in unrelated defaults or other site content.
- The public homepage has three distinct media placements: **Showcase video**
  accepts only a TikTok/video URL; **About media 1** and **About media 2** can
  each contain either a photo or a TikTok/video URL. Photo uploads show an
  immediate success state and remain a draft until the rep saves settings.
- TikTok media renders inline in its placement, autoplaying muted when scrolled
  into view. Sparkle Suite provides the single mute/unmute control; TikTok's
  native controls are suppressed to prevent navigation away from the site.
- Captions are a photo-only concept. A video URL clears any stored caption and
  hides the Caption control entirely; photo-only cards retain it.
- The About narrative is deliberately **Nic-Nac-owned**, not a second manual
  editor. The setup card explains the conversation flow and offers **Write
  with Nic-Nac**. Nic-Nac gathers free-talk, offers polished choices, and
  publishes the approved narrative to the customer-facing site through the
  durable `about_narrative` setting.
- Production migrations and releases in this checkpoint:
  `20260802170000_ss_add_about_narrative.sql`, commits `9dda0974`,
  `8c70aa2a`, and `778bbe3e`. The active final-media deployment is
  `dpl_4kzFrRuh5XCv4mffPuzXfsmRBuSc`, from exact commit
  `778bbe3ea3333cb52ba73e2a0722e5ebefece213`, with both production domains
  assigned.
- Focused media/workspace tests and production builds passed for every release.
  Live authenticated reviewer click-through remains blocked by the known
  reviewer-token configuration issue; do not substitute Louis's account for
  state-changing review.

---

## August 2 Workspace Simplification and Live Queue Checkpoint

- The shared workspace now uses four primary tabs: Nic-Nac, Trade Board,
  Calendar, and Tools. Jewelry Library moved from the bottom navigation into
  Tools so the change applies to every current workspace, demo/reviewer
  account, and future account.
- Nic-Nac's redundant `Check my board` action and composer suggestion chips
  were removed. `Add a piece` remains in the left workspace rail, while
  `Add a show` remains only in the Upcoming Show card on the right rail. This
  preserves the central column for the Nic-Nac conversation.
- Team Management and Bulk Collection Intake are visible but disabled with
  `Coming soon`. Their existing implementation and historical evidence remain
  preserved for later reactivation; first beta testers cannot enter them.
- Live Site Preview keeps only `Back to workspace` and `Open full site`.
  `Refresh preview` and the preview-only Nic-Nac drawer control were removed.
- The customer-site explainer card now uses surface-owned semantic text colors
  across every skin. A static asset cache-key refresh ensured the shared fix
  reached the production customer-site HTML.
- Louis's protected admin/demo workspace received a convention-compliant Live
  Queue code. The exact private value is retained in private Open Brain recall,
  not in this Git-tracked vault.
- Tools now includes a shared Live Queue guide. It reads the authenticated
  workspace's assigned code, links to the official Sparkle Suite Live Queue
  Chrome Web Store listing and Bomb Party Party Orders, provides six plain
  English setup steps, a pre-show verification checklist, troubleshooting,
  customer-site/help links, and an explanation of the extension's read-only
  queue behavior. The guide does not change extension source, Web Store
  settings, queue data, or Bomb Party behavior.
- Final application checkpoint:
  `1ca7b48d9f9ba725e178e3ded5ec0c32eda12376 feat: add live queue workspace guide`.
  Focused Live Queue/workspace verification passed 130 tests and the Next.js
  16.2.1 production build. Production deployment
  `dpl_psy1p3NGqfp9ygM4a77ncxBKfMK5` serves both live domains from that exact
  commit; signed-in live-domain verification confirmed the Tools entry,
  workspace-specific code, canonical links, guide content, and back
  navigation.

---

## August 2 Operator-Led Trial Onboarding Checkpoint

- Public acquisition is waitlist-first. Ordinary `/start` traffic redirects to
  `/prelaunch#waitlist`; the protected synthetic reviewer controls remain
  available only through their authorized token path.
- Louis provisions approved reps individually from Control Center after their
  setup profile is ready. Account creation requires the temporary password to
  be entered twice, creates no checkout, sends no automatic account-ready
  email, and leaves the fixed five-day trial pending until the rep's first
  successful sign-in.
- Full workspace and customer-site access is granted only by an `active` or
  `trialing` Stripe subscription or an unexpired active operator trial.
  `past_due`, paused, cancelled, revoked, pending, and expired states do not
  grant product access. Account, billing, password/security, recovery, and help
  remain reachable; stored customer/workspace data is preserved.
- Trial checkout converts to the existing paid plan without rerunning required
  setup or Light Box fulfillment. The trial row is revoked but retained as
  audit history after paid checkout.
- Password recovery and authenticated password change share a 12-character
  strong-password policy and require exact confirmation.
- Supabase migration
  `20260802160000_ss_operator_workspace_trials.sql` is applied to linked project
  `bqhzfkgkjyuhlsozpylf`.
- Focused verification passed across 23 files / 354 tests, the Finder boundary
  suites passed, and the Next.js 16.2.1 production build passed. Application
  commit `04dc49ddcb9e8a1a2a547e82d17f5bf21a5434ee` deployed READY as
  `dpl_Ev92KLHuTSckDFiRY68SNSXgXfsn`; Vercel confirmed both live domains on
  that exact deployment.

---

## Platform

- **Live URL:** yoursparklesuite.com
- **Hosting:** Vercel
- **Framework:** Next.js 16
- **Repo:** louis623/sparkle-suite on GitHub
- **Active local workbench:** `C:\Users\louis\sparkle-suite-repo`
- **Active local branch:** `codex/nic-nac-trade-hardening`
- **Latest local implementation checkpoint:**
  `1ca7b48d feat: add live queue workspace guide`
- **Latest local docs/memory checkpoint:** July 31 single-live-surface rule
  correction: Sparkle Suite live and demo are one surface at
  `yoursparklesuite.com`; all approved work flows to Vercel production and is
  verified on the live domain. This sits on top of the production
  rollback/checkout-routing incident closeout, repaired admin/demo-account
  invariant, deny-unlisted branch guards, audited preservation checkpoints,
  and permanent provenance/post-auth safeguards.
- **Latest local/deployed checkpoints:** The recovered three-slot
  customer-homepage media contract is now verified end to end. Site Settings
  accepts a photo, caption, and either TikTok embed markup or a plain video URL
  for Showcase, About media 1, and About media 2. Invalid nonblank media input
  now produces a visible field-specific error instead of reporting a false
  successful save. Saved photo/caption data maps into the existing Amethyst
  public renderer. A valid rep-targeted customer URL now counts as a live site
  even when the account has no vanity slug. The persistent header customer
  address and right-rail `Open site` action both open the embedded Live Site
  Preview, while the copy control and exact stored Live Queue code remain
  available. The rejected `Sparkle with us.` bubble and redundant `Preview
  site` controls remain removed.
- **Latest Emerald Garden production checkpoint:** The Emerald Garden
  customer-site skin now uses the shared content and ticker contract across
  Homepage, Trade Board, and Join. Announcement text is white on the dark
  emerald row, announcement and Trade Board tracks retain the shared 46 and
  55.2 pixels-per-second pacing, and the old pale blob/glass-box hero treatment
  has been replaced with the shared full-bleed composition. Production
  deployment `dpl_F7FSNS9fGZiKQ1nRQxAXzGUdEUka` is Ready from exact commit
  `4a2917c8` with both live domains assigned.
- **Latest skin-readability production checkpoint:** Customer-site cards and
  forms now derive foreground, muted, and accent text from their own surface
  tokens instead of inheriting the surrounding section color. This restores
  the previously invisible Emerald Garden signup heading and protects every
  registered skin surface from the same light-on-light or dark-on-dark
  regression. Production deployment `dpl_ET3A3q8orA3uya6oE6b1myQZJjEr` is
  Ready from exact commit
  `44c5a79ca5c6e0204cbb0d399260401eebb9dfe6` with both live domains assigned.
- **Latest constant-speed ticker production checkpoint:** Empty or short Trade
  Board states now enter the same duplicated, measured ticker loop as populated
  inventory on Homepage, Trade Board, and Join. The exact live customer-domain
  routes measured about 55.2 pixels per second for Trade Board content while
  announcements remained at their established 46 pixels per second. Production
  deployment `dpl_2kboNgryVqYjRkQN3JsSH8JZRFpt` is Ready from exact application
  commit `8f6f5b6a78603e5fa40a8a4ffb90eab5b3097c11` with both live domains
  assigned.
- **Latest Trade Board ticker typography checkpoint:** Trade Board ticker copy
  now uses true `700` weight for both populated listings and the empty-state
  message across the shared React shell and static Homepage, Trade Board, and
  Join pages. Announcement ticker copy remains at its established `500` weight,
  and the measured Trade Board pace remains 55.2 pixels per second. Application
  commit: `929638daff8fd8f8798e3a86196b16d4d558cbe2`.
- **Live production URL / Louis review target:** `https://www.yoursparklesuite.com`
- **Apex production URL:** `https://yoursparklesuite.com`
- **Environment model:** Sparkle Suite live and demo are one surface. Demo
  means safe reviewer data/mode on `yoursparklesuite.com`, not a separate
  domain or deployment lane.
- **Production deployment provenance:** Inspect both live domains in Vercel
  before every release or incident response; do not treat a raw deployment ID
  recorded in memory as the current source of truth.
- **Latest homepage-media production deployment:**
  `dpl_3ZeRTLEqwSyE2neQvvekoHcxKNmy`, Ready from exact commit
  `86feb94dcaa08a6ee9ae702de30e095c31583ff4` with the `www` and apex live
  domains assigned.
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

### August 16, 2026 Nic-Nac Conversation Control Simplification

- Released `b0f5c1d2 fix: simplify Nic-Nac conversation controls` on `codex/nic-nac-trade-hardening`.
- The workspace home and compact Nic-Nac headers now use one visible **Clear conversation** button. It starts a new empty conversation; the redundant manual refresh button is removed. Passive refresh-on-focus/online/visibility behavior remains unchanged.
- The workspace greeting now uses the rep profile display name: `Hi {rep name}, how can I help you today?` (with `Hi there` only while profile data is unavailable).
- Validation passed: 119 focused workspace/Nic-Nac tests and `npm run build` with the active-branch safety gate.
- Production deployment: `dpl_392QjSeTYmG7wCio8saGH7ksGgez` (`https://sparkle-suite-orfl311rg-louis-2849s-projects.vercel.app`), serving commit `b0f5c1d2`. Both `www.yoursparklesuite.com` and `yoursparklesuite.com` resolve to it.
- Reviewer UI smoke remains blocked: `/start` routes to the prelaunch surface with no reviewer controls, and the existing browser workspace is authenticated. No customer or Louis account was used to bypass the known reviewer-token limitation.

### August 16, 2026 Manual Vercel Release Policy

- Vercel project `sparkle-suite` remains linked to GitHub repository `louis623/sparkle-suite` with `codex/nic-nac-trade-hardening` as the configured production branch, but `gitProviderOptions.createDeployments` is now `disabled` by Louis's direction.
- Git pushes preserve source provenance but do not create a deployment. Approved application changes must use one deliberate manual Vercel production deployment of the exact checked branch tip, followed by the existing alias and live-workflow smoke gates.
- This prevents documentation/checkpoint pushes from consuming Vercel deployment capacity. Do not re-enable automatic Git deployments without Louis's explicit approval.
- The next application release remains `c3e6a282 fix: guard unsaved recipe edits`; it is pushed but pending the Vercel daily-capacity reset. `388087c9 feat: harden recipe editing workflow` remains the live recipe release.

### August 17, 2026 Pantry category consolidation

- Heather's public Pantry now has one `Baking & Sweets` category for desserts, baked goods, and sweets. The editor, AI recipe-draft normalization, saved-recipe service, and public template all normalize legacy `Baking` and `Dessert` values to that category.
- The initial Peanut Butter Cookies report was a visibility grouping defect, not a failed save: `Bakery Style Thick Peanut Butter Cookies` was a visible saved record, but its old `Dessert` category was not rendered by the All view's fixed groups. The public renderer now also includes a safe "More from Heather's Pantry" fallback for any future unrecognized category so an otherwise-visible recipe cannot disappear.
- Updated the 14 existing BlingKitchen records previously categorized `Baking` or `Dessert` to `Baking & Sweets`; recipe content, visibility, images, and ordering were preserved.
- Released application tip `80185d3c fix: type recipe category normalization` manually as Vercel production deployment `dpl_8DG2YAcoerFtpYsUMqtDYh5BvcQU` (`https://sparkle-suite-8edaobbgm-louis-2849s-projects.vercel.app`). It owns both Sparkle Suite aliases and the BlingKitchen custom domain. Public no-auth verification confirmed the cache-busted Pantry asset, the Peanut Butter Cookies entry, `Baking & Sweets`, no legacy `Dessert` category, 200 responses for www and BlingKitchen, and the apex canonical redirect.

### August 17, 2026 Recipe save action placement

- The New Recipe builder and Current Recipe editor now put one **Save to live site** action in the top Recipes header, directly beside their respective recipe-reading action (**Read and format recipe** or **Read source photos and replace details**). The duplicate bottom save buttons were removed; save behavior, unsaved-change protection, and delete confirmation are unchanged.
- Application commit `62263b35 feat: move recipe save action to editor header` was manually released as Vercel deployment `dpl_J7VDyXPynjJntQtX5Kn95QABA3qW` (`https://sparkle-suite-ej4mij7if-louis-2849s-projects.vercel.app`). It owns both Sparkle Suite aliases and the active customer domains. Focused recipe-workspace coverage passed (105 tests), local and Vercel builds passed, the canonical recipe route returned 200, the apex returned the expected 307, and BlingKitchen Pantry returned 200.
- Vercel also created an unexpected Git-sourced production deployment for this push (`dpl_9Q6b18uhJiLEog9UASNBALx75W8W`, exact commit `62263b3`), despite the documented disabled automatic-deployment policy. It built successfully but did not receive production customer aliases; the required manual deployment above is the production release. Investigate the Vercel Git-deployment setting before a future push.

### August 17, 2026 Git deployment policy repair

- Audit proved GitHub and the branch are healthy. Vercel's project API still reported legacy `gitProviderOptions.createDeployments: "disabled"`, but the deployment history showed Vercel-for-GitHub creating a second Production deployment for every push (`githubDeployment: "1"`). Current Vercel documentation identifies `git.deploymentEnabled` as the governing configuration for Git-triggered deploys.
- Added the static Vercel configuration `git.deploymentEnabled: false` in `vercel.json`, preserving the GitHub connection, production branch, domains, cron configuration, and current production release. This makes Git pushes provenance-only; approved application releases remain manual Vercel production deployments of the exact verified branch tip.
- Verified the configuration commit `c0a66a9f` after the Git webhook window: Vercel created no deployment, and both Sparkle Suite aliases plus active customer domains remained on manual release `dpl_J7VDyXPynjJntQtX5Kn95QABA3qW`.

### August 17, 2026 Recipe editor one-level back navigation

- An open existing-recipe editor now presents the workspace-level action as **Back to current recipes**, rather than **Back to Tools**. It returns to Heather's Current recipes gallery without leaving the Recipes tool. The normal tool-level back action remains **Back to Tools**.
- Released exact application commit `1fad6ff3 fix: keep recipe editor back navigation one level deep` manually as Vercel production deployment `dpl_SHhz5jAzNoYZEhy1WwuttV599MUs` (`https://sparkle-suite-6x3cv666n-louis-2849s-projects.vercel.app`). It owns both Sparkle Suite aliases and all active customer domains.
- Focused recipe-workspace coverage passed (106 tests) and local/Vercel production builds passed. No-auth checks returned 200 for canonical Workspace, BlingKitchen Pantry, both BlingKitchen hostnames, and Bri's Glowtique; the Sparkle Suite apex canonically redirects to www. The authenticated reviewer browser remains blocked by the known too-short token, with no personal/customer session used.

### August 17, 2026 Pantry recipe card footer alignment

- Recipe cards now use a full-height column layout: title and narrative stay at the top, variable empty space stays between the narrative and footer, and the prep time, servings, and **View Recipe** action align at the bottom across each Pantry grid row. Recipe content and interactions are unchanged.
- Released exact application commit `a9f32d14 fix: align Pantry recipe card footers` manually as Vercel production deployment `dpl_9N9iscB6KZsD9UMnhWjkEnxWEFxH` (`https://sparkle-suite-8y93vz37z-louis-2849s-projects.vercel.app`). It owns both Sparkle Suite aliases plus active customer domains.
- Focused public Pantry tests passed (11 tests); local and Vercel production builds passed. Live no-auth checks confirmed Heather's cache-busted footer-alignment stylesheet, canonical Sparkle Suite Pantry 200, expected apex canonicalization, and `theblingkitchen.com/in-the-pantry` 200. Reviewer visual smoke remains blocked by the known too-short token; no personal/customer account was used.

### August 17, 2026 No-Bake Treats consolidation

- Heather's public Pantry and recipe editor no longer offer `No-Bake Treats`; no-bake recipes belong in `Baking & Sweets`. The saved recipe service, AI draft builder, public template mapper, default fixture data, and editor choices normalize the removed label into `Baking & Sweets` so it cannot return through an old payload or model response.
- Updated the one affected visible BlingKitchen record with an exact identity/category guard: `Sweet & Salty Clusters` (`5a598470-0d1f-40e6-8605-d60169d02c3f`). It remains visible; only its category changed.
- Released exact application tip `dc2624c4 feat: consolidate no-bake treats into baking sweets` manually as Vercel deployment `dpl_HtdnTBiCnvQSRSGXxFSsx66QyTg8` (`https://sparkle-suite-njbbla6wd-louis-2849s-projects.vercel.app`). It owns both Sparkle Suite aliases and active customer domains. The focused suite passed 125 tests; local/Vercel builds passed; live no-auth template verification found Sweet & Salty Clusters in `Baking & Sweets` and no `No-Bake Treats` category, while canonical recipe route/www and BlingKitchen returned 200 and the apex returned the canonical 307.
