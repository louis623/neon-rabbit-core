# Team Onboarding

Team Onboarding is the Sparkle Suite feature that lets a Sparkle Suite user create private onboarding/resource pages for team members.

The rep-facing app lives in `apps/rep-onboarding`. The manager-facing control plane lives in Sparkle Suite under Manage My Team. Questions from onboarding pages route back to Manage My Team.

The standalone `louis623/sparkle-rep-onboarding` repo should be archived after this repo contains the imported app and smoke checks pass.

## Product Boundary

- Team members do not publicly sign up for this feature.
- A Sparkle Suite user issues onboarding to a specific team member.
- Nic-Nac prepares draft/private onboarding config for Manage My Team.
- Sparkle Suite owns access control, persistence, invite workflow, and question routing.
- The imported rep onboarding app remains the baseline rep-facing experience.
