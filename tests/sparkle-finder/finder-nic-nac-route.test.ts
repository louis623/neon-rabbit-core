import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { nicNacRouteRuntime, streamTextMock, createOpenAIMock } = vi.hoisted(() => ({
  nicNacRouteRuntime: {
    accountState: {
      status: "anonymous",
      tier: "anonymous",
      displayName: "Guest",
      email: null,
      customer: null,
    } as unknown,
  },
  streamTextMock: vi.fn(),
  createOpenAIMock: vi.fn((_options?: unknown) => (model: string) => ({
    provider: "openai",
    model,
  })),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    streamText: (options: unknown) => streamTextMock(options),
  };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: (options: unknown) => createOpenAIMock(options),
}));

vi.mock("@/lib/sparkle-finder/account-service", () => ({
  getCurrentSparkleFinderAccount: async () => nicNacRouteRuntime.accountState,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({}),
}));

import { POST } from "../../app/api/finder/nic-nac/route";

describe("Finder Nic-Nac API route", () => {
  beforeEach(() => {
    streamTextMock.mockReset();
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: () => new Response("streamed Nic-Nac"),
    });
    nicNacRouteRuntime.accountState = {
      status: "anonymous",
      tier: "anonymous",
      displayName: "Guest",
      email: null,
      customer: null,
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  it("streams Silver Finder Nic-Nac through the shared OpenAI model policy", async () => {
    nicNacRouteRuntime.accountState = {
      status: "authenticated",
      tier: "silver",
      displayName: "Brittany",
      email: "brittany@example.test",
      customer: {
        id: "customer-silver-brittany",
        displayName: "Brittany",
        email: "brittany@example.test",
        state: "NC",
        tier: "silver",
      },
      membership: {
        hasSilverAccess: true,
      },
    };
    vi.stubEnv("NIC_NAC_HUMAN_DEFAULT_MODEL", "gpt-5.4-test");

    const response = await POST(createNicNacRequest());

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("streamed Nic-Nac");
    expect(createOpenAIMock).toHaveBeenCalledWith({ baseURL: "https://api.openai.com/v1" });
    expect(streamTextMock).toHaveBeenCalledTimes(1);
    expect(streamTextMock.mock.calls[0][0]).toMatchObject({
      model: {
        provider: "openai",
        model: "gpt-5.4-test",
      },
      providerOptions: {
        openai: {
          reasoningEffort: "medium",
        },
      },
    });
  });

  it("keeps Finder Nic-Nac model routing out of route-level Anthropic/Haiku hardcoding", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "app/api/finder/nic-nac/route.ts"),
      "utf8",
    );
    const packageSource = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(routeSource).not.toContain("@ai-sdk/anthropic");
    expect(routeSource).not.toContain("createAnthropic");
    expect(routeSource).not.toContain("claude-haiku");
    expect(packageSource).not.toContain("@ai-sdk/anthropic");
    expect(envExample).toContain("OPENAI_API_KEY=");
    expect(envExample).toContain("NIC_NAC_HUMAN_DEFAULT_MODEL=");
    expect(routeSource).toContain("getNicNacModelPolicy");
    expect(routeSource).toContain("getNicNacLanguageModel");
    expect(routeSource).toContain("getNicNacProviderOptions");
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
