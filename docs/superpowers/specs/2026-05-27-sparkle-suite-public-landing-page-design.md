# Sparkle Suite Public Landing Page Design

Date: 2026-05-27

## Goal

Create the normal public Sparkle Suite sales landing page for `yoursparklesuite.com` after the waitlist stage. The page should sell Sparkle Suite as a polished website and customer-experience tool suite for reps, with a bold product-led presentation inspired by the approved Concept 3 direction.

This spec is for design approval and implementation planning. It does not authorize production deployment by itself.

## Approved Direction

Use the refined Concept 3 as the visual north star:

`docs/sparkle-suite/landing-page/concepts/sparkle-suite-concept-3-refined-no-jewelry.png`

The page should feel:

- bold and sales-forward
- polished and premium without fake luxury
- dynamic, layered, and product-led
- clearly Sparkle Suite, not generic SaaS
- confident enough to prove Sparkle Suite can build excellent customer-facing sites

Keep Concept 3's core moves:

- oversized hero headline
- strong pink primary CTA
- layered cascade of product UI screens
- warm blush Sparkle Suite palette
- warm dark comparison band below the hero
- "less scattered, more polished" story

## Brand Lock

Use the current Sparkle Suite public brand system:

- Display font: Playfair Display
- Body/UI font: DM Sans
- Logo: single italic `S` seal in a light circle
- Primary accent: Sparkle pink
- Backgrounds: blush, warm white, warm paper
- Text: plum/brown ink
- Dark section: warm dark brown panel, not black

Do not use:

- `SS` as the logo
- fake jewelry imagery
- generic SaaS dashboards
- heavy gold or purple-first styling
- neon tech styling
- loud influencer-glam styling

## Audience And Trademark Posture

The page should let the right audience understand that Sparkle Suite serves BP reps without making Bomb Party look like a sponsor, partner, or official brand affiliation.

Rules:

- Do not use `Bomb Party` in the hero headline, page title, main CTA, or visual brand area.
- Use `BP reps` sparingly in lower-page copy where audience clarity matters.
- Use the full `Bomb Party` name only in the disclaimer or a lower FAQ/legal clarification.
- Do not use Bomb Party logos, colors, product photos, screenshots, official language, or trade dress.
- Include a clear footer or FAQ disclaimer:

> Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.

## Page Message

Primary hero line:

> Make your live-show customer experience feel more polished.

Hero support:

> Sparkle Suite gives your customers a beautiful place to find your shows, follow the queue, browse trades, get updates, and stay connected, while Nic-Nac helps you keep the setup moving inside Sparkle Suite.

Primary CTA:

> Get Sparkle Suite

Secondary CTA:

> See What It Does

Lower-page audience clarification, if needed:

> Sparkle Suite provides websites and customer-experience tools for BP reps.

## Page Sections

### 1. Hero

Purpose: prove Sparkle Suite can make a rep's customer experience feel polished.

Content:

- Sparkle Suite brand header with single `S` seal
- hero headline and support copy
- primary and secondary CTA
- large cascade of product UI screens

Hero product screens should show:

- customer site preview
- Live queue
- Trade board
- Live event calendar
- Email update
- SMS update
- Nic-Nac help

Use real Sparkle Suite UI screenshots/mockups where possible. If placeholders are needed in early implementation, they must be code-native UI mockups styled like real Sparkle Suite surfaces, not AI jewelry, generic app cards, or fake product photography.

### 2. Dark Comparison Band

Purpose: make the old pain and new outcome obvious.

Concept:

- left side: scattered links, posts, comments, messages, repeated questions
- right side: polished Sparkle Suite customer path

Tone:

- visually bold, warm dark background
- short copy
- no fearmongering
- no generic software jargon

Possible heading:

> Less scattered. More polished.

### 3. Product Proof Section

Purpose: explain the approved features as customer/rep benefits.

Feature cards:

- Trade board: makes trades easier to browse and request.
- Live queue: makes the line easier to follow during the show.
- Live event calendar: makes upcoming shows easier to find.
- Email updates: keeps customers informed with clearer follow-through.
- SMS updates: helps timely reminders reach customers faster.
- Nic-Nac: helps reps with setup and how-to questions inside Sparkle Suite.

Nic-Nac should be useful and visible, but secondary to the broader Sparkle Suite value story.

### 4. How It Feels For Customers

Purpose: sell customer experience, not software inventory.

Story:

- customers can find what is happening
- customers can follow the show more easily
- customers can stay connected without digging through old posts or messages

This section can use product screenshots, short scenario cards, or a simple customer path.

### 5. How It Helps Reps

Purpose: show the rep-side relief.

Story:

- fewer repeated questions
- fewer scattered details
- cleaner follow-through
- easier setup support through Nic-Nac

Avoid overpromising that all work disappears.

### 6. Pricing / CTA Band

Purpose: move interested reps to purchase.

Use the current approved Sparkle Suite pricing source during implementation. Do not hardcode pricing from memory.

The user agreement acceptance belongs in the sales/checkout workflow, but the landing page should not lead with legal mechanics.

### 7. FAQ / Disclaimer

Purpose: reduce confusion and risk.

Include:

- independent/not-affiliated disclaimer
- what Sparkle Suite is
- who it is for
- what happens after purchase
- where setup/how-to support lives

## Visual Asset Rules

No AI-generated jewelry, rings, gemstones, product photos, or reveal-product imagery.

Use:

- real Sparkle Suite product screenshots where available
- code-native product mockups based on actual built surfaces
- generated abstract page visuals only when they do not imply fake jewelry/product inventory

Potential real source surfaces:

- Amethyst customer homepage
- Trade board
- Join/customer signup
- Live queue surfaces
- calendar/show schedule surfaces
- help/how-to and Nic-Nac surfaces

## Implementation Notes

Likely route:

- New normal public sales route, separate from `/prelaunch`.
- Keep `/prelaunch` intact until Louis explicitly approves replacing or redirecting it.
- The future production domain strategy should be confirmed before deploy.

Use existing repo patterns:

- Next app routing
- existing font variables from `app/layout.tsx`
- Sparkle Suite prelaunch design tokens from `app/globals.css`
- existing checkout route and agreement acceptance behavior

Do not touch:

- `chrome-extension/content.js`
- `supabase/functions/live-queue-sync`
- live provider actions
- `docs/sparkle-suite/marketing/`

## Verification Plan

Before any deploy:

- desktop browser smoke
- mobile browser smoke
- screenshot review against Concept 3 direction
- no fake jewelry or Bomb Party visual assets
- no `Bomb Party` in hero/title/CTA area
- disclaimer present
- CTA path uses Stripe test mode only unless Louis explicitly approves live actions
- `npm run build`
- relevant focused tests for checkout/user-agreement behavior if touched

Production deploy is a separate approval step.

## Open Decisions For Louis

1. Final hero headline:
   - current recommendation: `Make your live-show customer experience feel more polished.`
2. Final route/domain behavior:
   - build as a new route first, then later decide when it replaces the waitlist/prelaunch route.
3. Product screenshot source:
   - use current built demo surfaces first, then upgrade with newer screenshots as the product matures.
4. CTA target:
   - direct checkout, pricing section, or short sales section before checkout.

## Self-Review

- No placeholder `TBD` sections.
- No instruction to use AI jewelry or fake product imagery.
- Trademark posture is explicit.
- Live Queue guardrail is preserved.
- Marketing leftovers are explicitly excluded.
- Production deploy requires separate approval.
