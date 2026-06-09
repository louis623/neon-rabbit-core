import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('workspace live site focus preview', () => {
  const component = source('app/nic-nac/components/DashboardPlaceholder.tsx')
  const css = source('app/nic-nac/components/DashboardPlaceholder.module.css')

  it('renders live site preview as a focused workspace mode with direct preview actions', () => {
    expect(component).toContain('const isLiveSitePreview =')
    expect(component).toContain('styles.mainPreviewFocus')
    expect(component).toContain('styles.previewFocusShell')
    expect(component).toContain('styles.previewFocusBar')
    expect(component).toContain('styles.previewFocusFrame')
    expect(component).toContain('Open full site')
    expect(component).toContain('target="_blank"')
    expect(component).toContain('rel="noreferrer"')
  })

  it('does not block embedded preview on tablet or mobile widths', () => {
    expect(component).not.toContain('LIVE_SITE_PREVIEW_MIN_WIDTH_QUERY')
    expect(component).not.toContain('canUseEmbeddedLiveSitePreview')
    expect(component).not.toContain('Use a wider screen to preview')
    expect(css).not.toMatch(/\.previewFrame\s*{[^}]*display:\s*none/s)
  })

  it('allocates most available workspace height to the iframe preview', () => {
    expect(css).toContain('.mainPreviewFocus')
    expect(css).toContain('.previewFocusShell')
    expect(css).toContain('.previewFocusBar')
    expect(css).toContain('.previewFocusFrame')
    expect(css).toContain('calc(var(--nic-nac-app-height, 100vh) - 92px)')
    expect(css).toContain('min-height: min(760px, calc(var(--nic-nac-app-height, 100vh) - 92px))')
    expect(css).toContain('border-radius: 10px')
  })
})
