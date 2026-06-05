# Session Log

Running log of significant work sessions. Most recent first.

---

## June 2, 2026 - Required Nic-Nac Setup Planning

**Topics covered:**
- Sparkle Suite review started from the active local repo workbench `C:\Users\louis\sparkle-suite-repo` on branch `codex/sparkle-cross-phase-hardening`; binder remains memory/instructions only.
- Louis clarified the work target is the logged-in rep workspace after signup, not the public landing page.
- The current `/nic-nac` self-serve setup checklist was judged confusing and visually disconnected from the Sparkle Suite landing page brand polish.
- Product direction changed to a required Nic-Nac setup flow: tiny account creation, Stripe checkout, required Nic-Nac chat setup, then full dashboard unlock.
- Required setup should happen in one chat conversation with Nic-Nac, one question at a time, so reps learn the same interaction model they will use after launch.
- Full dashboard should stay locked until Nic-Nac gets the customer site to a good-looking Sparkle Suite standard.
- Google sign-in should be supported to reduce friction and increase trust; email/password remains a backup path.
- Setup state must persist structurally so reps who close Sparkle Suite resume the same Nic-Nac setup step after signing back in.
- Louis should be notified immediately for setup errors Nic-Nac cannot fix, paid reps blocked before setup completion, and successful payment/light-box ordering tasks.
- Louis is leaning toward Telegram for low-friction alerts.
- Sparkle Suite must collect a shipping address at checkout and create a 24-hour task for Louis to order a light box through Amazon Prime after first payment.
- Trade Board first-run setup is education only; do not require reps to populate trade items before unlocking the dashboard.
- Team management is deferred as an in-workspace add-on and is not part of initial checkout.

**Documents created:**
- Required setup design/spec:
  `C:\Users\louis\sparkle-suite-repo\docs\superpowers\specs\2026-06-02-sparkle-suite-required-nic-nac-setup-design.md`
- Detailed implementation plan:
  `C:\Users\louis\sparkle-suite-repo\docs\superpowers\plans\2026-06-02-required-nic-nac-setup.md`

**Implementation status:**
- No required setup implementation code has been written yet.
- Existing uncommitted state includes the new spec, the new plan, and an earlier `DashboardPlaceholder.module.css` polish change that the new plan supersedes.

**Next expected flow:**
Use `/goal` or a fresh Codex session to execute the implementation plan, preferably with subagent-driven development. Start with preflight guardrails, then batch through durable setup state, tiny signup/Google auth, Stripe shipping/light-box tasks, Nic-Nac setup tools, branded setup UI, and verification.

---

## May 31, 2026

**Topics covered:**
- Louis clarified that the desired workflow is large batch work through `/goal`, not small chunk-by-chunk management.
- The older Windows laptop was identified as both a speed bottleneck and a local-work risk when multiple serious repos run builds/dev servers at the same time.
- Locked the plain-English safety model: commit saves locally; push backs up to GitHub; Vercel runs deployed sites; Supabase holds app data; the laptop is only the workshop/control surface.
- Agreed that Codespaces or equivalent cloud workspaces are the right next step for parallel heavy repo work once active stopped sessions are safely closed.
- Decided the next rollout should cover three heavy Sparkle repos first: Sparkle Suite, Sparkle Finder, and Sparkle Rep Onboarding. Sparkle Marketing can stay local/lightweight unless it becomes build-heavy.
- Captured repo naming direction: `neon-rabbit-core` to `sparkle-suite`, `sparkle-suite-customer` to `sparkle-finder`, `sparkle-suite-marketing` to `sparkle-marketing`, and `britt-with-bling-start-strong` to `sparkle-rep-onboarding`.
- Clarified Sparkle Finder as the customer/collector hub for the Sparkle Suite ecosystem, not merely a generic discovery tool.

**Next expected flow:**
Louis will finish the three stopped repo sessions one at a time and make sure completed work is pushed to GitHub. After that, run a repo inventory, clean up naming/linking, and stand up GitHub Codespaces for the three heavy Sparkle repos.

---

## March 29, 2026

**Topics covered:**
- Memory architecture finalized
- Open Brain confirmed as Phase 2 priority alongside vault
- GitHub vault created this session
- Redundancy plan established across all tiers
- AI tool philosophy locked — Claude and Gemini equal compatibility, no lock-in
- NotebookLM added to stack as research tool
- Cost analysis completed — full Phase 2 stack runs $164–204/mo, already covered by current clients
- Multitask by default established as standing operating principle
- Master doc update to v1.8 pending
