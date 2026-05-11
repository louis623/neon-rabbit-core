import { existsSync, readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const currentRequiredCoreDocs = [
  '01-master-brand-spec.md',
  '02-messaging-pillars.md',
  '03-nic-nac-positioning.md',
] as const

const coreDocPaths = [
  'docs/sparkle-suite/brand/00-master-index.md',
  ...currentRequiredCoreDocs.map((file) => `docs/sparkle-suite/brand/${file}`),
]

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function extractMarkdownFileReferences(content: string) {
  const matches = content.matchAll(
    /`([^`\n]+\.md)`|\[[^\]]+\]\(([^)\n]+\.md)\)/g,
  )

  return [
    ...new Set(
      [...matches]
        .flatMap((match) => match.slice(1).filter(Boolean))
        .map((file) => posix.normalize(file.replace(/\\/g, '/')).replace(/^\.\//, ''))
        .sort(),
    ),
  ]
}

function extractSection(content: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = content.match(
    new RegExp(`${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`),
  )

  return match?.[1] ?? ''
}

const templatePaths = [
  'docs/sparkle-suite/brand/templates/short-form-video-hooks.md',
  'docs/sparkle-suite/brand/templates/short-form-video-scripts.md',
  'docs/sparkle-suite/brand/templates/captions-and-ctas.md',
  'docs/sparkle-suite/brand/templates/newsletter-issues.md',
  'docs/sparkle-suite/brand/templates/email-and-sms.md',
  'docs/sparkle-suite/brand/templates/landing-page-sections.md',
] as const

const skillPath = '.agents/skills/sparkle-suite-master-brand/SKILL.md'
const shortFormBundle = [
  'playbooks/short-form-video.md',
  'templates/short-form-video-hooks.md',
  'templates/short-form-video-scripts.md',
  'templates/captions-and-ctas.md',
] as const

describe('Sparkle Suite master brand system', () => {
  it('contains the required core brand docs with critical language', () => {
    for (const file of coreDocPaths) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(true)
    }

    const index = read('docs/sparkle-suite/brand/00-master-index.md')
    expect(index).toContain("This is the operating system for Sparkle Suite's rep-facing master brand.")
    expect(index).toContain('Read `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md` together')
    expect(index).toContain('Use this index as the front door for current daily use across the checklist, playbooks, and templates.')
    expect(index).toContain('## Navigation map')
    expect(index).toContain('Final review pass: `04-brand-review-checklist.md`')
    expect(index).toContain('Public site version lock: `05-public-site-version-lock.md`')
    expect(index).toContain('Short-form video work: `playbooks/short-form-video.md`, `templates/short-form-video-hooks.md`, `templates/short-form-video-scripts.md`, and `templates/captions-and-ctas.md`')
    expect(index).toContain('Rep acquisition materials: `playbooks/rep-acquisition-materials.md`')
    expect(index).toContain('Sparkle Suite V1 Preview Public Site')
    expect(index).not.toContain('Later stages of this system add the review checklist, playbooks, and templates.')

    const brandSpec = read('docs/sparkle-suite/brand/01-master-brand-spec.md')
    expect(brandSpec).toContain(
      'A better customer experience starts with a better rep setup.',
    )
    expect(brandSpec).toContain('Sparkle Suite V1 Preview Public Site')
    expect(brandSpec).toContain('One easier home for your Bomb Party business.')
    expect(brandSpec).toContain('go ahead and polish this')
    expect(brandSpec).toContain('Trade board')
    expect(brandSpec).toContain('Live queue')
    expect(brandSpec).toContain('Live event calendar')
    expect(brandSpec).toContain('Email updates')
    expect(brandSpec).toContain('SMS updates')
    expect(brandSpec).toContain('Nic-Nac')
    expect(brandSpec).toContain('Reveal tools should not be used')
    expect(brandSpec).toContain('required companion docs')

    const messagingPillars = read('docs/sparkle-suite/brand/02-messaging-pillars.md')
    expect(messagingPillars).toContain('Stand out: Sparkle Suite gives reps an edge customers can feel.')
    expect(messagingPillars).toContain('Better customer experience: the customer side feels more polished, memorable, and easier to follow.')
    expect(messagingPillars).toContain('Do not sound like a generic SaaS product.')
    expect(messagingPillars).toContain('Do not use MLM-hype language.')

    const nicNac = read('docs/sparkle-suite/brand/03-nic-nac-positioning.md')
    expect(nicNac).toContain('built-in Sparkle Suite assistant')
    expect(nicNac).toContain('not a generic chatbot')
  })

  it('keeps the current core-doc contract explicit and internally consistent', () => {
    const index = read('docs/sparkle-suite/brand/00-master-index.md')
    const brandSpec = read('docs/sparkle-suite/brand/01-master-brand-spec.md')
    const messagingPillars = read('docs/sparkle-suite/brand/02-messaging-pillars.md')
    const nicNac = read('docs/sparkle-suite/brand/03-nic-nac-positioning.md')

    expect(index).toContain(
      'Treat those three files as the current required core set for Sparkle Suite brand decisions.',
    )
    expect(brandSpec).toContain(
      'This document is the master source of truth, but it is not meant to stand alone.',
    )
    expect(brandSpec).toContain(
      '`02-messaging-pillars.md` and `03-nic-nac-positioning.md` are required companion docs for applying this brand correctly.',
    )

    expect(extractMarkdownFileReferences(extractSection(index, '## Start here'))).toEqual([
      ...currentRequiredCoreDocs,
    ])
    expect(extractMarkdownFileReferences(brandSpec)).toEqual([
      '02-messaging-pillars.md',
      '03-nic-nac-positioning.md',
    ])
    expect(extractMarkdownFileReferences(messagingPillars)).toEqual([])
    expect(extractMarkdownFileReferences(nicNac)).toEqual([])

    for (const file of currentRequiredCoreDocs) {
      expect(
        existsSync(resolve(process.cwd(), `docs/sparkle-suite/brand/${file}`)),
        file,
      ).toBe(true)
    }
  })

  it('contains the required channel playbooks and review checklist', () => {
    const files = [
      'docs/sparkle-suite/brand/04-brand-review-checklist.md',
      'docs/sparkle-suite/brand/playbooks/homepage-and-signup.md',
      'docs/sparkle-suite/brand/playbooks/short-form-video.md',
      'docs/sparkle-suite/brand/playbooks/email-newsletter.md',
      'docs/sparkle-suite/brand/playbooks/email-and-sms.md',
      'docs/sparkle-suite/brand/playbooks/rep-acquisition-materials.md',
    ]

    for (const file of files) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(true)
    }

    const checklist = read('docs/sparkle-suite/brand/04-brand-review-checklist.md')
    expect(checklist).toContain('Read this with `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md`.')
    expect(checklist).toContain('Does this sound like Sparkle Suite?')
    expect(checklist).toContain('Does Nic-Nac feel useful instead of gimmicky?')
    expect(checklist).toContain('If this is email or SMS, are channel-specific compliance rules being respected?')

    const homepage = read('docs/sparkle-suite/brand/playbooks/homepage-and-signup.md')
    expect(homepage).toContain('Read this with `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md`.')
    expect(homepage).toContain('homepage copy')
    expect(homepage).toContain('future signup pages')
    expect(homepage).toContain('better customer experience')
    expect(homepage).toContain('approved feature claims only')
    expect(homepage).toContain('Sparkle Suite V1 Preview Public Site')
    expect(homepage).toContain('go ahead and polish this')
    expect(homepage).toContain('## Headline rules')
    expect(homepage).toContain('## Subheadline rules')
    expect(homepage).toContain('## Feature section rules')
    expect(homepage).toContain('## CTA rules')
    expect(homepage).toContain('## Signup trust rules')
    expect(homepage).toContain('## Login-link posture')
    expect(homepage).not.toContain('Bomb Party-led hero messaging')

    const shortForm = read('docs/sparkle-suite/brand/playbooks/short-form-video.md')
    expect(shortForm).toContain('Read this with `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md`.')
    expect(shortForm).toContain('TikTok')
    expect(shortForm).toContain('YouTube Shorts')
    expect(shortForm).toContain('15-second')
    expect(shortForm).toContain('30-second')
    expect(shortForm).toContain('feature spotlights')
    expect(shortForm).toContain('Nic-Nac explainers')
    expect(shortForm).toContain('## Hook formulas')
    expect(shortForm).toContain('## Talking-head structure')
    expect(shortForm).toContain('## B-roll structure')
    expect(shortForm).toContain('## Feature spotlight structure')
    expect(shortForm).toContain('## Waitlist push structure')
    expect(shortForm).toContain('## Nic-Nac explainer structure')

    const newsletter = read('docs/sparkle-suite/brand/playbooks/email-newsletter.md')
    expect(newsletter).toContain('Read this with `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md`.')
    expect(newsletter).toContain('one newsletter brand')
    expect(newsletter).toContain('lead nurture')
    expect(newsletter).toContain('rep education')
    expect(newsletter).toContain('segment value under the hood when needed')
    expect(newsletter).toContain('## Issue structure')

    const emailAndSms = read('docs/sparkle-suite/brand/playbooks/email-and-sms.md')
    expect(emailAndSms).toContain('Read this with `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md`.')
    expect(emailAndSms).toContain('launch updates')
    expect(emailAndSms).toContain('reminders')
    expect(emailAndSms).toContain('follow-ups')
    expect(emailAndSms).toContain('preserve compliance-sensitive language when required')
    expect(emailAndSms).toContain('message frequency may vary')
    expect(emailAndSms).toContain('message and data rates may apply')
    expect(emailAndSms).toContain('consent is not a condition of purchase')
    expect(emailAndSms).toContain('reply STOP to unsubscribe')
    expect(emailAndSms).toContain('reply HELP for help')
    expect(emailAndSms).toContain('wireless carriers are not liable for delayed or undelivered messages')
    expect(emailAndSms).toContain('SMS opt-in data is not sold, rented, traded, or shared for third-party marketing')
    expect(emailAndSms).toContain('email-specific compliance')

    const repAcquisition = read('docs/sparkle-suite/brand/playbooks/rep-acquisition-materials.md')
    expect(repAcquisition).toContain('Read this with `01-master-brand-spec.md`, `02-messaging-pillars.md`, and `03-nic-nac-positioning.md`.')
    expect(repAcquisition).toContain('rep advantage')
    expect(repAcquisition).toContain('better customer experience')
    expect(repAcquisition).toContain('edge customers can feel')
    expect(repAcquisition).toContain('smoother live shows')
    expect(repAcquisition).toContain('less patchwork')
    expect(repAcquisition).toContain('## Objection handling')
    expect(repAcquisition).toContain('## Product education blocks')
    expect(repAcquisition).not.toContain('customer wow factor')
    expect(repAcquisition).not.toMatch(/\bher\b/i)
  })

  it('contains the reusable template library', () => {
    for (const file of templatePaths) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(true)

      const template = read(file)
      expect(template).toContain('## Use this when')
      expect(template).toContain('## Goal')
      expect(template).toContain('## Inputs')
      expect(template).toContain('## Structure')
      expect(template).toContain('## What good finished output looks like')
      expect(template).toContain('## Brand mistakes to avoid')
    }

    const hooks = read('docs/sparkle-suite/brand/templates/short-form-video-hooks.md')
    expect(hooks).toContain('Short-form video is a primary Sparkle Suite brand channel.')
    expect(hooks).toContain('Hook 01')
    expect(hooks).toContain('Trade board')
    expect(hooks).toContain('edge customers can feel')

    const scripts = read('docs/sparkle-suite/brand/templates/short-form-video-scripts.md')
    expect(scripts).toContain('Short-form video is a primary Sparkle Suite brand channel.')
    expect(scripts).toContain('15-second script')
    expect(scripts).toContain('30-second script')
    expect(scripts).toContain('Live queue')
    expect(scripts).toContain('Nic-Nac')

    const captions = read('docs/sparkle-suite/brand/templates/captions-and-ctas.md')
    expect(captions).toContain('## Caption Template 01')
    expect(captions).toContain('join the waitlist')
    expect(captions).toContain('keep watching')
    expect(captions).toContain('learn what Sparkle Suite is building')

    const newsletter = read('docs/sparkle-suite/brand/templates/newsletter-issues.md')
    expect(newsletter).toContain('Newsletter is a primary Sparkle Suite brand channel.')
    expect(newsletter).toContain('Lead nurture')
    expect(newsletter).toContain('Rep education')
    expect(newsletter).toContain('one newsletter brand')
    expect(newsletter).toContain('Trade board')
    expect(newsletter).toContain('Live queue')
    expect(newsletter).toContain('Live event calendar')
    expect(newsletter).toContain('such as how Live queue or Email updates help reps stay more organized.')

    const emailAndSms = read('docs/sparkle-suite/brand/templates/email-and-sms.md')
    expect(emailAndSms).toContain('## Email Template 01')
    expect(emailAndSms).toContain('## SMS Template 01')
    expect(emailAndSms).toContain('## Mandatory SMS compliance lines')
    expect(emailAndSms).toContain('These lines are mandatory when the SMS draft requires compliance carry-forward.')
    expect(emailAndSms).toContain('message frequency may vary')
    expect(emailAndSms).toContain('message and data rates may apply')
    expect(emailAndSms).toContain('consent is not a condition of purchase')
    expect(emailAndSms).toContain('reply STOP to unsubscribe')
    expect(emailAndSms).toContain('reply HELP for help')
    expect(emailAndSms).toContain('wireless carriers are not liable for delayed or undelivered messages')
    expect(emailAndSms).toContain('SMS opt-in data is not sold, rented, traded, or shared for third-party marketing')

    const landingPage = read('docs/sparkle-suite/brand/templates/landing-page-sections.md')
    expect(landingPage).toContain('## Hero Section Template')
    expect(landingPage).toContain('Sparkle Suite V1 Preview Public Site')
    expect(landingPage).toContain(
      'A better customer experience starts with a better rep setup.',
    )
    expect(landingPage).toContain('What Is Sparkle Suite?')
    expect(landingPage).toContain('go ahead and polish this')
    expect(landingPage).toContain('approved feature claims')
    expect(landingPage).toContain('Feature card 4: `Email updates -')
    expect(landingPage).toContain('Feature card 5: `SMS updates -')
    expect(landingPage).not.toContain('Email updates and SMS updates')
    expect(landingPage).not.toContain('reveal tools')
  })

  it('contains a repo-local skill and daily-use index guidance for the brand system', () => {
    expect(existsSync(resolve(process.cwd(), skillPath)), skillPath).toBe(true)

    const skill = read(skillPath)
    expect(skill).toContain('name: sparkle-suite-master-brand')
    expect(skill).toContain('description: "Use when')
    expect(skill).toContain('## Required sources')
    expect(skill).toContain('docs/sparkle-suite/brand/00-master-index.md')
    expect(skill).toContain('docs/sparkle-suite/brand/01-master-brand-spec.md')
    expect(skill).toContain('docs/sparkle-suite/brand/02-messaging-pillars.md')
    expect(skill).toContain('docs/sparkle-suite/brand/03-nic-nac-positioning.md')
    expect(skill).toContain('docs/sparkle-suite/brand/playbooks/short-form-video.md')
    expect(skill).toContain('docs/sparkle-suite/brand/playbooks/email-newsletter.md')
    expect(skill).toContain('docs/sparkle-suite/brand/playbooks/rep-acquisition-materials.md')
    expect(skill).toContain('docs/sparkle-suite/brand/templates/short-form-video-hooks.md')
    expect(skill).toContain('docs/sparkle-suite/brand/templates/newsletter-issues.md')
    expect(skill).toContain('create mode')
    expect(skill).toContain('review mode')
    expect(skill).toContain('wrong domain entirely')
    expect(skill).toContain('jobs / installs / pipeline language')
    expect(skill).toContain('domain drift')
    expect(skill).toContain('generic SaaS copy')
    expect(skill).toContain('AI slop')
    expect(skill).toContain('overclaiming')
    expect(skill).toContain('off-brand Nic-Nac framing')
    expect(skill).toContain('not a generic chatbot')
    expect(skill).toContain('Sparkle Suite V1 Preview Public Site')
    expect(skill).toContain('dpl_2yAXz2pKp4QsJ4sQzboqpfXfqyoM')
    expect(skill).toContain('go ahead and polish this')

    const index = read('docs/sparkle-suite/brand/00-master-index.md')
    expect(index).toContain('## Daily use')
    expect(index).toContain('Use the `sparkle-suite-master-brand` skill before writing or reviewing rep-facing copy.')
    expect(index).toContain('Choose the matching playbook before drafting.')
    expect(index).toContain('Open the matching template before generating fresh copy.')
    expect(index).toContain('## Example prompts')
    expect(index).toContain('Use the Sparkle Suite master brand system to write 3 TikTok hooks for the Trade board.')
    expect(index).toContain('Draft a Sparkle Suite newsletter issue for lead nurture and rep education.')
    expect(index).toContain('Review this landing page section against the Sparkle Suite brand system.')
    expect(index).toContain('Review this Nic-Nac explainer for brand drift and overclaiming.')

    const expectedShortFormIndexLine = 'Short-form video work: `playbooks/short-form-video.md`, `templates/short-form-video-hooks.md`, `templates/short-form-video-scripts.md`, and `templates/captions-and-ctas.md`'
    expect(index).toContain(expectedShortFormIndexLine)

    for (const relativePath of shortFormBundle) {
      const docPath = `docs/sparkle-suite/brand/${relativePath}`
      expect(skill).toContain(docPath)
      expect(index).toContain(relativePath)
    }
  })
})
