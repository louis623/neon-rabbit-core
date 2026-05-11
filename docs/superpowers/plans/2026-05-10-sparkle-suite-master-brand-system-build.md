# Sparkle Suite Master Brand System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Sparkle Suite master brand toolchain in the repo so Louis can create and review rep-facing website, social, newsletter, email, SMS, Nic-Nac, and rep-acquisition content consistently.

**Architecture:** Store durable brand truth in `docs/sparkle-suite/brand/`, teach AI workers through a repo-local skill at `.agents/skills/sparkle-suite-master-brand/SKILL.md`, and protect the system with a focused Vitest file that verifies the required documents, playbooks, templates, and skill references exist and contain critical brand rules. Seed all content from the approved design spec and the current-direction doc instead of inventing new brand language during implementation.

**Tech Stack:** Markdown documentation, repo-local Codex skills, Vitest, Node.js `fs`/`path`.

---

## File Structure

### Core docs

- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\00-master-index.md`
  Front door that explains what exists, where it lives, and which file to use for each content request.
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\01-master-brand-spec.md`
  Durable master brand truth distilled from the approved design spec.
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\02-messaging-pillars.md`
  Messaging pillars, claim rules, audience framing, and headline guidance.
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\03-nic-nac-positioning.md`
  Sparkle Suite-approved Nic-Nac narrative and guardrails.
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\04-brand-review-checklist.md`
  Fast QA checklist for reviewing content before publishing.

### Playbooks

- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\homepage-and-signup.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\short-form-video.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\email-newsletter.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\email-and-sms.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\rep-acquisition-materials.md`

### Templates

- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\short-form-video-hooks.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\short-form-video-scripts.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\captions-and-ctas.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\newsletter-issues.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\email-and-sms.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\landing-page-sections.md`

### Skill and verification

- Create: `C:\Users\louis\neon-rabbit-core\.agents\skills\sparkle-suite-master-brand\SKILL.md`
- Create: `C:\Users\louis\neon-rabbit-core\tests\sparkle-suite-master-brand-system.test.ts`

### Source references

- Review: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\docs\superpowers\specs\2026-05-10-sparkle-suite-master-brand-system-design.md`
- Review: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\docs\superpowers\specs\2026-05-10-sparkle-suite-prelaunch-current-direction.md`

---

### Task 1: Build the core brand docs and seed the verification test

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\00-master-index.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\01-master-brand-spec.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\02-messaging-pillars.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\03-nic-nac-positioning.md`
- Create: `C:\Users\louis\neon-rabbit-core\tests\sparkle-suite-master-brand-system.test.ts`

- [ ] **Step 1: Write the failing verification test for the core docs**

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Sparkle Suite master brand system", () => {
  it("contains the required core brand docs with critical language", () => {
    const files = [
      "docs/sparkle-suite/brand/00-master-index.md",
      "docs/sparkle-suite/brand/01-master-brand-spec.md",
      "docs/sparkle-suite/brand/02-messaging-pillars.md",
      "docs/sparkle-suite/brand/03-nic-nac-positioning.md",
    ];

    for (const file of files) {
      expect(fs.existsSync(path.join(repoRoot, file)), file).toBe(true);
    }

    const brandSpec = read("docs/sparkle-suite/brand/01-master-brand-spec.md");
    expect(brandSpec).toContain("A better customer experience starts with a better rep setup.");
    expect(brandSpec).toContain("Trade board");
    expect(brandSpec).toContain("Live queue");
    expect(brandSpec).toContain("Live event calendar");
    expect(brandSpec).toContain("Email updates");
    expect(brandSpec).toContain("SMS updates");
    expect(brandSpec).toContain("Nic-Nac");
    expect(brandSpec).toContain("Reveal tools should not be used");

    const nicNac = read("docs/sparkle-suite/brand/03-nic-nac-positioning.md");
    expect(nicNac).toContain("built-in Sparkle Suite assistant");
    expect(nicNac).toContain("not a generic chatbot");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: FAIL because the new brand docs do not exist yet.

- [ ] **Step 3: Create the core docs with the approved brand content**

Create `docs/sparkle-suite/brand/00-master-index.md` with:

```md
# Sparkle Suite Master Brand System

## What this is

This is the operating system for Sparkle Suite's rep-facing master brand.

Use it for:

- website and signup copy
- short-form video
- email newsletter
- email and SMS
- Nic-Nac positioning
- rep acquisition materials

## Start here

1. Read `01-master-brand-spec.md`
2. Read the playbook for the channel you are working in
3. Use the matching template
4. Run `04-brand-review-checklist.md` before publishing

## File map

- `01-master-brand-spec.md` -> source of truth
- `02-messaging-pillars.md` -> positioning and message angles
- `03-nic-nac-positioning.md` -> Nic-Nac rules
- `04-brand-review-checklist.md` -> QA pass
- `playbooks/` -> channel strategy
- `templates/` -> reusable starting points
```

Create `docs/sparkle-suite/brand/01-master-brand-spec.md` with the approved sections from the design spec:

```md
# Sparkle Suite Master Brand Spec

## Brand core

- Tone: warm, polished, plain-English, rep-centered, approachable, premium without being stiff
- Visual identity: soft, polished, feminine without being sugary, premium without fake-luxury spectacle
- Core promise: Sparkle Suite helps reps stand out, create a better customer experience, run smoother live shows, and reduce behind-the-scenes patchwork

## Approved public hook

`A better customer experience starts with a better rep setup.`

## Approved feature claims

- Trade board
- Live queue
- Live event calendar
- Email updates
- SMS updates
- Nic-Nac

## Restricted claims

Reveal tools should not be used as a primary public feature claim right now.
```

Create `docs/sparkle-suite/brand/02-messaging-pillars.md` with:

```md
# Sparkle Suite Messaging Pillars

## Primary pillars

- Stand out: Sparkle Suite gives reps an edge customers can feel.
- Better customer experience: the customer side feels more polished, memorable, and easier to follow.
- Smoother live shows: Sparkle Suite supports better flow before, during, and around live shows.
- Less patchwork: Sparkle Suite reduces the scramble of scattered tools and manual work.
- Practical support: Sparkle Suite is grounded in real rep workflows, not flashy tech for its own sake.

## Brand guardrails

- Do not sound like a generic SaaS product.
- Do not sound like Neon Rabbit agency copy.
- Do not use MLM-hype language.
- Do not drift into AI slop or fake feature spectacle.
```

Create `docs/sparkle-suite/brand/03-nic-nac-positioning.md` with:

```md
# Nic-Nac Positioning

## What Nic-Nac is

- the built-in Sparkle Suite assistant for reps
- practical behind-the-scenes rep support
- a helper for live show flow and Sparkle Suite operations

## What Nic-Nac is not

- a generic chatbot
- AI theater
- the main product story ahead of the core rep-facing value

## Working summary

Nic-Nac is the built-in Sparkle Suite assistant that helps reps stay organized, run smoother live shows, and create a better customer experience.
```

- [ ] **Step 4: Run the test to verify the core docs pass**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: PASS for the core-doc assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/sparkle-suite-master-brand-system.test.ts docs/sparkle-suite/brand/00-master-index.md docs/sparkle-suite/brand/01-master-brand-spec.md docs/sparkle-suite/brand/02-messaging-pillars.md docs/sparkle-suite/brand/03-nic-nac-positioning.md
git commit -m "docs: add Sparkle Suite core brand system docs"
```

### Task 2: Add the review checklist and channel playbooks

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\04-brand-review-checklist.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\homepage-and-signup.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\short-form-video.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\email-newsletter.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\email-and-sms.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\playbooks\rep-acquisition-materials.md`
- Modify: `C:\Users\louis\neon-rabbit-core\tests\sparkle-suite-master-brand-system.test.ts`

- [ ] **Step 1: Extend the test to require the checklist and playbooks**

Add this test block:

```ts
it("contains the required channel playbooks and review checklist", () => {
  const files = [
    "docs/sparkle-suite/brand/04-brand-review-checklist.md",
    "docs/sparkle-suite/brand/playbooks/homepage-and-signup.md",
    "docs/sparkle-suite/brand/playbooks/short-form-video.md",
    "docs/sparkle-suite/brand/playbooks/email-newsletter.md",
    "docs/sparkle-suite/brand/playbooks/email-and-sms.md",
    "docs/sparkle-suite/brand/playbooks/rep-acquisition-materials.md",
  ];

  for (const file of files) {
    expect(fs.existsSync(path.join(repoRoot, file)), file).toBe(true);
  }

  const shortForm = read("docs/sparkle-suite/brand/playbooks/short-form-video.md");
  expect(shortForm).toContain("TikTok");
  expect(shortForm).toContain("YouTube Shorts");
  expect(shortForm).toContain("15-second");
  expect(shortForm).toContain("30-second");

  const newsletter = read("docs/sparkle-suite/brand/playbooks/email-newsletter.md");
  expect(newsletter).toContain("one newsletter brand");
  expect(newsletter).toContain("lead nurture");
  expect(newsletter).toContain("rep education");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: FAIL because the checklist and playbooks are not created yet.

- [ ] **Step 3: Write the review checklist and playbooks**

Create `04-brand-review-checklist.md` with:

```md
# Sparkle Suite Brand Review Checklist

- Does this sound like Sparkle Suite?
- Does this feel polished, warm, simple, and premium?
- Is this written in plain English for reps?
- Are only approved features being claimed?
- Are we overclaiming anything?
- Does Nic-Nac feel useful instead of gimmicky?
- Does this support standing out, better customer experience, or smoother live shows?
- Does this drift into generic SaaS, agency tone, hype, or AI slop?
- If this is email or SMS, are channel-specific compliance rules being respected?
```

Create the playbooks with these required sections:

```md
# Homepage and Signup Playbook

## Use this for
- homepage copy
- waitlist pages
- future signup pages

## Must emphasize
- better customer experience
- better rep setup
- approved feature claims only
- polished, plain-English conversion
```

```md
# Short-Form Video Playbook

## Primary platforms
- TikTok
- YouTube Shorts

## Required content types
- 15-second hooks
- 30-second scripts
- feature spotlights
- waitlist pushes
- rep pain-point angles
- Nic-Nac explainers
```

```md
# Email Newsletter Playbook

## Newsletter model

Sparkle Suite uses one newsletter brand serving:

- lead nurture
- rep education and updates

## Rules

- keep one brand voice
- segment value under the hood when needed
- stay helpful, not overly salesy
```

```md
# Email and SMS Playbook

## Use this for
- launch updates
- reminders
- follow-ups
- high-value messages

## Rules

- be useful
- be clear
- be respectful
- preserve compliance-sensitive language when required
```

```md
# Rep Acquisition Materials Playbook

## Use this for
- pitch copy
- one-pagers
- explainer materials
- signup framing

## Must emphasize
- rep advantage
- customer wow factor
- smoother live shows
- less patchwork
```

- [ ] **Step 4: Run the test to verify the checklist and playbooks pass**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: PASS for the new playbook and checklist assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/sparkle-suite-master-brand-system.test.ts docs/sparkle-suite/brand/04-brand-review-checklist.md docs/sparkle-suite/brand/playbooks/homepage-and-signup.md docs/sparkle-suite/brand/playbooks/short-form-video.md docs/sparkle-suite/brand/playbooks/email-newsletter.md docs/sparkle-suite/brand/playbooks/email-and-sms.md docs/sparkle-suite/brand/playbooks/rep-acquisition-materials.md
git commit -m "docs: add Sparkle Suite playbooks and review checklist"
```

### Task 3: Add the reusable templates library

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\short-form-video-hooks.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\short-form-video-scripts.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\captions-and-ctas.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\newsletter-issues.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\email-and-sms.md`
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\templates\landing-page-sections.md`
- Modify: `C:\Users\louis\neon-rabbit-core\tests\sparkle-suite-master-brand-system.test.ts`

- [ ] **Step 1: Extend the test to require the templates**

Add this block:

```ts
it("contains the reusable template library", () => {
  const files = [
    "docs/sparkle-suite/brand/templates/short-form-video-hooks.md",
    "docs/sparkle-suite/brand/templates/short-form-video-scripts.md",
    "docs/sparkle-suite/brand/templates/captions-and-ctas.md",
    "docs/sparkle-suite/brand/templates/newsletter-issues.md",
    "docs/sparkle-suite/brand/templates/email-and-sms.md",
    "docs/sparkle-suite/brand/templates/landing-page-sections.md",
  ];

  for (const file of files) {
    expect(fs.existsSync(path.join(repoRoot, file)), file).toBe(true);
  }

  const hooks = read("docs/sparkle-suite/brand/templates/short-form-video-hooks.md");
  expect(hooks).toContain("Hook 01");

  const newsletter = read("docs/sparkle-suite/brand/templates/newsletter-issues.md");
  expect(newsletter).toContain("Lead nurture");
  expect(newsletter).toContain("Rep education");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: FAIL because the templates are missing.

- [ ] **Step 3: Write the templates**

Create the templates with concrete, reusable starters. Include content like:

```md
# Short-Form Video Hooks

## Hook 01 — rep advantage

`If you want customers to feel like your live is a step above the usual, this is exactly what Sparkle Suite is being built for.`

## Hook 02 — customer wow factor

`The difference isn't just what you sell. It's how the whole experience feels to the customer.`
```

```md
# Short-Form Video Scripts

## 15-second script — trade board

- Hook
- What the pain is now
- How Sparkle Suite helps
- CTA

## 30-second script — smoother live shows

- Hook
- Real rep pain point
- Sparkle Suite angle
- CTA
```

```md
# Newsletter Issue Templates

## Lead nurture issue

- Intro
- What Sparkle Suite helps with
- One feature spotlight
- CTA

## Rep education issue

- Intro
- Product/process update
- Why it matters to reps
- CTA
```

- [ ] **Step 4: Run the test to verify the templates pass**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: PASS for the template assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/sparkle-suite-master-brand-system.test.ts docs/sparkle-suite/brand/templates/short-form-video-hooks.md docs/sparkle-suite/brand/templates/short-form-video-scripts.md docs/sparkle-suite/brand/templates/captions-and-ctas.md docs/sparkle-suite/brand/templates/newsletter-issues.md docs/sparkle-suite/brand/templates/email-and-sms.md docs/sparkle-suite/brand/templates/landing-page-sections.md
git commit -m "docs: add Sparkle Suite brand templates"
```

### Task 4: Create the repo-local skill and wire the index to daily usage

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\.agents\skills\sparkle-suite-master-brand\SKILL.md`
- Modify: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\brand\00-master-index.md`
- Modify: `C:\Users\louis\neon-rabbit-core\tests\sparkle-suite-master-brand-system.test.ts`

- [ ] **Step 1: Extend the test to require the skill and usage guidance**

Add this block:

```ts
it("contains a repo-local skill that points back to the brand system docs", () => {
  const skillPath = path.join(repoRoot, ".agents/skills/sparkle-suite-master-brand/SKILL.md");
  expect(fs.existsSync(skillPath)).toBe(true);

  const skill = fs.readFileSync(skillPath, "utf8");
  expect(skill).toContain("sparkle-suite-master-brand");
  expect(skill).toContain("create mode");
  expect(skill).toContain("review mode");
  expect(skill).toContain("docs/sparkle-suite/brand/01-master-brand-spec.md");
  expect(skill).toContain("docs/sparkle-suite/brand/playbooks/short-form-video.md");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: FAIL because the skill does not exist yet.

- [ ] **Step 3: Write the skill and update the index for daily use**

Create `.agents/skills/sparkle-suite-master-brand/SKILL.md` with:

```md
---
name: sparkle-suite-master-brand
description: "Use this skill whenever creating or reviewing Sparkle Suite rep-facing content, including homepage copy, waitlist and signup pages, TikTok, YouTube Shorts, newsletter issues, email, SMS, Nic-Nac positioning, and rep acquisition materials."
---

# Sparkle Suite Master Brand Skill

## Required sources

Read these before producing content:

- `docs/sparkle-suite/brand/01-master-brand-spec.md`
- `docs/sparkle-suite/brand/02-messaging-pillars.md`
- `docs/sparkle-suite/brand/03-nic-nac-positioning.md`
- the relevant file in `docs/sparkle-suite/brand/playbooks/`
- `docs/sparkle-suite/brand/04-brand-review-checklist.md` when reviewing

## Working modes

### create mode

Use the brand docs and the matching playbook/template to create content.

### review mode

Check existing content against the brand docs and explain drift or overclaiming.
```

Update `00-master-index.md` with example prompts:

```md
## Example prompts

- `Use the Sparkle Suite master brand system to write 3 TikTok hooks for the trade board.`
- `Draft a Sparkle Suite newsletter issue for leads and reps.`
- `Review this landing page section against the Sparkle Suite brand system.`
```

- [ ] **Step 4: Run the test to verify the skill passes**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: PASS for the skill assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/sparkle-suite-master-brand-system.test.ts docs/sparkle-suite/brand/00-master-index.md .agents/skills/sparkle-suite-master-brand/SKILL.md
git commit -m "feat: add Sparkle Suite master brand skill"
```

### Task 5: Final polish and full verification

**Files:**
- Review/Modify as needed: all files created in Tasks 1-4
- Test: `C:\Users\louis\neon-rabbit-core\tests\sparkle-suite-master-brand-system.test.ts`

- [ ] **Step 1: Run the full focused verification suite**

Run: `npm exec vitest run tests/sparkle-suite-master-brand-system.test.ts`
Expected: PASS with all brand docs, playbooks, templates, and skill checks green.

- [ ] **Step 2: Manually review the index and skill for usability**

Confirm:

- a new chat could start from `00-master-index.md`
- the skill clearly tells an agent what to read first
- the short-form video and newsletter channels are treated as primary brand surfaces
- Nic-Nac positioning is consistent across docs

- [ ] **Step 3: Commit**

```bash
git add docs/sparkle-suite/brand .agents/skills/sparkle-suite-master-brand/SKILL.md tests/sparkle-suite-master-brand-system.test.ts
git commit -m "docs: complete Sparkle Suite master brand toolchain"
```

## Self-Review

- Spec coverage: this plan covers the durable docs, the repo-local skill, the playbooks, the template library, and the review checklist. HQ surfacing is intentionally excluded from the first implementation because the approved design keeps HQ as a later front door rather than a day-one dependency.
- Placeholder scan: there are no `TBD`, `TODO`, or “fill in later” steps. Every task names exact files, commands, and required content.
- Type consistency: the plan keeps the same canonical names throughout: `sparkle-suite-master-brand`, `00-master-index.md`, `01-master-brand-spec.md`, `03-nic-nac-positioning.md`, and `04-brand-review-checklist.md`.
