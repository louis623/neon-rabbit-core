# July 31, 2026 Sparkle Suite Production Rollback and Checkout-Routing Incident

## Outcome

`https://www.yoursparklesuite.com` was restored to the current Sparkle Suite
landing page and customer/workspace application. Louis's Google-auth account
now opens the Sparkle Suite Workspace instead of Stripe checkout.

The final verified application checkpoint was:

- Git commit: `af7cef25 fix: restore landing account sign-in controls`
- Branch: `codex/nic-nac-trade-hardening`
- Vercel deployment: `dpl_3WtzJMr5fK7LMEqTrVqJCJLZSWqL`
- Deployment URL:
  `https://sparkle-suite-c0vjukn1r-louis-2849s-projects.vercel.app`
- Live domain verified:
  `https://www.yoursparklesuite.com`

The incorrect deployments and prior domain state were preserved as evidence
rather than being rebuilt over or deleted.

## What Happened

This was a two-layer incident.

### 1. Production provenance drift

Work initiated through a voice-led session selected historical branches and
old Sparkle Suite material without first establishing the active repo, branch,
Git checkpoint, and Vercel alias target. The live custom domain was moved back
to an application state from months earlier, including outdated workspace and
customer-facing surfaces.

The first recovery attempts treated visible symptoms as page defects. The
correct recovery method was to use Git and Vercel history: identify the known
good work from before the incident, restore the exact repository checkpoint,
deploy that exact tip, and point the live aliases to that deployment.

### 2. Louis's production account state forced checkout

After the landing page was restored, Google authentication for
`louis@neonrabbit.net` still redirected to a live Stripe Checkout Session.
That was not a landing-page click bug. The production records for the original
admin/demo account were internally inconsistent:

- rep status was `onboarding`
- required setup status was `checkout_required`
- current setup step was `account_basics`
- no subscription/entitlement row existed
- an accidental founder-pricing reservation had been assigned

The app therefore followed its normal unpaid onboarding rule and sent the
authenticated account to checkout.

## Recovery Performed

### Application and domain

1. Inspected Git and Vercel history instead of recreating the site.
2. Restored the current landing, workspace, and customer-site application from
   the known-good repository history.
3. Added the missing landing-page account controls in `af7cef25`.
4. Pushed and deployed the exact branch tip.
5. Moved/confirmed the live custom-domain aliases on the intended deployment.
6. Verified that the exact custom domain remained on the landing page instead
   of refreshing into Stripe.

### Louis admin/demo account

The production data repair used the exact email and rep identity as a guard.
It:

1. released the accidental founder-pricing reservation;
2. restored rep status to `active`;
3. cleared the accidental founder pricing fields;
4. restored required setup to `dashboard_unlocked`;
5. marked the established setup steps complete;
6. added a `$0`, non-live `internal_demo` entitlement with no real charge; and
7. recorded an internal support/audit marker describing the repair.

No live Stripe subscription or charge was created as part of the repair.
Existing provider evidence was not deleted.

## Verification Evidence

The existing signed-in Chrome session was navigated to the exact live custom
domain after the data repair. It remained at a `/nic-nac` workspace URL and
visibly showed:

- Sparkle Suite / Workspace
- Louis Chapman
- Nic-Nac
- Trade Board
- Calendar
- Jewelry Library
- Public Site status

The page was allowed to settle before inspection; it did not redirect to
Stripe. The verified workspace was left open for Louis, who confirmed the
account was back in business.

## Permanent Safeguards

1. **One active repo:** use only
   `C:\Users\louis\sparkle-suite-repo` and GitHub
   `louis623/sparkle-suite`. The old binder/archive is never a release source.
2. **Provenance before mutation:** before deploy/rollback/alias work, verify
   absolute repo path, remote, branch, HEAD, Vercel project, deployment, and
   affected aliases.
3. **Restore, do not reconstruct:** when Louis asks for an earlier version,
   inspect Git/Vercel history and restore the exact known-good checkpoint.
4. **Preserve evidence:** record currently served and suspected bad deployment
   URLs before moving aliases. Do not delete evidence to make the state look
   clean.
5. **Verify the exact customer domain:** smoke
   `https://www.yoursparklesuite.com`, not only a preview or raw Vercel URL.
   Wait for the page to settle so delayed redirects are caught.
6. **Post-auth smoke is mandatory:** deployment verification must include
   sign-in and the post-login destination for the relevant account class.
7. **Louis account invariant:** `louis@neonrabbit.net` is always an active,
   dashboard-unlocked, `$0` non-live admin/demo workspace. It never belongs in
   checkout.
8. **Separate disposable tests:** use the supported reviewer-smoke account or
   `louis+sparkle-demo-2@neonrabbit.net` for signup/checkout testing.
9. **Stop on unexpected checkout:** if an established account resolves to
   `checkout_required`, inspect account/setup/entitlement/reservation state
   before opening or creating a live checkout.
10. **Voice pause:** do not use voice mode for Sparkle Suite repo, deployment,
    auth, billing, or production-data work until Louis explicitly re-enables
    it.

## Safe Session Start Prompt

Use this prompt for a future Sparkle Suite coding or recovery session:

> Work only in `C:\Users\louis\sparkle-suite-repo` and GitHub
> `louis623/sparkle-suite`. Read `AGENTS.md` and the four `vault` memory files
> first. Before changing anything, report the absolute repo path, remote,
> current branch, HEAD commit, git status, and the Vercel deployment currently
> serving `yoursparklesuite.com` and `sparkle-suite-demo.vercel.app`. Do not
> switch branches, deploy, move aliases, modify auth/billing data, or rebuild
> anything until the requested target is matched to Git/Vercel history. If a
> restore is requested, restore an exact known-good checkpoint. Preserve the
> current deployment URL for inspection. After any approved release, verify the
> exact live domain, landing-page stability, sign-in, post-auth workspace
> destination, and representative customer-facing routes. Never send
> `louis@neonrabbit.net` to Stripe; it is the active `$0` admin/demo workspace.

## In-Session Guard Prompt

Use this shorter prompt before any risky release or account action:

> Pause and prove provenance before acting: repo, remote, branch, HEAD, target
> deployment, affected aliases, and account identity/state. Restore from Git
> history rather than rebuilding. Do not move a domain or touch live
> auth/billing data until those facts match the current Sparkle Suite memory.
