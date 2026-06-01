import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as authModule from "../../lib/sparkle-finder/auth";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";

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

describe("Sparkle Finder account route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("next/navigation");
    vi.doUnmock("../../lib/supabase/server");
  });

  it("renders a sign-in prompt instead of account controls for anonymous visitors", async () => {
    const { renderAccountPageContent } = await import("../../app/account/page");
    const markup = renderToStaticMarkup(renderAccountPageContent(anonymousAccountState()));

    expect(markup).toContain("Sign in to manage your Sparkle Finder account");
    expect(markup).toContain("/auth/sign-in");
    expect(markup).not.toContain("Save communication preferences");
    expect(markup).not.toContain("Save profile basics");
  });

  it("renders privacy and consent labels for authenticated accounts", async () => {
    const { renderAccountPageContent } = await import("../../app/account/page");
    const markup = renderToStaticMarkup(renderAccountPageContent(activeTrialAccountState()));

    expect(markup).toContain("Optional promotional email");
    expect(markup).toContain("Optional promotional SMS");
    expect(markup).toContain("Marketing texts are optional and separate from account/security notices.");
    expect(markup).toContain("Phone is used for account identification, recovery, trial protection, and security notices.");
    expect(markup).toContain("We do not sell your phone number.");
    expect(markup).toContain('name="promotionalSms"');
    expect(markup).not.toContain('name="promotionalSms" checked');
  });

  it("renders the existing profile phone so profile saves preserve it", async () => {
    const { renderAccountPageContent } = await import("../../app/account/page");
    const accountState = activeTrialAccountState() as CurrentSparkleFinderAccountState & {
      status: "authenticated";
      customer: NonNullable<CurrentSparkleFinderAccountState["customer"]> & { phoneE164: string };
    };
    accountState.customer.phoneE164 = "+15551234567";

    const markup = renderToStaticMarkup(renderAccountPageContent(accountState));

    expect(markup).toContain('name="phone"');
    expect(markup).toContain('value="+15551234567"');
  });

  it("shows 45-day Silver trial countdown copy for active trials", async () => {
    const { renderAccountPageContent } = await import("../../app/account/page");
    const markup = renderToStaticMarkup(
      renderAccountPageContent(activeTrialAccountState(), new Date("2026-06-01T12:00:00.000Z")),
    );

    expect(markup).toContain("45-day Silver trial");
    expect(markup).toContain("Trial ends June 10, 2026");
    expect(markup).toContain("9 days left");
  });

  it("shows an honest upgrade CTA when an expired trial maps to Free", async () => {
    const { renderAccountPageContent } = await import("../../app/account/page");
    const markup = renderToStaticMarkup(renderAccountPageContent(expiredTrialMappedToFreeAccountState()));

    expect(markup).toContain("Continue Silver at $4.99/month");
    expect(markup).toContain("Billing setup is coming next.");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("/stripe");
  });

  it("updates consent preferences through the verified-user RPC and revalidates safely", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "casey@example.com" } },
      error: null,
    });
    const rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
    const redirect = vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    });
    const revalidatePath = vi.fn();

    vi.doMock("next/navigation", () => ({ redirect }));
    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: { getUser },
        rpc,
      }),
    }));

    const formData = new FormData();
    formData.set("promotionalEmail", "yes");
    formData.set("promotionalSms", "yes");
    formData.set("accountSmsAllowed", "yes");

    const { updateCommunicationPreferences } = await import("../../app/account/actions");

    await expect(updateCommunicationPreferences(formData)).rejects.toThrow(
      "redirect:/account?message=preferences_saved",
    );
    expect(getUser).toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("update_sparkle_finder_communication_preferences", {
      promotional_email_opt_in: true,
      promotional_sms_opt_in: true,
      account_sms_allowed: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("opts out of optional communications when consent checkboxes are omitted", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "casey@example.com" } },
      error: null,
    });
    const rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
    const redirect = vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    });
    const revalidatePath = vi.fn();

    vi.doMock("next/navigation", () => ({ redirect }));
    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("../../lib/supabase/server", () => ({
      createClient: async () => ({
        auth: { getUser },
        rpc,
      }),
    }));

    const { updateCommunicationPreferences } = await import("../../app/account/actions");

    await expect(updateCommunicationPreferences(new FormData())).rejects.toThrow(
      "redirect:/account?message=preferences_saved",
    );
    expect(getUser).toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("update_sparkle_finder_communication_preferences", {
      promotional_email_opt_in: false,
      promotional_sms_opt_in: false,
      account_sms_allowed: false,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});

function anonymousAccountState(): CurrentSparkleFinderAccountState {
  return {
    status: "anonymous",
    tier: "anonymous",
    displayName: "Guest",
    email: null,
    customer: null,
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      promotionalEmailOptIn: false,
      promotionalSmsOptIn: false,
      accountSmsConsentedAt: null,
      promotionalEmailConsentedAt: null,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: null,
    },
  };
}

function activeTrialAccountState(): CurrentSparkleFinderAccountState {
  return {
    status: "authenticated",
    tier: "silver",
    displayName: "Casey Collector",
    email: "casey@example.com",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.com",
      state: "PA",
      tier: "silver",
    },
    membership: {
      accountId: "user-123",
      personId: "user-123",
      accessState: "silver_trial",
      silverSource: "trial",
      trialStartedAt: "2026-04-26T12:00:00.000Z",
      trialEndsAt: "2026-06-10T12:00:00.000Z",
      silverStartedAt: "2026-04-26T12:00:00.000Z",
      silverEndsAt: "2026-06-10T12:00:00.000Z",
      effectiveState: "silver_trial",
      hasSilverAccess: true,
      isTrialActive: true,
      isTrialExpired: false,
    },
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      promotionalEmailOptIn: true,
      promotionalSmsOptIn: false,
      accountSmsConsentedAt: null,
      promotionalEmailConsentedAt: "2026-05-01T12:00:00.000Z",
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-04-26T12:00:00.000Z",
    },
  };
}

function expiredTrialMappedToFreeAccountState(): CurrentSparkleFinderAccountState {
  const base = activeTrialAccountState() as CurrentSparkleFinderAccountState & { status: "authenticated" };

  return {
    ...base,
    tier: "free",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.com",
      state: "PA",
      tier: "free",
    },
    membership: {
      ...base.membership!,
      trialEndsAt: "2026-05-10T12:00:00.000Z",
      silverEndsAt: "2026-05-10T12:00:00.000Z",
      effectiveState: "free",
      hasSilverAccess: false,
      isTrialActive: false,
      isTrialExpired: true,
    },
  };
}
