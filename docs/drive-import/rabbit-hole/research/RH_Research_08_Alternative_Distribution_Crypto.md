# The Rabbit Hole — Research #8: Alternative Distribution + Crypto Payments

📍 WHERE THIS FILE LIVES: Google Drive `/Neon Rabbit/`
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed (reference doc)
📁 UPLOAD TO PROJECT: No — reference only
🏷 PROJECT: Rabbit Hole
👤 WHO USES IT: Louis (reference), Claude (on demand), Claude Code (build context)
🔄 UPDATE TRIGGER: New research that supersedes these findings

**Date:** April 6, 2026 | **Source:** Gemini Deep Research | **Status:** ✅ Analyzed and banked

---

## Research Objective

Evaluate alternative distribution channels (beyond App Store/Google Play) and cryptocurrency payment integration for a Flutter-based consumer content curation app targeting students, researchers, and hobbyists. Assess viability for a solo developer on Supabase infrastructure.

---

## Key Findings

### 1. Alternative Distribution Is Real But Not a Replacement
EU DMA enables alternative marketplaces (AltStore, Setapp, Epic Games Store at 0-12% commission), web distribution (0%), and Apple Notarization (automated security check replacing editorial review). Google is TIGHTENING sideloading in September 2026 — mandatory system updates restrict installs from unverified sources. App stores remain primary for Gate 1. Alternatives are sovereignty hedges.

### 2. Apple Core Technology Commission (CTC)
Even when bypassing App Store in EU, Apple charges a percentage-based CTC on purchases. Escaping the App Store doesn't mean escaping Apple fees in the EU. US anti-steering 0% window remains the better near-term play.

### 3. PWA Confirmed as Discovery Portal Only
iOS PWA dealbreakers for feed reader: no Background Sync, 7-day cache purge, 50MB storage cap, no silent push. But PWA conversion rates 36-76% higher than native (no download friction). Strategy: PWA for try-before-download, native for full experience.

### 4. Dual-App Strategy Recommended
Store Version (strict IAP, Stripe) + Sovereign Version (PWA/notarized native, full crypto stack). Keeps stores happy while maintaining independent distribution channel. Mitigates platform retaliation risk.

### 5. USDC on Base L2 Is the Crypto Answer
Sub-second finality, gas under $0.01. Makes $4.99 Gate 1 purchase viable via crypto. Primary crypto rail for Rabbit Hole.

### 6. Crypto Gateway Options
| Gateway | Fees | Model | Best For |
|---|---|---|---|
| BTCPay Server | 0% | Self-hosted (Docker/VPS) | Pure sovereignty |
| Coinbase Commerce | 1% | Managed/hybrid | Base L2 integration |
| NOWPayments | 0.5% | Non-custodial | Broad token support |
| Stripe Bridge | ~1.5% | Managed | Hybrid fiat/crypto |

Solo dev pragmatic path: Coinbase Commerce or NOWPayments to start, BTCPay Server as aspirational migration.

### 7. x402 Protocol Details
Four-step handshake: Discovery → Challenge (HTTP 402 + payment header) → Settlement (agent signs via MPC wallet, returns tx hash) → Fulfillment (server verifies on-chain). Discovery via `/.well-known/agent.json`. Agents paying for discrete summaries could create micropayment revenue exceeding human pricing model.

### 8. Supabase Edge Functions for On-Chain Verification
User pays → Flutter sends TXID to Edge Function → function uses viem/ethers to verify on Base L2 → updates user profile. Same infrastructure as RSS proxy and MCP server.

### 9. Tax Compliance Is Significant
IRS Form 1099-DA (2026): crypto brokers must report. Crypto = ordinary income at FMV. Crypto-to-fiat = capital gains event. Sales tax nexus: 200+ units in a state may trigger obligations. Most significant operational complexity in the crypto strategy.

### 10. Flutter Wasm Default Validates PWA
Near-native performance for data-intensive PWAs. Strengthens discovery portal strategy.

### 11. Android AAB Format Mandatory
Google Play Integrity and Play App Signing mandatory. Direct distribution requires self-hosted update flow.

---

## Impact on Open Decisions

| OD | Impact |
|---|---|
| OD-14 | Substantially informed — USDC on Base, gateway options clear, timing = Gate 2 |
| OD-16 | Substantially informed — app stores primary, alternatives as hedge, dual-app strategy |
| OD-26 | New context — Apple CTC in EU, US 0% window still best play |

## New Open Decisions Created
- OD-31: Crypto gateway selection
- OD-32: Agent discovery manifest (/.well-known/ai vs /.well-known/agent.json)
- OD-33: Dual-App Strategy implementation
- OD-34: Crypto tax compliance approach

## New Research Gaps Created
- RG-22: Sales tax nexus thresholds and compliance tools
- RG-23: Agent discovery manifest standards comparison

## Resolved
- RG-13: ✅ RESOLVED — comprehensive framework provided
