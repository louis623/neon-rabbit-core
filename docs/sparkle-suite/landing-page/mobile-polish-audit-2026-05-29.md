# Sparkle Suite Mobile And Polish Audit - 2026-05-29

## Scope

Audit goal: identify the highest-priority polish, credibility, and mobile-optimization issues across the local post-launch Sparkle Suite landing page and customer onboarding workflow.

Environment:

- Local dev URL: `http://localhost:3000`
- Primary mobile viewport: `390x844`
- Desktop reference viewport used earlier in the same audit: `1440x920`
- Production truth remains unchanged: live production is still `/prelaunch`; the post-launch root landing and self-serve funnel are local-only.

Audited surfaces:

- `/` with `?angle=2` post-launch landing preview
- `/prelaunch`
- `/start`
- `/nic-nac?section=account&onboarding=self-serve-started`
- `/nic-nac?section=setup-checklist&onboarding=self-serve-started`
- `/nic-nac?section=help-resources&onboarding=self-serve-started`
- `/terms-and-conditions`
- `/privacy-policy`
- `/login`
- `/amethyst/Homepage.html`
- `/amethyst/Trade.html`
- `/amethyst/Join.html`
- `/amethyst/Unsubscribe.html`

## Verification Note

The first focused mobile checks rendered the Next.js app routes and produced usable evidence. During the broader rerun, the local dev server began returning a Next.js build overlay for the known missing `sharp` dependency:

`Module not found: Can't resolve 'sharp'` from `lib/services/server-image-quality.ts`.

That blocker must be treated as a P0 verification issue because it prevents reliable local mobile QA across the Next app routes. The static Amethyst pages still rendered enough to audit their mobile layout, but their data/API-backed content can degrade into generic fallback copy while the `sharp` blocker is present.

## Resolution Update - 2026-05-29

The highest-priority launch blockers and mobile polish items identified in this audit have been addressed in the local-only post-launch branch.

Resolved:

- Added the missing `sharp` runtime dependency and revalidated local route loading.
- Removed buyer-facing Nic-Nac assistant load errors, issue/debug badges, and floating assistant controls from purchase-mode onboarding.
- Reworked the landing first impression with a mobile-focused header, clearer `/start` CTA, trust band, and checkout path explanation.
- Neutralized fake-clickable landing mock controls so previews read as product evidence instead of dead actions.
- Reframed `/start` with no-card-yet, no-live-actions, and Stripe-review reassurance; split terms agreement away from account start.
- Polished legal pages with Sparkle Suite-first framing, plain-English summary, return-to-checkout behavior, and larger tap targets.
- Hardened Amethyst fallback/demo identity to avoid `Show Name`, `Rep Name`, and raw placeholder leakage.
- Fixed Amethyst mobile ticker/page-width clipping and unsubscribe/footer touch targets.

Final mobile Browser sweep at a phone viewport (`390x844`) passed for:

- `/?angle=2`
- `/start`
- `/terms-and-conditions?returnTo=/start`
- `/privacy-policy?returnTo=/start`
- `/nic-nac/account`
- `/nic-nac/setup`
- `/nic-nac/help`
- `/amethyst/Homepage.html`
- `/amethyst/Trade.html`
- `/amethyst/Join.html`
- `/amethyst/Unsubscribe.html`

Result: no page-level horizontal overflow, no visible Next.js/framework overlay, no `Issue`/debug placeholder text, and no first-viewport touch targets below the audit threshold.

Remaining product-judgment refinements:

- Further shorten the mobile landing page if Louis wants a faster path to pricing.
- Decide whether the customer-facing Amethyst ticker should stay visually sticky on phone screens or become a calmer static update strip.
- Do a guided live Stripe test-buyer pass with Louis before treating the self-serve funnel as release-ready.

## P0 - Must Fix Before Any Public Self-Serve Launch

1. Remove visible broken assistant/error states from buyer-facing checkout and onboarding.
   - Evidence: mobile and desktop account review showed `Couldn't load your conversation. Tap to retry`, plus a visible `1 Issue` badge and floating Nic-Nac controls.
   - Why it matters: this is the fastest way for the experience to feel unfinished during the payment moment.
   - Recommended fix: hide Nic-Nac until it is healthy, or show a polished unavailable state that does not expose error language. Do not show issue/debug badges on buyer-facing routes.

2. Fix the `sharp` dependency/local runtime blocker.
   - Evidence: rerun of Next routes returned the build overlay for missing `sharp`.
   - Why it matters: local mobile QA cannot be trusted while normal page loads can collapse into a framework error screen.
   - Recommended fix: add/install the dependency or isolate image-quality imports so public/customer routes do not fail when optional image tooling is unavailable.

3. Mobile-optimize the post-launch landing header and first viewport.
   - Evidence: mobile root page stacks the full nav as small text links, with `Sign In` as another line; the proof strip collapses into fragments such as `customers trust`, `they can follow`, `they can browse`.
   - Why it matters: the first screen should feel designed for phones, not like desktop nav wrapped into a phone.
   - Recommended fix: use a mobile header with logo, one primary CTA, and a compact menu. Convert proof points to 2-column chips or remove them from the first viewport on mobile.

4. Remove or neutralize fake-clickable controls in product mockups.
   - Evidence: mobile landing exposes mock controls like `View customer board`, `Remove`, `Add to calendar`, `Talk to Nic-Nac`, and repeated arrow links inside the product preview.
   - Why it matters: dead controls feel like a prototype and erode trust.
   - Recommended fix: make mockup controls visually inert, or connect them to controlled demo states. Primary page CTAs should be the only obvious actions.

5. Protect Amethyst customer pages from generic fallback identity.
   - Evidence: mobile Amethyst pages can show `Show Name`, `Rep Name`, and placeholder-facing copy when template data/API loading is not healthy.
   - Why it matters: customer-facing pages must never look like unconfigured templates.
   - Recommended fix: use a polished fallback/maintenance state or minimum viable branded profile data. Do not expose placeholder names to shoppers.

## P1 - High Priority Polish And Mobile Improvements

6. Make the landing CTA path more literal.
   - Evidence: top and hero `Get Sparkle Suite` CTAs scroll to pricing, while only the pricing CTA goes to `/start`.
   - Recommended fix: use `See pricing` for scroll CTAs and reserve `Get Sparkle Suite` or `Start Sparkle Suite` for `/start`.

7. Reframe `/start` as a premium account start, not a form card.
   - Evidence: mobile `/start` has strong branding but the form starts below the first viewport; the copy is clear but sparse.
   - Recommended fix: add reassurance near the top: no card yet, no customer messages, Stripe review before payment, takes about two minutes. Keep the first mobile screen focused on trust and forward motion.

8. Split account/setup email consent from terms acceptance.
   - Evidence: `/start` checkbox combines `Email me Sparkle Suite account and setup updates` with `I will accept the Sparkle Suite terms before checkout`.
   - Recommended fix: keep account/setup updates as operational consent or plain account expectation, and keep terms acceptance in the billing review where it already belongs.

9. Convert the unpaid Account screen into a focused checkout-review route/state.
   - Evidence: new buyers see `Subscription: Not set`, `No card on file yet`, and empty billing history before the checkout card.
   - Recommended fix: for onboarding, show plan review first. Move empty account/billing states below or after checkout.

10. Prevent mobile floating controls from covering paid-action content.
    - Evidence: mobile account screen has floating Nic-Nac/issue controls overlapping billing content near the bottom-right/bottom-left.
    - Recommended fix: hide floating assistant controls during checkout review, or dock them below the purchase card with enough bottom padding.

11. Make Setup Checklist actions real, disabled, or clearly post-checkout.
    - Evidence: each setup item says `Ask Nic-Nac...`, but the assistant can be unavailable and the items are not visually actionable.
    - Recommended fix: each checklist row should have status, primary action, and locked/post-checkout treatment where appropriate.

12. Demote Help & Resources skin gallery during first purchase.
    - Evidence: unpaid Help & Resources shows a large skin gallery and many configuration details.
    - Recommended fix: after checkout, show a curated `Choose your look` step with 3-4 recommended options first. Keep the full gallery as an advanced view.

13. Make legal pages feel Sparkle Suite-first while preserving legal operator truth.
    - Evidence: terms page opens with `NEON RABBIT DIGITAL SERVICES` and a bare `Back` link.
    - Recommended fix: add a polished Sparkle Suite legal header, clear `Back to checkout`, and a short plain-English summary before the legal body. Keep Neon Rabbit as the developer/operator line.

14. Improve mobile tap target sizing across public/customer pages.
    - Evidence: many text links and checkboxes are under the 44px mobile target standard, especially nav/legal/footer links and consent checkboxes.
    - Recommended fix: increase tap areas with padding, not necessarily larger visible text.

## P2 - Important Refinements

15. Reduce mobile page length on the post-launch landing page.
    - Evidence: mobile root page is very long, roughly 12k+ px in the audit, before the visitor reaches the full conversion path.
    - Recommended fix: compress feature grids, use accordions for FAQ/details, and bring pricing/start action earlier on mobile.

16. Tune the mobile 3D/product preview sequence.
    - Evidence: the product proof is real, but mobile reads as many stacked preview panels instead of one elegant staged product story.
    - Recommended fix: create a mobile-specific product proof: one primary screen, two supporting cards, then a `See what customers get` section.

17. Add an early trust band before pricing.
    - Recommended content: secure Stripe checkout, no customer texts/emails sent from checkout, cancel anytime, independent tool for reps.
    - Reason: this directly answers buyer hesitation without sounding defensive.

18. Add a `what happens after checkout` block beside the pricing CTA.
    - Recommended content: create account, review terms/plan, pay in Stripe, unlock setup checklist, finish site with Nic-Nac.

19. Polish Amethyst mobile sticky/ticker behavior.
    - Evidence: Amethyst mobile pages use sticky ticker and queue strips near the top; the animated ticker creates large off-screen tracks by design.
    - Recommended fix: ensure the ticker is clipped intentionally, not keyboard/screen-reader noisy, and does not push the real hero too far down.

20. Make Amethyst mobile nav feel more app-like.
    - Evidence: mobile nav links are readable but undersized as tap targets.
    - Recommended fix: use a compact tab bar or larger pill links for Home, Trade Board, Join Team, Shop.

21. Improve Amethyst Trade mobile scanning.
    - Evidence: trade page is very long and item discovery happens below sticky/top preview content.
    - Recommended fix: add mobile filter chips, a sticky `Search / filter board` control, and denser but polished listing cards.

22. Improve Amethyst Unsubscribe mobile checkboxes.
    - Evidence: checkbox inputs render at about 13x13 px.
    - Recommended fix: use larger custom checkbox/toggle rows with clear channel labels.

23. Review placeholder/demo naming strategy.
    - Evidence: public/customer-facing surfaces currently mix `Jane`, `Rep Name`, `Show Name`, and generic sample labels depending on load state.
    - Recommended fix: pick one demo identity for local previews, and never let placeholders appear in public-ready states.

## Mobile Surface Notes

### Post-Launch Landing

Status: strong concept, weakest mobile-first composition.

Mobile issues:

- Full nav wraps into small links.
- First-screen proof strip becomes narrow fragments.
- Product mock controls look tappable but do not represent real buyer actions.
- Conversion CTA to `/start` arrives too late on mobile.
- Page length is high for a first mobile sales page.

### Prelaunch

Status: production direction remains cleaner and more stable than the local post-launch page.

Mobile issues:

- Consent checkboxes and legal links need larger tap areas.
- Long waitlist form section should be checked again after the `sharp` blocker is cleared.

### Start Page

Status: visually on-brand, but should add trust cues and reduce ambiguity.

Mobile issues:

- Form starts below the first viewport.
- Copy could more clearly say no card yet and no customer/provider actions happen.
- Consent/terms language is bundled too tightly.

### Nic-Nac Account / Checkout Review

Status: content is responsible and useful; surrounding UI needs purchase-mode polish.

Mobile issues:

- Empty billing states appear before the checkout review.
- Floating assistant/debug controls overlap content.
- Visible assistant load failure is a P0 trust problem.

### Nic-Nac Setup Checklist

Status: good checklist content, needs interaction polish.

Mobile issues:

- Looks like static notes more than guided onboarding.
- `Ask Nic-Nac` copy is risky while Nic-Nac can fail to load.
- Should show locked/unlocked status and real next actions.

### Help & Resources

Status: useful for later, too much for first checkout.

Mobile issues:

- Skin gallery is overwhelming during first-start.
- It reads like internal configuration browsing rather than a guided buyer/customer journey.

### Terms / Privacy / Login

Status: legally useful, needs brand polish after dependency blocker is cleared.

Mobile issues:

- Legal pages should get larger return actions and more Sparkle Suite-branded framing.
- Login was not fully revalidated after the `sharp` blocker appeared.

### Amethyst Customer Pages

Status: mobile is functional with no page-level horizontal scroll, but first-screen density and placeholders need cleanup.

Mobile issues:

- Header nav tap targets are slightly short.
- Sticky ticker/queue areas dominate early viewport space.
- Ticker tracks intentionally overflow; they should be clipped and accessibility-reviewed.
- Homepage/Join can expose Jane/demo identity; acceptable locally, not for a generic product preview.
- Homepage/Unsubscribe can expose generic `Show Name` / `Rep Name` if template data fails.
- Trade page is very long and needs stronger mobile filtering/scanning.
- Unsubscribe checkboxes are too small.

## Recommended Work Order

1. Fix `sharp`/local route reliability.
2. Hide broken Nic-Nac/error/debug UI from purchase and customer-facing screens.
3. Mobile header and hero proof rewrite for the post-launch landing page.
4. Checkout-review mode for Account/Billing.
5. `/start` trust-copy and consent split.
6. Amethyst fallback identity protection.
7. Amethyst mobile nav/ticker/tap-target pass.
8. Setup Checklist guided actions.
9. Help & Resources progressive disclosure.
10. Legal page mobile brand polish.

## Definition Of Done For Mobile

- No framework overlays, console errors, or blank pages in local mobile QA.
- No horizontal page overflow at `390x844`.
- No buyer-facing debug/error/issue badges.
- Primary tap targets are at least 44px tall or have a 44px hit area.
- First mobile viewport has one clear primary action.
- Public/customer routes never show placeholder names like `Show Name` or `Rep Name`.
- Checkout/billing screens do not expose empty admin states before the buyer understands the next step.
- Product mockups do not look like broken interactive controls.

## Homepage Rebuild Direction Update - 2026-05-29

The post-launch local root homepage was rebuilt around real product proof instead of CSS 3D or invented UI. The approved structure is customer-site-first hero, workspace proof, pricing, get-started CTA, and footer. The implementation remains local-only pending Louis review.
