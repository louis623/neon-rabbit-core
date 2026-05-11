# The Rabbit Hole — Master Plan

**Version:** 1.1 | **Created:** April 5, 2026 | **Last Updated:** April 6, 2026 | **Status:** ACTIVE

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Google Drive connector (on demand)
**📁 UPLOAD TO PROJECT:** No — reference doc, not needed every session
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (primary reference), Claude (on demand), Claude Code (build context)
**🔄 UPDATE TRIGGER:** Any gate status change, new decision, scope change, or completed milestone

---

## What This Document Is

This is the single source of truth for The Rabbit Hole — every decision made, every feature planned, every rule locked, and the full build sequence from here to launch. Nothing gets built without being in this plan first. This document will eventually migrate into the Neon Rabbit HQ dashboard as a visual project tracker.

---

## Product Vision

The Rabbit Hole is a personal intelligence feed app where users curate sources across multiple content types into topic-based collections called "Rabbit Holes." It is NOT a YouTube app. It is a universal feed reader designed for curious people who want to go deep on topics using content from across the internet.

**Core value proposition:** Anti-algorithm. Users follow the creators and sources that matter to them. Guaranteed delivery via RSS. No algorithm decides what you see. You build your own rabbit hole and everything shows up.

**Tagline concept:** "Never miss content from creators you follow."

**Target user:** Curious people who love learning — students, teachers, researchers, hobbyists, lifelong learners, anyone cutting through algorithmic noise to focus on topics they care about. Not developers. Not power users. Normal people. Louis's wife is the archetype — someone who dives deep into random topics (koala bears, AI tools, fitness) and wants all her sources in one place.

**Professional standard:** The app must look and feel like a real product built by a real team. This is Neon Rabbit's first public consumer product and must represent the brand properly.

---

## Core Experience

Users create Rabbit Holes (subjects) by topic. Inside each Rabbit Hole, they add sources from any supported type — YouTube channels, Substack newsletters, Reddit feeds, news RSS, podcast feeds, and blogs. All sources merge into one date-sorted timeline. Users browse, consume, and save what matters. Filters let them narrow by source type, date, and keywords.

It should feel like falling down a rabbit hole — you open a topic and everything interesting about it is right there.

**Key UX principles:**
- Quality over quantity: Hard limits on Rabbit Holes and sources as a FEATURE, not a limitation. Forces intentionality, prevents decision paralysis.
- One input field: User pastes anything — YouTube handle, Substack URL, RSS feed URL. App auto-detects source type. Falls back to raw RSS if it can't identify.
- The UI must make it obvious that the app supports more than YouTube. Placeholder text, helper copy, and visual cues must clearly communicate that newsletters, news, Reddit, podcasts, and blogs are all supported.

---

## Platform Strategy

**Primary platform:** Mobile (App Store + Google Play). This is where the revenue comes from. People use their phones for content consumption.

**Secondary platform:** Web browser. For development, testing, and as an alternative access point. Not the primary product.

**Native app path — Flutter is the leading candidate (as of April 6, 2026):**

Deep research (Gemini, April 2026) evaluated all major cross-platform frameworks. Flutter emerged as the strongest fit for The Rabbit Hole:

1. **Flutter (Dart) — LEADING CANDIDATE:** 46% market share in 2026. Impeller rendering engine paints every pixel directly — gives pixel-perfect control needed for Neon Rabbit branding (neon glows, gradients, wood grain, custom cards). UI is identical across iOS, Android, AND web from one codebase. 75–90% code sharing. Native-equivalent 60fps performance with no bridge overhead. Compiles to web via CanvasKit/Wasm.
2. **React Native (JS/TS) — ALTERNATIVE:** 32% market share. New Architecture (Fabric/JSI) removed old performance bottlenecks. Gentler learning curve for JS/TS teams but higher long-term maintenance overhead. React Native for Web can create friction between mobile gestures and browser interactions.
3. **PWA — DISCOVERY PORTAL ONLY:** Good for "try before download" onboarding but cannot achieve native performance or deep background services. Best used as a complementary web portal, not the primary app.

**Tradeoff acknowledged:** Flutter uses Dart, not JavaScript/TypeScript. The existing Next.js front-end code does not carry over — but that front end was already slated for a full rebuild. The Supabase backend carries forward regardless of front-end framework.

**Final decision:** Dedicated native app research session (Step 1) will validate Flutter as the choice or surface blockers. Going in with Flutter as the leading option, not evaluating all four equally.

**App Store economics (research findings, April 2026):**
- Apple developer account: $99/year. Google Play: $25 one-time.
- Both Apple and Google offer 15% commission (not 30%) for developers under $1M annual revenue. Must enroll in Apple App Store Small Business Program and Google Play 15% Service Fee Tier. Mandatory first step for Gate 1 launch.
- External payment links now allowed in US (Apple) and Google (with 5% fee).
- Mac required for iOS development and App Store submission. Minimum viable setup: $1,000–$2,500.
- 5-year fixed cost comparison: Apple $495 vs Google $25.

**Standing rule:** Any Neon Rabbit product intended for mainstream consumers MUST be available as a native app. Web-only is for tinkering, not shipping. "Download the app" is how real products work.

---

## Current State (As of April 5, 2026)

**Honest assessment:** The existing deployed app is a prototype, not the production app. Valuable as a learning tool — it produced the architecture, the product vision, the gate strategy, and Louis's understanding of the product.

**What works (backend — carries forward):**
- Supabase project: neon-rabbit-core (us-east-1, ref bqhzfkgkjyuhlsozpylf)
- Four rh_ tables live: rh_users, rh_subjects, rh_channels, rh_saved_cards
- RLS enabled on all tables
- Auth trigger: new signup auto-inserts rh_users row
- Google OAuth configured in Supabase (client ID + secret set)
- Supabase Auth (email/password + magic link + Google OAuth configured but not wired in UI)

**What doesn't work (front end — needs rebuild):**
- Auth flow is broken — Louis cannot sign in
- Core user flow (create Rabbit Hole, add sources, browse feed) is not reliably working
- Branding doesn't match the vision — too dark, flat, hard to read
- UI was never designed mobile-first
- CSS dot grid background instead of desired wood grain texture
- Google OAuth button exists in UI but not functional

**What was learned (process — applies to everything going forward):**
- Big monolithic Claude Code sessions produce messy results
- Branding bundled into functional prompts gets 10% attention
- Small, focused, testable bites produce quality
- One task per Claude Code session, test before moving on
- Never stack multiple unknowns in one session

**Decision:** Do NOT start completely from scratch. The Supabase backend and data architecture carries forward. The front-end UI layer gets rebuilt — designed mobile-first from the ground up. No more code until this plan is complete and mapped visually in the dashboard.

---

## Repo and Infrastructure

| Item | Detail |
|---|---|
| Repo | louis623/rabbit-hole (private, main branch only) |
| Local path | C:\Users\louis\rabbit-hole |
| Production URL | https://rabbit-hole-ten.vercel.app |
| Vercel project | louis-2849s-projects/rabbit-hole |
| Database | neon-rabbit-core (Supabase, us-east-1) |
| Tables | rh_users, rh_subjects, rh_channels, rh_saved_cards |
| Auth | Supabase Auth (email/password, magic link, Google OAuth configured) |
| Env vars | 5 set in Vercel production |
| Framework | Next.js 14 (App Router, TypeScript, Tailwind) |

---

## Three-Gate Release Strategy

Each gate is its own release cycle. Ship a gate, test it, stabilize it, learn from it, THEN ship the next. Planning and design for future gates CAN happen in parallel, but code does not ship for the next gate until the current gate is tested and stable.

### Gate 1 — Free Multi-Source Feed Reader (MVP)

**What it is:** The core Rabbit Hole experience. Users create topic-based Rabbit Holes, add sources from multiple types, and browse a merged timeline. Free tier with limited capacity. One-time purchase unlocks full capacity.

**Free tier limits:** 1–2 Rabbit Holes, limited sources per Rabbit Hole. Full app experience otherwise. No account required. Enough to fall in love with the concept.

**Paid unlock (one-time purchase):** All Rabbit Holes, all sources, all source types. App is fully useful at this level.

**Supported source types (Tier 1 — RSS-native, no API keys):**
1. YouTube channels (already built in prototype)
2. Substack newsletters (substackname.substack.com/feed)
3. WordPress blogs (/feed/ endpoint)
4. News sites with RSS (Reuters, AP, NPR, BBC, TechCrunch, The Verge, etc.)
5. Medium publications
6. Reddit subreddits (reddit.com/r/whatever/.rss)
7. GitHub release feeds
8. Podcast feeds (RSS with audio enclosures)

**Hard no source types (never pursuing):** Twitter/X, Discord, Instagram, TikTok. Walled gardens, hostile APIs, legal risk.

**Deferred source types (Tier 2 — research after launch):** Bluesky, Mastodon/Fediverse.

**Source add UX:** One universal input field. Paste anything — auto-detect source type. Fall back to raw RSS if unrecognized. Helper copy must make it obvious the app supports more than YouTube.

**Card design system (mixed-source feed):**
- Video cards (YouTube): Thumbnail, title, channel name, date
- Article cards (Substack, news, blogs, Medium): Source icon/color tag, headline, 2-line snippet, source name, date
- Reddit cards: Subreddit badge, post title, snippet or link, score if available, date
- Podcast cards: Podcast artwork (small), episode title, duration, date
- All card types share the same action icons: eye (viewed), brain (saved), bookmark, share
- Source type indicator on each card (small icon or pill)

**Filter system:**
- Time range: All / 24h / 3 Days / This Week
- Results per page: 5 / 10 / 20
- Sort direction: newest / oldest
- Live keyword search (title + description)
- Source type pills: All | YouTube | Newsletters | News | Reddit | Podcasts (toggleable, default All)

**Feed reliability target:** Under 5% individual feed failure rate, ideally under 2%. A single feed failure must NEVER break the app — other sources still render, user sees subtle warning.

**Subject organization:**
- Max 5 Rabbit Holes (subjects) for free tier
- Max 5 sources per Rabbit Hole
- User-typed names (no suggested lists)
- Each Rabbit Hole gets its own color/icon for quick identification
- All sources within a Rabbit Hole merge into one feed sorted by date

**UX features for Gate 1:**
- Move To: move a source from one Rabbit Hole to another
- Discover Sources: curated starter list of popular feeds by category + "how to find more" instructions
- Smart Channel Search: search/discover sources from within the app

### Gate 2 — Memory / Capture System

**What it is:** Personal memory space for saving and organizing content discovered in Rabbit Holes. Journal/notes page. Consumer-friendly branding (not "Open Brain" — needs a new name for public users).

**One-time purchase:** Activates the user's personal memory space hosted by Neon Rabbit on shared Supabase with RLS. Includes a small allotment of built-in AI messages per month (subsidized by Neon Rabbit at pennies per user).

**Key design principle:** Neon Rabbit only stores the minimum sync data needed. We do NOT host Open Brain-style AI memory for users. We provide the hook — they own their own backend for heavy AI usage.

**Requires dedicated Opus planning session before any code.**

### Gate 3 — Embedded AI + Claude Connector

**What it is:** AI-powered features within the app. When users want unlimited AI interaction, they connect their own Claude account via a simple button (not API key pasting — target users don't know what an API key is).

**One-time "connect" fee:** Covers Neon Rabbit's infrastructure cost — memory space, embeddings, initial free AI messages. Neon Rabbit is NOT charging for AI; it charges for infrastructure setup.

**Requires dedicated Opus planning session before any code.**

---

## Monetization Philosophy

**No monthly subscriptions.** One-time purchases only.

**Reasoning:**
- People are exhausted by subscriptions. A one-time purchase is a refreshing market position.
- Louis's build costs are lower than traditional dev teams (AI-assisted), so margins are healthy even at low prices.
- Low price + easy marketing = volume play.
- Spin-off revenue ideas matter more than per-user extraction.
- Keep the app cheap and accessible.

**Pricing:** TBD — needs dedicated pricing session. Must factor in Apple's 30% cut.

**Future revenue streams beyond the app:**
- Building Open Brains for people as a Neon Rabbit service (setup + onboarding fee)
- Potential Obsidian affiliate partnership (verify if program exists)
- AI tool integration over time
- Use cases for students and researchers
- The build process itself is a learning investment — skills transfer to future Neon Rabbit products

---

## Compliance & Platform Requirements (Added April 6, 2026)

These are non-negotiable requirements identified during deep research. They must be addressed during the build, not after.

**App Store technical mandates:**
- As of August 31, 2026: all Google Play apps must target Android 16 (API level 36) or higher
- Apple mandates Xcode 26 for all submissions after April 28, 2026, targeting iOS 26
- Failure to meet these = app becomes invisible to new users on latest devices

**Age verification:**
- Google Play Age Signals API (beta) provides user's age range or parental approval status
- Must integrate for age-appropriate experiences — students are a target audience
- Do NOT store raw date-of-birth data — use platform-provided age signals only
- Educational use cases fall under stricter child safety protections

**Gate 3 AI compliance:**
- Developer is legally responsible for AI-generated content even with user-provided keys (BYOK model)
- EU AI Act requires mandatory labeling of AI-generated content — any AI summaries/interactions must be clearly distinguished from original source material
- Must implement: moderation layers, adversarial testing ("red-teaming"), usage transparency/audit trails
- API keys must be encrypted AES-256-GCM at rest in Supabase — never stored in plain text
- All AI requests routed through secure backend server — keys never touch the client

**Commission optimization:**
- Enroll in Apple App Store Small Business Program (15% rate vs 30%)
- Enroll in Google Play 15% Service Fee Tier (applies on first $1M revenue)
- Both are mandatory first steps before Gate 1 launch

---

## UX Anti-Patterns to Avoid (Added April 6, 2026)

These design rules reinforce the anti-algorithm philosophy. They are non-negotiable.

- **No infinite scroll.** Date-sorted, finite timelines that give users a sense of completion. Infinite scroll leads to passive consumption and defeats the purpose of intentional curation.
- **Optimize for specificity, not intensity.** Do NOT optimize for time spent in app. Optimize for relevance to the topic collection. Consider "nutrition labels" for each Rabbit Hole showing source composition and timeliness.
- **No sticky patterns.** No autoplay chains, no engagement bait, no notification spam. The app should feel like a tool you pick up with intention, use, and put down satisfied.
- **No deceptive patterns.** No dark patterns that obstruct user choice. Transparent, honest UI at every level.

---

## Branding

**Brand identity:** Neon Rabbit official branding. The Rabbit Hole is a Neon Rabbit product and must look like one.

**Official brand colors:**
- #000000 — Black (primary background)
- #00ffff — Cyan (accent, gradient start)
- #ff00ff — Magenta (accent, gradient mid)
- #ff8c00 — Orange (accent, gradient end)
- #ffffff — White (primary text)

**Typography:**
- Orbitron (Google Fonts) — headings, logo, buttons, badges (700–800 weight)
- Inter (Google Fonts) — body, meta, links, labels (400–800 weight)
- Minimum font-size: 16px (iOS zoom prevention)

**Logo assets on file:**
- Circle emblem on black (primary app logo) — cyan circle border, "NEON RABBIT" arced top, "DIGITAL SERVICES" arced bottom, magenta+orange rabbit silhouette center
- Basic bunny silhouette — for favicon and small contexts
- Circle emblem on wood — for hero/background reference only

**Design language:** Neon signs on dark backgrounds, glowing outlines, gradient fills (magenta → orange on rabbit, cyan accents), bold circular badge identity.

**Background:** Wood grain texture desired (matching neonrabbit.net). CSS dot grid is current placeholder.

**Branding process (locked):**
1. Dedicated branding session in Claude Chat (Opus) — component by component
2. Pixel-precise spec document as output
3. Small surgical Claude Code prompts from the spec — one component at a time
4. Claude Code does NOT write copy or interpret branding — exact values and strings provided
5. Never combine branding work with functional work in the same prompt
6. Branding session happens AFTER functional testing confirms the app works

---

## Build Methodology

**Small bites, tested individually, stacked sequentially.** This is the standing rule for all Neon Rabbit builds.

- One focused task per Claude Code session
- Test and confirm it works before moving on
- Never stack multiple unknowns in one session
- This mirrors the gate strategy at the macro level — applied at the micro level within each gate
- Monolithic build sessions produced code that wasn't solid enough to build on
- Focused single-task sessions (proxy fix, auth wiring) landed clean every time

**Station-based production line:**
- Every step in the build is marked as "AI station," "human station," or "handoff point"
- Repeatable steps get their own mini-app/tool (inspired by the Sparkle Suite calendar builder)
- Either a human or AI agent can operate each station tool
- Quality control is built into each station, not bolted on at the end
- If something breaks, you know exactly which station failed

**Two-System Validation:** Claude builds, Codex validates. Prompt Codex adversarially. New architecture gets reviewed. Iterations don't.

---

## Build Sequence (Gate 1)

This is the correct order of operations. Do NOT skip steps or combine them. Each step is testable independently.

### Step 1 — Native App Research Session (Flutter Validation)
Flutter is the leading candidate based on Gemini deep research (April 2026). This session validates the choice: confirm Dart learning curve is acceptable, verify Flutter + Supabase integration path, confirm Impeller engine handles the Neon Rabbit aesthetic, and identify any blockers. If Flutter is confirmed, this also determines whether to use Flutter's Material 3 theming or a fully custom design system. Dedicated Opus session.

### Step 2 — Mobile-First UI Rebuild
Clean front-end rebuild designed for phones first. Touch targets, swipe gestures, bottom navigation. Backend (Supabase) carries over unchanged. Built in small bites — one component per Claude Code session.

### Step 3 — Multi-Source Support
Expand proxy to handle all Tier 1 RSS source types. Universal input with auto-detection. Source-type-aware card rendering. Testing pass per source type with multiple real feeds.

### Step 4 — Auth Fix + Google OAuth Wiring
Get sign-in working. Wire the Google OAuth button. Test the full auth flow end-to-end.

### Step 5 — Free/Paid Tier Split + Stripe
Free tier limits enforced. One-time purchase via Stripe unlocks full capacity. Tier flag on rh_users.

### Step 6 — Analytics Integration
Wire PostHog (or Mixpanel) BEFORE beta testing. Track: session frequency/duration, feature usage, onboarding drop-off points, device/browser breakdown. This is foundational — blocks beta testing.

### Step 7 — Functional Testing (Louis)
Louis tests everything. Fix bugs. Make sure feeds load reliably across all source types. Make sure auth works. Make sure tier limits work.

### Step 8 — Readability Fixes
Quick Claude Code prompts to make the UI usable enough for external testing. Separate from full branding pass.

### Step 9 — Friends & Family Testing
Give it to wife and trusted non-technical people. Watch what breaks. Watch what confuses them. The bar: if Louis's wife can open the app, create a koala bear Rabbit Hole, add sources, and it just works — and she never once has to ask how — it's ready.

### Step 10 — Churn Detection Setup
Supabase function to flag inactive users after 3–5 days. Automated check-in email via Resend. Optional short exit survey. Look for patterns in analytics data.

### Step 11 — Feedback Board
Set up Canny (or similar hosted tool) for user feature suggestions with voting. Embed or link from inside the app.

### Step 12 — Branding Session
Dedicated Opus session. Component by component. Pixel-precise spec document output.

### Step 13 — Branding Execution
Small surgical Claude Code prompts from the spec. One component at a time. Verify each before moving on.

### Step 14 — Email Capture + Landing Page
Landing page with email capture at rabbit-hole.app or subdomain. Newsletter system (evaluate Buttondown or Resend broadcast). Segmentation: beta testers vs. waitlist.

### Step 15 — Operational Cost Modeling
Apple/Google fees, Supabase costs, Stripe fees, newsletter costs. Factor Apple's 30% into pricing.

### Step 16 — Pricing Session
Lock one-time purchase prices for Gate 1 unlock. Factor in costs from Step 15.

### Step 17 — App Store Submission
Submit to Apple App Store and Google Play. Factor in review process timelines.

### Step 18 — Launch
Go-to-market execution. Newsletter to waitlist. Marketing push.

---

## Planning Sessions Needed (Before or During Build)

These are dedicated Opus sessions — brainstorm, decide, document:

| Session | When | Output |
|---|---|---|
| Flutter validation session | Before Step 2 | Confirm Flutter/Dart or identify blockers |
| Memory/capture product design | During Gate 1 (parallel) | Gate 2 spec document |
| Branding session | After Step 9 (functional testing complete) | Pixel-precise component spec |
| Operational cost modeling | Before Step 16 | Cost breakdown per user |
| Pricing session | After cost modeling | Locked prices (factor 15% commission) |
| Launch and marketing plan | Before Step 18 | Go-to-market playbook |
| Naming session | During Gate 1 (parallel) | Consumer-friendly name for memory feature |

---

## Operational Philosophy

- Louis is NOT committed to staying solo. He'll bring on people or AI tools as business needs dictate. Goal is to stay light and fast.
- AVOID BLOAT. The biggest risk is this ballooning into something so big that Louis walks away. Scope discipline is critical.
- Ship the core, test it, let users tell you what to build next. Don't build everything at once.
- The Rabbit Hole should be built so it CAN be handed off or staffed up. Clean code, documented architecture, captured decisions in Open Brain.
- Long-term: build it, prove it, hand it to a trusted operator, replicate the model in new niches.

---

## UX Features Backlog (Post-Gate 1)

These are captured ideas that live behind Gate 1. They do not get built until Gate 1 is stable and tested.

- Creator Deep Dive / Archive: Pull entire creator history, timeline view with date range filters
- Keyword filtering per source (beyond the current feed-wide search)
- Playlist/subtopic filtering for YouTube sources
- Cross-device sync verification after auth is stable

---

## Testing Strategy

**Primary test user:** Louis's wife. Goes down rabbit holes constantly. Zero AI/dev background. Perfect UX validator.

**Testing group:** Small group of trusted non-technical friends and family. Very low risk of idea theft.

**The launch readiness bar:** If a non-technical curious person can open the app, create a Rabbit Hole, add sources from different types, browse the merged feed, save content — and never once has to ask how something works — then it's ready.

**Testing happens BEFORE the branding session.** No point polishing if the core experience is broken.

---

## Key Principles (Quick Reference)

1. **Anti-algorithm:** Users control what they see. No algorithm. Guaranteed delivery via RSS.
2. **No subscriptions:** One-time purchases only. Cheap, accessible, volume play.
3. **Mobile-first:** App Store and Google Play are the product. Web is secondary. Flutter is the leading framework candidate.
4. **Small bites:** One task per session, test before moving on, never stack unknowns.
5. **Plan before code:** No more building ahead of the plan. Build follows the plan.
6. **Station-based:** Every step has a clear human/AI assignment and purpose-built tools.
7. **Scope discipline:** One gate at a time. Ideas go to the backlog, not into the current sprint.
8. **Professional quality:** This must look and feel like it came from a well-funded team.
9. **Built for handoff:** Clean code, documented decisions, no tribal knowledge.
10. **Learning investment:** Every hour spent is skill-building that transfers to future products.
11. **No infinite scroll:** Finite, date-sorted timelines. Users should feel completion, not addiction.
12. **Compliance-first:** Age verification, API target levels, AI labeling — built in from day one, not bolted on later.

---

## Local Ecosystem Resources (Watch List)

Not actionable yet — captured for when Rabbit Hole has revenue and traction.

- **Code Alliance Incubator** (Jacksonville Beach) — AI/software incubator, high-end hardware, 5-gig fiber
- **JAX Chamber Open Innovation Center** — corporate startup connections, led by Dr. Carlton Robinson
- **PS27 Ventures** — $50M Titan Fund, early-stage SaaS, $500K–$1M investments (Jim Stallings)
- **Florida Funders** — most active early-stage investor in Southeast, B2B SaaS focus
- **Grants:** Florida State Small Business Credit Initiative, Prospera (micro-grants for diverse founders)
- **Networking:** Silicon Beach Pitch events, JAX Tech Fest

---

*This is a living document. Update it when decisions are made or gates are completed. Do not update it for ideas still being brainstormed — those go to Open Brain.*
