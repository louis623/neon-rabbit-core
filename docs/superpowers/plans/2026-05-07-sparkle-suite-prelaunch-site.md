# Sparkle Suite Pre-Launch Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current root-page Amethyst redirect with a standalone Sparkle Suite pre-launch homepage that matches the approved brand direction, captures a qualified waitlist, and preserves the in-progress Amethyst template surfaces behind dedicated routes.

**Architecture:** Keep the pre-launch site in the main Next.js app so `yoursparklesuite.com` can evolve in place. Reuse the existing Supabase/admin service patterns and consent-handling approach where it helps, but add a dedicated pre-launch waitlist path and dedicated Supabase table so the waitlist is not confused with live rep customer marketing lists. Preserve Amethyst as a separate preview surface instead of the root experience.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, Tailwind CSS 4, Supabase SSR/admin clients, Vitest, existing service-layer patterns in `lib/services/`.

---

## File Structure Map

**Create:**

- `app/api/prelaunch/waitlist/route.ts` - public POST endpoint for Sparkle Suite waitlist submissions
- `app/prelaunch/_components/PrelaunchHero.tsx` - hero section with primary/secondary CTA and brand framing
- `app/prelaunch/_components/PrelaunchVideoSection.tsx` - guided-video slot with graceful copy fallback
- `app/prelaunch/_components/PrelaunchBenefits.tsx` - "what Sparkle Suite will help with" benefit cards
- `app/prelaunch/_components/PrelaunchAudience.tsx` - "who it's for" qualifier section
- `app/prelaunch/_components/PrelaunchWaitlistForm.tsx` - client form with submit state and confirmation state
- `app/prelaunch/_components/PrelaunchFooter.tsx` - calm credibility close and footer links
- `app/prelaunch/page.tsx` - server entrypoint for the branded pre-launch homepage
- `lib/prelaunch/content.ts` - approved copy, palette values, logo-mark metadata, and video config in one place
- `lib/prelaunch/waitlist.ts` - server-side waitlist insert helper and validation entrypoint
- `supabase/migrations/040_prelaunch_waitlist.sql` - dedicated pre-launch waitlist table for standalone lead capture
- `tests/prelaunch/prelaunch-page.test.ts` - static render test for approved homepage structure
- `tests/prelaunch/prelaunch-waitlist-route.test.ts` - route tests for success/failure/validation branches
- `tests/prelaunch/prelaunch-waitlist-service.test.ts` - waitlist service tests

**Modify:**

- `app/page.tsx` - stop redirecting `/` to the Amethyst prototype; render or redirect to the new pre-launch page
- `app/layout.tsx` - update metadata from Amethyst-template defaults to Sparkle Suite pre-launch defaults
- `app/globals.css` - add Velvet Concierge tokens/utilities without breaking Amethyst styles
- `lib/services/types.ts` - add pre-launch waitlist input/result types if shared typing belongs here
- `lib/services/errors.ts` - reuse existing service error conventions for waitlist validation failures
- `app/amethyst/homepage.html` and related preview links only if needed to keep direct preview URLs discoverable after root-route removal

**Reference / Read Before Implementing:**

- `docs/superpowers/specs/2026-05-07-sparkle-suite-prelaunch-site-design.md`
- `app/api/amethyst/customer-audience/route.ts`
- `lib/services/customer-audience.ts`
- `components/amethyst/amethyst-homepage.tsx`
- `node_modules/next/dist/docs/` relevant App Router and Route Handler guidance before coding

---

### Task 1: Repoint The Public Entry And Lock Shared Brand Defaults

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Test: `tests/prelaunch/prelaunch-page.test.ts`

- [ ] **Step 1: Write the failing render test for the new public entrypoint**

```ts
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PrelaunchPage from '@/app/prelaunch/page'

describe('Sparkle Suite prelaunch page', () => {
  it('renders the approved coming-soon homepage shell', async () => {
    const html = renderToStaticMarkup(await PrelaunchPage())

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Coming Soon')
    expect(html).toContain('One easier home for your Bomb Party business.')
    expect(html).toContain('Join the Waitlist')
    expect(html).toContain('What Is Sparkle Suite?')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts`

Expected: FAIL with module-not-found for `@/app/prelaunch/page` or missing assertions because the page does not exist yet.

- [ ] **Step 3: Add the new root-page handoff and metadata**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/prelaunch')
}
```

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Sparkle Suite | Coming Soon',
  description:
    'A polished, easier online home for Bomb Party reps. Join the waitlist for launch updates.',
}
```

```css
/* app/globals.css */
:root {
  --prelaunch-rose-veil: #f7d7e7;
  --prelaunch-lilac-glow: #e8ddff;
  --prelaunch-pearl-blush: #fff4f8;
  --prelaunch-plum-ink: #5a345c;
  --prelaunch-soft-gold: #f3cfa8;
}
```

- [ ] **Step 4: Add the minimal prelaunch page shell**

```tsx
// app/prelaunch/page.tsx
export default function PrelaunchPage() {
  return (
    <main>
      <section>
        <p>Coming Soon</p>
        <h1>One easier home for your Bomb Party business.</h1>
        <a href="#waitlist">Join the Waitlist</a>
        <a href="#video">What Is Sparkle Suite?</a>
      </section>
    </main>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css app/prelaunch/page.tsx tests/prelaunch/prelaunch-page.test.ts
git commit -m "feat: repoint root route to Sparkle Suite prelaunch shell"
```

### Task 2: Build The Velvet Concierge Homepage Sections

**Files:**
- Create: `app/prelaunch/_components/PrelaunchHero.tsx`
- Create: `app/prelaunch/_components/PrelaunchVideoSection.tsx`
- Create: `app/prelaunch/_components/PrelaunchBenefits.tsx`
- Create: `app/prelaunch/_components/PrelaunchAudience.tsx`
- Create: `app/prelaunch/_components/PrelaunchFooter.tsx`
- Create: `lib/prelaunch/content.ts`
- Modify: `app/prelaunch/page.tsx`
- Test: `tests/prelaunch/prelaunch-page.test.ts`

- [ ] **Step 1: Expand the failing page test to assert the approved sections**

```ts
expect(html).toContain('A polished website and rep-friendly tools')
expect(html).toContain('Watch the guided walkthrough')
expect(html).toContain('Look more professional online')
expect(html).toContain('Independent Bomb Party reps')
expect(html).toContain('We&#39;re building this carefully.')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts`

Expected: FAIL on missing section copy.

- [ ] **Step 3: Add centralized approved content**

```ts
// lib/prelaunch/content.ts
export const prelaunchContent = {
  eyebrow: 'Coming Soon',
  headline: 'One easier home for your Bomb Party business.',
  body:
    'A polished website and rep-friendly tools designed to help you look professional, stay organized, and feel less overwhelmed online.',
  benefits: [
    'Look more professional online',
    'Stop relying on scattered links and social-media chaos',
    'Make it easier for customers to find your shows and updates',
    'Get a calmer, more organized home base',
  ],
}
```

- [ ] **Step 4: Build the hero and supporting sections**

```tsx
// app/prelaunch/_components/PrelaunchHero.tsx
import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchHero() {
  return (
    <section className="bg-[var(--prelaunch-pearl-blush)]">
      <p>{prelaunchContent.eyebrow}</p>
      <h1>{prelaunchContent.headline}</h1>
      <p>{prelaunchContent.body}</p>
      <a href="#waitlist">Join the Waitlist</a>
      <a href="#video">What Is Sparkle Suite?</a>
    </section>
  )
}
```

```tsx
// app/prelaunch/_components/PrelaunchVideoSection.tsx
export function PrelaunchVideoSection() {
  return (
    <section id="video">
      <h2>Watch the guided walkthrough</h2>
      <p>
        We&apos;ll explain the problem reps are living in now and preview the calmer,
        more polished experience Sparkle Suite is being built to provide.
      </p>
      <div data-video-slot="guided-walkthrough">Guided walkthrough frame</div>
    </section>
  )
}
```

- [ ] **Step 5: Compose the sections into `app/prelaunch/page.tsx`**

```tsx
import { PrelaunchAudience } from './_components/PrelaunchAudience'
import { PrelaunchBenefits } from './_components/PrelaunchBenefits'
import { PrelaunchFooter } from './_components/PrelaunchFooter'
import { PrelaunchHero } from './_components/PrelaunchHero'
import { PrelaunchVideoSection } from './_components/PrelaunchVideoSection'
import { PrelaunchWaitlistForm } from './_components/PrelaunchWaitlistForm'

export default function PrelaunchPage() {
  return (
    <main>
      <PrelaunchHero />
      <PrelaunchVideoSection />
      <PrelaunchBenefits />
      <PrelaunchAudience />
      <PrelaunchWaitlistForm />
      <PrelaunchFooter />
    </main>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/prelaunch/_components app/prelaunch/page.tsx lib/prelaunch/content.ts tests/prelaunch/prelaunch-page.test.ts
git commit -m "feat: build Sparkle Suite prelaunch content sections"
```

### Task 3: Add A Dedicated Prelaunch Waitlist Service And Route

**Files:**
- Create: `lib/prelaunch/waitlist.ts`
- Create: `app/api/prelaunch/waitlist/route.ts`
- Create: `supabase/migrations/040_prelaunch_waitlist.sql`
- Modify: `lib/services/types.ts`
- Test: `tests/prelaunch/prelaunch-waitlist-service.test.ts`
- Test: `tests/prelaunch/prelaunch-waitlist-route.test.ts`

- [ ] **Step 1: Write the failing waitlist service tests**

```ts
import { describe, expect, it } from 'vitest'
import { validatePrelaunchWaitlistInput } from '@/lib/prelaunch/waitlist'

describe('validatePrelaunchWaitlistInput', () => {
  it('accepts the approved fields', () => {
    const result = validatePrelaunchWaitlistInput({
      name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '(303) 555-0123',
      tiktokHandle: '@jamieh',
      teamRepName: 'Lindsey',
    })

    expect(result.email).toBe('jamie@example.com')
    expect(result.tiktokHandle).toBe('@jamieh')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm exec vitest run tests/prelaunch/prelaunch-waitlist-service.test.ts tests/prelaunch/prelaunch-waitlist-route.test.ts`

Expected: FAIL because the service and route do not exist yet.

- [ ] **Step 3: Add shared waitlist types**

```ts
// lib/services/types.ts
export type PrelaunchWaitlistInput = {
  name: string
  email: string
  phone: string
  tiktokHandle: string
  teamRepName: string
  setupPain?: string
  smsConsent: boolean
  emailConsent: boolean
}
```

- [ ] **Step 4: Add the dedicated waitlist table migration**

```sql
-- supabase/migrations/040_prelaunch_waitlist.sql
create table sparkle_suite_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  tiktok_handle text not null,
  team_rep_name text not null,
  setup_pain text,
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  lead_status text not null default 'new',
  source text not null default 'prelaunch_site',
  created_at timestamptz not null default now()
);

create index idx_sparkle_suite_waitlist_created_at
  on sparkle_suite_waitlist(created_at desc);
```

- [ ] **Step 5: Implement the waitlist helper with validation**

```ts
// lib/prelaunch/waitlist.ts
import { errors } from '@/lib/services/errors'
import type { PrelaunchWaitlistInput } from '@/lib/services/types'

export function validatePrelaunchWaitlistInput(input: PrelaunchWaitlistInput) {
  if (!input.name.trim()) throw errors.INVALID_INPUT('name required', 'Name is required.')
  if (!input.email.trim()) throw errors.INVALID_INPUT('email required', 'Email is required.')
  if (!input.phone.trim()) throw errors.INVALID_INPUT('phone required', 'Phone is required.')
  if (!input.tiktokHandle.trim()) throw errors.INVALID_INPUT('tiktok required', 'TikTok handle is required.')
  if (!input.teamRepName.trim()) throw errors.INVALID_INPUT('team rep required', 'Team rep name is required.')
  if (!input.smsConsent) throw errors.INVALID_INPUT('sms consent required', 'SMS consent is required.')
  if (!input.emailConsent) throw errors.INVALID_INPUT('email consent required', 'Email consent is required.')

  return {
    fullName: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    tiktokHandle: input.tiktokHandle.trim(),
    teamRepName: input.teamRepName.trim(),
    setupPain: input.setupPain?.trim() || null,
    smsConsent: input.smsConsent,
    emailConsent: input.emailConsent,
  }
}
```

- [ ] **Step 6: Implement the route using the existing admin-client pattern**

```ts
// app/api/prelaunch/waitlist/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePrelaunchWaitlistInput } from '@/lib/prelaunch/waitlist'

export async function POST(request: Request) {
  const payload = validatePrelaunchWaitlistInput(await request.json())
  const admin = createAdminClient()

  await admin.from('sparkle_suite_waitlist').insert({
    full_name: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    email_consent: true,
    sms_consent: true,
    tiktok_handle: payload.tiktokHandle,
    team_rep_name: payload.teamRepName,
    setup_pain: payload.setupPain,
    source: 'prelaunch_site',
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm exec vitest run tests/prelaunch/prelaunch-waitlist-service.test.ts tests/prelaunch/prelaunch-waitlist-route.test.ts`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/040_prelaunch_waitlist.sql lib/prelaunch/waitlist.ts app/api/prelaunch/waitlist/route.ts lib/services/types.ts tests/prelaunch/prelaunch-waitlist-service.test.ts tests/prelaunch/prelaunch-waitlist-route.test.ts
git commit -m "feat: add Sparkle Suite prelaunch waitlist endpoint"
```

### Task 4: Wire The Waitlist Form Client Experience

**Files:**
- Create: `app/prelaunch/_components/PrelaunchWaitlistForm.tsx`
- Modify: `app/prelaunch/page.tsx`
- Test: `tests/prelaunch/prelaunch-page.test.ts`

- [ ] **Step 1: Extend the page test for approved form fields and confirmation copy**

```ts
expect(html).toContain('Name')
expect(html).toContain('Email')
expect(html).toContain('Phone')
expect(html).toContain('TikTok handle')
expect(html).toContain('Team rep name')
expect(html).toContain('I agree to get launch updates by text')
expect(html).toContain('I agree to get launch updates by email')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts`

Expected: FAIL because the form component is not present yet.

- [ ] **Step 3: Build the client form component**

```tsx
// app/prelaunch/_components/PrelaunchWaitlistForm.tsx
'use client'

import { useState } from 'react'

export function PrelaunchWaitlistForm() {
  const [done, setDone] = useState(false)

  if (done) {
    return <p>You&apos;re on the list. We&apos;ll reach out by email and text when Sparkle Suite is ready.</p>
  }

  return (
    <form
      id="waitlist"
      onSubmit={async (event) => {
        event.preventDefault()
        setDone(true)
      }}
    >
      <label>Name<input name="name" /></label>
      <label>Email<input name="email" type="email" /></label>
      <label>Phone<input name="phone" type="tel" /></label>
      <label>TikTok handle<input name="tiktokHandle" /></label>
      <label>Team rep name<input name="teamRepName" /></label>
      <label>What&apos;s the hardest part of your online setup right now?<textarea name="setupPain" /></label>
      <label><input name="smsConsent" type="checkbox" />I agree to get launch updates by text.</label>
      <label><input name="emailConsent" type="checkbox" />I agree to get launch updates by email.</label>
      <button type="submit">Join the Waitlist</button>
    </form>
  )
}
```

- [ ] **Step 4: Replace the optimistic submit stub with a real POST**

```tsx
const response = await fetch('/api/prelaunch/waitlist', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name,
    email,
    phone,
    tiktokHandle,
    teamRepName,
    setupPain,
    smsConsent,
    emailConsent,
  }),
})

if (!response.ok) throw new Error('Waitlist signup failed.')
setDone(true)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/prelaunch/_components/PrelaunchWaitlistForm.tsx app/prelaunch/page.tsx tests/prelaunch/prelaunch-page.test.ts
git commit -m "feat: wire Sparkle Suite prelaunch waitlist form"
```

### Task 5: Finish Video Fallback, Root-Path Safety, And Regression Coverage

**Files:**
- Modify: `app/prelaunch/_components/PrelaunchVideoSection.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/prelaunch/prelaunch-page.test.ts`
- Create: `tests/prelaunch/prelaunch-root-route.test.ts`
- Reference: `node_modules/next/dist/docs/`

- [ ] **Step 1: Write the failing regression test for the root route handoff**

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import Home from '@/app/page'
import { redirect } from 'next/navigation'

describe('root route', () => {
  it('redirects to /prelaunch', () => {
    Home()
    expect(redirect).toHaveBeenCalledWith('/prelaunch')
  })
})
```

- [ ] **Step 2: Run test to verify it fails if the redirect drifted**

Run: `npm exec vitest run tests/prelaunch/prelaunch-root-route.test.ts`

Expected: PASS if Task 1 stayed intact; otherwise FAIL and fix before continuing.

- [ ] **Step 3: Add a real video/fallback switch**

```tsx
// app/prelaunch/_components/PrelaunchVideoSection.tsx
import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchVideoSection() {
  if (!prelaunchContent.videoEmbedUrl) {
    return (
      <section id="video">
        <h2>What Is Sparkle Suite?</h2>
        <p>
          Sparkle Suite is being built to give Bomb Party reps one calmer,
          easier online home for their business.
        </p>
      </section>
    )
  }

  return <iframe src={prelaunchContent.videoEmbedUrl} title="Sparkle Suite guided walkthrough" />
}
```

- [ ] **Step 4: Run the focused prelaunch suite**

Run: `npm exec vitest run tests/prelaunch/prelaunch-page.test.ts tests/prelaunch/prelaunch-root-route.test.ts tests/prelaunch/prelaunch-waitlist-service.test.ts tests/prelaunch/prelaunch-waitlist-route.test.ts`

Expected: PASS

- [ ] **Step 5: Run type-check/build sanity**

Run: `npx tsc --noEmit --pretty false`

Expected: no type errors

- [ ] **Step 6: Commit**

```bash
git add app/prelaunch/_components/PrelaunchVideoSection.tsx app/page.tsx tests/prelaunch/prelaunch-page.test.ts tests/prelaunch/prelaunch-root-route.test.ts
git commit -m "test: lock prelaunch route and video fallback behavior"
```

### Task 6: Manual QA And Domain-Readiness Checklist

**Files:**
- Modify: `docs/superpowers/specs/2026-05-07-sparkle-suite-prelaunch-site-design.md` only if real implementation drift must be documented
- Test: browser/manual verification against local dev server

- [ ] **Step 1: Start the app locally**

Run: `npm run dev`

Expected: local Next.js server starts successfully.

- [ ] **Step 2: Verify the public flow manually**

Check:

```text
/
  -> redirects to /prelaunch
/prelaunch
  -> hero, video/copy block, benefits, audience qualifier, waitlist form, closing section
```

Expected: all approved sections visible on mobile and desktop widths.

- [ ] **Step 3: Submit a manual waitlist entry**

Test payload:

```text
Name: Jamie Hart
Email: jamie@example.com
Phone: 303-555-0123
TikTok handle: @jamiehart
Team rep name: Lindsey
Pain point: Too many links and DMs
```

Expected: success confirmation shown, network POST returns 201.

- [ ] **Step 4: Verify the fallback path**

Set:

```text
videoEmbedUrl = ''
```

Expected: the page still reads cleanly with copy-only "What Is Sparkle Suite?" content.

- [ ] **Step 5: Prepare the domain handoff checklist**

Record before deploy:

```text
- Domain owner has access to yoursparklesuite.com DNS
- Vercel project has production env vars set
- Waitlist destination table/path confirmed
- Root route points to /prelaunch in production
- Old neonrabbit.net Sparkle Suite link updated to new domain when launch-ready
```

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css app/prelaunch app/api/prelaunch/waitlist/route.ts lib/prelaunch lib/services/types.ts supabase/migrations/040_prelaunch_waitlist.sql tests/prelaunch
git commit -m "chore: verify Sparkle Suite prelaunch launch-readiness"
```

---

## Self-Review

### Spec Coverage

- Standalone Sparkle Suite brand: covered in Tasks 1-2
- Velvet Concierge tone and homepage structure: covered in Task 2
- Guided video with copy fallback: covered in Task 5
- Waitlist-first CTA and qualified fields: covered in Tasks 3-4
- Future-ready `yoursparklesuite.com` public entry: covered in Tasks 1 and 6
- Move away from `neonrabbit.net` as primary Sparkle Suite landing: supported by Task 6 handoff checklist

### Placeholder Scan

- No `TODO` or `TBD`
- All code-change steps include concrete snippets
- All verification steps include exact commands or explicit manual checks

### Type Consistency

- Waitlist type name stays `PrelaunchWaitlistInput`
- Public route path stays `/api/prelaunch/waitlist`
- Public page path stays `/prelaunch`
