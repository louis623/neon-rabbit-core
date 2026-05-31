import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as authModule from "../../lib/sparkle-finder/auth";

const auth = authModule as typeof authModule & {
  isLocalPreviewAuthEnabled?: () => boolean;
};

describe("Sparkle Finder auth boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("represents unconfigured Supabase auth as anonymous with no credentials", () => {
    const boundary = auth.createNoCredentialSupabaseAuthBoundary();
    const accountState = boundary.getAccountState();

    expect(boundary).toMatchObject({
      adapter: "supabase",
      isConfigured: false,
    });
    expect(accountState).toMatchObject({
      status: "anonymous",
      tier: "anonymous",
      email: null,
      customer: null,
    });
  });

  it("disables local preview auth in production unless the preview flag is enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "");

    expect(auth.isLocalPreviewAuthEnabled?.()).toBe(false);

    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "true");

    expect(auth.isLocalPreviewAuthEnabled?.()).toBe(true);
  });

  it("enables local preview auth outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "");

    expect(auth.isLocalPreviewAuthEnabled?.()).toBe(true);
  });
});

describe("Sparkle Finder Supabase proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a Next response without throwing when Supabase is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { updateSession } = await import("../../lib/supabase/proxy");
    const response = await updateSession(new NextRequest("http://localhost:3000/dashboard"));

    expect(response.status).toBe(200);
  });
});
