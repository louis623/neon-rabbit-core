# Rabbit Hole — Research #7: Agent-Friendly Architecture for Consumer Apps

**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when needed (reference doc, not every session)
**📁 UPLOAD TO PROJECT:** No
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context for Gate 2+)
**🔄 UPDATE TRIGGER:** New agent architecture decisions or protocol changes

**Research Date:** April 6, 2026
**Source:** Gemini Deep Research
**Status:** ✅ Complete — analyzed and banked to Open Brain
**Master Plan Impact:** v1.4 → v1.5

---

## Research Purpose

Investigate what agent-friendly architecture looks like for consumer mobile apps in 2026, specifically for a Flutter + Supabase personal content curation tool. Covers: agent interface protocols, authentication/authorization for agents acting on behalf of users, machine-readable discovery and discoverability, agentic commerce, and solo developer architecture recommendations for the 2026–2028 horizon.

---

## Key Findings

### 1. MCP is the Standard Agent Interface Protocol

Model Context Protocol (MCP) confirmed as the "USB-C for AI applications" — the definitive standard for connecting AI agents to external application backends. MCP exposes three primitives: Tools (executable actions), Resources (readable data objects), and Prompts (interaction templates). Uses JSON-RPC 2.0 for bidirectional, persistent communication.

For Rabbit Hole, the MCP server would expose core functionality as discrete tools — e.g., `create_collection`, `add_source`, `search_saved_items`, `get_pricing`. Because MCP connections are persistent, agents can receive real-time feedback during long-running tasks like processing podcast transcripts.

### 2. MCP Server Deploys on Supabase Edge Functions

A solo developer can deploy an MCP server using Supabase Edge Functions with Hono (routing) and Zod (strict input validation). Estimated development effort: **40–80 hours** once core RLS and schema are in place. Majority of time is spent writing semantic tool descriptions so the LLM knows when and how to call each tool.

Same infrastructure as the RSS proxy (Research #2 recommendation) — no new platform, no new hosting costs.

### 3. OAuth 2.1 with Delegated Authority (OBO) is the Auth Model

Agent authentication uses OAuth 2.1 "On-Behalf-Of" (OBO) delegation chains. The user issues a scoped, short-lived token to their agent — the agent never receives the user's credentials. NIST 2026 guidelines treat agent identity and authorization as distinct layers.

Key security mechanisms:
- **DPoP (Proof-of-Possession):** Prevents token replay if intercepted
- **CAEP (Continuous Access):** Real-time revocation of agent access upon risk detection
- **PKCE:** Secures auth flow in public client environments
- **ABAC (Attribute-Based Auth):** Limits actions based on task context and intent

Supabase Auth handles delegation tokens natively. RLS acts as the final fail-safe — even a "confused deputy" agent cannot access another user's data.

### 4. Four-Tier Permission Model for Agents

| Tier | Scope | Rabbit Hole Mapping |
|---|---|---|
| Read | Browse collections, read saved articles, semantic search | Browse Rabbit Holes and feeds |
| Append | Add new sources, save highlights from browser | Add sources, save cards |
| Write/Manage | Rename collections, move items, update metadata | Rename/move Rabbit Holes |
| Admin | Account deletion, payment changes — requires step-up auth | Account management (human-preferred) |

Admin actions use "Structured Elicitation" — the agent surfaces a challenge to the user's mobile device, collects the cryptographic response, and proceeds with a higher-privilege token.

### 5. Machine-Readable Discovery: llms.txt and /.well-known/ai

Two complementary discovery mechanisms:

**`llms.txt`** — Markdown document at domain root. High-density "elevator pitch" for agents. AI models are more token-efficient reading Markdown than HTML (~90% token reduction).

**`/.well-known/ai`** — Structured JSON endpoint listing: service identity, capabilities array (every tool + endpoint + parameters), authentication requirements, operational hints (rate limits, token efficiency).

Agents evaluate apps on: capability clarity (can it parse podcast RSS?), reputation/trust (audit logs, version histories, security certs), and pricing transparency (structured gate prices vs. hidden fees).

### 6. Agentic Commerce Protocols

| Protocol | Developers | Best Use | Payment Rail |
|---|---|---|---|
| ACP | Stripe, OpenAI | In-chat purchases (ChatGPT) | Shared Payment Tokens |
| MPP | Stripe, Tempo | Direct API/MCP tool payments | Stablecoins / Crypto |
| UCP | Google, Shopify | Google Search / Gemini shopping | Google Pay / Multi-method |
| AP2 | Google, Adyen | Cryptographic authorization | Verifiable Mandates |
| x402 | Independent | Simple HTTP-native settlement | Stablecoins (USDC) |

Most relevant for Rabbit Hole: **MPP (Machine Payments Protocol)**. Uses HTTP 402 "Payment Required" responses — agent fulfills payment challenge programmatically, resource unlocked in single round-trip. No checkout page needed.

Agent purchase flow: Discovery → Negotiation (budget check) → Authorization (user permission or pre-authorized budget) → Execution (payment challenge signed) → Settlement (on-chain or fiat).

### 7. State-Aware Schema Design for Agents

Agents are "stateless CPUs" — the app provides the RAM. Recommended tables:

- **`agent_sessions`** — Tracks lifecycle of each agentic interaction
- **`tool_invocations`** — Log of every agent action (parameters, results). Essential for observability, auditability, and "lifecycle transparency" (improves agent discovery ranking)
- **`intent_metadata`** — JSONB field on collections table. Stores per-topic agent instructions (e.g., "For AI collection, prioritize Reddit over blogs"). Enables personalized agent behavior per Rabbit Hole.

### 8. pgvector Confirmed as Agent-Ready Infrastructure

Semantic search via pgvector is foundational for agent "Contextual Q&A" across saved items. Agents query by meaning, not keywords. A `highlights` table with embedding index enables agents to search across user's captured content. Already enabled on neon-rabbit-core.

### 9. Solo Developer Investment Strategy: 70/20/10

- **70% Core features:** Flutter app, human UX, feed management, manual curation
- **20% Foundational readiness:** RLS, pgvector, state tracking schema — designed for agents even though agent surface ships later
- **10% Agent surface:** llms.txt, basic MCP server, discovery registration

Key insight: Don't over-invest in agent features before core ships, but DO design the schema to support agents from day one. Retrofitting schema decisions later requires painful migrations.

### 10. `mcp_dart` Flutter Package

Provides primitives for both MCP client (consuming AI services internally) and MCP server (exposing functionality to external agents). For BYOK model (Gate 3), the Flutter app uses a "Vault" pattern in Supabase — user API keys stored securely and injected into the agent's execution loop during summarization.

### 11. 2028 Horizon — Agents Will Discard Non-Agent-Ready Apps

By 2028, agent-to-app interaction will be standardized (like HTTP/TCP). Users will expect agents to "just work." Apps requiring manual interaction will be replaced by agent-first alternatives. While specific protocols may evolve, the fundamentals — modular tool design, delegated authorization, machine-readable metadata — will remain constant.

---

## Open Decisions Generated

| # | Decision | Blocked By | Resolves At |
|---|---|---|---|
| OD-28 | `intent_metadata` JSONB on `rh_subjects` — Gate 1 (nullable) or Gate 2? | Schema decision | Decision round |
| OD-29 | `llms.txt` + `/.well-known/ai` — publish at Gate 1 launch or Gate 2? | Timing decision | Decision round |
| OD-30 | Agent state tables (`agent_sessions`, `tool_invocations`) — Gate 2 or later? | Scope decision | Gate 2 planning |

## Research Gaps Generated

| # | Gap | Action | Status |
|---|---|---|---|
| RG-20 | `mcp_dart` package maturity — production-ready? | Technical spike during Step 1 or Gate 2 | NEW |
| RG-21 | MCP server on Edge Functions — persistent connection model vs. Edge Function limits | Quick research | NEW |

## Existing Items Affected

- **OD-15** (agent architecture): Substantially informed — MCP + OAuth 2.1 OBO + four-tier scoping
- **OD-12** (Gate 3 API key storage): "Vault" pattern confirmed via `mcp_dart`
- **OD-14** (crypto payments): MPP and x402 identified as implementation paths
- **OD-26** (payment strategy): HTTP 402 pattern for agentic commerce added
- **RG-12** (agent architecture gap): ✅ RESOLVED

---

*This is a reference document. Key findings are banked in Open Brain. The master plan (RH_Master_Plan) is the authoritative document — this file provides the detailed research backing.*
