import { describe, expect, it } from 'vitest'
import {
  HARD_FAIL_PHRASES,
  findHardFailPhrases,
  parseTradeBoardIntakeSmokeCases,
  requireTradeBoardSmokeAssets,
} from '@/scripts/smoke-nic-nac-trade-board-intake'

describe('Nic-Nac Trade Board intake smoke script', () => {
  it('exports hard-fail phrases used by the smoke gate', () => {
    expect(HARD_FAIL_PHRASES).toContain("I can't actually add listings")
    expect(HARD_FAIL_PHRASES).toContain(
      'Log into your workspace and add it manually',
    )
    expect(HARD_FAIL_PHRASES).toContain('The photo of the earrings needs')
    expect(HARD_FAIL_PHRASES).toContain('Unboxed')
    expect(HARD_FAIL_PHRASES).toContain('Plain background')
    expect(HARD_FAIL_PHRASES).toContain('Packaging is too prominent')
    expect(HARD_FAIL_PHRASES).toContain('just the earrings')
    expect(HARD_FAIL_PHRASES).toContain('outside or clearly apart')
    expect(HARD_FAIL_PHRASES).toContain('photo URL')
    expect(HARD_FAIL_PHRASES).toContain('direct image link')
    expect(HARD_FAIL_PHRASES).toContain('cloud link')
    expect(HARD_FAIL_PHRASES).toContain('escalate this to Louis')
  })

  it('parses smoke cases from cases.txt-style content', () => {
    const cases = parseTradeBoardIntakeSmokeCases(`
CASE ER13229_LABEL_ONLY
message=Add ER13229 to my Trade Board
upload=ER13229-label.jpg
expect=ask_for_jewelry_front_photo
fail=The photo of the earrings needs
END
`)

    expect(cases).toEqual([
      {
        id: 'ER13229_LABEL_ONLY',
        message: 'Add ER13229 to my Trade Board',
        uploads: ['ER13229-label.jpg'],
        expect: ['ask_for_jewelry_front_photo'],
        fail: ['The photo of the earrings needs'],
      },
    ])
  })

  it('detects hard-fail phrases in assistant text case-insensitively', () => {
    expect(
      findHardFailPhrases(
        'I can escalate this to Louis and have him add it manually on the backend.',
      ),
    ).toEqual([
      'Have Louis add it manually on the backend',
      'escalate this to Louis',
    ])
    expect(findHardFailPhrases('Please use a plain background.')).toEqual([
      'Plain background',
    ])
    expect(
      findHardFailPhrases(
        'Do you have a direct image link or cloud link? The system needs a photo URL.',
      ),
    ).toEqual(['photo URL', 'direct image link', 'cloud link'])
  })

  it('reports missing required ER13229 smoke assets before live calls', () => {
    const result = requireTradeBoardSmokeAssets('C:/missing-smoke-assets', {
      existsSync: () => false,
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected missing fixture result')
    expect(result.missing).toEqual([
      'ER13229-label.jpg',
      'ER13229-jewelry-boxed-front.jpg',
    ])
  })
})
