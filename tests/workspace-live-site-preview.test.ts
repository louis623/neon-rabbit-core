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
    expect(component).toContain('Back to workspace')
    expect(component).toContain('Refresh preview')
    expect(component).toContain('Open full site')
    expect(component).toContain('Open Nic-Nac')
    expect(component).toContain('Close Nic-Nac')
    expect(component).toContain('aria-controls="nic-nac-workspace-chat"')
    expect(component).toContain('target="_blank"')
    expect(component).toContain('rel="noreferrer"')
  })

  it('centers the four preview actions in an equal two-column control cluster', () => {
    expect(component).toContain('styles.previewAction')
    expect(css).toMatch(/\.previewFocusBar\s*{[^}]*display:\s*grid/s)
    expect(css).toMatch(/\.previewFocusActions\s*{[^}]*display:\s*grid/s)
    expect(css).toContain('grid-template-columns: repeat(2, minmax(150px, 1fr));')
    expect(css).toMatch(/\.previewFocusActions\s*{[^}]*justify-self:\s*center/s)
    expect(css).toMatch(/\.previewAction\s*{[^}]*display:\s*inline-flex/s)
    expect(css).toMatch(/\.previewAction\s*{[^}]*align-items:\s*center/s)
    expect(css).toMatch(/\.previewAction\s*{[^}]*justify-content:\s*center/s)
    expect(css).toMatch(/\.previewAction\s*{[^}]*min-height:\s*44px/s)
    expect(css).toMatch(/\.previewAction\s*{[^}]*width:\s*100%/s)
    expect(css).toMatch(/\.previewAction\s*{[^}]*text-align:\s*center/s)
    expect(css).not.toContain('.previewAction:nth-child(2)')
  })

  it('restores Nic-Nac as an opt-in desktop sidecar without replacing the iframe preview', () => {
    expect(component).toContain('const [previewNicNacOpen, setPreviewNicNacOpen] = useState(false)')
    expect(component).toContain('const showPreviewNicNacSidecar = previewNicNacOpen && Boolean(desktopChat)')
    expect(component).toContain('styles.previewWorkbench')
    expect(component).toContain('styles.previewWorkbenchWithSidecar')
    expect(component).toContain('styles.previewFramePane')
    expect(component).toContain('styles.previewNicNacSidecar')
    expect(component).toContain('styles.previewNicNacBody')
    expect(component).toContain('showPreviewNicNacSidecar ? (')
    expect(component).toContain('<iframe')
    expect(component).toContain('onOpenNicNac?.()')
    expect(component).toContain('setPreviewNicNacOpen((current) => !current)')
    expect(component).toContain('aria-expanded={showPreviewNicNacSidecar}')
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) minmax(320px, var(--nic-nac-column-width));')
    expect(css).toMatch(/\.previewNicNacSidecar\s*{[^}]*display:\s*flex/s)
  })

  it('does not block embedded preview on tablet or mobile widths', () => {
    expect(component).not.toContain('LIVE_SITE_PREVIEW_MIN_WIDTH_QUERY')
    expect(component).not.toContain('canUseEmbeddedLiveSitePreview')
    expect(component).not.toContain('Use a wider screen to preview')
    expect(css).not.toMatch(/\.previewFrame\s*{[^}]*display:\s*none/s)
    expect(css).toMatch(/@media\s*\(max-width:\s*1023px\)[\s\S]*\.previewNicNacSidecar\s*{[^}]*display:\s*none/s)
    expect(component).toContain('styles.previewNicNacDrawerToggle')
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
