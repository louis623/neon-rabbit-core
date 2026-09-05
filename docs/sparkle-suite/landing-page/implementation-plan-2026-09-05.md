# Sparkle Suite conversion-focused landing implementation

Status: application implemented and released September 5, 2026; public live checks passed. Signed-in synthetic reviewer verification remains blocked by protected reviewer access. The original checklist below is the planning baseline; the completion ledger and verification report are the authoritative execution status. Passing a build alone is not completion.

## Outcome and non-negotiables

A visibly more compelling, responsive, on-brand public sales page that explains the product quickly, demonstrates real value, and invites visitors into the active build queue. Preserve all existing functionality and contractual behavior. Actual conversion improvement is a measurable post-release hypothesis, not a guarantee or a numerically provable 95% confidence claim.

- Current palette, S seal, Playfair Display/DM Sans, no unapproved rebrand.
- No lost sign-in, intake fields, consent, validation, public assistant, legal links, pricing rules, checkout behavior, customer routes, or workspace behavior.
- Active copy: Now building Sparkle Suite sites; Join the build queue; sign up for your spot in line.
- Founder counter uses exact owner-preferred phrasing, e.g. 19 founder spots remaining, with no denominator or ticking timer. Availability is authoritative allocation data, not a hardcoded marketing number.
- No invented testimonials, live activity, discount duration, product capabilities, performance results, or revenue promises.
- No migration/domain changes for Mile High Fizz or The Bling Kitchen. No extension, billing-provider, personal-account, or customer-data mutations.

## Workstreams and ownership

1. Main agent: visual concepts, design system, main landing, coordinated intake page layout, responsive interactions, product captures, conversion clarity, integration, browser verification, release, memory.
2. Founder subagent: read-only allocation service/API, strict public aggregate contract, fail-closed handling, paid/reservation consistency, tests; no allocation/payment changes.
3. Handoff subagent: persist public questions safely into existing operator inbox, source labeling, explicit inquiry-only/no marketing behavior, validation/rate-limit/receipt tests; no outbound sends.
4. Copy subagent: active build-queue content, preserved intake form contracts, optional labels, matching follow-up template and tests; no sent email.

## Phase 1 — Lock the visual and implementation contract

- [x] Review live audit, brand rules, source boundaries, current branch and worktree.
- [ ] Generate coordinated readable concept references for hero, product exploration, conversion/intake, and mobile treatment. Display the chosen direction before frontend implementation.
- [ ] Extract final copy, typography scale, colors, gutters, media crops, component families, motion and reduced-motion behavior.
- [ ] Define source and capture provenance for every product image. Use actual product captures, not generated dashboard imitations.
- [ ] Map all preserved controls/destinations and conversion data hooks before edits.

## Phase 2 — Build the public experience

- [ ] Brand-scoped responsive header with existing account behavior; visible navigation to site, tools, offer.
- [ ] Compact hero: concrete audience/product, expressive but readable type, large actual customer-site preview, primary build-queue CTA, quiet explore action.
- [ ] Accessible site-style selector: real named previews, deliberate user selection, keyboard support, all showcased options retained, mobile-appropriate image sizes.
- [ ] Show-tools walkthrough: Queue, Dance Floor, Calendar, and practical Nic-Nac support; explain outcomes, keep unsupported email/SMS readiness truthful. Real proof with useful captions and a replayable demonstration only when evidence supports it.
- [ ] Founder section: conditional authoritative remaining count, accurate current offer and first-checkout arithmetic, duration/next rate/setup/tax disclosures, included value, sold-out and unavailable states.
- [ ] Short static FAQ and final CTA. Resolve official footer destinations from verified sources.
- [ ] Active build-queue intake presentation using existing /prelaunch#waitlist route and form contract. Preserve old inbound URLs/anchors where relevant; no duplicated incompatible price story.
- [ ] Consistent confirmation and follow-up source copy. Signup is not a guaranteed paid founder reservation.
- [ ] Public Nic-Nac question receipt reflects actual persistence, source labeled inquiry-only, no unintended enrollment or messages.

## Phase 3 — Polish and safety

- [ ] Purposeful entrance/state transitions; no unreadable moving text, scroll hijacking, fake activity, or endless scarcity animation.
- [ ] Reduced-motion static state, keyboard/focus, target spacing, responsive reflow, readable captions, contrast >=4.5:1 for normal text.
- [ ] Optimized/responsive image delivery, stable aspect ratios, below-fold loading, no avoidable large video payload.
- [ ] Scope CSS away from workspace, customer sites, login, and legal surfaces. Retain account controls.
- [ ] Independent source review for accessibility, functional regressions, conversion wording, incorrect founder states, API privacy/abuse, and protected-surface bleed.

## Phase 4 — Evidence-based verification

- [ ] Run relevant component/content/API/availability/intake/handoff tests, standard regression suite, type/lint checks, and full build.
- [ ] Local browser checks at desktop1440, laptop/tablet, phone390, narrow320: correct page, no blank/overlay, loaded assets, no relevant console errors, no clipping/overflow, usable first viewport.
- [ ] Exercise site selection, tools controls, FAQ, all CTA placements and settled intake anchor, sign-in entry, legal/social destinations, public assistant controls and Escape/focus.
- [ ] Safe reviewer/mocked form success/error/duplicate/consent and question receipt tests; no real customer signup/email/charge. Verify review-only bypass is disabled in production.
- [ ] Counter verifies current authoritative19, full/last-slot/contamination/unavailable/cache cases without reserving slots on view. Use existing checkout concurrency contract unchanged.
- [ ] Compare final screenshots with visual references at matched widths; record deliberate differences and fix material layout/type/color/media/control mismatches.
- [ ] Measure page asset load and available local performance evidence; no invented Lighthouse/field scores. Verify motion and no-JS fallbacks where applicable.

## Phase 5 — Release and final scrutiny

- [ ] Inspect exact repo/remote/branch/HEAD, Git/Vercel history and live deployment before release; preserve prior deployment provenance.
- [ ] Commit legitimate changes, push, and make one manual deployment of the exact verified tip with explicit alias scope. Do not advance protected customer-domain aliases by default.
- [ ] Confirm www and apex point to that deployment. Verify live root stability, build-queue path, availability, assistant and representative customer paths; use synthetic reviewer session for signed-in regression if supported.
- [ ] Reaudit all requirements against current evidence, fix discovered gaps, and repeat relevant verification. No completion based solely on good screenshots or green tests.
- [ ] Save release evidence, remaining limitations, and next measurement steps in vault and actual Open Brain, then verify both closeouts.

## Conversion measurement

Preserve existing analytics and consent policy. Inspect current instrumentation before adding anything. Useful funnel: landing view -> offer/tool exploration -> build-queue CTA -> form start -> successful intake. Do not capture contact text or private inputs in analytics. Track conversion by device and acquisition source only where supported/authorized; baseline and post-release real traffic are necessary to judge sales impact.

## Completion evidence ledger

Execution evidence is in `verification-2026-09-05.md`.

- Completed: four coordinated concept references and documented intentional differences; brand-scoped landing/intake; real optimized product captures; style selector and controlled tour; authoritative founder count; truthful queue and pricing copy; append-only inquiry handoff; accessibility/responsive fixes; source review, selected530 tests, lint and local/Vercel production builds.
- Completed: exact-tip manual deployment and Suite-only alias moves, live homepage/intake/sign-in entry/assistant controls/availability/production review guard checks, phone390/narrow320/desktop1440 evidence, unchanged Kim customer page and protected aliases.
- Open: signed-in synthetic reviewer workspace click-through. Louis authorized it, but protected access is unavailable and one documented synthetic login attempt failed. No account mutation occurred. Do not call full workflow verification complete.
- Additional completion audit: isolated live390px reduced-motion emulation verified zero CSS animations, functional style selection/FAQ, decoded product images and clean console. JavaScript-disabled rendering verified static content, FAQ and explicit unconfirmed/standard pricing fallback; it does not claim JS-dependent form functionality.
- Limitations: no real inquiry/signup write or outbound provider action in smoke testing; simulations and mocked tests are explicitly identified. No invented performance/conversion score is claimed. Official social destinations await confirmation. Signed-in reviewer access remains the blocking verification dependency.
- Release app commit: `163bffc9d82155905a366acf4286b7fda0ef44ae`; deployment: `dpl_7Wu2WVCP24JqE65f6WGhG8p9pxZq`. Vault/Open Brain closeout records the remaining blocker, not a silently shortened goal.
