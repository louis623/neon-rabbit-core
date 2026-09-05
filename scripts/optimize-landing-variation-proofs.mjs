import sharp from 'sharp'
import path from 'node:path'

// Capture-only proof from Louis's explicitly authorized demo site.
// No recoloring, compositing, jewelry synthesis, or source UI reconstruction.
const names = ['site-black-diamond', 'site-gnome-forest', 'site-alpine-opal', 'site-amethyst', 'dance-floor-garnet', 'calendar-emerald-garden']
for (const name of names) {
  const result = await sharp(path.resolve('artifacts/landing-variation-2026-09-05', `${name}.png`))
    .webp({ quality: 88 }).toFile(path.resolve('public/sparkle-suite/landing', `${name}-v2.webp`))
  console.log(JSON.stringify({ name, width: result.width, height: result.height, bytes: result.size }))
}
