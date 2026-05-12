# DO NOT USE

This file is retired for current Sparkle Suite brand/design work.

Reason: it is not based on the current production site at https://www.yoursparklesuite.com/prelaunch.

Use the official production-based design kit in docs/sparkle-suite/brand instead.

---
# Sparkle Suite — Component Library (Design Kit Candidates)

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Drive connector (on demand)
📁 UPLOAD TO PROJECT: No — reference file, pulled when needed
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (shopping reference), Claude (PRD source), Codex (build reference)
🔄 UPDATE TRIGGER: Louis finds a new component on Uiverse or other sources

**Version:** 1.5 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

---

## Purpose

This file captures the exact source code for every UI component Louis selects during the Task 2.1 design system shopping process. Each entry preserves the original React/CSS code as-is from the source. No interpretation, no translation — the raw code is the spec.

When it's time to build, Codex references these entries directly. Colors, fonts, and border-radius values get swapped to match design kit variables, but the animation logic, hover behavior, and structural CSS stay faithful to the original.

---

## How to Use This File

- **Louis:** Paste code into chat. Claude adds it here with a number and quick description.
- **Claude:** Catalogs each find with metadata (source, type, key features, kit recommendation). Does NOT modify the code.
- **Codex:** Uses these entries as reference implementations when building the template system. Adapts colors/fonts to kit variables; preserves interaction patterns exactly.

---

## Kit Pairing Tracker

Updated as components are collected. Recommendations are Claude's initial read — Louis has final say.

| Kit | Card Style | Button Style | Hover Effect | Notes |
|-----|-----------|-------------|-------------|-------|
| Amethyst | #5 (rec) | TBD | TBD | Sleek, geometric |
| Garnet | #2 (rec) | TBD | TBD | Bold, editorial |
| Velvet | #3 (rec) | TBD | TBD | Premium, soft |
| Rose Quartz | #1 (rec) | TBD | TBD | Playful, bubbly |
| Amber | #4 (rec) | TBD | TBD | Energetic, confident |
| General/NR | #6 | — | — | Brand-level, not per-rep kit |

---

## Component #1 — Glass Panel Reveal Card

**Source:** Uiverse.io | **Type:** Card
**Key Features:** Glass-morphic layered panels fan out from bottom-left on hover with staggered delays. Scale 1.1x. 30px radius. Gradient bg. Frosted glass overlay. Organic panel border-radius.
**Vibe:** Premium, playful, high-interaction.
**Kit Recommendation:** Rose Quartz

*(Full code preserved in v1.4 of this doc and in session chat)*

---

## Component #2 — 3D Tilt Card

**Source:** Uiverse.io | **Type:** Card
**Key Features:** 3D perspective tilt on hover (`rotateY(10deg) rotateX(10deg) scale(1.05)`). Sliding overlay sweep. 8px radius. cubic-bezier easing.
**Vibe:** Bold, confident, editorial.
**Kit Recommendation:** Garnet

*(Full code preserved in v1.4 of this doc and in session chat)*

---

## Component #3 — Premium Shine Product Card

**Source:** Uiverse.io | **Type:** Card (product/listing)
**Use Case:** Trade board card (Phase 3).
**Key Features:** Product layout (image, title, price, action button, badge). Shine sweep, glow, lift, badge scale-in, accent color shift. CSS custom properties. 20px radius.
**Vibe:** Refined, premium, commercial.
**Kit Recommendation:** Velvet

*(Full code preserved in v1.4 of this doc and in session chat)*

---

## Component #4 — Flip Card

**Source:** Uiverse.io | **Type:** Card (flip interaction)
**Use Case:** Rep site blocks — about me, book a party, collection highlights.
**Key Features:** Full Y-axis flip (`rotateY(180deg)`). 0.8s transition. perspective + preserve-3d + backface-visibility. Warm gradient front/back. 1rem radius.
**Vibe:** Warm, energetic, interactive.
**Kit Recommendation:** Amber

*(Full code preserved in v1.4 of this doc and in session chat)*

---

## Component #5 — Expandable Stack Card (Compact → Detail Reveal)

**Source:** Uiverse.io | **Type:** Card (expand/collapse interaction pattern)
**Use Case:** Mobile live queue + trade board interaction.
**Key Features:** Two-card stack — primary on top, secondary expands on hover (130px → 300px). Sibling selector drives expand. 0.4s ease-in-out. Status bar at bottom.
**Vibe:** Functional, data-driven, utilitarian.
**Kit Recommendation:** Amethyst

*(Full code preserved in v1.4 of this doc and in session chat. NOTE: base64 images in original JSX — refer to May 2, 2026 session for complete source.)*

---

## Component #6 — Neon Glow Border Card

**Source:** Uiverse.io
**Type:** Card (marketing/hero/accent)
**Use Case Note:** NOT a rep site template card. Louis sees this for: SS public-facing site, login page, Neon Rabbit marketing, or general brand-level use. Dark bg + neon glow = premium SaaS energy. Could potentially work with different colors on a rep site, but primary use is brand-level.
**Key Features:** Black card (`#000`) with neon gradient glow border via `::before` pseudo-element (slightly larger than card, sits behind it — `linear-gradient(-45deg, #e81cff, #40c9ff)`). Blurred glow layer via `::after` (`filter: blur(20px)`, scales to 0.95). On hover: blur intensifies (20px → 30px) and `::before` rotates dramatically (`rotate(-90deg) scaleX(1.34) scaleY(0.77)`) — glow animates around the card. `cubic-bezier(0.175, 0.885, 0.32, 1.275)` easing. 8px card radius. Content bottom-aligned. White text on black with accent-colored highlight text (`#e81cff`).
**Vibe:** Dark, premium, neon SaaS. Marketing hero energy.
**Kit Recommendation:** General/NR — this is a brand-level component, not a per-rep kit piece. Keeps its own dark + neon color scheme regardless of which kit context it appears in.

```jsx
import React from 'react';
import styled from 'styled-components';
const Card = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <p className="heading">
          Popular this month
        </p>
        <p>
          Powered By
        </p>
        <p>Uiverse
        </p></div>
    </StyledWrapper>
  );
}
const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 190px;
    height: 254px;
    background-color: #000;
    display: flex;
    flex-direction: column;
    justify-content: end;
    padding: 12px;
    gap: 12px;
    border-radius: 8px;
    cursor: pointer;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    left: -5px;
    margin: auto;
    width: 200px;
    height: 264px;
    border-radius: 10px;
    background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100% );
    z-index: -10;
    pointer-events: none;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .card::after {
    content: "";
    z-index: -1;
    position: absolute;
    inset: 0;
    background: linear-gradient(-45deg, #fc00ff 0%, #00dbde 100% );
    transform: translate3d(0, 0, 0) scale(0.95);
    filter: blur(20px);
  }
  .heading {
    font-size: 20px;
    text-transform: capitalize;
    font-weight: 700;
  }
  .card p:not(.heading) {
    font-size: 14px;
  }
  .card p:last-child {
    color: #e81cff;
    font-weight: 600;
  }
  .card:hover::after {
    filter: blur(30px);
  }
  .card:hover::before {
    transform: rotate(-90deg) scaleX(1.34) scaleY(0.77);
  }`;
export default Card;
```

---

## Components #7+ — (Awaiting Louis's next finds)

<!-- Louis: keep pasting code into chat. Claude will add entries here. -->
