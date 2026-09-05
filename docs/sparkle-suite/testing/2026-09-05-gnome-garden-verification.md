# Enchanted Gnome Garden verification — September 5, 2026

This records completed local checks of the working changes on
`codex/nic-nac-trade-hardening` in `C:\Users\louis\sparkle-suite-repo`, based on
HEAD `ee73fdfc77fa8a068170ef65d6407a2fad737349`. It does not claim a production
release, customer activation, or completed browser visual acceptance.

## Registry, persistence, and boundary checks

- Four new registry/data tests failed before implementation and passed after:
  canonical ID, browse code/full-name/short-name aliases, actual Homepage/Trade/
  Join template-builder parity, content/flow preservation, and additive SQL.
- The combined registry, appearance, semantic contrast, Settings, Nic-Nac, and
  rendered look-picker tests passed **68/68 across 6 files**.
- Settings saves canonical `gnome_garden`; Nic-Nac accepts `gnome_garden`,
  `GG-01`, `Enchanted Gnome Garden`, and `Gnome Garden`. Tests assert a single
  appearance-only update scoped to the requesting `rep_id`.
- The separate preview link opens a new tab with `noopener noreferrer` and
  no prefetch. It stays available when the Apply action is disabled.
- The expanded shared TypeScript union exposed the exhaustive Finder token
  mapping. The compatibility mapping was added, while an explicit Finder list
  preserves its existing 11 choices and Amethyst default. UI, API, and service
  tests prove the Suite-only gnome skin is neither offered nor saved in Finder:
  **9/9 tests across 2 files**. No Finder database change was made.

## Runtime and regression checks

- `npm run build:amethyst:join` passed after final JSX sprite-path changes.
  Generated `public/amethyst/join-runtime.js`: **258,309 bytes** (252.3 KB as
  displayed by esbuild). The source uses the approved `lantern.webp` and
  `gnome.webp` assets.
- Added direct route tests for `gnome-garden.css` and all five allowlisted WebP
  assets, including nested paths. They verify HTTP 200, correct media type,
  nonempty contents, and WebP RIFF/WEBP headers. Four unapproved/traversal path
  cases return 404. The asset/Finder subset passed **28/28** before the later
  two additional Finder-boundary cases.
- Expanded focused run: **353 passed, 1 failed, 354 total across 38 files**.
  Scope: Amethyst tests, gnome runtime/preview, look picker, contrast, customer
  brand assets, custom-domain routes, public-slug route, Settings, Nic-Nac
  customization/API, and customer-site SEO/crawl.
- The only focused failure is the unchanged
  `tests/seo/amethyst-public-metadata.test.ts` custom-origin expectation. The
  fixture expects `dance floor listings`; the current metadata uses
  `Dance Floor dancers`. Both strings were independently confirmed in HEAD
  versions of the test and `lib/seo/amethyst-public-metadata.ts`. Neither was
  rewritten to obtain a passing result.
- `npm test`: **237/237 passed across 14 files**.
- `AMETHYST_DEV_PORT=3012 npm run qa:amethyst`: **90/90 passed across 3 files**;
  local `/amethyst/Homepage.html` and `/amethyst/Trade.html` both returned 200.
  An initial sandbox `spawn EPERM` startup failure was retried with approved
  escalation. This command did not include production links.
- `git diff --check` passed at the consolidated-check point.

## TypeScript and lint limitations

`npx tsc --noEmit --pretty false` does **not** pass repository-wide. After the
new exhaustive-map error was corrected, the run reported **146 diagnostics in
41 files**:

- **139** diagnostics in existing test fixtures (widened mock types, readonly
  fixture mismatches, ES target regex flags, stale properties/imports).
- **6** existing Stripe API-version type mismatches: the source pins
  `2026-03-25.dahlia`, while the installed Stripe types require
  `2026-08-26.dahlia`. These occur in `lib/stripe/client.ts` and the five existing
  Stripe preparation/smoke scripts. Read-only dependency inspection confirmed
  installed Stripe **22.6.1**, while the unchanged lockfile pins **22.0.1**;
  this local dependency drift should be resolved from the lockfile before
  changing any production Stripe API version.
- **1** stale generated `.next/types/validator.ts` reference to the removed
  non-final email-signature route. Fresh production generation must resolve
  generated route types before release.

No gnome registry, preview, look-picker, asset-route, or Finder-boundary file
appeared in the final diagnostic list. This is a scoped observation, not a
claim that the full compiler gate passed.

Targeted ESLint passed the new look-picker link, its rendered tests, and skin
card registry. Broader changed-file checks reported only existing issues:
empty interfaces at `lib/services/types.ts:496` and `:514`, the unused template
normalizer parameter, and the pre-existing plain accounting anchor at
`FinderAppearanceControlCenter.tsx:47`. No unrelated lint fixes were made.

## Migration preflight (read-only)

- Supabase CLI: **2.84.2**; linked project: `bqhzfkgkjyuhlsozpylf`.
- `supabase db push --dry-run` succeeded and listed only
  `20260905090000_add_gnome_garden_appearance_preset.sql`.
- `supabase migration list` showed that same migration pending; existing
  history was aligned.
- The transaction expands only the Suite `site_settings` appearance check.
  It preserves database-only `pearl`, `luxe`, and `ocean_sapphire` values and
  does not update customer selections or defaults. No migration was applied
  during these checks.

## Browser visual and interaction checks (local)

The installed Codex browser runtime was loaded and its exact Chrome Control
Center target claimed/read before browser work. Visual testing used only the
in-app browser and fixture preview at `http://localhost:3012/skin-preview/gnome_garden/`.
No signed-in personal/customer session was used.

- Inspected Home, Dance Floor, Join, and Preferences with sample content;
  reviewed phone widths 360/390, tablet 1024, and desktop 1440.
- Replaced the initial mismatched illustration with artwork adapted from the
  approved second flyer. Confirmed genuine alpha for gnome/lantern sprites.
- Fixed the event-note accent colliding with text, pale Watch button contrast,
  request form field colors, mobile explainer-card min-content overflow, hero
  centering, and the preview shell's wrapped-header double scrollbar.
- Final Home body width equaled scroll width at 360 (345 CSS pixels after
  scrollbar) and 1440 (1425 CSS pixels). Screenshots showed balanced title,
  art, buttons, and sample show descriptions with no covered copy.
- Dance Floor filtering and sample detail/request dialogs worked. Filling
  synthetic Alex Sample text and clicking Submit displayed: `This is a sample
  preview. Nothing is submitted or sent.` Upload control was disabled.
- Pause changed both lantern and glow computed animation-play-state to
  `paused`; Resume restored `running`. Reduced-motion CSS and indexed
  firefly/mobile limits are automated-contract tested; OS-level reduced-motion
  emulation was not available in this browser API and is not claimed.
- Readability token checks: card primary 13.62:1, muted 6.13:1, accent 8.44:1;
  button cream text against brighter gradient stop 6.84:1. These are solid
  token contrast checks, not an automated pixel contrast claim over artwork.

Final build results, exact release provenance, and live-domain verification
are recorded below only once completed.

## Final local gate and migration

- Final `npm run build` passed after all source edits (compile, production
  TypeScript, 32 static pages). Generated server output includes the corrected
  flex-height preview shell. Final Join bundle is 258,612 bytes.
- Final focused safety/runtime/contrast/assets/Join/form set: 70/70 passed.
  Runtime agent's expanded template/runtime/registry suite: 120/120 passed.
- Restored installed Stripe to lockfile version 22.0.1 without changing the
  package manifest or lockfile. Fresh generation removed the stale signature
  route type. Final standalone `tsc` retains 139 existing test-fixture
  diagnostics only; no non-test diagnostics remain. This supersedes the
  earlier 146-diagnostic checkpoint above, not the underlying baseline issues.
- Repeated migration dry-run listed only the new additive constraint migration;
  `supabase db push --yes` successfully applied `20260905090000`. It did not
  change customer appearance selections or defaults.
