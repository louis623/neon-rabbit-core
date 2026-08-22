import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import {
  buildFinderNicNacSmokeBody,
  evaluateFinderNicNacSmokeResponse,
  extractCookieHeader,
  parseFinderNicNacSmokeConfig,
} from "../../scripts/smoke-finder-nic-nac";
import {
  getMissingFinderLinkedRuntimeSmokeConfig,
  parseFinderLinkedRuntimeSmokeConfig,
} from "../../scripts/smoke-finder-linked-runtime";

describe("Finder Nic-Nac smoke script helpers", () => {
  it("exposes an npm smoke command for the Finder Nic-Nac route", () => {
    expect(packageJson.scripts["smoke:finder-nic-nac"]).toBe("tsx scripts/smoke-finder-nic-nac.ts");
    expect(packageJson.scripts["smoke:finder-nic-nac:guard"]).toBe(
      "tsx scripts/smoke-finder-nic-nac.ts --expect-missing-model",
    );
    expect(packageJson.scripts["smoke:finder-linked-runtime"]).toBe(
      "tsx scripts/smoke-finder-linked-runtime.ts",
    );
  });

  it("defaults to local preview auth and configured-model expectation", () => {
    const config = parseFinderNicNacSmokeConfig({});

    expect(config).toEqual({
      baseUrl: "http://127.0.0.1:4310",
      port: 4310,
      startServer: true,
      expectModelConfigured: true,
      authMode: "silver",
      prompt: "Show my favorite reps.",
    });
  });

  it("uses an explicit guard flag for missing-model smoke", () => {
    expect(parseFinderNicNacSmokeConfig({}, ["--expect-missing-model"])).toMatchObject({
      expectModelConfigured: false,
    });
  });

  it("captures the internal smoke token for deployed reviewer sessions", () => {
    const config = parseFinderNicNacSmokeConfig({
      SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN: " smoke-token ",
      SPARKLE_FINDER_NIC_NAC_SMOKE_BASE_URL: "https://sparkle-finder-dev.vercel.app/",
      SPARKLE_FINDER_NIC_NAC_SMOKE_START_SERVER: "false",
    });

    expect(config).toMatchObject({
      baseUrl: "https://sparkle-finder-dev.vercel.app",
      internalSmokeToken: "smoke-token",
      startServer: false,
    });
  });

  it("builds a UI-message request body for the smoke prompt", () => {
    expect(buildFinderNicNacSmokeBody("Add ER13229 to my Dance Floor.")).toEqual({
      messages: [
        {
          id: "finder-nic-nac-smoke-1",
          role: "user",
          parts: [{ type: "text", text: "Add ER13229 to my Dance Floor." }],
        },
      ],
    });
  });

  it("accepts model_not_configured as the expected blocked state before the key is installed", async () => {
    const result = await evaluateFinderNicNacSmokeResponse(
      Response.json({ error: "model_not_configured" }, { status: 503 }),
      { expectModelConfigured: false },
    );

    expect(result).toEqual({
      ok: true,
      status: "blocked_missing_model",
      detail: "Finder Nic-Nac returned model_not_configured as expected.",
    });
  });

  it("fails model_not_configured when the smoke expects a configured model", async () => {
    const result = await evaluateFinderNicNacSmokeResponse(
      Response.json({ error: "model_not_configured" }, { status: 503 }),
      { expectModelConfigured: true },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("unexpected_missing_model");
  });

  it("checks successful streams for hard-fail phrases", async () => {
    const result = await evaluateFinderNicNacSmokeResponse(
      new Response("I need you logged into Sparkle Suite before I can change your workspace.", {
        status: 200,
      }),
      { expectModelConfigured: true },
    );
    const hardFailResult = await evaluateFinderNicNacSmokeResponse(
      new Response("I can't actually add dancers from here.", { status: 200 }),
      { expectModelConfigured: true },
    );

    expect(result).toEqual({
      ok: true,
      status: "stream_ok",
      detail: "Finder Nic-Nac returned a successful stream with no hard-fail phrases.",
    });
    expect(hardFailResult.ok).toBe(false);
    expect(hardFailResult.status).toBe("hard_fail_phrase");
  });

  it("checks framed AI SDK streams for hard-fail phrases split across deltas", async () => {
    const framedStream = [
      'data: {"type":"text-delta","delta":"I can\'t actually "}',
      'data: {"type":"text-delta","delta":"add dancers from here."}',
    ].join("\n");

    const result = await evaluateFinderNicNacSmokeResponse(
      new Response(framedStream, { status: 200 }),
      { expectModelConfigured: true },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("hard_fail_phrase");
  });

  it("extracts the preview auth cookie from a redirect response", () => {
    const headers = new Headers();
    headers.append("set-cookie", "sparkle_finder_auth_mode=silver; Path=/; HttpOnly; SameSite=Lax");
    headers.append("set-cookie", "other=value; Path=/");

    expect(extractCookieHeader(headers)).toBe("sparkle_finder_auth_mode=silver; other=value");
  });

  it("parses deployed linked-runtime smoke config with an explicit Secret Rep ID", () => {
    const config = parseFinderLinkedRuntimeSmokeConfig({
      SPARKLE_FINDER_LINKED_SMOKE_BASE_URL: "https://finder.example/",
      SPARKLE_FINDER_LINKED_SMOKE_SECRET_REP_ID_NUMBER: " secret-rep-id ",
      SPARKLE_FINDER_SERVICE_ROLE_KEY: "finder-service-role",
      SPARKLE_FINDER_SUPABASE_URL: "https://finder.supabase.co",
    });

    expect(config).toMatchObject({
      baseUrl: "https://finder.example",
      finderServiceRoleKey: "finder-service-role",
      finderSupabaseUrl: "https://finder.supabase.co",
      headless: true,
      runNicNac: true,
      secretRepIdNumber: "secret-rep-id",
    });
    expect(getMissingFinderLinkedRuntimeSmokeConfig(config)).toEqual([]);
  });

  it("reports Suite lookup settings as missing when no explicit Secret Rep ID is provided", () => {
    const config = parseFinderLinkedRuntimeSmokeConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://finder.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "finder-service-role",
    });

    expect(getMissingFinderLinkedRuntimeSmokeConfig(config)).toEqual([
      "SPARKLE_SUITE_SUPABASE_URL or SPARKLE_FINDER_LINKED_SMOKE_SECRET_REP_ID_NUMBER",
      "SPARKLE_SUITE_SERVICE_ROLE_KEY or SPARKLE_FINDER_LINKED_SMOKE_SECRET_REP_ID_NUMBER",
      "SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN or SPARKLE_FINDER_LINKED_SMOKE_SECRET_REP_ID_NUMBER",
    ]);
  });
});
