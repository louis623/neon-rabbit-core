# Codex CLI — Cheat Sheet

**For:** Louis Chapman | **Updated:** April 13, 2026 | **Where:** Google Keep (quick reference)

---

## Setup

```
# Install (one-time)
npm i -g @openai/codex

# Update to latest
npm i -g @openai/codex@latest

# First run — authenticates with ChatGPT account
codex
```

Included with ChatGPT Plus ($20/mo) — no separate license needed.

---

## Launch Commands

```
# Start interactive session (cd into project first)
cd C:\Users\louis\neon-rabbit-hq
codex

# Start with a prompt directly
codex "Review this codebase for security issues"

# Non-interactive mode (scripting / automation)
codex exec "Find and fix all TypeScript errors"
```

---

## Approval Modes

Set how much permission Codex has before it asks you:

| Mode | What it does |
|------|-------------|
| Auto | Codex runs commands and edits files without asking |
| Read Only | Codex can read but asks before any changes |
| On Request | Codex asks before every action (safest) |

Change mid-session: `/permissions`

---

## Slash Commands — The Ones You'll Use

### Session control
| Command | What it does |
|---------|-------------|
| `/model` | Switch models (GPT-5.4, GPT-5.3-Codex, GPT-4.1, etc.) |
| `/fast` | Toggle Fast mode on/off for GPT-5.4 |
| `/permissions` | Change approval mode mid-session |
| `/status` | Show current model, token usage, approval policy |
| `/clear` | Clear terminal + start fresh chat |
| `/new` | Start new conversation (keeps terminal visible) |
| `/quit` or `/exit` | Exit Codex CLI |

### Working with code
| Command | What it does |
|---------|-------------|
| `/diff` | Show all changes Codex made (staged, unstaged, untracked) |
| `/review` | Ask Codex to review your working tree for issues |
| `/mention` | Attach a specific file to the conversation (e.g. `/mention src/app/page.tsx`) |
| `/plan` | Switch to plan mode — Codex proposes before building |
| `/copy` | Copy latest Codex response to clipboard |
| `/compact` | Summarize long conversation to free up context window |

### Advanced
| Command | What it does |
|---------|-------------|
| `/agent` | Switch between spawned subagent threads |
| `/fork` | Clone current conversation into a new thread |
| `/resume` | Resume a previous saved session |
| `/mcp` | List connected MCP tools |
| `/apps` | Browse and attach apps/connectors |
| `/init` | Generate AGENTS.md scaffold for the current repo |
| `/feedback` | Send logs/diagnostics to OpenAI |
| `/logout` | Sign out of Codex |

---

## Louis's Workflow — Adversarial Code Review

This is the primary way you use Codex — reviewing Claude Code ultraplan outputs before execution.

```
# 1. Open PowerShell
# 2. cd into the project
cd C:\Users\louis\sparkle-suite

# 3. Launch Codex
codex

# 4. Paste the ultraplan output
# 5. Then paste the adversarial review prompt
# 6. Codex returns flags/issues
# 7. Bring flags back to Claude Chat
# 8. Feed flags into Claude Code before execution
```

### Template adversarial prompt (customize per task):
```
You are a senior engineer reviewing this implementation plan.
Your job is to find what will break, what's missing, and what
assumptions are wrong. Be adversarial.

[paste specific review criteria here]

List every issue. For each: what the problem is, why it matters,
and what the fix should be.
```

---

## Useful Flags (CLI launch options)

```
# Set working directory
codex -C /path/to/project

# Set approval mode at launch
codex --approval-mode auto
codex --approval-mode read-only

# Override model at launch
codex -c model=gpt-5.4

# Enable web search
codex --web-search

# Add extra writable directories
codex --writable-root /additional/path
```

---

## Config File

Location: `%USERPROFILE%\.codex\config.toml` (Windows)

Common settings:
```toml
[default]
model = "gpt-5.4"
approval_policy = "on-request"

[tui]
status_line = ["model", "context", "git"]
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

## Tips

- **Fresh session per review** — `/clear` or `/new` between different reviews
- **Check token usage** — `/status` shows remaining context capacity
- **Long review getting cut off?** — `/compact` to summarize earlier context and free space
- **Want to see what Codex changed?** — `/diff` before committing
- **Windows sandbox issues?** — `/sandbox-add-read-dir C:\path` to grant access
- **Copy result quickly** — `/copy` grabs latest response to clipboard
