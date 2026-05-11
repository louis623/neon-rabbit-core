# Claude Code CLI — Cheat Sheet

**For:** Louis Chapman | **Updated:** April 13, 2026 | **Where:** Google Keep (quick reference)

---

## Setup

```
# Install (one-time)
npm i -g @anthropic-ai/claude-code

# Update to latest
npm i -g @anthropic-ai/claude-code@latest

# Check version
claude --version
```

Included with Claude Pro ($20/mo) and Max ($100/mo) plans. Max plan includes /ultraplan at no extra cost.

---

## Launch Commands

```
# Start interactive session (cd into project first)
cd C:\Users\louis\sparkle-suite
claude

# Start with permissions skipped (for overnight/autonomous runs)
claude --dangerously-skip-permissions

# Start with a prompt directly (non-interactive, prints and exits)
claude -p "summarize this file" < README.md

# Start in plan mode (proposes before building)
claude --plan

# Set model at launch
claude --model opus
claude --model sonnet
claude --model haiku
```

---

## Louis's Standing Rules (baked into every session)

```
# Every prompt starts with:
"Work on main branch only at [project path] — do not create
worktrees, new branches, or temporary directories unless
Louis explicitly requests one."

# Every prompt ends with:
"Regenerate CODEBASE_SNAPSHOT.md, commit all changes with a
descriptive message, and push to main/master. Output the
snapshot to terminal."
```

---

## Approval Modes

| Mode | What it does |
|------|-------------|
| acceptEdits | Auto-accepts file edits, asks before shell commands |
| plan | Proposes plan, waits for approval before each step |
| bypassPermissions | Skip all prompts (--dangerously-skip-permissions) |

Toggle mid-session: `Shift+Tab` cycles through modes

---

## Slash Commands — The Ones You'll Use

### Session control
| Command | What it does |
|---------|-------------|
| `/help` | Show all available slash commands |
| `/model` | Switch models (Opus 4.6, Sonnet 4.5, Haiku 4.5) + adjust effort |
| `/fast` | Toggle Fast mode for Opus 4.6 (same model, speed-optimized) |
| `/clear` | Clear conversation history + start fresh (keeps file edits) |
| `/compact` | Summarize long conversation to free context window |
| `/context` | Show visual grid of context window usage |
| `/cost` | Show token consumption and estimated costs this session |
| `/status` | Show current model, permissions, context usage |
| `/exit` | Exit Claude Code cleanly |

### Working with code
| Command | What it does |
|---------|-------------|
| `/diff` | Show all changes Claude made (interactive viewer) |
| `/undo` | Revert the last file change Claude made |
| `/plan` | Toggle plan mode — Claude proposes before executing |
| `/ultraplan` | Run Opus 4.6 in the cloud for up to 30 min (Max plan, complex tasks) |
| `/simplify` | Three-agent parallel code review on recent changes |
| `/branch` | Branch the conversation (like git branch for your session) |
| `/rewind` | Roll back conversation AND code changes to earlier checkpoint |
| `!` prefix | Run shell command directly (e.g. `!git status`) — saves tokens vs asking Claude |

### File references
| Command | What it does |
|---------|-------------|
| `@filename` | Reference a specific file in your prompt |
| `@folder/` | Reference a directory |
| `/init` | Generate CLAUDE.md scaffold for persistent project instructions |

### Plugins & extensions
| Command | What it does |
|---------|-------------|
| `/plugin` | Discover and install plugins from marketplace |
| `/plugin install [name]` | Install a specific plugin |
| `/mcp` | List configured MCP server connections |
| `/mcp add [name]` | Add an MCP server |
| `/reload-plugins` | Hot-reload plugins without restarting |

---

## Keyboard Shortcuts

| Shortcut | What it does |
|----------|-------------|
| `Shift+Tab` | Cycle through: normal → auto-accept → plan mode |
| `Ctrl+C` | Cancel current response (keeps conversation alive) |
| `Ctrl+D` | Exit session cleanly |
| `Ctrl+R` | Search session history |
| `Ctrl+L` | Clear terminal view (keeps conversation) |
| `Up/Down` | Navigate previous inputs |
| `Escape` | Cancel current input line |

---

## Louis's Workflow — Build Session

This is the standard build workflow for Neon Rabbit projects.

```
# 1. Open PowerShell
# 2. cd into the project
cd C:\Users\louis\sparkle-suite

# 3. Launch Claude Code
claude --dangerously-skip-permissions

# 4. For Medium+ tasks, type:
/ultraplan

# 5. Paste the prompt from Claude Chat
# 6. Claude Code plans → review plan
# 7. (Optional) Copy plan into Codex CLI for adversarial review
# 8. Feed Codex flags back into Claude Code
# 9. Claude Code executes
# 10. Verify: CODEBASE_SNAPSHOT.md regenerated, committed, pushed
```

### Quick task (no ultraplan needed):
```
cd C:\Users\louis\sparkle-suite
claude --dangerously-skip-permissions
# Paste prompt directly — Claude executes immediately
```

---

## Models & When to Use Them

| Model | Best for | Standing rule |
|-------|----------|---------------|
| Opus 4.6 | Complex architecture, schema design, multi-file planning, painful-reversal decisions | Medium+ tasks via /ultraplan |
| Sonnet 4.5 | Execution of clear plans, standard builds, most coding work | Default for standard Claude Code sessions |
| Haiku 4.5 | Fast exploration, simple questions, quick lookups | Lightweight tasks only |

Switch mid-session: `/model` then pick from list

---

## Useful CLI Flags

```
# Skip all permission prompts
claude --dangerously-skip-permissions

# Start in plan mode
claude --plan

# Set working directory
claude -C /path/to/project

# Accept file edits automatically
claude --permission-mode acceptEdits

# Non-interactive (for scripting/CI)
claude -p "your prompt here"

# Custom system prompt (append to default)
claude --append-system-prompt "Always use TypeScript strict mode"

# Specify model
claude --model opus
claude --model sonnet
claude --model haiku
```

---

## CLAUDE.md — Persistent Project Instructions

Place a `CLAUDE.md` file in your project root. Claude reads it at the start of every session in that repo. Use it for:

- Project conventions and coding standards
- File structure notes
- Build/test commands
- Things Claude should always remember about this project

```markdown
# CLAUDE.md
- Always use TypeScript strict mode
- Run `npm test` after any changes
- Main branch only — no worktrees
- Supabase project: neon-rabbit-core
```

---

## Project Directories (for copy-paste)

```
cd C:\Users\louis\sparkle-suite
cd C:\Users\louis\neon-rabbit-hq
cd C:\Users\louis\rabbit-hole
cd C:\Users\louis\rh-reader
```

---

## GitHub Repos

```
louis623/sparkle-suite
louis623/neon-rabbit-hq
louis623/rabbit-hole
louis623/rh-reader
```

---

## Tips

- **Fresh session per prompt** — close and reopen between tasks to avoid context fatigue
- **Check context usage** — `/context` shows visual grid of what's consuming your window
- **Long session getting slow?** — `/compact` summarizes earlier context to free space
- **Undo a bad edit** — `/undo` reverts Claude's last file change
- **Review before committing** — `/diff` shows everything Claude changed
- **Save tokens on shell commands** — prefix with `!` (e.g. `!git log --oneline -5`)
- **Shift+Tab is your friend** — quickly toggle between normal/auto-accept/plan mode
- **Ultraplan for anything Medium+** — it plans on Opus before building, catches bad assumptions early
- **Codex validates ultraplan** — always run adversarial review on ultraplan output before execution
- **CODEBASE_SNAPSHOT is non-negotiable** — every session ends with regenerate, commit, push
