import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Nic-Nac mobile shell launcher', () => {
  it('keeps the closed launcher compact and tucked into the safe-area corner', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/NicNacMobileShell.module.css',
      ),
      'utf8',
    )

    expect(css).toMatch(/\.bubble\s*\{[^}]*width:\s*52px/s)
    expect(css).toMatch(/\.bubble\s*\{[^}]*height:\s*52px/s)
    expect(css).toContain(
      'bottom: max(12px, calc(env(safe-area-inset-bottom) + 8px));',
    )
    expect(css).toContain(
      'right: max(12px, calc(env(safe-area-inset-right) + 8px));',
    )
  })

  it('returns focus only after the mobile sheet closes, not on first mount', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/NicNacMobileShell.tsx',
      ),
      'utf8',
    )

    expect(source).toContain('const hasMountedRef = useRef(false)')
    expect(source).toContain('const wasOpenRef = useRef(open)')
    expect(source).toContain('if (!hasMountedRef.current) {')
    expect(source).toContain('if (wasOpenRef.current && !open && bubbleRef.current) {')
  })
})
