import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

// Optimize the three flyer-referenced generated assets and preserve the source reference.
const [forestSource, gnomeSource, lanternSource, flyerSource] = process.argv.slice(2)
if (!forestSource || !gnomeSource || !lanternSource || !flyerSource) throw new Error('Provide forest, gnome, lantern and approved flyer source PNG paths')
const target = resolve('public/amethyst/skins/gnome-garden')
await mkdir(target, { recursive: true })
await sharp(forestSource).resize({ width: 1536 }).webp({ quality: 78 }).toFile(resolve(target, 'forest.webp'))
await sharp(forestSource).resize({ width: 768 }).webp({ quality: 74 }).toFile(resolve(target, 'forest-mobile.webp'))
await sharp(gnomeSource).trim().resize({ height: 640 }).webp({ quality: 82, alphaQuality: 95 }).toFile(resolve(target, 'gnome.webp'))
await sharp(lanternSource).trim().resize({ height: 400 }).webp({ quality: 82, alphaQuality: 95 }).toFile(resolve(target, 'lantern.webp'))
await sharp(flyerSource).resize({ width: 768 }).webp({ quality: 78 }).toFile(resolve(target, 'storybook-original.webp'))
for (const name of ['forest.webp', 'forest-mobile.webp', 'gnome.webp', 'lantern.webp', 'storybook-original.webp']) {
  const { width, height, hasAlpha, size } = await sharp(resolve(target, name)).metadata()
  console.log(JSON.stringify({ name, width, height, hasAlpha, bytes: size }))
}
