import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import {
  buildFinderNicNacSmokeBody,
  evaluateFinderNicNacSmokeResponse,
  extractCookieHeader,
  parseFinderNicNacSmokeConfig,
} from "../../scripts/smoke-finder-nic-nac";

describe("Finder Nic-Nac smoke script helpers", () => {
  it("exposes an npm smoke command for the Finder Nic-Nac route", () => {
    expect(packageJson.scripts["smoke:finder-nic-nac"]).toBe("tsx scripts/smoke-finder-nic-nac.ts");
    expect(packageJson.scripts["smoke:finder-nic-nac:guard"]).toBe(
      "tsx scripts/smoke-finder-nic-nac.ts --expect-missing-model",
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

  it("builds a UI-message request body for the smoke prompt", () => {
    expect(buildFinderNicNacSmokeBody("Add ER13229 to my Trade Board.")).toEqual({
      messages: [
        {
          id: "finder-nic-nac-smoke-1",
          role: "user",
          parts: [{ type: "text", text: "Add ER13229 to my Trade Board." }],
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
      new Response("I can't actually add listings from here.", { status: 200 }),
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
      'data: {"type":"text-delta","delta":"add listings from here."}',
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
});
