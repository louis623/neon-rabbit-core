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
    vi.resetModules();
    vi.doUnmock("../../lib/supabase/server");
  });

  it("returns a Next response without throwing when Supabase is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { updateSession } = await import("../../lib/supabase/proxy");
    const response = await updateSession(new NextRequest("http://localhost:3000/dashboard"));

    expect(response.status).toBe(200);
  });

  it("redirects successful email confirmations to a safe local next path", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });

    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          verifyOtp,
        },
      }),
    }));

    const { GET } = await import("../../app/auth/confirm/route");
    const response = await GET(
      new Request("http://localhost:4310/auth/confirm?token_hash=abc123&type=email&next=/silver"),
    );

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc123", type: "email" });
    expect(response.headers.get("location")).toBe("http://localhost:4310/silver");
  });

  it("ignores external confirmation next URLs", async () => {
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        },
      }),
    }));

    const { GET } = await import("../../app/auth/confirm/route");
    const response = await GET(
      new Request("http://localhost:4310/auth/confirm?token_hash=abc123&type=email&next=https://evil.example"),
    );

    expect(response.headers.get("location")).toBe("http://localhost:4310/dashboard");
  });

  it("redirects failed confirmations to sign-in with a safe error", async () => {
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({ error: new Error("bad token") }),
        },
      }),
    }));

    const { GET } = await import("../../app/auth/confirm/route");
    const response = await GET(new Request("http://localhost:4310/auth/confirm?token_hash=bad&type=email"));

    expect(response.headers.get("location")).toBe("http://localhost:4310/auth/sign-in?error=confirmation_failed");
  });
});
