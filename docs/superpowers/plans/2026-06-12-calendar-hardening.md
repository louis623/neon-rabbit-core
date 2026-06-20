# Calendar Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten Sparkle Suite calendar reliability by fixing recurring-series time edits, adding explicit show start/end status transitions, hardening pre-show reminder delivery, and preparing the calendar for safer rep/customer use.

**Architecture:** Calendar data stays in `public.calendar_events` and the shared service layer remains the source of truth. Nic-Nac tools, dashboard summary, public Amethyst show cards, Sparkle Finder live-show discovery, and reminder jobs should all call the same service-layer behavior. Execution must happen from `C:\Users\louis\sparkle-suite-repo`; this binder file is only a plan/handoff.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/Postgres, Vitest, Vercel, GitHub Actions, Telnyx SMS.

---

## File Structure

- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\calendar.ts`
  - Own calendar business rules: add/list/update/cancel/start/end, recurrence generation, status transitions.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
  - Add result/input types for show status transitions if needed.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\errors.ts`
  - Add explicit user-facing errors for invalid series time updates and invalid status transitions.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\start-show-session.ts`
  - Keep current-show memory behavior, but make it able to mark a linked calendar event live when an event id is present.
- Create or modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\end-show.ts`
  - Add a Nic-Nac tool to finish a calendar show and close the show session.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\index.ts`
  - Register any new calendar tool names.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\system-prompt.ts`
  - Teach Nic-Nac the start/end show workflow and guardrails.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\prompt-builder.ts`
  - Keep routed prompt copy aligned with system prompt.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\pre-show-reminders.ts`
  - Return clearer live/no-op status and expose duplicate-send results cleanly.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\message-send-limits.ts`
  - Keep duplicate checks, but rely on DB uniqueness for final enforcement once migration exists.
- Create: `C:\Users\louis\sparkle-suite-repo\supabase\migrations\YYYYMMDDHHMMSS_calendar_reminder_unique_keys.sql`
  - Add a database-level unique index for automated reminder sends.
- Modify: `C:\Users\louis\sparkle-suite-repo\.github\workflows\sparkle-pre-show-reminders.yml`
  - Make missing production reminder secret fail loudly or emit a clear operator signal.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Add status clarity for live/completed calendar events, and optionally surface “Ask Nic-Nac to start/end show” guidance.
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-service.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\calendar-tools.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\show-session-tools.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\services\pre-show-reminders.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\services\message-send-limits.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\vercel-cron-config.test.ts`
- Test: create `C:\Users\louis\sparkle-suite-repo\tests\calendar-reminder-unique-keys-migration.test.ts`

---

### Task 1: Block Unsafe Series Time Updates

**Files:**
- Modify: `lib/services/calendar.ts`
- Modify: `lib/services/errors.ts`
- Test: `tests/nic-nac/calendar-service.test.ts`

- [ ] **Step 1: Write the failing service test**

Add this case to `tests/nic-nac/calendar-service.test.ts`:

```ts
it('updateShow rejects eventTime when applying a patch to a recurring series', async () => {
  const current = makeSelectSingleChain({
    data: baseRow({
      id: 'event-1',
      recurrence_group_id: 'group-1',
      is_recurring: true,
      recurrence_rule: 'weekly',
    }),
    error: null,
  })
  const supabase = {
    from: vi.fn(() => ({ select: vi.fn(() => current.chain) })),
  } as never

  await expect(
    updateShow(supabase, 'rep-1', 'event-1', {
      eventTime: '2099-06-01T20:00:00.000Z',
      applyToSeries: true,
    }),
  ).rejects.toMatchObject({
    code: 'SERIES_TIME_UPDATE_UNSUPPORTED',
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts
```

Expected: test fails because `SERIES_TIME_UPDATE_UNSUPPORTED` does not exist yet.

- [ ] **Step 3: Add the service error**

In `lib/services/errors.ts`, add a new error factory near the calendar errors:

```ts
SERIES_TIME_UPDATE_UNSUPPORTED: () =>
  new ServiceError({
    code: 'SERIES_TIME_UPDATE_UNSUPPORTED',
    message: 'series time updates are not supported',
    userMessage:
      'I can update the title, platform, discount codes, or featured collections across a recurring series, but changing the time for every future show needs a separate schedule update.',
    statusCode: 400,
  }),
```

- [ ] **Step 4: Reject the unsafe patch**

In `lib/services/calendar.ts`, inside `updateShow`, immediately after this existing line:

```ts
if (patch.applyToSeries && !current.recurrence_group_id) throw errors.NOT_A_SERIES()
```

add:

```ts
if (patch.applyToSeries && patch.eventTime !== undefined) {
  throw errors.SERIES_TIME_UPDATE_UNSUPPORTED()
}
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts tests/nic-nac/calendar-tools.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add lib/services/calendar.ts lib/services/errors.ts tests/nic-nac/calendar-service.test.ts
git commit -m "fix: block unsafe recurring show time edits"
```

---

### Task 2: Add Calendar Show Status Transitions

**Files:**
- Modify: `lib/services/types.ts`
- Modify: `lib/services/calendar.ts`
- Modify: `lib/services/errors.ts`
- Test: `tests/nic-nac/calendar-service.test.ts`

- [ ] **Step 1: Add failing tests for start and end**

Add these tests to `tests/nic-nac/calendar-service.test.ts`:

```ts
it('startShow marks an owned scheduled show live', async () => {
  const current = makeSelectSingleChain({
    data: baseRow({ status: 'scheduled' }),
    error: null,
  })
  const liveRow = baseRow({ status: 'live' })
  const updated = makeUpdateSingleChain({ data: liveRow, error: null })
  const from = vi
    .fn()
    .mockReturnValueOnce({ select: vi.fn(() => current.chain) })
    .mockReturnValueOnce({ update: vi.fn(() => updated.chain) })
  const supabase = { from } as never

  const result = await startShow(supabase, 'rep-1', 'event-1')

  expect(result.event.status).toBe('live')
  expect(from.mock.results[1].value.update).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'live' }),
  )
})

it('endShow marks an owned live show completed', async () => {
  const current = makeSelectSingleChain({
    data: baseRow({ status: 'live' }),
    error: null,
  })
  const completedRow = baseRow({ status: 'completed' })
  const updated = makeUpdateSingleChain({ data: completedRow, error: null })
  const from = vi
    .fn()
    .mockReturnValueOnce({ select: vi.fn(() => current.chain) })
    .mockReturnValueOnce({ update: vi.fn(() => updated.chain) })
  const supabase = { from } as never

  const result = await endShow(supabase, 'rep-1', 'event-1')

  expect(result.event.status).toBe('completed')
  expect(from.mock.results[1].value.update).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'completed' }),
  )
})

it('endShow rejects scheduled shows that were never started', async () => {
  const current = makeSelectSingleChain({
    data: baseRow({ status: 'scheduled' }),
    error: null,
  })
  const supabase = {
    from: vi.fn(() => ({ select: vi.fn(() => current.chain) })),
  } as never

  await expect(endShow(supabase, 'rep-1', 'event-1')).rejects.toMatchObject({
    code: 'SHOW_NOT_LIVE',
  })
})
```

Also update the calendar import at the top:

```ts
import {
  addShow,
  listMyShows,
  updateShow,
  cancelShow,
  startShow,
  endShow,
} from '@/lib/services/calendar'
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts
```

Expected: fail because `startShow` and `endShow` are not exported yet.

- [ ] **Step 3: Add result types**

In `lib/services/types.ts`, near `CancelShowResult`, add:

```ts
export interface StartShowResult {
  event: CalendarEvent
}

export interface EndShowResult {
  event: CalendarEvent
}
```

- [ ] **Step 4: Add status transition errors**

In `lib/services/errors.ts`, add:

```ts
SHOW_NOT_SCHEDULED: () =>
  new ServiceError({
    code: 'SHOW_NOT_SCHEDULED',
    message: 'show is not scheduled',
    userMessage: 'I can only start a show that is still scheduled.',
    statusCode: 409,
  }),

SHOW_NOT_LIVE: () =>
  new ServiceError({
    code: 'SHOW_NOT_LIVE',
    message: 'show is not live',
    userMessage: 'I can only end a show that is currently marked live.',
    statusCode: 409,
  }),
```

- [ ] **Step 5: Implement `startShow` and `endShow`**

In `lib/services/calendar.ts`, import the new result types and add:

```ts
export async function startShow(
  supabase: SupabaseClient,
  repId: string,
  eventId: string,
): Promise<StartShowResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!eventId) throw errors.EVENT_NOT_FOUND()

  const current = await getOwnedEvent(supabase, repId, eventId)
  if (current.status !== 'scheduled') throw errors.SHOW_NOT_SCHEDULED()

  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      status: 'live',
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('rep_id', repId)
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow) }
}

export async function endShow(
  supabase: SupabaseClient,
  repId: string,
  eventId: string,
): Promise<EndShowResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!eventId) throw errors.EVENT_NOT_FOUND()

  const current = await getOwnedEvent(supabase, repId, eventId)
  if (current.status !== 'live') throw errors.SHOW_NOT_LIVE()

  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('rep_id', repId)
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow) }
}
```

- [ ] **Step 6: Export through service index**

In `lib/services/index.ts`, change the calendar export to include the new functions:

```ts
export {
  addShow,
  listMyShows,
  updateShow,
  cancelShow,
  startShow,
  endShow,
} from './calendar'
```

- [ ] **Step 7: Run focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add lib/services/types.ts lib/services/calendar.ts lib/services/errors.ts lib/services/index.ts tests/nic-nac/calendar-service.test.ts
git commit -m "feat: add calendar show status transitions"
```

---

### Task 3: Wire Start/End Show Into Nic-Nac

**Files:**
- Modify: `lib/nic-nac/tools/start-show-session.ts`
- Create: `lib/nic-nac/tools/end-show.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Test: `tests/nic-nac/show-session-tools.test.ts`
- Test: `tests/nic-nac/calendar-tools.test.ts`

- [ ] **Step 1: Add failing tests**

In `tests/nic-nac/show-session-tools.test.ts`, add a mock for `startShow` and assert that starting a show session with a calendar event marks the calendar event live:

```ts
const startShowMock = vi.fn()

vi.mock('@/lib/services/calendar', () => ({
  startShow: (...args: unknown[]) => startShowMock(...args),
}))

it('marks the linked calendar event live when starting a show session with calendarEventId', async () => {
  startShowMock.mockResolvedValueOnce({
    event: { id: 'event-1', status: 'live' },
  })
  startNicNacShowSessionMock.mockResolvedValueOnce({
    id: 'session-1',
    repId: 'rep-1',
    calendarEventId: 'event-1',
    liveQueueSyncCode: null,
    status: 'active',
  })

  const tool = makeStartShowSessionTool(makeCtx()) as unknown as ToolDef
  const result = await tool.execute({ calendarEventId: 'event-1' })

  expect(startShowMock).toHaveBeenCalledWith(expect.anything(), 'rep-1', 'event-1')
  expect(result).toMatchObject({
    calendarEvent: { id: 'event-1', status: 'live' },
  })
})
```

In `tests/nic-nac/calendar-tools.test.ts`, add a test that `end_show` is registered once it exists:

```ts
expect(names).toEqual(expect.arrayContaining([
  'add_show',
  'list_my_shows',
  'update_show',
  'cancel_show',
  'end_show',
]))
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm exec vitest run tests/nic-nac/show-session-tools.test.ts tests/nic-nac/calendar-tools.test.ts
```

Expected: fail until the tool wiring exists.

- [ ] **Step 3: Update `start-show-session`**

In `lib/nic-nac/tools/start-show-session.ts`, import `startShow` and `ServiceError`/`NicNacToolError` like other tools. In execute, before `startNicNacShowSession`, call `startShow` only when `calendarEventId` exists:

```ts
let calendarEvent: unknown = null
if (calendarEventId) {
  try {
    calendarEvent = (await startShow(ctx.supabase, ctx.repId, calendarEventId)).event
  } catch (err) {
    if (err instanceof ServiceError) {
      throw new NicNacToolError({
        code: err.code,
        userMessage: err.userMessage,
        cause: err,
      })
    }
    throw err
  }
}

const session = await startNicNacShowSession(ctx.supabase, {
  repId: ctx.repId,
  calendarEventId,
  liveQueueSyncCode: resolvedSyncCode,
  metadata: {
    ...(metadata ?? {}),
    ...(needsAutoAnchor ? { autoAnchor: true } : {}),
    conversationId: ctx.conversationId,
    runId: ctx.runId,
  },
})

return { session, calendarEvent }
```

- [ ] **Step 4: Create `end-show` tool**

Create `lib/nic-nac/tools/end-show.ts`:

```ts
import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { endShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  eventId: z.string().uuid(),
})

function explainServiceError(err: unknown): never {
  if (err instanceof ServiceError) {
    throw new NicNacToolError({
      code: err.code,
      userMessage: err.userMessage,
      cause: err,
    })
  }
  throw err
}

export function makeEndShowTool(ctx: { repId: string; supabase: SupabaseClient }) {
  return tool({
    description:
      'Mark a currently live calendar show as completed. Use when the rep says the live show is over or asks to wrap the show.',
    inputSchema,
    execute: async ({ eventId }) => {
      try {
        return await endShow(ctx.supabase, ctx.repId, eventId)
      } catch (err) {
        explainServiceError(err)
      }
    },
  })
}

export const endShowTool: ToolDefinition = {
  name: 'end_show',
  readOnly: false,
  build: (ctx) => makeEndShowTool({ repId: ctx.repId, supabase: ctx.supabase }),
}
```

- [ ] **Step 5: Register `end_show`**

In `lib/nic-nac/tools/index.ts`, import and add the tool beside the other calendar tools:

```ts
import { endShowTool } from './end-show'
```

Add it to the tool list and calendar registry:

```ts
calendar: ['add_show', 'list_my_shows', 'update_show', 'cancel_show', 'end_show'],
```

- [ ] **Step 6: Update prompt copy**

In `lib/nic-nac/system-prompt.ts`, add:

```md
- end_show - write. Marks a currently live calendar show as completed. Use when the rep says the show is over, they are wrapping up, or they want the live status cleared from the public calendar/Finder surfaces.
```

Update the calendar rules:

```md
- When the rep says a scheduled show is starting and gives or selects a calendar event, start_show_session marks that calendar event live and opens current-show memory.
- When the rep says the show is over, call end_show for the live calendar event so public surfaces stop treating it as live.
```

Mirror the shorter version in `lib/nic-nac/prompt-builder.ts`.

- [ ] **Step 7: Run focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/show-session-tools.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac/prompt-routing.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add lib/nic-nac/tools/start-show-session.ts lib/nic-nac/tools/end-show.ts lib/nic-nac/tools/index.ts lib/nic-nac/system-prompt.ts lib/nic-nac/prompt-builder.ts tests/nic-nac/show-session-tools.test.ts tests/nic-nac/calendar-tools.test.ts
git commit -m "feat: wire calendar live status into Nic-Nac"
```

---

### Task 4: Make Recurrence Timezone-Safe

**Files:**
- Modify: `lib/services/calendar.ts`
- Test: `tests/nic-nac/calendar-service.test.ts`
- Test: `tests/services/calendar-timezone.test.ts`

- [ ] **Step 1: Write DST regression test**

Add this test to `tests/nic-nac/calendar-service.test.ts`:

```ts
it('addShow keeps weekly recurring shows at the same local wall time across daylight saving changes', async () => {
  const insertMany = makeInsertManyChain({ data: [], error: null })
  const insert = vi.fn(() => ({ select: insertMany.select }))
  const supabase = {
    from: vi.fn(() => ({ insert })),
  } as never

  await addShow(supabase, 'rep-1', {
    platform: 'TikTok',
    eventTime: '2026-10-27T00:00:00.000Z',
    timeZone: 'America/New_York',
    title: 'Monday Sparkles',
    recurring: { cadence: 'weekly', duration: '1_month' },
  })

  const insertPayload = insert.mock.calls[0][0] as Array<Record<string, unknown>>
  expect(insertPayload.map((row) => row.event_time)).toEqual([
    '2026-10-27T00:00:00.000Z',
    '2026-11-03T01:00:00.000Z',
    '2026-11-10T01:00:00.000Z',
    '2026-11-17T01:00:00.000Z',
  ])
})
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts
```

Expected: fail because current recurrence adds fixed UTC weeks.

- [ ] **Step 3: Implement local-wall-time recurrence**

In `lib/services/calendar.ts`, replace `buildRecurringEventTimes(eventTime, recurring)` with:

```ts
function getTimeZoneDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function zonedLocalTimeToUtcIso(
  local: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  timeZone: string,
) {
  const utcGuess = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  )
  const guessedParts = getTimeZoneDateParts(new Date(utcGuess), timeZone)
  const correctionMs =
    Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    ) -
    Date.UTC(
      guessedParts.year,
      guessedParts.month - 1,
      guessedParts.day,
      guessedParts.hour,
      guessedParts.minute,
      guessedParts.second,
    )

  return new Date(utcGuess + correctionMs).toISOString()
}

function addDaysToLocalDate(
  local: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  days: number,
) {
  const date = new Date(Date.UTC(local.year, local.month - 1, local.day + days, local.hour, local.minute, local.second))
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: local.hour,
    minute: local.minute,
    second: local.second,
  }
}

function buildRecurringEventTimes(eventTime: string, timeZone: string, recurring: RecurringShowInput): string[] {
  const occurrences = getRecurringOccurrenceCount(recurring)
  const stepDays = recurring.cadence === 'daily' ? 1 : 7
  const firstLocal = getTimeZoneDateParts(new Date(eventTime), timeZone)

  return Array.from({ length: occurrences }, (_, index) => {
    const nextLocal = addDaysToLocalDate(firstLocal, index * stepDays)
    return zonedLocalTimeToUtcIso(nextLocal, timeZone)
  })
}
```

Then update the call site:

```ts
const eventRows = buildRecurringEventTimes(eventTime, timeZone, input.recurring).map((nextEventTime) => ({
```

- [ ] **Step 4: Run focused recurrence tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts tests/services/calendar-timezone.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add lib/services/calendar.ts tests/nic-nac/calendar-service.test.ts tests/services/calendar-timezone.test.ts
git commit -m "fix: keep recurring shows timezone-stable"
```

---

### Task 5: Add Database-Level Duplicate Reminder Protection

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_calendar_reminder_unique_keys.sql`
- Create: `tests/calendar-reminder-unique-keys-migration.test.ts`
- Modify: `lib/services/sms-notifications.ts`
- Modify: `tests/nic-nac/send-sms-notification.test.ts`

- [ ] **Step 1: Write migration test**

Create `tests/calendar-reminder-unique-keys-migration.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('calendar reminder unique keys migration', () => {
  it('adds a partial unique index for automated message keys', () => {
    const sql = readFileSync(
      'supabase/migrations/YYYYMMDDHHMMSS_calendar_reminder_unique_keys.sql',
      'utf8',
    )

    expect(sql).toContain('create unique index if not exists')
    expect(sql).toContain('message_log')
    expect(sql).toContain('rep_id')
    expect(sql).toContain('channel')
    expect(sql).toContain('automation_key')
    expect(sql).toContain('where is_automated = true')
    expect(sql).toContain("automation_key is not null")
  })
})
```

When creating the actual migration, replace `YYYYMMDDHHMMSS` in the test filename string with the real migration timestamp.

- [ ] **Step 2: Create migration**

Create `supabase/migrations/YYYYMMDDHHMMSS_calendar_reminder_unique_keys.sql`:

```sql
create unique index if not exists message_log_automated_key_unique
  on public.message_log (rep_id, channel, automation_key)
  where is_automated = true
    and automation_key is not null
    and delivery_status in ('queued', 'sent', 'delivered');
```

- [ ] **Step 3: Run migration test**

Run:

```powershell
npm exec vitest run tests/calendar-reminder-unique-keys-migration.test.ts
```

Expected: pass.

- [ ] **Step 4: Handle duplicate insert conflict gracefully**

In `lib/services/sms-notifications.ts`, when `logError` exists after the `message_log.insert`, inspect duplicate-key errors:

```ts
if (logError) {
  if (options.isAutomated && logError.code === '23505') {
    throw errors.AUTOMATED_MESSAGE_ALREADY_SENT('sms')
  }
  throw logError
}
```

Keep the existing `!logRow?.id` fallback after this branch.

- [ ] **Step 5: Add duplicate insert test**

In `tests/nic-nac/send-sms-notification.test.ts`, add a case where the `message_log.insert(...).select(...).single()` chain returns `{ data: null, error: { code: '23505', message: 'duplicate key' } }`, then assert the service throws:

```ts
await expect(
  sendSmsNotification(
    'rep-1',
    { recipientPhone: '+15555550101', message: 'Reminder text' },
    { isAutomated: true, automationKey: 'show:event-1:pre-show-sms' },
  ),
).rejects.toMatchObject({
  code: 'AUTOMATED_MESSAGE_ALREADY_SENT',
})
```

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm exec vitest run tests/calendar-reminder-unique-keys-migration.test.ts tests/services/message-send-limits.test.ts tests/nic-nac/send-sms-notification.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

Run:

```powershell
git add supabase/migrations/YYYYMMDDHHMMSS_calendar_reminder_unique_keys.sql tests/calendar-reminder-unique-keys-migration.test.ts lib/services/sms-notifications.ts tests/nic-nac/send-sms-notification.test.ts
git commit -m "fix: dedupe automated show reminders at database layer"
```

---

### Task 6: Make Reminder Trigger Fail Loudly When Misconfigured

**Files:**
- Modify: `.github/workflows/sparkle-pre-show-reminders.yml`
- Modify: `tests/vercel-cron-config.test.ts`
- Optional docs: `vault/open-items.md` in binder after execution closeout, not during implementation unless Louis asks.

- [ ] **Step 1: Update the workflow test**

In `tests/vercel-cron-config.test.ts`, change the GitHub Actions expectation so missing secret fails instead of skips:

```ts
expect(workflow).toContain('SPARKLE_PRE_SHOW_CRON_SECRET is not configured')
expect(workflow).toContain('exit 1')
expect(workflow).not.toContain('skipping reminder trigger')
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm exec vitest run tests/vercel-cron-config.test.ts
```

Expected: fail because the workflow currently exits `0`.

- [ ] **Step 3: Update workflow**

In `.github/workflows/sparkle-pre-show-reminders.yml`, replace:

```bash
echo "SPARKLE_PRE_SHOW_CRON_SECRET is not configured; skipping reminder trigger."
exit 0
```

with:

```bash
echo "SPARKLE_PRE_SHOW_CRON_SECRET is not configured; reminder trigger cannot run."
exit 1
```

- [ ] **Step 4: Run workflow config test**

Run:

```powershell
npm exec vitest run tests/vercel-cron-config.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add .github/workflows/sparkle-pre-show-reminders.yml tests/vercel-cron-config.test.ts
git commit -m "fix: fail loudly when show reminder cron secret is missing"
```

---

### Task 7: Dashboard Status Clarity

**Files:**
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Test: `tests/nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Add dashboard tests**

In `tests/nic-nac-dashboard-placeholder.test.ts`, add assertions for calendar status labels:

```ts
it('shows live and completed calendar statuses in the workspace calendar', () => {
  const html = renderToStaticMarkup(
    createElement(ShowCalendarCard, {
      state: {
        status: 'ready',
        summary: {
          upcomingEvents: [
            {
              id: 'event-live',
              repId: 'rep-1',
              platform: 'TikTok',
              eventTime: '2026-06-12T20:00:00.000Z',
              timeZone: 'America/New_York',
              durationMinutes: 60,
              title: 'Live Now',
              description: null,
              discountCodes: [],
              featuredCollections: null,
              isRecurring: false,
              recurrenceGroupId: null,
              recurrenceRule: null,
              status: 'live',
              createdAt: '2026-06-12T19:00:00.000Z',
              updatedAt: '2026-06-12T19:00:00.000Z',
            },
          ],
          recentEvents: [
            {
              id: 'event-completed',
              repId: 'rep-1',
              platform: 'TikTok',
              eventTime: '2026-06-11T20:00:00.000Z',
              timeZone: 'America/New_York',
              durationMinutes: 60,
              title: 'Wrapped Show',
              description: null,
              discountCodes: [],
              featuredCollections: null,
              isRecurring: false,
              recurrenceGroupId: null,
              recurrenceRule: null,
              status: 'completed',
              createdAt: '2026-06-11T19:00:00.000Z',
              updatedAt: '2026-06-11T19:00:00.000Z',
            },
          ],
        },
      },
      referenceDate: new Date('2026-06-12T16:00:00.000Z'),
    }),
  )

  expect(html).toContain('Live now')
  expect(html).toContain('Completed')
})
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: fail if live status label is not present.

- [ ] **Step 3: Implement status label helper**

In `DashboardPlaceholder.tsx`, add:

```ts
function getCalendarStatusLabel(event: CalendarEvent) {
  if (event.status === 'live') return 'Live now'
  if (event.status === 'completed') return 'Completed'
  if (event.status === 'cancelled') return 'Cancelled'
  return event.isRecurring ? 'Recurring' : null
}
```

Replace the recurring-only tag in the upcoming list with:

```tsx
{getCalendarStatusLabel(event) ? (
  <span className={styles.timelineItem}>{getCalendarStatusLabel(event)}</span>
) : null}
```

- [ ] **Step 4: Run focused dashboard test**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add app/nic-nac/components/DashboardPlaceholder.tsx tests/nic-nac-dashboard-placeholder.test.ts
git commit -m "fix: clarify calendar live status in workspace"
```

---

### Task 8: Focused End-to-End Verification

**Files:**
- No code changes expected.
- Use active repo: `C:\Users\louis\sparkle-suite-repo`

- [ ] **Step 1: Run focused calendar/reminder tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-service.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac/show-session-tools.test.ts tests/nic-nac-calendar-summary-route.test.ts tests/services/calendar-timezone.test.ts tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/services/message-send-limits.test.ts tests/vercel-cron-config.test.ts tests/amethyst-homepage-upcoming-shows.test.ts tests/sparkle-finder-public-api.test.ts
```

Expected: pass.

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: pass.

- [ ] **Step 3: Run stable-demo smoke only if UI or deployed verification is needed**

If the implementation includes dashboard visual/status changes, use the project `sparkle-suite-demo-smoke` workflow and Chrome reviewer-smoke against:

```text
https://sparkle-suite-demo.vercel.app
```

Expected:
- Calendar tab renders.
- Upcoming shows display scheduled/live status correctly.
- Recently wrapped shows display completed/cancelled status.
- No console errors.

- [ ] **Step 4: Commit any final test/doc adjustments**

Only if prior steps required changes:

```powershell
git add <changed-files>
git commit -m "test: verify calendar hardening"
```

---

## Deployment and Ops Checklist

- [ ] Apply the reminder uniqueness migration to Supabase production. Because Supabase CLI auth/linking is currently unresolved, use Dashboard SQL editor only if CLI remains blocked, and verify the index exists afterward.
- [ ] Confirm Vercel Production has `CRON_SECRET` configured.
- [ ] Confirm GitHub repo secret `SPARKLE_PRE_SHOW_CRON_SECRET` exactly matches Vercel `CRON_SECRET`.
- [ ] Confirm Vercel Production has `SPARKLE_PRE_SHOW_SMS_ENABLED=true` only when Louis is ready for automated SMS sends.
- [ ] Run the pre-show reminder route in dry-run mode with authorization before enabling live sends:

```powershell
curl.exe -H "Authorization: Bearer <secret>" "https://www.yoursparklesuite.com/api/internal/show-reminders/pre-show?limit=25"
```

- [ ] Run live route once with sends disabled and confirm it returns the explicit disabled no-op.
- [ ] After live sends are enabled, run a controlled smoke with one synthetic opted-in audience member and one near-future show, then verify exactly one `message_log` row and no duplicate on a second run.

---

## Later Product Layer

These are not required to fix the hardening gaps above, but they are natural next improvements:

- Add direct dashboard create/edit/cancel/start/end controls for reps who do not want to chat with Nic-Nac.
- Add “edit this occurrence only” vs “edit future series” UI language.
- Add “pause recurring series” and “cancel future series” tools.
- Add rep-facing reminder settings: enabled/disabled, lead time, SMS/email channel, and opt-in copy preview.
- Add a small operator health card showing last reminder workflow run, planned count, sent count, skipped count, and last error.

---

## Self-Review

- Spec coverage: Covers all audit findings: unsafe series time edit, missing start/end status workflow, DST recurrence drift, duplicate reminder race, silent reminder trigger misconfiguration, and dashboard status clarity.
- Placeholder scan: No `TBD`, vague “handle edge cases,” or “write tests” placeholders remain.
- Type consistency: `startShow`, `endShow`, `StartShowResult`, `EndShowResult`, and `end_show` names are consistent across service, tools, prompt, and tests.
