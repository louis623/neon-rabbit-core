# Research #5 — Memory/Capture Feature Landscape

**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when analyzing this specific research piece
**📁 UPLOAD TO PROJECT:** No — reference doc, not needed every session
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context)
**🔄 UPDATE TRIGGER:** N/A — research snapshot, does not change

**Source:** Gemini Deep Research | **Date:** April 6, 2026 | **Status:** ✅ Analyzed

---

## Research Summary

Comprehensive analysis of the capture and curation ecosystem for mobile feed readers in 2025–2026, focusing on competitive landscape, feature patterns, AI integration, export/interoperability standards, pricing models, and design patterns for mobile capture UX.

---

## Key Findings Banked for Decision Round

1. **Pocket is dead — market vacuum exists.** Pocket shut down July 2025, Omnivore acquired by ElevenLabs late 2024. Millions of displaced users actively seeking new homes.

2. **Market is bifurcated — Rabbit Hole fits the gap.** Expensive subscriptions (Readwise $120+/yr) vs. minimalist OTP (GoodLinks $5–$10). Rabbit Hole's gate-based OTP slots into the underserved middle.

3. **"Save and forget" is the #1 problem to solve.** Content not touched within 30 days is essentially dead. Industry standard: 3-folder triage (Inbox → Active → Archive).

4. **Spaced repetition is the retention lever.** SM-2 resurfacing of highlights is the strongest engagement hook. Philosophically aligned with anti-algorithm (resurfaces user-chosen content).

5. **Semantic search is table stakes for Gate 2.** Vector embedding search is now standard. pgvector already enabled on neon-rabbit-core.

6. **"No-slop" AI positioning confirmed.** Users reject generic summaries. Winning pattern: "assistance not replacement."

7. **Local-first data ownership is a must-have.** Markdown export, offline access, device-resident data are requirements, not differentiators.

8. **Video-first annotation is a differentiator.** YouTube transcript highlighting in a feed reader — no competitor does this natively.

9. **Interoperability standards are non-negotiable.** OPML for feeds (Gate 1), Markdown export for captures (Gate 2), CSV/HTML import for migration.

10. **Flutter AI Toolkit exists.** v1.0 supports multi-turn function calling and on-device models.

11. **Student market is 30% of reading app users.** Massive underserved segment wanting affordable, project-based curation.

---

## Open Decisions Generated

| # | Decision | Blocked By |
|---|---|---|
| OD-20 | Gate 2 triage model — 3-folder vs 2-state | Gate 2 planning session |
| OD-21 | Spaced repetition — SM-2 vs simpler time-based | Gate 2 planning session |
| OD-22 | OPML import/export — Gate 1 or defer? | Build sequence decision |
| OD-23 | Pocket/Omnivore migration import — build importer? | Effort vs acquisition value |
| OD-24 | YouTube transcript capture — Gate 2 or post-Gate 2? | Gate 2 scope decision |

## Research Gaps Generated

| # | Gap | Action |
|---|---|---|
| RG-16 | Flutter AI Toolkit capabilities for Gate 3 | Technical spike during Step 1 |
| RG-17 | OPML standard compliance variants | Quick research if OD-22 = Gate 1 |

---

## Competitive Landscape Summary

| Platform | Best For | 2026 Pricing | Core Differentiator |
|---|---|---|---|
| Readwise Reader | Research / Power Readers | $12.99/mo or $119.88/yr | Spaced repetition + multi-format |
| Inoreader | Infrastructure / Power RSS | $9.99/mo or $90.00/yr | Advanced rules, filters, scraping |
| Feedly | Professional Monitoring | Free / $8–$12/mo | AI assistant "Leo" |
| Matter | Apple Ecosystem | Free / $8/mo Premium | HD TTS + "Co-Reader" AI |
| Raindrop.io | Visual Bookmarking | Free / $3.54/mo annual | Nested collections |
| GoodLinks | iOS/Mac Minimalists | $4.99–$9.99 OTP | One-time purchase, iCloud-native |
| Screvi | Memory / Highlighting | $4.99/mo or $199 Lifetime | SM-2 + semantic search |
| Instapaper | Minimalist Reading | Free / $5.99/mo Premium | Clean typography + e-ink sync |

---

*Full Gemini research output available in original document. This file contains the analyzed findings relevant to the Rabbit Hole master plan.*
