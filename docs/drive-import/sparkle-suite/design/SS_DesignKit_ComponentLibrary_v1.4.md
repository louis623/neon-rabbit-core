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

**Version:** 1.4 | **Created:** May 2, 2026 | **Status:** IN PROGRESS

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

---

## Component #1 — Glass Panel Reveal Card

**Source:** Uiverse.io
**Type:** Card
**Key Features:** Glass-morphic layered panels fan out from bottom-left on hover with staggered delays (0s, 0.2s, 0.4s, 0.6s). Scale 1.1x on hover. 30px border-radius. Gradient background. Frosted glass overlay (`rgba(255,255,255,0.389)`). Organic border-radius on panels (`10% 13% 42% 0%/10% 12% 75% 0%`). Each panel has its own radial gradient `:before` that fades in on individual hover.
**Vibe:** Premium, playful, high-interaction. Jewelry energy.
**Kit Recommendation:** Rose Quartz — frosted glass layers + organic shapes + playful staggered fan-out maps to the bubbly/whimsical kit personality. Gradient stops → primary (#E879F9) → accent (#63146E) → border (#FFB0FF).

```jsx
import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="background">
        </div>
        <div className="logo">
          Socials
        </div>
        <a href="#"><div className="box box1"><span className="icon"><svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="svg">
                <path d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z" />
              </svg></span></div></a>
        <a href="##"><div className="box box2"> <span className="icon"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="svg">
                <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
              </svg></span></div></a>
        <a href="###"><div className="box box3"><span className="icon"><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg" className="svg">
                <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
              </svg></span></div></a>
        <div className="box box4" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 200px;
    height: 200px;
    background: lightgrey;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    transition: all 1s ease-in-out;
    border: 2px solid rgb(255, 255, 255);
  }
  .background {
    position: absolute;
    inset: 0;
    background-color: #4158D0;
    background-image: linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%);
  }
  .logo {
    position: absolute;
    right: 50%;
    bottom: 50%;
    transform: translate(50%, 50%);
    transition: all 0.6s ease-in-out;
    font-size: 1.3em;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 3px;
  }
  .logo .logo-svg {
    fill: white;
    width: 30px;
    height: 30px;
  }
  .icon {
    display: inline-block;
    width: 20px;
    height: 20px;
  }
  .icon .svg {
    fill: rgba(255, 255, 255, 0.797);
    width: 100%;
    transition: all 0.5s ease-in-out;
  }
  .box {
    position: absolute;
    padding: 10px;
    text-align: right;
    background: rgba(255, 255, 255, 0.389);
    border-top: 2px solid rgb(255, 255, 255);
    border-right: 1px solid white;
    border-radius: 10% 13% 42% 0%/10% 12% 75% 0%;
    box-shadow: rgba(100, 100, 111, 0.364) -7px 7px 29px 0px;
    transform-origin: bottom left;
    transition: all 1s ease-in-out;
  }
  .box::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: all 0.5s ease-in-out;
  }
  .box:hover .svg { fill: white; }
  .box1 { width: 70%; height: 70%; bottom: -70%; left: -70%; }
  .box1::before { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #ff53d4 60%, #62c2fe 90%); }
  .box1:hover::before { opacity: 1; }
  .box1:hover .icon .svg { filter: drop-shadow(0 0 5px white); }
  .box2 { width: 50%; height: 50%; bottom: -50%; left: -50%; transition-delay: 0.2s; }
  .box2::before { background: radial-gradient(circle at 30% 107%, #91e9ff 0%, #00ACEE 90%); }
  .box2:hover::before { opacity: 1; }
  .box2:hover .icon .svg { filter: drop-shadow(0 0 5px white); }
  .box3 { width: 30%; height: 30%; bottom: -30%; left: -30%; transition-delay: 0.4s; }
  .box3::before { background: radial-gradient(circle at 30% 107%, #969fff 0%, #b349ff 90%); }
  .box3:hover::before { opacity: 1; }
  .box3:hover .icon .svg { filter: drop-shadow(0 0 5px white); }
  .box4 { width: 10%; height: 10%; bottom: -10%; left: -10%; transition-delay: 0.6s; }
  .card:hover { transform: scale(1.1); }
  .card:hover .box { bottom: -1px; left: -1px; }
  .card:hover .logo { transform: translate(70px, -52px); letter-spacing: 0px; }`;

export default Card;
```

---

## Component #2 — 3D Tilt Card

**Source:** Uiverse.io
**Type:** Card
**Key Features:** 3D perspective tilt on hover (`rotateY(10deg) rotateX(10deg) scale(1.05)`). `perspective: 1000px`. Sliding overlay `::before`/`::after` pseudo-elements sweep left and right on hover to reveal clean gradient. `cubic-bezier(0.23, 1, 0.320, 1)` easing. 8px border-radius.
**Vibe:** Bold, confident, editorial.
**Kit Recommendation:** Garnet — sharp 8px radius + bold 3D tilt + uppercase title text matches the editorial serif+sans energy. Gradient stops → primary (#B91C1C) → accent (#920000) → border (#FF9180).

```jsx
import React from 'react';
import styled from 'styled-components';
const Card = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="card-content">
          <p className="card-title">Card hover effect
          </p><p className="card-para">Lorem ipsum dolor sit 
            amet, consectetur adipiscing elit.</p>
        </div>
      </div>
    </StyledWrapper>
  );
}
const StyledWrapper = styled.div`
  .card {
    width: 300px;
    height: 200px;
    background-color: #4158D0;
    background-image: linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%);
    border-radius: 8px;
    color: white;
    overflow: hidden;
    position: relative;
    transform-style: preserve-3d;
    perspective: 1000px;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.320, 1);
    cursor: pointer;
  }
  .card-content {
    padding: 20px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: white;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 100%;
  }
  .card-content .card-title {
    font-size: 24px;
    font-weight: 700;
    color: inherit;
    text-transform: uppercase;
  }
  .card-content .card-para {
    color: inherit;
    opacity: 0.8;
    font-size: 14px;
  }
  .card:hover {
    transform: rotateY(10deg) rotateX(10deg) scale(1.05);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
  .card:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.1));
    transition: transform 0.5s cubic-bezier(0.23, 1, 0.320, 1);
    z-index: 1;
  }
  .card:hover:before { transform: translateX(-100%); }
  .card:after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.1));
    transition: transform 0.5s cubic-bezier(0.23, 1, 0.320, 1);
    z-index: 1;
  }
  .card:hover:after { transform: translateX(100%); }`;
export default Card;
```

---

## Component #3 — Premium Shine Product Card

**Source:** Uiverse.io
**Type:** Card (product/listing)
**Use Case Note:** Trade board card — image + title + price + action button + badge maps to trade listings. Phase 3 material.
**Key Features:** Product card layout (image, title, description, price, action button, badge). On hover: lift (`translateY(-10px)`), shine sweep (120deg, 3s infinite), radial glow, badge scales in, title/price shift to accent, button ring pulse. CSS custom properties. 20px radius. `cubic-bezier(0.16, 1, 0.3, 1)`.
**Vibe:** Refined, premium, commercial.
**Kit Recommendation:** Velvet — shine sweep + glow + subtle lift = luxury display. Purple accent in DNA. Gradient stops → primary (#9333EA) → accent (#6300B9) → bg (#FFE8FF).

```jsx
import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="card__shine" />
        <div className="card__glow" />
        <div className="card__content">
          <div className="card__badge">NEW</div>
          <div style={{-bgColor: '#a78bfa'}} className="card__image" />
          <div className="card__text">
            <p className="card__title">Premium Design</p>
            <p className="card__description">Hover to reveal stunning effects</p>
          </div>
          <div className="card__footer">
            <div className="card__price">$49.99</div>
            <div className="card__button">
              <svg height={16} width={16} viewBox="0 0 24 24">
                <path strokeWidth={2} stroke="currentColor" d="M4 12H20M12 4V20" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    --card-bg: #ffffff;
    --card-accent: #7c3aed;
    --card-text: #1e293b;
    --card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    width: 190px;
    height: 254px;
    background: var(--card-bg);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--card-shadow);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .card__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .card__glow {
    position: absolute;
    inset: -10px;
    background: radial-gradient(circle at 50% 0%, rgba(124,58,237,0.3) 0%, rgba(124,58,237,0) 70%);
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  .card__content {
    padding: 1.25em;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    position: relative;
    z-index: 2;
  }
  .card__badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #10b981;
    color: white;
    padding: 0.25em 0.5em;
    border-radius: 999px;
    font-size: 0.7em;
    font-weight: 600;
    transform: scale(0.8);
    opacity: 0;
    transition: all 0.4s ease 0.1s;
  }
  .card__image {
    width: 100%;
    height: 100px;
    background: linear-gradient(45deg, #a78bfa, #8b5cf6);
    border-radius: 12px;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }
  .card__image::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 30%),
      repeating-linear-gradient(45deg, rgba(139,92,246,0.1) 0px, rgba(139,92,246,0.1) 2px, transparent 2px, transparent 4px);
    opacity: 0.5;
  }
  .card__text { display: flex; flex-direction: column; gap: 0.25em; }
  .card__title { color: var(--card-text); font-size: 1.1em; margin: 0; font-weight: 700; transition: all 0.3s ease; }
  .card__description { color: var(--card-text); font-size: 0.75em; margin: 0; opacity: 0.7; transition: all 0.3s ease; }
  .card__footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
  .card__price { color: var(--card-text); font-weight: 700; font-size: 1em; transition: all 0.3s ease; }
  .card__button {
    width: 28px;
    height: 28px;
    background: var(--card-accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    transform: scale(0.9);
  }
  .card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
    border-color: rgba(124,58,237,0.2);
  }
  .card:hover .card__shine { opacity: 1; animation: shine 3s infinite; }
  .card:hover .card__glow { opacity: 1; }
  .card:hover .card__badge { transform: scale(1); opacity: 1; z-index: 1; }
  .card:hover .card__image { transform: translateY(-5px) scale(1.03); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .card:hover .card__title { color: var(--card-accent); transform: translateX(2px); }
  .card:hover .card__description { opacity: 1; transform: translateX(2px); }
  .card:hover .card__price { color: var(--card-accent); transform: translateX(2px); }
  .card:hover .card__button { transform: scale(1); box-shadow: 0 0 0 4px rgba(124,58,237,0.2); }
  .card:hover .card__button svg { animation: pulse 1.5s infinite; }
  .card:active { transform: translateY(-5px) scale(0.98); }
  @keyframes shine { 0% { background-position: -100% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`;

export default Card;
```

---

## Component #4 — Flip Card

**Source:** Uiverse.io
**Type:** Card (flip interaction)
**Use Case Note:** Rep site blocks — "about me" (front: photo/name, back: bio/contact), "book a party" (front: teaser, back: details), collection highlights.
**Key Features:** Full Y-axis flip (`rotateY(180deg)`). 0.8s transition. `perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`. Front: warm gradient (bisque → peach → coral). Back: inverse (coral-dominant). 1rem radius. Coral border.
**Vibe:** Warm, energetic, interactive.
**Kit Recommendation:** Amber — Louis called it. Coral/bisque tones → Amber palette (#F97316 primary, #761A00 accent, #FFB781 border). Melodrama heading front, Nunito body back.

```jsx
import React from 'react';
import styled from 'styled-components';
const Card = () => {
  return (
    <StyledWrapper>
      <div className="flip-card">
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <p className="title">FLIP CARD</p>
            <p>Hover Me</p>
          </div>
          <div className="flip-card-back">
            <p className="title">BACK</p>
            <p>Leave Me</p>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}
const StyledWrapper = styled.div`
  .flip-card {
    background-color: transparent;
    width: 190px;
    height: 254px;
    perspective: 1000px;
    font-family: sans-serif;
  }
  .title {
    font-size: 1.5em;
    font-weight: 900;
    text-align: center;
    margin: 0;
  }
  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }
  .flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
  }
  .flip-card-front, .flip-card-back {
    box-shadow: 0 8px 14px 0 rgba(0,0,0,0.2);
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border: 1px solid coral;
    border-radius: 1rem;
  }
  .flip-card-front {
    background: linear-gradient(120deg, bisque 60%, rgb(255, 231, 222) 88%,
       rgb(255, 211, 195) 40%, rgba(255, 127, 80, 0.603) 48%);
    color: coral;
  }
  .flip-card-back {
    background: linear-gradient(120deg, rgb(255, 174, 145) 30%, coral 88%,
       bisque 40%, rgb(255, 185, 160) 78%);
    color: white;
    transform: rotateY(180deg);
  }`;
export default Card;
```

---

## Component #5 — Expandable Stack Card (Compact → Detail Reveal)

**Source:** Uiverse.io
**Type:** Card (expand/collapse interaction pattern)
**Use Case Note:** Louis sees this for the mobile live queue + trade board interaction — tap compact queue card, it expands to reveal full queue list with piece details, status, and trade actions. The INTERACTION PATTERN is the value here, not the weather skin.
**Key Features:** Two-card stack: primary card (z-index 2, 250x130px, 25px radius) sits on top of secondary card (z-index -1, 240x130px, 35px radius). On hover: primary card changes bg color (`#FFE87C`), secondary card height animates from 130px → 300px revealing hidden content underneath. Sibling selector (`+`) drives the expand. Lower section repositions via `top` property transition. 0.4s ease-in-out on all transitions. Status bar at bottom of expanded card (limegreen bg, 35px bottom radius).
**Vibe:** Functional, data-driven, utilitarian. Clean expand/collapse.
**Kit Recommendation:** Amethyst — structural/functional interaction, not decorative. Maps to sleek/geometric personality (Vend Sans, purple). The expand-on-hover is modern and utilitarian. Fills the last empty kit slot. Primary card bg on hover → Amethyst primary (#D209E3). Secondary card bg stays white. Border/accent colors from kit palette.

```jsx
import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="cardm">
        <div className="card">
          <svg className="weather" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" xmlSpace="preserve">  <image id="image0" width={100} height={100} x={0} y={0} href="data:image/png;base64,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" />
          </svg>
          <div className="main">23 °C</div>
          <div className="mainsub">Dunmore, Ireland</div>
        </div>
        <div className="card2">
          <!-- secondary card content abbreviated for space — full code in original paste -->
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .cardm { position: absolute; display: flex; align-items: center; justify-content: center; top: 46.64%; left: 50%; }
  .card { position: absolute; width: 250px; height: 130px; border-radius: 25px; background: whitesmoke; color: black; z-index: 2; transition: .4s ease-in-out; }
  .weather { position: relative; margin: 1em; }
  .main { font-size: 2em; position: relative; top: -3em; left: 4.3em; }
  .mainsub { position: relative; top: -10.2em; left: 14em; font-size: 0.6em; }
  .card2 { position: absolute; display: flex; flex-direction: row; width: 240px; height: 130px; border-radius: 35px; background: white; z-index: -1; transition: .4s ease-in-out; }
  .card:hover { background-color: #FFE87C; cursor: pointer; }
  .card:hover + .card2 { height: 300px; border-bottom-left-radius: 0px; border-bottom-right-radius: 0px; }
  .card:hover + .card2 .lower { top: 20.2em; }
  .upper { display: flex; flex-direction: row; position: relative; color: black; left: 1.8em; top: 0.5em; gap: 4em; }
  .humiditytext { position: relative; left: 3.6em; top: 2.7em; font-size: 0.6em; }
  .airtext { position: relative; left: 3.8em; top: 2.7em; font-size: 0.6em; }
  .lower { display: flex; flex-direction: row; position: absolute; text-align: center; color: black; left: 3em; top: 1em; margin-top: 0.7em; font-size: 0.7em; transition: .4s ease-in-out; }
  .aqi { margin-right: 3.25em; }
  .realfeel { margin-right: 1.8em; }
  .card3 { position: absolute; display: flex; flex-direction: row; justify-content: center; align-items: center; width: 240px; height: 30px; top: 4.7em; left: -2.4em; font-size: 1.24em; border-bottom-left-radius: 35px; border-bottom-right-radius: 35px; background: limegreen; transition: .4s ease-in-out; }`;

export default Card;
```

**NOTE:** Full JSX with embedded SVG/base64 images preserved in Louis's original paste. The abbreviated version above captures the complete CSS interaction pattern. For the full JSX including all embedded icons, refer to Louis's original paste in the May 2, 2026 session chat.

---

## Components #6+ — (Awaiting Louis's next finds)

<!-- Louis: keep pasting code into chat. Claude will add entries here. -->
