---
name: sparkle-suite-master-brand
description: "Use when creating or reviewing Sparkle Suite rep-facing content such as homepage copy, signup copy, TikTok hooks, YouTube Shorts scripts, newsletter issues, email, SMS, Nic-Nac messaging, and rep acquisition materials. Trigger when the request mentions Sparkle Suite, Trade board, Live queue, Live event calendar, Email updates, SMS updates, Nic-Nac, waitlist copy, short-form video, newsletter, or brand review."
---

# Sparkle Suite Master Brand

## Overview

Load the local Sparkle Suite brand system first, then write or review from those files. Do not answer from memory, generic SaaS instincts, or unrelated repo context.

## Required sources

Read these before producing content:

- `docs/sparkle-suite/brand/00-master-index.md`
- `docs/sparkle-suite/brand/01-master-brand-spec.md`
- `docs/sparkle-suite/brand/02-messaging-pillars.md`
- `docs/sparkle-suite/brand/03-nic-nac-positioning.md`

Then load the matching channel files:

- Short-form video: `docs/sparkle-suite/brand/playbooks/short-form-video.md`, `docs/sparkle-suite/brand/playbooks/short-form-video-specialist-workflow.md`, `docs/sparkle-suite/brand/templates/short-form-video-hooks.md`, `docs/sparkle-suite/brand/templates/short-form-video-scripts.md`, `docs/sparkle-suite/brand/templates/captions-and-ctas.md`, and `docs/sparkle-suite/brand/templates/tiktok-native-concept-batch.md`
- Newsletter: `docs/sparkle-suite/brand/playbooks/email-newsletter.md` and `docs/sparkle-suite/brand/templates/newsletter-issues.md`
- Email or SMS: `docs/sparkle-suite/brand/playbooks/email-and-sms.md` and `docs/sparkle-suite/brand/templates/email-and-sms.md`
- Homepage or signup: `docs/sparkle-suite/brand/playbooks/homepage-and-signup.md` and `docs/sparkle-suite/brand/templates/landing-page-sections.md`
- Rep acquisition materials: `docs/sparkle-suite/brand/playbooks/rep-acquisition-materials.md`
- Reviews and QA: `docs/sparkle-suite/brand/04-brand-review-checklist.md`

If the docs are not loaded yet, stop and load them before drafting.

## Working modes

### create mode

1. Load the core docs first.
2. Load the matching playbook before drafting.
3. Open the matching template before generating fresh copy.
4. Draft only from approved Sparkle Suite claims and channel rules.

### review mode

1. Load the core docs first.
2. Load the matching playbook and `docs/sparkle-suite/brand/04-brand-review-checklist.md`.
3. Mark any drift from approved claims, tone, Nic-Nac framing, or channel rules.
4. Explain the fix in plain English instead of hand-waving.

## Domain drift guardrails

Baseline failure to prevent: a fresh agent went wrong domain entirely, used no local docs, and wrote jobs / installs / pipeline language for a Sparkle Suite Trade board TikTok request.

Red flags:

- domain drift into developer tooling, hiring, installs, onboarding pipelines, or internal build processes
- generic SaaS copy, generic business coaching, or agency-flavored copy
- AI slop, prompty filler, fake-luxury language, or brainstorm-note wording
- overclaiming features, roadmap certainty, or outcomes not supported by the docs
- off-brand Nic-Nac framing, including treating Nic-Nac as the main product story
- republishing rejected public prelaunch design/copy without fresh Louis approval, especially `One easier home for your Bomb Party business.`, the software-led public page, `Tell us where to send launch updates.`, or named success-card copy such as `Thank you, Louis Chapman. We've got you.`
- polishing, rebranding, rewriting, or visually improving the public site unless Louis explicitly says `go ahead and polish this`

If any red flag appears, stop, reload the local brand docs, and rewrite from the approved Sparkle Suite brand system.

## Brand rules that must survive every draft

- Sparkle Suite is a standalone rep-facing brand, not a Neon Rabbit agency sub-brand.
- Approved feature set: Trade board, Live queue, Live event calendar, Email updates, SMS updates, and Nic-Nac.
- Reveal tools should not be used as a primary public feature claim.
- Nic-Nac is the built-in Sparkle Suite assistant for reps, not a generic chatbot.
- Keep the copy polished, warm, plain-English, rep-centered, and premium without stiffness.
- Keep short-form video and newsletter work grounded in customer experience, rep advantage, smoother live shows, and less patchwork.
- The locked public `/prelaunch` version is `Sparkle Suite V1 Preview Public Site`, sourced from Vercel deployment `dpl_2yAXz2pKp4QsJ4sQzboqpfXfqyoM`.
- The locked public hero is `A better customer experience starts with a better rep setup.`

## Output check before sending

- Did I use the local docs and channel files first?
- Does this sound like Sparkle Suite instead of another domain?
- Are the feature claims truthful and distinct?
- Does Nic-Nac stay useful and secondary to the broader product story?
- Would a rep understand why this matters in a live-show workflow right away?
