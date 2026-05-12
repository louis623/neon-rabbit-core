# Sparkle Suite Maintenance Update - 2026-05-12

## What moved

- Investigated and fixed the recurring Turbopack NFT warning from production builds.
- Tightened the old Sparkle Suite social/promo cleanup so retired public experiments are less likely to confuse future work.

## Turbopack NFT warning

- Root cause: `app/amethyst/[...asset]/route.ts` was reading locked Amethyst static exports through parent-relative `import.meta.url` file URLs.
- That worked at runtime, but Turbopack's file tracer treated the route as broad enough to trace the project root and reported `next.config.ts` in the NFT list.
- Fix: the route now keeps its allowlist, but resolves allowed files under a statically scoped `process.cwd() / public / amethyst` path.
- Added a regression test so the route does not return to parent-relative `../../../public` file tracing.

## Social asset cleanup

- `public/sparkle-suite-social/index.html` is now a retired archive page instead of an active concept menu.
- The public index now points to the approved image-first QR flyer asset:
  - `public/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png`
- Reference-only HTML experiments now include:
  - `<meta name="robots" content="noindex,nofollow" />`
- `docs/sparkle-suite/brand/09-social-asset-status.md` now includes the previously unlisted `example-one-revised-export.html` reference file.

## Bounded cleanup follow-up

- `docs/drive-import/MASTER_INDEX.md` no longer describes imported Sparkle Suite design kits as current or latest.
- Added `docs/drive-import/sparkle-suite/design/README.md` so the imported design folder is visibly retired from the folder entrypoint.
- `.chrome-headless/` is now ignored as a local browser-testing artifact, and the existing local folder was removed from the worktree.
- Added a brand-system regression check so future orientation docs must keep retired imported design kits pointed back to the production-site design kit and social asset status doc.

## Why this matters

- Production builds no longer emit the Turbopack NFT warning.
- Old public social experiments are still preserved for audit/reference, but the public entrypoint no longer promotes them as usable assets.
- The approved QR flyer asset remains the only current public-facing flyer source of truth.
- Future agents are less likely to mistake imported design-kit history for the approved public Sparkle Suite visual source.

## Verification

- Focused Amethyst route test passed:
  - `tests/amethyst-static-assets-route.test.ts`
- Sparkle Suite brand-system test passed:
  - `tests/sparkle-suite-master-brand-system.test.ts`
- Broader regression passed:
  - `tests/amethyst-static-assets-route.test.ts`
  - `tests/prelaunch`
  - `tests/sparkle-suite-master-brand-system.test.ts`
- TypeScript passed:
  - `npx tsc --noEmit --pretty false`
- Production build passed with no Turbopack NFT warning:
  - `npm run build`

## Still true

- Do not treat the old code-based flyer experiments as approved final brand assets.
- Do not claim SMS is live until the Telnyx campaign is approved, `+19044383050` is attached, and a real handset smoke test succeeds.
