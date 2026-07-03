# Current Assumptions

Initial pull date: 2026-05-28

These are working assumptions for research only unless a later decision note marks them as locked.

## Assumptions With Strong Source Support

- The customer side is future scope and should be planned separately from the rep-side launch.
- The customer side should not block active `neon-rabbit-core` launch work.
- The customer hub working name is Sparkle Finder.
- Sparkle Finder should use an `SF` circular seal inspired by the Sparkle Suite `S` seal.
- Sparkle Finder should use the Sparkle Suite Amethyst customer-facing site skin as the visual direction for the simplified mobile-first app redesign, while keeping Sparkle Finder as the customer-facing product brand.
- Sparkle Finder's current homepage/UI direction is a simplified mobile-first app home: open with "Find the pieces you love. Build your collection with Sparkle Finder.", use a primary Find a Piece action, flow into My Collection / Bling Vault, and keep Nic-Nac as a helper layer rather than a homepage destination.
- The customer side is more than a trade board. For v1, it is a secured discovery hub for reps, live shows, rep trade boards/dance floors, and the master jewelry library.
- The existing Sparkle Suite jewelry database is a core asset for the customer side.
- Current rep-side trade board rules are intentionally narrow.
- Neon Rabbit has historically preferred not to be the money or shipping middleman for the rep trade board.
- Any customer-side marketplace must research revenue share, disputes, scam protection, and trust before implementation.

## Assumptions That Need Validation

- First customer MVP should be a secured discovery hub, not customer-to-customer trading.
- Customer buy/sell is deferred.
- Customer-to-customer trading is deferred.
- Customer accounts should be global to Sparkle Suite, with optional relationships to reps.
- New customer accounts should start with a 45-day Silver trial by default, then downgrade to Free if they do not upgrade.
- Phone numbers may be collected for identity, recovery, verification, trial abuse prevention, and security notices, but marketing SMS requires a separate optional opt-in.
- Sparkle Finder should not sell customer personal information.
- Promotional email consent should be separate from account/security email.
- Logged-in Free customers can browse Sparkle Suite rep live calendars, aggregated rep trade boards/dance floors, and the master jewelry library after any trial or paid Silver access ends.
- Logged-in Free customers can find diamond and unicorn labels inside the Master Jewelry Library through filters and search, not through a separate standalone library surface.
- Sparkle Suite should not create its own rarity ratings or rarity scoring for Diamonds & Unicorns.
- Public visitors should see a landing/teaser only; the useful hub requires login.
- Customer paid membership should be called Silver Membership, not Plus.
- Silver Membership is monthly only, cancel anytime, active until the end of the paid month, with no annual plan.
- Silver pricing should target under $5/month, likely `$4.99/month`, because it should feel like less than a cup of coffee.
- Paid Sparkle Suite reps should receive Silver access for free while their rep account is paid and active, implemented as a Silver Membership Billing Credit or equivalent entitlement.
- Sparkle Suite rep data should connect to Sparkle Finder automatically from Sparkle Suite, not through the rep's Silver billing-credit code.
- A rep should have one unified account/profile experience that includes normal Silver customer access plus visible rep identity, such as a rep badge/diamond marker.
- Do not split reps into separate customer and rep accounts. Reps are also collectors and should be treated as Silver members with rep identity layered in.
- Customer-facing Nic-Nac may be a Silver feature for focused search assist: `Nic-Nac, find this for me`.
- Customer profile and customer collection features should be Silver Membership features.
- Shop monetization is paused. Sparkle Finder should not present a shop or paid links for now.
- Showcase Studio can include plain photo setup guidance and an optional non-affiliate light-box resource link.
- Sparkle Finder customer auth has its own product boundary by default. Sparkle Finder may read/link Sparkle Suite product data through approved APIs, but shared login redirects, OAuth fallback URLs, Site URLs, Google OAuth branding, and customer auth user pools require explicit product-specific approval.

## Explicit Non-Assumptions

- Do not assume Sparkle Suite will process payments for customer sales.
- Do not assume Sparkle Suite will provide escrow.
- Do not assume customer-to-customer trades can reuse rep trade fulfillment unchanged.
- Do not assume the current rep same-collection/same-type rule is the right long-term customer trade rule.
- Do not assume AI-generated UI can be used in marketing or planning artifacts as product truth.
