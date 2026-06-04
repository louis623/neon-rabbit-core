import { describe, expect, it } from 'vitest'
import { normalizeNicNacAssistantText } from '@/lib/nic-nac/message-normalize'

describe('normalizeNicNacAssistantText', () => {
  it('adds missing spaces after sentence punctuation between generated chunks', () => {
    expect(normalizeNicNacAssistantText("Perfect.Now let's build your About page.")).toBe(
      "Perfect. Now let's build your About page.",
    )
    expect(normalizeNicNacAssistantText('options:Here are your About page options:')).toBe(
      'options: Here are your About page options:',
    )
  })

  it('does not corrupt urls or email addresses', () => {
    expect(
      normalizeNicNacAssistantText('Open https://bombparty.com/Lindseychapman/parties.Thanks.'),
    ).toBe('Open https://bombparty.com/Lindseychapman/parties. Thanks.')
    expect(normalizeNicNacAssistantText('Email janetest@gmail.com.Got it.')).toBe(
      'Email janetest@gmail.com. Got it.',
    )
  })
})
