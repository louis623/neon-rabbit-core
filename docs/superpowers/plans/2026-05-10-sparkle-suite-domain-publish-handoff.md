# Sparkle Suite Domain Publish Handoff

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the current Sparkle Suite prelaunch site to `yoursparklesuite.com` without mixing it up with the older Amethyst production site and without prematurely turning the public homepage into a dashboard-first experience.

**Architecture:** Treat the current prelaunch build in `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch` as the new production candidate for the root public domain. Keep `/` prelaunch-focused, preserve public legal pages, and keep `/login` available but not yet promoted as the primary hero action until the dashboard/auth experience is polished enough for real rep traffic.

**Tech Stack:** Next.js App Router, Vercel project `sparkle-suite`, custom domain `yoursparklesuite.com`, Supabase-backed waitlist route, Vitest.

---

## Current Verified Facts

> Update: the production cutover was completed on 2026-05-10. Keep the sequence below as the record of what was needed and as a reference for future domain swaps or rollback planning.

- Vercel project link exists in:
  - `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\.vercel\project.json`
- Current linked Vercel project name:
  - `sparkle-suite`
- Current custom domains attached to that project:
  - `yoursparklesuite.com`
  - `www.yoursparklesuite.com`
- Verified live behavior after the 2026-05-10 production cutover:
  - `https://yoursparklesuite.com/` returns a `307` redirect to `https://www.yoursparklesuite.com/`
  - `https://www.yoursparklesuite.com/` returns `200`
  - the production HTML serves the **Sparkle Suite prelaunch site**
  - the older Amethyst homepage template is no longer live on the domain
- Current app behavior in the candidate prelaunch build:
  - `/` redirects to `/prelaunch`
  - `/prelaunch` serves the approved coming-soon Sparkle Suite page
  - `/privacy-policy` and `/terms-and-conditions` exist as public legal pages
  - `/login` exists, but is still a simple functional login page rather than a polished public dashboard entry surface

## Product Decisions To Preserve During Publish

- The homepage should stay **prelaunch-first** for now.
- The site should not pivot into a login-heavy or dashboard-first homepage yet.
- The public feature claims should stay grounded in the approved feature list:
  - trade board
  - live queue
  - live event calendar
  - email updates
  - SMS updates
  - Nic-Nac
- `Reveal tools` should remain out of public headline claims.

## Publish Sequence

### Phase 1: Freeze The Production Candidate

**Files:**
- Review/Modify: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\app\page.tsx`
- Review/Modify: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\app\layout.tsx`
- Review/Modify: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\lib\prelaunch\content.ts`
- Review: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\app\login\page.tsx`
- Review: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\app\login\_client.tsx`

- [ ] Confirm `/` should continue redirecting to `/prelaunch` for the public launch.
- [ ] Confirm no homepage CTA implies immediate dashboard access unless the public login experience is intentionally promoted.
- [ ] Confirm the current metadata is acceptable for a public production release.
- [ ] Confirm the current login route can stay live quietly without becoming a top-nav or hero CTA yet.

### Phase 2: Verify Production Readiness

**Files:**
- Test: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\tests\prelaunch\prelaunch-page.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\tests\prelaunch\privacy-policy-page.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\tests\prelaunch\terms-and-conditions-page.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\tests\prelaunch\prelaunch-waitlist-route.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\tests\prelaunch\prelaunch-waitlist-service.test.ts`

- [ ] Run the focused prelaunch/legal/waitlist test suite.
- [ ] Run `npx tsc --noEmit --pretty false`.
- [ ] Run `npm run build`.
- [ ] Smoke-check these routes locally:
  - `/`
  - `/prelaunch`
  - `/privacy-policy`
  - `/terms-and-conditions`
  - `/login`

### Phase 3: Promote The Current Build To Production

**Files:**
- No code changes required if Phase 2 is clean

- [ ] Deploy the current Sparkle Suite worktree to the linked `sparkle-suite` Vercel project as production.
- [ ] Confirm the new production deployment becomes the target behind:
  - `https://yoursparklesuite.com/`
  - `https://www.yoursparklesuite.com/`
- [ ] Verify the domain no longer serves the old Amethyst homepage template.

### Phase 4: Live Post-Deploy Verification

**Files:**
- Verify live URLs only

- [ ] Confirm `https://yoursparklesuite.com/` redirects correctly.
- [ ] Confirm `https://www.yoursparklesuite.com/` shows the Sparkle Suite prelaunch experience.
- [ ] Confirm the footer links to:
  - `/privacy-policy`
  - `/terms-and-conditions`
- [ ] Confirm the waitlist form still submits successfully in production.
- [ ] Confirm `/login` still loads, even if it remains low-prominence in the UI.

### Phase 5: Future Evolution, Not Immediate Scope

**Files:**
- Later design/product follow-up only

- [ ] When dashboard auth is polished, add a clearer rep login action to the public site.
- [ ] When sales posture shifts from waitlist to active signup, evolve the homepage from pure prelaunch into the rep acquisition + login gateway.
- [ ] Do not make those two shifts as part of the first publish unless explicitly approved.

## Recommendation Summary

The safest path is:

1. Keep the current homepage prelaunch-first.
2. Publish the approved Sparkle Suite prelaunch build over the old Amethyst production site.
3. Preserve legal + waitlist functionality.
4. Leave `/login` available but quiet for now.
5. Add a stronger public login posture only after the dashboard experience is truly ready.
