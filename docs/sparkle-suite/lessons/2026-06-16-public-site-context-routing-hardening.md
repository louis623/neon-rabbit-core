# Lesson: Public Site Context Must Survive Hydration and API Refreshes

Date: 2026-06-16

## Problem

Louis successfully added `ER13229 / The Florence Earrings` to the Sparkle Suite workspace Trade Board through Nic-Nac. The workspace board showed the new listing with the boxed earrings photo, but the customer-facing public Trade Board showed stale seeded/default inventory such as `Birthday Bloom Ring`.

That mismatch was not a visual-only problem. It meant workspace state and public customer-site state could diverge after data moved through templates, browser JS, public APIs, and service calls.

## Root Cause

The public slug page could begin with the right rep context, but later client-side API calls did not always preserve the same target identity. Once a browser refresh called a public API without `repId`, `publicSiteSlug`, or another reliable target, the backend could fall back to default/demo data instead of staying scoped to the intended rep.

## Fix Pattern

- Treat rep/site target identity as a shared contract, not page-local glue.
- Resolve targets through one helper that understands `c`/`repId`, `publicSiteSlug`, slug path/referrer context, and real rep custom domains.
- Preserve both `repId` and `publicSiteSlug` in public template runtime context.
- Merge runtime context into public browser API calls and form submissions.
- Make targeted public loaders fail closed instead of showing seeded/default/demo inventory.
- Exclude canonical platform hosts such as `yoursparklesuite.com` and `www.yoursparklesuite.com` from rep custom-domain matching.
- For mutations, verify submitted ids belong to the expected rep when possible.

## What To Test Next Time

- Compare the workspace board and public customer board after the browser hydrates and refreshes data.
- Hit the actual stable demo route Louis reviews, not only a raw preview or local route.
- Test slug routes, `c`/`repId` routes, live-preview routes, canonical platform hosts, and real custom-domain routing when available.
- For Trade Board, verify both listing fetch and trade request submission stay scoped to the same rep.
- Watch for silent fallback to seeded/default data. That should be treated as a hard failure for targeted public pages.

## Deployment Proof

- Commit: `68fc332 fix: harden public site context routing`
- Stable demo: `https://sparkle-suite-demo.vercel.app`
- Stable demo target: `https://sparkle-suite-1k5a4e5xv-louis-2849s-projects.vercel.app`
- Deployment id: `dpl_EopEe8p6QKN6ZTqGdUoFnFH3DaWM`
- Verification: focused public-site/trade-request suite passed with 24 files and 175 tests, `npm run build` passed, Vercel build passed, stable demo alias was promoted, and Louis reported a light manual smoke looked good.

