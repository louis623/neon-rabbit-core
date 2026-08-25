# Neon Rabbit Source Map

Initial pull date: 2026-05-28

## Primary Local Sources

### Active Trade Board Knowledge Base

Path: `C:\Users\louis\neon-rabbit-core\docs\drive-import\sparkle-suite\knowledge-base\SS_KB_TradeBoard_v1.0.md`

Useful sections:

- trade board concept
- locked May 5 matching rules
- customer interaction flow
- data captured per transaction
- open questions and research items
- customer-side marketplace parking lot note

Important customer-side signal:

- The rep board is a listing/reservation system, not a transaction platform.
- Customer-side marketplace is Phase 4 scope and requires its own planning phase.
- Open questions remain around shipping, deduplication, OCR, automation layer, and taxonomy.

### Sparkle Suite Knowledge Base v1.8

Path: `C:\Users\louis\neon-rabbit-core\docs\drive-import\archive\sparkle-suite\knowledge-base\SS_Knowledge_Base_v1.8.md`

Useful sections:

- two-sided platform framing
- future customer homepage
- 24/7 jewelry store insight
- Bomb Party jewelry database use cases
- customer portal search
- marketplace parking lot
- SEO/GEO future customer-side research lane

Important customer-side signal:

- The platform has always had a customer/collector side in the long-range vision.
- The rep side is the priority, but the future customer side includes community, trade, and collections.
- The existing jewelry database is the likely shared substrate.

### Master Build Plan v3.1

Path: `C:\Users\louis\neon-rabbit-core\docs\drive-import\archive\sparkle-suite\plans\SS_Master_Build_Plan_v3_1.md`

Useful section:

- parking lot / future trade board ecosystem

Important customer-side signal:

- Future unified trade board ecosystem has three layers:
  1. rep show boards
  2. non-show marketplace / platform-wide persistent trade board
  3. social/team layer
- Future work also calls for a cross-rep economics and logistics design session covering shipping, revenue splits, trust/reputation, and dispute resolution.
- Sparkle Suite Credits were brainstormed as a possible internal credit economy, but this is not accepted product direction yet.

### Supabase Schema v1.1

Path: `C:\Users\louis\neon-rabbit-core\docs\drive-import\archive\sparkle-suite\specs\SS_Supabase_Schema_v1_1.md`

Useful sections:

- `jewelry_designs`
- `trade_listings`
- `trade_requests`
- `trade_fulfillment`
- `customer_audience`
- `sms_wallet`

Important customer-side signal:

- Existing rep-side data model already separates canonical jewelry designs from individual rep listings.
- The current model assumes simple exact match on item number for deduplication.
- Current trade requests are extremely simple and do not include customer photo uploads.
- Current trade fulfillment assumes one-way rep-to-customer shipping after the rep already has the customer's revealed piece. This does not map cleanly onto customer-to-customer trades and must be redesigned.
- Customer audience records already include consent and opt-out timestamps. Customer accounts will need a more robust identity/consent model.

### Open Items

Path: `C:\Users\louis\neon-rabbit-core\docs\drive-import\archive\sparkle-suite\knowledge-base\SS_KB_OpenItems_v1.0.md`

Useful section:

- parking lot ideas

Important customer-side signal:

- Master customer trade board, collection showcase, and community social feed are all explicitly parked as future customer/collector-facing features.

### Sparkle Suite Marketing Brand System

Paths:

- `C:\Users\louis\sparkle-suite-marketing\brand\01-master-brand-spec.md`
- `C:\Users\louis\sparkle-suite-marketing\brand\08-production-site-design-kit.md`
- `C:\Users\louis\sparkle-suite-marketing\approved-assets.md`

Important customer-side signal:

- Approved public hook: `A better customer experience starts with a better rep setup.`
- Current brand is rep-centered, warm, polished, plain-English, and product-truth oriented.
- Product view rule: do not let AI invent Sparkle Suite product UI, customer sites, feature states, workflows, or dashboards.
- Any future public customer-side product visuals need actual product screens, approved demos, or brand-reviewed product mockups grounded in real product facts.

### SMS and Consent Compliance Notes

Path: `C:\Users\louis\sparkle-suite-marketing\compliance\sms\a2p-campaign-denial-remediation-2026-05-14.md`

Important customer-side signal:

- Sparkle Suite is the customer-facing SMS sender identity, operated by Neon Rabbit Digital Services.
- Opt-in language, STOP/HELP handling, non-sale/share of opt-in data, and clear sender identity are already part of the current compliance posture.
- Customer-side social/marketplace messaging will need fresh compliance review before using SMS/email alerts beyond current rep-site audience flows.

## Related Existing Future-Feature Repo Pattern

Path: `C:\Users\louis\sparkle-suite-live-streaming\README.md`

Pattern to reuse:

- separate future-feature workspace
- research and provider evaluation first
- no production code until direction is chosen
- explicit repo boundary against active Sparkle Suite launch work

This new repo follows the same pattern.
