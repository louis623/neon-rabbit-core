# Personal Account Start Prompt

Copy and paste this into a fresh Codex chat on the new personal account:

```md
I am moving from a business/enterprise Codex account to a personal Codex account on the same Windows machine. I am a solo entrepreneur, and the business account is the wrong fit and likely overkill for how I work. I want this new personal account to pick up my existing local working context as smoothly as possible without me having to re-explain everything from scratch.

You are not starting from an empty machine. The important repos, local files, and setup clues already exist on disk. Your job is to orient yourself from the local workspace truth, confirm what still carries over automatically, identify what needs to be reconnected at the account level, and get me to a clean, productive starting point.

Important constraints:
- Same machine, new Codex account.
- Do not assume account-level plugins, MCPs, memory, or auth sessions carried over automatically.
- Do assume local repos, repo instructions, snapshots, skills, env files, and linked project files may still exist on disk.
- Do not ask me broad open-ended questions unless you are truly blocked.
- Prefer reading local files first and then telling me exactly what is already in place versus what I still need to reconnect.
- Never print or expose secret values. You may reference secret names and secret source locations, but not the actual values.

Primary local repos:
- `C:\Users\louis\neon-rabbit-core`
- `C:\Users\louis\neon-rabbit-hq`
- `C:\Users\louis\vac-case-reference`

Important local migration docs to read first:
- `C:\Users\louis\neon-rabbit-core\PERSONAL_ACCOUNT_MIGRATION.md`
- `C:\Users\louis\neon-rabbit-core\.local\PRIVATE_ACCOUNT_TRANSFER_CHECKLIST.md`

Repo instruction files to honor:
- `C:\Users\louis\neon-rabbit-core\AGENTS.md`
- `C:\Users\louis\neon-rabbit-core\CLAUDE.md`
- `C:\Users\louis\neon-rabbit-hq\AGENTS.md`
- `C:\Users\louis\neon-rabbit-hq\CLAUDE.md`
- `C:\Users\louis\vac-case-reference\AGENTS.md`
- `C:\Users\louis\vac-case-reference\CLAUDE.md`

Additional high-value orientation files:
- `C:\Users\louis\neon-rabbit-core\CODEBASE_SNAPSHOT.md`
- `C:\Users\louis\neon-rabbit-hq\CODEBASE_SNAPSHOT.md`
- `C:\Users\louis\vac-case-reference\CODEBASE_SNAPSHOT.md`

Custom repo-local skills that may matter:
- `C:\Users\louis\neon-rabbit-core\.agents\skills\neon-rabbit-hq\SKILL.md`
- `C:\Users\louis\neon-rabbit-core\.agents\skills\sparkle-live-queue\SKILL.md`

Current account/config reference path to inspect if available:
- `C:\Users\louis\.codex\config.toml`

Known MCP endpoints that may need to be recreated or verified:
- Open Brain MCP: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/open-brain-mcp`
- NR HQ MCP: `https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/nr-hq-mcp`

Known linked Vercel projects:
- `C:\Users\louis\neon-rabbit-core\.vercel\project.json`
- `C:\Users\louis\neon-rabbit-hq\.vercel\project.json`
- `C:\Users\louis\vac-case-reference\.vercel\project.json`

What I want you to do:

1. Read the two migration docs first.
2. Inspect the repo instruction files and snapshots for the three main repos.
3. Tell me, in a concise setup audit:
   - what local context is already available on this machine,
   - what account-level things probably still need reconnection,
   - what MCPs/plugins/connectors you can confirm or infer,
   - what the three repos each do and how they differ.
4. Give me a short, ordered "next steps to finish setup" checklist.
5. Flag anything risky, missing, or ambiguous before assuming it works.
6. If the setup looks mostly intact, be ready to start work immediately in the correct repo without making me restate the whole business context.

Behavior and working style to preserve:
- Main branch only unless I explicitly say otherwise.
- Do not create worktrees, extra branches, or temp repos automatically.
- Confirm before pushing to `main`.
- Do not revert unrelated changes.
- "Complete" means I verify in the browser, not just passing tests.
- For Next.js work here, do not trust stale framework memory; read the local Next docs in `node_modules/next/dist/docs/` before coding when relevant.

What success looks like:
- You understand the local ecosystem quickly.
- You know the difference between `neon-rabbit-core`, `neon-rabbit-hq`, and `vac-case-reference`.
- You know which setup pieces are local and which are account-scoped.
- You can help me reconnect anything missing without me having to reinvent the whole setup by hand.

Start by reading the local files above and then give me the setup audit and next-step checklist.
```
