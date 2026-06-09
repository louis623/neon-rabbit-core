import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function css(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Nic-Nac readable font scale', () => {
  it('keeps workspace chat typography about 25 percent smaller than the oversized pass', () => {
    const bubble = css('app/nic-nac/components/Bubble.module.css')
    const streaming = css('app/nic-nac/components/StreamingBubble.module.css')
    const greeting = css('app/nic-nac/components/EmptyGreeting.module.css')
    const input = css('app/nic-nac/components/InputRow.module.css')
    const header = css('app/nic-nac/components/NicNacHeader.module.css')

    expect(bubble).toContain('font-size: 16px')
    expect(streaming).toContain('font-size: 16px')
    expect(greeting).toContain('font-size: 16px')
    expect(input).toContain('font-size: 14px')
    expect(header).toContain('font-size: 14px')

    for (const source of [bubble, streaming, greeting]) {
      expect(source).not.toContain('font-size: 21px')
    }
    expect(input).not.toContain('font-size: 18px')
    expect(header).not.toContain('font-size: 19px')
  })

  it('scales down the large customer setup headings and panels', () => {
    const setup = css('app/nic-nac/components/RequiredSetupHome.module.css')
    const lookPicker = css('app/nic-nac/components/RequiredSetupLookPicker.module.css')
    const preview = css('app/nic-nac/components/RequiredSetupPreviewPanel.module.css')
    const liveQueue = css('app/nic-nac/components/RequiredSetupLiveQueuePanel.module.css')

    expect(setup).toContain('font-size: clamp(1.8rem, 3.75vw, 3.6rem)')
    expect(setup).toContain('font-size: 1.95rem')
    expect(lookPicker).toContain('font-size: clamp(1.25rem, 2.25vw, 1.76rem)')
    expect(preview).toContain('font-size: clamp(1.16rem, 2.25vw, 1.58rem)')
    expect(liveQueue).toContain('font-size: clamp(1.16rem, 2.25vw, 1.58rem)')

    expect(setup).not.toContain('font-size: clamp(2.4rem, 5vw, 4.8rem)')
    expect(setup).not.toContain('font-size: 2.6rem')
    expect(lookPicker).not.toContain('font-size: clamp(1.65rem, 3vw, 2.35rem)')
    expect(preview).not.toContain('font-size: clamp(1.55rem, 3vw, 2.1rem)')
    expect(liveQueue).not.toContain('font-size: clamp(1.55rem, 3vw, 2.1rem)')
  })
})
