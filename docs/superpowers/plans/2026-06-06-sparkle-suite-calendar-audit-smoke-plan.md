# Sparkle Suite Calendar Audit + Smoke Plan

Date: 2026-06-06
Workbench: `C:\Users\louis\sparkle-suite-repo`
Binder: `C:\Users\louis\sparkle-suite`

## Goal

Prove the launch-critical calendar flow works end to end:

1. A signed-in rep asks Nic-Nac to add a show.
2. Nic-Nac writes the event into `calendar_events`.
3. The Sparkle Suite workspace Calendar section displays the event.
4. The customer-facing site for that rep displays the event on the homepage.
5. The public event card supports discount codes, featured collection links, watch links, and Add to Calendar export.
6. Pre-show reminder wiring remains provider-safe unless explicitly run in live mode.

## Product Intent From Open Brain, HQ, And Docs

- Sparkle Suite uses a native calendar, not Google Calendar, for rep-owned live show scheduling.
- Reps manage shows through Nic-Nac/Thumper, not by manually editing the workspace calendar.
- Workspace Calendar is a read-only operational view with upcoming shows, recurring count, and recent completed/cancelled history.
- Customer-facing Amethyst homepage should show the next two upcoming shows for that rep.
- Targeted customer sites must not fall back to demo/sample events when the rep has no events.
- Add-to-calendar is a one-way customer export; public Nic-Nac must not create provider calendar invites.
- Automated pre-show SMS reminders are handled by scheduled reminder jobs from `calendar_events`; Nic-Nac should not claim manual reminder sends.

## Current Wiring Map

- Calendar data service: `lib/services/calendar.ts`
- Nic-Nac tools:
  - `lib/nic-nac/tools/add-show.ts`
  - `lib/nic-nac/tools/list-my-shows.ts`
  - `lib/nic-nac/tools/update-show.ts`
  - `lib/nic-nac/tools/cancel-show.ts`
- Nic-Nac intent routing: `lib/nic-nac/tools/index.ts`
- Workspace summary route: `app/api/nic-nac/calendar-summary/route.ts`
- Workspace Calendar UI: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Customer homepage event loader: `lib/amethyst/homepage-upcoming-shows.ts`
- Customer homepage bootstrap route: `app/api/amethyst/homepage-template/route.ts`
- Public HTML rep targeting/static rewrite: `lib/amethyst/public-asset-response.ts`
- Customer event cards and `.ics` download: `public/amethyst/homepage.jsx`
- Reminder service/routes:
  - `lib/services/pre-show-reminders.ts`
  - `app/api/internal/show-reminders/pre-show/route.ts`
  - `app/api/internal/show-reminders/pre-show/live/route.ts`

## Audit Results So Far

- The calendar service supports one-time shows, recurring daily/weekly series, up to 10 discount codes, featured collections, updates, and cancellation.
- Nic-Nac has all four calendar tools registered and routed for schedule/calendar/upcoming/move/cancel/recurring language.
- The workspace Calendar card reads `/api/nic-nac/calendar-summary?upcoming=8&history=4` and renders metrics, month grid, next-up list, and recently wrapped list.
- The customer homepage loader reads the same calendar events with an admin client, resolves the target rep, maps the next two upcoming shows, and uses streaming links for TikTok/Facebook buttons.
- Targeted public pages are designed to return empty events instead of demo events when no rep data exists.
- The Amethyst homepage builds a downloadable `.ics` file with title, duration, description, discount codes, and watch links.
- Pre-show reminders read scheduled events due inside the lead window and remain dry-run/live-gated.

## Test Signal

Focused calendar/homepage/reminder tests were run from `C:\Users\louis\sparkle-suite-repo`.

- 7 focused suites passed:
  - calendar service
  - calendar summary route
  - dashboard calendar rendering
  - homepage upcoming shows
  - homepage template hydration
  - pre-show reminder route
  - pre-show reminder service
- Result: 104 tests passed.
- One extra calendar tools suite had 10/11 passing and 1 stale expectation:
  - `tests/nic-nac/calendar-tools.test.ts` expects 33 total tools.
  - Current registry has 35 tools.
  - Calendar tools are present; the failure is a hard-coded count drift, not missing functionality.

## Gaps / Risks To Address Before Launch Use

1. Harden `calendar-summary` numeric query parsing.
   - Current parsing uses `Number.parseInt`, which accepts partial values like `8abc` as `8`.
   - Add strict whole-number validation and probably a max cap.

2. Fix stale calendar tool registry test.
   - Replace the brittle exact total count with either the current count or a non-brittle assertion that required calendar tools exist.

3. Add an explicit end-to-end targeted-site test.
   - Verify `Homepage.html?c=<repId>` rewrites the bootstrap script to `/api/amethyst/homepage-template?c=<repId>`.
   - Verify the targeted bootstrap script includes real event payload when calendar events exist.
   - Verify targeted pages with no events do not show demo event payload.

4. Browser-smoke the actual rendered public page.
   - Confirm event title, date/time, discount code, collection link, watch link, and Add to Calendar button are visible and usable.
   - Check mobile and desktop viewport layout.
   - Confirm text encoding renders cleanly in the browser.

5. Browser-smoke the signed-in workspace Calendar.
   - Confirm a Nic-Nac-added event appears in the Calendar tab without needing a manual database check.
   - Confirm empty/recent/history states do not confuse the rep.

6. Keep reminder smoke provider-safe.
   - Run dry-run reminder route only unless Louis explicitly asks for live SMS sends.

## Proposed Smoke Test

Use a signed-in local workspace and a real test/demo rep account.

1. Create a distinctive test show through Nic-Nac.
   - Example title: `Calendar Smoke Reveal 2026-06-06`
   - Platform: TikTok
   - Time: a future timestamp this afternoon or later today.
   - Duration: 60 minutes.
   - Discount code: `SMOKE10`
   - Featured collection: one existing collection or a harmless test label.

2. Verify the write.
   - Use Nic-Nac's `list_my_shows` or the workspace `/api/nic-nac/calendar-summary` route.
   - Confirm the event belongs to the signed-in rep and has the expected fields.

3. Verify workspace display.
   - Open `http://localhost:3000/nic-nac?section=show-calendar`.
   - Confirm the Calendar tab shows the event in the month grid and Next Up panel.

4. Verify customer-facing display.
   - Open the rep's public site route, preferably `http://localhost:3000/<show-slug>`.
   - Confirm the homepage script targets the rep and the page displays the event card.
   - Confirm no demo events appear on the targeted rep page.

5. Verify event-card behavior.
   - Confirm discount copy control works.
   - Confirm collection link points to the Trade page with the expected collection query.
   - Confirm TikTok/Facebook watch link appears when the rep has the corresponding streaming link saved.
   - Click Add to Calendar and inspect that the generated `.ics` contains the correct title, start/end time, and description.

6. Verify reminder wiring in dry-run mode.
   - If the test show is within the configured lead window, call the dry-run pre-show reminder endpoint with the cron secret.
   - Confirm it plans reminders without live provider sends.

7. Clean up.
   - Cancel the smoke show through Nic-Nac, or leave it only if Louis wants a visible demo event.
   - Re-check workspace and customer site after cancellation so cancelled events disappear from upcoming public cards and move to recent workspace history.

## Recommended Implementation Order

1. Patch strict calendar summary limit parsing and update route tests.
2. Patch stale calendar tool-count test.
3. Add targeted-site calendar payload coverage if the current tests do not already fully prove it.
4. Run focused tests again.
5. Run the signed-in browser smoke on workspace and public site.
6. Document the smoke results and update HQ/Open Brain if launch-readiness status changes.

