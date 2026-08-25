# Initial Research Brief

Initial pull date: 2026-05-28

## Working Thesis

The customer-side Sparkle Suite product should be treated as a separate product surface built on top of Sparkle Suite's jewelry database and rep network, not as a direct extension of a single rep's trade board.

The likely product center is:

- collector identity
- collection display
- trusted trade intent
- jewelry discovery
- rep-first matching and lead generation
- marketplace/community safety

## What Seems Decided

- The rep-side product remains the first priority.
- Customer/collector side is real long-term scope, not a throwaway idea.
- The customer side is broader than a trade board.
- The jewelry database is the strongest shared substrate.
- Rep board data should support future customer portal search.
- The current rep board does not handle money or shipping.
- Current rep trade rules are intentionally narrow and should not be assumed sufficient for customer-to-customer trades.
- Any marketplace, buy/sell, revenue share, credit, or payment behavior requires a separate planning phase.

## What Seems Likely

- Customers will need real accounts or durable profiles, not just form submissions.
- Customer collections will need ownership states, visibility controls, and photo/source metadata.
- The product will need a trust layer before any customer-to-customer trading is credible.
- Reputation, scam protection, dispute handling, moderation, and listing quality rules belong near the core of the product, not as late decorations.
- Customer-to-customer shipping differs from current rep fulfillment and probably needs its own logistics model.
- Search and discovery will matter as much as posting.
- Reps should benefit from the customer side, either as lead recipients, trusted sellers, moderators, revenue-share participants, or inventory sources.
- Matching should check rep trade boards before customer-to-customer matches so customer demand flows back to the reps who feed and fund the ecosystem.

## Major Product Lanes

### 1. Collector Profiles and Collections

Customers can show what they own, what they want, and what they are willing to trade. This lane creates community behavior even before money changes hands.

Research needs:

- private vs public collection visibility
- wishlist vs owned vs for-trade states
- proof-of-ownership expectations
- whether customers upload their own photos or map pieces to catalog entries
- how to handle uncataloged pieces

### 2. Master Jewelry Discovery

Customers search the full Sparkle Suite jewelry database and discover pieces, availability, collectors, and reps.

Research needs:

- catalog search and filters
- canonical design pages
- wanted-piece alerts
- how reps appear in customer search results
- how to avoid implying official Bomb Party catalog status

### 2A. Rep-First Wishlist Matching

When a customer's wishlist item appears on a rep's dance floor / trade board, Sparkle Suite should be able to notify that customer and show the rep's next scheduled show.

Research needs:

- matching wishlist items against active rep trade listings
- notification channels and consent requirements
- how to prioritize reps when multiple reps have the same wanted piece
- how to show next-show information without turning the customer side into a checkout flow
- whether customers can follow reps, collections, or specific pieces

### 3. Customer Trade Board

Customers list pieces they own and want to trade with other customers. This is materially different from the rep board because neither side starts with the rep holding one piece already.

Research needs:

- matching model
- shipping model
- proof / verification requirements
- escrow or no-escrow stance
- dispute handling
- cancellation rules
- scams and bad actor prevention

### 4. Buy/Sell Marketplace

This is the highest-risk lane. It may become valuable, but it pulls in payment processing, platform liability, tax/reporting, consumer protection, dispute handling, and possible conflicts with Bomb Party policies or norms.

Research needs:

- whether Sparkle Suite should ever process money
- whether buy/sell should start as inquiry-only
- whether reps participate as sellers, affiliates, or referral recipients
- fees, revenue share, and credit model options
- prohibited items and moderation rules

### 5. Community Feed

A social feed could help collectors show off reveals, celebrate collections, and drive discovery. It also introduces moderation and safety work.

Research needs:

- post types
- comments and reactions
- moderation queue
- reporting
- blocked users
- rep/team community spaces vs global feed
- content ownership

## Important Constraint From Existing Product

The current rep-side architecture captures:

- canonical jewelry design
- rep listing
- customer request
- fulfillment state
- customer audience consent

The customer-side architecture likely needs:

- customer account
- customer-owned collection item
- wanted item
- customer listing
- trade proposal
- evidence/proof attachments
- reputation event
- dispute/report
- moderation action
- notification preference

The existing schema can inform this, but it should not be stretched until it distorts.

## Early Recommendation

Research should proceed in this order:

1. Define the customer trust and transaction boundary.
2. Map the existing jewelry database into customer collection/search use cases.
3. Decide whether the first customer MVP is collection showcase + wishlist, not trading.
4. Design the customer trade flow only after proof, shipping, and dispute rules are understood.
5. Treat buy/sell and credits as later-risk research, not first MVP.
