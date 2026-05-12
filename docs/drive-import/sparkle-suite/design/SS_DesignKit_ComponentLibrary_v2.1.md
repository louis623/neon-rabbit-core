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

**Version:** 2.1 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

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
| Garnet | #2 (rec) | #10 (rec) | TBD | Bold, editorial |
| Velvet | #3 (rec) | #12 (rec) | TBD | Premium, soft |
| Rose Quartz | #1 (rec) | #11 (rec) | TBD | Playful, bubbly |
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

*(Full code preserved in v1.7 of this doc and in session chat)*

---

## Component #8 — Phone Frame Wrapper

**Source:** Uiverse.io | **Type:** Layout Wrapper
**Use Case:** Wrap TikTok video embeds on rep sites to give them a native phone-screen feel. Could be used across all kits or select kits where the aesthetic fits.
**Key Features:** Phone silhouette with notch (top center), side buttons (right edge — power + volume). 300x160px. Rounded corners (`rounded-2xl`). Gray background. Box shadow for depth. Pure CSS/Tailwind — no JS interaction.
**Vibe:** Familiar, native, skeuomorphic touch.
**Kit Recommendation:** None — universal layout wrapper, not kit-specific. Apply across all kits where TikTok embeds appear.

*(Full code preserved in v1.7 of this doc and in session chat)*

---

## Component #9 — Gradient Glow CTA Button

**Source:** Uiverse.io | **Type:** Button (CTA)
**Key Features:** Gradient sweep on hover (`background-size: 280% auto`, `background-position` shift). Multi-layered box shadow: outer glow + drop shadow + inner highlight + inner depth. CSS custom properties for colors (`--btn-bg-1`, `--btn-bg-2`, `--btn-bg-color`). Accessible focus ring (double-ring outline). `prefers-reduced-motion` respected. 0.5em radius. Min 120x44px touch target.
**Vibe:** Dimensional, gem-like, polished. Swapping gradient colors to any kit palette would carry well.
**Kit Recommendation:** None yet — Louis wants to place it on SS somewhere with kit-specific color swaps. Universal CTA candidate.

*(Full code preserved in v1.8 of this doc and in session chat)*

---

## Component #10 — Skewed Curtain-Close Button

**Source:** Uiverse.io | **Type:** Button (CTA)
**Key Features:** Two `::before` and `::after` pseudo-elements slide in from opposite sides on hover with `skew(15deg)` transform, meeting in the middle like closing curtains. Width transitions from 0 to 58% per side. Text color shifts on hover. 10px border-radius. 0.5s transition. Dark-to-purple gradient reveal (`#240046` left, `#5a189a` right). 150x50px.
**Vibe:** Theatrical, bold, dramatic. Stage-curtain reveal energy.
**Kit Recommendation:** Garnet — editorial/bold personality matches the dramatic bilateral close. Swap purples to Garnet's deep reds (#B91C1C / #920000), text shift to warm accent.

*(Full code preserved in v1.9 of this doc and in session chat)*

---

## Component #11 — Aurora Glow Pill Button

**Source:** Uiverse.io | **Type:** Button (CTA)
**Key Features:** Blurred gradient orb (`filter: blur(20px)`) rotating behind text via `@keyframes` animation (infinite 3s linear rotate). Orb shrinks on hover (10rem → 8rem) for subtle pull-in. Pill shape (`border-radius: 10rem`). Press-in on active (`scale(0.97)`). Gradient: pink → purple → cyan (`rgba(222,0,75)` → `rgba(191,70,255)` → `rgba(0,212,255)`). 0.5 opacity on orb. Light box shadow. 0.4s transition on hover.
**Vibe:** Soft, ambient, warm, inviting. Aurora/dreamy glow behind text.
**Kit Recommendation:** Rose Quartz — soft dreamy glow matches playful/bubbly personality. Swap gradient to Rose Quartz pinks for a pink aurora effect. Natural pairing with Component #1 (Glass Panel Reveal card).

*(Full code preserved in v2.0 of this doc and in session chat)*

---

## Component #12 — Raised Cart Button (3D Press)

**Source:** Uiverse.io | **Type:** Button (Commerce/Secondary CTA)
**Use Case:** Product cards, listing pages, trade board action buttons — "Shop now," "Add to cart," "View collection."
**Key Features:** Candy-purple gradient (`rgb(214,202,254)` → `rgb(158,129,254)`). Pill shape (`border-radius: 50px`). Bottom box shadow for raised 3D effect (`1px 3px 0px rgb(139,113,255)`). Active press-down: `translate(2px, 0px)` + shadow collapse to `0px 1px`. Inline SVG cart icon (Font Awesome path). Flex layout with gap. White text + icon. 180x40px. 0.3s transition.
**Vibe:** Tactile, playful-commercial, satisfying click. Raised candy button.
**Kit Recommendation:** Velvet — purple gradient already in Velvet's color neighborhood, premium tactile quality from 3D shadow + press-down. Natural pairing with Component #3 (Premium Shine Product Card).

```jsx
import React from 'react';
import styled from 'styled-components';
const Button = () => {
  return (
    <StyledWrapper>
      <button className="button">
        Shop now
        <svg className="cartIcon" viewBox="0 0 576 512"><path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" /></svg>
      </button>
    </StyledWrapper>
  );
}
const StyledWrapper = styled.div`
  .button {
    width: 180px;
    height: 40px;
    background-image: linear-gradient(rgb(214, 202, 254), rgb(158, 129, 254));
    border: none;
    border-radius: 50px;
    color: rgb(255, 255, 255);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    box-shadow: 1px 3px 0px rgb(139, 113, 255);
    transition-duration: .3s;
  }
  .cartIcon {
    width: 14px;
    height: fit-content;
  }
  .cartIcon path {
    fill: white;
  }
  .button:active {
    transform: translate(2px ,0px);
    box-shadow: 0px 1px 0px rgb(139, 113, 255);
    padding-bottom: 1px;
  }`;
export default Button;
```

---

## Notes

- Full source code for Components #1–#5 preserved in v1.4 of this document. Components #6+ have code inline above.
- Kit pairing tracker updated as components are added.
- Old versions (v1.0–v2.0) accumulate in Drive — low priority cleanup.
