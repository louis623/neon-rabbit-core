# Sparkle Suite Restart Prompt - 2026-05-24

Use this to restart the next Sparkle Suite session in `C:\Users\louis\neon-rabbit-core`.

## First Instruction For The Next Session

Do not start implementation automatically. Read the prompt, Open Brain captures, HQ state, and repo status first. Then summarize the current situation for Louis and ask what he wants to do next before implementing, committing, pushing, or running long smoke tests.

## Situation Report

- Sparkle Suite / Nic-Nac customer-site skin work is in progress on branch `codex/sparkle-cross-phase-hardening`.
- Latest pushed implementation commit: `b5f0bf3 feat: add Morganite customer site skin`.
- Amethyst is the default customer-site template for every new rep.
- Customer-site skins are visual-only Amethyst `appearancePreset` options. They must preserve Homepage, Trade Board, Join page, Nic-Nac panel behavior, SEO metadata, and real rep/customer data mapping.
- Black Diamond is approved and implemented locally, but is not committed or pushed yet unless a later session does so.

## What Changed In This Workstream

- Confirmed the skin model:
  - `customerSiteTemplate` remains `amethyst`.
  - New looks are `appearancePreset` values, not separate customer-site templates.
  - Every rep can start from Amethyst and keep their own branding/data while changing visual feel through Nic-Nac or Site Settings.
- Made Amethyst the default for new reps.
- Created the Sparkle Suite skin builder skill at `.agents/skills/sparkle-suite-skin-builder/SKILL.md`.
- Added skin-card guidance so reps can browse inexpensive brand cards in Help/More Info and ask Nic-Nac to apply a skin by code/name instead of repeatedly switching live skins.
- Added Sparkle Suite/Morganite:
  - ID: `sparkle_suite_morganite`
  - Label: `Sparkle Suite/Morganite`
  - Code: `SS-01`
  - Status: committed and pushed in `b5f0bf3`.
- Added Black Diamond locally:
  - ID: `black_diamond`
  - Label: `Black Diamond`
  - Code: `BD-01`
  - Direction: black velvet, metallic gold, blush warmth, cyan live-show accents, inspired by BrittWithBling.com.
  - Status: approved by Louis and implemented locally, but not committed or pushed yet.

## Active Skin List

- `AM-01` - Amethyst - `amethyst` - default.
- `SS-01` - Sparkle Suite/Morganite - `sparkle_suite_morganite` - committed and pushed.
- `BD-01` - Black Diamond - `black_diamond` - local/uncommitted unless later committed.

## Black Diamond Local Implementation

Black Diamond changed these files locally:

- `lib/amethyst/appearance-presets.ts`
- `lib/amethyst/skin-cards.ts`
- `lib/services/types.ts`
- `app/nic-nac/components/DashboardPlaceholder.tsx`
- `lib/nic-nac/system-prompt.ts`
- `public/amethyst/homepage.jsx`
- `public/amethyst/trade.jsx`
- `public/amethyst/join.jsx`
- `public/amethyst/homepage.css`
- `supabase/migrations/20260524221000_ss_add_black_diamond_appearance_preset.sql`
- `tests/amethyst-appearance-presets.test.ts`
- `tests/amethyst-homepage-template.test.ts`
- `tests/amethyst-trade-template.test.ts`
- `tests/amethyst-join-template.test.ts`
- `tests/services/site-settings.test.ts`
- `tests/nic-nac/site-customization-tools.test.ts`
- `tests/nic-nac-dashboard-placeholder.test.ts`

## Verification Done

- Morganite was committed and pushed after focused implementation verification.
- Black Diamond red tests were added first, then implementation made them pass.
- Black Diamond verification passed:
  - Focused Vitest suite: `7` files, `85` tests passed.
  - Adjacent preview/route tests: `2` files, `9` tests passed.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
  - `npm run qa:amethyst` template-test portion passed.
  - `npm run qa:amethyst` link verifier initially targeted localhost `3001` while the active Next dev server was on `3000`; rerun with `AMETHYST_DEV_PORT=3000 npm run verify:amethyst-links` passed for Homepage, Trade, and Join.

## Open Brain Captures To Read

- `SESSION CLOSE - Sparkle Suite / customer-site skin builder, Morganite, and Black Diamond - 2026-05-24`
- `ACTIVE TASK - Sparkle Suite next session - continue customer-site skins after check-in, then smoke testing - 2026-05-24`
- `DECISION - Sparkle Suite customer-site skin model, skin codes, and preview workflow - 2026-05-24`
- `DECISION - Sparkle Suite restart prompt must check in before continuing work - 2026-05-24`
- Earlier context, if needed:
  - `SESSION CLOSE - Sparkle Suite / Nic-Nac trade board hardening + demo identity rename - 2026-05-24`
  - `DECISION - Sparkle Suite demo identity - 2026-05-24`
  - `GAP - Sparkle Suite Amethyst Homepage verification caveat - 2026-05-24`

## Neon Rabbit HQ

Start by checking:

- `get_build_summary project=sparkle_suite`
- Review HQ items:
  - `2df881d1-5c3b-4d96-a79a-cf6237988bbd` - customer-site skins before launch.
  - `2b30d7cc-a580-48d4-aa85-4a88dbae4ab4` - real-flow workspace smoke testing.
  - `b7da2afc-2684-486b-8ea7-ed1ecfe9933b` - Amethyst Homepage fresh-load caveat.
  - `ca79ab68-9f72-42e3-8f4e-8ff222c31e81` - decision: customer-site skins stay on Amethyst.
  - `3a236ab2-a8f6-4e35-a6e5-9e1c9e01db3e` - decision: restart prompts must check in before work.
  - `8cff8ac2-df27-47a6-9160-9884e08553b0` - task: commit and push Black Diamond when Louis is ready.

Current action cards after documentation:

- Previous: `Morganite Skin Pushed`
- Current: `Black Diamond Skin Ready Locally`
- Next: `Read Context, Then Check In`

## Current Demo Identity

- Rep name: `Jane`
- Show/business name: `Jane's Sparkle Party`
- Demo rep id: `5f3fb1f9-8108-427c-8134-8e2e016f6974`
- Nic-Nac workspace code: `1fa4ba02-154e-4d5b-aef2-759cb13abbfb`

## Next Likely Work

Ask Louis before doing any of this:

- Commit/push Black Diamond if he wants it saved to the remote branch now.
- Build the next customer-site skin concept, using the skin-builder workflow:
  - confirm visual-only Amethyst skin,
  - mock/preview when direction is not locked,
  - get Louis approval,
  - add red tests,
  - implement the preset/card/mapping/migration,
  - verify focused tests, TypeScript, build, and Amethyst browser/link behavior.
- Continue real-flow smoke testing:
  - Messages/customer roster,
  - Site Settings,
  - Calendar,
  - Account/billing,
  - live-site buttons,
  - customer Trade Board,
  - Nic-Nac add/remove/listing flows,
  - auto-refresh,
  - photo choice/zoom,
  - stale quantity guards,
  - removed-listing behavior.

## Guardrails

- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not attach `+19044383050`.
- Do not touch `docs/sparkle-suite/marketing` unless explicitly asked.
- Do not move Kim Goforth.
- Rep-facing assistant name is `Nic-Nac`.

## Known Unrelated Dirty Files

Ignore these unless Louis asks. Remind before launch that they still exist:

- `.agents/skills/sparkle-live-queue/SKILL.md`
- `chrome-extension/manifest.json`
- `dist/`
- `docs/sparkle-suite/lessons/`
- `docs/sparkle-suite/marketing/`

## Fresh Restart Prompt

```text
STATUS: Sparkle Suite customer-site skins are documented. Latest pushed implementation commit is b5f0bf3 (Morganite). Black Diamond is approved and implemented locally but not committed/pushed unless a later session already did that.
PROJECT: Sparkle Suite / Nic-Nac workspace / customer-site skins + real rep/customer smoke testing.
IMPORTANT STARTUP BEHAVIOR: Do not begin implementation automatically. Read the context below, check repo/HQ/Open Brain, then summarize what you found and ask Louis what he wants to do next.

Continue in:
C:\Users\louis\neon-rabbit-core

Branch:
codex/sparkle-cross-phase-hardening

Start by reading Open Brain captures:
- SESSION CLOSE - Sparkle Suite / customer-site skin builder, Morganite, and Black Diamond - 2026-05-24
- ACTIVE TASK - Sparkle Suite next session - continue customer-site skins after check-in, then smoke testing - 2026-05-24
- DECISION - Sparkle Suite customer-site skin model, skin codes, and preview workflow - 2026-05-24
- DECISION - Sparkle Suite restart prompt must check in before continuing work - 2026-05-24
- If needed for older context:
  - SESSION CLOSE - Sparkle Suite / Nic-Nac trade board hardening + demo identity rename - 2026-05-24
  - DECISION - Sparkle Suite demo identity - 2026-05-24
  - GAP - Sparkle Suite Amethyst Homepage verification caveat - 2026-05-24

Then check Neon Rabbit HQ:
- get_build_summary project=sparkle_suite
- Review HQ items:
  - 2df881d1-5c3b-4d96-a79a-cf6237988bbd
  - 2b30d7cc-a580-48d4-aa85-4a88dbae4ab4
  - b7da2afc-2684-486b-8ea7-ed1ecfe9933b
  - ca79ab68-9f72-42e3-8f4e-8ff222c31e81
  - 3a236ab2-a8f6-4e35-a6e5-9e1c9e01db3e
  - 8cff8ac2-df27-47a6-9160-9884e08553b0

Check repo state:
- git status --short
- Latest pushed commit should be b5f0bf3 unless Louis or another session pushed after this prompt.
- Black Diamond may be local/uncommitted. Do not commit or push it until Louis asks.

Current demo identity:
- Rep name: Jane
- Show/business name: Jane's Sparkle Party
- Demo rep id: 5f3fb1f9-8108-427c-8134-8e2e016f6974
- Nic-Nac workspace code: 1fa4ba02-154e-4d5b-aef2-759cb13abbfb

Skin model:
- Amethyst is the default customer-site template for every new rep.
- All customer-site skins are visual-only Amethyst appearance presets.
- Preserve Homepage, Trade Board, Join page, Nic-Nac panel behavior, SEO metadata, and real rep/customer data mapping.
- Active skins:
  - AM-01 Amethyst: amethyst, default.
  - SS-01 Sparkle Suite/Morganite: sparkle_suite_morganite, committed/pushed.
  - BD-01 Black Diamond: black_diamond, approved/local unless later committed.

Use the sparkle-suite-skin-builder skill for skin work.

Guardrails:
- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch chrome-extension/content.js.
- Do not touch supabase/functions/live-queue-sync.
- Do not attach +19044383050.
- Do not touch docs/sparkle-suite/marketing unless explicitly asked.
- Do not move Kim Goforth.
- Rep-facing assistant name is Nic-Nac.

Known unrelated dirty files may exist; ignore unless asked, but remind before launch:
- .agents/skills/sparkle-live-queue/SKILL.md
- chrome-extension/manifest.json
- dist/
- docs/sparkle-suite/lessons/
- docs/sparkle-suite/marketing/

First response after reading:
- Briefly summarize current state.
- Confirm that you will wait for Louis's next instruction.
- Do not start work automatically.
```
