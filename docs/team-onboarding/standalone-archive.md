# Standalone Rep Onboarding Archive Prep

Archive `louis623/sparkle-rep-onboarding` only after the Sparkle Suite branch containing `apps/rep-onboarding` has been pushed and verified.

## README Replacement

Use this at the top of the standalone repo README before archiving:

```markdown
# Sparkle Rep Onboarding

This repository is archived as of 2026-06-01.

The rep onboarding app now lives inside `louis623/sparkle-suite` at `apps/rep-onboarding` so it can be developed alongside Sparkle Suite Manage My Team, Nic-Nac draft publishing, access control, and onboarding question routing.

This repository remains available as historical reference and should not be deleted.
```

## Archive Sequence

```powershell
git clone https://github.com/louis623/sparkle-rep-onboarding.git sparkle-rep-onboarding-archive-note-work
cd sparkle-rep-onboarding-archive-note-work
git switch main
# Replace README.md top matter with the archive note above.
git add README.md
git commit -m "docs: mark rep onboarding repo archived"
git push origin main
gh repo archive louis623/sparkle-rep-onboarding --yes
```

Do not delete the standalone repository. Keep it as historical reference.
