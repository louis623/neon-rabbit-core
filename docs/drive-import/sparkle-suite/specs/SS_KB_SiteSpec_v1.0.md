# Sparkle Suite — KB Module: Site Template Spec

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any change to site template, page spec, or design standards

**Version:** 1.0 | **Derived from:** SS_Knowledge_Base_v1.9 (Sections 29–33) | **Last Updated:** April 8, 2026
**Status:** ALL 4 PAGES FULLY SPECCED — OQ-27 COMPLETE

**COMPANION MODULES:**
- SS_KB_Core_v1.0.md — Architecture, strategy, business model, decisions
- SS_KB_OpenItems_v1.0.md — Open questions, research sprint, gap analysis, parking lot
- SS_KB_Clients_v1.0.md — Client roster and status
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation

---

## Page Map

| Page | Status | Always Active | Customization Level |
|------|--------|---------------|-------------------|
| Home | ✅ Specced (Session #6) | Yes | Mixed |
| About | ✅ Specced (Session #7) | Yes | High |
| Join Team | ✅ Specced (Session #7) | Infrastructure always exists; hidden from nav if rep opts out | Mostly locked |
| Unicorns & Diamonds / FAQ | ✅ Specced (Session #8) | Yes | Minimal — most locked page |

**"Shop Products" is NOT a page** — it's a nav link to rep's BP order page. Nav shows 3 or 4 pages depending on whether Join Team is active.

---

## Cross-Page Design Principles

### Template Design Freedom
Kara's Readdy-built site (sprinkledindiamonds.com) is the **reference baseline** — shows content, structure, and intent. When NR builds the actual templates, nothing is set in stone visually. Full v2 treatment: better flow, better design, better copy. The spec locks down WHAT content exists and WHAT is customizable vs locked — not the visual execution.

### Template System
- Fonts and colors are **BUNDLED** into complete templates — no mix-and-match
- Start with 4-5 templates at launch, expand over time
- Template swapping → PARKING LOT (post-launch feature)
- Structure stays LOCKED across all templates — same pages, same layout, same sections. Only visual skin changes.

### Lockdown Spectrum (most to least locked)
1. **Unicorns & Diamonds / FAQ** — All content NR-controlled. Only hero image and template variable swaps per rep.
2. **Join Team** — Six benefit cards fully locked, FAQ questions locked. Customizable: hero text, FAQ answers, team member grid.
3. **Home** — Locked structural elements. Customizable: hero image/tagline, banner, ticker, TikTok embed, calendar events, streaming links.
4. **About** — Most customizable. Three bio cards with rep content, media, NR-written copy.

### Site-Wide Design Standards (Locked)

**Button design:**
- Gradient styling (default)
- Outer hue/glow effect
- Hover/tap: button enlarges/zooms slightly — improves mobile accuracy and polish
- Consistent across every button on every page

**Card design:**
- Gradient header bar with icon
- Hover/tap: card grows, border illuminates, outer neon hue/glow effect
- Icons throughout use colored/gradient circle backgrounds
- Consistent across every card on every page

**Section design:**
- Each section has title in rep's brand font/color
- Optional subtitle tagline below
- Sections have slightly varied background colors to visually differentiate

**Hero image animation:**
- Every hero image gets subtle animation: slow zoom in, slow zoom out, pan left, pan right
- Makes the site feel dynamic rather than static
- NR picks/assigns animation style — rep doesn't configure

**Hero overlay visual treatment (NOT LOCKED):**
- NR picks the best approach per site for text readability (glassmorphism, gradient overlay, text shadow, darkened image, etc.)
- Content of overlays is locked; visual treatment is NR's judgment call
- Applies to ALL hero sections across ALL pages

### Hero Image Sourcing (All Pages — Same Priority Order)
1. **NR sources from paid stock photo subscription** (primary) — Based on client interview, NR selects options, rep picks. Fast, quality controlled.
2. **Rep provides their own** (secondary) — May have quality/formatting issues.
3. **AI-generated** (fallback) — Time sink, quality gamble. May charge extra.

NR sources all hero images site-wide as a **matched set** during onboarding.

### Global Header (Same on Every Page — Sticky)
All three elements glued together, always visible:

1. **Announcement Banner** — Dismissible (X button). Rep controls via chatbot: on/off toggle, custom text, custom links. NR controls color (matched to template). For time-sensitive announcements.

2. **Scrolling Ticker** — Horizontal scroll, medium-to-slow speed. Rep controls via chatbot: on/off toggle, custom text, links. NR controls color. For ongoing messages, show schedule hype.

3. **Header Bar** — Black background (locked). Hamburger menu (left), site/business name (center), Shop button (right, links to rep's BP order page). Only business name and Shop link URL change per rep.

### Global Footer (Same on Every Page)
Three columns on desktop, stacked on mobile:

1. **Brand column:** Business name, tagline (pulled from hero), team identification line (e.g., "Kara is a proud member of Fizz City"). Rep provides team name via chatbot.

2. **Quick Links:** Mirrors header nav menu links.

3. **Connect with [Rep Name]:** Social media links and email. Rep manages via chatbot.

4. **Optional Custom Links Column:** Rep adds personal links (side businesses, etc.) via chatbot. Chatbot flags inappropriate links for NR review before publishing.

**Bottom bar (locked — Updated Session #9):**
"© [Year] [Business Name]. All rights reserved. | [Rep Name] is an Independent Bomb Party Representative. Bomb Party® is a registered trademark of Bomb Party LLC. [Business Name] is not affiliated with, endorsed by, or sponsored by Bomb Party LLC. | Powered by Neon Rabbit Sparkle Suites"

"Powered by" link → rep-facing homepage of yoursparklesuite.com (decided Session #9). Disclaimer text parked for legal review.

### NR Copywriting Service
NR writes all initial copy for each rep based on client interview — taglines, descriptions, About content, everything. Creative copywriting is part of the service. Rep can change any text later via chatbot.

### Chatbot as Site Customization Interface
The chatbot is the rep's entire site customization interface — not just operational tasks. What reps can do through chatbot: update banner/ticker text, swap hero images, update tagline, update About page text, enable/disable streaming buttons, swap TikTok embeds, update any text content, request image swaps. Requests outside chatbot capability → auto-flag to NR.

---

## Homepage Spec (Session #6)

**Reference site:** Sprinkled in Diamonds (Kara Weeks) — sprinkledindiamonds.com

### Section 1 — Hero
- Full-width hero image (primary personalization element)
- **Overlay content:** Business name (large), "WITH [REP NAME]" subtitle, custom NR-written tagline, standard CTA text (locked structure)
- **Action buttons:** "Shop Bomb Party" (rep's BP order page) + streaming platform buttons (TikTok, Instagram Live, Facebook Live, YouTube Live — rep enables via chatbot, each gets its own button, appears everywhere streaming buttons exist)

### Section 2 — Live Queue & Calendar (Automation Section)
**Layout:** Three cards on desktop (side by side), vertical stack on mobile

**Card 1 — Live Queue (always visible, permanent):**
Serves triple duty: pre-order display before shows, live reveal queue during shows, educational placeholder between shows.

Data source: Chrome extension scrapes BP dashboard (server-side API eventually). Sync: ~1 min scrape, ~1 min website update.

| State | Trigger | Display |
|-------|---------|---------|
| Offline | No active show, no pre-orders | Educational placeholder ("Coming Soon" or similar) |
| Offline with pre-orders | Pre-orders exist for next show | Shows pre-order list |
| Live | BP dashboard activity detected | "Live Now" mode — queue order, updates in real-time |
| Auto-offline | 15 min after last scrape update | Reverts to offline state |

Card expands vertically to accommodate list length.

**Cards 2 & 3 — Next Two Upcoming Shows:**
Pulls from native Supabase calendar. Only NEXT TWO events display.

Each card shows: event name, date, **time in VIEWER'S local timezone**, optional special message, discount codes in styled bubbles (ALL CAPS, tap/click to copy to clipboard), featured collections (links), streaming buttons, "Add to Calendar" button (one-way export).

Dynamic: impromptu show added → slides in, furthest drops off. Show cancelled → next two backfill. All managed via chatbot.

### Section 3 — "What is a Bomb Party?" + TikTok Embed
**Two cards side by side on desktop, stacked on mobile**

**Card 1 — "What is a Bomb Party?":**
Educational card for first-time visitors. Standard copy with rep name swapped in. Three-step visual:
1. Order Your Jewelry
2. Watch Live — "Join [rep name]'s live on TikTok to watch as she reveals your surprise jewelry"
3. Receive Your Amazing Handcrafted Jewelry

**Card 2 — TikTok/Social Embed:**
ONE TikTok embed on homepage — reserved for a showcase video (diamond/unicorn reveal or rep's favorite). Video loops continuously (prevents TikTok showing competitor suggestions). Full video visible within card without internal scroll. "Follow for More Reveals" button below. Rep swaps via chatbot.

### Section 4 — "Never Miss a Show!" (Email/SMS Signup)
Single centered card. Fields: Email (required), Cell phone for SMS (optional). "Sign Me Up!" button. Consent text (locked structure, business name swapped in). Data → Supabase → rep's customer list.

**Compliance flag:** Consent language parked for legal review. See SS_KB_Legal module.

### Trade Board Placement (Layout TBD)
Trade board lives on homepage near Live Queue (in-show experience section — customer watches show, sees queue position, browses trade board simultaneously). Calendar section may need restructuring. Flagged for layout optimization review after all research complete.

### Homepage Complete Structure (Top to Bottom)
1. Global header
2. Hero — image, business name, tagline, CTA buttons, streaming buttons
3. Live Queue & Calendar — three automation cards
4. "What is a Bomb Party?" + TikTok embed — two educational/social cards
5. "Never Miss a Show!" — email/SMS signup card
6. [Trade board — position TBD in optimization pass]
7. Global footer

---

## About Page Spec (Session #7)

**Reference site:** Sprinkled in Diamonds (Kara Weeks)

### Hero
Different image from homepage (same sourcing rules). Overlay: Business name (small, uppercase), "Meet [Rep Name]" (large, gradient text), rep's tagline.

### Section 1 — Bio Cards (Three Cards, Locked Structure)
Alternating text/image layout: text-left/image-right → image-left/text-right → text-left/image-right. Mobile: stacked vertically.

**Card 1 — Origin Story ("How It All Started"):**
How rep discovered BP, what hooked them, their journey to becoming a rep. One media element (personal photo, TikTok embed, or personal video — rep's choice). NR writes copy from client interview.

**Card 2 — Personal Life ("Life Beyond the Sparkle"):**
Family, pets, hobbies, interests — whatever rep is comfortable sharing. One media element. NR writes copy.

**Card 3 — The Business Experience ("The [Business Name] Experience"):**
What their shows are like, style, schedule, what customers can expect. One media element. CTA buttons at bottom — default: "Shop Now" + second button (e.g., "Join the Party"). Rep can customize button text and links via chatbot.

**Media sourcing for bio cards:** Rep-provided ONLY. No stock images — personal photos, TikTok embeds, or personal videos. TikTok embeds may need human intervention if technically problematic — chatbot attempts, auto-flags to NR if issues.

### Section 2 — "Follow the Journey" (Two Media Cards)
Section title: NR-written per rep (NOT locked — "Follow the Journey," "Watch the Sparkle," or whatever fits brand voice). Subtitle references rep's actual primary platform.

Two cards side by side on desktop, stacked on mobile. Each card holds TikTok embed, personal video, or photos — rep's choice. Managed via chatbot.

### About Page Complete Structure (Top to Bottom)
1. Global header
2. Hero — "Meet [Rep Name]," tagline, NR-chosen overlay treatment
3. Three bio cards — origin story, personal life, business experience
4. "Follow the Journey" — two media cards
5. Global footer

---

## Join Team Page Spec (Session #7)

**Reference site:** Britt with Bling (Brittany Osborne) — Kara's site doesn't have this page.

**Logic:** Infrastructure always built for every rep. If rep opts out of team, page is HIDDEN from nav (not deleted). Unhide when rep is ready — zero rebuild work. 4 of 5 current clients want teams.

### Section 1 — Hero
Hero image (same sourcing rules). Overlay: Team name as headline (gradient text), recruitment pitch text (current BP promotion or general message), CTA button → rep's BP referral/starter pack page (unique per rep). Rep updates via chatbot as promotions change. NR writes initial content.

### Section 2 — Team Member Grid
Grid of mini profile cards. Layout: 4 per row desktop, single column mobile.

**Card scaling:** Small team = larger cards. Large team = cards scale down. NR designs breakpoints.

**Grid order:**
- **FIRST:** Rep themselves (team lead)
- **MIDDLE:** Team members
- **LAST:** "This is Your Spot" recruitment CTA card — "Apply to the Team" button (evergreen locked text) → same BP referral page

**Empty state:** Just two cards — rep's card + "This is Your Spot." Professional from day one.

**Each team member card:** Circular headshot (top left), business/channel name (small, colored), first name (large, bold), location pin + state, "CONNECT" label with platform icons (TikTok → streaming channel, Crown → website, YouTube → YouTube, others as needed).

**Roster management:** Rep manages via chatbot — add member (name, business name, state, headshot, social links), remove, update. Also surfaces in portal as view layer.

### Section 3 — "Why Join The [Team Name]?" (LOCKED Content)
Title "Why Join The [Team Name]?" in gradient text (team name swaps in). Subtitle: "Turn Your Passion into Profit" (locked).

Six benefit cards in 3x2 grid (desktop), single column (mobile) — **FULLY LOCKED, NR-written:**
1. Supportive Community
2. Flexible Income
3. Training & Mentorship
4. Amazing Products
5. Work From Anywhere
6. Growth Opportunities

Rep CANNOT change benefit card content without requesting NR review.

### Section 4 — Recruitment FAQ
"Frequently Asked Questions" in gradient text. Subtitle: "Everything you need to know about joining The [Team Name]."

Accordion-style, +/- toggle.

**Six LOCKED questions (only team name swaps in):**
1. What is The [Team Name]?
2. How much does it cost to join?
3. Do I need experience to join The [Team Name]?
4. How much time do I need to commit?
5. What kind of support will I receive?
6. Can I really make money doing this?

**ANSWERS are customizable** — chatbot helps rep write personalized answers during launch. Rep updates anytime via chatbot. NR can provide starter answers to personalize.

Link at bottom: "Need More Info? See Our Full Rep FAQ →" → Unicorns & Diamonds / FAQ page.

### Section 5 — Final CTA
Card with icon, headline "Ready to Sparkle With Us?", recruitment pitch with team name, "Join The Team Now" button → same BP referral page. LOCKED standard content. Team name swaps in.

### Join Team Complete Structure (Top to Bottom)
1. Global header
2. Hero — team name, recruitment pitch, CTA to BP referral page
3. Team member grid — rep first, team members middle, "This is Your Spot" last
4. "Why Join" — six locked benefit cards
5. Recruitment FAQ — six locked questions, personalized answers
6. Final CTA — "Ready to Sparkle With Us?"
7. Global footer

---

## Unicorns & Diamonds / FAQ Page Spec (Session #8)

**The MOST LOCKED page in the entire template.** All content NR-controlled, evergreen. No rep customization of content. Visual presentation differs per site (colors, fonts, template styling) but information is identical across all sites.

**Push-update architecture:** When BP changes something, NR updates ONCE → pushes to ALL sites simultaneously. Zero rep involvement.

**BP Change Notification Workflow:**
1. BP Intelligence system catches the change
2. NR pushes site updates across all sites
3. NR sends proactive email to all reps: "A Bomb Party change happened, we're updating your site"
Turns routine maintenance into a trust-building moment.

**Per-rep elements (auto-populated from Supabase profile, zero rep effort):**
- Hero image (visual variety — same sourcing rules, still varied per rep)
- Rep name swaps in answers
- Business name swaps in subtitle and answers
- Rep's BP shop link
- Rep's streaming platform buttons
- Rep's team name (Category 5)
- Rep's social handles

### Hero
Title: "Unicorns & Diamonds" — **LOCKED**, same on every site, large gradient text. Subtitle: Educational copy about exclusive/premium BP jewelry — **LOCKED**. Hero image: varied per rep. Overlay treatment: NR's call.

### Section 1 — "Every Reveal is a Surprise!" (Value Tier Cards)
Title: **LOCKED**. Three value tier cards, all locked:

| # | Tier | Value Range | Description |
|---|------|-------------|-------------|
| 1 | Everyday Sparkle | $19.95–$49.95 | Beautiful daily wear pieces |
| 2 | Diamond Territory | MSRP up to $3,500 | Premium genuine diamonds in sterling silver |
| 3 | Unicorn Magic | MSRP $1,000+ | Rarest finds — luxury rare and limited jewelry |

Price ranges monitored via BP Intelligence — when BP adjusts pricing, NR updates once and pushes everywhere.

### Section 2 — "The Thrill of the Reveal" (CTA Divider)
Title: **LOCKED**. Locked template copy with rep name swap. Two buttons: "Shop Now" (→ rep's BP order page) + streaming platform buttons. Follows site-wide button design standards.

### Section 3 — Frequently Asked Questions
Title: "Frequently Asked Questions" — **LOCKED**. Subtitle: "Everything you need to know about your [Business Name] experience" — **LOCKED** with business name swap.

**Category nav bar:** "Browse by Category" header with smooth-scroll buttons. Five locked categories, locked order.

**Five FAQ categories — accordion (+/- toggle):**

| # | Category | Icon | Questions |
|---|----------|------|-----------|
| 1 | Premium Collections | Crown/gem | 10 (sub-sections: Sterling Club, Gold Vermeil, Stone Cuts, Shopping & Value) |
| 2 | The Reveal Experience | Gift | 5 |
| 3 | The Jewelry & Quality | Sparkle | 4 |
| 4 | Shipping & Returns | Package | 5 |
| 5 | Getting Started as a Rep | Person | 6+ |

**Total: 36 questions across 5 categories.**

**ALL questions LOCKED.** ALL answers LOCKED template copy with dynamic rep data: rep name, business name, BP shop link, streaming schedule, team name (Cat. 5), social handles. Auto-populated from Supabase profile.

**Category 5 distinction from Join Team FAQ:** Category 5 = universal BP education ("here's what being a rep is about"). Join Team FAQ = personal recruitment pitch ("here's why you should join MY team"). Intentionally separated. Join Team FAQ links here.

### Unicorns & Diamonds Complete Structure (Top to Bottom)
1. Global header
2. Hero — "Unicorns & Diamonds" title (locked), educational subtitle (locked), hero image varied per rep
3. "Every Reveal is a Surprise!" — three value tier cards (all locked)
4. "The Thrill of the Reveal" — CTA divider with rep name swap
5. FAQ — 36 questions across 5 accordion categories, locked template copy with dynamic rep data
6. Global footer
