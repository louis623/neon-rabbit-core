# Sparkle Suite Calendar Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sparkle Suite native calendar production-ready by hardening nationwide timezone behavior, route validation, Nic-Nac prompt/test drift, targeted public-site event hydration, and signed-in end-to-end smoke.

**Architecture:** Keep the calendar source of truth in Supabase `calendar_events`, storing each show as a UTC instant plus the rep/event IANA timezone that defines the host-facing time. Nic-Nac remains the write surface, the workspace Calendar formats show times in the rep/event timezone, and the customer Amethyst homepage formats show times in the viewer browser timezone. Use tests to cover timezone conversion, route/tool/public-site wiring, and browser smoke before calling the calendar launch-ready.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Supabase, Vercel AI SDK tools, Browser plugin for local UI smoke.

---

## File Structure

- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\calendar-summary\route.ts`
  - Owns signed-in workspace Calendar summary route validation and response, including rep timezone metadata.
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-calendar-summary-route.test.ts`
  - Covers valid limits, invalid limits, route auth, and calendar service calls.
- Create: `C:\Users\louis\sparkle-suite-repo\supabase\migrations\<timestamp>_ss_calendar_timezones.sql`
  - Adds timezone columns/defaults needed for rep-host and event-host timezone display.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
  - Adds calendar timezone fields to service input/output types.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\calendar.ts`
  - Stores and returns event timezone and, if local date/time fields are added, converts local show time to a UTC instant.
- Create: `C:\Users\louis\sparkle-suite-repo\lib\services\calendar-timezone.ts`
  - Owns timezone validation and deterministic timezone formatting/conversion helpers.
- Create: `C:\Users\louis\sparkle-suite-repo\tests\services\calendar-timezone.test.ts`
  - Proves Eastern host time and Central viewer time behavior around normal and DST-sensitive dates.
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-tools.test.ts`
  - Covers calendar tool execution, registry exposure, approval copy, and calendar prompt references.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\system-prompt.ts`
  - Removes stale fixed tool-count wording and keeps calendar capability copy current.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\add-show.ts`
  - Accepts/forwards timezone-aware event fields so Nic-Nac can schedule local rep times safely.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\update-show.ts`
  - Preserves or updates timezone-aware event fields when a rep moves a show.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\me\route.ts`
  - Returns rep timezone so the workspace can display host-facing times.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\supabase\auth.ts`
  - Selects rep timezone in authenticated rep context.
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-targeted-site-data-scrub.test.ts`
  - Adds targeted public-site proof that real calendar events hydrate and demo events stay out.
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-homepage-template.test.ts`
  - Adds static source assertions for clean event-card behavior and text separators if needed after browser/source review.
- Use during smoke: `C:\Users\louis\sparkle-suite-repo\public\amethyst\homepage.jsx`
  - Browser-verify existing rendered Add to Calendar, discount, collection, and watch-link behavior.
- Use during smoke: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Browser-verify existing workspace Calendar tab rendering.

## P0 Timezone Finding

The current calendar already stores show time as a single `TIMESTAMPTZ`/ISO instant, which is the right core model for nationwide viewers. The customer homepage also uses `Intl.DateTimeFormat(undefined, ...)`, so it is intended to render the event in the viewer's local browser timezone.

The current launch blocker is the host/rep timezone side:

- `reps` does not currently store an IANA timezone such as `America/New_York`.
- `calendar_events` does not currently store the timezone that defined the show when the rep scheduled it.
- The workspace Calendar formats event dates/times with `timeZone: 'UTC'`, which can show the wrong day/time for the rep.
- The smoke plan must explicitly prove an Eastern-hosted show displays as Central time for a Chicago viewer.

Production-ready acceptance example:

- Rep schedules: June 6, 2026 at 8:00 PM `America/New_York`.
- Stored instant: `2026-06-07T00:00:00.000Z`.
- Rep workspace display: `Jun 6 at 8:00 PM EDT` or equivalent Eastern host label.
- Chicago/customer public site display: `Jun 6 at 7:00 PM CDT` when browser timezone is `America/Chicago`.
- Add-to-Calendar `.ics`: stores UTC `DTSTART:20260607T000000Z`, so the customer's calendar app can localize correctly.

## Task 1: Baseline The Calendar Readiness Surface

**Files:**
- Read: `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\calendar-summary\route.ts`
- Read: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-calendar-summary-route.test.ts`
- Read: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-tools.test.ts`
- Read: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-targeted-site-data-scrub.test.ts`

- [ ] **Step 1: Confirm workbench and protect existing changes**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo status --short
```

Expected: existing unrelated modified files may be present. Do not revert them. Only stage files changed by this calendar readiness work.

- [ ] **Step 2: Re-run the focused calendar suite**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac-calendar-summary-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/amethyst-homepage-upcoming-shows.test.ts tests/amethyst-homepage-template.test.ts tests/pre-show-reminders-route.test.ts tests/services/pre-show-reminders.test.ts
```

Expected before fixes: one stale failure in `tests/nic-nac/calendar-tools.test.ts` for a hard-coded tool count. Calendar service, workspace route, dashboard render, homepage hydration, and reminder tests should otherwise pass.

## Task 2: Add Calendar Timezone Persistence

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\supabase\migrations\<timestamp>_ss_calendar_timezones.sql`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\supabase\auth.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\me\route.ts`

- [ ] **Step 1: Add migration**

Create a migration with this shape:

```sql
alter table public.reps
  add column if not exists time_zone text not null default 'America/New_York';

alter table public.calendar_events
  add column if not exists time_zone text not null default 'America/New_York';

alter table public.reps
  add constraint reps_time_zone_not_blank
  check (length(trim(time_zone)) > 0)
  not valid;

alter table public.calendar_events
  add constraint calendar_events_time_zone_not_blank
  check (length(trim(time_zone)) > 0)
  not valid;
```

Expected: existing reps/events get a launch-safe Eastern default. Later onboarding can refine the value per rep.

- [ ] **Step 2: Update calendar types**

In `lib\services\types.ts`, add `timeZone` to `CalendarEvent`, `AddShowInput`, and `UpdateShowInput`:

```ts
export interface CalendarEvent {
  id: string
  repId: string
  platform: string
  eventTime: string
  timeZone: string
  durationMinutes: number
  title: string | null
  description: string | null
  discountCodes: DiscountCode[]
  featuredCollections: string[] | null
  isRecurring: boolean
  recurrenceGroupId: string | null
  recurrenceRule: string | null
  status: EventStatus
  createdAt: string
  updatedAt: string
}

export interface AddShowInput {
  platform: string
  eventTime: string
  timeZone?: string
  durationMinutes?: number
  title?: string
  description?: string
  discountCodes?: DiscountCode[]
  featuredCollections?: string[]
  recurring?: RecurringShowInput
}

export interface UpdateShowInput {
  platform?: string
  eventTime?: string
  timeZone?: string
  durationMinutes?: number
  title?: string
  description?: string
  discountCodes?: DiscountCode[]
  featuredCollections?: string[]
  applyToSeries?: boolean
}
```

- [ ] **Step 3: Return rep timezone from auth/me**

Update the `reps` select in `lib\supabase\auth.ts` to include `time_zone` and add `time_zone: string` to the authenticated rep type.

Update `app\api\nic-nac\me\route.ts` to return:

```ts
time_zone: rep.time_zone,
```

Expected: workspace can display host-facing calendar times without guessing.

- [ ] **Step 4: Add tests for `/api/nic-nac/me` if missing**

If there is no current `me` route test, add or extend one to assert:

```ts
expect(body.rep.time_zone).toBe('America/New_York')
```

Expected: rep timezone is part of the signed-in workspace profile payload.

## Task 3: Add Calendar Timezone Helpers And Service Support

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\lib\services\calendar-timezone.ts`
- Create: `C:\Users\louis\sparkle-suite-repo\tests\services\calendar-timezone.test.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\calendar.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-service.test.ts`

- [ ] **Step 1: Create timezone helper tests**

Create `tests\services\calendar-timezone.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  assertValidTimeZone,
  formatEventTimeForZone,
} from '@/lib/services/calendar-timezone'

describe('calendar timezone helpers', () => {
  it('formats an Eastern-hosted show in Eastern for the rep and Central for a Chicago viewer', () => {
    const eventTime = '2026-06-07T00:00:00.000Z'

    expect(formatEventTimeForZone(eventTime, 'America/New_York')).toContain('8:00 PM')
    expect(formatEventTimeForZone(eventTime, 'America/New_York')).toMatch(/EDT|Eastern/)
    expect(formatEventTimeForZone(eventTime, 'America/Chicago')).toContain('7:00 PM')
    expect(formatEventTimeForZone(eventTime, 'America/Chicago')).toMatch(/CDT|Central/)
  })

  it('rejects invalid timezone names', () => {
    expect(() => assertValidTimeZone('Eastern Standard Time')).toThrow(
      'timeZone must be a valid IANA timezone',
    )
    expect(() => assertValidTimeZone('America/New_York')).not.toThrow()
  })
})
```

- [ ] **Step 2: Implement timezone helpers**

Create `lib\services\calendar-timezone.ts`:

```ts
export const DEFAULT_REP_TIME_ZONE = 'America/New_York'

export function assertValidTimeZone(timeZone: string | undefined): string {
  const normalized = timeZone?.trim() || DEFAULT_REP_TIME_ZONE

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date())
  } catch {
    throw new Error('timeZone must be a valid IANA timezone')
  }

  return normalized
}

export function formatEventTimeForZone(eventTime: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(new Date(eventTime))
}

export function formatEventDateForZone(eventTime: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(eventTime))
}
```

- [ ] **Step 3: Add `time_zone` to calendar service select/map/insert/update**

In `lib\services\calendar.ts`:

- Add `time_zone` to `EVENT_SELECT`.
- Add `time_zone: string | null` to `CalendarEventRow`.
- Map `timeZone: row.time_zone ?? DEFAULT_REP_TIME_ZONE`.
- Insert `time_zone: assertValidTimeZone(input.timeZone)` in `addShow`.
- Carry `time_zone` for recurring event rows.
- Allow `updateShow` to patch `time_zone` when `patch.timeZone !== undefined`.

Expected: every returned `CalendarEvent` has a `timeZone`.

- [ ] **Step 4: Update calendar service tests**

In `tests\nic-nac\calendar-service.test.ts`, update row fixtures to include:

```ts
time_zone: 'America/New_York',
```

Add assertions that inserted rows include:

```ts
time_zone: 'America/New_York',
```

Expected: service proves the timezone survives create/list/update paths.

- [ ] **Step 5: Run timezone and service tests**

Run:

```powershell
npm exec vitest run tests/services/calendar-timezone.test.ts tests/nic-nac/calendar-service.test.ts
```

Expected: timezone helper and calendar service tests pass.

## Task 4: Format Workspace Calendar In Rep/Event Timezone

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Replace UTC formatting with event timezone formatting**

In `DashboardPlaceholder.tsx`, update calendar date-key, date, and time formatters to accept the event timezone. For event display functions, use:

```ts
function formatCalendarEventDate(eventTime: string, timeZone = 'America/New_York') {
  return new Date(eventTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  })
}

function formatCalendarEventTime(eventTime: string, timeZone = 'America/New_York') {
  return new Date(eventTime).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
}
```

When rendering an event row, call:

```tsx
{formatCalendarEventDate(event.eventTime, event.timeZone)} at{' '}
{formatCalendarEventTime(event.eventTime, event.timeZone)} on {event.platform}
```

Expected: rep workspace no longer shows UTC for calendar events.

- [ ] **Step 2: Add an Eastern host display test**

In `tests\nic-nac-dashboard-placeholder.test.ts`, set a fixture event:

```ts
eventTime: '2026-06-07T00:00:00.000Z',
timeZone: 'America/New_York',
title: 'Eastern smoke show',
```

Assert the rendered workspace Calendar contains:

```ts
expect(html).toContain('Eastern smoke show')
expect(html).toContain('8:00 PM')
expect(html).toMatch(/EDT|Eastern/)
```

Expected: the workspace shows host timezone, not UTC.

- [ ] **Step 3: Run dashboard tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: dashboard Calendar tests pass.

## Task 5: Format Customer Site In Viewer Timezone And Test Chicago Viewer

**Files:**
- Modify only if needed: `C:\Users\louis\sparkle-suite-repo\public\amethyst\homepage.jsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-homepage-template.test.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-targeted-site-data-scrub.test.ts`

- [ ] **Step 1: Preserve viewer-local customer formatting**

Confirm `public\amethyst\homepage.jsx` continues using:

```js
new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
}).format(parsed);
```

Do not set a fixed timezone on the customer homepage. The customer's browser locale/timezone should drive the visible time.

- [ ] **Step 2: Add targeted event fixture with Eastern host instant**

In `tests\amethyst-targeted-site-data-scrub.test.ts`, make the targeted fixture use:

```ts
eventTime: '2026-06-07T00:00:00.000Z',
timeZone: 'America/New_York',
title: 'Eastern Host Chicago Viewer Smoke',
```

Expected: the bootstrap carries the UTC instant and event timezone metadata.

- [ ] **Step 3: Add static source assertions**

In `tests\amethyst-homepage-template.test.ts`, assert:

```ts
expect(jsx).toContain('Intl.DateTimeFormat(undefined')
expect(jsx).toContain('timeZoneName: "short"')
expect(jsx).not.toContain('timeZone: "UTC"')
```

Expected: customer homepage remains viewer-local.

- [ ] **Step 4: Run customer-site tests**

Run:

```powershell
npm exec vitest run tests/amethyst-targeted-site-data-scrub.test.ts tests/amethyst-homepage-template.test.ts tests/amethyst-homepage-upcoming-shows.test.ts
```

Expected: targeted event data includes the event instant/timezone and customer homepage source remains viewer-local.

## Task 6: Update Nic-Nac Calendar Tool Instructions For Timezones

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\add-show.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\update-show.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\prompt-builder.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\system-prompt.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-tools.test.ts`

- [ ] **Step 1: Add optional `timeZone` to add/update tool schemas**

In both calendar write tools, add:

```ts
timeZone: z.string().optional(),
```

Forward `timeZone` to the calendar service.

- [ ] **Step 2: Update prompt copy**

Add this timezone rule to the calendar prompt section:

```text
- Calendar times must be timezone-explicit. If the rep gives a local show time, use the rep/event IANA timezone such as America/New_York, America/Chicago, America/Denver, America/Los_Angeles, America/Phoenix, America/Anchorage, or Pacific/Honolulu. If the timezone is missing and you cannot infer it from the rep profile or the rep's own words, ask one short question before scheduling.
- The rep workspace shows show times in the rep/event timezone. The customer site shows show times in the viewer's local browser timezone.
```

- [ ] **Step 3: Add calendar tool tests**

In `tests\nic-nac\calendar-tools.test.ts`, add assertions that `makeAddShowTool` forwards:

```ts
timeZone: 'America/New_York',
eventTime: '2026-06-07T00:00:00.000Z',
```

to `addShow`.

Expected: Nic-Nac tooling carries timezone metadata through to the service.

- [ ] **Step 4: Run calendar tool tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-tools.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/tool-routing.test.ts
```

Expected: calendar tools route and preserve timezone data.

## Task 7: Harden Calendar Summary Route Limits

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-calendar-summary-route.test.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\calendar-summary\route.ts`

- [ ] **Step 1: Write failing tests for partial, decimal, zero, and oversized limits**

Add these tests to `tests\nic-nac-calendar-summary-route.test.ts` after the existing invalid-limit tests:

```ts
  it.each([
    ['upcoming', '8abc'],
    ['upcoming', '1.5'],
    ['upcoming', '0'],
    ['upcoming', '-1'],
    ['upcoming', '21'],
    ['history', '4abc'],
    ['history', '2.5'],
    ['history', '0'],
    ['history', '-1'],
    ['history', '21'],
  ])('returns 400 when %s has invalid limit %s', async (key, value) => {
    const response = await GET(
      new Request(`http://localhost/api/nic-nac/calendar-summary?${key}=${value}`),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: `${key} must be a whole number between 1 and 20.`,
    })
    expect(listMyShowsMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 2: Run the route test and verify it fails**

Run:

```powershell
npm exec vitest run tests/nic-nac-calendar-summary-route.test.ts
```

Expected: values like `8abc` and `1.5` currently pass parsing or produce the old error message, so the new test fails.

- [ ] **Step 3: Replace permissive parsing with strict validation**

In `app\api\nic-nac\calendar-summary\route.ts`, replace `readLimit` and the two error messages with:

```ts
const MAX_CALENDAR_SUMMARY_LIMIT = 20
const WHOLE_NUMBER_PATTERN = /^[1-9]\d*$/

function readLimit(url: URL, key: string) {
  const raw = url.searchParams.get(key)
  if (!raw) return undefined
  if (!WHOLE_NUMBER_PATTERN.test(raw)) return null

  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed > MAX_CALENDAR_SUMMARY_LIMIT) {
    return null
  }

  return parsed
}

function limitError(key: string) {
  return `${key} must be a whole number between 1 and ${MAX_CALENDAR_SUMMARY_LIMIT}.`
}
```

Then update the two JSON error responses to:

```ts
{ error: limitError('upcoming') }
```

and:

```ts
{ error: limitError('history') }
```

- [ ] **Step 4: Update existing invalid-limit assertions**

Change the existing `upcoming=nope` and `history=nope` test expectations to:

```ts
{
  error: 'upcoming must be a whole number between 1 and 20.',
}
```

and:

```ts
{
  error: 'history must be a whole number between 1 and 20.',
}
```

- [ ] **Step 5: Run the route test and verify it passes**

Run:

```powershell
npm exec vitest run tests/nic-nac-calendar-summary-route.test.ts
```

Expected: all calendar summary route tests pass.

## Task 8: Fix Nic-Nac Calendar Tool Registry And Prompt Drift

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-tools.test.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\system-prompt.ts`

- [ ] **Step 1: Replace brittle registry count test**

In `tests\nic-nac\calendar-tools.test.ts`, replace the `buildAllTools now exposes 33 tools including the four calendar tools` test with:

```ts
  it('buildAllTools exposes the four calendar tools without duplicate registry names', () => {
    const tools = buildAllTools(makeCtx())
    const names = Object.keys(tools).sort()

    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(expect.arrayContaining([
      'add_show',
      'list_my_shows',
      'update_show',
      'cancel_show',
    ]))
  })
```

- [ ] **Step 2: Run the calendar tools test and verify the count failure is gone**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-tools.test.ts
```

Expected before prompt copy changes: the count assertion is gone. Any remaining failure points at stale prompt text that needs to be made count-free.

- [ ] **Step 3: Remove the stale fixed tool-count wording from the system prompt**

In `lib\nic-nac\system-prompt.ts`, replace:

```ts
You have twenty-nine tools available right now:
```

with:

```ts
You have a scoped set of workspace tools available when the rep's request calls for them:
```

- [ ] **Step 4: Update prompt assertions**

In `tests\nic-nac\calendar-tools.test.ts`, replace:

```ts
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('You have twenty-nine tools available right now:')
```

with:

```ts
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      "You have a scoped set of workspace tools available when the rep's request calls for them:",
    )
```

Search for the same stale text in the repo:

```powershell
rg -n "twenty-nine tools|33 tools" tests lib app
```

Update any remaining assertions that depend on the stale fixed count to assert meaningful capability names or routing behavior instead.

- [ ] **Step 5: Run the prompt and routing tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-tools.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac/send-sms-notification.test.ts
```

Expected: tests pass, calendar tool exposure is proven, and no stale fixed tool-count copy remains.

## Task 9: Add Targeted Public-Site Calendar Event Coverage

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-targeted-site-data-scrub.test.ts`

- [ ] **Step 1: Add a targeted real-event fixture**

Near `cleanTemplateData`, add this fixture:

```ts
const cleanCalendarEvents = [
  {
    id: 'clean-event-1',
    title: 'Clean Smoke Friday Reveal',
    description: 'Fresh live reveal with smoke-test discounts.',
    eventTime: '2099-06-06T20:00:00.000Z',
    durationMinutes: 60,
    featured: true,
    codes: [{ code: 'CLEAN10', desc: '10% off smoke-test favorites' }],
    collections: [
      {
        label: 'Clean Smoke Picks',
        href: '/amethyst/Trade.html?collection=Clean%20Smoke%20Picks',
      },
    ],
    platforms: [
      {
        kind: 'tt',
        label: 'Join me on TikTok',
        href: 'https://tiktok.example/@clean',
      },
    ],
  },
]
```

- [ ] **Step 2: Add a test proving targeted homepage bootstrap carries real calendar events**

Add this test before `does not leak demo data in targeted trade bootstrap data`:

```ts
  it('hydrates targeted homepage bootstrap data with that rep calendar events', async () => {
    mocks.loadAmethystHomepageUpcomingShows.mockResolvedValueOnce(cleanCalendarEvents)

    const response = await getHomepageTemplate(
      new Request('https://preview.example/api/amethyst/homepage-template?c=rep-clean'),
    )
    const script = await response.text()

    expect(mocks.loadAmethystHomepageUpcomingShows).toHaveBeenCalledWith({
      repId: 'rep-clean',
      targeted: true,
    })
    expect(script).toContain('window.AMETHYST_HOMEPAGE_EVENTS')
    expect(script).toContain('Clean Smoke Friday Reveal')
    expect(script).toContain('CLEAN10')
    expect(script).toContain('Clean Smoke Picks')
    expect(script).toContain('https://tiktok.example/@clean')
    expect(script).toContain('"showEvents":true')
    expect(script).toContain('"eventCount":1')
    expectNoDemoCustomerData(script)
  })
```

- [ ] **Step 3: Preserve the empty-targeted-site test**

Confirm the existing test still asserts:

```ts
expect(script).toContain('window.AMETHYST_HOMEPAGE_EVENTS = []')
expectNoDemoCustomerData(script)
```

This is important because targeted rep pages with no shows must not display demo show cards.

- [ ] **Step 4: Run targeted public-site tests**

Run:

```powershell
npm exec vitest run tests/amethyst-targeted-site-data-scrub.test.ts tests/amethyst-homepage-upcoming-shows.test.ts tests/amethyst-homepage-template.test.ts
```

Expected: targeted homepage event hydration passes, empty targeted pages remain clean, and static homepage event-card behavior remains wired.

## Task 10: Source-Check Customer Event Rendering

**Files:**
- Modify only if source check fails: `C:\Users\louis\sparkle-suite-repo\public\amethyst\homepage.jsx`
- Modify only if source check fails: `C:\Users\louis\sparkle-suite-repo\tests\amethyst-homepage-template.test.ts`

- [ ] **Step 1: Search for encoding artifacts in rendered event text source**

Run:

```powershell
rg -n "Â|Ã|â€”|Ã¢|Â·" public/amethyst/homepage.jsx public/amethyst/homepage.css tests/amethyst-homepage-template.test.ts
```

Expected: event-card source should not contain mojibake artifacts in user-visible strings. ASCII-safe separators are acceptable for launch.

- [ ] **Step 2: If artifacts appear in user-visible event strings, replace them with ASCII-safe text**

For event-date separators in `public\amethyst\homepage.jsx`, prefer:

```js
? `${formatEventDateLabel(eventTime)} - ${formatEventTimeLabel(eventTime)}`
: "Date TBD - Time TBD");
```

For splitting the visible label, prefer:

```js
const [dateStr, timeStr = ""] = ev.when.split(" - ");
```

For discount text, prefer:

```jsx
<span className="dash"> - </span>
```

- [ ] **Step 3: Add source assertions when text is changed**

In `tests\amethyst-homepage-template.test.ts`, extend the existing `hydrates the locked homepage events from runtime data` test with:

```ts
    expect(jsx).toContain('Date TBD - Time TBD')
    expect(jsx).toContain('ev.when.split(" - ")')
    expect(jsx).not.toContain('Â')
    expect(jsx).not.toContain('Ã')
```

- [ ] **Step 4: Run homepage tests**

Run:

```powershell
npm exec vitest run tests/amethyst-homepage-template.test.ts tests/amethyst-homepage.test.ts
```

Expected: customer homepage source checks pass.

## Task 11: Run Full Focused Calendar Readiness Tests

**Files:**
- No file edits in this task.

- [ ] **Step 1: Run focused readiness suite**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac-calendar-summary-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/amethyst-targeted-site-data-scrub.test.ts tests/amethyst-homepage-upcoming-shows.test.ts tests/amethyst-homepage-template.test.ts tests/amethyst-homepage.test.ts tests/pre-show-reminders-route.test.ts tests/services/pre-show-reminders.test.ts
```

Expected: all focused calendar, workspace, public site, and reminder tests pass.

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: Next.js build completes without TypeScript or route errors.

## Task 12: Signed-In End-To-End Browser Smoke

**Files:**
- No file edits in this task.
- Use Browser plugin against local app.
- Use implementation workbench: `C:\Users\louis\sparkle-suite-repo`.

- [ ] **Step 1: Start or reuse the local dev server**

Run only when the app is not already serving `http://localhost:3000`:

```powershell
npm run dev
```

Expected: app serves locally on port 3000 or the already-running server remains available.

- [ ] **Step 2: Open the workspace Calendar tab**

Open:

```text
http://localhost:3000/nic-nac?section=show-calendar&conversationId=calendar-smoke
```

Expected: signed-in workspace loads and the Calendar section shows either existing events or the empty upcoming state. No console errors.

- [ ] **Step 3: Ask Nic-Nac to create a distinctive future show**

Use this signed-in workspace message:

```text
Please add a one-time TikTok show to my calendar for today at 5:30 PM Eastern called Calendar Smoke Reveal 2026-06-06. Description: Smoke test for the live calendar. Discount code SMOKE10 means 10% off smoke-test favorites. Featured collection: Smoke Test Picks. Duration: 60 minutes.
```

Expected: Nic-Nac calls `add_show` and confirms the scheduled event. If 5:30 PM Eastern has already passed, use tomorrow at 5:30 PM Eastern in the same message.

- [ ] **Step 4: Verify workspace calendar display**

Reload or revisit:

```text
http://localhost:3000/nic-nac?section=show-calendar&conversationId=calendar-smoke
```

Expected:
- Upcoming count increases.
- The month grid shows `Calendar Smoke Reveal 2026-06-06`.
- Next Up shows the title, date/time, timezone abbreviation, and platform.

- [ ] **Step 4b: Verify the explicit Eastern/Central timezone smoke**

Create or use an event representing `8:00 PM America/New_York`, stored as:

```text
2026-06-07T00:00:00.000Z
```

Workspace expected result:

```text
8:00 PM EDT
```

Public site expected result under a Chicago browser timezone:

```text
7:00 PM CDT
```

Use Playwright or Browser automation with a Chicago timezone context when possible:

```ts
const context = await browser.newContext({ timezoneId: 'America/Chicago' })
```

- [ ] **Step 5: Verify workspace summary route**

Open:

```text
http://localhost:3000/api/nic-nac/calendar-summary?upcoming=8&history=4
```

Expected JSON includes:

```json
"title":"Calendar Smoke Reveal 2026-06-06"
```

and:

```json
"discountCodes":[{"code":"SMOKE10","description":"10% off smoke-test favorites"}]
```

- [ ] **Step 6: Verify customer-facing site by public slug**

Open the signed-in rep's customer-facing slug route, for example:

```text
http://localhost:3000/<rep-show-slug>
```

Expected:
- The public homepage loads through the slug, not the workspace route.
- Upcoming Shows section appears.
- `Calendar Smoke Reveal 2026-06-06` appears.
- `SMOKE10` appears.
- `Smoke Test Picks` appears and links to the Amethyst Trade page with a collection query.
- A TikTok watch button appears when the rep has a TikTok streaming link saved.
- `Add to calendar` appears.
- No demo event names like `Unicorn Magic Drop` appear on the targeted rep page.

- [ ] **Step 7: Verify Add to Calendar**

Click `Add to calendar`.

Expected downloaded `.ics` contains:

```text
SUMMARY:Calendar Smoke Reveal 2026-06-06
DESCRIPTION:Smoke test for the live calendar.
DTSTART:20260607T000000Z
DTEND:
```

and includes the discount code text.

- [ ] **Step 8: Verify mobile layout**

Use Browser mobile viewport on the same public slug page.

Expected:
- Event title, discount row, collection pill, watch link, and Add to Calendar button do not overlap.
- The event card remains readable without horizontal scrolling.

- [ ] **Step 9: Cancel or leave the smoke event by decision**

For a clean test account, ask Nic-Nac:

```text
Cancel the Calendar Smoke Reveal 2026-06-06 show.
```

Expected: approval dialog appears because `cancel_show` requires approval. Approve it for cleanup. The public site should no longer show the cancelled event as upcoming; the workspace recent panel should list it as cancelled.

## Task 13: Provider-Safe Reminder Smoke

**Files:**
- No file edits in this task.

- [ ] **Step 1: Run only dry-run reminder route**

Use the configured cron secret in the local environment and call the non-live route:

```powershell
curl.exe -H "Authorization: Bearer $env:SPARKLE_SHOW_REMINDER_CRON_SECRET" "http://localhost:3000/api/internal/show-reminders/pre-show?mode=dry-run&limit=10"
```

Expected:
- Route returns a dry-run response.
- It does not send live SMS.
- It reports planned reminders only for events inside the configured lead window.

- [ ] **Step 2: Confirm live route is not used**

Do not call:

```text
/api/internal/show-reminders/pre-show/live
```

unless Louis explicitly approves live SMS send testing.

## Task 14: Final Verification And Status Update

**Files:**
- Update after execution: `C:\Users\louis\sparkle-suite\docs\superpowers\plans\2026-06-06-sparkle-suite-calendar-production-readiness.md`
- Update after execution through connectors: Open Brain and Headquarters Sparkle Suite status.

- [ ] **Step 1: Record test/build/smoke results in this plan**

Append a short execution note with:

```md
## Execution Results

- Focused calendar readiness tests:
- Build:
- Signed-in workspace smoke:
- Rep timezone display smoke:
- Customer-facing viewer-local timezone smoke:
- Customer-facing site smoke:
- Add to Calendar smoke:
- Reminder dry-run:
- Cleanup:
```

- [ ] **Step 2: Check final git status**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo status --short
```

Expected: only intentional calendar readiness files plus prior unrelated uncommitted work remain modified.

- [ ] **Step 3: Update Open Brain and Headquarters**

Record:
- calendar production-readiness fixes completed
- focused tests and build result
- signed-in smoke result
- remaining launch caveats

- [ ] **Step 4: Commit only when Louis asks or the current dirty worktree is intentionally included**

Safe staging command for this calendar-only work:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add app/api/nic-nac/calendar-summary/route.ts tests/nic-nac-calendar-summary-route.test.ts tests/nic-nac/calendar-tools.test.ts lib/nic-nac/system-prompt.ts tests/amethyst-targeted-site-data-scrub.test.ts tests/amethyst-homepage-template.test.ts public/amethyst/homepage.jsx
```

Commit command when approved:

```powershell
git -C C:\Users\louis\sparkle-suite-repo commit -m "fix: harden calendar production readiness"
```

Expected: staged files are intentional calendar readiness changes only.

## Execution Results

- Focused calendar readiness tests: PASS, 136 tests across 12 suites.
- Build: PASS, `npm run build`.
- Signed-in workspace smoke: BLOCKED until Supabase migration `20260606111500_ss_calendar_timezones.sql` is applied. Current CLI session cannot link to the project; `supabase link --project-ref bqhzfkgkjyuhlsozpylf` returned `Unauthorized`.
- Rep timezone display smoke: covered by unit render test; browser smoke pending database migration.
- Customer-facing viewer-local timezone smoke: covered by homepage source tests and targeted payload tests; browser smoke pending database migration.
- Customer-facing site smoke: pending database migration.
- Add to Calendar smoke: pending browser smoke.
- Reminder dry-run: local tests pass; live route/dry-run endpoint smoke pending database migration.
- Cleanup: no smoke event created because database migration is not applied yet.
