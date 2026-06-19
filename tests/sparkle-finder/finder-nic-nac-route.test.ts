import { beforeEach, describe, expect, it, vi } from "vitest";

const nicNacRouteRuntime = vi.hoisted(() => ({
  accountState: {
    status: "anonymous",
    tier: "anonymous",
    displayName: "Guest",
    email: null,
    customer: null,
  } as unknown,
}));

vi.mock("@/lib/sparkle-finder/account-service", () => ({
  getCurrentSparkleFinderAccount: async () => nicNacRouteRuntime.accountState,
}));

import { POST } from "../../app/api/finder/nic-nac/route";

describe("Finder Nic-Nac API route", () => {
  beforeEach(() => {
    nicNacRouteRuntime.accountState = {
      status: "anonymous",
      tier: "anonymous",
      displayName: "Guest",
      email: null,
      customer: null,
    };
  });

  it("requires an authenticated Sparkle Finder account", async () => {
    const response = await POST(createNicNacRequest());

    await expect(response.json()).resolves.toEqual({ error: "unauthenticated" });
    expect(response.status).toBe(401);
  });

  it("requires Silver access before streaming model-backed Nic-Nac", async () => {
    nicNacRouteRuntime.accountState = {
      status: "authenticated",
      tier: "free",
      displayName: "Marlena",
      email: "marlena@example.test",
      customer: {
        id: "customer-free-marlena",
        displayName: "Marlena",
        email: "marlena@example.test",
        state: "NC",
        tier: "free",
      },
      membership: {
        hasSilverAccess: false,
      },
    };

    const response = await POST(createNicNacRequest());

    await expect(response.json()).resolves.toEqual({ error: "silver_required" });
    expect(response.status).toBe(403);
  });
});

function createNicNacRequest(): Request {
  return new Request("https://sparkle-finder.example/api/finder/nic-nac", {
    method: "POST",
    body: JSON.stringify({
      messages: [
        {
          id: "message-1",
          role: "user",
          parts: [{ type: "text", text: "Show my favorite reps." }],
        },
      ],
    }),
  });
}
