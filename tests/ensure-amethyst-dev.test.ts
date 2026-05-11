import { describe, expect, it } from 'vitest'

import { buildWindowsDetachedDevServerLaunch } from '@/lib/amethyst/dev-server-launch'

describe('buildWindowsDetachedDevServerLaunch', () => {
  it('uses cmd.exe so the Windows dev server stays alive after the helper exits', () => {
    const spec = buildWindowsDetachedDevServerLaunch({
      cwd: 'C:\\Users\\louis\\neon-rabbit-core',
      outPath:
        'C:\\Users\\louis\\neon-rabbit-core\\.codex-logs\\sparkle-suite-dev-3001.out.log',
      errPath:
        'C:\\Users\\louis\\neon-rabbit-core\\.codex-logs\\sparkle-suite-dev-3001.err.log',
      port: 3021,
    })

    expect(spec.filePath.toLowerCase()).toContain('cmd.exe')
    expect(spec.argumentList[0]).toBe('/c')
    expect(spec.argumentList[1]).toContain('npm run dev -- --port 3021')
    expect(spec.argumentList[1]).toContain(
      'cd /d "C:\\Users\\louis\\neon-rabbit-core"',
    )
    expect(spec.argumentList[1]).toContain(
      '> "C:\\Users\\louis\\neon-rabbit-core\\.codex-logs\\sparkle-suite-dev-3001.out.log"',
    )
    expect(spec.argumentList[1]).toContain(
      '2> "C:\\Users\\louis\\neon-rabbit-core\\.codex-logs\\sparkle-suite-dev-3001.err.log"',
    )
  })
})
