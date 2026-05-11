# The Rabbit Hole — Research #2: Flutter + Supabase Integration Path

**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
**🔍 HOW CLAUDE ACCESSES IT:** Upload to chat when needed
**📁 UPLOAD TO PROJECT:** No — reference doc
**🏷 PROJECT:** Rabbit Hole
**👤 WHO USES IT:** Louis (reference), Claude (on demand), Claude Code (build context)
**🔄 UPDATE TRIGGER:** New research findings or technical decisions that supersede these findings

**Research Source:** Gemini Deep Research | **Date:** April 6, 2026 | **Status:** COMPLETE

---

## Purpose

Technical integration analysis for migrating The Rabbit Hole from Next.js to Flutter while retaining the existing Supabase backend (`neon-rabbit-core`). Covers SDK maturity, authentication flows, RSS proxy architecture, offline support, deployment, and the practical migration path.

---

## Supabase Flutter SDK — Maturity Assessment

**Verdict: Production-ready.** The `supabase_flutter` package is a unified client that handles auth, database, real-time, storage, and edge functions through coordinated sub-libraries.

**Key architectural feature:** The SDK automatically injects JWTs into all requests via an `AuthHttpClient` wrapper. This means Row-Level Security (RLS) is enforced transparently — no manual token handling per query. The existing four `rh_` tables and all RLS policies carry forward with zero schema changes.

### SDK Module Breakdown

| Module | Dart Package | Functionality | Platform Logic |
|---|---|---|---|
| Auth | gotrue | Session persistence, OAuth, PKCE | SharedPreferences (native) / localStorage (web) |
| Database | postgrest | Fluent query builder for CRUD | Universal Dart |
| Realtime | realtime | WebSocket management + heartbeat | RxDart BehaviorSubject streams |
| Storage | storage_client | Bucket-level access, file uploads | Binary stream handling |
| Functions | functions_client | Edge function invocation | Regional selection support |

### Developer Experience

- Fluent, builder-based API that mirrors the JavaScript SDK (familiar for teams coming from React)
- `SupabaseStreamBuilder` combines initial data fetch with real-time updates — useful for the date-sorted timeline
- Initialization happens once at app entry point, then available globally

### Known Limitations

- Real-time connections require a 30-second WebSocket heartbeat to prevent mobile OS from killing the background process
- Complex joins in real-time streams are limited — must listen to a specific table and do client-side joins, or use database views compatible with real-time replication
- Not a blocker for Gate 1, but shapes how we architect real-time features

---

## Authentication — Google OAuth + Apple Sign-In

### Google OAuth on Mobile

Two paths available:

**PKCE Flow (browser-based):** App launches system browser → user signs in → Google redirects to Supabase callback → Supabase redirects back to app via deep link (custom URL scheme like `io.rabbithole.app://login-callback`) → app exchanges authorization code for tokens. Works but feels clunky — browser redirect breaks the native app feel.

**Native ID Token Flow (recommended for mobile):** Uses the `google_sign_in` Flutter package to show a native in-app Google dialog. User taps their account, package returns an `idToken`, app passes it to `supabase.auth.signInWithIdToken()`. No browser redirect. Feels like a real app. This is the recommended path.

| Feature | PKCE Flow (Browser) | Native ID Token Flow |
|---|---|---|
| User experience | External browser redirect | In-app native dialog |
| Security | Verifier/challenge pair | Nonce-based verification |
| Complexity | High (requires deep link config) | Moderate (requires native SDKs) |
| Best use case | Web and fallback | iOS and Android (primary) |

### Apple Sign-In — MANDATORY

**This is a hard App Store requirement.** If the app offers Google Sign-In (or any third-party social login), Apple mandates that Apple Sign-In must also be offered. The app WILL be rejected without it.

**Critical implementation detail:** Apple only shares the user's name and email during the FIRST authorization. All subsequent logins return only the `idToken`. The app must capture this data on first sign-up and update the `rh_users` table or Supabase user metadata immediately.

**Integration:** Uses the `sign_in_with_apple` Flutter package → obtains `idToken` → passes to Supabase auth.

### Session Persistence and Token Refresh

- SDK handles session storage automatically (SharedPreferences on mobile, localStorage on web)
- Access tokens are short-lived (~60 minutes), refresh tokens are long-lived
- SDK auto-refreshes before expiration with clock-skew protection
- No manual token management needed

---

## RSS Proxy Architecture — Edge Functions vs. Vercel

### Recommendation: Move proxy to Supabase Edge Functions (Deno)

| Criteria | Vercel Serverless (Node.js) | Supabase Edge Functions (Deno) |
|---|---|---|
| Runtime | Node.js (V8) | Deno (V8 Isolates) |
| Cold start | 200ms–800ms | ~42ms (97% improvement) |
| Dependencies | package.json (NPM) | deno.json (URL/JSR imports) |
| Authentication | Manual JWT verification | Built-in Supabase Auth context |
| Scalability | Regional | Globally distributed by default |

**Why this matters for Rabbit Hole:** Feed refreshes need to feel instantaneous. A 42ms cold start vs. 800ms is the difference between "snappy" and "loading." Plus, consolidating on Supabase means one platform for everything — database, auth, edge functions, storage.

### Parser Shift

Moving to Deno means Node.js libraries like Feedsmith (recommended in Research #1) don't apply directly. Deno-compatible options:

- `jsr:@mikaelporttila/rss` — supports RSS 2.0, Atom, and Dublin Core extensions
- `https://deno.land/x/rss/mod.ts` — alternative option

**Parser decision remains ON HOLD** until all research is complete. The right parser depends on whether Deno options handle all the namespace requirements (iTunes for podcasts, Media for YouTube thumbnails, etc.) identified in Research #1.

### CORS Considerations

- Mobile apps don't enforce CORS — not an issue for the primary platform
- Flutter Web does encounter CORS if the proxy is on a different domain (Vercel)
- Moving proxy to Supabase Edge Functions eliminates CORS issues since everything shares the same root domain
- If proxy stays on Vercel, must configure `Access-Control-Allow-Origin` headers

---

## Offline Support — Local Database Layer

### Recommendation: Implement offline-first caching for Gate 1

The research recommends a local database on the device so the UI works without internet. This matters for the target audience — students and researchers on spotty Wi-Fi, subway commutes, etc.

### Local Database Options

| Engine | Type | Strength | Weakness |
|---|---|---|---|
| Isar | NoSQL / Object | Extreme speed on large sets, multi-field indexing | Newer ecosystem |
| Drift (SQLite) | SQL / Relational | Compile-time safety, joins, predictable migrations | Higher boilerplate |
| Hive | Key-Value | Simple, fast for settings | No complex queries |

**Research recommendation:** Isar for the card timeline (fast, handles complex date-sorted filters well). Drift as alternative if complex relational queries become necessary.

### The "Source of Truth" Sync Pattern

1. **Local store is primary.** The UI always reads from and writes to the local database. Actions like "save card" happen instantly with no network wait.
2. **Background sync.** A repository layer manages synchronization between local store and Supabase. Uses an "outbox" pattern — queues local changes and pushes to Supabase when network is available.
3. **Result:** Jank-free experience. App feels fast even offline. Data syncs when connectivity returns.

---

## Flutter Web Deployment on Vercel

### Build and Routing

- Build command: `flutter build web --release`
- Output directory: `build/web`
- Requires `vercel.json` rewrite rule for SPA routing (prevents 404 on page refresh):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Renderer Options

| Renderer | Size | Best For | Trade-off |
|---|---|---|---|
| HTML | Smaller | Content-heavy pages, mobile browsers | Less visual fidelity |
| CanvasKit | +~2MB | Pixel-perfect match with mobile app | Slower initial load |

### SEO Impact

Flutter Web is NOT server-side rendered — limited SEO. For Rabbit Hole this is acceptable since primary content is behind auth. The landing page / marketing site could remain a separate static page if SEO matters there.

---

## Claude Code + Flutter Compatibility

- Dart's strong typing and structured project layout (`pubspec.yaml`, `lib/` directory) give Claude Code excellent context for code generation
- Handles complex multi-file refactoring well (e.g., migrating state management patterns across `rh_` table structures)
- Can read debug console logs and suggest fixes for common Flutter issues
- **Limitation:** Claude Code cannot visually see the mobile UI — Louis must verify via emulator/device. Fits the existing "Claude builds, Louis tests" workflow.

---

## Component Architecture Translation

For reference when porting from Next.js to Flutter:

| Next.js / React | Flutter / Dart |
|---|---|
| `useState` / `useEffect` | `StatefulWidget` / `initState` |
| Context API / Zustand | Riverpod or Bloc |
| Tailwind CSS | `ThemeData` and `BoxDecoration` |
| Next.js Router | GoRouter or Navigator 2.0 |
| Fetch / SWR | `Supabase.stream()` / `FutureBuilder` |

---

## Migration Path — Execution Roadmap

The research suggests this order of operations:

1. **Initialize Flutter app** — Create project, link to existing `neon-rabbit-core` URL and anon key
2. **Configure native OAuth** — Register Android and iOS Client IDs in Google Cloud Console, add to Supabase dashboard, implement Apple Sign-In
3. **Implement local cache** — Integrate Isar for offline storage, build repository layer to fetch from `rh_saved_cards`
4. **Port RSS proxy** — Move Vercel Node.js logic to Supabase Edge Function (Deno)
5. **Build and validate UI** — Flutter's flexible layout system, ensure timeline cohesion across mobile and desktop
6. **Deploy web to Vercel** — Configure build pipeline with SPA routing rules

**Note:** This sequence differs from the master plan's current build order. Auth and proxy migration come before the UI rebuild. Decision on sequencing held until all research is complete.

---

## Backend Continuity — What Carries Forward

| Component | Migration Impact |
|---|---|
| `rh_users` table | Zero changes — SDK handles JWT/RLS automatically |
| `rh_subjects` table | Zero changes |
| `rh_channels` table | Zero changes |
| `rh_saved_cards` table | Zero changes |
| RLS policies | Zero changes — continue to work via SDK's `AuthHttpClient` |
| Google OAuth (Supabase config) | Add mobile redirect URIs (deep link schemes) |
| Auth trigger (auto-insert `rh_users` row) | Zero changes |

**Primary migration task:** Add mobile deep link redirect URIs to Supabase Auth dashboard alongside existing web redirect.

---

## Key Decisions Needed (Pending Further Research)

| Decision | Blocked By | Status |
|---|---|---|
| Parser selection (Deno-compatible RSS parser) | Evaluate Deno options against Research #1 namespace requirements | ON HOLD |
| Proxy location (Supabase Edge Functions vs. Vercel) | Final architecture review after all research | ON HOLD |
| Offline cache engine (Isar vs. Drift) | Gate 1 feature scope confirmation | ON HOLD |
| Build sequence (auth-first vs. UI-first) | All research complete, master plan v1.2 update | ON HOLD |
| State management (Riverpod vs. Bloc) | Flutter validation session (Step 1) | ON HOLD |

---

## Items to Add to Master Plan (Banked)

These findings should be incorporated into the master plan once all research is complete:

- Apple Sign-In is a mandatory App Store requirement — add to auth step
- Offline-first local caching should be a Gate 1 feature (Isar recommended)
- Proxy architecture: Supabase Edge Functions (Deno) replaces Vercel Node.js
- Parser decision shifts from Node.js to Deno-compatible libraries
- Auth deep link configuration needed (Android `intent-filter` + iOS URL scheme)
- Flutter Web deployment config for Vercel (SPA rewrite rule)
- Build sequence may need reordering (auth + proxy before UI rebuild)

---

*Research complete. Findings feed into RH_Master_Plan. All decisions held until full research sprint is complete.*
