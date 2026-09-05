import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { transformSync } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AMETHYST_APPEARANCE_PRESETS } from '@/lib/amethyst/appearance-presets'

const pages = ['homepage', 'trade', 'join'] as const

describe('Gnome Forest shipped customer runtimes', () => {
  for (const page of pages) {
    const source = readFileSync(resolve(process.cwd(), `public/amethyst/${page}.jsx`), 'utf8')

    it(`${page} uses the same selectable visual tokens as the saved preset`, () => {
      const declaration = source.match(/const PRESETS = (\{[\s\S]*?\n\});/)
      expect(declaration).not.toBeNull()
      const presets = runInNewContext(`(${declaration![1]})`)
      expect(presets.gnome_garden).toEqual(AMETHYST_APPEARANCE_PRESETS.gnome_garden.values)
      expect(source).toContain('{ value: "gnome_garden", label: "Gnome Forest" }')
      expect(source).toContain('gnomeGarden: { bg: "#173126", elevated: "#FFF3D6", deep: "#102319" }')
      for (const className of ['bg-gnome-garden', 'surface-storybook-parchment', 'btn-lantern-lift', 'mushroom-glow', 'tex-fireflies']) {
        expect(source).toContain(`body.classList.add("${className}")`)
      }
    })

    it(`${page} renders bounded, inert decoration with no interactive controls`, () => {
      const declaration = source.match(/function GnomeGardenScene\(\) \{[\s\S]*?\n\}/)
      expect(declaration).not.toBeNull()
      const compiled = transformSync(`${declaration![0]}\nGnomeGardenScene;`, { loader: 'jsx', jsx: 'transform' }).code
      const Scene = runInNewContext(compiled, { React })
      const html = renderToStaticMarkup(React.createElement(Scene))
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('pointer-events:none')
      expect(html.match(/class="gg-firefly"/g)).toHaveLength(8)
      for (let index = 1; index <= 8; index++) expect(html).toContain(`data-firefly-index="${index}"`)
      expect(html.match(/class="gg-lantern gg-lantern-/g)).toHaveLength(2)
      expect(html.match(/<span class="gg-lantern gg-lantern-/g)).toHaveLength(2)
      expect(html.match(/width="157" height="400"/g)).toHaveLength(2)
      expect(html).toContain('width="347" height="640"')
      expect(html.match(/class="gg-gnome"/g)).toHaveLength(1)
      expect(html).not.toMatch(/<(?:a|button|input)\b/)
      expect(html).toContain('/amethyst/skins/gnome-garden/gnome.webp')
      expect(html).toContain('/amethyst/skins/gnome-garden/lantern.webp')
      expect(html.match(/alt=""/g)).toHaveLength(3)
    })

    it(`${page} parses as the actual shipped JSX runtime`, () => {
      expect(() => transformSync(source, { loader: 'jsx' })).not.toThrow()
    })

    it(`${page} exposes an accessible page-local animation pause control`, () => {
      const declaration = source.match(/function GnomeGardenDecoration\(\) \{[\s\S]*?\n\}/)
      expect(declaration).not.toBeNull()
      let paused = false
      const update = (value: (current: boolean) => boolean) => { paused = value(paused) }
      const compiled = transformSync(`${declaration![0]}\nGnomeGardenDecoration;`, { loader: 'jsx', jsx: 'transform' }).code
      const Decoration = runInNewContext(compiled, {
        React, useState: () => [paused, update],
        GnomeGardenScene: () => null,
      })
      const initial = Decoration()
      const button = initial.props.children[1]
      expect(button.props.type).toBe('button')
      expect(button.props['aria-pressed']).toBe(false)
      expect(button.props.children).toBe('Pause animation')
      button.props.onClick()
      const next = Decoration()
      expect(next.props['data-paused']).toBe(true)
      expect(next.props.children[1].props['aria-pressed']).toBe(true)
      expect(next.props.children[1].props.children).toBe('Resume animation')
      next.props.children[1].props.onClick()
      expect(paused).toBe(false)
    })
  }

  it('adds the scene only when Gnome Forest is selected, including existing homepage variants', () => {
    const homepage = readFileSync(resolve(process.cwd(), 'public/amethyst/homepage.jsx'), 'utf8')
    expect(homepage.match(/t\.preset === "gnome_garden" && <GnomeGardenDecoration \/>/g)).toHaveLength(4)
    for (const page of ['trade', 'join']) {
      const source = readFileSync(resolve(process.cwd(), `public/amethyst/${page}.jsx`), 'utf8')
      expect(source).toContain('gnomeGarden={t.preset === "gnome_garden"}')
      expect(source).toContain('{gnomeGarden && <GnomeGardenDecoration />}')
    }
  })

  it('applies a static utility theme only from the saved homepage bootstrap preset', () => {
    const source = readFileSync(resolve(process.cwd(), 'public/amethyst/unsubscribe.jsx'), 'utf8')
    const declaration = source.match(/function applyUnsubscribeAppearance\(\) \{[\s\S]*?\n\}/)
    expect(declaration).not.toBeNull()
    for (const preset of ['gnome_garden', 'emerald_garden', undefined]) {
      const classes: string[] = []
      const tokens: Record<string, string> = {}
      const document = {
        body: { classList: { add: (...values: string[]) => classes.push(...values) } },
        documentElement: { style: { setProperty: (name: string, value: string) => { tokens[name] = value } } },
      }
      runInNewContext(`${declaration![0]}\napplyUnsubscribeAppearance();`, {
        window: { HOMEPAGE_TWEAK_DEFAULTS: { preset } },
        document,
      })
      if (preset === 'gnome_garden') {
        expect(classes).toEqual(['bg-gnome-garden', 'surface-storybook-parchment', 'shape-soft', 'gg-utility'])
        expect(tokens['--hp-primary']).toBe('#842421')
        expect(tokens['--hp-bg-elevated']).toBe('#FFF3D6')
        expect(tokens['--hp-display-font']).toContain('Playfair Display')
      } else {
        expect(classes).toEqual([])
        expect(tokens).toEqual({})
      }
    }
    expect(source).not.toContain('GnomeGardenScene')
    expect(source).not.toContain('tex-fireflies')
    expect(source.match(/\/api\/amethyst\/customer-audience\/unsubscribe/g)).toHaveLength(2)
    expect(source).toContain('body: JSON.stringify(form)')
    expect(source).toContain('onSubmit={handleSubmit}')
    expect(source).toContain('const repId = runtimeText(RUNTIME_CONTEXT.repId)')
    const html = readFileSync(resolve(process.cwd(), 'public/amethyst/unsubscribe.html'), 'utf8')
    expect(html).toContain('href="gnome-garden.css')
    expect(html).toContain('src="/api/amethyst/homepage-template"')
  })

  it('keeps manual pause local to decorations and hides its control when OS motion is reduced', () => {
    const css = readFileSync(resolve(process.cwd(), 'public/amethyst/gnome-garden.css'), 'utf8')
    expect(css).not.toMatch(/\.gg-firefly:nth-of-type/)
    expect(css).toContain('.gg-decoration[data-paused="true"] .gg-scene *')
    expect(css).toContain('animation-play-state: paused !important')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.gg-motion-control \{ display: none; \}/)
    expect(css).toContain('body.bg-gnome-garden :is(.mhf-hero-video, .mhf-hero-shade, .bwb-hero-image, .bwb-hero-shade, .bk-home-hero-image) { display: none; }')
    expect(css).toContain('body.bg-gnome-garden :is(.mhf-hero-content, .bwb-hero-content, .bk-home-hero-content)')
    expect(css).toContain('body.bg-gnome-garden .hp-wibp-grid { grid-template-columns: minmax(0, 1fr); }')
    expect(css).toContain('body.bg-gnome-garden .hp-hero-inner { width: 100%; max-width: 100%; margin-inline: auto;')
  })
})
