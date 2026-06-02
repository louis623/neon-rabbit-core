# PR: Add Rep Onboarding To Sparkle Suite

## Summary

- Imports the existing `sparkle-rep-onboarding` app intact into `apps/rep-onboarding` so the current rep-facing site can continue without a rebuild.
- Adds Team Onboarding persistence, API routes, Manage My Team shell routes/copy, and Nic-Nac draft publishing semantics.
- Documents same-repo deployment and the safe archive sequence for the standalone onboarding repo.

## Test Plan

- `npm exec vitest run tests/team-onboarding/access.test.ts tests/team-onboarding-api.test.ts tests/team-onboarding/repository.test.ts tests/team-onboarding/site-template.test.ts`
- `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-team-onboarding-routes.test.ts tests/nic-nac/team-onboarding-tools.test.ts tests/nic-nac/tool-routing.test.ts`
- `npx tsc --noEmit --pretty false`
- `cd apps/rep-onboarding && npm run smoke:static && npm run build`
- `npm run build`

## Notes

- The imported onboarding app still runs in local/demo mode when Sparkle Suite API environment variables are absent.
- Nic-Nac currently creates draft/private onboarding config only. Public publishing, entitlement checks, invite delivery, and durable database writes remain separate workflow steps.
- The standalone `louis623/sparkle-rep-onboarding` repo should be archived only after this branch is merged and verified.
