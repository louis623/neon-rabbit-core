import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { NicNacMark } from '@/app/_components/nic-nac-mark'
import { EmptyGreeting } from '@/app/nic-nac/components/EmptyGreeting'
import { RequiredSetupLiveQueuePanel } from '@/app/nic-nac/components/RequiredSetupLiveQueuePanel'
import { RequiredSetupLookPicker } from '@/app/nic-nac/components/RequiredSetupLookPicker'
import { RequiredSetupPreviewPanel } from '@/app/nic-nac/components/RequiredSetupPreviewPanel'
import { RequiredSetupUpdatesPanel } from '@/app/nic-nac/components/RequiredSetupUpdatesPanel'
import { Chips } from '@/app/nic-nac/components/Chips'
import { InputRow } from '@/app/nic-nac/components/InputRow'
import { ThinkingIndicator } from '@/app/nic-nac/components/ThinkingIndicator'
import { NicNacHeader } from '@/app/nic-nac/components/NicNacHeader'

describe('Nic-Nac branding copy', () => {
  it('renders the rep-facing assistant name across the shell copy', () => {
    const greetingHtml = renderToStaticMarkup(createElement(EmptyGreeting))
    const inputHtml = renderToStaticMarkup(
      createElement(InputRow, {
        value: '',
        onChange: () => {},
        onSubmit: () => {},
        attachments: [],
        onPickFiles: () => {},
        onRemoveAttachment: () => {},
      }),
    )
    const thinkingHtml = renderToStaticMarkup(
      createElement(ThinkingIndicator, {
        showGlyph: true,
      }),
    )
    const headerHtml = renderToStaticMarkup(
      createElement(NicNacHeader, {
        closeLabel: 'Close Nic-Nac',
        onClose: () => {},
      }),
    )

    expect(greetingHtml).toContain("Hey, I&#x27;m Nic-Nac. How can I help?")
    expect(inputHtml).toContain('placeholder="Ask Nic-Nac…')
    expect(thinkingHtml).toContain('Nic-Nac is thinking…')
    expect(headerHtml).toContain('Nic-Nac')
    expect(headerHtml).not.toContain('NIC-NAC')
    expect(headerHtml).toContain('aria-label="Close Nic-Nac"')
  })

  it('uses guided copy without prompt chips during required setup', () => {
    const greetingHtml = renderToStaticMarkup(
      createElement(EmptyGreeting, { mode: 'required_setup' }),
    )
    const chipsHtml = renderToStaticMarkup(
      createElement(Chips, {
        visible: true,
        mode: 'required_setup',
        onPick: () => {},
      }),
    )

    expect(greetingHtml).toContain('Welcome to your new Sparkle Suite.')
    expect(greetingHtml).toContain('We&#x27;re happy to have you.')
    expect(greetingHtml).toContain('I&#x27;m Nic-Nac, your built-in live show assistant.')
    expect(greetingHtml).toContain('Sparkle Suite Workspace')
    expect(greetingHtml).toContain('customer-facing website ready!')
    expect(greetingHtml).toContain('What should I call you?')
    expect(greetingHtml).not.toContain('What&#x27;s on your mind?')
    expect(chipsHtml).toBe('')
    expect(chipsHtml).not.toContain('Start account basics')
    expect(chipsHtml).not.toContain('What do you need from me?')
    expect(chipsHtml).not.toContain('What&#x27;s on my board?')
    expect(chipsHtml).not.toContain('Remove a listing')
  })

  it('keeps prompt chips available in the normal workspace', () => {
    const chipsHtml = renderToStaticMarkup(
      createElement(Chips, {
        visible: true,
        mode: 'workspace',
        onPick: () => {},
      }),
    )

    expect(chipsHtml).toContain('What&#x27;s on my board?')
    expect(chipsHtml).toContain('Remove a listing')
    expect(chipsHtml).not.toContain('Start account basics')
    expect(chipsHtml).not.toContain('What do you need from me?')
  })

  it('renders a proactive customer-site Look picker for required setup', () => {
    const html = renderToStaticMarkup(
      createElement(RequiredSetupLookPicker, {
        onChoose: () => {},
      }),
    )

    expect(html).toContain('Choose your customer-site Look')
    expect(html).toContain('You can change your Look later')
    expect(html).toContain('new Looks over time')
    expect(html).toContain('Recommended')
    expect(html).toContain('Warm + Polished')
    expect(html).toContain('Sparkle Suite/Morganite')
    expect(html).toContain('Dark + Dramatic')
    expect(html).toContain('Black Diamond')
    expect(html).toContain('Soft Jewelry Polish')
    expect(html).toContain('Rose Gold')
    expect(html).toContain('Original Sparkle')
    expect(html).toContain('Choose this Look')
    expect(html).toContain('SS-01')
    expect(html).toContain('BD-01')
    expect(html).not.toContain('skin')
    expect(html).not.toContain('Skin')
  })

  it('renders required Live Queue setup as an operational setup panel', () => {
    const html = renderToStaticMarkup(
      createElement(RequiredSetupLiveQueuePanel, {
        syncCode: 'MHF-7342',
        onSend: () => {},
      }),
    )

    expect(html).toContain('Set up Live Queue')
    expect(html).toContain('Live Queue sync code')
    expect(html).toContain('MHF-7342')
    expect(html).toContain('Open Sparkle Suite Live Queue in the Chrome Extension Store')
    expect(html).toContain(
      'https://chromewebstore.google.com/detail/sparkle-suite-live-queue/kmodgfffflplfdlkkhadgimmobplhoih',
    )
    expect(html).toContain('Enter this sync code')
    expect(html).toContain('Confirm the Party Filter')
    expect(html).toContain('Check Live Queue status')
    expect(html).toContain('I need help with Live Queue setup')
    expect(html).not.toContain('search')
    expect(html).not.toContain('064632')
    expect(html).not.toContain('orientation')
    expect(html).not.toContain('LiveQ')
  })

  it('renders email and SMS update readiness as a setup check', () => {
    const html = renderToStaticMarkup(
      createElement(RequiredSetupUpdatesPanel, {
        onSend: () => {},
      }),
    )

    expect(html).toContain('Email and SMS update readiness')
    expect(html).toContain('Checkout does not text or email customers automatically')
    expect(html).toContain('Review how customers opt in')
    expect(html).toContain('Confirm update readiness')
    expect(html).toContain('I need help with update setup')
  })

  it('renders final preview approval with an exact customer-facing website link', () => {
    const html = renderToStaticMarkup(
      createElement(RequiredSetupPreviewPanel, {
        previewHref: '/amethyst/Homepage.html?c=rep-1',
        onApprove: () => {},
      }),
    )

    expect(html).toContain('Preview your customer-facing website')
    expect(html).toContain('href="/amethyst/Homepage.html?c=rep-1"')
    expect(html).toContain('Open preview')
    expect(html).toContain('Approve preview and unlock workspace')
    expect(html).not.toContain('look around the edges')
    expect(html).not.toContain('dashboard')
  })

  it('keeps Nic-Nac and rep message text large and bold for live-show readability', () => {
    const bubbleCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/Bubble.module.css'),
      'utf8',
    )
    const streamingCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/StreamingBubble.module.css'),
      'utf8',
    )
    const greetingCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/EmptyGreeting.module.css'),
      'utf8',
    )
    const tokensCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/nic-nac-tokens.css'),
      'utf8',
    )

    expect(bubbleCss).toContain('.nicNac')
    expect(bubbleCss).toContain('font-size: 21px')
    expect(bubbleCss).toContain('font-weight: 700')
    expect(bubbleCss).toContain('color: var(--nic-nac-speaker-nic-nac)')
    expect(streamingCss).toContain('font-size: 21px')
    expect(streamingCss).toContain('font-weight: 700')
    expect(streamingCss).toContain('color: var(--nic-nac-speaker-nic-nac)')
    expect(greetingCss).toContain('font-size: 21px')
    expect(greetingCss).toContain('font-weight: 700')
    expect(bubbleCss).toContain('.rep')
    expect(bubbleCss).toMatch(/\.rep\s*\{[^}]*font-size: 21px/s)
    expect(bubbleCss).toMatch(/\.rep\s*\{[^}]*font-weight: 700/s)
    expect(bubbleCss).toMatch(/\.rep\s*\{[^}]*line-height: 1\.45/s)
    expect(bubbleCss).toMatch(/\.rep\s*\{[^}]*color: var\(--nic-nac-speaker-rep\)/s)
    expect(tokensCss).toContain('--nic-nac-speaker-nic-nac: #402924')
    expect(tokensCss).toContain('--nic-nac-speaker-rep: #36221D')
    expect(tokensCss).toContain('--nic-nac-surface-rep-message: #F6EDE8')
    expect(tokensCss).not.toContain('#285C59')
  })

  it('keeps Nic-Nac headers and the shared chat composer easy to read', () => {
    const requiredSetupHome = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.tsx'),
      'utf8',
    )
    const requiredSetupCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.module.css'),
      'utf8',
    )
    const headerCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/NicNacHeader.module.css'),
      'utf8',
    )
    const inputCss = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/InputRow.module.css'),
      'utf8',
    )

    expect(requiredSetupHome).toContain('<p>Nic-Nac</p>')
    expect(requiredSetupHome).toContain('<NicNacGlyph size={40} />')
    expect(requiredSetupCss).toMatch(/\.chatHeader p\s*\{[^}]*font-size: 1\.15rem/s)
    expect(requiredSetupCss).toMatch(/\.chatHeader p\s*\{[^}]*font-weight: 900/s)
    expect(requiredSetupCss).toMatch(/\.chatHeader p\s*\{[^}]*text-transform: none/s)
    expect(requiredSetupCss).toMatch(/\.chatStatus\s*\{[^}]*font-size: 1rem/s)
    expect(headerCss).toContain('min-height: 60px')
    expect(headerCss).toMatch(/\.title\s*\{[^}]*font-size: 19px/s)
    expect(headerCss).toMatch(/\.closeBtn\s*\{[^}]*width: 40px/s)
    expect(headerCss).toMatch(/\.newBtn\s*\{[^}]*width: 40px/s)
    expect(inputCss).toMatch(/\.textarea\s*\{[^}]*font-size: 18px/s)
    expect(inputCss).toMatch(/\.textarea\s*\{[^}]*font-weight: 700/s)
    expect(inputCss).toMatch(/\.iconBtn\s*\{[^}]*width: 42px/s)
    expect(inputCss).toMatch(/\.send\s*\{[^}]*width: 42px/s)
  })

  it('uses the approved bright pink circle with a white N for every shared Nic-Nac mark', () => {
    const markHtml = renderToStaticMarkup(createElement(NicNacMark, { size: 34 }))
    const markCss = readFileSync(
      resolve(process.cwd(), 'app/_components/nic-nac-mark.module.css'),
      'utf8',
    )

    expect(markHtml).toContain('N')
    expect(markHtml).toContain('width:34px')
    expect(markHtml).toContain('height:34px')
    expect(markCss).toContain('background: #ee2c9b')
    expect(markCss).toContain('color: #ffffff')
    expect(markCss).toContain('border-radius: 999px')
    expect(markCss).toContain('font-family: "DM Sans"')
    expect(markCss).not.toContain('var(--nic-nac-accent')
    expect(markCss).not.toContain('var(--nic-nac-text-on-accent')
    expect(markCss).not.toContain('box-shadow')
  })

  it('does not let required setup header text styling override the shared Nic-Nac mark', () => {
    const requiredSetupHome = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/RequiredSetupHome.tsx',
      ),
      'utf8',
    )
    const requiredSetupCss = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/RequiredSetupHome.module.css',
      ),
      'utf8',
    )

    expect(requiredSetupHome).toContain('className={styles.chatStatus}')
    expect(requiredSetupCss).toContain('.chatStatus')
    expect(requiredSetupCss).not.toContain('.chatHeader span')
  })

  it('keeps required setup styling on the production Sparkle Suite palette', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/RequiredSetupHome.module.css',
      ),
      'utf8',
    )

    expect(css).toContain('#402924')
    expect(css).toContain('#ee2c9b')
    expect(css).toContain('Playfair Display')
    expect(css).toContain('DM Sans')
    expect(css).not.toContain(
      'linear-gradient(135deg, #fff8fb 0%, #f8efe9 42%, #402924 82%, #36221d 100%)',
    )
    expect(css).not.toMatch(/background:[^;}]*#402924[^;}]*#36221d[^;}]*;/)
  })
})
