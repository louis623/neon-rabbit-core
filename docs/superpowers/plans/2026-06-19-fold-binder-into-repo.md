# Fold Sparkle Suite Binder Into Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `C:\Users\louis\sparkle-suite-repo` the single Sparkle Suite workspace containing code, memory, handoffs, plans, docs, and project skills.

**Architecture:** The former split binder remains on disk as a redirect/archive, but active instructions and memory live inside the implementation repo. Future Codex sessions should open the repo as the writable workspace so implementation files and binder memory share one sandbox boundary.

**Tech Stack:** Markdown repo docs, Codex `AGENTS.md`, local `.agents\skills`, Git.

---

### Task 1: Move Durable Binder Content Into Repo

**Files:**
- Copy: `C:\Users\louis\sparkle-suite\vault` to `C:\Users\louis\sparkle-suite-repo\vault`
- Copy: `C:\Users\louis\sparkle-suite\docs\sparkle-suite` to `C:\Users\louis\sparkle-suite-repo\docs\sparkle-suite`
- Copy: `C:\Users\louis\sparkle-suite\docs\superpowers` to `C:\Users\louis\sparkle-suite-repo\docs\superpowers`
- Copy: `C:\Users\louis\sparkle-suite\.agents\skills` to `C:\Users\louis\sparkle-suite-repo\.agents\skills`
- Copy: selected root Markdown archive files to `C:\Users\louis\sparkle-suite-repo\docs\binder-archive\legacy-root`

- [x] **Step 1: Confirm the repo is clean before copying**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo status --short --branch
```

Expected: branch is clean and synced before binder housekeeping begins.

- [x] **Step 2: Copy durable binder content**

Run a mechanical copy of `vault`, `docs\sparkle-suite`, `docs\superpowers`, and `.agents\skills` from the old binder into the repo. Exclude temp screenshots/logs from active repo roots.

### Task 2: Update Instructions

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\AGENTS.md`
- Modify: `C:\Users\louis\sparkle-suite\AGENTS.md`

- [x] **Step 1: Make repo instructions self-contained**

Replace the old bridge instructions with repo-local memory paths:

```text
vault\project-state.md
vault\session-log.md
vault\decisions.md
vault\open-items.md
```

- [x] **Step 2: Turn old binder into redirect**

Replace the old binder instructions with a clear note that active Sparkle Suite work now starts in:

```text
C:\Users\louis\sparkle-suite-repo
```

### Task 3: Verify And Commit

**Files:**
- Verify: `C:\Users\louis\sparkle-suite-repo\vault`
- Verify: `C:\Users\louis\sparkle-suite-repo\.agents\skills`
- Verify: `C:\Users\louis\sparkle-suite-repo\docs\sparkle-suite`

- [ ] **Step 1: Verify expected skills exist in repo**

Run:

```powershell
Get-ChildItem C:\Users\louis\sparkle-suite-repo\.agents\skills -Directory | Select-Object -ExpandProperty Name
```

Expected: includes `sparkle-suite-existing-site-migration`, `sparkle-suite-demo-smoke`, and `sparkle-nic-nac-agent-architecture`.

- [ ] **Step 2: Verify old binder redirects**

Run:

```powershell
Get-Content C:\Users\louis\sparkle-suite\AGENTS.md
```

Expected: points to `C:\Users\louis\sparkle-suite-repo`.

- [ ] **Step 3: Commit and push**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add AGENTS.md LIVE_EXTENSION_SAFETY.md vault docs .agents
git -C C:\Users\louis\sparkle-suite-repo commit -m "chore: fold binder into Sparkle Suite repo"
git -C C:\Users\louis\sparkle-suite-repo push origin codex/sparkle-cross-phase-hardening
```

Expected: branch is clean and synced after push.

