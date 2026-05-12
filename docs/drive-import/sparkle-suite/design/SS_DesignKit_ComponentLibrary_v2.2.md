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

**Version:** 2.2 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

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
| Thumper | — | #13 | — | Chat launcher button |

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

*(Full code preserved in v2.1 of this doc and in session chat)*

---

## Component #13 — AI Chat Launcher Button (Thumper)

**Source:** Uiverse.io | **Type:** Button (Chat Widget Launcher)
**Use Case:** Thumper chat launcher — floating button at bottom of rep site pages. Click to open Thumper chat window. NOT a per-kit design component — this is Thumper's button across all rep sites.
**Key Features:** Sparkle/star SVG icon + text label. Rainbow gradient background (`linear-gradient(90deg, #5bfcc4, #f593e4, #71a4f0)`). Dark glass effect via heavy inset box shadow (`inset 0px 35px 30px #000` darkens from top, gradient glows through). `conic-gradient` on `::before` pseudo-element creates ethereal halo glow on hover (`filter: blur(15px)`). Press-down on active (margin-top shift + shadow collapse). Text shadow for depth. 12px radius. White text.
**Vibe:** Magical, AI-native, inviting. "Talk to something smart" energy.
**Kit Recommendation:** Thumper-specific. Swap label to "Chat with Thumper." Keep sparkle SVG or swap to bunny icon. Gradient could adapt to NR brand colors or rep's kit colors. Placement: fixed bottom-right corner of rep site pages.

```jsx
import React from 'react';
import styled from 'styled-components';
const Button = () => {
  return (
    <StyledWrapper>
      <div className="outer-cont flex">
        <svg viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
          <g fill="none">
            <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" />
            <path d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM11 6.094l-.806 2.36a6 6 0 0 1-3.49 3.649l-.25.091l-2.36.806l2.36.806a6 6 0 0 1 3.649 3.49l.091.25l.806 2.36l.806-2.36a6 6 0 0 1 3.49-3.649l.25-.09l2.36-.807l-2.36-.806a6 6 0 0 1-3.649-3.49l-.09-.25zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026-.35l.35-1.027A1 1 0 0 1 19 2" fill="currentColor" />
          </g>
        </svg>
        Ask Spacious AI
      </div>
    </StyledWrapper>
  );
}
const StyledWrapper = styled.div`
  .flex {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .outer-cont {
    padding: 12px 20px;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    position: relative;
    background: linear-gradient(90deg, #5bfcc4, #f593e4, #71a4f0);
    border-radius: 12px;
    color: #fff;
    transition: all 0.3s ease;
    box-shadow:
      inset 0px 0px 5px #ffffffa9,
      inset 0px 35px 30px #000,
      0px 5px 10px #000000cc;
    text-shadow: 1px 1px 1px #000;
  }
  .outer-cont::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    border-radius: 12px;
    filter: blur(0);
    z-index: -1;
    box-shadow: none;
    background: conic-gradient(
      #00000000 80deg,
      #40baf7,
      #f34ad7,
      #5bfcc4,
      #00000000 280deg
    );
    transition: all 0.3s ease;
  }
  .outer-cont:hover::before {
    filter: blur(15px);
  }
  .outer-cont:active::before {
    filter: blur(5px);
    transform: translateY(1px);
  }
  .outer-cont:active {
    box-shadow:
      inset 0px 0px 5px #ffffffa9,
      inset 0px 35px 30px #000;
    margin-top: 3px;
  }`;
export default Button;
```

---

## Notes

- Full source code for Components #1–#5 preserved in v1.4 of this document. Components #6+ have code inline above.
- Kit pairing tracker updated as components are added. Added Thumper row.
- Old versions (v1.0–v2.1) accumulate in Drive — low priority cleanup.
