import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  buildRenderedMobileSmokeArtifact,
  writeRenderedMobileSmokeArtifact,
} from '@/lib/launch-readiness/rendered-mobile-smoke'

const generatedAt = new Date('2026-05-26T19:15:00.000Z')

describe('rendered mobile smoke artifact', () => {
  it('builds a runner-compatible artifact from viewport route results', () => {
    const artifact = buildRenderedMobileSmokeArtifact({
      generatedAt,
      baseUrl: 'http://localhost:3000',
      routes: [
        {
          route: '/prelaunch',
          viewport: 'mobile',
          width: 390,
          height: 844,
          title: 'Sparkle Suite',
          finalUrl: 'http://localhost:3000/prelaunch',
          checks: {
            pageIdentity: true,
            notBlank: true,
            noFrameworkOverlay: true,
            noHorizontalOverflow: true,
            noCorruptedCharacters: true,
            consoleHealthy: true,
          },
          consoleMessages: [],
          interaction: {
            label: 'What Is Sparkle Suite?',
            ok: true,
            detail: 'hash=#summary',
          },
        },
        {
          route: '/amethyst/Trade.html',
          viewport: 'desktop',
          width: 1280,
          height: 720,
          title: 'Trade',
          finalUrl: 'http://localhost:3000/amethyst/Trade.html',
          checks: {
            pageIdentity: true,
            notBlank: true,
            noFrameworkOverlay: true,
            noHorizontalOverflow: true,
            noCorruptedCharacters: true,
            consoleHealthy: true,
          },
          consoleMessages: [
            {
              level: 'warn',
              message: 'Babel standalone warning',
              expected: true,
            },
          ],
          interaction: {
            label: 'Ring filter',
            ok: true,
            detail: 'active=Ring',
          },
        },
      ],
    })

    expect(artifact).toMatchObject({
      generatedAt: '2026-05-26T19:15:00.000Z',
      baseUrl: 'http://localhost:3000',
      ok: true,
      routes: ['/prelaunch', '/amethyst/Trade.html'],
      summary: {
        total: 2,
        passed: 2,
        failed: 0,
        expectedWarnings: 1,
        unexpectedConsoleMessages: 0,
      },
    })
    expect(artifact.results[1].ok).toBe(true)
  })

  it('fails the artifact when a route check or unexpected console message fails', () => {
    const artifact = buildRenderedMobileSmokeArtifact({
      generatedAt,
      baseUrl: 'http://localhost:3000',
      routes: [
        {
          route: '/nic-nac',
          viewport: 'mobile',
          width: 390,
          height: 844,
          title: 'Nic-Nac',
          finalUrl: 'http://localhost:3000/nic-nac',
          checks: {
            pageIdentity: true,
            notBlank: true,
            noFrameworkOverlay: true,
            noHorizontalOverflow: false,
            noCorruptedCharacters: true,
            consoleHealthy: true,
          },
          consoleMessages: [
            {
              level: 'error',
              message: 'Unhandled app error',
              expected: false,
            },
          ],
          interaction: {
            label: 'Help & Resources tab',
            ok: true,
            detail: 'tab visible',
          },
        },
      ],
    })

    expect(artifact.ok).toBe(false)
    expect(artifact.summary).toMatchObject({
      total: 1,
      passed: 0,
      failed: 1,
      unexpectedConsoleMessages: 1,
    })
    expect(artifact.results[0].ok).toBe(false)
  })

  it('writes the artifact under launch-readiness results by default', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'rendered-mobile-'))
    try {
      const artifact = buildRenderedMobileSmokeArtifact({
        generatedAt,
        baseUrl: 'http://localhost:3000',
        routes: [],
      })

      const outputPath = await writeRenderedMobileSmokeArtifact(artifact, {
        outputDir,
      })
      const written = JSON.parse(await readFile(outputPath, 'utf8'))

      expect(outputPath).toContain(
        'rendered-mobile-local-2026-05-26T19-15-00-000Z.json',
      )
      expect(written).toMatchObject({
        ok: true,
        routes: [],
        summary: {
          total: 0,
        },
      })
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })
})
