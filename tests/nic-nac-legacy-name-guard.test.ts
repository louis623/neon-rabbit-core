import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const LEGACY_NAME = ['Thu', 'mper'].join('')
const LEGACY_LOWER = LEGACY_NAME.toLowerCase()
const LEGACY_UPPER = LEGACY_NAME.toUpperCase()

const ROOT = process.cwd()

function collectFiles(path: string): string[] {
  const absolutePath = resolve(ROOT, path)
  if (!existsSync(absolutePath)) return []

  const stat = statSync(absolutePath)
  if (stat.isFile()) return [absolutePath]

  return readdirSync(absolutePath).flatMap((entry) => {
    const child = join(absolutePath, entry)
    const childStat = statSync(child)
    if (childStat.isDirectory()) return collectFiles(relative(ROOT, child))
    return [child]
  })
}

describe('Nic-Nac legacy-name guard', () => {
  it('keeps active assistant routes, libraries, tests, and benchmark files on Nic-Nac naming', () => {
    const removedRuntimePaths = [
      join('app', LEGACY_LOWER),
      join('app', 'api', LEGACY_LOWER),
      join('lib', LEGACY_LOWER),
      join('tests', LEGACY_LOWER),
    ]

    expect(
      removedRuntimePaths.filter((path) => existsSync(resolve(ROOT, path))),
    ).toEqual([])

    const files = [
      ...collectFiles(join('app', 'nic-nac')),
      ...collectFiles(join('app', 'api', 'nic-nac')),
      ...collectFiles(join('lib', 'nic-nac')),
      ...collectFiles(join('tests', 'nic-nac')),
      ...collectFiles('spike'),
    ]

    const offenders = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return [LEGACY_NAME, LEGACY_LOWER, LEGACY_UPPER].some((needle) =>
        text.includes(needle),
      )
        ? [relative(ROOT, file)]
        : []
    })

    expect(offenders).toEqual([])
  })
})
