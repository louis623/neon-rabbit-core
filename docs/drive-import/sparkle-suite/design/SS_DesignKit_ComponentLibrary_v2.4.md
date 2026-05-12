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

**Version:** 2.4 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

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
| Amethyst | #5 (rec) | TBD | TBD | Sleek, geometric — needs button still |
| Garnet | #2 (rec) | #10 (rec) | TBD | Bold, editorial |
| Velvet | #3 (rec) | #12 (rec) | TBD | Premium, soft |
| Rose Quartz | #1 (rec) | #11 (rec) | TBD | Playful, bubbly |
| Amber | #4 (rec) | #15 (rec) | TBD | Energetic, confident |
| General/NR | #6 | #9 (universal CTA) | — | Brand-level, not per-rep kit |
| Thumper | — | #13 (launcher) | — | #13 launcher + #14 input = Thumper UI set |

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
**Kit Recommendation:** General/NR — universal CTA candidate. Louis wants to place it on SS somewhere with kit-specific color swaps.

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

*(Full code preserved in v2.2 of this doc and in session chat)*

---

## Component #14 — Animated Blob Search Input (Thumper)

**Source:** Uiverse.io | **Type:** Input / Chat Text Field
**Use Case:** Thumper chat input field inside the chat window. Pairs with Component #13 (launcher button) as a Thumper UI set. Strip the grid background container (demo stage) — keep `inner-cont` + `main-block` + blob animation as the input wrapper.
**Key Features:** Dark glass input container (`#202121` outer, `#000` inner) with animated pink/blue blobs pulsing behind it. Blobs animate width from 130px to 100% on a 5s alternate ease-in-out loop. Pink blob: top-left with pink/magenta glow shadows. Blue blob: bottom-right with purple/blue glow shadows. Both blurred. Inner container has `radial-gradient` pseudo-element glow on left (pink `#e240b6`) and right (purple `#533cde`) corners. Search SVG icon left, filter/funnel SVG icon right (swap to send button or attachment icon for chat). Input text `#d6d6d6` on transparent. 18px radius. 430x75px.
**Vibe:** Premium AI interface. Dark glass with living light. Same design language as #13.
**Kit Recommendation:** Thumper-specific. Pairs with Component #13 as the Thumper UI set. Funnel icon → send button. Search icon could stay (reps search inventory via Thumper) or swap to a chat bubble icon.

*(Full code preserved in v2.3 of this doc and in session chat)*

---

## Component #15 — Sparkle Burst Button

**Source:** Uiverse.io | **Type:** Button (CTA)
**Key Features:** 6 four-pointed star SVGs positioned behind button, hidden at z-index -5. On hover: stars explode outward to staggered positions with different cubic-bezier timing (0.6s–1s range). Each star gets `drop-shadow(0 0 10px #fffdef)` glow on hover. Button goes transparent with color shift and `box-shadow: 0 0 25px` glow. Warm peach/gold base color (`#fec195`). Cream-white stars (`#fffdef`). 8px border-radius. Stars range 5px–25px width.
**Vibe:** Celebratory, sparkly, jewelry-native. "Look at me" energy.
**Kit Recommendation:** Amber — warm peach/gold tone, burst energy, and confident personality are Amber in button form. Swap `#fec195` to Amber's orange palette. Natural pairing with Component #4 (Flip Card).

```jsx
import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <button>
        Button
        <div className="star-1">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-2">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-3">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-4">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-5">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-6">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    position: relative;
    padding: 12px 35px;
    background: #fec195;
    font-size: 17px;
    font-weight: 500;
    color: #181818;
    border: 3px solid #fec195;
    border-radius: 8px;
    box-shadow: 0 0 0 #fec1958c;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
  }

  .star-1 {
    position: absolute;
    top: 20%;
    left: 20%;
    width: 25px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
  }

  .star-2 {
    position: absolute;
    top: 45%;
    left: 45%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-3 {
    position: absolute;
    top: 40%;
    left: 40%;
    width: 5px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-4 {
    position: absolute;
    top: 20%;
    left: 40%;
    width: 8px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-5 {
    position: absolute;
    top: 25%;
    left: 45%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.6s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-6 {
    position: absolute;
    top: 5%;
    left: 50%;
    width: 5px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s ease;
  }

  button:hover {
    background: transparent;
    color: #fec195;
    box-shadow: 0 0 25px #fec1958c;
  }

  button:hover .star-1 {
    position: absolute;
    top: -80%;
    left: -30%;
    width: 25px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-2 {
    position: absolute;
    top: -25%;
    left: 10%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-3 {
    position: absolute;
    top: 55%;
    left: 25%;
    width: 5px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-4 {
    position: absolute;
    top: 30%;
    left: 80%;
    width: 8px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-5 {
    position: absolute;
    top: 25%;
    left: 115%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-6 {
    position: absolute;
    top: 5%;
    left: 60%;
    width: 5px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  .fil0 {
    fill: #fffdef;
  }`;

export default Button;
```

---

## Notes

- Full source code for Components #1–#5 preserved in v1.4 of this document. Components #6+ have code inline above.
- Kit pairing tracker updated as components are added.
- Amethyst still needs a button recommendation. #9 (Gradient Glow CTA) reassigned to General/NR as universal CTA.
- Old versions (v1.0–v2.3) accumulate in Drive — low priority cleanup.
