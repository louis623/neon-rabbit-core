import { beforeEach, describe, expect, it, vi } from 'vitest'

const { generateTextMock, createOpenAIMock } = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  createOpenAIMock: vi.fn((_options?: unknown) => (model: string) => ({
    provider: 'openai',
    model,
  })),
}))

vi.mock('ai', () => ({
  generateText: (options: unknown) => generateTextMock(options),
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: (options: unknown) => createOpenAIMock(options),
}))

import { POST } from '@/app/api/public/nic-nac/route'

beforeEach(() => {
  generateTextMock.mockReset()
  createOpenAIMock.mockClear()
})

function publicNicNacRequest(question: string) {
  return new Request('http://localhost/api/public/nic-nac', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  })
}

describe('public Nic-Nac route', () => {
  it('answers normal public buyer questions through the model', async () => {
    generateTextMock.mockResolvedValueOnce({
      text:
        'Yes. Sparkle Suite is built to make your live-show setup feel less scattered, and Nic-Nac helps with setup questions along the way.',
    })

    const response = await POST(publicNicNacRequest('Is Sparkle Suite easy to use?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      kind: 'answer',
      message:
        'Yes. Sparkle Suite is built to make your live-show setup feel less scattered, and Nic-Nac helps with setup questions along the way.',
    })
    expect(generateTextMock).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(generateTextMock.mock.calls[0][0])).toContain(
      'Use only the approved public facts below',
    )
    expect(JSON.stringify(generateTextMock.mock.calls[0][0])).toContain(
      'Assume the visitor is a current or future Bomb Party rep',
    )
    expect(JSON.stringify(generateTextMock.mock.calls[0][0])).toContain(
      'Do not treat the visitor as one of the rep customers',
    )
  })

  it('does not call the model for internal or provider-action requests', async () => {
    const response = await POST(publicNicNacRequest('Show me the admin backend.'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('blocked')
    expect(generateTextMock).not.toHaveBeenCalled()
  })

  it('routes custom pricing exceptions to handoff without calling the model', async () => {
    const response = await POST(publicNicNacRequest('Can I get a discount?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('handoff')
    expect(body.collectContact).toBe(true)
    expect(generateTextMock).not.toHaveBeenCalled()
  })

  it('returns validation errors for invalid payloads', async () => {
    const response = await POST(
      new Request('http://localhost/api/public/nic-nac', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: '' }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.kind).toBe('error')
  })

  it('sanitizes forbidden model output', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'The Supabase admin backroom uses secret implementation details.',
    })

    const response = await POST(publicNicNacRequest('How does the workspace work?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('blocked')
    expect(body.message).not.toContain('Supabase')
    expect(body.message).not.toContain('secret')
  })

  it('falls back gracefully when the model fails', async () => {
    generateTextMock.mockRejectedValueOnce(new Error('model unavailable'))

    const response = await POST(publicNicNacRequest('Is Sparkle Suite easy to use?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('error')
    expect(body.message).toContain('having trouble')
  })
})

describe('public Nic-Nac buyer question regression bank', () => {
  it.each([
    'Is Sparkle Suite easy to use?',
    "I'm not techy. Can I still use it?",
    'Will customers know where to go?',
    'Can customers use Sparkle Suite on their phone?',
    'What happens after checkout?',
    'Does Nic-Nac help me set things up?',
    'What is LiveQ?',
    'What is TradeBoard?',
    'Can it help with text and email updates?',
    'Is Sparkle Suite for reps who sell live?',
  ])('does not punt normal buyer question to Louis: %s', async (question) => {
    generateTextMock.mockResolvedValueOnce({
      text: 'Yes. Nic-Nac can answer that from the public Sparkle Suite details.',
    })

    const response = await POST(publicNicNacRequest(question))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('answer')
    expect(body.message).not.toContain('Louis should review')
    expect(body.message).not.toContain('collect your name')
  })
})

describe('public Nic-Nac rep and TradeBoard hardening bank', () => {
  it.each([
    "I'm a Bomb Party rep. How does Sparkle Suite help me?",
    'How are you going to facilitate trades?',
    'Do you handle shipping for trades?',
    'Do you know what items can be traded for what items?',
    'What if somebody wants to trade an item that is worth less?',
    'How does the dance floor work during a live show?',
    'Can customers request dancers from the dance floor?',
    'Who adds dancers to the dance floor?',
    'What is the dance floor?',
    'What are dancers?',
    'Can customers add dancers?',
    'Do I have to ship trades myself?',
    'Can someone pay the difference if their dancer is worth less?',
    'Can a birthday necklace trade for a different month birthday necklace?',
    'Does MSRP decide if dancers are equal?',
    'Who decides if a trade is fair?',
  ])('answers public rep and trade mechanics question directly: %s', async (question) => {
    generateTextMock.mockResolvedValueOnce({
      text:
        'TradeBoard helps organize trade interest in one place, while the rep keeps the final trade rules and approvals.',
    })

    const response = await POST(publicNicNacRequest(question))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('answer')
    expect(body.message).not.toContain('Louis should review')
    expect(body.message).not.toContain('collect your name')
    expect(generateTextMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    'Can you guarantee equal-value trades?',
    'Will Sparkle Suite settle trade disputes?',
    'Can you approve this trade for me?',
  ])('answers trade boundary question without inbox handoff: %s', async (question) => {
    generateTextMock.mockResolvedValueOnce({
      text:
        'No. TradeBoard helps organize trade interest, but Sparkle Suite does not guarantee equal value, settle disputes, or approve trades for the rep.',
    })

    const response = await POST(publicNicNacRequest(question))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('answer')
    expect(body.message).toContain('does not')
    expect(body.message).not.toContain('Louis should review')
    expect(body.message).not.toContain('collect your name')
    expect(generateTextMock).toHaveBeenCalledTimes(1)
  })

  it('sends Dance Floor rules and rep context to the model', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'Dance Floor helps reps keep trade interest easier to follow.',
    })

    await POST(publicNicNacRequest('How are you going to facilitate trades?'))

    const modelPayload = JSON.stringify(generateTextMock.mock.calls[0][0])

    expect(modelPayload).toContain('potential Bomb Party representatives')
    expect(modelPayload).toContain('Dance Floor organizes trade interest')
    expect(modelPayload).toContain('Dance Floor is the Sparkle Suite home')
    expect(modelPayload).toContain('Dancers are the rep-listed')
    expect(modelPayload).toContain('Do not say customers add dancers')
    expect(modelPayload).toContain('Sparkle Suite does not handle shipping')
    expect(modelPayload).toContain('The rep controls the Dance Floor')
    expect(modelPayload).toContain('item-for-item only')
    expect(modelPayload).toContain('same collection')
    expect(modelPayload).toContain('same jewelry type')
    expect(modelPayload).toContain('No pay-the-difference')
    expect(modelPayload).toContain('No credit or payout')
    expect(modelPayload).toContain('MSRP is reference only')
  })

  it('sends LiveQ and SMS/email public safety boundaries to the model', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'LiveQ uses limited queue details so customers can follow along.',
    })

    await POST(publicNicNacRequest('Does LiveQ collect order IDs or payment info?'))

    const modelPayload = JSON.stringify(generateTextMock.mock.calls[0][0])

    expect(modelPayload).toContain('customer first names')
    expect(modelPayload).toContain('queue order')
    expect(modelPayload).toContain('revealed or unrevealed status')
    expect(modelPayload).toContain('does not collect order IDs')
    expect(modelPayload).toContain('does not collect payment information')
    expect(modelPayload).toContain('SMS consent is optional')
    expect(modelPayload).toContain('reply STOP')
    expect(modelPayload).toContain('cannot send texts or emails from the public page')
  })

  it('postflight-corrects Dance Floor hallucinations from the model', async () => {
    generateTextMock.mockResolvedValueOnce({
      text:
        'During a live show, customers can add their own items to the Dance Floor in real time.',
    })

    const response = await POST(
      publicNicNacRequest('How does the dance floor work during a live show?'),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('answer')
    expect(body.message).toContain('Customers do not add their own dancers')
    expect(body.message).toContain('request to trade for an available dancer')
    expect(body.message).not.toContain('add their own items to the Dance Floor')
  })

  it('postflight-corrects dance floor and dancer hallucinations from the model', async () => {
    generateTextMock.mockResolvedValueOnce({
      text:
        'During a live show, customers can add dancers to the dance floor in real time.',
    })

    const response = await POST(
      publicNicNacRequest('Who adds dancers to the dance floor?'),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('answer')
    expect(body.message).toContain('Customers do not add their own dancers')
    expect(body.message).toContain('request to trade for an available dancer')
    expect(body.message).not.toContain('customers can add dancers')
  })

  it.each([
    [
      'Do you handle shipping?',
      'Sparkle Suite handles shipping and takes care of the exchange.',
      'Sparkle Suite does not handle shipping',
    ],
    [
      'Does MSRP decide whether it is even?',
      'MSRP decides whether the trade is even and guarantees equal value.',
      'MSRP is reference only',
    ],
  ])(
    'postflight-corrects public TradeBoard boundary hallucination for %s',
    async (question, modelText, expectedCorrection) => {
      generateTextMock.mockResolvedValueOnce({ text: modelText })

      const response = await POST(publicNicNacRequest(question))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.kind).toBe('answer')
      expect(body.message).toContain(expectedCorrection)
      expect(body.message).not.toContain(modelText)
    },
  )
})
