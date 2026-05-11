# Open Brain Migration & Companion Prompts — Starter Prompt

Paste this entire prompt into a new Claude Desktop conversation (Chat tab). Make sure Open Brain is enabled in Connectors before sending.

---

## PROMPT START — COPY EVERYTHING BELOW THIS LINE

You are helping me populate my Open Brain — a personal semantic knowledge system built on Supabase with MCP integration. It was set up today (March 30, 2026) following Nate B. Jones' OB1 guide exactly. It is fully working. You have access to four Open Brain tools: capture_thought, search_thoughts, list_thoughts, and thought_stats.

I need you to do three things in this session, in this order. Do not skip ahead. Complete each phase fully before moving to the next.

---

### PHASE 1: Memory Migration

Extract everything you know about me from your memory and conversation history. This includes my name, my business, my projects, my preferences, people I've mentioned, decisions I've made, tools I use, goals I have — everything.

Organize each piece of knowledge into a standalone statement that will make sense when retrieved later by any AI. Save each one individually using the capture_thought tool.

After saving everything from memory, give me a count of how many thoughts were captured and a brief summary of the categories covered.

---

### PHASE 2: Master Document Migration

After Phase 1 is complete, I will upload two documents:
1. **Project Master Doc** — Contains all project context, decisions, architecture, client information, and business strategy for Neon Rabbit
2. **Systems/Workflows Master Doc** — Contains all technical systems, workflows, pipelines, tools, and operational procedures

For each document:
- Read through the entire document
- Break it into standalone knowledge chunks. Follow these rules:
  - A short note (1-3 sentences) = one chunk as-is
  - A long section with multiple distinct ideas = split into separate chunks
  - Each chunk should be a clear, standalone statement that makes sense without the surrounding context
  - Preserve dates when present — they matter for retrieval
  - Preserve people's names — they're high-value metadata
  - Skip empty structural content, headers with no substance, and template placeholders
- Save each chunk using capture_thought
- After each document is fully migrated, tell me how many thoughts were captured from it

If the documents are very large, warn me about approximate cost before proceeding and ask for confirmation.

---

### PHASE 3: Verification & Summary

After all migrations are complete:
1. Run thought_stats to show me the total state of my Open Brain
2. Do three test searches to verify retrieval works:
   - Search for "Neon Rabbit" 
   - Search for "client projects"
   - Search for "workflows and systems"
3. Give me a final summary of everything that was migrated, organized by category
4. Flag any gaps — things you think should be in my Open Brain that weren't covered by memory or the documents

---

### RULES
- Use capture_thought for every single entry. Do not skip or batch.
- Each thought should be a standalone statement, not a document fragment.
- Do not invent or embellish information. Only capture what actually exists in memory or the documents.
- If a capture fails, stop and tell me immediately. Do not silently skip thoughts.
- Pace yourself. Quality over speed. I'd rather have 50 well-formed thoughts than 200 fragments.

---

Begin with Phase 1 now. Start by confirming the capture_thought tool is available, then begin extracting and saving your memories about me.
