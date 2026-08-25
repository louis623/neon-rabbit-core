# Sparkle Suite Finder API Read-Only Test Handoff

Created: 2026-06-05

## Context

Sparkle Finder is already built. The next desired step is to wire Sparkle Finder to the new Sparkle Suite public Finder API, but only after confirming the Sparkle Suite API is reachable from a deployed URL.

Sparkle Finder should eventually consume these Sparkle Suite endpoints:

- `GET /api/public/finder/catalog`
- `GET /api/public/finder/catalog/:designId`
- `GET /api/public/finder/availability?designId=...`

## What Was Tested

Read-only HTTP checks were run against:

- `https://www.yoursparklesuite.com/api/public/finder/catalog?limit=3`
- `https://sparkle-suite.vercel.app/api/public/finder/catalog?limit=3`

## Result

Both returned:

```text
404 Not Found
```

Because the catalog endpoint returned 404, the detail and availability endpoints could not be meaningfully tested from production/public URLs. They require a real `designId` from the catalog response.

## What Was Found Locally

The Finder API route files do exist in the local Sparkle Suite repo:

```text
C:\Users\louis\sparkle-suite-repo\app\api\public\finder\catalog\route.ts
C:\Users\louis\sparkle-suite-repo\app\api\public\finder\catalog\[designId]\route.ts
C:\Users\louis\sparkle-suite-repo\app\api\public\finder\availability\route.ts
```

The API code appears designed to return the fields Sparkle Finder needs, including:

- `designId`
- `itemNumber`
- `designName`
- `collectionName`
- `collectionYear`
- `jewelryType`
- `material`
- `mainStone`
- `bpMsrp`
- `canonicalPhotoUrl`
- `searchTags`
- `availableListingCount`
- exact availability matches
- similar availability matches
- rep info
- next show info

## Likely Meaning

The API appears to exist in the local Sparkle Suite repo, but the deployed public Sparkle Suite sites tested are not currently serving those routes.

Likely causes:

- The branch/commit containing `app/api/public/finder/*` has not been deployed.
- The routes were deployed to a different preview URL.
- Production/custom domain is on an older deployment.
- The custom domain points to a Vercel project/deployment that does not include the Finder API routes.
- Less likely: middleware/routing is blocking or rewriting the route.

## Request For Sparkle Suite Session

Please verify which deployed Sparkle Suite URL contains the current branch with:

```text
app/api/public/finder/catalog/route.ts
app/api/public/finder/catalog/[designId]/route.ts
app/api/public/finder/availability/route.ts
```

Then confirm these return successfully:

```text
GET https://<actual-sparkle-suite-deployment>/api/public/finder/catalog?limit=3
GET https://<actual-sparkle-suite-deployment>/api/public/finder/catalog/<designId>
GET https://<actual-sparkle-suite-deployment>/api/public/finder/availability?designId=<designId>
```

Expected first success signal:

```text
200 OK
{ "items": [...] }
```

Once the deployed API returns 200, Sparkle Finder can be wired to that base URL.

