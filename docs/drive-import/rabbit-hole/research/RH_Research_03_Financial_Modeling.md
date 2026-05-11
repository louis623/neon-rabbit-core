# The Rabbit Hole — Research #3: Financial Modeling & Monetization Strategy

**Version:** 1.0 | **Created:** April 6, 2026 | **Status:** COMPLETE

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when needed (reference doc for pricing/build sessions)
**📁 UPLOAD TO PROJECT:** No — reference doc, not needed every session
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context for Stripe/IAP integration)
**🔄 UPDATE TRIGGER:** Pricing session locks final numbers, or infrastructure costs change materially

---

## Research Summary

**Source:** Gemini Deep Research (April 2026)
**Prompt Topic:** One-time purchase financial modeling for a consumer content curation app (Flutter + Supabase)
**Key Question:** Is the one-time purchase model financially sustainable at scale, and what should the pricing architecture look like?

---

## Competitive Landscape

### RSS and Feed Aggregation Benchmarks

| Application | Platform | Monetization Model | Price Point | Core Value Proposition |
|---|---|---|---|---|
| Reeder (Classic) | iOS/macOS | One-Time Purchase | $4.99–$9.99 | Premium native UX; version-locked |
| NetNewsWire | iOS/macOS | Free (Open Source) | $0.00 | Privacy; native performance; no cloud overhead |
| VimRSS | Web/Mobile | One-Time Purchase | $9.00 | Minimalist; keyboard-centric; hosting recovery |
| GoodLinks | iOS/macOS | One-Time Purchase | $4.99–$9.99 | Save-for-later; native Apple integration |
| Lire | iOS/macOS | One-Time Purchase | $4.99–$9.99 | Full-text caching; offline accessibility |
| Inoreader | Cross-Platform | Subscription | $9.99/month | Power-user automation and intelligence |
| RSS.app | Web | Subscription | $8.32/month | Social media to RSS conversion |

Reeder — the dominant Apple RSS client — recently moved from one-time purchases ($4.99–$9.99 per major version) to a low-cost subscription ($1.00/month or $10.00/year), signaling that even polished native apps struggle to sustain long-term development without recurring revenue when integrating high-velocity social feeds.

Cloud-first aggregators (Feedly, Inoreader) justify subscriptions through server-side rules, filters, and high-frequency polling — features that consume continuous compute resources. Feedly Pro starts at $6.00–$8.00/month; Inoreader Pro is $7.50/month billed annually.

### PKM/Note-Taking Benchmarks

GoodNotes 6 offers a "Special Edition" for $35.99 as a perpetual license, with a subscription tier ($9.99/year) for cross-platform sync and AI features. This suggests the one-time purchase threshold for comprehensive tools can exceed $10.00 if perceived longevity is high.

Obsidian maintains a free core app but charges $4.00–$8.00/month for proprietary sync. Key insight: users are often willing to pay a one-time fee for the software interface but expect recurring or usage-based fees for cloud sync or compute-heavy components. The Rabbit Hole's Gate 3 BYOK model (connect your own Claude account) elegantly bypasses this by offloading variable AI cost to the user.

---

## Cost-per-User Modeling

### Infrastructure Cost Structure

| Component | Supabase Pro Included | Overage Rate | Relevance |
|---|---|---|---|
| Database Storage | 8 GB | $0.125/GB | Source metadata and text |
| File Storage | 100 GB | $0.021/GB | User-saved content (Gate 2) |
| Network Egress | 250 GB | $0.09/GB | Syncing feeds and saved content |
| Auth (MAUs) | 100,000 | $0.00325/MAU | User management |
| Edge Function Invocations | 2 Million | $2.00/Million | AI messages and feed logic |
| Vercel Fast Data Transfer | 1 TB | $0.15/GB | Web/API hosting |

### Standard User Profile Assumptions

50 RSS/YouTube/Substack sources, 100 articles fetched per month, 20 items saved to Memory Space (Gate 2). Results in approximately 2 MB database storage and 5 MB network egress per user per month.

### Multi-Scale Cost Projections

**Scenario 1 — Incubation Phase (100–1,000 Users):**
- Total monthly cost: $45.00 ($25 Supabase Pro + $20 Vercel Pro)
- Cost per user (at 100): $0.45
- Cost per user (at 1,000): $0.045
- Analysis: Fixed costs dominate. Primary goal is conversion to cover the $540/year infrastructure floor.

**Scenario 2 — Traction Phase (10,000 Users):**
- Database storage: 20 GB (12 GB overage) → $1.50
- Bandwidth: 50 GB (within 250 GB limit) → $0.00
- Auth MAUs: 10,000 (within 100K limit) → $0.00
- Total monthly cost: $46.50
- Cost per user: $0.00465
- Analysis: Maximum efficiency. Marginal cost of adding a user is virtually zero — still living within the prepaid $45/month shell.

**Scenario 3 — Scale Phase (100,000 Users):**
- Database storage: 200 GB (192 GB overage) → $24.00
- Bandwidth: 500 GB (250 GB overage) → $22.50
- Auth MAUs: 100,000 (at exact limit) → $0.00
- Total monthly cost: $91.50
- Cost per user: $0.000915
- Analysis: Even at massive scale, cost to serve a non-AI user is less than one-tenth of a cent per month. A $4.99 one-time purchase can theoretically fund a user's presence for decades.

### The Treadmill Verdict

At $0.005/month per user (conservative estimate including support overhead), the 10-year serving cost is $0.60. A $4.99 Gate 1 purchase (net ~$4.24 after 15% Apple commission) funds over 70 years of hosting. **The treadmill problem is largely a myth for text-based apps on modern serverless infrastructure.** The real ongoing cost is developer labor and feature development, not infrastructure.

---

## Commission Impact and Platform Selection

### Net Revenue per $9.99 Purchase

| Payment Method | Platform Fee | Processing Fee | Net Revenue | Notes |
|---|---|---|---|---|
| Apple IAP (Small Biz) | 15% ($1.50) | $0.00 | $8.49 | Zero friction; high trust; handles VAT |
| Google IAP (Small Biz) | 15% ($1.50) | $0.00 | $8.49 | Native Android integration |
| Google External Link | 10% ($1.00) | 3% ($0.30) | $8.69 | $0.20 gain; requires web redirect |
| US External Link (Temp) | 0% ($0.00) | 3% ($0.30) | $9.69 | Currently in legal flux (Epic v. Apple) |
| China IAP (Small Biz) | 12% ($1.20) | $0.00 | $8.79 | New 2026 rate for regional compliance |

### The Friction Discount

External payment links in the US currently offer a temporary 0% commission following Epic v. Apple, but this is legally precarious. Courts have signaled Apple is entitled to a "reasonable" commission (likely 12–27%).

In the EU, the combined fees (Tier 1 Store Services 5% + Core Technology 5% + Initial Acquisition 2% = 12%) plus Stripe/Paddle processing (3–5%) make external payment "savings" evaporate or go negative.

**Critical insight:** For one-time impulse purchases, the conversion rate drop from an external redirect is typically 15–30%. A 15% drop in conversion is far more damaging than a 15% commission.

**Recommendation:** Use native IAPs for all Gate purchases under $20.00. External payment links only make sense for a "Lifetime Bundle" priced at $49.99+ where the absolute dollar saving per transaction ($7.50+) justifies the conversion risk.

---

## Pricing Psychology — The Decoy Effect

### Recommended Three-Gate + Bundle Architecture

| Option | Name | Price | Purpose |
|---|---|---|---|
| Gate 1 | Full Reader Unlock | $4.99 | "Impulse" entry point — high volume, low friction |
| Gate 2 | Memory System | $9.99 | "Utility" upgrade — justifiable for researchers/students |
| Gate 3 | AI Power Connector | $19.99 | "Expert" tier — high price anchors value of others |
| Bundle | The Explorer's Pass | $24.99 | The Target — "All 3 for only $5 more than Gate 3" |

Gate 3 acts as the decoy. A user considering Gate 2 for $9.99 sees the $24.99 bundle and perceives massive savings, even if they didn't initially want AI features. This is the "Asymmetric Dominance" pricing strategy.

### Student/Educator Price Sensitivity

- "Affordability" threshold for students: one-time payment below $25.00–$35.00
- Above this threshold, 25% more likely to seek free alternatives
- Students with high "mobile innovativeness" are significantly less price-sensitive
- 71% of students would continue using a favorite app if it transitioned to paid at an "affordable" price

---

## Conversion Rate Benchmarks

| Metric | Standard | Target | High Performance |
|---|---|---|---|
| Download to Activation | 25–35% | 30% | 35%+ |
| Active User to Paid (OTP) | 3–5% | 5% | 8–12% |
| Hard Paywall Conversion | — | 10.7% | — |
| Soft Paywall (Freemium) | — | 2.1% | — |

**Key finding:** Hard paywalls (limiting core features immediately) see 5x better conversion than pure freemium (10.7% vs. 2.1%). This validates The Rabbit Hole's free tier design of 1–2 Rabbit Holes with limited sources.

### Revenue Projections at Target Conversion

| Downloads | Conversion Rate | Paid Users | Gross Revenue (at $15 blended) |
|---|---|---|---|
| 1,000 | 3% (Standard) | 30 | $450 |
| 10,000 | 5% (Target) | 500 | $7,500 |
| 100,000 | 8% (High Perf) | 8,000 | $120,000 |

---

## Gate 2 & Gate 3: AI Cost Management

### Gate 2 — Subsidized AI Allotments

Using Claude Haiku 4.5 ($1.00/M input tokens, $5.00/M output tokens):
- Average summary cost: ~$0.002 per summary (1,000 input + 200 output tokens)
- At 30 summaries/month: $0.06/month per user
- A $9.99 one-time purchase funds this subsidy for 13+ years
- Risk is negligible unless users bypass limits or more expensive models are used

### Gate 3 — BYOK Key Storage Architecture

Research recommends **client-side key storage** (iOS Keychain / Android Keystore) with direct client-to-Anthropic LLM calls. The server handles context/retrieval only.

**Rationale:**
- Server-side key storage creates catastrophic breach risk (thousands of user API keys)
- Serverless execution costs for proxying are minor ($2.00/M invocations) but perpetual
- Proxying introduces SSRF and prompt injection attack surface
- Client-side storage can be marketed as a privacy feature

**Recommendation:** Gate 3 marketed as "AI Power User License." Connect fee ($14.99–$19.99) covers Vector Database storage (pgvector) for the user's Memory Space embeddings.

---

## Long-Term Revenue Strategy — Versioned Upgrades

To avoid the one-time purchase "stagnation" problem:

1. **Version stability:** Each one-time purchase covers all updates for a major version (e.g., v1.x)
2. **Maintenance commitment:** Critical bug fixes and OS compatibility updates for the life of the version
3. **Upgrade path:** Major new features (v2.0, v3.0) released as new one-time purchase with "legacy discount" for existing users
4. **Cadence:** Every ~24 months
5. **Effect:** Creates subscription-like cash flow without recurring auto-pay friction

This follows the "Reeder Legacy" model that sustained that app for years before they moved to subscriptions.

---

## Key Decisions Banked for Decision Round

1. **OTP model confirmed viable** — math is decisive, not marginal
2. **Pricing starting points** (not locked): $4.99 / $9.99 / $19.99 / $24.99 bundle
3. **Native IAP as primary mobile payment** — Stripe for web only
4. **Gate 3 client-side key storage** — contradicts current plan's "all through backend" approach; hybrid recommended
5. **Supabase-only caching sufficient through 100K users** — Redis not needed for MVP
6. **Hard paywall design validated** — 5x better conversion than freemium
7. **Versioned upgrade model** — add to plan as long-term revenue strategy

---

## Research Gap Resolved

- **RG-1 (Cost per user per month):** ~$0.0009 at scale for non-AI users; ~$0.06/month for Gate 2 AI subsidy users

---

*This research document is a reference copy. Key findings and decisions are also captured in Open Brain for cross-session continuity.*
