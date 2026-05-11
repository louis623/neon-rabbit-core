# Research #6 — Android-First vs. Simultaneous Launch Strategy

**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when analyzing this specific research piece
**📁 UPLOAD TO PROJECT:** No — reference doc, not needed every session
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context)
**🔄 UPDATE TRIGGER:** N/A — research snapshot, does not change

**Source:** Gemini Deep Research | **Date:** April 6, 2026 | **Status:** ✅ Analyzed

---

## Research Summary

Strategic analysis of platform prioritization for a content curation app: Android-first phased rollout vs. simultaneous iOS + Android launch. Covers market dynamics, developer costs, regulatory landscape (DMA, anti-steering), App Store compliance risks, background execution differences, and monetization implications for a solo developer on Flutter.

---

## Key Findings Banked for Decision Round

1. **Simultaneous launch recommended.** iOS holds 63% US market share. Target demo skews iOS. iOS users spend 2.5x more on OTP ($1.08 vs $0.43 RPI). Delaying iOS yields the most profitable segment. Resolves OD-10.

2. **Mac Mini M4 is Gate 1 infrastructure.** $599, pays for itself in ~7 months vs cloud CI/CD. Also enables local LLMs. Prerequisite for simultaneous launch.

3. **App Store Guideline 4.2.2 is a real risk.** 40% initial rejection rate. RSS readers vulnerable to "minimum functionality" rejections. Mitigations: native bottom tab nav, offline caching, widgets, push notifications, privacy labels.

4. **US anti-steering 0% commission window.** Epic v. Apple allows Stripe web checkout at 0% commission (temporary, expected to finalize late 2026). Time-sensitive opportunity. Tension with Research #3 (native IAP for under $20).

5. **iOS vs Android background execution differs.** iOS BGTaskScheduler is "polite" — stops if user swipes app. Android WorkManager more reliable. Feed merging must be server-side. Validates proxy/Edge Functions architecture.

6. **Timeline: ~24 weeks for simultaneous.** Planning (2wk) + UI/UX (5wk) + Core dev (12wk) + QA (4wk) + Submission (1-2wk). vs. ~15 weeks Android-only.

7. **Flutter maturation helps.** Impeller complete for Android, Thread Merge reduces latency 1-2ms, WebAssembly default for web, @JsonCodable macros for feed parsing.

8. **Student market confirmed.** 71.5% read papers multiple times/week, 34.8% prefer mobile, prefer fixed academic-term costs. Validates OTP.

9. **EU DMA creates alternative distribution.** Alternative marketplaces allowed in EU. Complex fee structure. Connects to Research #8.

10. **Privacy nutrition labels are a rejection trigger.** Inaccurate disclosure of analytics/email collection = common rejection cause.

---

## Open Decisions Generated

| # | Decision | Blocked By |
|---|---|---|
| OD-25 | Mac Mini M4 purchase timing | Budget decision (Louis) |
| OD-26 | US anti-steering payment strategy — Stripe 0% vs native IAP 15% vs both | Legal timeline + Research #3 tension |
| OD-27 | iOS compliance step placement in build sequence | Build sequence restructuring |

## Research Gaps Generated

| # | Gap | Action |
|---|---|---|
| RG-18 | Anti-steering ruling timeline — when does 0% window close? | Monitor legal developments |
| RG-19 | Home screen widget feasibility in Flutter for Gate 1 | Technical spike during Step 1 |

---

## Market Share Data

| Region | iOS (2026) | Android (2026) | Primary Driver |
|---|---|---|---|
| United States | 63.03% | 36.77% | High-income / Education |
| North America avg | 58.00% | 41.00% | Ecosystem loyalty |
| Global | 17.00% | 79.00% | Affordable device variety |
| Europe | 37.00% | 62.00% | Regulatory shifts / DMA |

## Cost Comparison — Mac Mini M4 vs Cloud CI/CD

| Method | Initial Cost | Monthly Cost | First-Year TCO |
|---|---|---|---|
| Mac Mini M4 (local) | $599 | ~$5 electricity | $659 |
| Codemagic (1,500 min/mo) | $0 | $95 | $1,140 |
| GitHub Hosted Runners | $0 | $93 | $1,116 |

## Launch Timeline Comparison

| Phase | Phased (Android-first) | Simultaneous | Delta |
|---|---|---|---|
| Planning & Research | 2 weeks | 2 weeks | — |
| UI/UX Design | 3 weeks | 5 weeks | +2 weeks |
| Core Development | 8 weeks | 12 weeks | +4 weeks |
| QA/Testing | 2 weeks | 4 weeks | +2 weeks |
| Store Submission | 1 day | 1–2 weeks | +1-2 weeks |
| **Total** | **15 weeks** | **24 weeks** | **+9 weeks** |

---

*Full Gemini research output available in original document. This file contains the analyzed findings relevant to the Rabbit Hole master plan.*
