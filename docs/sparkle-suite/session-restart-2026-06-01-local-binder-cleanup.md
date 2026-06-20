# Sparkle Local Binder Cleanup Handoff - 2026-06-01

## Summary

Louis is moving Sparkle work to a cloud-first workflow:

- GitHub is the main saved source.
- GitHub Codespaces is the workbench for implementation, builds, tests, commits, and pushes.
- Codex project folders on the laptop should be lightweight binders for chat organization, agent instructions, selected markdown memory, and Codespace routing.
- The laptop should stay light for business operations, meetings, browser work, and marketing work.

## Repo Map

- Sparkle Suite: `louis623/sparkle-suite`
  - Codespace path: `/workspaces/sparkle-suite`
  - Current branch: `codex/sparkle-cross-phase-hardening`
  - Old local project path: `C:\Users\louis\neon-rabbit-core`
- Sparkle Finder: `louis623/sparkle-finder`
  - Codespace path: `/workspaces/sparkle-finder`
  - Current branch: `codex-sparkle-finder-v1`
  - Local binder path: `C:\Users\louis\sparkle-suite-customer`
- Sparkle Rep Onboarding: `louis623/sparkle-rep-onboarding`
  - Codespace path: `/workspaces/sparkle-rep-onboarding`
  - Current branch: `main`
  - Local binder path: `C:\Users\louis\britt-with-bling-start-strong`

## Completed

- Sparkle Suite Codespace was created and smoke-tested as a 4-core machine.
- Sparkle Finder Codespace was created and smoke-tested as a 4-core machine.
- GitHub showed a maximum of two running Codespaces at once. Standing workflow: keep Sparkle Suite running most often; rotate Sparkle Finder and Sparkle Rep Onboarding in the second slot.
- Sparkle Finder local folder was converted into a lightweight binder.
- Sparkle Rep Onboarding local folder was converted into a lightweight binder.
- Full local repo archives were preserved under `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01`.
- Sparkle Suite full repo archive was copied intact to `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\neon-rabbit-core`.
- Sparkle Suite lightweight binder was staged at `C:\Users\louis\Sparkle-Suite-Binder-Staging\neon-rabbit-core`.

## Archive Locations

- Sparkle Finder archive:
  `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\sparkle-suite-customer`
- Sparkle Rep Onboarding archive:
  `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\britt-with-bling-start-strong`
- Sparkle Suite archive:
  `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\neon-rabbit-core`
- Archive index:
  `C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\ARCHIVE_INDEX.md`

## Sparkle Suite Live Extension Safety

Sparkle Suite contains live Chrome extension source/package history. Reps use the Chrome Web Store version, but these local files are still protected source and emergency package material:

- `chrome-extension/`
- `dist/Sparkle-Live-Queue-Party-Filters-Brittany/`
- `dist/Sparkle-Live-Queue-Party-Filters-Brittany.zip`
- `dist/sparkle-suite-live-queue-1.0.1.zip`
- `dist/START-HERE-Brittany-Sparkle-Live-Queue.txt`
- `.agents/skills/sparkle-live-queue/SKILL.md`
- `docs/sparkle-suite/lessons/2026-05-18-live-queue-web-store-release.md`

Before any live queue, Bomb Party, Chrome extension, Supabase live queue sync, or Web Store packaging work, read `.agents/skills/sparkle-live-queue/SKILL.md`.

## Pending

1. Complete Sparkle Suite binder swap from a neutral/new Codex chat.
2. Create and smoke-test Sparkle Rep Onboarding Codespace after stopping one running secondary Codespace if needed.
3. When Louis buys an external backup drive, copy `C:\Users\louis\Sparkle-Suite-Local-Archive` to it before deleting local archives.

## Fresh Neutral Session Start Prompt

```text
Continue Sparkle Suite binder swap from the local cleanup handoff.

Context:
- Do not work in local repo code. Local project folders are being converted into lightweight Codex binders.
- GitHub/Codespaces is the real workbench.
- Sparkle Suite full local repo archive exists at:
  C:\Users\louis\Sparkle-Suite-Local-Archive\2026-06-01\neon-rabbit-core
- Sparkle Suite staged binder exists at:
  C:\Users\louis\Sparkle-Suite-Binder-Staging\neon-rabbit-core
- Current local Sparkle Suite project folder to replace is:
  C:\Users\louis\neon-rabbit-core
- Sparkle Suite Codespace target:
  repo louis623/sparkle-suite
  path /workspaces/sparkle-suite
  branch codex/sparkle-cross-phase-hardening

Task:
1. Verify the archive exists and includes .git, package.json, chrome-extension/manifest.json, dist/sparkle-suite-live-queue-1.0.1.zip, .agents/skills/sparkle-live-queue/SKILL.md, and docs/sparkle-suite/lessons/2026-05-18-live-queue-web-store-release.md.
2. Verify the staged binder exists and does not include .git, node_modules, .next, app, components, lib, chrome-extension, or dist.
3. Replace C:\Users\louis\neon-rabbit-core with the staged binder.
4. Do not delete the archive.
5. Preserve live extension safety notes.
6. After the swap, verify C:\Users\louis\neon-rabbit-core is a lightweight binder with AGENTS.md, README.md, CODESPACE.md, CURRENT_WORK.md, DO_NOT_USE_LOCAL_REPO_USE_CODESPACE.md, archive-index.md, LIVE_EXTENSION_SAFETY.md, .agents/skills, selected docs, and vault.
7. Report exactly what changed and what remains pending.

Important:
- If Windows blocks moving or replacing C:\Users\louis\neon-rabbit-core, stop and explain the blocker. Do not force-delete anything unless the archive is verified and Louis explicitly approves that cleanup path.
```
