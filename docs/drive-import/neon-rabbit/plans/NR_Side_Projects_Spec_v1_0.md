# Neon Rabbit — Side Projects Spec
**Version:** 1.0 | **Created:** April 11, 2026 | **Status:** PARKED

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Google Drive connector (on demand)
**📁 UPLOAD TO PROJECT:** No — reference only when needed
**🏷 PROJECT:** Neon Rabbit (general)
**👤 WHO USES IT:** Louis (reference), Claude (when working on either project)
**🔄 UPDATE TRIGGER:** When either project moves from parked to active

---

## Overview

Two standalone side projects scoped during the April 11, 2026 planning session. Neither is on the active build plate. Both are parked behind dashboard (Phase 2B) and Sparkle Suite priority work. Neither project is a Sparkle Suite product — both are standalone.

---

## Project 1 — Bling Kitchen Recipe Migration

### Current State (Manual Workflow)

Heather (The Bling Kitchen) sends recipe content via text/photos. The current process:

1. Heather sends photos of handwritten recipes from her cookbook/scrapbook
2. Heather also sends food photos (finished dish images)
3. Louis uploads recipe photos to Google Gemini Pro
4. Gemini extracts and formats text into three sections matching the Readdy.ai card structure:
   - **What You'll Need** — bulleted ingredient list with measurements
   - **How to Make It** — numbered step-by-step instructions
   - **Note** — conversational pro-tips in Heather's voice
5. Louis feeds the formatted text to the Readdy.ai agent via the chat interface
6. Louis selects which food photo goes on the card front (carousel thumbnail) vs. interior (hero shot at top of expanded card)
7. Louis uploads images to the correct card positions
8. Louis babysits the Readdy agent during placement (it gets "loosey-goosey")
9. TikTok video embeds are already placed and don't need updating

### Backlog

Approximately 10+ recipes remaining in the backlog. Heather will continue sending new recipes in the future — this is an ongoing need, not a one-time batch.

### Current Site Reference

- **Site:** blingkitchen.com (hosted on Readdy.ai)
- **Recipe section:** "In the Pantry" page (`/in-the-pantry`)
- **Card layout:** Carousel of recipe cards organized by category (Baking & Sweets, Dinners & Mains, etc.)
- **Card click-through:** Opens expanded view with hero image, three content cards (TikTok embed, What You'll Need, Note), and How to Make It section
- **Mobile carousel:** Swipe with dot page indicators (active dot = brand purple pill, inactive = soft lavender)

### Decision: PARKED — Manual Continues

Continue the manual Gemini → Readdy agent workflow for now. No automation built.

### Future Plan: Full Migration Off Readdy.ai

When Sparkle Suite platform infrastructure is built and running:

1. **Export Bling Kitchen from Readdy** — Readdy supports export as React/Next.js code
2. **Stand up own repo** — New repo or subdirectory, deployed on Vercel with blingkitchen.com domain
3. **Recipes in Supabase** — Structured table in neon-rabbit-core: title, ingredients (JSON), instructions (JSON), notes, image URLs, status (submitted/reviewed/published), category
4. **Images in Supabase Storage** — Food photos stored in a dedicated bucket
5. **Recipe intake web app** — Simple unlisted link (no auth) where Heather uploads:
   - Recipe name
   - Photo(s) of handwritten recipe
   - Food photos (for card front and interior)
6. **AI processing on upload** — Claude API vision extracts handwritten recipe text, formats into three-card structure automatically
7. **Auto-publish to site** — Recipe data renders natively from Supabase, no manual placement needed
8. **Notification to Louis** — Email or push when new recipe is published, Louis does QA only
9. **Sparkle Suite hybrid** — Bling Kitchen doesn't need to BE a Sparkle Suite site, but can consume Sparkle Suite features as embedded components (chatbot, automations, Live Queue) when ready

### Key Insight

The recipe data lives in a structured database either way. If she stays on Readdy forever, the app is still a useful intake/processing tool. If she migrates, the data is already structured and ready to render. No wasted effort either direction.

### Readdy.ai Research Notes

- Readdy has Supabase integration built in (database ops, file storage, Edge Functions)
- API key page exists at readdy.ai/user/api-key — potential programmatic access
- Readdy Agent docs exist — potential for automated content push
- Export supported: React, Vue, HTML/CSS, UniApp, Figma
- These paths were not fully explored — investigate when migration is scoped

---

## Project 2 — Priscilla's Quilting Portfolio Site

### Concept

Standalone portfolio website for Priscilla (Louis's mother-in-law, based in Boston). A showcase for her handcrafted quilts — treated as textile art, not hobby crafts. This is NOT a Sparkle Suite project. Completely standalone.

This is also Neon Rabbit's showcase/portfolio piece — the site that demonstrates what one person + AI can build. Sparkle Suite makes the money; this makes the impression.

### Design Direction (APPROVED)

- **Aesthetic:** Dark gallery — high-end art portfolio feel, NOT Pinterest/crafts
- **Base color:** Deep dark purple-black (#0f0a1a)
- **Accent system:** Purple (#c4a0e8, #7f57c2) and green (#7dcea0, #5dca88) — pulled from Priscilla's signature colors
- **Neutral:** Warm cream/off-white for text (#f0e6ff)
- **Layout:** Mixed grid gallery — featured pieces get larger cards, creates visual rhythm
- **Typography:** Elegant but warm — art made with love, not a cold gallery
- **Mobile:** Full-bleed images, swipe between quilts like a private collection
- **Animations:** Subtle parallax/fade on scroll, quilts unveiled as you scroll
- **Footer:** "Built by Neon Rabbit Digital Services" credit

### Hero Section — Seedance 2.0 AI Video

First test of the Claude Code + Seedance 2.0 workflow (from Jono Catliff video captured to Open Brain April 10, 2026).

**Video concept:** Close-up of purple and green fabric with visible quilting stitches, light slowly moving across the texture revealing depth of needlework, pulling wide to show geometric patterns emerging. Cinematic, slow, meditative.

**Workflow:**
1. Generate reference images via Gemini (Nano Banana method from video)
2. Feed Seedance 2.0 (via Higgsfield) a prompt describing the visual mood
3. Generate 5–10 second cinematic loop
4. Claude Code builds the site with video as hero background
5. Deploy to Vercel

**If successful:** Consider adopting Seedance hero videos as a standard Sparkle Suite feature — cinematic jewelry videos for each rep (jewelry catching light, sparkle effects, slow-motion reveals).

### Quilts Reviewed (Design Reference)

| Quilt | Style | Colors | Notes |
|---|---|---|---|
| Cathy's Quilt | Traditional geometric star pattern | Deep purple, floral print, green border, cream | Beautiful clover/flower quilting stitch pattern |
| Damond's Quilt | Bold graphic — lion center panel | Black, green zigzag chevrons, red accents | Tight, even stipple quilting. Strong presence. |
| Sister Jo's Quilt | Art quilt — rainbow butterflies | Full rainbow spectrum, black borders, mixed chevron trim | Showstopper. Free-motion leaf quilting in borders. Gallery centerpiece quality. |
| Keisha's Quilt | Monochromatic tonal study | Multiple purple shades (deep plum to soft lavender), cream | Sophisticated, reads like fine art. Storm at Sea or similar interlocking geometric. |

**Key observation:** Priscilla is not a one-style quilter. She does traditional geometric, bold graphic, art quilting, and tonal studies. The site must honor that range.

### Tech Stack

- **Framework:** Next.js + TypeScript + Tailwind
- **Hosting:** Vercel
- **Database:** Supabase (neon-rabbit-core or standalone — TBD)
- **Storage:** Supabase Storage for quilt images
- **Domain:** TBD — needs to be purchased

### Upload App (Priscilla's Interface)

- Simple unlisted link — no auth, no login, no friction
- Priscilla opens on her phone, uploads quilt photo(s), types a short description, hits submit
- Photos go to Supabase Storage
- Record created in quilts table (title, description, image references, timestamp, status)
- Site renders automatically from the database — new quilt appears without manual intervention
- No AI processing needed — she types the description herself (unlike Bling Kitchen's handwritten recipe extraction)

### Site Structure

1. **Hero** — Full-screen Seedance cinematic video, site name, tagline, CTA
2. **Collection/Gallery** — Mixed grid of quilt cards, each with photo, title, brief description
3. **About the Artist** — Priscilla's bio, stats, location
4. **Footer** — Minimal, includes Neon Rabbit credit

### Estimated Build

- Site: 1 Claude Code session
- Upload app: 1 Claude Code session
- Seedance hero video: Separate workflow (Higgsfield/Seedance generation + integration)
- Total: 2–3 focused sessions

### Current Photo Storage

Priscilla currently drops quilt photos into a Google Drive folder. These will need to be migrated to Supabase Storage as part of the build.

---

## Priority & Sequencing

| Project | Status | Blocked By | Trigger to Activate |
|---|---|---|---|
| Bling Kitchen Migration | PARKED | Sparkle Suite platform build | Sparkle Suite infrastructure running + stable |
| Priscilla's Quilting Site | PARKED (design approved) | Louis having a build window | Whenever Louis wants to knock it out — no dependencies |

Neither project is on the active build plate. Both sit behind:
1. Neon Rabbit HQ Dashboard (Phase 2B — Stripe + Plaid)
2. Sparkle Suite planning completion and build

Priscilla's site has no dependencies and can be picked up anytime as a quick win / palate cleanser between heavy platform work.

---

*This spec covers two standalone side projects. Update when either moves to active status.*
