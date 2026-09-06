# September 5, 2026 — Brittany live-show mitigation and presentation

## Current application and provenance

Exact source `9e96887d3a2bdb6a5b47b5d01d3d857ac5d2ac72`, deployment
`dpl_FZQJFd561g9dtBEv93gjxHb4PgJ9`, URL
`sparkle-suite-aaoxqluvz-louis-2849s-projects.vercel.app`.
Repo C:/Users/louis/sparkle-suite-repo, louis623/sparkle-suite, allowlisted
codex/nic-nac-trade-hardening. Starting HEAD 149cf5f8. Source committed/pushed;
manual production deploy exact tip, then nine domain aliases verified against
the exact deployment: both yoursparklesuite.com, both brittwithbling.com, both
brisglowtique.com, goforthebling.com, both theblingkitchen.com.

Both milehighfizz.com aliases remain on dpl_7ZWsWPJJX5483Vvf3Nce9FFxxtGh.
Vercel rejected certificate issuance; read-only domain inspection reports
incorrect existing external DNS. No DNS/certificate-setting repair or Finder
alias change. All-customer terminology rollout is blocked only on those hosts.
Their existing deployment and main's prepatch dpl_Ggubupez6DRvcZczVwXBWBXQEEG9
are preserved as evidence. See the detailed incident document in docs.

## Exact issue and permanent Task List

FIRST inserted and read back live Control Center Task List record
e453d5cc-0ac8-4d46-9dab-182a6aa723d7, title **Live Lineup reliability: repair
heartbeat and refresh after live shows**, high/open. Keep open; permanent
extension repair waits for no live shows and explicit authorization. This
vault pointer is NOT a substitute Task List. No automatic future work.

Confirmed: at 01:21:47 UTC Sep6 (Sep5 ET), stored queue had 35 names at age208
seconds but public payload omitted names. At 01:23:38 it had 34 at age103 and
names returned. Server cutoff180seconds; homepage loaded one snapshot with no
polling. Repository extension deduplicates unchanged data including the backup
trigger. Mock confirmed this code behavior; Brittany's installed build was
NOT inspected. Permanent audit also covers empty-table transients, multiple
tabs, checkbox changes, retries and authoritative ordered timestamps.

## Delivered behavior and decisions

- Shared customer-facing name is **Live Lineup**, not Live Queue.
- Brittany-only homepage read-only polling every30seconds while visible,
  eight-second timeout, one in-flight request, automatic retry/resume. No
  full-page reload. Existing old pages need one refresh to receive the patch.
- Delayed data is explicitly last received, with timestamp and warning that
  positions may change; names expire after one hour. Failed reads never
  manufacture successful empty data. Fresh empty is accepted. This is display
  continuity, not a repaired extension or guarantee of current positions.
- Louis rejected per-person captions: shared strips/lists now show only
  position numbers and names. One freshness notice per lineup surface.
- Brittany-only unused About/media cards hidden without deleting saved content.
  Her What is a Bomb Party explainer flows directly to Never Miss a Show.
  Do not restore those cards until Workspace support is ready and approved.
- Brittany Home/Join/Trade links and footer labels say Coming soon. Her ticker
  says exactly **Digital Dance Floor coming soon**, and Trade heading/empty
  state repeats that status. Links, trade data and other reps' status unchanged.
- No extension/store actions, sync-code or queue-row/timestamp mutations,
  customer forms/orders, account/billing changes, email sends, or new credits.
  Existing saved content and unrelated artifacts/ and test-results/ preserved.

## Release sequence and verification

Initial a2e4847a / dpl_2bg6hTm89G3umTVuSsgkqyWkAezF was live and verified.
Label-only 5111a546 / dpl_J94ugaiPahgd1guNRAvdDZ7eJ1Ts reached READY but was not
promoted to customer domains: Louis added hiding cards and Coming Soon copy,
included in the final combined release above. Assets use 20260905-lineup4.

Initial eight-suite regression run: 121 passed. Later markup-only Vitest runs
hit automatic permission-review timeouts and sandbox spawn EPERM; do NOT claim
the added tests ran. Direct Node assertions verified number/name-only rows,
Brittany-only Coming Soon conditions, her removed AboutSection, and retention
of the other three AboutSection render sites. All local and Vercel production
builds and TypeScript checks passed.

Local desktop/390px mobile verified no horizontal overflow, full lineup modal,
automatic fresh-to-delayed transition without refresh, preserved names and
honest notice; final layout checked. Exact live brittwithbling.com verified
lineup4, no unused cards, correct explainer/signup adjacency, clean lineup rows,
fresh automatic updates, all Coming Soon labels and requested ticker. Live
/trade verified Coming Soon heading and ticker. Nine exact aliases confirmed.
Signed-in synthetic reviewer verification remains unavailable from earlier
work; no personal credential fallback or auth repair. Prior welcome Site and
unsent apology/credit email remain unchanged.

## Remaining work

- Live Task List permanent repair only when no live shows, explicitly approved.
- Mile High Fizz domain configuration/release needs separate direction; no DNS
  changes during this show merely to finish terminology rollout.
- Brittany Workspace support for hidden cards, then separately approved restore.
- Existing synthetic reviewer blocker remains; no unrelated open items pursued.
