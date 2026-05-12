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

**Version:** 1.7 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

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
**Use Case Note:** NOT a rep site template card. Louis sees this for: SS public-facing site, login page, Neon Rabbit marketing, or as premium accent element. Brand-level, not per-rep kit.
**Key Features:** Animated gradient border (`@keyframes spin` rotating `conic-gradient`). Pseudo-element overlay with blur. Dark background with glowing edge. 8px radius. 1px border gap creates neon outline effect.
**Vibe:** Tech-forward, brand statement, premium dark-mode.
**Kit Recommendation:** General/NR (brand-level use, not a rep kit assignment)

*(Full code preserved in v1.5 of this doc and in session chat)*

---

## Component #7 — Layered Color Swatch Stack

**Source:** Uiverse.io | **Type:** Interactive Element / Picker
**Key Features:** Overlapping rounded color swatches in a horizontal row. Hover scales target to 1.5x with neighboring items scaling to 1.3x and 1.15x via `+` sibling and `:has()` selectors — creates a smooth ripple/fan effect. Tooltip shows hex value on hover. `cubic-bezier(0.175, 0.885, 0.32, 1.1)` easing for bouncy feel. 6px radius per swatch. CSS custom property `--color` drives each swatch.
**Vibe:** Kinetic, tactile, playful-but-functional.
**Kit Recommendation:** None — general utility component. Potential use in Thumper color picker or site customization UI.
**Trade Board Idea (Phase 3 parking lot):** Louis noted the horizontal peek-and-browse interaction pattern could inspire a trade board UX — cards layered and fanning on hover/swipe instead of a standard grid. Worth exploring when trade board UI is designed. Captured to Open Brain as idea.

```jsx
import React from 'react';
import styled from 'styled-components';
const Card = () => {
  return (
    <StyledWrapper>
      <div className="container-items">
        <button className="item-color" style={{--color: '#e11d48'}} aria-color="#e11d48" />
        <button className="item-color" style={{--color: '#f472b6'}} aria-color="#f472b6" />
        <button className="item-color" style={{--color: '#fb923c'}} aria-color="#fb923c" />
        <button className="item-color" style={{--color: '#facc15'}} aria-color="#facc15" />
        <button className="item-color" style={{--color: '#84cc16'}} aria-color="#84cc16" />
        <button className="item-color" style={{--color: '#10b981'}} aria-color="#10b981" />
        <button className="item-color" style={{--color: '#0ea5e9'}} aria-color="#0ea5e9" />
        <button className="item-color" style={{--color: '#3b82f6'}} aria-color="#3b82f6" />
        <button className="item-color" style={{--color: '#8b5cf6'}} aria-color="#8b5cf6" />
        <button className="item-color" style={{--color: '#a78bfa'}} aria-color="#a78bfa" />
      </div>
    </StyledWrapper>
  );
}
const StyledWrapper = styled.div`
  .container-items {
    display: flex;
    transform-style: preserve-3d;
    transform: perspective(1000px);
  }
  .item-color {
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 40px;
    border: none;
    outline: none;
    transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
    cursor: pointer;
    &::after {
      position: absolute;
      content: "";
      inset: 0;
      width: 40px;
      height: 40px;
      background-color: var(--color);
      border-radius: 6px;
      transform: scale(1.2);
      pointer-events: none;
      transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
    }
    &::before {
      position: absolute;
      content: attr(aria-color);
      left: 65%;
      bottom: 52px;
      font-size: 8px;
      line-height: 12px;
      transform: translateX(-50%);
      padding: 2px 0.25rem;
      background-color: #ffffff;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
    }
    &:hover {
      transform: scale(1.5);
      z-index: 99999;
      &::before {
        opacity: 1;
        visibility: visible;
      }
    }
    &:active::after {
      transform: scale(1.1);
    }
    &:focus::before {
      content: "✅Copy";
    }
  }
  .item-color:hover + * {
    transform: scale(1.3);
    z-index: 9999;
  }
  .item-color:hover + * + * {
    transform: scale(1.15);
    z-index: 999;
  }
  .item-color:has(+ *:hover) {
    transform: scale(1.3);
    z-index: 9999;
  }
  .item-color:has(+ * + *:hover) {
    transform: scale(1.15);
    z-index: 999;
  }`;
export default Card;
```

---

## Component #8 — Phone Frame Wrapper

**Source:** Uiverse.io | **Type:** Layout Wrapper
**Use Case:** Wrap TikTok video embeds on rep sites to give them a native phone-screen feel. Could be used across all kits or select kits where the aesthetic fits.
**Key Features:** Phone silhouette with notch (top center), side buttons (right edge — power + volume). 300x160px. Rounded corners (`rounded-2xl`). Gray background. Box shadow for depth. Pure CSS/Tailwind — no JS interaction.
**Vibe:** Familiar, native, skeuomorphic touch.
**Kit Recommendation:** None — universal layout wrapper, not kit-specific. Apply across all kits where TikTok embeds appear.

```jsx
import React from 'react';
const Card = () => {
  return (
    <div className="relative flex justify-center h-[300px] w-[160px] border border-4 border-black rounded-2xl bg-gray-50" style={{boxShadow: '5px 5px 2.5px 6px rgb(209, 218, 218)'}}>
      <span className="border border-black bg-black w-20 h-2 rounded-br-xl rounded-bl-xl" />
      <span className="absolute -right-2 top-14 border border-4 border-black h-7 rounded-md" />
      <span className="absolute -right-2 bottom-36 border border-4 border-black h-10 rounded-md" />
    </div>
  );
}
export default Card;
```

---

## Notes

- Full source code for Components #1–#5 preserved in v1.4 of this document. Components #6+ have code inline above.
- Kit pairing tracker updated as components are added. Button and Hover Effect columns still TBD.
- Old versions (v1.0–v1.6) accumulate in Drive — low priority cleanup.
