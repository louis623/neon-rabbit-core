# Open Brain Build Session — March 30, 2026

## What We Built
Open Brain (OB1) — a personal semantic knowledge system for Neon Rabbit that any AI can read from and write to through MCP (Model Context Protocol). Based on the open-source OB1 project by Nate B. Jones.

## Architecture (Final, Working)
- **Database:** Supabase (neon-rabbit-core project, same project used for other Neon Rabbit infrastructure)
- **Table:** `thoughts` — stores content, vector embeddings (1536-dimension), and auto-extracted metadata (type, topics, people, action items)
- **Search Function:** `match_thoughts` — semantic similarity search using cosine distance
- **Edge Function:** `open-brain-mcp` — Supabase Edge Function that serves as the MCP server. Handles four tools: capture_thought, search_thoughts, list_thoughts, thought_stats
- **AI Gateway:** OpenRouter (single key for embeddings via text-embedding-3-small and metadata extraction via gpt-4o-mini)
- **Security:** Row Level Security enabled, service_role-only access, MCP access key for external connections
- **Connection:** Claude Desktop connector using remote MCP URL with access key as query parameter

## What Did NOT Work (Lessons Learned)
The initial build was done by Sonnet 4.6 in a previous session. It ignored Nate's OB1 guide and built a custom architecture instead:
- Used a Next.js app deployed on Vercel with a custom Telegram bot webhook
- Called OpenAI directly instead of using OpenRouter
- Used `halfvec(1536)` column type which the Supabase pgvector version couldn't parse
- Used the Supabase anon key instead of the service role key
- Built a pgmq queue system for async embedding that never worked
- Created a table called `open_brain` instead of `thoughts`

This custom build had multiple stacked failures: missing Vercel environment variable (OPENAI_API_KEY was never added), Row Level Security blocking inserts, halfvec column type rejecting vector literals, and the Supabase JS client silently dropping embedding data.

After hours of debugging, we tore everything down and rebuilt from scratch following Nate's guide exactly.

During the rebuild, an additional issue emerged: Claude Code deployed an older version of the Edge Function code that called a `upsert_thought` database function (which didn't exist in our schema). The fix was updating the Edge Function code directly through the Supabase dashboard's Code tab with the latest version from Nate's GitHub repo, which uses a direct `supabase.from("thoughts").insert()` call instead.

## Key Principle
KISS — Keep It Simple, Stupid. Follow established reference implementations exactly. Don't let AI improvise its own architecture when a proven guide exists. The working system uses two services (Supabase + OpenRouter), one Edge Function, and one MCP connection. No Vercel, no Next.js, no custom bot code.

## Files and Locations
- **Edge Function code:** Deployed to Supabase Edge Functions as `open-brain-mcp`
- **Local project files:** `C:\Users\louis\sparkle-suite\supabase\functions\open-brain-mcp\`
- **MCP config (Claude Code):** `C:\Users\louis\.claude\.mcp.json` (note: this config is for CLI-based Claude Code, not Claude Desktop which uses the Connectors UI)
- **Source repo:** https://github.com/NateBJones-Projects/OB1

## Credentials (stored separately, not in this doc)
- Supabase Project Ref
- Supabase Project URL
- Supabase Secret Key (service role)
- OpenRouter API Key
- MCP Access Key (rotated on March 30, 2026)

## Access Points
- **Claude Desktop (Chat tab):** Open Brain connector enabled via Settings → Connectors
- **Claude Mobile App:** Same connector syncs across devices
- **Any MCP-compatible AI:** Connect using the MCP Connection URL with access key

## What's Next
- Run the OB1 Companion Prompts (Memory Migration, Second Brain Migration)
- Migrate content from Project Master Doc and Systems/Workflows Master Doc into Open Brain
- Explore OB1 extensions (Slack capture, Telegram capture, etc.)
- Consider connecting Open Brain to other AI tools (ChatGPT, Cursor) for cross-tool memory
