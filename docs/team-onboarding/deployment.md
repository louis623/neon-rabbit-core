# Team Onboarding Deployment

Sparkle Suite and Rep Onboarding live in the same GitHub repo.

## First Production Model

- Sparkle Suite deploys from the repo root.
- Rep Onboarding deploys from `apps/rep-onboarding` as a second Vercel project using the same repo.
- Sparkle Suite owns onboarding site records, invite/access records, team member records, and question records.
- Rep Onboarding reads config and submits questions through Sparkle Suite API routes.

## Nic-Nac Publishing

Nic-Nac publishes an onboarding site by preparing or updating Sparkle Suite records. It does not create a new codebase for each rep.

The current tool creates draft/private onboarding config only. Public publishing, entitlement checks, invite delivery, and durable database writes are separate workflow steps.

## Custom Domains

Custom domains point to the Rep Onboarding Vercel project. The site slug or host mapping determines which Sparkle Suite onboarding record loads.

## Local Verification

```powershell
npm exec vitest run tests/team-onboarding/access.test.ts tests/team-onboarding-api.test.ts tests/team-onboarding/repository.test.ts tests/team-onboarding/site-template.test.ts
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-team-onboarding-routes.test.ts tests/nic-nac/team-onboarding-tools.test.ts tests/nic-nac/tool-routing.test.ts
npx tsc --noEmit --pretty false
cd apps/rep-onboarding
npm run smoke:static
npm run build
```
