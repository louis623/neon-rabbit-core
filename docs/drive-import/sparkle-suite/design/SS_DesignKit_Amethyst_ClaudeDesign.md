# DO NOT USE

This file is retired for current Sparkle Suite brand/design work.

Reason: it is not based on the current production site at https://www.yoursparklesuite.com/prelaunch.

Use the official production-based design kit in docs/sparkle-suite/brand instead.

---
# Sparkle Suite — Amethyst Design System

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Uploaded to Claude Design project as input file
📁 UPLOAD TO PROJECT: No — this is a Claude Design input, not a Claude Chat L1 file
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Claude Design (primary), Louis (reference)
🔄 UPDATE TRIGGER: Design system changes, page spec changes, new design decisions

---

## Standing Instructions for Claude Design

- Before making ANY change to ANY file, re-read it fresh from disk first. Never edit from your memory of what the file looked like earlier in the session. Confirm you've re-read before editing.
- Do not overwrite user Tweaks panel settings. If the user has adjusted values via Tweaks, those values are authoritative — preserve them.
- When fixing issues, make the smallest possible edit. Do not propose architectural rewrites or file splits unless explicitly asked.

---

## Brand Context

Sparkle Suite is a SaaS platform for independent Bomb Party jewelry representatives. Each rep gets their own personal website to showcase their live reveal events, trade jewelry, recruit team members, and connect with customers. Reps are mostly women, social-media-savvy, running small home businesses. The sites are operational and marketing — not product catalogs.

**How Bomb Party works:** Bomb Party is a jewelry company that sells through independent reps. Reps host live shows on TikTok, Facebook Live, Instagram Live, or YouTube Live. During a show, customers purchase a "bomb" (a sealed candle, bath bomb, or package) for a set price — usually $24.95 to $50+. Inside each bomb is a surprise piece of jewelry. The customer doesn't know what they're getting until the rep opens it live on camera. This is called a "reveal." Each piece comes in a box with a label listing the design name, material, stone type, and Bomb Party's stated MSRP ($40 to $1,500+).

**Why customers trade:** Since the jewelry is a surprise, customers don't always love what they get. Without the trade board, the customer tells the rep during the live show "I don't love this, what do you have to trade?" and the rep has to manually show trade options one by one on camera, eating valuable show time. With the trade board, the rep says "Go to my trade board on my website, find something you like, and submit a request." The customer browses on their phone while still watching the stream, picks a piece, submits a trade request, and the rep handles it after the show. Show keeps rolling.

**How teams work:** Reps can recruit other people to become Bomb Party reps. When someone signs up under an existing rep, they become that rep's "downline." Teams have names (e.g., "Fizz City," "Virtuous Sisters," "Hustle and Heart"). Reps earn commissions from their downline's sales. The Join Team page on a rep's website is a recruitment pitch — not a corporate careers page. Visitors are regular people on their phones wondering if this could be a fun side hustle.

This design system is for the **Amethyst** kit — one of 5 bundled visual themes reps can choose from. Amethyst is the default kit for all reps at launch. The other four kits (Garnet, Velvet, Rose Quartz, Amber) will be built later. Amethyst is the sleek, geometric, modern option. Think clean lines, precise spacing, structured layouts with subtle depth. Not cold or clinical — confident and polished. The aesthetic should feel like a high-end fashion editorial crossed with a modern SaaS landing page.

**Build focus rule (clarified May 4, 2026):** carry Amethyst through the full Sparkle Suite system first (design -> site build -> backend wiring -> rep validation -> launch readiness) before spending meaningful build time on the other kits.

**Personality keywords:** Sleek, geometric, modern, precise, confident, polished, structured.

---

## Typography

- **Heading font:** Vend Sans — use for all headings (h1–h4), display text, hero copy
- **Body font:** Vend Sans — use for all body text, captions, labels, UI copy
- **Source:** Fontshare (ITF Free Font License — free commercial use). Load via: `https://fonts.googleapis.com/css2?family=Vend+Sans:wght@400;500;600&display=swap`
- **Typographic scale:** Hero 48–64px, h1 36px, h2 28px, h3 22px, body 16px, caption 13px
- **Weight:** 400 for body, 500–600 for headings — do not use 700+ unless explicitly needed
- **Letter spacing:** Slightly loose on headings (-0.01em to 0), normal on body

---

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | #E8DFF5 | Page background, card surfaces |
| Foreground | #2A1F40 | All primary text, headings, icons |
| Foreground Muted | #5C576A | Secondary text, placeholders, metadata |
| Primary | #D209E3 | CTAs, active states, links, key UI accents |
| Accent | #480DDF | Hover states, pressed buttons, deep emphasis |
| Border | #C4C1CE | Dividers, input borders, card outlines |

- Do NOT use black (#000000) — use #2A1F40 as the darkest value
- Do NOT introduce colors outside this palette

---

## Visual Style

- **Cards:** Clean outlines using Border (#C4C1CE), consistent padding (16–24px). The Amethyst card interaction pattern is a two-card expandable stack — compact state on top, detail card expands beneath on hover/tap (130px → 300px). Functional, data-driven feel. 0.4s ease-in-out transition.
- **Buttons:** Claude should propose a button style that fits the sleek geometric Amethyst personality — clean edges, precise hover states, confident but not flashy. The button should feel like it belongs on a high-end fashion site.
- **Hover effects:** Subtle, precise, geometric. Expand/reveal rather than bounce/wiggle. Transitions in the 0.3–0.5s range.
- **Border radius:** Keep it moderate — 8–12px for cards, 6–8px for buttons. Not pill-shaped, not sharp-cornered.
- **Shadows:** Minimal, used for depth and hierarchy. No heavy drop shadows.
- **Motion:** Smooth, deliberate. Ease-in-out curves. Nothing playful or bouncy — that's for other kits.
- **Icons:** Icons with colored/gradient circle backgrounds are a locked design element used site-wide for all icon treatments (benefit cards, educational steps, section headers).

---

## AI Assistant — Nic-Nac

The platform includes an AI assistant called **Nic-Nac** (spelled exactly like that — capital N, capital N, hyphen between). Nic-Nac helps reps manage their sites, add trade board listings, update content, and more — all through conversation.

**At launch, Nic-Nac is rep-facing only.** It lives in the rep's dashboard/portal, NOT on the customer-facing website.

**Customer-facing Nic-Nac:** The architecture should support a floating chat launcher on the customer-facing site, but it ships **toggled OFF** at launch. Design the launcher (it's a great component to have ready), but note it will be dormant at launch. When we're ready to activate it, we just flip a switch — no rebuild needed.

Do not add a visible Nic-Nac chat bubble to the customer-facing site design. The launcher designs (pill, round, square, dock, floating gem) are for the rep portal, and for future customer-facing activation.

---

## Page Structure

Rep sites have 3 pages plus one external link in the nav:

### Navigation
Home | Trade Board | Join Team | "Learn about Bomb Party" (external link, opens new tab → universal info site on yoursparklesuite.com)

The header and footer appear on every page, styled with Amethyst colors and fonts. Same structure across all pages, different content.

---

### Site Chrome (Global — Every Page)

**Announcement Banner:** Dismissible (X button). Rep controls on/off toggle and custom text via Nic-Nac. Color matched to site template. For time-sensitive announcements.

**Dual Ticker (T3 — Dual Counter-Scroll):** Two rows scrolling in opposite directions.
- **Top row:** Rep-customizable text (promos, announcements, show times). Scrolls right. Rep manages via Nic-Nac.
- **Bottom row:** Trade board listing titles. Each listing is its own clickable link that takes the customer directly to that piece on the trade board page. Scrolls left (counter-direction). This is a passive discovery mechanism — jewelry pieces scroll by before the customer even scrolls down.
- Bottom row needs its own hover/active states on each listing since they're individual clickable elements, not just scrolling text.
- **Bottom row empty state:** When rep has zero trade board listings, the bottom row either hides entirely (collapsing to a single-row ticker) or shows a tasteful default message. Design whichever feels cleaner.

**Header Bar:** Black background (locked). Contains: hamburger menu (left), business name (center), Shop button (right, links to rep's BP order page). Only business name and Shop link URL change per rep.

**Footer:** Three columns + optional fourth.
- Column 1 — Brand: business name, tagline, team identification (e.g., "proud member of Fizz City")
- Column 2 — Quick Links: mirrors header nav
- Column 3 — Connect with [Rep Name]: social links and email, managed via Nic-Nac
- Column 4 (optional) — Rep-added custom links for side businesses (managed via Nic-Nac)
- **Bottom bar (locked):** "© [Year] [Business Name]. All rights reserved. | [Rep Name] is an Independent Bomb Party Representative. Bomb Party® is a registered trademark of Bomb Party LLC. [Business Name] is not affiliated with, endorsed by, or sponsored by Bomb Party LLC. | Powered by Neon Rabbit Sparkle Suites."

---

### Homepage Sections (top to bottom)

1. **Hero** — Full-width hero image with content overlay. Rep name, business name, tagline, two CTA buttons ("Browse my trade board" + "Watch me live" with streaming platform icons). Subtle animation (slow zoom or pan — NR picks style). Hero image sourced by NR during onboarding (stock photo subscription, rep picks from options; rep-provided or AI-generated as fallbacks).

2. **About Section** — Bio text with 3 media slots. Each slot holds a personal photo, TikTok embed, or personal video (rep-provided only, no stock). Social media links row. This replaces a separate About page — it's folded into the homepage. Rep customizes all content via Nic-Nac.

3. **Event Calendar / Upcoming Shows** — Two cards showing the rep's next two upcoming shows. Side by side on desktop, stacked on mobile. Each card contains:
   - Event name
   - Date and time displayed in the VISITOR'S local timezone (not the rep's — the site converts automatically)
   - Optional special message from the rep
   - Discount codes in ALL CAPS bubbles that copy to clipboard on tap
   - Featured collection links (link to Bomb Party collection pages)
   - Streaming platform button(s) — same buttons used site-wide
   - "Add to Calendar" button — one-way export to the customer's personal calendar app
   - Dynamic behavior: when a new show is added, it slides in and the furthest-future card drops off. Cancelled shows backfill automatically. Only ever shows the next 2.
   - All event data managed by the rep through Nic-Nac.

4. **"What is a Bomb Party?" + TikTok Embed** — Two-card layout, side by side on desktop, stacked on mobile.
   - Card 1: Educational explainer for first-time visitors. Standard copy with rep's name swapped in. Three-step visual: Order → Watch Live → Receive Jewelry. Each step gets an icon with colored/gradient circle background.
   - Card 2: TikTok embed — ONE video on the homepage, reserved for a showcase clip highlighting the rep's personality (a great reveal moment, a diamond/unicorn reaction, a favorite show clip). Loops continuously to prevent TikTok from auto-playing competitor suggestions. Full video visible without internal scrolling. Rep swaps this video anytime via Nic-Nac.

5. **"Never Miss a Show!" — Email/SMS Signup** — Single card, centered. Clean and simple.
   - Email field (required)
   - Phone field (optional)
   - Consent text with rep's business name swapped in
   - Submit button
   - Data flows to rep's subscriber list — independent of any social media platform.
   - Note: consent/disclaimer language still needs legal review. Use realistic placeholder consent text.

6. **Footer** — Global footer as described above.

---

### Trade Board Page

See separate trade board design brief for full context on how Bomb Party reveals and trading work. Key points:

- **Desktop:** Two-column layout. Left 1/3 = Live Reveal Queue (LRQ). Right 2/3 = trade board grid. When no live show is active, LRQ collapses and trade board goes full-width.
- **Mobile:** Trade board is primary full-width view. During a live show, a slim "LIVE NOW — X items revealed" banner appears at top with tap-to-expand drawer that slides down to show LRQ. Trade board layout stays stable underneath — no jumping when drawer opens/closes. When no show is active, the banner disappears entirely.
- **Trade card compact state:** Jewelry photo (AI-enhanced), value tier color indicator (Everyday Sparkle / Diamond Territory / Unicorn Magic), MSRP, design name, status (available only — pieces disappear entirely when a trade request is submitted).
- **Trade card expanded state:** Full description, reveal box photo, collection, material, stone, special features, "I Want This" CTA button.
- **Trade request form:** Three fields only (name, description of what they're offering, submit). No payment field. Clickwrap consent before submission.
- **Filter bar:** Collection, type, material, MSRP range, sort toggle.
- **Unicorn/diamond pieces:** Highlighted prominently — own row, special badge/glow, visual emphasis.
- **Every listing displays:** "Offered by [Rep Name], an Independent Bomb Party Representative."
- **Empty state:** Inviting message when no items on board.

---

### Join Team Page

See separate join team design brief for full context on how Bomb Party teams and recruitment work. Key points:

This page answers three questions: Who is this team? Why should I join? How do I sign up? The "Join" button links to the rep's unique Bomb Party referral page on bombparty.com — BP handles actual enrollment. Infrastructure always built for every rep but can be hidden from nav if rep opts out.

**Section 1 — Hero:** Team name headline, recruitment pitch text, CTA button to BP referral page. Rep updates via Nic-Nac as promotions change.

**Section 2 — Team Member Grid:** Mini profile cards. 4 per row desktop, stacked mobile. First card = rep (team leader). Last card = "This is Your Spot" recruitment CTA. Middle = team members. Cards scale down for large teams. Empty state = just rep's card + CTA card. Each card: circular headshot, business name, first name, state, social/connect icons.

**Section 3 — "Why Join The [Team Name]?":** FULLY LOCKED content — NR writes once, deploys everywhere. Only team name swaps in. Six benefit cards in 3×2 grid: Supportive Community, Flexible Income, Training & Mentorship, Amazing Products, Work From Anywhere, Growth Opportunities. Each card: icon with gradient circle background, bold title, short description.

**Section 4 — Recruitment FAQ:** Accordion-style. Six LOCKED questions (team name swaps in), CUSTOMIZABLE answers (rep writes their own with Nic-Nac's help). Link at bottom to universal BP info page.

**Section 5 — Final CTA:** "Ready to Sparkle With Us?" card with "Join The Team Now" button. Locked content, team name swaps.

---

## Design Principles

- **Mobile-first.** Most rep customers browse on phones, often while watching a live stream in another app.
- **Functionality over decoration.** Every element earns its space. No decorative fluff.
- **The rep is the brand.** The template is the canvas — the rep's photos, personality, and energy make it theirs. The design system should enhance, not overpower.
- **When in doubt, use less decoration, not more.**
- **The final output must feel cohesive — as if designed by one person with one system.**
- **Speed and simplicity for customer interactions.** Customers multitask between the site and a live stream. Trade requests, calendar checks, and queue peeks need to be fast and friction-free.
