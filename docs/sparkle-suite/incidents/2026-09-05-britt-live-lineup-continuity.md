# Brittany live-show lineup continuity — September 5, 2026

## Authority and scope

Louis requested a permanent Control Center Task List item first, followed by a
temporary website-only stability patch during Brittany's 3-year anniversary
24-hour show. He also requested **Live Lineup** wording on all customer sites
and automatic updates without repeated customer refreshes.

Task List record (inserted and read back before code changes):
`e453d5cc-0ac8-4d46-9dab-182a6aa723d7`, **Live Lineup reliability: repair heartbeat
and refresh after live shows**. Remains open for permanent work when no shows
are running. No extension files, queue rows, codes, timestamps, DNS records,
customer accounts, billing, or show-computer state are changed by this patch.

## Confirmed issue versus remaining investigation

- At 2026-09-06 01:21:47 UTC, the original live_queue row held 35 names, last
  updated 01:18:18.604 (208 seconds old). Public homepage data returned no names.
- At 01:23:38 UTC, the same row held 34 names with a 01:21:54.575 update (103
  seconds old), and the public response returned the names again.
- The server freshness cutoff is 180 seconds. The public homepage loaded one
  snapshot with no periodic refresh. The Brittany stale branch presented an
  apparently ready but empty queue, even when stored names were available.
- Repository extension logic suppresses unchanged payloads; the backup trigger
  does not force them through. A no-network mock confirmed unchanged-trigger
  suppression. Brittany's installed extension build has NOT been inspected;
  this is a code finding, not proof of her installed version or every cause.
- Permanent investigation also covers transient empty tables, multiple tabs,
  checkbox observation, retries, and authoritative/ordered timestamps.

## Temporary mitigation

- Brittany's homepage uses a strictly targeted, no-store, read-only JSON route:
  `/api/amethyst/live-lineup`. No unscoped demo fallback and no other-rep data.
- One in-flight request, every 30 seconds while visible; eight-second timeout;
  automatic retry and resume on visibility/online. No whole-page reload.
- Data beyond three minutes is explicitly **last received**, with a timestamp,
  a warning that positions may have changed, and no current-customer highlight.
  Names expire after one hour. This is not proof the extension is connected.
- Temporary failures do not manufacture a successful empty lineup. Newer valid
  empty data is accepted; older/malformed responses are rejected.
- Shared Home, Trade, Join templates and fallback components say Live Lineup.
  Internal API/database/extension identifiers remain unchanged. Tonight's
  automatic-update behavior is restricted to Brittany's homepage.
- An already-open old page still needs ONE customer-site refresh to load this
  code. Do not refresh or operate the Bomb Party dashboard.

## Verification and repeatable safe review

- `npm run build`: successful, including TypeScript and generated Join bundle.
- 121 tests across eight focused suites pass. Synthetic names and mocked
  fetch/database data exercise freshness, retention, genuine empty results,
  recovery, 30-second polling, hidden-page pause, cleanup, scope and privacy.
  Rerunning tests resets mocks; no production test mode or seed writes added.
- Built local page `/brittwithbling`: desktop and 390px mobile modal verified;
  no horizontal overflow. Observed the open modal change automatically from
  fresh to delayed, preserving 26 names and changing labels to **Position at
  last update**, without refreshing the page or changing production data.
- Public review after release: open Brittany's homepage, choose **View full
  lineup**, inspect status/time, leave it open through a polling interval,
  close and reopen. Only read public data; do not submit forms or orders.
- Signed-in synthetic reviewer verification remains unavailable from the prior
  session. Do not use personal credentials or claim workspace auth verified.

## Release provenance and rollback evidence

Repo `C:/Users/louis/sparkle-suite-repo`, remote `louis623/sparkle-suite`, branch
`codex/nic-nac-trade-hardening`, starting HEAD
`149cf5f844eb0e0b6ca792941eee365472285a2b`.
Project `sparkle-suite` / `prj_zCKmYDx1Sbs9hA1Lokzdv9Qm0TM3`.

Before this patch, main production resolves to
`dpl_Ggubupez6DRvcZczVwXBWBXQEEG9` /
`sparkle-suite-qeqrozn71-louis-2849s-projects.vercel.app`.
Customer custom domains resolve to `dpl_7ZWsWPJJX5483Vvf3Nce9FFxxtGh` /
`sparkle-suite-4v9qp70e9-louis-2849s-projects.vercel.app`, source
`7bcd21637fe0fbce0e92e194a4a9923d5932b480`.

Release targets: www.yoursparklesuite.com, yoursparklesuite.com;
brittwithbling.com, www.brittwithbling.com; milehighfizz.com,
www.milehighfizz.com; brisglowtique.com, www.brisglowtique.com;
goforthebling.com; theblingkitchen.com, www.theblingkitchen.com.
No Finder or unrelated project aliases move. Final release evidence is recorded
in the vault session log after deployment and live verification.
