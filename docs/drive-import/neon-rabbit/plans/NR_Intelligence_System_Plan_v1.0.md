# Neon Rabbit — Intelligence System Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Uploaded to chat when needed (Layer 2 reference)
📁 UPLOAD TO PROJECT: No — Layer 2 file. Upload to chat when actively working on intelligence system.
🏷 PROJECT: Neon Rabbit HQ
👤 WHO USES IT: Louis, Claude, Claude Code
🔄 UPDATE TRIGGER: Any change to intelligence system design, source model, cadence, output format, or pipeline architecture

**Version:** 1.0 | **Created:** April 8, 2026 | **Last Updated:** April 8, 2026 | **Status:** BRAINSTORM COMPLETE — NOT YET BUILT
**Build Timing:** After Neon Rabbit HQ Dashboard Phase 3 is live

---

## Purpose

A personal intelligence system that keeps Louis informed about fast-moving developments across AI agents, crypto infrastructure, web standards, and adjacent innovation — with source quality and actionability as first-class requirements. The system runs automatically, surfaces findings in the daily operational rhythm, and gets smarter over time as Louis learns what matters and what doesn't.

---

## Faucet Philosophy

The intelligence system is designed with a two-phase lifecycle:

**Phase 1 — Wide Open Faucet (Calibration Period).** Everything flows in. Louis is learning what sources are reliable, what topics actually affect his work, what's noise, and what the right signal-to-noise ratio feels like. The system ingests broadly, presents everything, and provides easy controls to promote, demote, or kill sources over time.

**Phase 2 — Tuned Faucet.** Based on what was learned, tighten sources, set thresholds, weight certain domains higher, drop entire categories that turned out to be noise. The system gets smarter because Louis got smarter about what matters.

The architecture must support both modes from day one. It cannot be built assuming what matters is already known.

---

## Two Intake Channels

### Channel 1 — Automated Agent Monitoring

Research agents monitor Tier 1 and Tier 2 sources across all six intelligence domains on a scheduled basis. The system runs while Louis sleeps.

- **Cadence:** Weekly. Agents check all sources and compile a full intelligence report.
- **Delivery:** Every Monday morning by 6:00 AM Eastern.
- **Scope:** All six intelligence domains (see below).
- **Source tiers monitored:** Tier 1 (primary orgs) and Tier 2 (trusted interpreters) only. Agents never go into Tier 3 weeds.

### Channel 2 — Louis-Curated Intake (Rabbit Hole Light)

Louis browses his personal Rabbit Hole Light feed reader (currently YouTube, expanding over time). When he finds something interesting, valid, or curious, he flags it. That flag triggers a research cycle.

- **Cadence:** Daily. Overnight processing of anything flagged during the day/evening.
- **Delivery:** Research results ready by 6:00 AM Eastern every morning.
- **Pipeline:** Flag in Rabbit Hole Light → hook sends to Open Brain with structured data → research agent picks it up → deep research overnight → results in morning brief.

**Data packet per flagged item:**

| Field | Source |
|---|---|
| Source title | Pulled from Rabbit Hole Light entry |
| Author | Pulled from Rabbit Hole Light entry |
| YouTube description | Pulled from Rabbit Hole Light entry |
| Louis's notes | Written by Louis at time of flagging |

**Key rule:** Every flagged item gets researched. No threshold, no filtering on Louis's intake. If he flagged it, it matters. The human curation IS the filter. The agent's job is research and synthesis, not curation.

---

## Six Intelligence Domains

| # | Domain | What It Covers |
|---|---|---|
| 1 | AI/Agent Infrastructure | MCP protocol updates, agent frameworks, new agent capabilities, Claude/Gemini/OpenAI product changes, Conway, agentic commerce protocols |
| 2 | Crypto/Web3 Infrastructure | Stablecoins, agent wallets, payment protocols (x402, MPP), L2 developments, Coinbase agent tools |
| 3 | Web Standards Evolution | Markdown-for-agents, dual-format serving, llms.txt, agent-readable content standards |
| 4 | App Store & Distribution | Apple/Google policy changes, sideloading rules, DMA enforcement, commission changes |
| 5 | Bomb Party Platform | Direct source monitoring — website changes, announcements, email/newsletters, official social media |
| 6 | Innovation Watch | Clever implementations, novel UX patterns, new techniques from anyone in adjacent spaces |

**Domain 6 note:** Innovation Watch is idea-driven, not entity-driven. "Don't care WHO did it, care WHAT they did." This is not competitor monitoring. No tracking of companies or their business moves. Only techniques and innovations worth learning from.

**Explicitly out:** Competitor business monitoring. Don Draper effect: confident, not reactive.

---

## Three-Tier Source Trust Model

### Tier 1 — Primary Sources (Highest Trust)

The organizations actually building the things. Ground truth. No interpretation needed.

- Examples: Anthropic blog, Coinbase developer docs, Apple developer announcements, Google Play policy pages, Supabase changelogs, MCP spec repo on GitHub, Stripe engineering blog
- Automated agents monitor these directly
- **Static** — Tier 1 sources are not promoted or demoted. They just are.

### Tier 2 — Trusted Interpreters

People and outlets who take primary source material and explain what it means, with a track record of being right. They add context but can be wrong.

- Examples: High-quality newsletters, vetted YouTubers, industry analysts who show their work
- Automated agents monitor these directly
- **Promotable/demotable** — sources earn Tier 2 status through repeated quality validation

### Tier 3 — General Signal

Broader content that might surface something interesting but needs verification. This is where Louis's Rabbit Hole Light intake shines.

- Examples: YouTube videos, Twitter threads, Reddit posts, community discussions
- **Louis filters this tier manually** via Rabbit Hole Light (Channel 2)
- Research agent verifies flagged items before they hit the brief
- Automated agents NEVER monitor Tier 3. Louis handles it personally.

### Source Lifecycle

1. **Discovery** — source shows up in Tier 3 browsing (Rabbit Hole Light)
2. **Validation** — Louis flags their content multiple times, research agent confirms quality each time
3. **Promotion** — Louis bumps them to Tier 2. An automated agent starts monitoring them directly.
4. **Ongoing trust** — if quality degrades, demote back to Tier 3 or remove entirely
5. **Tier 1 is static** — these are the orgs themselves, not people

---

## Research Depth — Level 2

Research agents operate at Level 2: Verify and Contextualize.

**Level 2 means:**
- Find the primary source. Is this real? Link to the actual announcement, docs, or spec.
- Confirm or debunk claims made by the flagged source.
- What does this actually mean? Who else is talking about it?
- How mature is it? Beta, production, or vaporware?

**Explicitly NOT Level 3 (Apply to Neon Rabbit).** Louis does the strategic interpretation himself — deciding how something affects NR systems, which open decisions it touches, and what action to take. Overcomplicating the agent's task with Level 3 would degrade result quality.

This depth applies to BOTH channels — automated domain scanning (Channel 1) and Louis-curated flagged items (Channel 2).

---

## Output Format — Morning Brief Intelligence Section

Intelligence appears in the morning brief organized by domain, with each item carrying an actionability tag.

### Actionability Tags

| Tag | Meaning |
|---|---|
| **ACT NOW** | Something Louis might need to act on this week |
| **WATCH** | Developing situation — monitor for changes |
| **AWARENESS** | Good to know, no action required |

### Structure

Items organized by domain bucket. Within each domain, items sorted by actionability — ACT NOW surfaces to the top. Click to expand any item for full research detail (primary source links, verification notes, maturity assessment, context).

### Weekly Report (Mondays)

Full domain scan across all six intelligence domains from Tier 1 and Tier 2 automated monitoring. Plus any overnight flagged item research from Sunday.

### Daily Report (Tuesday–Sunday)

Flagged item research only (if any items were flagged the previous day). No domain scan on non-Monday days.

---

## Storage and Retention

Intelligence items do not get a separate persistent archive. Two outcomes for each item:

**KEEP** — Item is valuable long-term. Gets logged to Open Brain as a thought. Searchable, semantic, persistent. Louis decides what's worth keeping.

**DISCARD** — Item served its purpose or wasn't useful. Gets deleted.

Open Brain IS the long-term archive. No separate intelligence knowledge base competing with it.

The `intelligence_items` table in the HQ schema is used for pipeline staging — tracking research status, queuing items for the morning brief — but not for long-term retention.

---

## Pipeline Architecture (Conceptual)

```
CHANNEL 1 — AUTOMATED (WEEKLY)
Tier 1 + Tier 2 Sources
    → Research agents check sources on schedule
    → New findings compiled and tagged (ACT NOW / WATCH / AWARENESS)
    → Staged in intelligence_items table
    → Presented in Monday morning brief

CHANNEL 2 — LOUIS-CURATED (DAILY)
Rabbit Hole Light
    → Louis flags an entry
    → Hook sends to Open Brain: title, author, description, notes
    → Research agent picks up flagged items
    → Overnight processing: verify, source, contextualize
    → Results staged in intelligence_items table
    → Presented in next morning brief (by 6 AM ET)

POST-DELIVERY
    → Louis reads the brief
    → KEEP items → logged to Open Brain
    → DISCARD items → deleted from intelligence_items
```

---

## Connection to Existing Systems

| System | Relationship |
|---|---|
| Neon Rabbit HQ Dashboard | Intelligence section in morning/evening brief. Phase 3 build item. |
| Open Brain | Long-term archive for kept intelligence. Also receives Channel 2 intake data from Rabbit Hole Light hook. |
| Rabbit Hole Light | Channel 2 intake source. Hook sends flagged items to Open Brain with structured metadata. |
| Morning/Evening Brief | Delivery vehicle for all intelligence output. |
| Agent Layer | Research agents are employees in the agentic layer — visible on agent roster, tracked like all other agents. |

---

## HQ Master Plan Items Affected

| Item | Update |
|---|---|
| OD-2 (Research layer format) | Resolved by this plan — domain-organized with actionability tags, dual-channel intake |
| OD-14 (Intelligence significance threshold) | Partially addressed — faucet philosophy means no threshold in Phase 1. Threshold tuning is Phase 2 calibration. |
| RG-4 (Intelligence pipeline full design) | Resolved by this plan |
| `intelligence_items` table (Phase 3) | Confirmed — used for pipeline staging, not long-term retention |
| Agents Planned table | Add: Domain scan agents (one per domain or consolidated), Flagged item research agent |

---

## Action Items

| # | Task | Status | Blocked By |
|---|---|---|---|
| 1 | Finish debugging Rabbit Hole Light | IN PROGRESS | Claude Code session |
| 2 | Tier 1 source identification session — document primary sources across all six domains | NOT STARTED | Nothing — can happen anytime |
| 3 | Build NR HQ Dashboard to Phase 3 | NOT STARTED | Phases 2B, 2C |
| 4 | Wire Open Brain hook from Rabbit Hole Light flagged items | NOT STARTED | Action items 1 and 3 |
| 5 | Build research agent pipeline | NOT STARTED | Action item 3 |
| 6 | Build morning brief intelligence section | NOT STARTED | Action item 3 |
| 7 | Build weekly domain scan agents | NOT STARTED | Action items 2 and 3 |

---

*This plan is the blueprint for the Neon Rabbit Intelligence System. Update when design decisions change. Do not update for implementation details — those belong in build specs created during Phase 3.*
