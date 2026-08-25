# Sparkle Finder Public Landing And Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the anonymous Sparkle Finder homepage with the selected trust-first landing page concept and add production-ready traditional sign-in plus Google OAuth, while keeping hub data gated until the visitor signs in and completes required account details.

**Architecture:** The binder remains `C:\Users\louis\sparkle-finder`; all implementation must happen in `C:\Users\louis\sparkle-finder-repo` on branch `codex-sparkle-finder-v1`. The public homepage becomes a static, brand-consistent marketing/sign-up funnel, hub routes remain gated by the existing `(hub)` layout, and Supabase Auth handles password, magic-link, and Google OAuth sessions through server-side cookie exchange.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth with `@supabase/ssr`, Vitest, Playwright/browser smoke verification.

---

## Lockdown Rules

- Do not implement, build, test, commit, or push from `C:\Users\louis\sparkle-finder`.
- Use `C:\Users\louis\sparkle-finder-repo` for all code work.
- Do not edit `C:\Users\louis\sparkle-suite-repo`; it is read-only reference only.
- Do not expose live jewelry database content, item cards, rep boards, or show data to anonymous visitors.
- Do not imply Sparkle Finder sells Bomb Party jewelry.
- Do not use Bomb Party product imagery on the public landing page.
- Do not remove the existing local preview auth controls; keep them dev-only.
- Do not bypass required account data collection for Google sign-in users.
- Do not use Supabase service-role keys in client components.
- Do not run destructive git commands.
- Before implementation, record current `git status --short --branch` because the repo already contains uncommitted brand/catalog/font work.

## Plan Review Findings

The previous plan was directionally correct. These are the gaps this lockdown file closes:

- Anonymous homepage data leak risk: the current `app/page.tsx` renders demo live shows, affiliate items, and Silver collection previews. The new homepage must not render the hub/demo data sections for anonymous visitors.
- Google OAuth onboarding gap: Google can authenticate users without phone, state, or privacy acknowledgment. The plan now requires an account-completion gate before full Silver access.
- Callback route clarity: keep `/auth/confirm` for email OTP/magic-link confirmation and add a separate OAuth callback route for Google.
- Safe redirect reuse: extract the current confirmation-route safe redirect logic into a shared helper so email confirmation and OAuth callback use the same protection.
- Copy guardrails: add tests that assert the public landing page says Sparkle Finder is independent and does not sell Bomb Party jewelry.
- Production configuration: implementation is not done until Supabase Google provider redirect URLs are checked for local and production.

## Current Repo State To Protect

Active workbench:

```text
C:\Users\louis\sparkle-finder-repo
```

Expected branch:

```text
codex-sparkle-finder-v1
```

Known uncommitted work already present before this plan:

- Sparkle Suite brand/color polish.
- Bright pink logo/wordmark fixes.
- Canonical catalog adapter work for Sparkle Suite jewelry data.
- Font fixes for Playfair display headings.
- Route and catalog tests.

First command before implementation:

```powershell
git -C C:\Users\louis\sparkle-finder-repo status --short --branch
```

Expected: dirty worktree is allowed because prior Sparkle Finder work is in progress. If unrelated unexpected files appear, stop and report before editing.

## External References Checked

- Supabase Google login guide: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase `signInWithOAuth` reference: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- Supabase OAuth code exchange reference: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession
- Supabase server-side auth guidance: https://supabase.com/docs/guides/auth/server-side-rendering

Important Supabase requirements from current docs:

- Browser OAuth uses `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`.
- PKCE/server-side auth needs a callback route that calls `supabase.auth.exchangeCodeForSession(code)`.
- The callback URL used in `redirectTo` must be allowed in Supabase Auth redirect URLs.
- Google provider must be configured in Supabase Auth and Google Cloud.

## Selected Landing Page Direction

Louis selected the first reference concept: simple public landing, trust-first, no live jewelry cards, no sales or marketplace feel.

Implementation target:

- Header: dark plum/espresso, Sparkle Suite seal style, bright pink Sparkle Finder brand text.
- Page background: warm ivory/blush, matching Sparkle Suite.
- Hero: large Playfair-style headline, centered or near-centered depending on viewport.
- CTAs:
  - Primary: `Start free Silver trial`
  - Secondary: `Sign in`
- Trust copy:
  - `Sparkle Finder does not sell Bomb Party jewelry.`
  - `We are not Bomb Party, a Bomb Party affiliate, or a Bomb Party rep.`
  - `We help collectors organize, discover, and find the reps, products, and shows they love.`
- Feature cards:
  - `Master Jewelry Library`
  - `Live Show Calendar`
  - `Rep Trade Boards / Dance Floors`
  - `Collection Showcase`
  - `Collector & Rep Essentials`
- Visual rule: use clean iconography, brand color blocks, and cardfields. Do not use real jewelry product photos or Bomb Party imagery on the public homepage.

## File Map

Modify in active repo only:

- `C:\Users\louis\sparkle-finder-repo\app\page.tsx`
  - Replace anonymous data-heavy home with public landing renderer.
  - Preserve authenticated handling by redirecting signed-in users to `/dashboard` or showing a dashboard CTA.
  - Export a testable `renderPublicHomeContent(accountState)` helper so Vitest does not need to invoke `cookies()`.

- `C:\Users\louis\sparkle-finder-repo\components\home\PublicLandingPage.tsx`
  - New server-safe presentational component for selected landing page.

- `C:\Users\louis\sparkle-finder-repo\components\home\PublicLandingFeatureCards.tsx`
  - New feature-card grid with gated CTA links.

- `C:\Users\louis\sparkle-finder-repo\components\home\IndependenceTrustStrip.tsx`
  - New public disclaimer/trust component.

- `C:\Users\louis\sparkle-finder-repo\app\(hub)\layout.tsx`
  - Improve anonymous sign-in wall with feature-aware copy and `next` forwarding.

- `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\safe-redirect.ts`
  - New shared safe relative redirect helper.

- `C:\Users\louis\sparkle-finder-repo\app\auth\confirm\route.ts`
  - Replace local `getSafeNextPath` with shared helper.

- `C:\Users\louis\sparkle-finder-repo\app\api\auth\callback\route.ts`
  - New Google OAuth callback route.

- `C:\Users\louis\sparkle-finder-repo\components\account\SignInForm.tsx`
  - New client component for email/password sign-in and Google OAuth.

- `C:\Users\louis\sparkle-finder-repo\app\auth\sign-in\page.tsx`
  - Replace informational sign-in page with traditional form plus Google button while preserving dev preview panel.

- `C:\Users\louis\sparkle-finder-repo\components\account\SignupForm.tsx`
  - Add Google sign-up option, with copy explaining account details may still be required.

- `C:\Users\louis\sparkle-finder-repo\app\account\page.tsx`
  - Ensure authenticated users missing required profile details see an account-completion path before full tool use.

- `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\account-completion.ts`
  - New helper for determining whether required profile details are complete.
  - Required fields are display name, email, phone, state, and privacy acknowledgment.

- `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`
  - Add public landing and gating assertions.

- `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\auth-routes.test.ts`
  - Add safe redirect and OAuth callback tests.

- `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\sign-in-form.test.tsx`
  - New or equivalent test for sign-in form source/render behavior.

- `C:\Users\louis\sparkle-finder-repo\docs\deployments\sparkle-finder-silver-auth-env-vars.md`
  - Add Google OAuth provider and redirect URL checklist.

## Sub-Agent Execution Strategy

Use subagents only after Louis approves implementation. Recommended split:

- Landing/UI sub-agent:
  - Owns `app/page.tsx`, `components/home/PublicLandingPage.tsx`, `components/home/PublicLandingFeatureCards.tsx`, and `components/home/IndependenceTrustStrip.tsx`.
  - Must not touch Supabase/auth files.

- Auth sub-agent:
  - Owns sign-in form, Google OAuth, callback route, safe redirects, and account completion helper.
  - Must not change homepage layout beyond CTA links.

- QA sub-agent:
  - Owns tests, browser checks, and copy guardrail review.
  - Must not change production code except minimal testability exports approved by the primary agent.

The primary agent reviews each subagent result before moving to the next task and resolves integration conflicts.

## Task 1: Baseline And Safety Check

**Files:**
- Read: `C:\Users\louis\sparkle-finder-repo\app\page.tsx`
- Read: `C:\Users\louis\sparkle-finder-repo\app\auth\sign-in\page.tsx`
- Read: `C:\Users\louis\sparkle-finder-repo\components\account\SignupForm.tsx`
- Read: `C:\Users\louis\sparkle-finder-repo\app\(hub)\layout.tsx`
- Read: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`
- Read: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\auth-routes.test.ts`

- [ ] **Step 1: Confirm workbench and branch**

Run:

```powershell
git -C C:\Users\louis\sparkle-finder-repo status --short --branch
```

Expected:

```text
## codex-sparkle-finder-v1...origin/codex-sparkle-finder-v1
```

The worktree may be dirty with existing Sparkle Finder changes. Do not revert them.

- [ ] **Step 2: Confirm no implementation is happening in binder**

Run:

```powershell
Get-Location
```

Expected during implementation:

```text
C:\Users\louis\sparkle-finder-repo
```

If the location is `C:\Users\louis\sparkle-finder`, change directory before editing code.

- [ ] **Step 3: Run current focused tests before edits**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
```

Expected: existing tests pass before this feature begins. If they fail, stop and report the exact failures.

## Task 2: Write Landing Page Tests First

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Add tests for the public landing page**

Add imports if missing:

```ts
import { renderPublicHomeContent } from "../../app/page";
```

Add tests:

```ts
it("renders the selected trust-first public landing page", async () => {
  const markup = renderToStaticMarkup(renderPublicHomeContent(anonymousRouteAccountState()));

  expect(markup).toContain("Sparkle Finder");
  expect(markup).toContain("Start free Silver trial");
  expect(markup).toContain("Sign in");
  expect(markup).toContain("Master Jewelry Library");
  expect(markup).toContain("Live Show Calendar");
  expect(markup).toContain("Rep Trade Boards / Dance Floors");
  expect(markup).toContain("Collection Showcase");
  expect(markup).toContain("Collector &amp; Rep Essentials");
});

it("states clearly that Sparkle Finder is independent and does not sell Bomb Party jewelry", async () => {
  const markup = renderToStaticMarkup(renderPublicHomeContent(anonymousRouteAccountState()));

  expect(markup).toContain("Sparkle Finder does not sell Bomb Party jewelry.");
  expect(markup).toContain("We are not Bomb Party, a Bomb Party affiliate, or a Bomb Party rep.");
  expect(markup).toContain("clean, organized place to help you find the reps, products, and shows you love");
});

it("does not expose live jewelry demo data on the public homepage", async () => {
  const markup = renderToStaticMarkup(renderPublicHomeContent(anonymousRouteAccountState()));

  expect(markup).not.toContain("Rainbow Crown Ring");
  expect(markup).not.toContain("Celestial Lights Preview");
  expect(markup).not.toContain("Sierra Sparkle Studio");
  expect(markup).not.toContain("Add to collection");
  expect(markup).not.toContain("Nic-Nac, find this for me");
});
```

- [ ] **Step 2: Run the focused landing tests and confirm failure**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: the new public landing tests fail because `app/page.tsx` still renders demo hub sections.

## Task 3: Build The Public Landing Components

**Files:**
- Create: `C:\Users\louis\sparkle-finder-repo\components\home\IndependenceTrustStrip.tsx`
- Create: `C:\Users\louis\sparkle-finder-repo\components\home\PublicLandingFeatureCards.tsx`
- Create: `C:\Users\louis\sparkle-finder-repo\components\home\PublicLandingPage.tsx`
- Modify: `C:\Users\louis\sparkle-finder-repo\app\page.tsx`

- [ ] **Step 1: Create the independence trust strip**

Create `components/home/IndependenceTrustStrip.tsx`:

```tsx
import { ShieldCheck } from "lucide-react";

export function IndependenceTrustStrip() {
  return (
    <section className="border-y border-[var(--sparkle-border)] bg-[var(--sparkle-paper)]">
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <ShieldCheck aria-hidden="true" className="size-6 text-[var(--sparkle-coral)]" />
        <div className="grid gap-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <p className="font-bold text-[var(--sparkle-plum-deep)]">
            Sparkle Finder does not sell Bomb Party jewelry.
          </p>
          <p>
            We are not Bomb Party, a Bomb Party affiliate, or a Bomb Party rep. Sparkle Finder is a clean,
            organized place to help you find the reps, products, and shows you love, and to show off your
            amazing collection.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create feature cards**

Create `components/home/PublicLandingFeatureCards.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Gem, PackageCheck, UsersRound } from "lucide-react";

const features = [
  {
    title: "Master Jewelry Library",
    description: "Search organized reference details after you create your free account.",
    href: "/auth/sign-up?next=/library",
    icon: BookOpen,
  },
  {
    title: "Live Show Calendar",
    description: "Follow independent rep shows and plan where you want to watch next.",
    href: "/auth/sign-up?next=/live-shows",
    icon: CalendarDays,
  },
  {
    title: "Rep Trade Boards / Dance Floors",
    description: "Browse rep-hosted boards and collector discovery moments after sign-in.",
    href: "/auth/sign-up?next=/rep-boards",
    icon: UsersRound,
  },
  {
    title: "Collection Showcase",
    description: "Build a collector profile and show off the pieces that make your collection yours.",
    href: "/auth/sign-up?next=/silver",
    icon: Gem,
  },
  {
    title: "Collector & Rep Essentials",
    description: "Find care, storage, display, livestream, and setup gear without jewelry sales confusion.",
    href: "/auth/sign-up?next=/shop",
    icon: PackageCheck,
  },
] as const;

export function PublicLandingFeatureCards() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:px-8 md:grid-cols-2 xl:grid-cols-5">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <Link
            className="group grid min-h-44 gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--sparkle-coral)]"
            href={feature.href}
            key={feature.title}
          >
            <Icon aria-hidden="true" className="size-7 text-[var(--sparkle-coral)]" />
            <div className="grid gap-2">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--sparkle-plum-deep)]">
                {feature.title}
              </h2>
              <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">{feature.description}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
              Start with an account
              <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 3: Create public landing wrapper**

Create `components/home/PublicLandingPage.tsx`:

```tsx
import Link from "next/link";
import { LogIn, Sparkles, UserPlus } from "lucide-react";
import { IndependenceTrustStrip } from "@/components/home/IndependenceTrustStrip";
import { PublicLandingFeatureCards } from "@/components/home/PublicLandingFeatureCards";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";

export function PublicLandingPage({ accountState }: { accountState: SparkleFinderAccountState }) {
  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)]">
        <section className="mx-auto grid max-w-5xl justify-items-center gap-6 px-5 py-16 text-center sm:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
            <Sparkles aria-hidden="true" className="size-4" />
            Sparkle Suite collector ecosystem
          </p>
          <h1 className="max-w-4xl font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[1.02] text-[var(--sparkle-plum-deep)] sm:text-6xl">
            Find the sparkle you're hunting.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--sparkle-ink-muted)]">
            One account gives collectors a cleaner way to browse jewelry references, find independent rep shows,
            follow boards, and plan their collection with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
              href="/auth/sign-up"
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Start free Silver trial
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-[var(--sparkle-paper)] px-5 text-sm font-bold text-[var(--sparkle-plum-deep)]"
              href="/auth/sign-in"
            >
              <LogIn aria-hidden="true" className="size-4" />
              Sign in
            </Link>
          </div>
        </section>
        <IndependenceTrustStrip />
        <PublicLandingFeatureCards />
      </main>
    </>
  );
}
```

- [ ] **Step 4: Replace the data-heavy homepage**

Modify `app/page.tsx` so it only builds account state and renders the public landing or redirects authenticated visitors. Export `renderPublicHomeContent` for tests:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicLandingPage } from "@/components/home/PublicLandingPage";
import {
  isSparkleFinderSignedIn,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";

export default async function Home() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });

  return renderPublicHomeContent(accountState);
}

export function renderPublicHomeContent(accountState: Awaited<ReturnType<typeof getCurrentSparkleFinderAccount>>) {
  if (isSparkleFinderSignedIn(accountState)) {
    redirect("/dashboard");
  }

  return <PublicLandingPage accountState={accountState} />;
}
```

- [ ] **Step 5: Run focused landing tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: public landing tests pass. Existing tests that expected previous homepage card implementation may need updates to target `PublicLandingFeatureCards`.

## Task 4: Shared Safe Redirect Helper

**Files:**
- Create: `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\safe-redirect.ts`
- Modify: `C:\Users\louis\sparkle-finder-repo\app\auth\confirm\route.ts`
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\auth-routes.test.ts`

- [ ] **Step 1: Extract safe redirect helper**

Create `lib/sparkle-finder/safe-redirect.ts`:

```ts
export function safeSparkleFinderNextPath(next: string | null, fallback = "/dashboard"): string {
  if (!next) {
    return fallback;
  }

  let decodedNext = next;

  try {
    decodedNext = decodeURIComponent(next);
  } catch {
    return fallback;
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    decodedNext.startsWith("//") ||
    decodedNext.includes("\\") ||
    /^\/[a-z][a-z0-9+.-]*:/i.test(decodedNext)
  ) {
    return fallback;
  }

  return next;
}
```

- [ ] **Step 2: Update confirmation route**

Modify `app/auth/confirm/route.ts`:

```ts
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=confirmation_failed", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return NextResponse.redirect(new URL("/auth/sign-in?error=confirmation_failed", requestUrl.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/sign-in?error=confirmation_failed", requestUrl.origin));
  }

  return NextResponse.redirect(
    new URL(safeSparkleFinderNextPath(requestUrl.searchParams.get("next")), requestUrl.origin),
  );
}
```

- [ ] **Step 3: Add direct safe redirect helper tests**

Add to `tests/sparkle-finder/auth-routes.test.ts`:

```ts
describe("Sparkle Finder safe redirects", () => {
  it.each([
    [null, "/dashboard"],
    ["/dashboard", "/dashboard"],
    ["/silver?from=signup", "/silver?from=signup"],
    ["silver", "/dashboard"],
    ["https://evil.example", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/%2Fevil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    ["/javascript:alert(1)", "/dashboard"],
  ])("maps %s to %s", async (input, expected) => {
    const { safeSparkleFinderNextPath } = await import("../../lib/sparkle-finder/safe-redirect");

    expect(safeSparkleFinderNextPath(input)).toBe(expected);
  });
});
```

- [ ] **Step 4: Run auth route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/auth-routes.test.ts
```

Expected: existing confirmation tests still pass, plus new helper tests pass.

## Task 5: Google OAuth Callback Route

**Files:**
- Create: `C:\Users\louis\sparkle-finder-repo\app\api\auth\callback\route.ts`
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\auth-routes.test.ts`

- [ ] **Step 1: Write callback tests first**

Add to `tests/sparkle-finder/auth-routes.test.ts`:

```ts
describe("Sparkle Finder Google OAuth callback", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../../lib/supabase/server");
  });

  it("redirects missing OAuth codes back to sign-in", async () => {
    const { GET } = await import("../../app/api/auth/callback/route");
    const response = await GET(new Request("http://localhost:4310/api/auth/callback"));

    expect(response.headers.get("location")).toBe("http://localhost:4310/auth/sign-in?error=missing_oauth_code");
  });

  it("exchanges an OAuth code and redirects to a safe next path", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });

    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          exchangeCodeForSession,
        },
      }),
    }));

    const { GET } = await import("../../app/api/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:4310/api/auth/callback?code=abc123&next=/library"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.headers.get("location")).toBe("http://localhost:4310/library");
  });

  it("uses dashboard for unsafe OAuth next paths", async () => {
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        },
      }),
    }));

    const { GET } = await import("../../app/api/auth/callback/route");
    const response = await GET(
      new Request(
        `http://localhost:4310/api/auth/callback?code=abc123&next=${encodeURIComponent("https://evil.example")}`,
      ),
    );

    expect(response.headers.get("location")).toBe("http://localhost:4310/dashboard");
  });

  it("redirects exchange failures back to sign-in", async () => {
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: new Error("bad code") }),
        },
      }),
    }));

    const { GET } = await import("../../app/api/auth/callback/route");
    const response = await GET(new Request("http://localhost:4310/api/auth/callback?code=bad"));

    expect(response.headers.get("location")).toBe("http://localhost:4310/auth/sign-in?error=oauth_exchange_failed");
  });
});
```

- [ ] **Step 2: Run callback tests and confirm failure**

Run:

```powershell
npm run test -- tests/sparkle-finder/auth-routes.test.ts
```

Expected: callback tests fail because route does not exist yet.

- [ ] **Step 3: Create callback route**

Create `app/api/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=missing_oauth_code", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/auth/sign-in?error=oauth_exchange_failed", requestUrl.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/sign-in?error=oauth_exchange_failed", requestUrl.origin));
  }

  return NextResponse.redirect(
    new URL(safeSparkleFinderNextPath(requestUrl.searchParams.get("next")), requestUrl.origin),
  );
}
```

- [ ] **Step 4: Run callback tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/auth-routes.test.ts
```

Expected: callback tests pass.

## Task 6: Traditional Sign-In And Google Button

**Files:**
- Create: `C:\Users\louis\sparkle-finder-repo\components\account\SignInForm.tsx`
- Modify: `C:\Users\louis\sparkle-finder-repo\app\auth\sign-in\page.tsx`
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Add sign-in render tests**

Add to `tests/sparkle-finder/routes.test.ts`:

```ts
it("renders traditional sign-in and Google auth controls", () => {
  const markup = renderToStaticMarkup(createElement(SignInPage));

  expect(markup).toContain("Email");
  expect(markup).toContain("Password");
  expect(markup).toContain("Sign in");
  expect(markup).toContain("Continue with Google");
  expect(markup).toContain("/auth/sign-up");
});
```

- [ ] **Step 2: Create sign-in form**

Create `components/account/SignInForm.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { KeyRound, Mail, Search } from "lucide-react";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]";

function getSafeNextFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  return safeSparkleFinderNextPath(params.get("next"));
}

export function SignInForm() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/dashboard";
    }

    return getSafeNextFromSearch(window.location.search);
  }, []);

  async function signInWithPassword(formData: FormData) {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage("We could not sign you in with that email and password.");
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setErrorMessage("Sparkle Finder sign-in is not configured on this environment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setErrorMessage("Google sign-in could not start. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("Google sign-in is not configured on this environment.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      action={signInWithPassword}
      aria-label="Sparkle Finder sign-in form"
      className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
    >
      <div className="flex items-start gap-3">
        <Search aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
        <div>
          <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Sign in to Sparkle Finder</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Open your library, shows, boards, and Silver collector tools.
          </p>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Email
        <input autoComplete="email" className={inputClassName} name="email" required type="email" />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Password
        <input autoComplete="current-password" className={inputClassName} name="password" required type="password" />
      </label>

      {errorMessage ? <p className="text-sm font-semibold text-[var(--sparkle-coral)]">{errorMessage}</p> : null}

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
        disabled={isSubmitting}
        type="submit"
      >
        <KeyRound aria-hidden="true" className="size-4" />
        Sign in
      </button>

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-5 text-sm font-bold text-[var(--sparkle-plum-deep)]"
        disabled={isSubmitting}
        onClick={continueWithGoogle}
        type="button"
      >
        <Mail aria-hidden="true" className="size-4" />
        Continue with Google
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Update sign-in page layout**

Modify `app/auth/sign-in/page.tsx`:

- Keep `SparkleFinderNav`.
- Keep local preview section when `isLocalPreviewAuthEnabled()` returns true.
- Replace the right-side account-state card with `<SignInForm />`.
- Keep link to `/auth/sign-up`.
- Surface `message=check_email`, `error=missing_oauth_code`, and `error=oauth_exchange_failed` as short readable notices.

- [ ] **Step 4: Run route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: sign-in tests pass, preview auth tests still pass.

## Task 7: Google Sign-Up Entry And Account Completion

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\components\account\SignupForm.tsx`
- Create: `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\account-completion.ts`
- Modify: `C:\Users\louis\sparkle-finder-repo\app\account\page.tsx`
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\auth-routes.test.ts`
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Add account completion helper**

Create `lib/sparkle-finder/account-completion.ts`:

```ts
import type { CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";

export type AccountCompletionState = {
  isComplete: boolean;
  missingFields: string[];
};

export function getAccountCompletionState(accountState: CurrentSparkleFinderAccountState): AccountCompletionState {
  if (accountState.status !== "authenticated") {
    return { isComplete: false, missingFields: ["account"] };
  }

  const missingFields: string[] = [];

  if (!accountState.displayName?.trim() || accountState.displayName === "Guest") {
    missingFields.push("display name");
  }

  if (!accountState.email?.trim()) {
    missingFields.push("email");
  }

  if (!accountState.customer?.phoneE164?.trim()) {
    missingFields.push("phone");
  }

  if (!accountState.customer?.state?.trim()) {
    missingFields.push("state");
  }

  if (!accountState.communicationConsent.privacyAcknowledgedAt) {
    missingFields.push("privacy acknowledgment");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
```

- [ ] **Step 2: Add Google entry to sign-up form**

Modify `SignupForm.tsx` by adding a client-side Google button using the same callback pattern:

```tsx
async function continueWithGoogle() {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent("/account?setup=required")}`;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}
```

The button copy must be:

```text
Continue with Google
```

The explanatory copy must be:

```text
After Google sign-up, Sparkle Finder may ask for the remaining account details needed for your Silver trial.
```

- [ ] **Step 3: Ensure account page handles completion**

Modify `app/account/page.tsx` so authenticated users with missing required data see a completion panel before normal account controls. The completion panel must include:

```text
Complete your Sparkle Finder account
```

and:

```text
Google sign-in created your secure login. Add the remaining details needed for trial protection, account support, and privacy acknowledgment.
```

Reuse existing account/profile actions where possible. Do not create duplicate profile-write paths if existing account actions already update display name, phone, state, and consent.

- [ ] **Step 4: Add tests**

Add route tests:

```ts
it("renders Google sign-up with account-completion copy", async () => {
  const { default: SignUpPage } = await import("../../app/auth/sign-up/page");
  const markup = renderToStaticMarkup(createElement(SignUpPage));

  expect(markup).toContain("Continue with Google");
  expect(markup).toContain("remaining account details needed for your Silver trial");
});
```

Add helper tests:

```ts
it("marks authenticated accounts without required profile details as incomplete", async () => {
  const { getAccountCompletionState } = await import("../../lib/sparkle-finder/account-completion");
  const accountState = activeTrialAccountState();

  accountState.customer = {
    ...accountState.customer!,
    phoneE164: "",
    state: "",
  };
  accountState.communicationConsent.privacyAcknowledgedAt = null;

  expect(getAccountCompletionState(accountState)).toEqual({
    isComplete: false,
    missingFields: ["phone", "state", "privacy acknowledgment"],
  });
});
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
```

Expected: sign-up and account completion tests pass.

## Task 8: Improve Anonymous Hub Gate

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\app\(hub)\layout.tsx`
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Add route-aware sign-in wall copy**

Modify `HubSignInWall` so anonymous visitors see:

```text
Create a free Sparkle Finder account to open this tool.
```

Add CTA links:

```tsx
<Link href="/auth/sign-up">Start free Silver trial</Link>
<Link href="/auth/sign-in">Sign in</Link>
```

If route-aware `next` is added, preserve only safe relative paths:

```text
/auth/sign-in?next=/library
/auth/sign-up?next=/library
```

- [ ] **Step 2: Update anonymous gating tests**

Adjust existing anonymous gating test expectations:

```ts
expect(markup).toContain("Create a free Sparkle Finder account to open this tool.");
expect(markup).toContain("/auth/sign-up");
expect(markup).toContain("/auth/sign-in");
expect(markup).not.toContain("Finder Dashboard");
```

- [ ] **Step 3: Run route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: anonymous gating tests pass and still block hub content.

## Task 9: Deployment Documentation

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\docs\deployments\sparkle-finder-silver-auth-env-vars.md`

- [ ] **Step 1: Add Google OAuth config checklist**

Add a section:

```md
## Google OAuth for Sparkle Finder

Supabase Auth must have Google enabled before the `Continue with Google` button works outside local mocked tests.

Required Supabase Auth redirect URLs:

- `http://localhost:3000/api/auth/callback`
- `http://127.0.0.1:3000/api/auth/callback`
- Sparkle Finder production URL plus `/api/auth/callback`
- Any approved Vercel preview URL plus `/api/auth/callback` when preview OAuth testing is needed

Google Cloud OAuth:

- Create or reuse an OAuth client for Sparkle Finder web auth.
- Add the Supabase project callback URL shown in the Supabase Google provider screen to Google authorized redirect URIs.
- Store the Google Client ID and Client Secret only in Supabase provider configuration or approved server-side environment configuration.

App environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Do not expose Supabase service-role keys to the browser.
```

- [ ] **Step 2: Run docs-safe grep**

Run:

```powershell
rg "SERVICE_ROLE|service_role|SECRET|CLIENT_SECRET" C:\Users\louis\sparkle-finder-repo\app C:\Users\louis\sparkle-finder-repo\components
```

Expected: no client-side service-role or client-secret references.

## Task 10: Full Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 2: Run unit tests**

Run:

```powershell
npm run test
```

Expected: pass.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: pass.

- [ ] **Step 4: Browser QA**

Open local server at:

```text
http://127.0.0.1:3000/
```

Verify desktop and mobile:

- Homepage matches selected first concept.
- Header and footer use dark plum/espresso brand treatment.
- Sparkle Finder wordmark is bright pink where intended.
- Public homepage does not show live jewelry cards or fixture item data.
- Disclaimer is visible and readable.
- `Start free Silver trial` opens `/auth/sign-up`.
- `Sign in` opens `/auth/sign-in`.
- `/library` while anonymous shows the account gate instead of library results.
- `/auth/sign-in` shows email/password and Google.
- `/auth/sign-up` shows password, magic link, and Google.
- No console errors.
- Text does not overlap at mobile widths.

- [ ] **Step 5: Smoke test if available**

Run:

```powershell
npm run smoke:sparkle-finder
```

Expected: pass, or report exact smoke failures if the script depends on auth provider configuration.

## Task 11: Final Review And Handoff

**Files:**
- Review: all changed files from `git status --short`

- [ ] **Step 1: Show changed files**

Run:

```powershell
git -C C:\Users\louis\sparkle-finder-repo status --short
```

Expected: only Sparkle Finder landing/auth/gating/docs/tests files plus previously known in-progress files.

- [ ] **Step 2: Summarize verification**

Final implementation report must include:

- Landing page files changed.
- Auth files changed.
- Google OAuth config status.
- Account-completion behavior for Google users.
- Tests run and results.
- Build result.
- Browser QA result.
- Any provider/dashboard work Louis still needs to approve or complete.

- [ ] **Step 3: Commit only with Louis approval**

Do not commit automatically. If Louis approves a commit, use a focused message:

```powershell
git -C C:\Users\louis\sparkle-finder-repo add app components lib tests docs
git -C C:\Users\louis\sparkle-finder-repo commit -m "feat: add public landing and Google auth"
```

Expected: commit succeeds on `codex-sparkle-finder-v1`.

## Execution Options

After Louis approves this lockdown plan:

1. **Subagent-Driven recommended**
   - Landing/UI sub-agent.
   - Auth sub-agent.
   - QA sub-agent.
   - Primary agent reviews and integrates each result.

2. **Inline Execution**
   - One agent executes tasks in order.
   - Checkpoints after landing, auth, account completion, and full verification.

Recommended path: Subagent-driven if tools are available, otherwise inline execution with checkpoints.
