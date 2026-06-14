# Sparkle Finder Affiliate And Domain Session Closeout

> Superseded on 2026-06-13: Louis removed Sparkle Finder shop and affiliate storefront strategy. `/shop` and `/affiliate-disclosure` should remain removed/404, and this document is historical only. Use `docs/deployments/2026-06-15-sparkle-finder-beta-launch-runbook.md` for beta launch readiness.

Created: 2026-05-31

## Session Summary

Sparkle Finder is now live on its custom domain and has a compliance/trust-ready affiliate foundation. The session completed the affiliate readiness layer, connected the custom domain, helped Louis complete the Amazon Associates application, and corrected the production deployment so the latest cleaned-up homepage hero is live.

## Live URLs

- Site: `https://yoursparklefinder.com`
- WWW: `https://www.yoursparklefinder.com`
- Shop route: `https://yoursparklefinder.com/shop`
- Public affiliate disclosure: `https://yoursparklefinder.com/affiliate-disclosure`

## Key Decisions

1. Sparkle Finder is a discovery hub, not a jewelry marketplace.
2. Sparkle Finder by Sparkle Suite must not imply official Bomb Party affiliation.
3. Affiliate revenue should be trust-first, not hype-first.
4. Affiliate product lanes stay split between collector essentials and rep/livestream setup gear.
5. Louis must approve exact products/listings before any product becomes ready, live, app data, or a public guide/shop link.
6. Product candidates must pass quality, review-pattern, seller/company credibility, return-friction, claims-risk, and brand-fit checks before Louis sees them.
7. Public affiliate placements need nearby disclosure, not only a general disclosure page.
8. Product/company issue reports must have a clear path so Sparkle Finder can pause, replace, remove, or contact the company.

## Built

- Public affiliate disclosure page and route.
- Shared affiliate disclosure/trust copy constants.
- Shop/affiliate trust and issue-reporting copy.
- Copy guardrails for affiliate, Bomb Party, marketplace, live price/review/image, and hype language.
- Focused route/copy/disclosure tests.
- Affiliate command center docs.
- Program tracker.
- Product-pick tracker.
- Trust and copy guidelines.
- Weekly operating log.
- Louis candidate-review packet.
- Eight first-pass guide/topic docs:
  - collector jewelry care basics
  - collector photo-ready collection setup
  - collector storage and display planning
  - collector travel and gifting storage
  - rep audio starter setup
  - rep livestream lighting basics
  - rep phone mount and tripod setup
  - rep shipping label workflow basics
- Vercel deployment configuration.
- Custom domain connection for `yoursparklefinder.com` and `www.yoursparklefinder.com`.
- Cleaned-up homepage hero deployed to production.

## Amazon Associates Status

- Louis completed Amazon Associates application/profile/tax setup.
- Amazon issued Associate ID: `yoursparklefi-20`.
- Treat Amazon as `provisionally_active`.
- Do not publish Amazon links until exact products pass Louis review and each placement has nearby disclosure.
- Do not self-purchase through Sparkle Finder links.
- Do not ask friends, family, or business relationships to buy through links.
- Amazon disclosure sources used:
  - `https://affiliate-program.amazon.com/help/operating/agreement/`
  - `https://affiliate-program.amazon.com/help/node/topic/GPXFHVYZMTGPUMPE`
  - `https://affiliate-program.amazon.com/help/operating/policies`
- FTC source used:
  - `https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides`

## Production Deployment

Latest relevant commits:

- `11ced79 fix: deploy cleaned Sparkle Finder hero`
- `da6c84b docs: record Sparkle Finder custom domain readiness`
- `7e485e3 chore: configure Vercel Next deployment`
- `08983c5 feat: add Sparkle Finder affiliate readiness layer`

Latest production deployment verified:

- `https://sparkle-finder-85mr60uge-louis-2849s-projects.vercel.app`
- Aliased to `https://yoursparklefinder.com`

## Verification

Commands run during closeout:

- `npm run test`: 52 tests passed.
- `npm run build`: passed.
- `npm run smoke:sparkle-finder`: 5 smoke tests passed.
- Live HTTPS checks for `/`, `/shop`, and `/affiliate-disclosure`: HTTP 200.
- Live HTML check confirmed the old decorative hero markers are absent and the cleaned centered hero marker is present.

## Current Repo Note

There is one untracked local file:

- `public/sparkle-finder-smoke-test.html`

It was left untouched because `.vercelignore` excludes it and it is not required for the app deployment.

## Good Next Session Starting Point

Stand by for Louis's direction. Likely next choices:

1. Research first Amazon-safe product candidate set using the Louis packet.
2. Apply to Walmart and/or B&H.
3. Draft the first public guide content page before exact product selection.
4. Polish Sparkle Finder homepage/shop/disclosure copy.
5. Review deployment/domain/Amazon status only.

Do not automatically start affiliate product selection or publish links without Louis approval.
