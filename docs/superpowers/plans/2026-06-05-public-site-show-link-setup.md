# Public Site Show Link Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the locked `yoursparklesuite.com/showname` decision into self-serve rep setup so every paid rep gets a simple, validated customer-facing show link.

**Architecture:** Store one canonical `public_site_slug` on `reps`, generated from the rep's live show name during required Nic-Nac setup. Backend helpers own generation, validation, uniqueness, alternatives, persistence, and route resolution; Nic-Nac only explains/reflects the result. A friendly public route serves the existing Amethyst customer-site homepage at `/{public_site_slug}` without changing workspace login behavior.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase/Postgres, Vitest, existing Nic-Nac required setup tools, existing Amethyst public site renderer.

---

## File Structure

- Create `lib/public-site/show-link.ts`: pure slug generation, validation, reserved-path checks, alternatives, display helpers.
- Create `tests/public-site-show-link.test.ts`: unit tests for generation, reserved paths, length, alternatives, and URL formatting.
- Create `supabase/migrations/20260605210000_ss_public_site_slug.sql`: add `reps.public_site_slug`, uniqueness, and lookup index.
- Modify `lib/self-serve/signup.ts`: initialize new reps with `public_site_slug: null`.
- Modify `lib/self-serve/required-setup.ts`: claim or flag the show link when `account_basics.liveShowName` / `publicSiteSlug` is saved.
- Create `tests/required-setup-public-site-link.test.ts`: service tests for auto-generation, conflicts, explicit alternative claiming, and account-basics completion guard.
- Modify `lib/nic-nac/tools/save-required-setup-answer.ts`: block `account_basics` completion unless the public site slug is accepted.
- Modify `lib/nic-nac/required-setup-prompt.ts`: teach Nic-Nac to confirm the generated link and only surface red flags.
- Modify `lib/amethyst/preview-rep.ts`: support resolving paid/ready reps by `public_site_slug`.
- Create `app/[publicSiteSlug]/route.ts`: serve the targeted Amethyst homepage for a valid slug.
- Create `tests/public-site-slug-route.test.ts`: route tests proving `/graciesparkleparty` resolves, unknown slugs 404, and demo data does not leak.
- Modify `lib/nic-nac/rep-links.ts`: prefer the friendly slug path when present.
- Modify `app/api/nic-nac/me/route.ts` and `app/nic-nac/components/DashboardPlaceholder.tsx`: expose/display/copy the final public show link.
- Modify `lib/services/help-resources.ts`: add the domain forwarding help article and clear boundary.

---

## Task 1: Pure Show-Link Rules

**Files:**
- Create: `lib/public-site/show-link.ts`
- Test: `tests/public-site-show-link.test.ts`

- [ ] **Step 1: Write the failing slug unit tests**

Create `tests/public-site-show-link.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildPublicSitePath,
  buildPublicSiteUrl,
  generatePublicSiteSlug,
  getPublicSiteSlugAlternatives,
  validatePublicSiteSlug,
} from '@/lib/public-site/show-link'

describe('public site show link rules', () => {
  it('generates a lowercase letters-and-numbers-only slug from the live show name', () => {
    expect(generatePublicSiteSlug("Gracie's Sparkle Party")).toBe(
      'graciesparkleparty',
    )
    expect(generatePublicSiteSlug("Macy's")).toBe('macy')
    expect(generatePublicSiteSlug('Bling & Fizz 24/7')).toBe('blingfizz247')
    expect(generatePublicSiteSlug('  The_Big-Live.Show!  ')).toBe(
      'thebigliveshow',
    )
  })

  it('rejects reserved paths and invalid generated values', () => {
    expect(validatePublicSiteSlug('login')).toEqual({
      ok: false,
      reason: 'reserved',
    })
    expect(validatePublicSiteSlug('gracie-sparkle')).toEqual({
      ok: false,
      reason: 'format',
    })
    expect(validatePublicSiteSlug('ab')).toEqual({
      ok: false,
      reason: 'too_short',
    })
    expect(validatePublicSiteSlug('a'.repeat(49))).toEqual({
      ok: false,
      reason: 'too_long',
    })
  })

  it('accepts clean launch-ready slugs', () => {
    expect(validatePublicSiteSlug('graciesparkleparty')).toEqual({ ok: true })
    expect(validatePublicSiteSlug('gracie2026')).toEqual({ ok: true })
  })

  it('suggests clean alternatives when the generated slug is blocked', () => {
    expect(getPublicSiteSlugAlternatives('graciesparkleparty')).toEqual([
      'graciesparklepartylive',
      'graciesparklepartyshop',
      'graciesparklepartybp',
    ])
  })

  it('formats paths and full URLs consistently', () => {
    expect(buildPublicSitePath('graciesparkleparty')).toBe(
      '/graciesparkleparty',
    )
    expect(
      buildPublicSiteUrl('graciesparkleparty', 'https://www.yoursparklesuite.com'),
    ).toBe('https://www.yoursparklesuite.com/graciesparkleparty')
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm exec vitest run tests/public-site-show-link.test.ts
```

Expected: fail because `@/lib/public-site/show-link` does not exist.

- [ ] **Step 3: Add the pure helper implementation**

Create `lib/public-site/show-link.ts`:

```ts
export const PUBLIC_SITE_SLUG_MIN_LENGTH = 3
export const PUBLIC_SITE_SLUG_MAX_LENGTH = 48

export const RESERVED_PUBLIC_SITE_SLUGS = new Set([
  'login',
  'logout',
  'admin',
  'api',
  'support',
  'pricing',
  'start',
  'terms',
  'privacy',
  'nicnac',
  'nic-nac',
  'workspace',
  'dashboard',
  'account',
  'settings',
  'help',
  'docs',
  'amethyst',
  'prelaunch',
  'controlcenter',
  'control-center',
])

export type PublicSiteSlugValidation =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'format' | 'reserved' | 'too_short' | 'too_long' }

export function generatePublicSiteSlug(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/['’]s\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function validatePublicSiteSlug(
  value: string | null | undefined,
): PublicSiteSlugValidation {
  const slug = value?.trim().toLowerCase() ?? ''
  if (!slug) return { ok: false, reason: 'empty' }
  if (!/^[a-z0-9]+$/.test(slug)) return { ok: false, reason: 'format' }
  if (slug.length < PUBLIC_SITE_SLUG_MIN_LENGTH) {
    return { ok: false, reason: 'too_short' }
  }
  if (slug.length > PUBLIC_SITE_SLUG_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' }
  }
  if (RESERVED_PUBLIC_SITE_SLUGS.has(slug)) {
    return { ok: false, reason: 'reserved' }
  }
  return { ok: true }
}

export function getPublicSiteSlugAlternatives(base: string) {
  const cleanBase = generatePublicSiteSlug(base).slice(
    0,
    PUBLIC_SITE_SLUG_MAX_LENGTH - 4,
  )
  const fallback = cleanBase.length >= PUBLIC_SITE_SLUG_MIN_LENGTH
    ? cleanBase
    : 'sparkleshow'
  return [`${fallback}live`, `${fallback}shop`, `${fallback}bp`].filter(
    (candidate) => validatePublicSiteSlug(candidate).ok,
  )
}

export function buildPublicSitePath(slug: string | null | undefined) {
  const cleanSlug = generatePublicSiteSlug(slug)
  return cleanSlug ? `/${cleanSlug}` : '/amethyst/Homepage.html'
}

export function buildPublicSiteUrl(
  slug: string,
  origin = 'https://www.yoursparklesuite.com',
) {
  return `${origin.replace(/\/$/, '')}${buildPublicSitePath(slug)}`
}
```

- [ ] **Step 4: Run the helper test**

Run:

```bash
npm exec vitest run tests/public-site-show-link.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add lib/public-site/show-link.ts tests/public-site-show-link.test.ts
git commit -m "feat: add public site show link rules"
```

---

## Task 2: Database Field and Signup Default

**Files:**
- Create: `supabase/migrations/20260605210000_ss_public_site_slug.sql`
- Modify: `lib/self-serve/signup.ts`

- [ ] **Step 1: Add the migration**

Create `supabase/migrations/20260605210000_ss_public_site_slug.sql`:

```sql
ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS public_site_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reps_public_site_slug_unique
  ON reps (public_site_slug)
  WHERE public_site_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reps_public_site_slug_lookup
  ON reps (public_site_slug);
```

- [ ] **Step 2: Initialize self-serve reps with no slug until setup collects live show name**

In `lib/self-serve/signup.ts`, update the `reps.insert` payload inside `createSelfServeWorkspaceForAuthUser`:

```ts
      custom_domain: null,
      public_site_slug: null,
      shop_link: null,
```

- [ ] **Step 3: Run focused self-serve signup tests**

Run:

```bash
npm exec vitest run tests/self-serve-signup-route.test.ts tests/reviewer-smoke-session.test.ts
```

Expected: pass.

- [ ] **Step 4: Commit Task 2**

```bash
git add supabase/migrations/20260605210000_ss_public_site_slug.sql lib/self-serve/signup.ts
git commit -m "feat: add rep public site slug column"
```

---

## Task 3: Backend Claiming and Red-Flag Logic

**Files:**
- Modify: `lib/self-serve/required-setup.ts`
- Test: `tests/required-setup-public-site-link.test.ts`

- [ ] **Step 1: Write the failing required-setup service tests**

Create `tests/required-setup-public-site-link.test.ts` with mocks for the admin client. The test must prove these behaviors:

```ts
import { describe, expect, it, vi } from 'vitest'
import { saveRequiredSetupAnswer } from '@/lib/self-serve/required-setup'

function makeAdminClient(options: {
  existingSlugOwner?: string | null
  updateRepError?: unknown
} = {}) {
  const setupRow = {
    id: 'setup-1',
    rep_id: 'rep-1',
    status: 'required_setup',
    current_step: 'account_basics',
    completed_steps: [],
    answers: {},
    generated_copy: {},
    support_state: {},
    dashboard_unlocked_at: null,
    created_at: null,
    updated_at: null,
  }

  const repMaybeSingle = vi.fn().mockResolvedValue({
    data: options.existingSlugOwner
      ? { id: options.existingSlugOwner, public_site_slug: 'graciesparkleparty' }
      : null,
    error: null,
  })

  const setupUpdateSingle = vi.fn().mockImplementation(async () => ({
    data: setupRow,
    error: null,
  }))

  const repUpdateSingle = vi.fn().mockResolvedValue({
    data: { id: 'rep-1', public_site_slug: 'graciesparkleparty' },
    error: options.updateRepError ?? null,
  })

  const from = vi.fn((table: string) => {
    if (table === 'self_serve_setup_sessions') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: setupRow, error: null }),
            single: setupUpdateSingle,
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({ single: setupUpdateSingle }),
          }),
        }),
      }
    }
    if (table === 'reps') {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: repMaybeSingle }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({ single: repUpdateSingle }),
          }),
        }),
      }
    }
    throw new Error(`Unexpected table ${table}`)
  })

  return { from, repMaybeSingle, repUpdateSingle, setupUpdateSingle }
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

describe('required setup public site link', () => {
  it('auto-claims a clean public site slug from live show name', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = makeAdminClient()
    vi.mocked(createAdminClient).mockReturnValue(admin as never)

    await saveRequiredSetupAnswer('rep-1', 'account_basics', {
      liveShowName: "Gracie's Sparkle Party",
    })

    expect(admin.repUpdateSingle).toHaveBeenCalled()
  })

  it('flags taken generated slugs and saves alternatives instead of claiming', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = makeAdminClient({ existingSlugOwner: 'rep-2' })
    vi.mocked(createAdminClient).mockReturnValue(admin as never)

    await saveRequiredSetupAnswer('rep-1', 'account_basics', {
      liveShowName: "Gracie's Sparkle Party",
    })

    expect(admin.repUpdateSingle).not.toHaveBeenCalled()
    expect(admin.setupUpdateSingle).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the failing service test**

Run:

```bash
npm exec vitest run tests/required-setup-public-site-link.test.ts
```

Expected: fail because `required-setup.ts` does not claim or flag public slugs yet.

- [ ] **Step 3: Add service helpers inside `required-setup.ts`**

Import the pure helpers:

```ts
import {
  buildPublicSiteUrl,
  generatePublicSiteSlug,
  getPublicSiteSlugAlternatives,
  validatePublicSiteSlug,
} from '@/lib/public-site/show-link'
```

Add helpers near the existing JSON helpers:

```ts
async function loadRepByPublicSiteSlug(
  admin: ReturnType<typeof import('@/lib/supabase/admin')['createAdminClient']>,
  slug: string,
) {
  const { data, error } = await admin
    .from('reps')
    .select('id, public_site_slug')
    .eq('public_site_slug', slug)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; public_site_slug: string | null } | null
}

async function claimPublicSiteSlug(
  admin: ReturnType<typeof import('@/lib/supabase/admin')['createAdminClient']>,
  repId: string,
  slug: string,
) {
  const { data, error } = await admin
    .from('reps')
    .update({ public_site_slug: slug })
    .eq('id', repId)
    .select('id, public_site_slug')
    .single()

  if (error) throw error
  return data as { id: string; public_site_slug: string }
}

async function buildAccountBasicsPublicSitePatch(
  admin: ReturnType<typeof import('@/lib/supabase/admin')['createAdminClient']>,
  repId: string,
  answerPatch: JsonObject,
): Promise<JsonObject> {
  const explicitSlug =
    typeof answerPatch.publicSiteSlug === 'string'
      ? generatePublicSiteSlug(answerPatch.publicSiteSlug)
      : ''
  const generatedSlug =
    explicitSlug ||
    generatePublicSiteSlug(
      typeof answerPatch.liveShowName === 'string' ? answerPatch.liveShowName : '',
    )

  if (!generatedSlug) return answerPatch

  const validation = validatePublicSiteSlug(generatedSlug)
  if (!validation.ok) {
    return {
      ...answerPatch,
      publicSiteSlugStatus: 'needs_review',
      publicSiteSlugRedFlag: validation.reason,
      publicSiteSlugAlternatives: getPublicSiteSlugAlternatives(generatedSlug),
    }
  }

  const existingOwner = await loadRepByPublicSiteSlug(admin, generatedSlug)
  if (existingOwner && existingOwner.id !== repId) {
    return {
      ...answerPatch,
      publicSiteSlugStatus: 'needs_review',
      publicSiteSlugRedFlag: 'taken',
      publicSiteSlugAlternatives: getPublicSiteSlugAlternatives(generatedSlug),
    }
  }

  await claimPublicSiteSlug(admin, repId, generatedSlug)
  return {
    ...answerPatch,
    publicSiteSlug: generatedSlug,
    publicSiteUrl: buildPublicSiteUrl(generatedSlug),
    publicSiteSlugStatus: 'accepted',
    publicSiteSlugRedFlag: null,
    publicSiteSlugAlternatives: [],
  }
}
```

Update `saveRequiredSetupAnswer` before building `patch`:

```ts
  const normalizedAnswerPatch =
    stepId === 'account_basics'
      ? await buildAccountBasicsPublicSitePatch(admin, repId, answerPatch)
      : answerPatch

  const patch: Record<string, unknown> = {
    answers: mergeStepPatch(row.answers, stepId, normalizedAnswerPatch),
  }
```

- [ ] **Step 4: Run the service test**

Run:

```bash
npm exec vitest run tests/required-setup-public-site-link.test.ts tests/public-site-show-link.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 3**

```bash
git add lib/self-serve/required-setup.ts tests/required-setup-public-site-link.test.ts
git commit -m "feat: claim public site link during setup"
```

---

## Task 4: Nic-Nac Required Setup Contract

**Files:**
- Modify: `lib/nic-nac/tools/save-required-setup-answer.ts`
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Test: `tests/nic-nac-required-setup-public-link.test.ts`

- [ ] **Step 1: Write prompt/guard tests**

Create `tests/nic-nac-required-setup-public-link.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildRequiredSetupPrompt } from '@/lib/nic-nac/required-setup-prompt'

describe('Nic-Nac required setup public show link instructions', () => {
  it('instructs Nic-Nac to use the generated show link and only surface red flags', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Sparkle Suite show link')
    expect(prompt).toContain('generated from the live show name')
    expect(prompt).toContain('letters and numbers only')
    expect(prompt).toContain('no dashes, no underscores, no punctuation')
    expect(prompt).toContain('Only ask the rep to choose a different show link if')
    expect(prompt).toContain('publicSiteSlugStatus')
  })
})
```

- [ ] **Step 2: Run the failing prompt test**

Run:

```bash
npm exec vitest run tests/nic-nac-required-setup-public-link.test.ts
```

Expected: fail because the prompt does not mention the locked show-link behavior yet.

- [ ] **Step 3: Strengthen account-basics completion validation**

In `lib/nic-nac/tools/save-required-setup-answer.ts`, update `validateCompletion` inside the `account_basics` branch:

```ts
    if (input.answer.publicSiteSlugStatus !== 'accepted') {
      throw new Error(
        'The Sparkle Suite show link must be accepted before completing account basics.',
      )
    }
```

- [ ] **Step 4: Update the required setup prompt**

In `lib/nic-nac/required-setup-prompt.ts`, replace the live show name/account-basics summary bullets with this wording:

```text
   - Live show name: ask "What is your live show name?" This is the show/business name customers recognize. Save as liveShowName.
   - Sparkle Suite show link: the backend generates the default show link from the live show name. The canonical link is lowercase letters and numbers only, with no spaces, no dashes, no underscores, and no punctuation. Possessive suffixes like 's are omitted so Gracie's Sparkle Party becomes graciesparkleparty.
   - After saving liveShowName, read the save_required_setup_answer result. If account_basics.publicSiteSlugStatus is accepted, confirm the generated link in plain language: "Your live show name is [name], so your Sparkle Suite show link will be yoursparklesuite.com/[slug]."
   - Only ask the rep to choose a different show link if account_basics.publicSiteSlugStatus is needs_review or the tool returns publicSiteSlugRedFlag/publicSiteSlugAlternatives.
   - If the generated show link has a red flag, present the alternatives exactly as returned. Do not invent dashed, underscored, spaced, or punctuated links.
```

Also update the summary bullet:

```text
   - Include customerFacingDisplayName, liveShowName, publicSiteUrl, bestContactEmail, bombPartyRepStoreLink, and primaryLiveShowOrSocialLink in the summary.
```

- [ ] **Step 5: Run prompt and tool tests**

Run:

```bash
npm exec vitest run tests/nic-nac-required-setup-public-link.test.ts tests/required-setup-public-site-link.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 4**

```bash
git add lib/nic-nac/tools/save-required-setup-answer.ts lib/nic-nac/required-setup-prompt.ts tests/nic-nac-required-setup-public-link.test.ts
git commit -m "feat: teach Nic-Nac public show link setup"
```

---

## Task 5: Resolve Reps by Public Slug

**Files:**
- Modify: `lib/amethyst/preview-rep.ts`
- Test: `tests/amethyst-preview-rep.test.ts`

- [ ] **Step 1: Add failing resolver test**

In `tests/amethyst-preview-rep.test.ts`, extend `makeAdminClient` with `repsByPublicSiteSlug` support and add:

```ts
  it('uses a matching public site slug for paid customer sites', async () => {
    const admin = makeAdminClient({
      repsByPublicSiteSlug: {
        graciesparkleparty: {
          id: 'rep-public-slug',
          email: 'gracie@example.com',
        },
      },
      paidRepIds: ['rep-public-slug'],
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        publicSiteSlug: 'GracieSparkleParty',
      }),
    ).resolves.toEqual({
      id: 'rep-public-slug',
      email: 'gracie@example.com',
    })
  })
```

- [ ] **Step 2: Run the failing resolver test**

Run:

```bash
npm exec vitest run tests/amethyst-preview-rep.test.ts
```

Expected: fail because `publicSiteSlug` is not part of `ResolveAmethystPreviewRepOptions`.

- [ ] **Step 3: Add public slug lookup to `preview-rep.ts`**

Update `ResolveAmethystPreviewRepOptions`:

```ts
  publicSiteSlug?: string | null
```

Add:

```ts
async function loadRepByPublicSiteSlug(
  admin: PreviewAdminClient,
  publicSiteSlug: string,
  select: string,
): Promise<AmethystPreviewRep | null> {
  const query = admin.from('reps').select(select) as {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: AmethystPreviewRep | null; error: unknown }>
    }
  }
  const { data, error } = await query
    .eq('public_site_slug', publicSiteSlug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}
```

At the top of `resolveAmethystPreviewRep`, before explicit `repId`:

```ts
  const publicSiteSlug = options.publicSiteSlug?.trim().toLowerCase()
  if (publicSiteSlug) {
    const rep = await loadRepByPublicSiteSlug(admin, publicSiteSlug, select)
    if (rep) return (await canServePublicCustomerSite(admin, rep.id)) ? rep : null
    return null
  }
```

- [ ] **Step 4: Run resolver tests**

Run:

```bash
npm exec vitest run tests/amethyst-preview-rep.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 5**

```bash
git add lib/amethyst/preview-rep.ts tests/amethyst-preview-rep.test.ts
git commit -m "feat: resolve customer sites by public slug"
```

---

## Task 6: Friendly Public Site Route

**Files:**
- Create: `lib/amethyst/public-asset-response.ts`
- Modify: `app/amethyst/[...asset]/route.ts`
- Create: `app/[publicSiteSlug]/route.ts`
- Test: `tests/public-site-slug-route.test.ts`
- Test: `tests/amethyst-static-assets-route.test.ts`

- [ ] **Step 1: Extract current Amethyst response rendering into a helper**

Move the non-route internals from `app/amethyst/[...asset]/route.ts` into `lib/amethyst/public-asset-response.ts`, preserving current behavior. Export:

```ts
export async function renderAmethystPublicAssetResponse(
  request: Request,
  asset: string[],
  options: {
    repIdOverride?: string | null
    canonicalPathOverride?: string | null
  } = {},
) {
  // moved implementation from the existing GET handler
}
```

Inside the helper:

```ts
const repId = options.repIdOverride ?? resolveAmethystRequestRepId(request)
```

For `canonicalPathOverride`, override the canonical and social URL path in the rendered metadata block while leaving the existing template script target at `?c={repId}`. Implement this by adding an optional `pathOverride` to `renderMetadataBlock`, `injectAmethystJsonLd`, and `rewriteAmethystPublicHtml`, then deriving the URL with:

```ts
const canonicalPath = options.canonicalPathOverride ?? metadata.path
const canonicalUrl = `${origin.replace(/\/$/, '')}${canonicalPath}`
```

When a targeted template is present, keep the targeted title/description behavior and replace only:

```ts
canonicalUrl
openGraph.url
```

For JSON-LD, pass the same `canonicalPath` as `path`.

- [ ] **Step 2: Shrink the existing Amethyst route to call the helper**

In `app/amethyst/[...asset]/route.ts`:

```ts
import { renderAmethystPublicAssetResponse } from '@/lib/amethyst/public-asset-response'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await params
  return renderAmethystPublicAssetResponse(request, asset)
}
```

- [ ] **Step 3: Write the failing friendly route test**

Create `tests/public-site-slug-route.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveAmethystPreviewRep: vi.fn(),
  loadAmethystPreviewTemplateData: vi.fn(),
}))

vi.mock('@/lib/amethyst/preview-rep', () => ({
  resolveAmethystPreviewRep: (...args: unknown[]) =>
    mocks.resolveAmethystPreviewRep(...args),
}))

vi.mock('@/lib/amethyst/preview-template-data', () => ({
  loadAmethystPreviewTemplateData: (...args: unknown[]) =>
    mocks.loadAmethystPreviewTemplateData(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: () => ({}) }),
}))

import { GET } from '@/app/[publicSiteSlug]/route'

describe('public site slug route', () => {
  it('serves the Amethyst homepage for a paid public slug', async () => {
    mocks.resolveAmethystPreviewRep.mockResolvedValue({
      id: 'rep-gracie',
      email: 'gracie@example.com',
    })
    mocks.loadAmethystPreviewTemplateData.mockResolvedValue({
      homepage: {
        repName: 'Gracie',
        businessName: 'Gracie Sparkle Party',
        teamName: 'Gracie Team',
        streamLinks: { shop: '#', watch: '#', tiktok: '#', facebook: '#' },
        socialLinks: [],
      },
      join: { teamName: 'Gracie Team' },
      trade: {},
    })

    const response = await GET(
      new Request('https://www.yoursparklesuite.com/graciesparkleparty'),
      { params: Promise.resolve({ publicSiteSlug: 'graciesparkleparty' }) },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    await expect(response.text()).resolves.toContain(
      '/api/amethyst/homepage-template?c=rep-gracie',
    )
  })

  it('returns 404 for unknown public slugs', async () => {
    mocks.resolveAmethystPreviewRep.mockResolvedValue(null)

    const response = await GET(
      new Request('https://www.yoursparklesuite.com/notfoundshow'),
      { params: Promise.resolve({ publicSiteSlug: 'notfoundshow' }) },
    )

    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 4: Create the friendly route**

Create `app/[publicSiteSlug]/route.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { renderAmethystPublicAssetResponse } from '@/lib/amethyst/public-asset-response'
import { validatePublicSiteSlug } from '@/lib/public-site/show-link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicSiteSlug: string }> },
) {
  const { publicSiteSlug } = await params
  const slug = publicSiteSlug.trim().toLowerCase()
  if (!validatePublicSiteSlug(slug).ok) {
    return new Response('Not found', { status: 404 })
  }

  const rep = await resolveAmethystPreviewRep(createAdminClient(), {
    publicSiteSlug: slug,
    select: 'id, email',
  })
  if (!rep) return new Response('Not found', { status: 404 })

  return renderAmethystPublicAssetResponse(request, ['Homepage.html'], {
    repIdOverride: rep.id,
    canonicalPathOverride: `/${slug}`,
  })
}
```

- [ ] **Step 5: Run route tests**

Run:

```bash
npm exec vitest run tests/public-site-slug-route.test.ts tests/amethyst-static-assets-route.test.ts tests/amethyst-targeted-site-data-scrub.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 6**

```bash
git add lib/amethyst/public-asset-response.ts app/amethyst/[...asset]/route.ts app/[publicSiteSlug]/route.ts tests/public-site-slug-route.test.ts tests/amethyst-static-assets-route.test.ts
git commit -m "feat: serve customer sites by show link"
```

---

## Task 7: Workspace Link Display

**Files:**
- Modify: `app/api/nic-nac/me/route.ts`
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Modify: `lib/nic-nac/rep-links.ts`
- Test: `tests/nic-nac-rep-links.test.ts`

- [ ] **Step 1: Write the failing link helper test**

Create or update `tests/nic-nac-rep-links.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildCustomerSparkleSiteHref,
  buildCustomerTradeBoardHref,
} from '@/lib/nic-nac/rep-links'

describe('Nic-Nac rep customer links', () => {
  it('prefers the friendly public site slug for homepage links', () => {
    expect(
      buildCustomerSparkleSiteHref({
        repId: 'rep-1',
        publicSiteSlug: 'graciesparkleparty',
      }),
    ).toBe('/graciesparkleparty')
  })

  it('keeps existing Amethyst trade-board targeting for trade preview links', () => {
    expect(
      buildCustomerTradeBoardHref({
        repId: 'rep-1',
        publicSiteSlug: 'graciesparkleparty',
      }),
    ).toBe('/amethyst/Trade.html?c=rep-1')
  })
})
```

- [ ] **Step 2: Update `rep-links.ts`**

Replace the current string-argument functions with object-compatible overloads:

```ts
type CustomerLinkTarget =
  | string
  | null
  | undefined
  | {
      repId?: string | null
      publicSiteSlug?: string | null
    }

function normalizeTarget(target: CustomerLinkTarget) {
  if (typeof target === 'string' || target == null) {
    return { repId: target?.trim() || null, publicSiteSlug: null }
  }
  return {
    repId: target.repId?.trim() || null,
    publicSiteSlug: target.publicSiteSlug?.trim().toLowerCase() || null,
  }
}

export function buildCustomerSparkleSiteHref(target?: CustomerLinkTarget) {
  const { repId, publicSiteSlug } = normalizeTarget(target)
  if (publicSiteSlug) return `/${encodeURIComponent(publicSiteSlug)}`
  if (!repId) return '/amethyst/Homepage.html'
  return `/amethyst/Homepage.html?c=${encodeURIComponent(repId)}`
}

export function buildCustomerTradeBoardHref(target?: CustomerLinkTarget) {
  const { repId } = normalizeTarget(target)
  if (!repId) return '/amethyst/Trade.html'
  return `/amethyst/Trade.html?c=${encodeURIComponent(repId)}`
}
```

- [ ] **Step 3: Expose the slug from `/api/nic-nac/me`**

In `app/api/nic-nac/me/route.ts`, include `public_site_slug` in the JSON response:

```ts
        public_site_slug: rep.public_site_slug ?? null,
```

If `getAuthenticatedNicNacContext` does not currently select `public_site_slug`, update `lib/nic-nac/auth.ts` to select it.

- [ ] **Step 4: Update workspace state and display**

In `DashboardPlaceholder.tsx`, extend `MeResponsePayload`:

```ts
    public_site_slug?: string | null
```

Extend `RepProfileState`:

```ts
  publicSiteSlug?: string | null
```

When loading `/api/nic-nac/me`, map:

```ts
publicSiteSlug: payload.rep?.public_site_slug ?? null,
```

Build the homepage link with:

```ts
  const customerSparkleSiteHref = buildCustomerSparkleSiteHref({
    repId: repIdOverride ?? repProfileState.repId,
    publicSiteSlug: repProfileState.publicSiteSlug,
  })
```

Add a small topbar info pill near the Live Queue sync code:

```tsx
          <div className={styles.topbarInfoPill}>
            <span className={styles.topbarInfoLabel}>Customer site</span>
            <span className={styles.topbarInfoValue}>
              {repProfileState.publicSiteSlug
                ? `yoursparklesuite.com/${repProfileState.publicSiteSlug}`
                : 'Assigned during setup'}
            </span>
          </div>
```

- [ ] **Step 5: Run workspace/link tests**

Run:

```bash
npm exec vitest run tests/nic-nac-rep-links.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 7**

```bash
git add lib/nic-nac/rep-links.ts app/api/nic-nac/me/route.ts lib/nic-nac/auth.ts app/nic-nac/components/DashboardPlaceholder.tsx tests/nic-nac-rep-links.test.ts
git commit -m "feat: show customer site link in workspace"
```

---

## Task 8: Domain Forwarding Help Boundary

**Files:**
- Modify: `lib/services/help-resources.ts`
- Test: `tests/help-resources.test.ts`

- [ ] **Step 1: Add or update help-resource test**

Create/update `tests/help-resources.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getHelpResources } from '@/lib/services/help-resources'

describe('help resources', () => {
  it('includes self-serve domain forwarding guidance with paid-support boundary', async () => {
    const resources = await getHelpResources()
    const domainHelp = resources.find((resource) =>
      resource.title.toLowerCase().includes('forward'),
    )

    expect(domainHelp?.body).toContain('yoursparklesuite.com')
    expect(domainHelp?.body).toContain('Do not use masked forwarding')
    expect(domainHelp?.body).toContain('domain provider')
    expect(domainHelp?.body).toContain('paid support')
  })
})
```

- [ ] **Step 2: Add the help article**

In `lib/services/help-resources.ts`, add a resource:

```ts
{
  id: 'domain-forwarding',
  title: 'Forward your own domain to your Sparkle Suite show link',
  category: 'customer_site',
  body:
    'Your included Sparkle Suite show link is ready to use at yoursparklesuite.com/yourshowname. If you already own a separate domain, you can forward it to that link through your domain provider. Look for Domain Forwarding, URL Redirect, or Forwarding in your registrar account. Use a permanent 301 redirect when available. Do not use masked forwarding. Domain forwarding is managed by your domain provider; Sparkle Suite can point you to these instructions, but hands-on setup help is paid support.',
}
```

- [ ] **Step 3: Run help tests**

Run:

```bash
npm exec vitest run tests/help-resources.test.ts
```

Expected: pass.

- [ ] **Step 4: Commit Task 8**

```bash
git add lib/services/help-resources.ts tests/help-resources.test.ts
git commit -m "docs: add domain forwarding help boundary"
```

---

## Task 9: Verification and Browser Smoke

**Files:**
- No new files unless a failure requires a fix.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm exec vitest run tests/public-site-show-link.test.ts tests/required-setup-public-site-link.test.ts tests/nic-nac-required-setup-public-link.test.ts tests/amethyst-preview-rep.test.ts tests/public-site-slug-route.test.ts tests/nic-nac-rep-links.test.ts tests/help-resources.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run broader relevant regression tests**

Run:

```bash
npm exec vitest run tests/amethyst-static-assets-route.test.ts tests/amethyst-targeted-site-data-scrub.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/amethyst-preview-template-data.test.ts
```

Expected: all pass.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: Next build passes.

- [ ] **Step 4: Apply Supabase migration locally/preview**

Run:

```bash
supabase migration list
supabase db push
```

Expected: migration list shows the new migration and `db push` applies `public_site_slug`.

- [ ] **Step 5: Browser smoke**

Start the dev server:

```bash
npm run dev
```

Smoke path:

1. Open `/start`.
2. Use reviewer smoke or test buyer path into required setup.
3. Enter live show name: `Gracie's Sparkle Party`.
4. Confirm Nic-Nac reports `yoursparklesuite.com/graciesparkleparty`.
5. Approve setup preview.
6. Unlock workspace.
7. Verify workspace shows `yoursparklesuite.com/graciesparkleparty`.
8. Open `/graciesparkleparty`.
9. Verify the customer-facing homepage renders Gracie-specific data and does not show demo fallback data.

- [ ] **Step 6: Final commit if verification fixes were needed**

If Task 9 required code changes:

```bash
git add <changed-files>
git commit -m "fix: complete public show link verification"
```

---

## Self-Review

Spec coverage:

- Default path-based customer site link: Task 6.
- Centralized workspace login remains unchanged: no task changes `/login`.
- Auto-generation from live show name: Tasks 1, 3, and 4.
- Lowercase letters/numbers only: Task 1.
- No spaces, dashes, underscores, punctuation: Task 1 and Task 4.
- Red flags and alternatives: Task 3 and Task 4.
- Reserved paths: Task 1.
- Forwarding instructions with Nic-Nac boundary: Task 8.
- Deferred QR/business-card/TikTok kit remains out of implementation scope.

Placeholder scan:

- The plan intentionally avoids QR, printed cards, social overlays, true custom-domain DNS, and registrar troubleshooting.
- No implementation task depends on external services beyond existing Supabase migration and existing app tests.

Type consistency:

- `public_site_slug` is the database column.
- `publicSiteSlug` is the TypeScript/client field.
- `publicSiteSlugStatus`, `publicSiteSlugRedFlag`, `publicSiteSlugAlternatives`, and `publicSiteUrl` live inside `answers.account_basics`.
