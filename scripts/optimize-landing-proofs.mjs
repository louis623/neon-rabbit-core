import sharp from 'sharp'
import path from 'node:path'

const root = process.cwd()
const captures = path.join(root, 'artifacts/landing-implementation-2026-09-05')
const destination = path.join(root, 'public/sparkle-suite/landing')
const files = [
  ['site-blush.png', 'site-blush.webp'], ['site-violet.png', 'site-violet.webp'],
  ['site-night.png', 'site-night.webp'], ['live-queue.png', 'live-queue.webp'],
  ['live-calendar.png', 'live-calendar.webp'],
]
for (const [input, output] of files) {
  const result = await sharp(path.join(captures, input)).webp({ quality: 88 }).toFile(path.join(destination, output))
  console.log(output, result.width, result.height, result.size)
}
for (const input of ['trade-board-desktop-proof', 'nic-nac-workspace-proof']) {
  const result = await sharp(path.join(destination, `${input}.png`)).resize({ width: 1440, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(destination, `${input}.webp`))
  console.log(input, result.width, result.height, result.size)
}
