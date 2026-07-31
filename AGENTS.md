<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sparkle Suite Workspace

This repo is the active Sparkle Suite workspace and now contains both the code
and the former Codex binder/Open Brain files. Start future Codex desktop
sessions from this repo as the writable workspace:

`C:\Users\louis\sparkle-suite-repo`

Before doing Sparkle Suite work, read the current project memory from this repo:

- `vault\project-state.md`
- `vault\session-log.md`
- `vault\decisions.md`
- `vault\open-items.md`

Project skills live in this repo at `.agents\skills`. Use them when their
trigger rules apply, especially:

- `sparkle-suite-existing-site-migration`
- `sparkle-suite-demo-smoke`
- `sparkle-nic-nac-agent-architecture`
- `sparkle-live-queue`

Use this repo for implementation, builds, tests, commits, pushes, deploys,
Supabase migrations, smoke tests, notes, memory, plans, handoffs, and skills.
The old `C:\Users\louis\sparkle-suite` folder is retained only as a redirect
and historical archive; do not depend on it for active instructions.

## Task Creation Source Gate (Before Any Agent Starts)

This rule applies **before a Sparkle Suite coding task is created**, not at
commit or deployment time. The primary coordinator must never create a task
with an implicit/default starting branch and must never hand an agent an
existing Codex worktree.

The current approved task baseline is
`codex/nic-nac-trade-hardening` at `799b4faa`. Every new Sparkle Suite coding
task must be created with an explicit branch starting state pointing to that
approved baseline (or to the later baseline explicitly recorded in project
memory). Do not use `main`, `working-tree`, a detached commit, or a pre-existing
worktree unless Louis explicitly approves that exact exception.

Before creating a task, the coordinator must verify the chosen branch and SHA
in the primary active repo. If the approved source cannot be identified with
certainty, do not create the task. Ask or audit first. A newly created worktree
may be used only after it is confirmed to descend from that approved source.

## Default Release Rule

Every approved Sparkle Suite code or content change includes committing the
legitimate session changes, pushing the current branch, deploying the exact
branch tip to Vercel, promoting `https://sparkle-suite-demo.vercel.app/` to that
deployment, and verifying the stable review URL. Louis does not need to request
commit, push, or deploy separately each time. Skip any release step only when
Louis explicitly says the work is local-only, should not be committed, should
not be pushed, or should not be deployed.

Do not touch Chrome Web Store settings or local Sparkle Suite Chrome extension
code. Treat live queue extension files as protected live-show material. Read
`LIVE_EXTENSION_SAFETY.md` before any live extension discussion or handoff.

For Sparkle Suite demo verification, Vercel alias checks, logged-in workspace
smoke tests, required setup checks, Help & Resources checks, or Nic-Nac UI
checks, use `sparkle-suite-demo-smoke` when available. Prefer the stable demo
URL `https://sparkle-suite-demo.vercel.app` and Chrome reviewer-smoke sessions
instead of Louis's personal account.

For Sparkle Suite demo deploys, the expected review/deploy target is the stable
alias `https://sparkle-suite-demo.vercel.app/`. A raw Vercel preview URL is not
enough for Louis to review unless he explicitly asks for a one-off preview.
After creating a Vercel preview, move/confirm the stable demo alias points to
the intended deployment before telling Louis the work is deployed.

Treat `https://sparkle-suite-demo.vercel.app/` as Louis's canonical Sparkle
Suite review target. Do not split explanations between "production" and "demo"
when reporting ordinary Sparkle Suite work unless Louis explicitly asks about a
custom-domain cutover or separate environment. If Louis says something is still
wrong, verify the exact URL he has open, preferably through the Chrome connector,
before claiming the fix is live.

## Release Source Safety Gate (Non-Negotiable)

Only the current upgraded demo line may release to the stable demo. The current
approved release baseline is `codex/nic-nac-trade-hardening` at `799b4faa`.
Do not substitute `main`, a detached commit, an old worktree, or a raw Vercel
deployment as a release source.

Before **any** Sparkle Suite commit that will be pushed, any push, Vercel
deployment, alias promotion, rollback, or release verification, the agent must
record and satisfy every item below:

1. Run `git fetch origin` and identify the current approved release branch and
   commit from project memory. If it has changed since this rule was written,
   update this section or the project release record first; never guess.
2. Confirm `git status`, `git branch --show-current`, and `git rev-parse HEAD`.
   A detached HEAD is never releasable.
3. Confirm the checkout is not under `C:\\Users\\louis\\.codex\\worktrees\\`.
   Codex worktrees are isolated task scratch copies and may be used for local
   investigation only; they may never push, deploy, promote, or change an alias.
4. Prove the proposed release tip descends from the approved baseline with
   `git merge-base --is-ancestor <approved-baseline> HEAD`. If it does not,
   stop and report the mismatch.
5. Before changing a Vercel alias, verify the deployment's commit SHA, branch,
   project, and representative workspace route. A READY build alone is not
   approval to promote it.
6. After release, verify the canonical stable demo URL serves the expected
   workspace/login route—not the prelaunch site, a standalone prototype, or an
   unrelated app—and report the commit plus deployment URL.

No subagent may push, deploy, promote, rollback, or alter a Vercel alias.
Subagents may prepare a commit and report its SHA only. The primary coordinator
must run the gate above and perform the release itself. If a task was created
from an unapproved base or stale worktree, abandon that release path and rebuild
from the approved baseline.

## Customer-Facing Flow Definition of Done

Any customer-facing Sparkle Suite workflow is not ready for Louis review until
it has a reviewer smoke path.

Required for signup, checkout, onboarding, customer-site, Nic-Nac, Live queue,
Trade board, email, SMS, and dashboard workflows:

- A Vercel preview URL or explicit local URL.
- Safe reviewer/test data so Louis does not need to use personal information.
- No live charges and no live customer/provider side effects.
- A reset or reseed path for repeated testing.
- Clear visual labeling when review/test mode is active.
- Documented click-through steps from the first page to the final expected
  state.
- Tests proving review mode is disabled in production.

If a reviewer smoke path cannot be provided, state the exact blocker before
calling the work ready.
