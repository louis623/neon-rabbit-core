# Sparkle Suite + Sparkle Finder merge discovery prompt

Copy and paste the prompt below into a new Codex session. This is a discovery
and readiness session only. It does not authorize implementation.

```text
SITUATION: Sparkle Suite and Sparkle Finder completed their August 25 compatibility upgrades and are independently deployed, verified, and stable.
CURRENT STATE: Suite is the canonical source of truth; Finder Releases 1–4 consume the live Suite v2 contracts. Both active branches are pushed, and Finder's final working tree is clean.
YOUR TASK: Perform read-only due diligence for a possible consolidation of Sparkle Finder into the Sparkle Suite repository, prepare an evidence-backed readiness brief, then stop and wait for my instruction. Do not begin the merge.

Start from the Sparkle Suite workspace:

C:\Users\louis\sparkle-suite-repo

The second active repository is:

C:\Users\louis\sparkle-finder-repo

Before doing anything else:

1. Read each repository's complete AGENTS.md and obey its branch, dirty-file, production, deployment, account, and safety rules.
2. In each repo, confirm the absolute path, remote, active/allowlisted branch, exact HEAD, upstream relationship, and git status. Treat every dirty or untracked file as user work. Do not revert, delete, move, stage, or overwrite it.
3. Read the four current vault memory files in both repos: vault/project-state.md, vault/session-log.md, vault/decisions.md, and vault/open-items.md.
4. Search Open Brain for the most recent captures matching "Sparkle Suite Sparkle Finder compatibility August 25 2026", "Suite Finder source of truth merger due diligence", and "ACTIVE TASK merger due diligence repository inspection".
5. Read these compatibility/release records completely:
   - C:\Users\louis\sparkle-suite-repo\docs\sparkle-suite\operations\2026-08-25-finder-compatibility-release.md
   - C:\Users\louis\sparkle-suite-repo\docs\sparkle-suite\operations\2026-08-25-suite-finder-merge-discovery-prompt.md
   - C:\Users\louis\sparkle-finder-repo\docs\handoffs\2026-08-25-suite-finder-compatibility-prerequisites.md
   - C:\Users\louis\sparkle-finder-repo\docs\plans\2026-08-25-suite-dance-floor-compatibility-plan.md

Verified baseline to reconcile against current repo evidence:

- Sparkle Suite repo: louis623/sparkle-suite
- Suite branch: codex/nic-nac-trade-hardening
- Suite deployed application commit: f3de6c15715049d7db5f913af5a5f9e02a7f23d4
- Suite release documentation baseline: 1884a23ee8316334553e79bbd98eea9985d01fa2, followed by this documentation-only closeout
- Suite production deployment: dpl_H4TuzixGEezkUFE2pnaVc5MVxzb5
- Suite production domains: https://www.yoursparklesuite.com and https://yoursparklesuite.com
- Suite migrations added: 20260825017000, 20260825018000, 20260825019000
- Suite's only known local leftovers at closeout were pre-existing untracked artifacts/ and test-results/.
- Sparkle Finder branch: codex-sparkle-finder-v1
- Finder final compatibility tip: 8192b11f1535e8cbc0af2c4df352ea93c0e86233
- Finder production deployment: dpl_GKS4RzyHxnpchfYsypE3q3UT67DR
- Finder production domain: https://yoursparklefinder.com
- Finder Releases 1–4 are complete. Final verification passed lint, build, 57 Vitest files/760 tests, the live strict Suite contract gate, 20 required browser checks with 2 expected optional skips, the Nic-Nac guard, custom-domain HTTP 200, and an empty recent runtime-error scan.
- A positive signed-in production Showcase Studio mutation/replay remains intentionally deferred until Louis designates a demo account, demo data, and cleanup procedure.

Product decisions you must preserve:

- Sparkle Suite is the source, truth, and "Bible" for exact jewelry design IDs and variants, legacy/RBP item numbers, reps, shows, Dance Floor listing identity, pending reservations, and physical dancer quantity.
- Sparkle Finder is the customer-facing twin and reacts to Suite facts. Reps and customers should receive the same underlying truth even when the two interfaces expose different permitted actions.
- Finder owns Finder-specific customer discovery, collections, Showcase/profile/social state, and presentation. It must not independently recalculate or override Suite-owned facts.
- The compatibility contracts are additive and versioned. Preserve Suite v1 interfaces until a separately approved removal after all consumers migrate.
- Finder photo information is untrusted evidence. Temporary Finder URLs must never become canonical Suite photos.
- Do not assume that putting both products in one repository means combining their runtime apps, authentication, Supabase projects, secrets, domains, or deployment lifecycles. Those boundaries remain separate unless I explicitly approve changing them.

Perform a thorough read-only audit. You may use read-only subagents in parallel. Inspect at least:

- top-level repository layouts and package managers;
- Next.js/React/TypeScript versions and configuration;
- package.json scripts, lockfiles, aliases, generated assets, and build outputs;
- Vercel project links, vercel.json rules, domains, production branches, environment-variable names, cron/jobs, and manual/automatic deployment policy;
- Supabase project boundaries, migration histories, schemas, RLS/grants, generated types, storage, auth, and service-role usage;
- Suite/Finder API and shared-contract boundaries, including the strict checker;
- authentication/session models and Secret Rep ID linking;
- Nic-Nac implementations, model policy, tools, telemetry, memory, and product-context boundaries;
- customer-facing shared brand/assets versus product-specific UX;
- tests, smoke scripts, skills, AGENTS instructions, vault memory, plans, handoffs, and release procedures;
- duplicate filenames/path aliases/config names that would collide in one repo;
- Git history/provenance implications, GitHub/Vercel links, and safe ways to preserve both histories;
- options such as a true monorepo with apps/suite and apps/finder plus shared packages, a subtree/subdirectory import, or keeping separate repos with a shared contract package.

Your output should be a plain-English merger readiness brief containing:

1. A map of what each product and repository currently owns.
2. What is genuinely shared, what only looks similar, and what must remain separate.
3. Two or three viable repository strategies with benefits, costs, and risks.
4. Your recommendation for whether Sparkle Suite should become the containing monorepo and why.
5. A collision/risk register covering code paths, package/config conflicts, auth, databases, secrets, deployments, domains, migrations, Git history, tests, and rollback.
6. A proposed target directory layout and ownership rules, clearly labeled as a proposal only.
7. A phased implementation plan with preconditions, checkpoints, test gates, deployment sequencing, rollback strategy, and an explicit definition of done.
8. A list of decisions that require my approval before implementation.
9. Any unresolved facts that could not be discovered locally.
10. A final readiness statement.

Hard stop rules for this session:

- Do not copy, move, rename, delete, or edit application files.
- Do not initialize a monorepo, add workspaces, change package files, or rewrite imports.
- Do not create migrations or touch either production database.
- Do not change Vercel projects, GitHub settings, branches, remotes, aliases, domains, auth, environment variables, or secrets.
- Do not commit, push, deploy, open a PR, or create arbitrary production data.
- Do not use my personal account or a real customer account for testing.
- Do not start any merger phase, even if the correct path seems obvious.
- Keep the due-diligence work read-only and report in chat only unless I separately ask for a file.

Once the audit and readiness brief are complete, stop and say that you are ready for my instruction. Do not continue automatically into implementation.
```
