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

**Version:** 2.3 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

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

*(Full code preserved in v2.2 of this doc and in session chat)*

---

## Component #14 — Animated Blob Search Input (Thumper)

**Source:** Uiverse.io | **Type:** Input / Chat Text Field
**Use Case:** Thumper chat input field inside the chat window. Pairs with Component #13 (launcher button) as a Thumper UI set. Strip the grid background container (demo stage) — keep `inner-cont` + `main-block` + blob animation as the input wrapper.
**Key Features:** Dark glass input container (`#202121` outer, `#000` inner) with animated pink/blue blobs pulsing behind it. Blobs animate width from 130px to 100% on a 5s alternate ease-in-out loop. Pink blob: top-left with pink/magenta glow shadows. Blue blob: bottom-right with purple/blue glow shadows. Both blurred. Inner container has `radial-gradient` pseudo-element glow on left (pink `#e240b6`) and right (purple `#533cde`) corners. Search SVG icon left, filter/funnel SVG icon right (swap to send button or attachment icon for chat). Input text `#d6d6d6` on transparent. 18px radius. 430x75px.
**Vibe:** Premium AI interface. Dark glass with living light. Same design language as #13.
**Kit Recommendation:** Thumper-specific. Pairs with Component #13 as the Thumper UI set. Funnel icon → send button. Search icon could stay (reps search inventory via Thumper) or swap to a chat bubble icon.

```jsx
import React from 'react';
import styled from 'styled-components';

const Input = () => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="radial-cont">
          <div className="outer">
            <div className="inner-cont">
              <div className="main-block">
                <div className="elements-cont">
                  <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48">
                    <path fill="currentColor" d="M20.5 6C12.492 6 6 12.492 6 20.5S12.492 35 20.5 35a14.44 14.44 0 0 0 9.138-3.241l9.801 9.801a1.5 1.5 0 1 0 2.121-2.121l-9.8-9.801A14.44 14.44 0 0 0 35 20.5C35 12.492 28.508 6 20.5 6M9 20.5C9 14.149 14.149 9 20.5 9S32 14.149 32 20.5S26.851 32 20.5 32S9 26.851 9 20.5" />
                  </svg>
                  <input className="input" type="text" name="search" placeholder="Search..." />
                  <div className="filter">
                    <svg className="funnel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" color="#000000" fill="none">
                      <path d="M8.85746 12.5061C6.36901 10.6456 4.59564 8.59915 3.62734 7.44867C3.3276 7.09253 3.22938 6.8319 3.17033 6.3728C2.96811 4.8008 2.86701 4.0148 3.32795 3.5074C3.7889 3 4.60404 3 6.23433 3H17.7657C19.396 3 20.2111 3 20.672 3.5074C21.133 4.0148 21.0319 4.8008 20.8297 6.37281C20.7706 6.83191 20.6724 7.09254 20.3726 7.44867C19.403 8.60062 17.6261 10.6507 15.1326 12.5135C14.907 12.6821 14.7583 12.9567 14.7307 13.2614C14.4837 15.992 14.2559 17.4876 14.1141 18.2442C13.8853 19.4657 12.1532 20.2006 11.226 20.8563C10.6741 21.2466 10.0043 20.782 9.93278 20.1778C9.79643 19.0261 9.53961 16.6864 9.25927 13.2614C9.23409 12.9539 9.08486 12.6761 8.85746 12.5061Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="pink blob" />
            <div className="blue blob" />
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    width: 100%;
    height: 100%;
    background-size: 16px 16px;
    background-image: linear-gradient(to right, #0d0d0c 2px, transparent 1px),
      linear-gradient(to bottom, #0d0d0c 2px, transparent 1px);
    background-color: #000000;
  }
  .radial-cont {
    width: 100%;
    height: 100%;
    background-image: radial-gradient(ellipse, transparent, #000);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .input {
    background-color: transparent;
    border: none;
    font-size: 1.4rem;
    width: 265px;
    outline: none;
    color: #d6d6d6;
    letter-spacing: 1px;
    z-index: 10;
  }
  .outer {
    position: relative;
  }
  .blob {
    position: absolute;
    width: 130px;
    height: 70px;
    animation: blob 5s ease-in-out infinite alternate;
  }
  @keyframes blob {
    0% {
      width: 130px;
    }
    100% {
      width: 100.2%;
    }
  }
  .pink {
    background-color: #ff98e4;
    left: -1px;
    top: 0px;
    border-radius: 16px;
    transform: rotate(1deg);
    box-shadow: -2px -2px 3px #ff9affc9, -5px -5px 10px #6d0a6dc7,
      -10px -10px 70px #e240e29c;
    filter: blur(1px);
  }
  .blue {
    background-color: #ffbfee;
    right: -1px;
    bottom: -1px;
    border-radius: 16px;
    transform: rotate(0deg);
    box-shadow: 2px 2px 3px #6c19d8a6, 5px 5px 10px #350a6dc7,
      20px 10px 90px 10px #220af7b0;
    filter: blur(3px);
  }

  .inner-cont {
    width: 430px;
    height: 75px;
    background-color: #202121;
    position: relative;
    padding: 2px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  .inner-cont::before,
  .inner-cont::after {
    content: "";
    position: absolute;
    width: 150px;
    height: 75px;
    border-radius: 16px;
  }
  .inner-cont::before {
    left: 0;
    background-image: radial-gradient(
      circle 150px at 10% -60%,
      #e240b6,
      transparent
    );
  }
  .inner-cont::after {
    right: 0;
    background-image: radial-gradient(
      circle 150px at 100% 160%,
      #533cde,
      transparent
    );
  }

  .main-block {
    background-color: #000000;
    border-radius: 16px;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 20px;
    padding-right: 10px;
    position: relative;
    z-index: 2;
  }
  .elements-cont {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }

  .main-block::before,
  .main-block::after {
    content: "";
    position: absolute;
    width: 150px;
    height: 71px;
    border-radius: 18px;
  }
  .main-block::before {
    left: 0px;
    background-image: radial-gradient(
      circle 150px at 0 -10%,
      #f701f33d,
      transparent
    );
  }
  .main-block::after {
    right: 0px;
    background-image: radial-gradient(
      circle 150px at 100% 150%,
      #1100ac7e,
      transparent
    );
  }

  .svg {
    color: #fff;
    font-size: 2.3rem;
  }
  .funnel {
    font-size: 2.3rem;
    color: #fff;
    width: 55px;
    height: 55px;
    padding: 8px;
    border-radius: 10px;
    margin-top: 7px;
    border: solid 2px #494949;
    position: relative;
    background: radial-gradient(circle 50px at 50% -60%, #6b698f, transparent);
  }`;

export default Input;
```

---

## Notes

- Full source code for Components #1–#5 preserved in v1.4 of this document. Components #6+ have code inline above.
- Kit pairing tracker updated as components are added. Thumper row now shows #13 + #14 as a UI set.
- Old versions (v1.0–v2.2) accumulate in Drive — low priority cleanup.
