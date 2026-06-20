# Nic-Nac Trade Board Smoke Gap

Date: 2026-06-15

## Lesson

Nic-Nac Trade Board add-listing changes are not verified by prompt assertions, build checks, health checks, or route availability alone. The failure Louis kept hitting lived in the live conversation loop: tool routing, prior message state, uploaded image roles, and model behavior together.

Future fixes to this flow need a real rep-style smoke: synthetic/reviewer account, real chat UI or `/api/nic-nac`, real uploaded images, and the actual model/tool loop.

## Specific Failure

Louis tried to add `ER13229 / The Florence Earrings`. Nic-Nac treated a label/details photo as if it were the jewelry-front photo, criticized it as too far away, then after Louis corrected that only a label photo had been provided, Nic-Nac claimed he could not add listings from chat.

The root cause found in the active repo was that the correction turn did not route as a Trade Board continuation. The router fell back to `memory`, so `add_listing` disappeared from the active tool list.

## Product Rule

- A label/details/tag/back-of-card photo is only a details source.
- Visible jewelry in a label/details photo does not make it the jewelry-front photo.
- After using a label/details photo, Nic-Nac should ask for the separate customer-facing jewelry photo if missing.
- A boxed display jewelry photo is valid when it is provided as the customer-facing jewelry photo and the jewelry is centered, close, clear, and website-worthy.
- Nic-Nac should not ask for unboxed, no-packaging, or plain-background retakes for good boxed display photos.

## QA Rule

Maintain a local smoke fixture folder, recommended path:

`C:\Users\louis\sparkle-suite-smoke-assets`

The folder should include known-good label photos, known-good boxed jewelry-front photos, known-bad examples, and a `cases.txt` file with expected outcomes. Codex should use those fixtures through browser/Chrome automation in a synthetic/reviewer session, not Louis's personal account.

## Hard Fail Phrases

A Nic-Nac Trade Board add-listing smoke should fail if Nic-Nac says:

- "I can't actually add listings"
- "Log into your workspace and add it manually"
- "The photo of the earrings needs..." when only a label/details photo was uploaded
- "Unboxed"
- "Plain background"
- "Packaging is too prominent" for a clear boxed display jewelry photo

## Current Caveat

During this session, local Next server startup from Codex hit Windows/session barriers (`spawn EPERM` and PowerShell background-job permission issues). Prefer stable-demo reviewer-smoke/browser automation for the full live replay unless local server startup is known-good.
