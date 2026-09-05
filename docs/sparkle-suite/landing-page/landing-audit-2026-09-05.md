# Sparkle Suite landing-page audit — September 5, 2026

## Decision summary

Keep the brand. Improve the product demonstration, reading rhythm, and path to joining the build queue before adding decorative motion. The current page is recognizable and restrained, but its unusually narrow oversized headlines and reduced desktop screenshots make the product harder to understand than it needs to be. Animation alone would not resolve that.

This is an audit and proposed design brief, not a released redesign. No application code, prices, checkout behavior, customer data, domain mappings, or production configuration changed in this audit.

## Louis's requirements

- Preserve all existing functionality, including sign-in, intake/consent, public Nic-Nac, pricing/checkout contracts, legal links, and the rest of Sparkle Suite.
- Stay within the current colors and brand identity. Different uses of those colors and stronger copy are welcome.
- Replace the dormant “coming soon / waitlist” framing with an active message: sites are being built now; sign up for a spot in line.
- Show **“19 founder spots remaining.”** Do not say “19 of 20.” Louis supplied the business count: Kim is the one founder so far. This audit did not independently inspect production payment records.
- Invite early participation and the founder discount without a fabricated deadline, fake countdown timer, or implication of a lifetime discount.

## Scope and evidence

Reviewed the actual live homepage, its `/prelaunch#waitlist` destination, the public Nic-Nac panel controls, and the signed-out `/login` destination using the in-app browser. Inspected the matching local implementation at `f61d3a9b0d47079451958b315c5ce810a8199db1`, branch `codex/nic-nac-trade-hardening`.

Desktop capture: 1440 × 1000 viewport. Phone capture: 390 × 844. Additional 320px narrow-phone DOM reflow check. Browser viewport restored afterward. No form, assistant question, payment, or contact handoff was submitted; no personal account was used.

Fresh screenshots are preserved locally:

- `artifacts/landing-audit-2026-09-05/desktop-landing.png`
- `artifacts/landing-audit-2026-09-05/desktop-hero.png`
- `artifacts/landing-audit-2026-09-05/mobile-landing.png`
- `artifacts/landing-audit-2026-09-05/mobile-waitlist.png`

The captures show real production content, not proposed designs. Desktop hero and mobile waitlist saved images were reopened and inspected. Full-page captures were visually inspected during browser capture.

## Journey assessment

| Step | Observed experience | Assessment |
| --- | --- | --- |
| 1. Understand the offer | Broad customer-experience promise, one CTA, real Dance Floor screenshot | Clear brand; insufficiently concrete offer and product context |
| 2. Explore customer sites | Three tilted static desktop screenshots | Shows variety, but repeats the same composition and is hard to inspect on phones |
| 3. Understand rep tools | One long paragraph plus a small Nic-Nac screenshot | Important value buried in a list; little demonstration of individual tools |
| 4. Evaluate price | Standard rate and clear first-checkout arithmetic | Honest breakdown; included value and founder opportunity missing here |
| 5. Join | CTA reaches the waitlist form after navigation settles | Functional destination; older branding, founder-pricing story, and optional-field clarity need alignment |
| 6. Ask a question | Panel opens, focuses the input, minimizes, reopens, and closes | These controls worked; response and contact-delivery paths were not submitted |
| 7. Return as a customer | Sign-in link reaches email/password and Google options | Entry preserved; authenticated journey not exercised |

## What should stay

The single S seal; warm-white/blush backgrounds; brown/plum ink; pink emphasis; Playfair Display/DM Sans direction; genuine product imagery; direct CTA; transparent setup/monthly/first-checkout pricing; distinct sign-in utility; public Nic-Nac; and independence disclaimer.

The goal is a more compelling Sparkle Suite, not a different company's identity. Public marketing styling must remain scoped so it cannot unintentionally restyle customer sites, the workspace, login, or legal pages.

## Findings, in priority order

### 1. Align availability, price, and next-step expectations

The homepage currently advertises standard $74.99/month plus $49.99 setup and $124.98 first checkout. Its CTA leads to an older prelaunch page that also offers $49.99/month for the first 12 paid service months, then $74.99/month, with $99.98 first checkout before applicable taxes/extras. The two pages give an incomplete or inconsistent picture of the opportunity.

Use one verified availability/pricing source across the homepage, intake page, public assistant answers, and checkout. Retain the actual amounts, billing duration, setup-fee disclosure, and tax explanation unless separately changed. Joining the build queue must not imply that a discounted paid slot has already been secured.

### 2. Treat the founder count as operational data, not decorative copy

Use Louis's preferred public label: **19 founder spots remaining.** His supplied count is a business input, not independently verified payment evidence.

Before making the counter live, reconcile the qualifying founder record and existing checkout reservations. The checkout already uses `assign_sparkle_suite_checkout_pricing` and a release path for failed/expired reservations. Reuse that allocation policy rather than counting all accounts or all subscriptions.

Exclude internal/demo/test accounts and unpaid waitlist entries. Decide explicitly how active reservations affect availability and how expired reservations are released. Do not reopen a historical founder slot on cancellation unless that matches the business policy. Publish only aggregate availability, not customer identities. If availability cannot be fetched reliably, hide the numeric claim rather than showing a stale invented number. Test zero remaining, last-slot concurrency, stale cache, and unavailable-data states.

### 3. Tighten the hero so the product has room to sell

At 390px, the H1 is approximately 70px and 387px tall; the CTA begins around 657px down the document and the product screenshot around 735px. At desktop size, the same sentence is squeezed into six lines. This is expressive, but the visitor spends much of the first screen reading a broad promise.

Use a shorter headline, more natural line length, and a product visual whose main behavior is understandable at a glance. Start visual exploration around a 44–52px phone headline, then tune to real content; do not blindly impose that size on every breakpoint. The existing brand promise can remain as supporting copy elsewhere.

The H1 also overrides the configured display-font variable with a literal family name in `app/globals.css:4565`. Other headings use the configured variable. Verify the actual rendered font and remove that inconsistency in implementation; this audit does not claim a confirmed fallback-font diagnosis.

### 4. Replace passive screenshot browsing with a guided product demonstration

The customer-site previews are three raster images, not selectable themes. On mobile, they consume a substantial vertical stretch while their text is too small to explain the product. The rep-workspace screenshot shrinks a 1907px-wide interface to roughly phone-content width.

Recommend a deliberate, keyboard-accessible theme selector with one larger real preview and clearly named options. Preserve all showcased options. Use mobile-specific captures or focused crops on phones, not a miniature full desktop dashboard. Add visible explanatory text outside images.

Use real, current, synthetic/reviewer product captures. Existing screenshots include old Trade Board wording and small stale/empty-looking queue or calendar details; replace those with truthful current demonstration states, not fabricated customer activity.

### 5. Build a clearer product story before asking for the purchase

The live homepage jumps from customer-site appearance to a dense workspace paragraph and then pricing. There is no concise walkthrough showing how the pieces work together, no visible included-features list in the pricing card, and no static FAQ. The content file contains an `included` array, but the landing component does not render it.

Use three outcome-led sections: a site that feels like your brand; a show customers can follow; practical help behind the scenes. Give Live Queue, Dance Floor, and Live Calendar concise, concrete demonstrations. Position Nic-Nac as helpful support, not the entire product.

Add short, visible answers about setup, domains, mobile operation, the founder rate, and what happens after joining. Ground each answer in the actual operating contract. Nic-Nac should supplement these answers, not be the only way to find them. Use real testimonials only with permission; do not fabricate proof or sales claims.

### 6. Repair three placeholder destinations

Sparkle Finder, YouTube, and TikTok all have `href="#"` in the rendered footer and `lib/sparkle-suite/public-landing-content.ts:116`. They do not take visitors to those services. Verify the correct official destinations before wiring them. Do not guess accounts or silently remove useful functionality.

### 7. Public assistant contact handoff has a persistence gap

Source inspection found `handleHandoffSubmit` in `app/_components/sparkle-suite-public-nic-nac.tsx:162` only calls `setHandoffSaved(true)`. It does not persist the entered name/email/question or submit a handoff. The displayed success copy nevertheless says it is saved for Louis to review.

This is a source-confirmed gap, not a live-submission result. Treat it as a separate scoped functional repair with real receipt verification, or make the temporary behavior unambiguous. A visual redesign must not obscure the issue or claim the handoff was tested end to end.

### 8. Make optional intake fields obviously optional

The waitlist form has name and email required. Phone, TikTok handle, and team rep name are optional in the DOM, but their visible labels do not say so; only the long free-text question visibly says optional. Mark the optional fields explicitly and consider progressive disclosure while retaining the data contract. Preserve consent labels, defaults, validation, and privacy links; changing them is not merely visual cleanup.

The CTA did correctly settle at the form anchor. An initial navigation screenshot showed the top of the old page before the anchor settled; this was not treated as a broken link.

### 9. Correct contrast within the existing palette

The 13px primary button text is `#fff6fb` over a pink gradient from `#ff4cae` to `#d81b87`. Calculated endpoint ratios are about 2.87:1 and 4.48:1. The 11px pink eyebrow `#ee2c9b` against `#fcf8f6` is about 3.64:1. These small text treatments need a darker pink/text pairing. Body ink `#775d57` on `#fcf8f6` is about 5.70:1.

These are source-color calculations, not a full pixel-by-pixel accessibility certification. Normal text generally needs 4.5:1 under [WCAG's contrast criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Retain brand hues but adjust their application. Also verify focus visibility, minimum target spacing, zoom, and assistive-technology behavior in the implementation pass.

### 10. Optimize the proof imagery before adding motion

The five displayed PNG assets total 4,003,062 bytes (about 4MB of source files); the three theme images alone account for about 3.13MB. The markup serves ordinary images without responsive sources or lazy-loading attributes. This is an optimization opportunity, not a measured mobile load-time or Core Web Vitals failure.

Use suitable compressed responsive images, explicit dimensions/aspect ratios, and deferred below-fold assets. Preserve sharp real UI at each display size. Measure LCP/CLS/INP and slow-device behavior after implementation. Avoid shipping a large autoplay background video just to create energy.

### 11. Check feature availability before making stronger claims

The public page promises email/SMS updates. Current help guidance says readiness varies by account and requires distinguishing coming-soon, sandbox, and production-ready states. This audit did not inspect all production account entitlements. Do not turn that into a universal “send updates now” claim without verifying availability.

## Recommended creative direction: warm, editorial, product-led

Keep blush and warm white as the main canvas. Use the existing deep brown/plum for one purposeful high-contrast feature stage and pricing, with pink reserved for action and emphasis. Mix open layouts with a few well-composed panels rather than making every section another large rounded card.

Proposed hero copy for visual exploration:

> Now building Sparkle Suite sites
>
> Your brand. Your show. A setup that shines.
>
> Give customers a beautiful place to find your next live, follow the queue, and browse the Dance Floor—with helpful tools behind the scenes for you.
>
> Join the build queue
>
> Sign up to get your spot in line.

Proposed founder message:

> 19 founder spots remaining.
>
> Get in at the start. Secure your founding rate before the spots are gone.

Place the actual founder price, 12-paid-month duration, subsequent standard rate, and one-time setup fee beside that message. Explain when the discount is secured. Avoid “locked forever,” fake countdowns, or implying that simply entering the intake queue guarantees a founder slot.

The suggested CTA changes copy, not the underlying intake route. Its confirmation and any automated follow-up content must also be checked for obsolete “we haven't launched” language before release.

Suggested page order: concise hero and readable product preview; customer-site style selector; real show-tools walkthrough; Nic-Nac demonstration; founder availability and transparent pricing; short FAQ; final build-queue CTA. Keep sign-in and legal navigation accessible throughout.

## Motion plan

- One short hero entrance with a stable, immediately readable headline and CTA; no character-by-character typing.
- Theme previews crossfade when the visitor chooses an option. No auto-advancing carousel required to read content.
- A short, clearly labeled product demonstration showing a genuine queue/calendar/Dance Floor interaction with synthetic data. Play/replay controls; no fake live activity.
- Restrained section reveals and button hover/focus feedback. Content remains available when scripts fail.
- No scroll hijacking, endless floating cards, mouse-follow cursors, flashing glitter, or bouncing scarcity numbers. Mobile gets a lighter treatment.
- Respect reduced-motion preferences with useful static states. Existing global CSS already reduces animation/transition durations; JS-driven smooth scrolling must also be checked. [W3C's motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) supports making nonessential interaction animation disableable.

As a focused comparison, [Beacons](https://beacons.ai/) currently puts a short promise, concrete audience explanation, product examples, and a clear action near the top, then separates outcomes. Borrow that clarity and product emphasis, not its palette, creator positioning, customer claims, or exact layout.

## Functional preservation and implementation gate

Before code, produce a high-fidelity desktop/mobile visual direction using the current brand and actual product captures. Louis should be able to judge the intended result before a broad page rewrite.

Implementation should preserve URLs, form contracts, consent, validation, analytics hooks, legal disclosures, sign-in behavior, Nic-Nac controls and state, and checkout allocation/billing behavior. Additive visual controls must be keyboard usable and have static fallbacks. A founder counter must read the existing allocation truth without creating reservations or touching payment objects from a page view.

Verification must cover both CTA placements, settled anchor navigation, successful and invalid intake using safe reviewer data, consent persistence, duplicate-submit behavior, confirmation copy, assistant open/minimize/reopen/close/Escape and real handoff receipt when repaired, signed-out and authorized synthetic signed-in routing, accurate founder availability and sold-out state, mobile/tablet/desktop reflow, reduced motion, focus/keyboard/zoom, image stability, and unchanged customer/workspace routes. Never use a real charge, personal account, or customer message as a test.

No conversion analytics, user research sessions, live payment records, exhaustive accessibility testing, or performance tracing were collected here. Sales improvement is a design hypothesis to measure, not a promised result.
