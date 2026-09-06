import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

test('Brittany hero button polish is scoped, consistent and responsive', () => {
  const css = readFileSync('public/amethyst/britt-hero-buttons.css', 'utf8')
  const html = readFileSync('public/amethyst/Homepage.html', 'utf8')
  assert.match(html, /\/amethyst\/britt-hero-buttons\.css\?v=20260905-buttons1/)
  assert.match(css, /body\.britt-with-bling \.bwb-hero-cta-primary-row/)
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(css, /linear-gradient\(90deg, var\(--bwb-gold\), var\(--bwb-blush\), var\(--bwb-cyan\)\)/)
  assert.match(css, /body\.britt-with-bling \.hp-shop-btn/)
  assert.match(css, /@media \(max-width: 640px\)/)
  assert.match(css, /grid-template-columns: 1fr/)
  assert.match(css, /:focus-visible/)
  assert.doesNotMatch(css, /live-queue|lineup|\.hp-ticker|\.hp-signup|@import/)
})
