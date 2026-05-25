# Live Queue Web Store Release Lesson

Date: 2026-05-18

## What Happened

Brittany reinstalled Sparkle Suite Live Queue from the Chrome Web Store, but the popup still did not show the Party Filter section. The Web Store listing was serving version `1.0.0`, which matched the pre-filter popup.

Local git history shows:

- `c5b16b8` on 2026-04-10 created the Chrome extension without Party Filter UI.
- The Chrome Web Store rollout happened after that, with the extension published as `1.0.0`.
- `39fb935` on 2026-05-11 added Party Filter support: popup UI, `queue-filter.js`, party summary storage, and tests.
- The repo had the new feature, but the Chrome Web Store package was not advanced until 2026-05-18 with manifest version `1.0.1`.

## Lesson

Repo-complete is not Web-Store-complete. Any rep-facing change under `chrome-extension/` must include a Chrome Web Store release loop before we call it done.

## New Checklist

For every rep-facing `chrome-extension/` change:

1. Bump `chrome-extension/manifest.json` version.
2. Package a new zip from the extension directory.
3. Verify the zip contains the changed files.
4. Run the Live Queue tests and content-script safety scans.
5. Upload the package to the existing Chrome Web Store item.
6. Submit the draft for review.
7. Record the submitted version and review status.
8. After approval, verify from a real Web Store-installed copy, not only the repo or unpacked build.
9. Keep an emergency unpacked-install zip ready for live-show incidents while review is pending.

## Follow-Up

NR HQ open item `da3086e0-4eaa-4cb3-8292-1d603055fcf0` tracks approval of version `1.0.1` and rep rollout verification.
