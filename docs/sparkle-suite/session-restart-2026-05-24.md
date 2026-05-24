# Sparkle Suite Restart Prompt - 2026-05-24

Use this to restart the next Sparkle Suite session in `C:\Users\louis\neon-rabbit-core`.

## Situation Report

- Sparkle Suite / Nic-Nac smoke hardening is in progress on branch `codex/sparkle-cross-phase-hardening`.
- Latest pushed implementation commit before this restart note: `d904d7c chore: rename sparkle demo identity`.
- Next work: create two new Sparkle Suite customer-site designs before launch and continue real-flow workspace/customer smoke testing.

## What Changed In This Workstream

- Fixed Nic-Nac trade-board regressions around add-listing tool availability, photo selection, stale quantities, removed listings, and customer/workspace refresh behavior.
- Hardened trade-board photo behavior so customer-facing listings prefer the actual jewelry image instead of identifier/card backs, with the next design/smoke pass still expected to verify zoom quality on small pieces.
- Added/verified auto-refresh behavior so the Sparkle Suite workspace Trade Board can pick up Nic-Nac-created listings without a manual browser refresh.
- Guarded trade adds against stale quantities and physical-inventory unit mistakes.
- Cleaned demo identity across Supabase and active Amethyst demo surfaces:
  - rep name: `Jane`
  - show/business name: `Jane's Sparkle Party`
  - current demo rep id: `5f3fb1f9-8108-427c-8134-8e2e016f6974`
  - current Nic-Nac workspace code: `1fa4ba02-154e-4d5b-aef2-759cb13abbfb`
- Updated Amethyst shell/defaults/metadata/tests so active demo surfaces no longer use `Jane Doe`, `Jane Sparkles Live`, `Sparkle by Sasha`, `Sasha Patel`, or `Team Velvet Hour`.
- Removed the rejected generated jewelry mockup pack under `public/mockups/`.

## Verification Done

- `npx tsc --noEmit --pretty false` passed.
- Focused Amethyst/SEO tests passed: `tests/amethyst-preview-template-data.test.ts`, `tests/amethyst-homepage-template.test.ts`, `tests/amethyst-join-template.test.ts`, `tests/amethyst-trade-template.test.ts`, and `tests/seo/amethyst-public-metadata.test.ts` (`35` tests).
- Browser verification showed:
  - Nic-Nac workspace header: `Jane / Jane's Sparkle Party`
  - Trade page: new identity renders, old identity absent
  - Join page: new identity renders, old identity absent
  - Homepage title/metadata: new identity present

## Known Caveat

- Homepage body rendering needs one focused verification pass. During the final browser check, one fresh in-app browser load showed the Homepage body empty while the title/metadata were correct; later reload/path checks produced mixed evidence. Treat this as an open smoke gap before marking Homepage verified. HQ item: `b7da2afc-2684-486b-8ea7-ed1ecfe9933b`.

## HQ Items Created

- `2df881d1-5c3b-4d96-a79a-cf6237988bbd` - Create two new Sparkle Suite customer-site designs before launch.
- `2b30d7cc-a580-48d4-aa85-4a88dbae4ab4` - Continue real-flow Sparkle Suite workspace smoke testing after Nic-Nac trade fixes.
- `b7da2afc-2684-486b-8ea7-ed1ecfe9933b` - Verify Amethyst Homepage fresh-load body render while preserving new Jane demo metadata.

## Current HQ Snapshot

- Project: `sparkle_suite`
- Generated at close: `2026-05-24T18:55:49.747Z`
- Derived task rollup: `70 / 121` complete, `58%`
- Cached phase rollup: `69 / 121` complete, `57%`
- Rollup drift exists on completed tasks: cached `69`, derived `70`
- Action cards:
  - previous: `Commit a0adc86 Saved`
  - current: `Await Telnyx + Continue Safe Polish`
  - next: `Next Safe Work`

## Guardrails

- Do not send live SMS, email, SignWell, Stripe, calendar invites, or provider actions without explicit approval.
- Stripe test mode only.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not attach `+19044383050`.
- Do not touch `docs/sparkle-suite/marketing` unless explicitly asked.
- Do not move Kim Goforth.
- Rep-facing assistant name is `Nic-Nac`.

## Known Unrelated Dirty Files

- `.agents/skills/sparkle-live-queue/SKILL.md`
- `chrome-extension/manifest.json`
- `dist/`
- `docs/sparkle-suite/lessons/`
- `docs/sparkle-suite/marketing/`

## Fresh Restart Prompt

```text
STATUS: Sparkle Suite / Nic-Nac trade-board hardening and demo identity rename are documented; latest pushed code commit before the restart note is d904d7c.
PROJECT: Sparkle Suite / Nic-Nac workspace / customer-site design variants + real rep/customer smoke testing.
NEXT: Create two new Sparkle Suite customer-site designs before launch and continue real-flow smoke testing.

Continue work in:
C:\Users\louis\neon-rabbit-core

Branch:
codex/sparkle-cross-phase-hardening

Start by reading Open Brain captures:
- SESSION CLOSE — Sparkle Suite / Nic-Nac trade board hardening + demo identity rename — 2026-05-24
- ACTIVE TASK — Sparkle Suite next session — create two new customer-site designs before launch and continue real-flow smoke testing — 2026-05-24
- DECISION — Sparkle Suite demo identity — 2026-05-24
- GAP — Sparkle Suite Amethyst Homepage verification caveat — 2026-05-24

Then check Neon Rabbit HQ:
- get_build_summary project=sparkle_suite
- Review HQ items:
  - 2df881d1-5c3b-4d96-a79a-cf6237988bbd
  - 2b30d7cc-a580-48d4-aa85-4a88dbae4ab4
  - b7da2afc-2684-486b-8ea7-ed1ecfe9933b

Current demo identity:
- Rep name: Jane
- Show/business name: Jane's Sparkle Party
- Demo rep id: 5f3fb1f9-8108-427c-8134-8e2e016f6974
- Nic-Nac workspace code: 1fa4ba02-154e-4d5b-aef2-759cb13abbfb
- Current local workspace URL:
  http://localhost:3000/nic-nac?c=1fa4ba02-154e-4d5b-aef2-759cb13abbfb&conversationId=a149a8a1-afb8-43cb-9eb8-f799f1e7c717

Goals:
1. Verify the Amethyst Homepage fresh-load body render issue first so the current design baseline is trustworthy.
2. Create two additional Sparkle Suite customer-site designs before launch. Amethyst already exists; preserve the same real product flows: Homepage, Trade Board, Join page, Nic-Nac panel behavior, public customer links, SEO metadata, and rep/customer data mapping.
3. Continue real-flow smoke testing from the rep/customer path: Messages/customer roster, Site Settings, Calendar, Account/billing, live-site buttons, customer Trade Board, Nic-Nac add/remove/listing flows, auto-refresh between Nic-Nac and workspace Trade Board, photo choice/zoom behavior, and no stale quantity or removed-listing regressions.

Guardrails:
- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch chrome-extension/content.js.
- Do not touch supabase/functions/live-queue-sync.
- Do not attach +19044383050.
- Do not touch docs/sparkle-suite/marketing unless explicitly asked.
- Do not move Kim Goforth.
- Rep-facing assistant name is Nic-Nac.

Known unrelated dirty files may exist; ignore unless asked:
- .agents/skills/sparkle-live-queue/SKILL.md
- chrome-extension/manifest.json
- dist/
- docs/sparkle-suite/lessons/
- docs/sparkle-suite/marketing/

Working style:
- Inspect before editing.
- Use the actual app/customer path, not fake-only harnesses.
- For new designs, build usable customer-site experiences, not landing pages.
- Keep batches small, run focused tests, and commit/push cleanly.
```
