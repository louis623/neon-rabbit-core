# The Rabbit Hole — Research #4: First-Time User Onboarding Patterns

**Version:** 1.0 | **Created:** April 6, 2026 | **Status:** COMPLETE

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when needed (reference doc for UI/UX build sessions)
**📁 UPLOAD TO PROJECT:** No — reference doc, not needed every session
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context for onboarding/UX implementation)
**🔄 UPDATE TRIGGER:** Onboarding flow is designed and locked during UI rebuild (Step 2)

---

## Research Summary

**Source:** Gemini Deep Research (April 2026)
**Prompt Topic:** How do non-technical users onboard to feed reader and content curation apps?
**Key Question:** What onboarding patterns will get a curious non-technical person from "just installed" to "this is amazing" in under 60 seconds?

---

## The Core Challenge: The Curation Gap

Non-technical users expect content to appear algorithmically (TikTok, Instagram model). The Rabbit Hole asks users to intentionally build their own feed by adding sources. This gap between "content happens to me" and "I build my own content stream" is the single biggest onboarding challenge.

**Critical statistic:** 25% of users abandon an app after a single use. The first 60 seconds are deterministic of long-term retention.

---

## Competitive Onboarding Analysis

### Feedly — Progressive "Learn-as-You-Go"

Feedly's approach minimizes initial friction by letting users engage with core utility before demanding account creation:

1. Visual interest-selection interface (not RSS terminology)
2. Auto-recommended categories prevent blank search paralysis
3. "Micro-Win" strategy: following one publication instantly populates the feed
4. Account creation deferred until user tries to save/organize content
5. By registration point, user has already connected "following" with "content reward"

### Flipboard — Magazine Metaphor

Flipboard leverages a familiar periodical metaphor instead of feed/RSS language:

| Component | Implementation | Psychological Lever |
|---|---|---|
| Initial Landing | High-impact visual carousel | Establishing brand authority |
| Interest Selection | Large, high-res tiles | Lowering cognitive barrier |
| Dynamic Refinement | Sub-topic selection after broad clicks | Escalation of commitment |
| First Experience | Immediate "flipped" magazine view | Instant gratification |

Users select 5+ broad interests with tactile feedback (color changes, progress indicators). The automated layout engine presents content in a gesture-based interface — no URL knowledge required.

### Notion — Conversational Onboarding

Notion uses a survey-based approach: "How do you work?" and "What do you need?" This segments users and pre-loads relevant templates.

**Key psychological maneuver:** Requiring users to "Name your Workspace" early creates commitment bias. The space becomes "My Physics Research" rather than a generic interface. For The Rabbit Hole, this maps directly to naming your first Rabbit Hole — "My Koala Rabbit Hole" creates ownership.

---

## The Empty State Problem

When a user opens The Rabbit Hole for the first time and sees nothing, they see a "broken app," not a "private garden of intelligence."

### Three Types of Effective Empty States

1. **Informational:** Explain why the screen is empty in human language. NOT "No RSS Feeds found" → YES "Your first Rabbit Hole is ready to be filled with your favorite creators"
2. **Action-Oriented:** Single dominant CTA nudging toward the activation event
3. **Celebratory:** "All Caught Up" screens that provide a psychological end point (anti-infinite-scroll)

### Empty State Best Practices

| Element | Best Practice | Rationale |
|---|---|---|
| Headline | Active, encouraging verbs ("Start your first dive") | Reduces anxiety, builds momentum |
| Illustration | Match the feature's icon | Reaffirms user is in the right place |
| CTA | Single, obvious next step | Minimizes decision fatigue |
| Copy Tone | Brand-aligned humor or reassurance | Reduces emotional cost of learning |

**The empty state of a new Rabbit Hole should not just be a "+" button — it should be an invitation to "Paste a link to a YouTube channel or Newsletter you love."**

---

## Progressive Disclosure — Three-Layer Model

Information-heavy apps fail when they try to onboard users to the entire platform at once. The goal is not mastery — it's seeing the first piece of content.

### Layer Implementation for The Rabbit Hole

| Layer | When | What's Visible | What's Hidden |
|---|---|---|---|
| Layer 1 — Core Loop | First 60 seconds | Topic creation, source adding, feed viewing | Everything else |
| Layer 2 — Discovery | After first source added | Search/discover sources, browse popular collections | Advanced settings |
| Layer 3 — Mastery | After multiple visits | Refresh rates, theme customization, export, advanced filters | Nothing — full app |

**Key principle:** Advanced features should be literally hidden from the UI until engagement thresholds are met. Pinterest does this — initially showing only "Search" and "Save," with "Add your own Pin" appearing only after engagement threshold.

### Disclosure Types

| Type | Mechanism | Use Case |
|---|---|---|
| Staged | Sequential steps (wizards) | Complex setup flows |
| Conditional | Reveals fields based on previous input | Tailoring to content types |
| Contextual Tooltips | Small popovers at user location | Non-obvious icons/navigation |
| Expandable Sections | Dropdowns / "Read More" | Conserving mobile screen space |

---

## The Magic Moment and Time-to-First-Value (TTFV)

**The Magic Moment for The Rabbit Hole:** User sees a date-sorted, clean feed of content from a source they intentionally chose.

Every second in a tutorial screen is a second added to TTFV. The onboarding must be relentlessly focused on reaching this moment.

### Activation Metrics

- **Onboarding completion rate benchmark:** 70% is good, below 50% indicates friction-value mismatch
- **Activation definition:** Successfully added one source and viewed three articles
- **Optimal onboarding length:** 3–7 screens, 30 seconds to 2 minutes
- **Sweet spot:** Under 60 seconds to first populated feed

### The Ladder of Engagement

| Step | Stakes | Action | Rabbit Hole Equivalent |
|---|---|---|---|
| 1 | Low | Select a broad topic | "What are you curious about?" |
| 2 | Medium | Add a source | Paste URL or tap a suggestion |
| 3 | High | Create an account | To sync or unlock Pro |
| 4 | Conversion | Pay for upgrade | One-time purchase to unlock capacity |

---

## Interactive Tutorials vs. Slide Carousels

### Why Carousels Fail

Traditional welcome carousels (static slides explaining features) are frequently skipped. Users treat them as advertisements. Once skipped, the user lands on the home screen with no context.

### Why "Learn by Doing" Works

Interactive tutorials that guide the user's thumb to buttons increase retention by ~50%. Instead of showing a video of how to add a Rabbit Hole, the tutorial spotlights the actual button and walks the user through the real action.

### Recommended "First Dive" Flow for The Rabbit Hole

1. **Spotlight the "+" button:** "Let's start your first Rabbit Hole."
2. **Input prompt:** "What are you curious about today?" (User types "AI Tools")
3. **Dynamic suggestion:** "Here are three great sources for AI Tools. Tap one to add it." (User taps a YouTube channel)
4. **Instant gratification:** App transitions to feed view. "Success! Here is the latest from your new source."

This teaches the core loop (Topic → Source → Content) without a single slide of text, using real content to make the environment feel alive.

---

## Starter Content — Bundles

### The Template Paradox

| Pros | Cons |
|---|---|
| Instant value without technical effort | Lack of ownership ("pre-selected" not "curated") |
| Demonstrates what a Rabbit Hole looks like | Irrelevant content feels like clutter |
| Eliminates Day 1 blank page abandonment | May delay learning to add own sources |

### Recommended Approach: Inoreader-Style Bundles

Offer "Starter Rabbit Holes" based on interests selected during onboarding. User selects "Fitness" → app offers a "Fitness Deep Dive" bundle containing a popular podcast, a subreddit, and a news site.

This provides a working model the user can customize or delete — bridging passive consumption to active curation.

---

## Registration Philosophy — Lazy Registration Validated

### Why No-Account-First Wins

Lazy registration allows users to establish "sunk cost" before being asked for identity. Once they've invested time personalizing their Rabbit Holes, account creation feels like a small step to protect their investment.

| Metric | Account-First | No-Account (Lazy) |
|---|---|---|
| Signup Conversion | Higher (required) | Lower (deferred) |
| Activation Rate | Lower (higher friction) | Higher (lower friction) |
| User Data Quality | Higher upfront | Higher long-term (engaged users) |
| App Store Conversion | Lower (privacy concerns) | Higher ("try it now" effect) |

### Implementation Path

1. **Anonymous interaction:** Local storage (Flutter shared_preferences or Supabase anonymous auth) saves initial Rabbit Holes
2. **Incentive trigger:** Only prompt for account when user wants to sync across devices or unlock Pro capacity
3. **Friction-free auth:** Google Sign-In, Apple Sign-In, or Magic Links — no password creation

---

## Magic Clipboard — New Feature Discovery

Flutter can access the device clipboard. When a user opens the add-source screen, the app can detect if they already have a valid URL copied.

**If yes:** Skip the manual paste step and ask "Want to add this YouTube channel to your Rabbit Hole?"

**Impact:** Eliminates the most technically intimidating step (finding and copying a URL) for users arriving from a "Share to Rabbit Hole" flow. This is a significant UX differentiator for non-technical users.

**Status:** NOT in the current master plan. Should be added to Gate 1 UX features or Step 2 (UI rebuild).

---

## Retention Benchmarks

| Interval | News Benchmark | Productivity Benchmark | Rabbit Hole Target |
|---|---|---|---|
| Day 1 | 26.67% | 32.86% | 30% |
| Day 7 | 15.83% | 24.23% | 20% |
| Day 30 | 7.55% | 9.63% | 10% |

**Key insight:** The steepest drop is Day 1 to Day 7. If Day 1 retention is high but Day 7 crashes, onboarding worked but the app failed to form a habit.

**Notification opt-in rates:** 30–36% on Android, slightly lower on iOS. Since The Rabbit Hole is pull-based, notifications are the primary hook for bringing users back to new content.

---

## Recommended Implementation Framework

### The 15-Second Rule

Upon first open, user sees a visually striking welcome screen restating the value proposition: "All your curiosities, in one place."

### Interactive Segmentation

Flipboard-style interest picker (highly interactive, visual tiles). Based on selections, suggest 2–3 Starter Rabbit Holes.

### The URL Guide Tooltip

When user arrives at the "+" source screen, show a short video tooltip demonstrating how to "Share" a YouTube channel or "Copy" a Substack link. Demystifies the technical step.

### Magic Clipboard Support

Detect valid URLs on clipboard. If found, skip manual paste and offer one-tap add.

### Dynamic Visual Feedback

When a source is added, immediately pull the creator's avatar and brand colors. This "success signal" builds trust for non-technical users.

### Progressive Paywall

Don't show the paywall on Screen 1. Wait until the user has added 2+ sources or reached the free limit. By this point, TTFV has been met and the user views the purchase as upgrading a tool they already trust.

---

## Key Decisions Banked for Decision Round

1. **Interactive "First Dive" tutorial** over slide carousel — 50% better retention
2. **Starter Rabbit Holes / Bundles** based on interest selection during onboarding
3. **Three-layer progressive disclosure** — hide advanced features until engagement thresholds
4. **Lazy registration confirmed** as best practice for free tier
5. **Magic Clipboard detection** — add to Gate 1 UX features (new)
6. **Video URL tooltip** — add to Step 2 UI rebuild scope (new)
7. **Retention targets locked:** D1: 30%, D7: 20%, D30: 10%
8. **Progressive paywall timing:** After 2+ sources added or free limit hit

---

## New Open Questions Identified

1. **Notification philosophy:** How does an anti-algorithm app handle push notifications without becoming the thing it's fighting against? User-controlled digest? Per-Rabbit-Hole settings?
2. **Starter bundle curation:** Who curates the starter bundles? How often updated? Hardcoded vs. dynamic?

---

## Research Gap Resolved

- **RG-2 (How do non-technical users onboard to feed reader apps?):** Complete framework provided — interest picker → starter bundles → interactive First Dive → lazy registration → progressive disclosure

---

*This research document is a reference copy. Key findings and decisions are also captured in Open Brain for cross-session continuity.*
