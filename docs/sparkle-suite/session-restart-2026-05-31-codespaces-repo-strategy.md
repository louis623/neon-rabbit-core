# Sparkle Suite Codespaces And Repo Strategy Handoff - 2026-05-31

## Situation

Louis wants to keep using large `/goal` batch work instead of managing many small stops and starts. The issue is not that the work should become smaller; the issue is that the older Windows laptop is being asked to run too many heavy local repo workflows at once.

The new direction is to move heavy build/test/dev-server work into GitHub Codespaces or equivalent cloud workspaces, while keeping Louis's laptop as the control panel and review surface.

## Plain-English Operating Model

- Laptop: screen, keyboard, review surface, and light local edits when needed.
- GitHub: code vault and handoff point between machines/agents.
- Codespaces: cloud computers that run heavy installs, builds, tests, and dev servers.
- Vercel: deployed website/app host that builds from GitHub.
- Supabase: hosted app data, auth, storage, and database layer.
- Codex/agents: batch workers supervised through clear goals, checkpoints, and smoke tests.

## Safety Rule

Commit does not mean GitHub.

- Changed but uncommitted: only on the current machine; highest risk.
- Committed but not pushed: saved on that machine only.
- Pushed to GitHub: backed up and available to another machine/Codespace.
- Deployed to Vercel: live site runs on Vercel servers, not Louis's laptop.

At the end of every serious session, the agent should commit meaningful work, push it to GitHub, and report what remains uncommitted.

## Batch Work Rule

Big batches are preferred. Multiple big local batches on Louis's laptop are not.

Desired workflow:

1. Louis starts a large goal for one repo.
2. Agent works the batch in the appropriate workspace.
3. Agent makes meaningful checkpoint commits and pushes them.
4. Agent runs light checks during the batch and heavier smoke/build checks near the end.
5. Agent brings Louis smoke-test-ready output or a real blocker.

Once Codespaces is ready, separate heavy repos may run in separate cloud workspaces instead of competing on the laptop.

## Repo Family

| Product/Area | Current name | Target repo name | Purpose |
|--------------|--------------|------------------|---------|
| Sparkle Suite | `neon-rabbit-core` | `sparkle-suite` | Main rep-side platform, workspace, public site, and product logic. |
| Sparkle Finder | `sparkle-suite-customer` | `sparkle-finder` | Customer/collector hub for the Sparkle Suite ecosystem. |
| Sparkle Marketing | `sparkle-suite-marketing` | `sparkle-marketing` | Marketing work for Suite and Finder: campaigns, video plans, content, assets, launch material. |
| Sparkle Rep Onboarding | `britt-with-bling-start-strong` | `sparkle-rep-onboarding` | Rep setup/access/resource launchpad. This is onboarding, not replacement training for Bomb Party University. |

## Sparkle Finder Definition

Sparkle Finder is the customer/collector side of the Sparkle Suite ecosystem. It is intended to support rep discovery, a master live calendar, aggregated trade/dance floor browsing, jewelry search, Diamonds & Unicorns library concepts, traffic paths back to rep sites and shows, customer profiles/collections, and possible Silver/Nic-Nac Collector Assist features.

## Next Steps

1. Finish the three stopped repo sessions one at a time.
2. For each repo, close safely: commit, push, record branch, record what remains.
3. Return to this strategy thread.
4. Inventory repos and links: local folder, GitHub repo, branch status, Vercel project, Supabase project, production/preview/local URLs.
5. Confirm rename order.
6. Stand up Codespaces for the three heavy repos first.
7. Keep Sparkle Marketing local unless it becomes build-heavy.

## Guardrails For Future Agents

- Do not assume local commits are backed up. Check push status.
- Do not rename repos while important work is uncommitted or unpushed.
- Do not make Louis manage the pipeline details; report status in plain English.
- Use cloud workspaces for speed, but keep cost controlled with default 4-core Codespaces, idle auto-stop, and periodic budget review.
- Treat HQ as the operational command center and Open Brain/vault as durable memory.
