import { describe, expect, it } from 'vitest'
import {
  HARD_FAIL_PHRASES,
  parseTradeBoardIntakeSmokeCases,
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
})
