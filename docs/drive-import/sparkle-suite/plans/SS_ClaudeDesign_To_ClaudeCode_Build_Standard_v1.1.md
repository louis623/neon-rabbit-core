# NR — Claude Design to Claude Code Build Standard

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to session when writing a Claude Design → Claude Code build prompt
📁 UPLOAD TO PROJECT: No — upload on demand when working on Claude Design pipeline tasks
🏷 PROJECT: Neon Rabbit (all projects)
👤 WHO USES IT: Louis (reference), Claude (prompt authoring), Claude Code (future skill)
🔄 UPDATE TRIGGER: Any new Claude Design → Claude Code build session that produces new lessons

**Version:** 1.1 | **Created:** April 18, 2026 | **Last Updated:** April 18, 2026 | **Status:** ACTIVE
**Origin:** Lessons learned from Priscilla Roberts quilting portfolio site — first Claude Design pilot
**v1.1 additions:** Opacity readability rule, minimum font weight standard, HERO_FILES inference failure, audit-first protocol, background color token discipline

---

## What This File Is

This is the standard for writing Claude Code build prompts that implement a Claude Design handoff. It exists because the first pilot (Priscilla's quilting site, April 18, 2026) produced multiple silent failures — all traceable to a prompt written at the level of intent rather than instruction, and caught only through post-build visual review.

Upload this file to any session where you are writing a Claude Design → Claude Code build prompt. It becomes the basis for a Claude Code skill when the pipeline matures.

---

## The Failure That Created This File

**Original prompt (Priscilla's site):**

> Fetch this design file, read its readme, and implement the relevant aspects of the design. [URL]
> Implement: Build as a Next.js + TypeScript + Tailwind project. Create a new repo at C:\Users\louis\priscilla-roberts-quilts. Quilt images are located at C:\Users\louis\Downloads\Quilts - Organized\ — copy all Hero shot files into the project's public/images/ folder. Each image placeholder in the design references a Q-number filename — match them exactly. Deploy to Vercel when build is complete. Regenerate CODEBASE_SNAPSHOT.md, commit, push to a new GitHub repo louis623/priscilla-roberts-quilts on main branch. Type close session when done.

**What went wrong and why:**

| Failure | Prompt language that caused it | What Code did |
|---|---|---|
| Image/quilt mismatch | "match them exactly" | Filled cards by inferring content matches from descriptive filenames — failed on ambiguous cases |
| Font appears wrong | "implement the relevant aspects of the design" | Font was actually correct; appeared different due to zoom level in design tool vs browser |
| Transparent sticky header | Not mentioned | Defaulted to scroll-based transparency — a common training-data pattern |
| Text hard to read | Not mentioned | Applied weight 300 + opacity < 1.0 on most text elements — legible on calibrated monitors, not for general audiences |

**Root cause in all cases:** Prompt stated goals, not mechanisms. Code filled every ambiguous gap with its own judgment and produced silent failures — the site built and deployed without errors, so nothing flagged until visual review.

---

## Standard Rules

### Rule 1 — Audit First, Fix Second

Never write a fix prompt without first running a read-only audit. This catches silent failures before you spend a prompt session making things worse.

**Mandatory audit items:**
- What fonts are actually loaded and where are they applied?
- For every asset-to-data mapping: what is assigned to what, and does the assignment make sense?
- What are the exact font sizes, weights, and opacity values on every visible text element?
- What is the exact background color/style on the sticky header? Is there any scroll-based behavior?

**Audit prompt template — append to any audit session:**
```
Do not make any changes to any files. This is a read-only audit. Report only.

Output a structured report to terminal covering:
1. FONTS — what is imported, what CSS variables are assigned, what is applied to each element
2. ASSET MAPPING — for every [data entry]: identifier | name | assigned file | does the file description match the name? (yes/no/uncertain)
3. TYPOGRAPHY — exact font size, weight, color, and opacity on every visible text element
4. HEADER — exact background style; any scroll-based class toggle or opacity change

Do not fix anything. Do not suggest fixes. Output the report, then type: close session
```

---

### Rule 2 — Name Every Font Explicitly

Never delegate typography to "implement the design spec." Name fonts as hard constraints.

```
FONTS (mandatory — no substitutions):
- Headings (h1, h2, h3, hero title, section headers): [Font Name] via next/font/google
- Body / UI / captions / nav / footer: [Font Name] via next/font/google
- If next/font/google cannot resolve either font, STOP and report — do not substitute
```

**Note on zoom artifacts:** Font rendering in a design tool at non-100% zoom can look like a completely different typeface due to pixel subsampling. Always verify at 100% zoom in the browser before concluding there is a font problem.

---

### Rule 3 — Minimum Weight and Full Opacity on Readable Text

Weight 300 and sub-1.0 opacity look elegant in design tools on calibrated monitors. For general audiences — especially seniors — they are genuinely hard to read.

**Mandatory constraints in every build prompt:**
```
TYPOGRAPHY READABILITY (non-negotiable):
- All body text, captions, nav links, and card titles: opacity 1.0 — no opacity reduction on readable content
- Decorative/background elements (large watermark numbers, overlay labels): opacity at designer's discretion
- Manrope body copy and captions: minimum weight 400 — do not use weight 200 or 300 for readable text
- Bodoni Moda display headings: weight 300 is acceptable for large hero text only
- Do not use --cream-muted or --cream-dim for any primary readable text — reserve for metadata and labels only
```

---

### Rule 4 — Supply a Hardcoded Asset Lookup Table for Any Descriptive Filename Convention

When image filenames contain descriptive content (colors, patterns, border styles, recipient names) rather than clean sequential IDs, Code cannot reliably infer which image belongs to which data entry. It will guess, and it will get ambiguous cases wrong.

**The failure pattern (confirmed on Priscilla's site):**
Code built a `HERO_FILES` map by matching quilt pattern names to image descriptive names. "Patriots" got assigned `Checkerboard-Black-Border` because nothing more specific existed. "Bear Paw" got `Scrappy-Irish-Chain`. Eight of 25 entries were wrong.

**The rule:** When filenames are descriptive rather than clean IDs, you supply the lookup table. Code applies it. Code does not infer.

```
ASSET LOOKUP TABLE (hardcoded — do not infer or match by filename content):
Use exactly this mapping. Do not substitute, reorder, or match by pattern name:

[identifier] → [exact filename]
[identifier] → [exact filename]
...

If a filename in this table does not exist in the asset folder, output a warning to terminal and leave that entry's image null rather than substituting another file.
```

**How to build the lookup table:** Open the asset folder. For each data entry, look at the actual image file and confirm it is the correct content. Write the mapping yourself. This takes 10 minutes and eliminates all inference failures.

---

### Rule 5 — Name Every UI Behavior That Has a Common Default

Any element with a "standard" behavior in modern web development must be explicitly overridden if you want something different.

| Element | Common Code default | Override if you want... |
|---|---|---|
| Sticky header | Scroll-based transparency | Permanent solid background |
| Hero section | Full-screen with parallax | Fixed height, no parallax |
| Image cards | Hover zoom/scale | No transform on hover |
| Page transitions | None | Fade in on load |
| Mobile nav | Hamburger menu | Visible nav links |

```
UI BEHAVIORS (explicit overrides):
- Sticky header: permanent solid [exact hex] background at all scroll positions — no transparency, no scroll-based opacity or class toggle
- [Any other element with a default you want to override]: [exact spec]
```

---

### Rule 6 — Use Design Tokens, Not Hardcoded Hex

When Code writes CSS values as hardcoded hex rather than design tokens, values drift from each other silently. The audit on Priscilla's site found the header background (`#0f0a1a`) didn't match the body background (`--bg-warm` = `#15100f`) — a visible seam on dark backgrounds.

```
CSS VALUES:
- All color values must reference design tokens (CSS custom properties) — not hardcoded hex
- Exception: design tokens themselves may be defined as hex in :root
- After build, verify: header background token matches body background token or is intentionally different by design spec
```

---

### Rule 7 — Require a Self-Audit Report Before Session Close

Code prints a summary of what it actually built. Silent failures surface before visual review.

**Always include at the end of any build prompt:**
```
BEFORE CLOSING — print a self-audit report to terminal:
1. List every [asset identifier], the filename assigned to it, and the [data field name]
2. Flag any entry where the asset filename description does not match the data entry name
3. List any data entries with no assigned asset
4. List any assets not referenced by any data entry
5. Confirm which fonts are loaded and where they are applied
6. Confirm opacity values on: body text, captions, nav links
7. Confirm minimum font weight on body copy
8. Confirm sticky header background value and whether any scroll handler touches the header
```

---

### Rule 8 — The Design Spec Is the Authority, Not Code's Judgment

```
The Claude Design handoff spec is the sole design authority for this build.
Do not make aesthetic decisions not covered by the spec.
If the spec is ambiguous or silent on a detail, use the most minimal/neutral implementation
and flag it in terminal output — do not make a design call.
```

---

## Complete Prompt Template

Skeleton for any Claude Design → Claude Code build prompt. Fill in the bracketed sections.

```
Work on main branch only at C:\Users\louis\[repo-name] — do not create worktrees,
new branches, or temporary directories unless Louis explicitly requests one.

Build with the bare minimum code that makes it work. Use useState over URL routing.
Use plain CSS over animation libraries. Use simple functions over complex patterns.
No framework features "just in case." Functionality > fanciness.

The Claude Design handoff spec is the sole design authority for this build.
Do not make aesthetic decisions not covered by the spec.
If the spec is ambiguous or silent on a detail, use the most minimal/neutral
implementation and flag it in terminal output — do not make a design call.

---

DESIGN SPEC:
Fetch and read the Claude Design handoff at: [URL]

---

PROJECT SETUP:
- Framework: Next.js + TypeScript + Tailwind
- Repo location: C:\Users\louis\[repo-name]
- GitHub repo: louis623/[repo-name] on main branch

---

ASSETS:
- Source location: [path to asset folder]
- Copy [Hero / all] files to public/images/

ASSET LOOKUP TABLE (hardcoded — do not infer or match by filename content):
Use exactly this mapping. Do not substitute, reorder, or match by pattern name:

[identifier] → [exact filename]
[identifier] → [exact filename]
[... complete list ...]

If a filename in this table does not exist in the asset folder, output a warning
to terminal and leave that entry's image null rather than substituting another file.

---

FONTS (mandatory — no substitutions):
- Headings: [Font Name] via next/font/google
- Body/UI: [Font Name] via next/font/google
- If either font cannot be resolved, STOP and report — do not substitute

TYPOGRAPHY READABILITY (non-negotiable):
- All body text, captions, nav links, and card titles: opacity 1.0
- Manrope body copy and captions: minimum weight 400
- Bodoni Moda display headings: weight 300 acceptable for large hero text only
- Do not use muted or dim color tokens for any primary readable text

---

UI BEHAVIORS (explicit overrides):
- Sticky header: permanent solid [exact token or hex] background at all scroll positions —
  no transparency, no scroll-based opacity or class toggle
- Header background must match body background token or be intentionally different per spec
- All color values must reference design tokens — not hardcoded hex
- [Any other element with a default you want to override]

---

BEFORE CLOSING — print a self-audit report to terminal:
1. List every [asset identifier], the filename assigned to it, and the [data field]
2. Flag any entry where the asset filename description does not match the data entry name
3. List any data entries with no assigned asset
4. List any assets not referenced by any data entry
5. Confirm which fonts are loaded and where they are applied
6. Confirm opacity values on: body text, captions, nav links
7. Confirm minimum font weight on body copy
8. Confirm sticky header background value and whether any scroll handler touches the header

---

EXECUTION:
1. npm run build — confirm clean pass
2. Deploy to Vercel
3. Regenerate CODEBASE_SNAPSHOT.md
4. Commit all changes: "build: [project name] from Claude Design handoff"
5. Push to origin
6. Output the Vercel deploy URL to terminal
7. Type: close session
```

---

## Lessons Log

| Date | Project | Lesson |
|---|---|---|
| April 18, 2026 | Priscilla Roberts quilting portfolio | Sequential/inferred image fill caused multi-quilt mismatch. Fix: supply hardcoded lookup table — no inference. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | Font appeared wrong due to design tool zoom artifact. Always verify at 100% zoom in browser before diagnosing a font problem. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | Sticky header defaulted to scroll-based transparency. Fix: name header behavior explicitly with exact token/color. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | "Implement relevant aspects of design" delegates too much to Code. Fix: "sole design authority" framing + flag ambiguous/silent spec details. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | Weight 300 + sub-1.0 opacity on most text elements — looks elegant in design tool, genuinely hard to read for general/senior audiences. Fix: minimum weight 400 on body copy, opacity 1.0 on all readable text. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | HERO_FILES map built by Code via content inference failed on 8 of 25 entries. Descriptive filenames are not reliable matching keys. Fix: hardcoded lookup table supplied in prompt. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | No audit before fix prompt — silent failures only discovered on visual review after deploy. Fix: run read-only audit prompt first, fix second, always. |
| April 18, 2026 | Priscilla Roberts quilting portfolio | Header background hardcoded as hex (#0f0a1a) drifted from body background token (--bg-warm = #15100f) — visible seam on dark background. Fix: use design tokens, verify token consistency post-build. |

---

*Update this file after every Claude Design → Claude Code build session that produces new lessons. Bump minor version on update.*
