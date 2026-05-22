# Britt with Bling Start Strong Design

## Purpose

Build a lightweight pilot for Brittany's new Bomb Party reps. The product helps new reps find answers, follow a setup path, and know when to ask Brittany.

This is not a replacement for Bomb Party University, Bomb Party support, or Brittany's mentorship. It is a plain-English resource guide and checklist that points reps to the right official resources, gives Brittany a place to add team guidance, and keeps common questions from turning into repeated one-off messages.

## Product Boundary

The pilot should live outside `neon-rabbit-core` in a new repo, tentatively named `britt-with-bling-start-strong`.

It may later become a Sparkle Suite add-on, but the first build should be isolated so Brittany's pilot can move quickly without changing Sparkle Suite launch scope.

The initial deploy target should support either:

- `start.brittwithbling.com` as the simplest DNS path, or
- `brittwithbling.com/start-strong` if Brittany's current domain/site hosting can route a path to this app.

## Audience

Primary users:

- New reps on Brittany's team.
- Brittany as the team lead reviewing questions and shaping content.

Design assumptions:

- Users may be non-technical.
- Screens must use plain English.
- Avoid LMS language such as modules, learning objectives, certification, and curriculum.
- Every screen should make the next action obvious within a few seconds.

## MVP Experience

The first clickable skeleton should have four main surfaces:

1. Home dashboard
2. Step detail view
3. Resources view
4. Floating Nic-Nac helper

### Home Dashboard

The dashboard shows:

- welcome message
- overall progress
- next recommended step
- grouped setup path
- one-click actions: `Continue next step`, `Mark done`, `I need help`

The setup path groups are:

1. Get Set Up
2. Learn the Back Office
3. Get Supplies Ready
4. Prepare for First Live
5. Ship and Follow Up
6. Questions for Brittany

### Step Detail View

Each step shows:

- step title
- what to do
- why it matters
- official resources
- Brittany's note
- actions: `Mark done`, `I need help`, `Ask Nic-Nac about this`

### Resources View

The resources view should separate official resources from team guidance.

Official resources known for the seed content:

- Bomb Party new rep enrollment guide: `https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Enrolling%20as%20a%20Party%20Rep-2024.pdf`
- BPU enrollment guide: `https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/How%20to%20Guide%20Your%20Downline%20Through%20the%20BPU%20Enrollment%20Process%2011.1.24.pdf`
- Bomb Party income disclosure statement: `https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Rep%20Use%20Documents/Bomb%20Party_Income%20Disclosure%20Statement_2025%20%281%29.pdf`
- Bomb Party shipping policy: `https://bombpartysupport.zendesk.com/hc/en-us/articles/33220290467732-Shipping-Policy`
- Bomb Party return policy: `https://help.bombparty.com/hc/en-us/articles/33194356359444-Return-Policy`
- FTC MLM business guidance: `https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing`

Seed content may include demo-only team guidance, but it must be labeled as sample Brittany guidance until Brittany approves or replaces it.

### Floating Nic-Nac Helper

Nic-Nac should live as a floating help button in the lower-right corner. Clicking it opens a compact chat panel.

Reasoning:

- It stays available anywhere.
- It does not crowd the simple dashboard.
- It is familiar enough for non-technical users.
- It can later become the real Nic-Nac integration without changing the whole layout.

For the clickable skeleton, Nic-Nac does not need real AI. It should answer from a small canned response map and route unknown or sensitive questions into the question list.

Nic-Nac's product rule:

> Nic-Nac helps new reps find answers, follow the setup path, and know when to ask Brittany.

Allowed answer lanes:

- checklist navigation
- BPU access basics
- finding official resource links
- starter supplies
- simple first-live prep
- shipping and return resource pointers
- Sparkle Suite soft mentions when naturally relevant

Escalation lanes:

- income promises
- taxes, legal, or accounting advice
- policy interpretation beyond linked official text
- large inventory spending advice
- account-specific support
- anything Nic-Nac cannot answer from the curated resource library

Escalation copy:

> I want you to get the right answer on that one. I saved it as a question for Brittany.

## Skeleton Data Model

The first skeleton can be data-file driven.

Core types:

- `Resource`: official or team resource with title, description, URL, and source type.
- `ChecklistStep`: step title, group, plain-English instructions, resource IDs, Brittany note, status.
- `Question`: rep question, linked step ID, status, and source of escalation.
- `NicNacResponse`: keyword triggers, response text, source resource IDs, and escalation flag.

Progress can persist in `localStorage` for the first clickable prototype. Real accounts, multi-rep tracking, Brittany admin editing, and AI retrieval belong in later phases.

## Visual Direction

Use the rendered concept as the first visual guide:

`C:\Users\louis\neon-rabbit-core\.superpowers\brainstorm\brittany-start-strong-preview\dashboard-concept.png`

Design qualities:

- white/light background
- restrained pink accent
- readable cards with small radius
- no decorative clutter
- clear status labels
- large touch-friendly buttons
- compact floating helper

## Acceptance Criteria For Skeleton

The skeleton is ready for Brittany review when:

- Home dashboard is clickable.
- A user can open a step and mark it done.
- Progress updates locally.
- Official resource links open in a new tab.
- Sample Brittany notes are visible and labeled appropriately.
- `I need help` creates a visible question item.
- Floating Nic-Nac opens and responds to at least five simple sample questions.
- Unknown or sensitive Nic-Nac questions are saved for Brittany.
- The UI works on desktop and mobile widths.
- The app can be deployed as a standalone site or embedded/routed from Brittany's domain later.

## Out Of Scope For Skeleton

- Real authentication
- Real AI calls
- Brittany admin editor
- Multi-rep backend tracking
- Email or SMS notifications
- Payment
- Bomb Party dashboard scraping
- Claims that Neon Rabbit, Sparkle Suite, Brittany, or Nic-Nac are official Bomb Party support

## Open Items For Brittany Meeting

- What does she expect a rep to know after 7, 30, and 60 days?
- Which questions does she answer repeatedly?
- Which BPU lessons are most important for new reps?
- What supplies does she personally recommend before first live?
- What does she consider dangerous or bad advice?
- What should Nic-Nac always escalate to her?
- Does she want a team dashboard in the first paid version?
- Does she prefer `start.brittwithbling.com` or a page under `brittwithbling.com`?
