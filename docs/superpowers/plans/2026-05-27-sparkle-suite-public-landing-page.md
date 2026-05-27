# Sparkle Suite Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the normal public Sparkle Suite landing page from the approved Concept 3 direction while keeping `/prelaunch` intact and avoiding live provider actions.

**Architecture:** Add a root public landing page at `app/page.tsx` backed by a typed content module and focused reusable React components. Keep styles namespaced under `.sparkle-landing` in `app/globals.css` so the existing prelaunch and Amethyst surfaces stay isolated. Use code-native product mockups first, with real screenshots as a later refinement path.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, global CSS, Vitest with `react-dom/server` render tests.

---

## File Structure

- Create `lib/sparkle-suite/public-landing-content.ts`
  - Owns all public landing page copy, section data, FAQ, product mini-screen labels, and banned/disclaimer strings.
  - Keeps copy testable outside React.

- Create `app/_components/sparkle-suite-public-landing.tsx`
  - Owns the full page composition and section components: header, hero, product cascade, comparison band, feature proof, customer path, rep relief, CTA, FAQ, footer.
  - Uses only code-native product mockups and approved copy from the content module.

- Modify `app/page.tsx`
  - Replace the `/prelaunch` redirect with the new public landing page.
  - Keep `/prelaunch` untouched.
  - Add metadata and JSON-LD for Sparkle Suite without using `Bomb Party` in title/hero/CTA copy.

- Modify `app/globals.css`
  - Add namespaced `.sparkle-landing` styles after the existing prelaunch block.
  - Reuse the existing Sparkle Suite token values.
  - Add responsive desktop/mobile layout and reduced-motion handling.

- Create `tests/sparkle-suite-public-landing.test.ts`
  - Static render tests for route/component output.
  - Copy safety tests: no fake jewelry, no `SS` mark, no `Bomb Party` in hero/title/CTA area, disclaimer present.
  - Section coverage tests for all seven sections.

---

### Task 1: Add Typed Landing Content

**Files:**
- Create: `lib/sparkle-suite/public-landing-content.ts`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write the failing content tests**

Add this file:

```ts
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SparkleSuitePublicLanding } from '@/app/_components/sparkle-suite-public-landing'
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'

function renderLanding() {
  return renderToStaticMarkup(createElement(SparkleSuitePublicLanding))
}

describe('Sparkle Suite public landing page', () => {
  it('defines the approved hero, CTA, and section copy', () => {
    expect(sparkleSuitePublicLandingContent.hero.headline).toBe(
      'Make your live-show customer experience feel more polished.',
    )
    expect(sparkleSuitePublicLandingContent.hero.primaryCta.label).toBe(
      'Get Sparkle Suite',
    )
    expect(sparkleSuitePublicLandingContent.hero.secondaryCta.label).toBe(
      'See What It Does',
    )
    expect(sparkleSuitePublicLandingContent.comparison.heading).toBe(
      'Less scattered. More polished.',
    )
    expect(sparkleSuitePublicLandingContent.features.items.map((item) => item.title)).toEqual([
      'Trade board',
      'Live queue',
      'Live event calendar',
      'Email updates',
      'SMS updates',
      'Nic-Nac',
    ])
  })

  it('renders every approved landing-page section', () => {
    const html = renderLanding()

    expect(html).toContain('Make your live-show customer experience feel more polished.')
    expect(html).toContain('Less scattered. More polished.')
    expect(html).toContain('The tools behind the smoother experience.')
    expect(html).toContain('Customers should know where to go.')
    expect(html).toContain('Less repeating. More selling.')
    expect(html).toContain('Ready to make your customer experience feel more polished?')
    expect(html).toContain('Is Sparkle Suite affiliated with Bomb Party?')
  })

  it('keeps the trademark and no-jewelry guardrails visible in rendered output', () => {
    const html = renderLanding()
    const heroEnd = html.indexOf('Less scattered. More polished.')
    const heroHtml = heroEnd > -1 ? html.slice(0, heroEnd) : html

    expect(sparkleSuitePublicLandingSafety.disclaimer).toBe(
      'Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
    )
    expect(html).toContain(sparkleSuitePublicLandingSafety.disclaimer)
    expect(heroHtml).not.toContain('Bomb Party')
    expect(heroHtml).not.toContain('BB business')
    expect(heroHtml).not.toContain('launch flow')
    expect(heroHtml).not.toContain('backend')
    expect(heroHtml).not.toContain('modules')
    expect(html).not.toContain('AI-powered platform')
    expect(html).not.toContain('ring photo')
    expect(html).not.toContain('gemstone')
    expect(html).not.toContain('jewelry image')
    expect(html).not.toContain('>SS<')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: FAIL because `app/_components/sparkle-suite-public-landing` and `lib/sparkle-suite/public-landing-content` do not exist.

- [ ] **Step 3: Add the content module**

Create `lib/sparkle-suite/public-landing-content.ts`:

```ts
export const sparkleSuitePublicLandingSafety = {
  disclaimer:
    'Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
  audienceClarifier:
    'Sparkle Suite provides websites and customer-experience tools for BP reps.',
} as const

export const sparkleSuitePublicLandingContent = {
  brand: 'Sparkle Suite',
  nav: {
    links: [
      { label: 'Tools', href: '#tools' },
      { label: 'Customers', href: '#customers' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  hero: {
    headline: 'Make your live-show customer experience feel more polished.',
    body:
      'Sparkle Suite gives your customers a beautiful place to find your shows, follow the queue, browse trades, get updates, and stay connected, while Nic-Nac helps you keep the setup moving inside Sparkle Suite.',
    primaryCta: { label: 'Get Sparkle Suite', href: '#pricing' },
    secondaryCta: { label: 'See What It Does', href: '#tools' },
    screens: [
      {
        id: 'site',
        title: 'Customer site',
        label: 'Live Thursday 8 PM',
        body: 'Shows, queue, trades, and updates in one polished place.',
      },
      {
        id: 'queue',
        title: 'Live queue',
        label: 'Now serving: Kayla',
        body: 'Up next: Amanda',
      },
      {
        id: 'trade',
        title: 'Trade board',
        label: 'Wants and haves',
        body: 'Cleaner trade requests without digging through messages.',
      },
      {
        id: 'calendar',
        title: 'Live event calendar',
        label: 'Next show saved',
        body: 'Show times and featured details are easier to find.',
      },
      {
        id: 'updates',
        title: 'Customer updates',
        label: 'Reminder sent',
        body: 'Email and SMS follow-through when visibility matters.',
      },
      {
        id: 'nic-nac',
        title: 'Nic-Nac',
        label: 'Ask Nic-Nac',
        body: 'Practical Sparkle Suite setup and how-to help.',
      },
    ],
  },
  comparison: {
    heading: 'Less scattered. More polished.',
    body:
      'Sparkle Suite gives customers one clearer place to follow what is happening, instead of piecing it together from old posts, comments, links, and messages.',
    beforeLabel: 'Before',
    before: [
      'Show details in posts',
      'Queue questions in comments',
      'Trade requests in messages',
      'Reminders handled by hand',
    ],
    afterLabel: 'With Sparkle Suite',
    after: [
      'Shows are easier to find',
      'The queue is easier to follow',
      'Trades have a cleaner home',
      'Updates feel more intentional',
    ],
  },
  features: {
    heading: 'The tools behind the smoother experience.',
    body:
      'Sparkle Suite is not just a prettier link page. It brings the customer-facing pieces of your live-show setup into one polished place.',
    items: [
      {
        title: 'Trade board',
        body:
          'Give trade requests a cleaner place to live so customers can browse wants, haves, and pending trades without digging through messages.',
      },
      {
        title: 'Live queue',
        body:
          'Help customers follow who is up now and who is coming next while your show keeps moving.',
      },
      {
        title: 'Live event calendar',
        body:
          'Make upcoming lives, featured details, and show times easier for customers to find.',
      },
      {
        title: 'Email updates',
        body:
          'Send clearer follow-through when customers need details after the live.',
      },
      {
        title: 'SMS updates',
        body:
          'Send timely reminders when visibility matters and social posts are not enough.',
      },
      {
        title: 'Nic-Nac',
        body:
          'Get practical setup and how-to help inside Sparkle Suite when you need it.',
      },
    ],
  },
  customers: {
    heading: 'Customers should know where to go.',
    body:
      'When the next show, queue, trades, and updates all have a cleaner home, the whole experience feels easier to follow.',
    steps: [
      'Find the next show',
      'Join or follow the queue',
      'Browse trades',
      'Get the update',
    ],
  },
  reps: {
    heading: 'Less repeating. More selling.',
    body:
      'Sparkle Suite does not run your business for you. It gives the repeat details a better place to live, so customers can find more answers without pulling you away from the show.',
    points: [
      {
        title: 'Fewer repeated questions',
        body: 'Show details, queue flow, and links are easier for customers to find.',
      },
      {
        title: 'Cleaner follow-through',
        body:
          'Email and SMS updates help important details leave the chat and reach customers directly.',
      },
      {
        title: 'Support when you need it',
        body:
          'Nic-Nac helps answer Sparkle Suite setup and how-to questions inside the workspace.',
      },
    ],
  },
  pricing: {
    heading: 'Ready to make your customer experience feel more polished?',
    body:
      'Get Sparkle Suite, accept the agreement during checkout, and finish setup inside Sparkle Suite with Nic-Nac there to help.',
    primaryCta: { label: 'Get Sparkle Suite', href: '/login' },
    note:
      'Checkout and setup access happen through your Sparkle Suite account. Stripe test mode is used for local and preview smoke tests.',
  },
  faq: [
    {
      question: 'What is Sparkle Suite?',
      answer:
        'Sparkle Suite gives reps a polished customer-facing site and live-show tools that help customers find shows, follow the queue, browse trades, get updates, and stay connected.',
    },
    {
      question: 'Who is it for?',
      answer:
        'Sparkle Suite is built for BP reps who want a cleaner customer experience and smoother live-show setup.',
    },
    {
      question: 'What happens after I purchase?',
      answer:
        'You get access to Sparkle Suite, receive your setup links, and use Nic-Nac and the help/how-to resources to finish setup.',
    },
    {
      question: 'Does Sparkle Suite replace the rep?',
      answer:
        'No. Sparkle Suite supports the customer experience and repeat details so reps can stay focused on their shows and customers.',
    },
    {
      question: 'Is Sparkle Suite affiliated with Bomb Party?',
      answer: sparkleSuitePublicLandingSafety.disclaimer,
    },
  ],
} as const
```

- [ ] **Step 4: Add a temporary component export so the test can compile**

Create `app/_components/sparkle-suite-public-landing.tsx` with a minimal semantic renderer:

```tsx
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'

export function SparkleSuitePublicLanding() {
  const { comparison, customers, faq, features, hero, pricing, reps } =
    sparkleSuitePublicLandingContent

  return (
    <main className="sparkle-landing">
      <section>
        <h1>{hero.headline}</h1>
        <p>{hero.body}</p>
        <a href={hero.primaryCta.href}>{hero.primaryCta.label}</a>
        <a href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>
      </section>
      <section>
        <h2>{comparison.heading}</h2>
        <p>{comparison.body}</p>
      </section>
      <section>
        <h2>{features.heading}</h2>
        <p>{features.body}</p>
        {features.items.map((feature) => (
          <article key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
      <section>
        <h2>{customers.heading}</h2>
        <p>{customers.body}</p>
      </section>
      <section>
        <h2>{reps.heading}</h2>
        <p>{reps.body}</p>
      </section>
      <section id="pricing">
        <h2>{pricing.heading}</h2>
        <p>{pricing.body}</p>
      </section>
      <section>
        {faq.map((item) => (
          <article key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </section>
      <footer>{sparkleSuitePublicLandingSafety.disclaimer}</footer>
    </main>
  )
}
```

- [ ] **Step 5: Run the test to confirm the content contract passes**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```powershell
git add lib/sparkle-suite/public-landing-content.ts app/_components/sparkle-suite-public-landing.tsx tests/sparkle-suite-public-landing.test.ts
git commit -m "test: add Sparkle Suite landing content contract"
```

---

### Task 2: Build The Page Components

**Files:**
- Modify: `app/_components/sparkle-suite-public-landing.tsx`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Replace the placeholder with the full component**

Replace `app/_components/sparkle-suite-public-landing.tsx` with:

```tsx
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'

type ProductScreen = (typeof sparkleSuitePublicLandingContent.hero.screens)[number]

function SparkleSeal({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        fill="#ffffff"
        r="30"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <text
        fill="currentColor"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="32"
        fontStyle="italic"
        fontWeight="500"
        textAnchor="middle"
        x="32"
        y="42"
      >
        S
      </text>
    </svg>
  )
}

function LandingButton({
  href,
  label,
  variant = 'primary',
}: {
  href: string
  label: string
  variant?: 'primary' | 'ghost'
}) {
  return (
    <a className={`sl-btn sl-btn--${variant}`} href={href}>
      {label}
      {variant === 'primary' ? (
        <span aria-hidden="true" className="sl-btn__arrow">
          -&gt;
        </span>
      ) : null}
    </a>
  )
}

function ProductMiniScreen({ screen, index }: { screen: ProductScreen; index: number }) {
  return (
    <article className={`sl-product-card sl-product-card--${screen.id}`}>
      <span className="sl-product-card__meta">{String(index + 1).padStart(2, '0')}</span>
      <h3>{screen.title}</h3>
      <p className="sl-product-card__label">{screen.label}</p>
      <p>{screen.body}</p>
    </article>
  )
}

function ProductScreenCascade() {
  return (
    <div className="sl-cascade" aria-label="Sparkle Suite product previews">
      <div className="sl-cascade__halo" />
      {sparkleSuitePublicLandingContent.hero.screens.map((screen, index) => (
        <ProductMiniScreen key={screen.id} index={index} screen={screen} />
      ))}
    </div>
  )
}

function LandingHeader() {
  return (
    <header className="sl-header">
      <a className="sl-brand" href="#top" aria-label="Sparkle Suite home">
        <SparkleSeal className="sl-brand__seal" />
        <span>{sparkleSuitePublicLandingContent.brand}</span>
      </a>
      <nav aria-label="Sparkle Suite landing page">
        {sparkleSuitePublicLandingContent.nav.links.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

function LandingHero() {
  const { hero } = sparkleSuitePublicLandingContent

  return (
    <section className="sl-hero" id="top">
      <div className="sl-hero__copy">
        <h1>{hero.headline}</h1>
        <p>{hero.body}</p>
        <div className="sl-actions">
          <LandingButton href={hero.primaryCta.href} label={hero.primaryCta.label} />
          <LandingButton
            href={hero.secondaryCta.href}
            label={hero.secondaryCta.label}
            variant="ghost"
          />
        </div>
      </div>
      <ProductScreenCascade />
    </section>
  )
}

function ComparisonBand() {
  const { comparison } = sparkleSuitePublicLandingContent

  return (
    <section className="sl-comparison" aria-labelledby="comparison-heading">
      <div className="sl-comparison__copy">
        <h2 id="comparison-heading">{comparison.heading}</h2>
        <p>{comparison.body}</p>
      </div>
      <div className="sl-comparison__grid">
        <article>
          <span>{comparison.beforeLabel}</span>
          <ul>
            {comparison.before.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="is-after">
          <span>{comparison.afterLabel}</span>
          <ul>
            {comparison.after.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

function FeatureProof() {
  const { features } = sparkleSuitePublicLandingContent

  return (
    <section className="sl-section sl-features" id="tools" aria-labelledby="features-heading">
      <div className="sl-section__head">
        <h2 id="features-heading">{features.heading}</h2>
        <p>{features.body}</p>
      </div>
      <div className="sl-feature-grid">
        {features.items.map((feature, index) => (
          <article className="sl-feature-card" key={feature.title}>
            <span className="sl-feature-card__num">{String(index + 1).padStart(2, '0')}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function CustomerPath() {
  const { customers } = sparkleSuitePublicLandingContent

  return (
    <section className="sl-section sl-customer-path" id="customers" aria-labelledby="customers-heading">
      <div className="sl-section__head">
        <h2 id="customers-heading">{customers.heading}</h2>
        <p>{customers.body}</p>
      </div>
      <ol className="sl-path">
        {customers.steps.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  )
}

function RepRelief() {
  const { reps } = sparkleSuitePublicLandingContent

  return (
    <section className="sl-section sl-rep-relief" aria-labelledby="rep-heading">
      <div>
        <h2 id="rep-heading">{reps.heading}</h2>
        <p>{reps.body}</p>
      </div>
      <div className="sl-relief-list">
        {reps.points.map((point) => (
          <article key={point.title}>
            <h3>{point.title}</h3>
            <p>{point.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function PricingCta() {
  const { pricing } = sparkleSuitePublicLandingContent

  return (
    <section className="sl-pricing" id="pricing" aria-labelledby="pricing-heading">
      <div>
        <h2 id="pricing-heading">{pricing.heading}</h2>
        <p>{pricing.body}</p>
        <p className="sl-pricing__note">{pricing.note}</p>
      </div>
      <LandingButton href={pricing.primaryCta.href} label={pricing.primaryCta.label} />
    </section>
  )
}

function LandingFaq() {
  return (
    <section className="sl-section sl-faq" id="faq" aria-labelledby="faq-heading">
      <div className="sl-section__head">
        <h2 id="faq-heading">Questions before you start?</h2>
        <p>{sparkleSuitePublicLandingSafety.audienceClarifier}</p>
      </div>
      <div className="sl-faq__list">
        {sparkleSuitePublicLandingContent.faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="sl-footer">
      <div className="sl-footer__brand">
        <SparkleSeal className="sl-footer__seal" />
        <span>{sparkleSuitePublicLandingContent.brand}</span>
      </div>
      <p>{sparkleSuitePublicLandingSafety.disclaimer}</p>
      <div className="sl-footer__links">
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-and-conditions">Terms and Conditions</a>
      </div>
    </footer>
  )
}

export function SparkleSuitePublicLanding() {
  return (
    <main className="sparkle-landing">
      <div className="sl-shell">
        <LandingHeader />
        <LandingHero />
        <ComparisonBand />
        <FeatureProof />
        <CustomerPath />
        <RepRelief />
        <PricingCta />
        <LandingFaq />
        <LandingFooter />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run the static render test**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit Task 2**

Run:

```powershell
git add app/_components/sparkle-suite-public-landing.tsx tests/sparkle-suite-public-landing.test.ts
git commit -m "feat: add Sparkle Suite landing page components"
```

---

### Task 3: Wire The Root Route

**Files:**
- Modify: `app/page.tsx`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Add route-level render expectations**

Append this test case to `tests/sparkle-suite-public-landing.test.ts`:

```ts
import HomePage, { metadata } from '@/app/page'

it('uses the normal public landing page at the root route', () => {
  const html = renderToStaticMarkup(createElement(HomePage))

  expect(metadata.title).toEqual({ absolute: 'Sparkle Suite' })
  expect(metadata.description).toContain('live-show customer experience')
  expect(metadata.alternates).toEqual({ canonical: '/' })
  expect(html).toContain('Make your live-show customer experience feel more polished.')
  expect(html).not.toContain('redirect')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: FAIL because `app/page.tsx` still redirects to `/prelaunch` and does not export landing metadata.

- [ ] **Step 3: Replace the root redirect with the landing page**

Replace `app/page.tsx` with:

```tsx
import type { Metadata } from 'next'

import { SparkleSuitePublicLanding } from './_components/sparkle-suite-public-landing'
import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'

export const metadata: Metadata = {
  title: {
    absolute: 'Sparkle Suite',
  },
  description:
    'Make your live-show customer experience feel more polished with Sparkle Suite.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sparkle Suite',
    description:
      'A polished customer-facing site and live-show tools for reps who want a cleaner customer experience.',
    url: '/',
    siteName: 'Sparkle Suite',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Sparkle Suite public landing page.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkle Suite',
    description:
      'Make your live-show customer experience feel more polished with Sparkle Suite.',
    images: [
      {
        url: '/opengraph-image',
        alt: 'Sparkle Suite public landing page.',
      },
    ],
  },
}

const sparkleSuiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.yoursparklesuite.com/#website',
      name: 'Sparkle Suite',
      url: 'https://www.yoursparklesuite.com/',
      description: metadata.description,
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.yoursparklesuite.com/#software',
      name: 'Sparkle Suite',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: sparkleSuitePublicLandingContent.hero.body,
      url: 'https://www.yoursparklesuite.com/',
      audience: {
        '@type': 'Audience',
        audienceType: 'BP reps',
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        url: 'https://www.yoursparklesuite.com/#pricing',
      },
      areaServed: {
        '@type': 'Country',
        name: 'United States',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.yoursparklesuite.com/#organization',
      name: 'Sparkle Suite',
      url: 'https://www.yoursparklesuite.com/',
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sparkleSuiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <SparkleSuitePublicLanding />
    </>
  )
}
```

- [ ] **Step 4: Run the route test**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Confirm `/prelaunch` remains separate**

Run:

```powershell
npm exec vitest run tests/prelaunch/prelaunch-page.test.ts
```

Expected: PASS. If it fails because pre-existing prelaunch copy changed before this plan, stop and inspect; this task should not modify `/prelaunch`.

- [ ] **Step 6: Commit Task 3**

Run:

```powershell
git add app/page.tsx tests/sparkle-suite-public-landing.test.ts
git commit -m "feat: route root to Sparkle Suite landing page"
```

---

### Task 4: Add The Namespaced Visual System

**Files:**
- Modify: `app/globals.css`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Add a CSS class expectation**

Append this assertion to the static render test that renders every approved section:

```ts
expect(html).toContain('class="sparkle-landing"')
expect(html).toContain('class="sl-cascade"')
expect(html).toContain('class="sl-comparison"')
```

- [ ] **Step 2: Add namespaced landing styles**

Append this CSS to `app/globals.css` after the existing prelaunch block and before unrelated Amethyst rules:

```css
.sparkle-landing {
  --sl-bg: var(--prelaunch-bg);
  --sl-bg-deep: var(--prelaunch-bg-deep);
  --sl-paper: var(--prelaunch-paper);
  --sl-paper-warm: var(--prelaunch-paper-warm);
  --sl-accent: var(--prelaunch-accent);
  --sl-accent-soft: var(--prelaunch-accent-soft);
  --sl-accent-line: var(--prelaunch-accent-line);
  --sl-ink: var(--prelaunch-ink);
  --sl-ink-2: var(--prelaunch-ink-2);
  --sl-ink-3: var(--prelaunch-ink-3);
  --sl-panel: var(--prelaunch-panel);
  --sl-panel-text: var(--prelaunch-panel-text);
  --sl-hairline: var(--prelaunch-hairline);
  background:
    linear-gradient(135deg, rgba(255, 246, 250, 0.92), rgba(252, 248, 246, 0.76) 46%, rgba(255, 255, 255, 0.92)),
    linear-gradient(180deg, #fffdfc 0%, var(--sl-bg) 42%, #fffdfc 100%);
  color: var(--sl-ink);
  font-family: var(--font-prelaunch-sans), Arial, Helvetica, sans-serif;
  min-height: 100vh;
  overflow: hidden;
}

.sparkle-landing .sl-shell {
  margin: 0 auto;
  max-width: 1240px;
  padding: 28px 32px 56px;
}

.sparkle-landing h1,
.sparkle-landing h2,
.sparkle-landing h3 {
  color: var(--sl-ink);
  font-family: var(--font-prelaunch-display), Georgia, serif;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.04;
  margin: 0;
  text-wrap: balance;
}

.sparkle-landing p {
  margin: 0;
}

.sparkle-landing .sl-header {
  align-items: center;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  margin-bottom: 54px;
}

.sparkle-landing .sl-brand {
  align-items: center;
  color: var(--sl-ink);
  display: flex;
  font-family: var(--font-prelaunch-display), Georgia, serif;
  font-size: 23px;
  gap: 12px;
  text-decoration: none;
}

.sparkle-landing .sl-brand__seal,
.sparkle-landing .sl-footer__seal {
  color: var(--sl-accent);
  height: 38px;
  width: 38px;
}

.sparkle-landing .sl-header nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.sparkle-landing .sl-header nav a,
.sparkle-landing .sl-footer__links a {
  color: var(--sl-ink-2);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.sparkle-landing .sl-hero {
  align-items: center;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 0.86fr) minmax(520px, 1.14fr);
  min-height: calc(100vh - 132px);
  padding-bottom: 48px;
}

.sparkle-landing .sl-hero__copy h1 {
  font-size: 82px;
  max-width: 670px;
}

.sparkle-landing .sl-hero__copy p {
  color: var(--sl-ink-2);
  font-size: 18px;
  line-height: 1.65;
  margin-top: 24px;
  max-width: 590px;
}

.sparkle-landing .sl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.sparkle-landing .sl-btn {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  display: inline-flex;
  font-size: 14px;
  font-weight: 800;
  gap: 10px;
  justify-content: center;
  letter-spacing: 0;
  min-height: 52px;
  padding: 0 24px;
  text-decoration: none;
  transition:
    transform 0.16s,
    box-shadow 0.2s,
    border-color 0.2s;
  white-space: nowrap;
}

.sparkle-landing .sl-btn:hover {
  transform: translateY(-1px);
}

.sparkle-landing .sl-btn--primary {
  background: linear-gradient(#ff4cae 0%, #d81b87 100%);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.36),
    0 16px 34px rgba(238, 44, 155, 0.28);
  color: #fff6fb;
}

.sparkle-landing .sl-btn--ghost {
  background: rgba(255, 255, 255, 0.78);
  border-color: var(--sl-hairline);
  color: var(--sl-ink);
}

.sparkle-landing .sl-cascade {
  min-height: 640px;
  position: relative;
}

.sparkle-landing .sl-cascade__halo {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(255, 246, 250, 0.5) 48%, rgba(246, 237, 232, 0.32));
  border: 1px solid rgba(238, 44, 155, 0.12);
  border-radius: 16px;
  inset: 36px 38px 38px 42px;
  position: absolute;
}

.sparkle-landing .sl-product-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--sl-accent-line);
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(64, 41, 36, 0.14);
  padding: 20px;
  position: absolute;
  transition: transform 0.2s;
  width: 250px;
}

.sparkle-landing .sl-product-card:hover {
  transform: translateY(-4px);
}

.sparkle-landing .sl-product-card--site {
  left: 124px;
  min-height: 300px;
  top: 112px;
  width: 330px;
}

.sparkle-landing .sl-product-card--queue {
  right: 16px;
  top: 54px;
}

.sparkle-landing .sl-product-card--trade {
  left: 10px;
  top: 36px;
}

.sparkle-landing .sl-product-card--calendar {
  right: 0;
  top: 238px;
}

.sparkle-landing .sl-product-card--updates {
  bottom: 52px;
  left: 48px;
}

.sparkle-landing .sl-product-card--nic-nac {
  bottom: 28px;
  right: 86px;
}

.sparkle-landing .sl-product-card__meta,
.sparkle-landing .sl-feature-card__num {
  color: var(--sl-accent);
  display: block;
  font-family: var(--font-prelaunch-display), Georgia, serif;
  font-size: 16px;
  font-style: italic;
  margin-bottom: 16px;
}

.sparkle-landing .sl-product-card h3,
.sparkle-landing .sl-feature-card h3,
.sparkle-landing .sl-relief-list h3 {
  font-size: 24px;
}

.sparkle-landing .sl-product-card p,
.sparkle-landing .sl-feature-card p,
.sparkle-landing .sl-relief-list p,
.sparkle-landing .sl-faq p {
  color: var(--sl-ink-2);
  font-size: 14px;
  line-height: 1.55;
  margin-top: 8px;
}

.sparkle-landing .sl-product-card__label {
  color: var(--sl-accent);
  font-weight: 800;
}

.sparkle-landing .sl-comparison {
  background: var(--sl-panel);
  border-radius: 16px;
  color: var(--sl-panel-text);
  display: grid;
  gap: 42px;
  grid-template-columns: minmax(0, 0.8fr) minmax(420px, 1.2fr);
  margin: 36px 0 96px;
  padding: 56px;
}

.sparkle-landing .sl-comparison h2,
.sparkle-landing .sl-rep-relief h2 {
  color: #fff2ea;
  font-size: 56px;
}

.sparkle-landing .sl-comparison p,
.sparkle-landing .sl-rep-relief > div > p {
  color: rgba(246, 231, 218, 0.78);
  font-size: 17px;
  line-height: 1.65;
  margin-top: 18px;
}

.sparkle-landing .sl-comparison__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.sparkle-landing .sl-comparison article,
.sparkle-landing .sl-relief-list article {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(246, 231, 218, 0.14);
  border-radius: 8px;
  padding: 22px;
}

.sparkle-landing .sl-comparison article.is-after {
  background: rgba(255, 246, 250, 0.12);
  border-color: rgba(255, 212, 234, 0.38);
}

.sparkle-landing .sl-comparison span {
  color: var(--sl-accent-soft);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sparkle-landing .sl-comparison ul {
  display: grid;
  gap: 12px;
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
}

.sparkle-landing .sl-comparison li {
  color: rgba(246, 231, 218, 0.82);
  font-size: 14px;
  line-height: 1.45;
}

.sparkle-landing .sl-section {
  padding: 92px 0;
}

.sparkle-landing .sl-section__head {
  align-items: end;
  display: flex;
  gap: 32px;
  justify-content: space-between;
  margin-bottom: 34px;
}

.sparkle-landing .sl-section__head h2,
.sparkle-landing .sl-pricing h2 {
  font-size: 52px;
  max-width: 720px;
}

.sparkle-landing .sl-section__head p,
.sparkle-landing .sl-pricing p,
.sparkle-landing .sl-rep-relief > div > p {
  color: var(--sl-ink-2);
  font-size: 17px;
  line-height: 1.65;
  max-width: 470px;
}

.sparkle-landing .sl-feature-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, 1fr);
}

.sparkle-landing .sl-feature-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--sl-accent-line);
  border-radius: 8px;
  padding: 26px;
}

.sparkle-landing .sl-path {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, 1fr);
  list-style: none;
  margin: 0;
  padding: 0;
}

.sparkle-landing .sl-path li {
  background: var(--sl-paper);
  border: 1px solid var(--sl-hairline);
  border-radius: 8px;
  color: var(--sl-ink);
  font-family: var(--font-prelaunch-display), Georgia, serif;
  font-size: 22px;
  line-height: 1.18;
  min-height: 150px;
  padding: 24px;
}

.sparkle-landing .sl-path span {
  color: var(--sl-accent);
  display: block;
  font-size: 15px;
  margin-bottom: 38px;
}

.sparkle-landing .sl-rep-relief {
  background: var(--sl-panel);
  border-radius: 16px;
  display: grid;
  gap: 36px;
  grid-template-columns: 0.86fr 1.14fr;
  margin: 80px 0;
  padding: 56px;
}

.sparkle-landing .sl-relief-list {
  display: grid;
  gap: 14px;
}

.sparkle-landing .sl-relief-list h3,
.sparkle-landing .sl-relief-list p {
  color: #fff2ea;
}

.sparkle-landing .sl-relief-list p {
  color: rgba(246, 231, 218, 0.76);
}

.sparkle-landing .sl-pricing {
  align-items: center;
  background: var(--sl-paper);
  border: 1px solid var(--sl-hairline);
  border-radius: 16px;
  display: flex;
  gap: 28px;
  justify-content: space-between;
  margin: 80px 0;
  padding: 42px;
}

.sparkle-landing .sl-pricing__note {
  color: var(--sl-ink-3);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 16px;
}

.sparkle-landing .sl-faq__list {
  display: grid;
  gap: 12px;
}

.sparkle-landing .sl-faq details {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--sl-hairline);
  border-radius: 8px;
  padding: 18px 20px;
}

.sparkle-landing .sl-faq summary {
  color: var(--sl-ink);
  cursor: pointer;
  font-weight: 800;
}

.sparkle-landing .sl-footer {
  border-top: 1px solid var(--sl-hairline);
  color: var(--sl-ink-3);
  display: grid;
  gap: 18px;
  padding: 40px 0 24px;
}

.sparkle-landing .sl-footer__brand {
  align-items: center;
  color: var(--sl-ink);
  display: flex;
  font-family: var(--font-prelaunch-display), Georgia, serif;
  font-size: 20px;
  gap: 10px;
}

.sparkle-landing .sl-footer p {
  color: var(--sl-ink-3);
  font-size: 12px;
  line-height: 1.55;
  max-width: 760px;
}

.sparkle-landing .sl-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

@media (max-width: 980px) {
  .sparkle-landing .sl-shell {
    padding: 24px 22px 44px;
  }

  .sparkle-landing .sl-hero,
  .sparkle-landing .sl-comparison,
  .sparkle-landing .sl-rep-relief {
    grid-template-columns: 1fr;
  }

  .sparkle-landing .sl-hero {
    min-height: auto;
  }

  .sparkle-landing .sl-cascade {
    min-height: 620px;
  }

  .sparkle-landing .sl-section__head,
  .sparkle-landing .sl-pricing {
    align-items: flex-start;
    flex-direction: column;
  }

  .sparkle-landing .sl-feature-grid,
  .sparkle-landing .sl-path {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .sparkle-landing .sl-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sparkle-landing .sl-hero__copy h1 {
    font-size: 46px;
  }

  .sparkle-landing .sl-cascade {
    display: grid;
    gap: 12px;
    min-height: auto;
  }

  .sparkle-landing .sl-cascade__halo {
    display: none;
  }

  .sparkle-landing .sl-product-card,
  .sparkle-landing .sl-product-card--site,
  .sparkle-landing .sl-product-card--queue,
  .sparkle-landing .sl-product-card--trade,
  .sparkle-landing .sl-product-card--calendar,
  .sparkle-landing .sl-product-card--updates,
  .sparkle-landing .sl-product-card--nic-nac {
    inset: auto;
    min-height: auto;
    position: relative;
    width: auto;
  }

  .sparkle-landing .sl-comparison,
  .sparkle-landing .sl-rep-relief,
  .sparkle-landing .sl-pricing {
    border-radius: 12px;
    padding: 30px 22px;
  }

  .sparkle-landing .sl-comparison__grid,
  .sparkle-landing .sl-feature-grid,
  .sparkle-landing .sl-path {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sparkle-landing *,
  .sparkle-landing *::before,
  .sparkle-landing *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Run static tests**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts tests/prelaunch/prelaunch-page.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run TypeScript**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

Run:

```powershell
git add app/globals.css tests/sparkle-suite-public-landing.test.ts
git commit -m "style: add Sparkle Suite public landing page visuals"
```

---

### Task 5: Browser Verify Desktop And Mobile

**Files:**
- No required source edits unless verification finds issues.
- Possible modify: `app/globals.css`
- Possible modify: `app/_components/sparkle-suite-public-landing.tsx`

- [ ] **Step 1: Run the build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 2: Start the local dev server**

Run:

```powershell
npm run dev
```

Expected: server starts on an available local port. If port 3000 is occupied, use `npm run dev -- --port 3001` or another open port.

- [ ] **Step 3: Open the page in Browser**

Use Browser/IAB to open:

```text
http://localhost:3000/
```

Expected:

- root route shows the Sparkle Suite public landing page
- `/prelaunch` still shows the existing prelaunch page

- [ ] **Step 4: Desktop visual smoke**

Check:

- hero headline is visible without overlap
- product cascade is visible and does not use jewelry imagery
- dark comparison band peeks below first viewport on a normal desktop viewport
- primary CTA points to `#pricing`
- secondary CTA points to `#tools`
- no `Bomb Party` appears in the hero/title/CTA area

- [ ] **Step 5: Mobile visual smoke**

Use a mobile viewport around 390px wide.

Check:

- nav wraps cleanly
- hero text fits
- product cards stack cleanly
- comparison band does not overflow
- feature cards, path cards, pricing CTA, and FAQ remain readable

- [ ] **Step 6: Fix any visual issues**

If text overlaps, cards overflow, or mobile layout feels unprofessional, patch only:

- `app/globals.css`
- `app/_components/sparkle-suite-public-landing.tsx`

Then rerun:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
npx tsc --noEmit --pretty false
npm run build
```

Expected: all PASS.

- [ ] **Step 7: Commit Task 5**

Run:

```powershell
git add app/globals.css app/_components/sparkle-suite-public-landing.tsx
git commit -m "fix: polish Sparkle Suite landing page responsive render"
```

If no source changes were needed after verification, skip this commit and record that browser verification passed without additional edits.

---

### Task 6: Final Review And Handoff

**Files:**
- No source edits unless final review finds issues.

- [ ] **Step 1: Run final focused tests**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts tests/prelaunch/prelaunch-page.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-sparkle-suite-pricing.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Confirm git state**

Run:

```powershell
git status --short
```

Expected: only `docs/sparkle-suite/marketing/` remains untracked unless new intentional changes are staged/committed.

- [ ] **Step 5: Report the handoff clearly**

Final response should include:

- root route built locally, `/prelaunch` preserved
- tests/build run and pass/fail status
- any browser visual issues fixed
- reminder that production deploy is a separate approval step
- reminder that no live provider action was taken

---

## Self-Review

- Spec coverage: hero, comparison band, product proof, customer path, rep relief, pricing CTA, FAQ/disclaimer, trademark posture, no-jewelry rule, `/prelaunch` preservation, and verification are all represented in tasks.
- Placeholder scan: no unfilled placeholder instructions remain.
- Type consistency: `sparkleSuitePublicLandingContent`, `sparkleSuitePublicLandingSafety`, `SparkleSuitePublicLanding`, and all component names are used consistently.
- Guardrails: no edits to `chrome-extension/content.js`, `supabase/functions/live-queue-sync`, or `docs/sparkle-suite/marketing/`.
