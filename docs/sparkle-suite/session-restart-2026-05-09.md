# Sparkle Suite Restart Prompt — 2026-05-09

Use this to start the next Sparkle Suite session in `neon-rabbit-core`.

## Current Truth

- Check Neon Rabbit HQ first for tracker truth and Open Brain for durable memory when relevant.
- Use plain English, short, practical, and no guessing.
- User-facing assistant name is `Nic-Nac`, not Thumper.
- Internal `thumper` paths can stay for code stability.
- SMS is still not production-validated end to end.
- Telnyx sender number `+19044383050` is purchased and active.
- Sparkle Suite SMS messaging profile exists and is attached to that number.
- Webhook URL is `https://sparkle-suite.vercel.app/api/telnyx/webhook`.
- Local env has `TELNYX_API_KEY`, `TELNYX_PUBLIC_KEY`, and `TELNYX_SMS_FROM`.
- A one-off SMS was successfully queued through Telnyx earlier, but real handset delivery has still not been validated.
- Sole proprietor 10DLC brand for Neon Rabbit Digital Services under Louis Chapman was submitted on `2026-05-07` and is still pending Telnyx/TCR review.
- After approval, the required path is still: create 10DLC campaign, attach `+19044383050`, rerun real handset delivery smoke test, and only then finish `5.1`.

## What Finished In This Session

- Phase 7 is complete in Neon Rabbit HQ.
- `7.1` Photoroom integration is complete.
- `7.2` photo QA scoring is complete.
- `7.3` bulk processing pipeline is complete.
- `7.4` photography kit standardization is complete.
- The photo pipeline now has:
  - shared server-side source-photo prep for chat uploads and volunteered URLs
  - stronger server-side image-quality scoring
  - canonical-promotion guardrails
  - secure internal overnight queue route
  - Vercel cron schedule for the queue
  - route-level protection against raw custom photo URL bypasses
- Photography kit decision is now locked:
  - `DUCLUS` lightbox is the baseline
  - white background is required
  - webcam standardization is dropped for now
  - reps use their existing phone/camera first
  - Nic-Nac coaches framing/process before any future hardware escalation

## Useful Repo Truth

- Photography kit standard: [docs/sparkle-suite/photography-kit-standardization.md](C:/Users/louis/neon-rabbit-core/docs/sparkle-suite/photography-kit-standardization.md)
- Internal photo queue route: [app/api/internal/photo-enhancement/queue/route.ts](C:/Users/louis/neon-rabbit-core/app/api/internal/photo-enhancement/queue/route.ts)
- Queue processor: [lib/services/photo-enhancement-queue.ts](C:/Users/louis/neon-rabbit-core/lib/services/photo-enhancement-queue.ts)
- Vercel cron config: [vercel.json](C:/Users/louis/neon-rabbit-core/vercel.json)
- Design photo source prep: [lib/services/design-source-photo-processing.ts](C:/Users/louis/neon-rabbit-core/lib/services/design-source-photo-processing.ts)
- Canonical photo guardrails: [lib/services/jewelry-database.ts](C:/Users/louis/neon-rabbit-core/lib/services/jewelry-database.ts)

## Best Next Direction

Phase 7 is done, so the next large clean batch is Phase 8.

Recommended order:

1. Start Phase 8 planning/build with the imported Sparkle Suite knowledge base and agent docs.
2. Keep `5.1` in progress until 10DLC approval lands.
3. Do not claim SMS delivery success until a real phone receives the text.

## Restart Prompt

```text
Continue Sparkle Suite in C:\Users\louis\neon-rabbit-core.

First check Neon Rabbit HQ for current tracker truth and Open Brain for durable memory when relevant.

Working style:
- plain English
- short, bottom-line-first
- practical over perfect
- no guessing or winging it
- if something important is unclear, inspect the real source of truth, research it, or ask focused questions before acting
- for third-party portals like Telnyx, guide one step at a time and wait for the next screenshot/status before giving another step

Current truth:
- user-facing assistant name is Nic-Nac
- internal thumper paths may remain for code stability
- Phase 7 is complete
- 5.1 is still in_progress because 10DLC brand approval is still pending
- do not claim handset SMS delivery success until a real phone receives the text
- DUCLUS lightbox is accepted as the baseline photography kit
- white background is required
- webcam standardization is dropped for now

Next goal:
- start the next best large Sparkle Suite batch, which is likely Phase 8 unless HQ truth suggests a better immediate priority

Before writing code, inspect the repo and tracker truth and summarize the best next move briefly, then proceed.
```
