# Rep Onboarding App

This is the preserved rep-facing onboarding/resource site imported from `louis623/sparkle-rep-onboarding`.

The app remains the working baseline for the rep onboarding experience. Sparkle Suite owns the surrounding Team Management control plane: site records, invite/access records, team member records, Nic-Nac draft publishing, and onboarding question routing.

## Local Development

```powershell
npm install
npm run dev
```

## Build And Smoke Check

```powershell
npm run smoke:static
npm run build
```

## Sparkle Suite Integration

Set these variables when the app should talk to Sparkle Suite:

```text
VITE_SPARKLE_SUITE_API_BASE_URL=https://www.yoursparklesuite.com
```

The private invite token must arrive only through the `?invite=` URL parameter;
never place it in a `VITE_*` variable because Vite exposes those values in the
public browser bundle. Without the API base variable or an invite parameter, the
app runs in local/demo mode using its existing local state.

## Content Sources

Official Bomb Party and FTC resources are linked in the app. Team guidance must be reviewed by the team leader before it is treated as real team guidance.
