# September 5 landing-page implementation verification

## Scope and release boundary

Owner approved the public-page redesign, active build queue, truthful founder availability, stronger copy and purposeful motion while preserving brand and functionality. Repo: `C:\Users\louis\sparkle-suite-repo`; remote `louis623/sparkle-suite`; allowlisted branch `codex/nic-nac-trade-hardening`. Starting HEAD `3f5b2f11715d095f4fb263bcaf6f95432063e32c`.

Before release both Suite domains and the protected GofortheBling, Mile High Fizz, and The Bling Kitchen hostnames resolved to `dpl_DgnnzsNrqsyF61PEzW4K5zamiop5`, URL `sparkle-suite-ezpu8iaye-louis-2849s-projects.vercel.app`, app commit `832f16e51d5e90fabb4ad5e1c378663c5b048a22`. Preserve this deployment. The new manual release must use `--prod --skip-domain`, then explicitly assign ONLY `www.yoursparklesuite.com` and `yoursparklesuite.com`. No customer alias, DNS, mail, extension, account, or billing-provider changes.

## Implemented and preserved

- Brand-scoped layout: canonical white-circle italic S, Playfair Display/DM Sans, warm white/blush, deep brown and accessible pink. Existing global rules stay intact for login, legal, workspace and customer pages.
- Expressive hero; selectable real customer-site looks; user-started, pausable four-tool tour; founder offer; static FAQ; repeated build-queue CTA; compact intake layout.
- Existing `/prelaunch#waitlist` route, endpoint, fields, optional inputs, consent defaults and legal text preserved. Error announced with `role=alert`; improved field readability and checkbox focus. Shared sign-in/account component preserved.
- Read-only founder aggregate mirrors durable checkout allocation semantics, excludes unsafe demo/test contamination by failing unavailable, never counts queue submissions, and never reserves slots. Aggregate read confirmed 19. Full, last-slot and unavailable states tested. No hardcoded scarcity or timer. Standard fallback on an unknown count is intentional; eligibility remains checkout-confirmed.
- Public Nic-Nac question saved only after a confirmed append-only database receipt. Inquiry source is not marketing enrollment, build-queue membership or a founder reservation. Existing lead email matching, queue-only review and contact batches exclude inquiry rows. No outgoing email/SMS/provider calls in the handoff route.
- Verified Finder destination replaces a placeholder. Unverified YouTube/TikTok placeholder links are suppressed rather than pointing to fake accounts; owner was asked for official links. Legal destinations and independence disclaimer remain.

## Visual provenance and fidelity ledger

Generated reference concepts remain in the task's generated_images folder. Final screenshots are in `artifacts/landing-implementation-2026-09-05/`.

| Reference property | Implementation / intentional difference |
| --- | --- |
| Hero hierarchy | Three-line brand/show/shines promise; pink italic emphasis and one clear signup CTA. Mobile title deliberately smaller so CTA starts at458px even at320px width. |
| Colors and logo | Same blush/warm-paper/brown brand; accessible `#b91a70` controls. Restored canonical white S circle instead of generated concept's inverted pink circle. |
| Product scale and camera | Large single staged real screenshot; subtle desktop perspective; flat stacked mobile. No decorative fake floating panels. |
| Product explorer | Three deliberate pressed-state style buttons and one readable preview. Actual synthetic template captures replace old stale-queue screenshots and invented generated UI/URLs. |
| Section rhythm | Warm opening and showcase, dark show-tools section, light offer/FAQ, blush closing CTA. Light pink focus outline on dark section. |
| Conversion details | Live aggregate count with owner wording; first12 paid months, subsequent rate, non-refundable setup, first checkout, tax, no-reservation disclosure. All generated contract/claim inventions discarded. |
| Intake concept | Existing full legal consent retained, not the shortened generated consent. Existing confirmation/submit semantics retained, optional fields labeled. |

Source for three site looks plus queue/calendar is actual current `public/amethyst/Homepage.html` rendered with fictional Sasha / Your Sparkle Studio data, clearly labeled sample. Generator `scripts/prepare-landing-capture-fixtures.ts` blocks mutations, cross-origin requests, and non-local use. Five generated temporary HTML/manifest files were removed before build; generator can recreate them. Retained final captures only in published asset directory. Dance Floor and Nic-Nac use the previously approved actual proof images, mechanically optimized without fabricated UI.

Seven WebP source files total403626 bytes (about394KiB), versus multi-megabyte old PNGs. Next Image adds responsive sizing and lazy below-fold loading; hero is preloaded. This is file-size evidence, not a fabricated field-performance/Lighthouse score.

## Verification evidence before release

- Default regression suite:239 tests passed in14 files.
- Focused landing, intake, founder and handoff suite:227 passed in17 files;466 total with default suite. Final post-Link/image rerun:45 passed in4 files.
- Focused new component/updated intake ESLint clean. Broad40-file scan previously found one existing unused-variable warning in intake; navigation errors were fixed. `git diff --check` clean apart from informational Windows line-ending notices.
- `npm run build`: PASS, including full production TypeScript, static generation and route compilation. Default build generator caused no substantive Amethyst runtime diff.
- In-app browser desktop1440, tablet768, phone390 and narrow320 inspected; no horizontal overflow. Actual measured320px CTA top458 / bottom512. Product images loaded when their below-fold section was reached. Desktop and phone captures saved; full-page captures taken before lazy loading are not used as proof of failed assets.
- Style selection, calendar selection, tour play/pause, native FAQ details, primary CTA to settled intake anchor, assistant open/minimize, Escape-to-reopen focus, empty signup validation (`Name is required.`) verified. No real signup submitted.
- `/dev/public-nic-nac`: safe fictional review form503 failure followed by201 simulated receipt `REVIEW-ONLY-NOT-SAVED` verified. This does not prove a production database write; mocked route/service tests cover receipt/append behavior. No inquiry saved during testing.
- Focused tests verify production-disabled development review route/props/flags, origin/content validation, malformed/oversize bodies, rate limiting, source isolation, failure never claiming saved, no customer/provider side effects.
- No new analytics/tracking provider or personal-data capture added. Actual sales/conversion impact requires a traffic baseline and post-release measurement; it cannot honestly be given95% statistical confidence from design and tests alone.

## Remaining release evidence

Record the exact application commit, pushed tip, manual deployment, both alias checks, live route/interaction proof and production review rejection below after release. Signed-in synthetic workspace smoke requires the protected reviewer token and an approved active reviewer persona; never substitute Louis's personal account or reactivate an archived persona without authority.
