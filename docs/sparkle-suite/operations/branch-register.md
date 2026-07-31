# Sparkle Suite Branch Register

**Reviewed:** July 31, 2026

**Repository:** `louis623/sparkle-suite`

**Primary workbench:** `C:\Users\louis\sparkle-suite-repo`

Current external controls:

- GitHub default branch:
  `codex/nic-nac-trade-hardening` (corrected July 31)
- Local `origin/HEAD`:
  `origin/codex/nic-nac-trade-hardening`
- Vercel production branch:
  `codex/nic-nac-trade-hardening` (verified through the authenticated project
  API; no Vercel change was required)
- GitHub quarantine ruleset:
  fully configured for all branches except the active branch; creation is
  pending GitHub identity verification by email

## Active Branch Allowlist

Only the following branch is approved for ordinary Sparkle Suite development,
commits, pushes, builds, deployments, alias changes, migrations, or production
data work:

- `codex/nic-nac-trade-hardening`

Every other branch is read-only until Louis explicitly approves a status
change. Do not infer approval from branch age, name, an old task, a worktree, or
session history.

The machine-readable source is `config/active-branches.json`. The build and
local Git push guard is `scripts/check-active-branch.mjs`.

## Evidence Used

A branch is classified from all of the following:

1. the exact commit/deployment serving the live domain;
2. Git ancestry and branch-only commits;
3. current Open Brain/vault decisions;
4. attached worktree state, including uncommitted files; and
5. explicit Louis approval.

Age and naming are not sufficient evidence. A branch with unique commits or
uncommitted work is quarantined, not deleted.

## Branch Classification

The comparison column is relative to the active branch at safety checkpoint
`483e70a75a9057f101e9dbef55f07a23f85b501d`.

| Branch/ref | Tip | Comparison | Status | Required treatment |
|---|---:|---|---|---|
| `codex/nic-nac-trade-hardening` | `483e70a` | Active line; contains verified live app commit `af7cef25` | **ACTIVE** | Only approved work/release branch |
| `main` | `00f8f4c7` | Active has 483 unique commits; main has 20 unique commits | **QUARANTINED — LEGACY DEFAULT** | Do not use; audit unique team-onboarding history before eventual trunk replacement |
| `codex/sparkle-cross-phase-hardening` | `8da7dc11` | Zero branch-only commits; fully contained in active | **ARCHIVE-SAFE** | Preserve tag; no new work |
| `codex/sparkle-phase-8-prelaunch` | `4b2ea01b` | Zero branch-only commits; fully contained in active | **ARCHIVE-SAFE** | Preserve tag; no new work |
| `codex/sparkle-phase-9-seo-geo` | `9b6983cf` | Zero branch-only commits; fully contained in active | **ARCHIVE-SAFE** | Preserve tag; no new work |
| `codex/incident-archive-2026-07-31-main` | `659f4ef8` | Active has 483 unique commits; branch has 22 unique commits | **QUARANTINED — DIVERGENT** | No new work; review only |
| local `codex/workspace-header-logout` | `659f4ef8` | Same tip as incident-main; attached clean worktree | **QUARANTINED — DIVERGENT** | No new work; do not remove worktree until reviewed |
| `codex/incident-archive-2026-07-31-approved-line` | `0fda2b47` | Two branch-only commits (`621708b1`, `0fda2b47`) | **NEEDS REVIEW** | Audit guard/Collection Intake changes against active line |
| local `codex/collection-intake-tools-entry` | `90dda81f` | One branch-only Collection Intake commit | **NEEDS REVIEW** | Compare with `0fda2b47`; merge only after approval and verification |

## Worktree Register

| Worktree | Ref | State | Treatment |
|---|---|---|---|
| `C:\Users\louis\sparkle-suite-repo` | active branch | Only generated `artifacts/` and `test-results/` untracked before this safety change | Primary workbench |
| `.codex\worktrees\2f19\sparkle-suite-repo` | `codex/workspace-header-logout` | Clean | Quarantined; preserve |
| `.codex\worktrees\5d26\sparkle-suite-repo` | detached `799b4faa` | Generated artifacts/test output untracked | Preserve until task audit |
| `.codex\worktrees\6977\sparkle-suite-repo` | `codex/collection-intake-tools-entry` | Clean | Needs review; preserve |
| `.codex\worktrees\c385\sparkle-suite-repo` | detached legacy `main` | Untracked `app/demos/` and `tests/collection-intake-demo.test.ts` | Backed up separately; preserve and review |
| `.codex\worktrees\d674\sparkle-suite-repo` | detached legacy `main` | Clean | Quarantined; preserve |

## Preservation Checkpoints

Annotated GitHub tags:

- `safety/2026-07-31/live-app-af7cef25`
- `safety/2026-07-31/active-line-483e70a`
- `archive/2026-07-31/legacy-main`
- `archive/2026-07-31/incident-main-and-workspace-header`
- `archive/2026-07-31/incident-approved-line`
- `archive/2026-07-31/collection-intake-local`
- `archive/2026-07-31/sparkle-cross-phase-hardening`
- `archive/2026-07-31/sparkle-phase-8-prelaunch`
- `archive/2026-07-31/sparkle-phase-9-seo-geo`

Local recovery artifacts, intentionally ignored by Git:

- `.local\git-backups\2026-07-31-branch-containment\sparkle-suite-all-refs.bundle`
  - SHA-256:
    `4D7AE5D3159AC8A394D727B9A1861ADA891DEFDA8E620DAE5553D23915D0A37D`
- `.local\git-backups\2026-07-31-branch-containment\c385-uncommitted-demo-files.zip`
  - SHA-256:
    `7DB93847424E6E9B84E993908AC1B07B578C1DD48E247BCCD842837391D0CF70`

The Git bundle was verified as complete. No branch or worktree was deleted,
renamed, reset, or rewritten during containment.

## Branch Lifecycle Going Forward

1. New work starts from the active allowlisted branch only.
2. A new branch becomes active only after Louis explicitly approves it and the
   branch register, machine allowlist, GitHub default, and Vercel production
   branch are updated together.
3. When work returns to the active line, the superseded branch is immediately
   classified:
   - **archive-safe** only if it has zero branch-only commits and no dirty
     worktree;
   - **needs review** if it has unique commits;
   - **quarantined** if its provenance or intent is uncertain.
4. Before deleting any branch pointer, create and verify a preservation tag and
   full-ref backup.
5. Branch deletion remains a separate, explicit Louis-approved action.
