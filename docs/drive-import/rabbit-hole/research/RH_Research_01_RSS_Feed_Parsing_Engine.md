# The Rabbit Hole — Research #1: RSS Feed Parsing Engine

**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when needed
**📁 UPLOAD TO PROJECT:** No — reference doc
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context)
**🔄 UPDATE TRIGGER:** New research findings or technical decisions that supersede these findings

**Research Source:** Gemini Deep Research | **Date:** April 6, 2026 | **Status:** COMPLETE

---

## Purpose

Technical reliability and integration analysis for building a universal content syndication engine — the server-side proxy that powers The Rabbit Hole's "Universal Input" feature. Covers all Tier 1 source types, auto-detection logic, caching, rate limiting, failure handling, and parser selection.

---

## Source-by-Source Analysis

### YouTube

**How it works:** YouTube provides a native RSS endpoint at `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`. The challenge is that users paste handles (e.g., `@veritasium`), not channel IDs. The proxy must resolve handles to channel IDs by scraping the channel page's HTML metadata — specifically the `<link rel="alternate" type="application/rss+xml">` tag in the `<head>` section.

**Input resolution strategies:**

| Input Type | URL Pattern Example | Resolution Strategy |
|---|---|---|
| Handle | youtube.com/@veritasium | HTML scraping: extract `link[rel=alternate]` |
| Channel URL | youtube.com/channel/UCjUN... | Direct extraction: parse path for UC prefix |
| Playlist | youtube.com/playlist?list=PL... | Direct mapping: `videos.xml?playlist_id=...` |
| Legacy User | youtube.com/user/name | HTML scraping: metadata extraction |

**Key limitation:** Native feeds are hard-limited to the **most recent 15 videos**. Prolific daily creators could exhaust this buffer between polling cycles. Intermittent 404 errors have been observed during peak US usage windows, suggesting soft rate-limiting on the `/feeds/` path.

**XML fields to normalize:**

- Video ID: `<yt:videoId>`
- Timestamp: `<published>` (ISO 8601)
- Thumbnail: `<media:group><media:thumbnail url="..."/></media:group>`
- Link: `<link rel="alternate" href="...">`

---

### Substack

**How it works:** Append `/feed` to any Substack URL — works for both subdomains (`newsletter.substack.com/feed`) and custom domains (`journal.domain.com/feed`).

**Reliability:** Extremely high. RSS is a core feature of Substack's platform philosophy.

**Key considerations:**

- Full-text vs. summary depends on publication owner settings — proxy must handle both `<description>` (summary) and `<content:encoded>` (full HTML)
- Paid-only posts return truncated content for unauthenticated requests — fetching full paywalled content would require user-specific auth tokens and raises terms of service concerns
- For Gate 1: display what the feed provides, link to full article on Substack

| Component | XML Tag | Reliability |
|---|---|---|
| Main Feed | `.../feed` | Extremely high; rarely deprecated |
| Article Content | `<content:encoded>` | Variable; depends on author settings |
| Paywall Status | Custom metadata | Non-standard; requires heuristic detection |

---

### WordPress and General News Sites

**How it works:** WordPress supports `/feed/` or `/?feed=rss2` by default. General news sites (Reuters, BBC, NPR, TechCrunch) have fragmented feed locations requiring multi-step discovery.

**Automated discovery sequence:**

1. **Check HTML headers:** Parse `<head>` for `<link rel="alternate" type="application/rss+xml" href="...">`
2. **Standard path probing:** Try `/feed/`, `/rss/`, `/rss.xml`, `/index.xml`
3. **Visual/link scraping (last resort):** Search for RSS icon or links containing "RSS"

**Common failure mode:** Malformed XML caused by theme conflicts or poorly coded plugins — misplaced whitespace before the `<?xml` declaration is a frequent parser-breaker. Proxy must pre-process raw responses or use a non-strict parser for graceful handling.

---

### Medium

**How it works:** Medium has robust RSS but URL patterns change based on the target type.

**Feed URL patterns:**

| Target | Feed URL Pattern |
|---|---|
| Individual profile | `medium.com/feed/@username` |
| Publication | `medium.com/feed/publication-name` |
| Custom domain | `domain.com/feed` |
| Tagged content | `medium.com/feed/publication/tagged/topic` |

**Key consideration:** Medium feeds sometimes use a "linkblog" style where the RSS item points to an external site rather than a Medium post. The proxy should prioritize the `<link>` tag to direct users to the primary source. Feeds generally include `<content:encoded>` with full article text.

---

### Reddit

**How it works:** Subreddits are accessible via `.rss` suffix (e.g., `reddit.com/r/technology/.rss`).

**This is the riskiest Tier 1 source.** Three major concerns:

**1. IP blocking:** Reddit aggressively blocks requests from cloud-hosting IP ranges (Vercel, AWS) using generic User-Agent strings. The proxy MUST use a unique, descriptive User-Agent following Reddit's naming convention: `<platform>:<app ID>:<version string> (by /u/<reddit username>)`.

**2. Rate limits:**

| Access Layer | Rate Limit | Risk Factor |
|---|---|---|
| Unauthenticated (IP-based) | 10 requests/minute | Extremely high (shared IP blocking) |
| Authenticated (OAuth) | 60–100 requests/minute | Moderate (requires app registration) |

**3. Content deletion compliance:** Reddit's Developer Terms require that if a post or comment is deleted on Reddit, it must be removed from any application cache within 48 hours. This means building a Supabase background worker that periodically checks the status of stored Reddit items.

**Recommendation:** Register a dedicated Reddit OAuth client before building Reddit support. Do not ship Reddit as an unauthenticated source.

---

### GitHub

**How it works:** GitHub uses Atom 1.0 format for repository releases at `github.com/owner/repo/releases.atom`. Atom is more strictly specified than RSS 2.0 — one of the most reliable sources.

**Key Atom fields:**

- Title: `<title>` (release name or version tag)
- Identifier: `<id>` (persistent internal release ID)
- Update time: `<updated>` (ISO 8601)
- Author: `<author><name>` (publishing GitHub user)

---

### Podcasts

**How it works:** Podcast feeds are specialized RSS 2.0 files using the `<enclosure>` tag for audio files plus iTunes and Podcast namespace extensions for metadata.

**Required namespace parsing:**

| Namespace | Key Element | Purpose |
|---|---|---|
| Core RSS | `<enclosure>` | Direct link to audio file (url, length, type) |
| iTunes | `<itunes:image>` | High-res cover art (1400x1400 to 3000x3000px) |
| iTunes | `<itunes:duration>` | Episode length in seconds |
| Podcast | `<podcast:transcript>` | Link to VTT or JSON transcript files |

**Key quirk:** Most podcast items omit image tags at the `<item>` level — the reader must fall back to the `<channel>` level `<itunes:image>`. The normalization logic must implement this hierarchical inheritance to avoid empty card images.

---

## Universal Input — Auto-Detection Logic

The "paste anything" experience requires a tiered server-side decision tree:

**Tier 1 — Domain regex:** Catch known entities (YouTube, Reddit, Substack, Medium, GitHub) via domain pattern matching. Route to source-specific resolution logic.

**Tier 2 — HEAD request:** If domain is unknown, inspect `Content-Type` header. If `application/rss+xml`, `application/atom+xml`, or `text/xml` — proceed directly to parsing.

**Tier 3 — Deep discovery:** If content type is `text/html`, fetch the page and scan HTML `<head>` for `<link rel="alternate" type="application/rss+xml">` tag.

**Performance note:** Cache the result of discovery in Supabase (map pasted URL → resolved RSS URL) so subsequent users adding the same source skip the discovery process entirely.

---

## Feed Normalization

### Parser Comparison (Node.js)

| Library | Performance | Key Advantage | Notes |
|---|---|---|---|
| rss-parser | Baseline (1x) | Wide adoption, stable API | 4–5x slower in benchmarks |
| Feedsmith | 4–5x faster | Maintains namespace integrity (iTunes, Media) | Designed for high-density aggregators |
| node-feedparser | Moderate | Robust relative URL resolution | Handles non-default namespaces well |

**Research recommendation:** Feedsmith for performance and namespace preservation in a serverless environment.

**Note:** Parser decision is ON HOLD pending Research #2 (Flutter + Supabase integration). If the app architecture uses Dart/Flutter-native parsing or Supabase Edge Functions (Deno/TypeScript) instead of Node.js, the parser choice may shift.

### Target Schema: JSON Feed 1.1

All incoming XML should normalize to this structure:

```json
{
  "id": "Persistent unique identifier (from <guid> or <id>)",
  "title": "Plain text title",
  "content_html": "Sanitized HTML for article rendering",
  "date_published": "ISO 8601 timestamp",
  "image": "Featured visual URL (from media:thumbnail or itunes:image)",
  "_source_type": "YouTube | Substack | Reddit | Podcast | etc."
}
```

---

## Caching Strategy

### Stale-While-Revalidate Pattern

Set aggressive `Cache-Control` headers on the proxy:

```
Cache-Control: s-maxage=300, stale-while-revalidate=600
```

This serves cached data instantly (under 50ms) while refreshing in the background. Content stays fresh within a 5–10 minute window.

### Stateful Rate Limiting

Serverless functions are ephemeral — they can't track request counts across executions. Options:

- **Gate 1 (MVP):** Supabase-based caching and rate tracking — simpler, fewer moving parts
- **At scale:** Redis (Upstash via Vercel Marketplace) for distributed rate limiting, ETag storage, and `If-None-Match` conditional requests to skip parsing when content hasn't changed

---

## Failure Handling — Circuit Breaker Pattern

When a feed fetch fails, the proxy returns a partial success state. The app should:

1. **Timeline continuity:** Load all valid sources. Show "stale" card for the broken source using last cached data from Supabase.
2. **Subtle error states:** Small "sync error" icon on the affected source card — no blocking error modals. User can tap for details or manual re-sync.
3. **Circuit breaker:** If a source consistently returns 5xx errors, skip that feed for a cooldown period (e.g., 1 hour) to reduce load and prevent further platform blocks.

**HTTP status mapping for proxy responses:**

| HTTP Status | Meaning in RSS Context | App Action |
|---|---|---|
| 304 | No new content | Serve from local cache |
| 410 | Source deleted (Gone) | Notify user to remove source |
| 429 | Rate limited | Back off and retry later |
| 502 | Source site is down | Show "Offline" badge on source |

---

## RSSHub — Fallback Layer (Post-Gate 1)

RSSHub is a community project that generates RSS feeds for sites without native support. The public instance (`rsshub.app`) is unreliable due to heavy traffic, but self-hosting a private instance on Railway or Fly.io is production-viable.

**Benefits of self-hosted RSSHub:**

- Access to thousands of community-maintained bridges for non-standard sites
- Dedicated IP (avoids shared blocking)
- Custom caching and refresh logic per source

**Status:** Watch list. Not needed for Tier 1 sources (all have native RSS). Evaluate for Tier 2 sources (Bluesky, Mastodon) or niche sites post-launch.

---

## Risk Assessment

### IP Reputation on Shared Infrastructure (Vercel)

Vercel's shared outbound IPs mean other users' bad behavior can get your IP range blacklisted by YouTube or Reddit. For MVP this is acceptable risk. At scale, may need rotating residential proxies or a dedicated VPS with a static IP for sensitive requests.

### Content Truncation

Many publishers return only a sentence or two in RSS to force website visits. Optional "full text extraction" (scraping the article from the source URL) could be added post-Gate 1 — not an MVP feature.

### YouTube 15-Video Ceiling

Native feeds max out at 15 entries. For prolific creators, content could be missed between polling cycles. Recommended MVP approach: poll every 4–6 hours, document as a known platform constraint, revisit if user feedback indicates it's a problem.

---

## Key Decisions Needed (Pending Further Research)

| Decision | Blocked By | Status |
|---|---|---|
| Parser selection (Feedsmith vs. Dart-native vs. Edge Function) | Research #2 — Flutter + Supabase integration path | ON HOLD |
| Proxy runtime (Node.js on Vercel vs. Supabase Edge Functions vs. Dart server) | Research #2 | ON HOLD |
| Redis vs. Supabase-only caching | Scale projections, Research #3 financial modeling | ON HOLD |
| Reddit OAuth app registration | Gate 1 build start | READY when build begins |

---

*Research complete. Findings feed into RH_Master_Plan. Decisions held until full research sprint is complete.*
