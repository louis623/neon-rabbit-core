# Binder/Repo Workspace Bridge

Date: 2026-06-19

## Lesson

The binder/repo split works only if Codex has write access to the implementation repo. If a desktop session opens with the binder as the writable workspace, the agent can still read instructions, but every meaningful repo write/build/deploy step may trigger approval prompts or fail behind the scenes.

This was the source of the June 19 frustration. Louis did not change the workflow. The session was started with the wrong writable root for the kind of implementation work being requested.

## Durable Pattern

For Sparkle Suite implementation sessions:

1. Open `C:\Users\louis\sparkle-suite-repo` as the writable workspace.
2. Keep `C:\Users\louis\sparkle-suite` as the binder/Open Brain source.
3. Use repo `AGENTS.md` to instruct the agent to read binder files first, then do implementation in the repo.

This preserves the established "binder first, repo second" instruction flow while avoiding repeated write approvals.

## Apply To Sparkle Finder

Sparkle Finder should use the same pattern: start future implementation sessions from the Finder repo as the writable workspace, and add a repo-side bridge in `AGENTS.md` that tells agents where the Finder binder/Open Brain lives and what to read first.

## Important Boundary

The binder remains documentation, memory, and handoff space. Do not build, test, commit, push, or deploy from the binder. The implementation repo remains the workbench for code, migrations, tests, commits, pushes, and deploys.

