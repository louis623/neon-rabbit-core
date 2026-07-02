# Team Management Public Cards and Reviewer-Smoke Lesson

**Date:** July 2, 2026

**Affected area:** Sparkle Suite Team Management, Britt With Bling Start Strong onboarding, public Join Team cards, reviewer-smoke sessions, entitlement-backed paid add-ons, and stable demo verification.

## Decision

Team Management has two separate jobs:

1. Private Start Strong onboarding links for new reps.
2. Public Join Team cards shown on the customer-facing site.

Those should stay separate. Creating an onboarding link should not automatically publish a public team member card.

Public cards are managed from the Team Management workspace through the Public Team Cards panel. The panel uses the existing `join_team_members` data path and `/api/nic-nac/join-team-roster` API so it edits the same public roster the customer site reads.

## What Changed

- Added a dashboard Public Team Cards manager for Team Management.
- Let reps add, edit, hide/show, reorder, and remove public Join Team cards.
- Supported first name, show name, profile photo URL, TikTok, Facebook, Instagram, website, YouTube, and visible-on-Join-page state.
- Preserved imported fields not exposed in the simple beta UI, including city/state, initials, photo alt/class, bio, and sort order.
- Required full `http` or `https` links for public social/website URLs.
- Kept onboarding progress/messages isolated from public card publishing.
- Updated reviewer-smoke dashboard sessions to seed Team Management `manual_beta` access, so stable-demo logged-in UI checks can verify the unlocked paid-add-on workspace.
- Verified Brittany's `brittwithbling` demo/live-transition account is `active` with Team Management `manual_beta` access.

## Lessons

### Paid-Add-On Reviewer-Smoke Needs Entitlements

A dashboard-unlocked reviewer-smoke subscription does not prove every paid add-on is unlocked. If the UI under review is entitlement-gated, the reviewer-smoke reset must seed that entitlement too.

For Team Management, reviewer-smoke now upserts `team_management_entitlements` with `manual_beta` for the synthetic reviewer account.

### Smoke The Real UI Label

The stable-demo reviewer-smoke initially failed because the assertion expected an invented button label. The actual Public Team Cards action is `Save to Join Team page`.

Smoke tests should assert user-facing labels that exist in the product, not labels from an implementation plan.

### Private Onboarding Is Not Public Publishing

Team leads may create onboarding links for reps who should not yet appear publicly. Public Join Team cards need an explicit publish/edit path with a visible toggle.

This keeps Brittany's workflow safe: she can onboard someone privately, then publish a customer-facing card when ready.

### Preserve Migrated Rich Content

The beta UI intentionally exposes only simple card fields. When editing migrated cards, preserve richer fields such as bio, initials, city/state, image class, alt text, and sort order so a simple dashboard edit does not destroy imported site quality.

### Verify The Real Beta Account

For accounts that will later become live customer accounts, verify the actual linked Supabase rows. Do not assume data was seeded because a migration contains an insert.

For Brittany, linked DB verification confirmed:

- `public_site_slug='brittwithbling'`
- rep status `active`
- `team_management_entitlements.status='manual_beta'`
- `team_management_entitlements.source='manual_beta'`

### Do Not Create Fake Rep Accounts For Beta Proof

The Team Management beta should not create fake Sparkle Suite rep accounts. The first true beta smoke should create one real/test-by-Louis onboarding participant link, exercise the Start Strong invite, verify progress/messages in Brittany's workspace, then archive the invite.

## Related Checkpoints

- `1b36629 feat: add team onboarding management beta`
- `78d6e26 feat: add team public card manager`
- `74ca64b test: unlock team management reviewer smoke`
- `94b0dac docs: record team management reviewer smoke`
- Stable demo: `https://sparkle-suite-demo.vercel.app`
- Deployment: `dpl_27LM7EksMdpb2jGogaEMw7yUDc7K`
