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

  it.each([
    ["/\\evil.example"],
    ["/%5Cevil.example"],
    ["//evil.example"],
    ["/%2Fevil.example"],
    ["https://evil.example"],
    ["javascript:alert(1)"],
    ["silver"],
  ])("ignores unsafe confirmation next path %s", async (next) => {
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        },
      }),
    }));

    const { GET } = await import("../../app/auth/confirm/route");
    const response = await GET(
      new Request(
        `http://localhost:4310/auth/confirm?token_hash=abc123&type=email&next=${encodeURIComponent(next)}`,
      ),
    );

    expect(response.headers.get("location")).toBe("http://localhost:4310/dashboard");
  });

  it("preserves safe confirmation next paths with query strings", async () => {
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        },
      }),
    }));

    const { GET } = await import("../../app/auth/confirm/route");
    const response = await GET(
      new Request(
        `http://localhost:4310/auth/confirm?token_hash=abc123&type=email&next=${encodeURIComponent(
          "/silver?from=signup",
        )}`,
      ),
    );

    expect(response.headers.get("location")).toBe("http://localhost:4310/silver?from=signup");
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

describe("Sparkle Finder signup server actions", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("next/navigation");
    vi.doUnmock("../../lib/supabase/server");
  });

  it("requests an email magic link without requiring a password", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const redirect = vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    });

    vi.doMock("next/navigation", () => ({ redirect }));
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: {
          signInWithOtp,
        },
      }),
    }));

    const formData = new FormData();
    formData.set("displayName", "Sparkle Mama");
    formData.set("email", "mama@example.com");
    formData.set("phone", "555-123-4567");
    formData.set("state", "CA");
    formData.set("privacyAcknowledged", "yes");

    const { requestMagicLink } = await import("../../app/auth/sign-up/actions");

    await expect(requestMagicLink(formData)).rejects.toThrow("redirect:/auth/sign-in?message=check_email");
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "mama@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/confirm?next=%2Fsilver%3Ffrom%3Dsignup",
        data: {
          display_name: "Sparkle Mama",
          phone: "555-123-4567",
          state: "CA",
          privacy_acknowledged: true,
          promotional_email_opt_in: false,
          promotional_sms_opt_in: false,
        },
      },
    });
  });
});
