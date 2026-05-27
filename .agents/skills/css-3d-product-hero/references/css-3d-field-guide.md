# CSS 3D Field Guide

## Source Basis

This guide is based on the CSS Transforms Module Level 2 specification and MDN reference pages for `perspective`, `perspective-origin`, `transform-style`, `transform-origin`, `translateZ()`, and `backface-visibility`.

Use those sources when uncertain about browser behavior:

- W3C CSS Transforms Level 2: https://www.w3.org/TR/css-transforms-2/
- MDN `perspective`: https://developer.mozilla.org/en-US/docs/Web/CSS/perspective
- MDN `perspective-origin`: https://developer.mozilla.org/en-US/docs/Web/CSS/perspective-origin
- MDN `transform-style`: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style
- MDN `transform-origin`: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin
- MDN `translateZ()`: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translateZ
- MDN `backface-visibility`: https://developer.mozilla.org/en-US/docs/Web/CSS/backface-visibility

## Mental Model

CSS 3D hero work is a stage, not a sticker board:

- `perspective` on the parent creates the camera for its transformed children.
- `perspective()` inside `transform` affects only that element's transform stack.
- `perspective-origin` moves the vanishing point, which is often the missing ingredient when a comp feels cinematic and the browser version feels plain.
- `transform-style: preserve-3d` keeps child transforms in 3D space. The default is `flat`, and the property is not inherited, so put it on each non-leaf 3D container that has 3D children.
- `translateZ()` creates actual depth when a parent perspective exists.
- `transform-origin` changes the pivot. It is useful when the screen should swing from a corner or side instead of rotating around its center.
- Transform order matters. Adjust one element at a time and verify in the browser after big changes.

## Recommended Scene Structure

```html
<section class="hero">
  <div class="hero-copy">...</div>
  <div class="hero-visual">
    <div class="hero-scene">
      <div class="hero-stage">
        <div class="hero-screen">...</div>
        <div class="hero-card hero-card--queue">...</div>
        <div class="hero-card hero-card--trade">...</div>
        <div class="hero-card hero-card--sms">...</div>
      </div>
    </div>
  </div>
</section>
```

```css
.hero-visual {
  position: relative;
  min-height: clamp(520px, 58vw, 760px);
}

.hero-scene {
  position: absolute;
  inset: 0;
  perspective: 1150px;
  perspective-origin: 62% 36%;
}

.hero-stage {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.hero-screen {
  transform-origin: 50% 48%;
  transform:
    translate3d(-2%, 5%, 0)
    rotateX(7deg)
    rotateY(-12deg)
    rotateZ(-2deg);
  box-shadow: 0 34px 70px rgb(55 31 26 / 0.22);
}

.hero-card {
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.hero-card--queue {
  transform:
    translate3d(74%, 10%, 160px)
    rotateX(4deg)
    rotateY(-10deg)
    rotateZ(2deg);
  box-shadow: 0 26px 54px rgb(55 31 26 / 0.18);
}
```

## Sparkle Suite Starting Camera

For a right-side Sparkle Suite product hero inspired by the approved mockup:

- Scene: `perspective: 1100px` to `1250px`
- Vanishing point: `perspective-origin: 58% 34%` to `66% 40%`
- Main screen: `rotateX(5deg to 9deg)`, `rotateY(-10deg to -16deg)`, `rotateZ(-1deg to -3deg)`
- Front cards: `translateZ(120px to 190px)`
- Mid cards: `translateZ(60px to 120px)`
- Background screen details: `translateZ(8px to 24px)` only if the children need to lift slightly from the screen
- Hover or pointer parallax: optional, very subtle, and disabled for reduced motion

If the result looks like sticky notes, increase the screen size, reduce card borders, add stronger contact shadows, vary `translateZ()`, and use smaller independent rotations. Do not solve it with more random absolute positioning.

## Flattening Hazards

Several CSS properties force a 3D container to flatten descendants even when `transform-style: preserve-3d` is declared. Keep these off `.hero-stage` and any nested 3D group that must preserve child depth:

- `overflow` values other than `visible` or `clip`
- `opacity` below `1`
- `filter` or `backdrop-filter`
- `clip` or `clip-path`
- `isolation: isolate`
- `mask-*`
- `mix-blend-mode` other than `normal`
- `contain: paint`
- paint containment caused by related properties

Common fixes:

- Put `overflow: hidden` on an outer wrapper that does not need to preserve descendant 3D.
- Put blur, glow, and filter effects on pseudo-elements or leaf nodes.
- Avoid fading the entire stage with `opacity`; fade individual cards after depth is no longer needed.
- Use `box-shadow` and layered gradients instead of `filter: drop-shadow()` on the 3D group.

## Depth And Polish Rules

- Use one shared perspective for objects that should feel part of the same scene.
- Keep rotations modest. Big rotations look like a demo trick.
- Use `translateZ()` for hierarchy, then use `z-index` only to resolve painting edge cases.
- Match shadow softness to Z-depth. Front objects usually need wider, softer shadows and slightly stronger ambient lift.
- Add tiny surface details on the screen so it reads as a real product, but do not make those details compete with the hero copy.
- Use `backface-visibility: hidden` on cards or panels that might rotate enough to reveal mirrored backs.
- Prefer stable dimensions with `aspect-ratio`, `min()`, `max()`, and `clamp()` so text and cards do not shift layout while loading.

## Responsive Pattern

Desktop:

- Full 3D scene.
- Larger main screen.
- Cards can float outside the screen bounds if they remain inside the hero visual.

Tablet:

- Reduce `rotateY` and `translateZ`.
- Pull cards closer to the screen.
- Preserve enough depth to avoid a flat collage.

Mobile:

- Either use a simplified staged screen with two or three cards, or stack product proof below the copy.
- Avoid horizontal scroll.
- Do not shrink dense UI until it becomes unreadable.
- Keep the CTA visible before the user reaches deep content.

```css
@media (max-width: 800px) {
  .hero-scene {
    perspective: 1400px;
    perspective-origin: 50% 30%;
  }

  .hero-screen {
    transform:
      translate3d(0, 0, 0)
      rotateX(3deg)
      rotateY(-5deg)
      rotateZ(-1deg);
  }

  .hero-card {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-stage,
  .hero-screen,
  .hero-card {
    transition: none;
    animation: none;
  }
}
```

## Debugging Checklist

When the browser version does not match the mockup:

1. Outline `.hero-scene`, `.hero-stage`, `.hero-screen`, and each card.
2. Confirm `perspective` is on the parent of the transformed objects, not only on the object itself.
3. Confirm every 3D container that has transformed descendants uses `transform-style: preserve-3d`.
4. Inspect computed styles for flattening properties on the stage.
5. Temporarily exaggerate `translateZ(220px)` on one card. If nothing changes, the scene is flat or perspective is missing.
6. Adjust `perspective-origin` before over-rotating the screen.
7. Compare a screenshot to the reference at the same viewport width.
8. Check mobile and desktop after every major camera change.
