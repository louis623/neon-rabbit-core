import { describe, expect, it } from "vitest";

import {
  evaluateBranchPolicy,
  normalizeRepository,
} from "../scripts/check-active-branch.mjs";

describe("Sparkle Suite active branch policy", () => {
  it("accepts only the verified repository, branch, and primary worktree", () => {
    expect(
      evaluateBranchPolicy({
        branch: "codex/nic-nac-trade-hardening",
        remoteRepository: "louis623/sparkle-suite",
        worktree: "C:\\Users\\louis\\sparkle-suite-repo",
        platform: "win32",
      }),
    ).toEqual([]);
  });

  it("fails closed on legacy or unknown branches", () => {
    expect(
      evaluateBranchPolicy({
        branch: "main",
        remoteRepository: "louis623/sparkle-suite",
        worktree: "C:\\Users\\louis\\sparkle-suite-repo",
        platform: "win32",
      }),
    ).toContain(
      'branch "main" is not active; allowed: codex/nic-nac-trade-hardening',
    );
  });

  it("fails closed on the wrong repository or a secondary worktree", () => {
    const errors = evaluateBranchPolicy({
      branch: "codex/nic-nac-trade-hardening",
      remoteRepository: "louis623/another-repo",
      worktree: "C:\\Users\\louis\\.codex\\worktrees\\1234\\sparkle-suite-repo",
      platform: "win32",
    });

    expect(errors).toHaveLength(2);
  });

  it("normalizes supported GitHub remote formats", () => {
    expect(
      normalizeRepository("https://github.com/louis623/sparkle-suite.git"),
    ).toBe("louis623/sparkle-suite");
    expect(normalizeRepository("git@github.com:louis623/sparkle-suite.git")).toBe(
      "louis623/sparkle-suite",
    );
  });
});
