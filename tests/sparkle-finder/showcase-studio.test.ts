import { describe, expect, it, vi } from "vitest";
import {
  getShowcaseStudioConfig,
  submitShowcaseStudioIntake,
  type ShowcaseStudioIntakeRequest,
  type ShowcaseStudioVariantCandidate,
} from "../../lib/sparkle-finder/showcase-studio";

const submissionId = "11111111-1111-4111-8111-111111111111";
const labelAssetId = "22222222-2222-4222-8222-222222222222";
const jewelryAssetId = "33333333-3333-4333-8333-333333333333";
const rubyDesignId = "44444444-4444-4444-8444-444444444444";
const quartzDesignId = "55555555-5555-4555-8555-555555555555";

describe("Sparkle Finder Showcase Studio v2 intake", () => {
  it("posts a bounded v2 resolve payload without base64 or customer identity", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      schemaVersion: 2,
      ok: true,
      status: "publish_queued",
      retryable: false,
      mutationReplayed: false,
      catalogDraft: { itemNumber: "RBP5902", mainStone: "Ruby" },
    }));

    const request = {
      ...resolveRequest(),
      customerEmail: "casey@example.com",
      originalLabelImageDataUrl: "data:image/jpeg;base64,secret-label",
    } as ShowcaseStudioIntakeRequest & { customerEmail: string; originalLabelImageDataUrl: string };
    const result = await submitShowcaseStudioIntake(request, {
      config: suiteIntakeConfig(),
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith("https://suite.example/api/internal/finder/jewelry-intake/v2", {
      body: expect.any(String),
      cache: "no-store",
      headers: {
        Authorization: "Bearer finder-to-suite-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const postedCall = fetcher.mock.calls[0] as unknown as [string, { body: string }];
    const payload = JSON.parse(postedCall[1].body);
    expect(payload).toEqual({
      schemaVersion: 2,
      sourceProduct: "sparkle_finder",
      finderSubmissionId: submissionId,
      action: "resolve",
      labelDetails: { itemNumber: "RBP5902", mainStone: "Ruby" },
      customerNote: "Ruby variant from the original label.",
      photoEvidence: [
        {
          finderSubmissionId: submissionId,
          finderAssetId: labelAssetId,
          claimedKind: "label",
          temporaryReadUrl: "https://finder.example/private/label",
        },
        {
          finderSubmissionId: submissionId,
          finderAssetId: jewelryAssetId,
          claimedKind: "jewelry",
          temporaryReadUrl: "https://finder.example/private/jewelry",
        },
      ],
    });
    expect(JSON.stringify(payload)).not.toContain("base64");
    expect(JSON.stringify(payload)).not.toContain("casey@example.com");
    expect(result).toMatchObject({ ok: true, status: "publish_queued", mutationReplayed: false });
  });

  it("preserves same-item-number ambiguity candidates by exact design identity", async () => {
    const ruby = candidate({
      designId: rubyDesignId,
      mainStone: "Ruby",
      canonicalPhotoUrl: "https://cdn.example/ruby.jpg",
      description: "Deep red center stone.",
    });
    const quartz = candidate({
      designId: quartzDesignId,
      designName: "Rose Quartz Birthday Ring",
      mainStone: "Rose Quartz",
      canonicalPhotoUrl: "https://cdn.example/quartz.jpg",
      description: "Soft pink center stone.",
    });
    const result = await submitShowcaseStudioIntake(resolveRequest({ labelDetails: { itemNumber: "RBP5902" } }), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse({
        schemaVersion: 2,
        ok: true,
        status: "needs_variant_confirmation",
        retryable: false,
        mutationReplayed: false,
        variantCandidates: [ruby, quartz],
      })),
    });

    expect(result).toEqual({
      ok: true,
      status: "needs_variant_confirmation",
      retryable: false,
      mutationReplayed: false,
      message: "Nic-Nac found more than one exact catalog variant. Choose the matching design to continue.",
      variantCandidates: [ruby, quartz],
    });
    expect(result.ok && result.status === "needs_variant_confirmation"
      ? result.variantCandidates.map((item) => [item.designId, item.itemNumber, item.mainStone, item.description])
      : []).toEqual([
      [rubyDesignId, "RBP5902", "Ruby", "Deep red center stone."],
      [quartzDesignId, "RBP5902", "Rose Quartz", "Soft pink center stone."],
    ]);
  });

  it("accepts exact resolved and replayed results only when supplied facts agree", async () => {
    const resolvedDesign = candidate({ designId: rubyDesignId, mainStone: "Ruby", material: "Rose gold" });
    const result = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse({
        schemaVersion: 2,
        ok: true,
        status: "accepted",
        retryable: false,
        mutationReplayed: true,
        suiteDesignId: rubyDesignId,
        resolvedDesign,
      })),
    });

    expect(result).toEqual({
      ok: true,
      status: "accepted",
      retryable: false,
      mutationReplayed: true,
      message: "Showcase Studio restored the prior result. Nic-Nac accepted the exact catalog design.",
      suiteDesignId: rubyDesignId,
      resolvedDesign,
    });

    const mismatchedFacts = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse({
        schemaVersion: 2,
        ok: true,
        status: "accepted",
        retryable: false,
        mutationReplayed: false,
        suiteDesignId: quartzDesignId,
        resolvedDesign: candidate({ designId: quartzDesignId, mainStone: "Rose Quartz" }),
      })),
    });
    expect(mismatchedFacts).toMatchObject({
      ok: false,
      status: "unavailable",
      errorCode: "invalid_suite_response",
    });
  });

  it("requires confirmation success to return the exact selected design", async () => {
    const selectedResult = await submitShowcaseStudioIntake(confirmRequest(rubyDesignId), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse(exactSuccess("published", rubyDesignId))),
    });
    expect(selectedResult).toMatchObject({
      ok: true,
      status: "published",
      suiteDesignId: rubyDesignId,
      resolvedDesign: { designId: rubyDesignId, itemNumber: "RBP5902", mainStone: "Ruby" },
    });

    const mismatchedSelection = await submitShowcaseStudioIntake(confirmRequest(rubyDesignId), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse(exactSuccess("accepted", quartzDesignId))),
    });
    expect(mismatchedSelection).toMatchObject({ ok: false, errorCode: "invalid_suite_response" });

    const internallyMismatched = exactSuccess("accepted", rubyDesignId);
    internallyMismatched.resolvedDesign.designId = quartzDesignId;
    const mismatchedDesign = await submitShowcaseStudioIntake(confirmRequest(rubyDesignId), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse(internallyMismatched)),
    });
    expect(mismatchedDesign).toMatchObject({ ok: false, errorCode: "invalid_suite_response" });
  });

  it("resumes a prior Suite result with only the stable submission identity", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      schemaVersion: 2,
      ok: true,
      status: "needs_variant_confirmation",
      retryable: false,
      mutationReplayed: true,
      variantCandidates: [candidate({ designId: rubyDesignId }), candidate({ designId: quartzDesignId })],
    }));
    const result = await submitShowcaseStudioIntake({
      finderSubmissionId: submissionId,
      action: "resume",
    }, {
      config: suiteIntakeConfig(),
      fetcher,
    });

    const postedCall = fetcher.mock.calls[0] as unknown as [string, { body: string }];
    expect(JSON.parse(postedCall[1].body)).toEqual({
      schemaVersion: 2,
      sourceProduct: "sparkle_finder",
      finderSubmissionId: submissionId,
      action: "resume",
    });
    expect(result).toMatchObject({
      ok: true,
      status: "needs_variant_confirmation",
      mutationReplayed: true,
      variantCandidates: [{ designId: rubyDesignId }, { designId: quartzDesignId }],
    });
  });

  it.each([
    ["invalid_details", false, 400],
    ["invalid_selection", false, 409],
    ["storage_failed", true, 503],
    ["database_failed", true, 503],
    ["temporary_failure", true, 503],
    ["conflicting_replay", false, 409],
  ] as const)("preserves the %s failure category from a non-2xx customer-safe body", async (status, retryable, httpStatus) => {
    const result = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse({
        schemaVersion: 2,
        ok: false,
        status,
        retryable,
        errorCode: `${status}_code`,
        customerMessage: `Customer-safe ${status} message.`,
      }, httpStatus)),
    });

    expect(result).toEqual({
      ok: false,
      status,
      retryable,
      errorCode: `${status}_code`,
      customerMessage: `Customer-safe ${status} message.`,
      message: `Customer-safe ${status} message.`,
    });
  });

  it("maps photo rejection to bounded light-box coaching", async () => {
    const result = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse({
        schemaVersion: 2,
        ok: false,
        status: "photo_rejected",
        retryable: false,
        errorCode: "jewelry_photo_blurry",
        customerMessage: "The jewelry photo needs a cleaner retake.",
        photoFeedback: ["Use a plain white background.", "Move closer so the stones are sharp."],
      }, 422)),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "photo_rejected",
      retryable: false,
      photoFeedback: ["Use a plain white background.", "Move closer so the stones are sharp."],
      lightBoxHelpHref: "/photo-setup",
    });
  });

  it.each([
    ["malformed JSON", new Response("not-json", { status: 200 })],
    ["unknown schema", jsonResponse({ schemaVersion: 3, ok: true, status: "accepted" })],
    ["unknown status", jsonResponse({ schemaVersion: 2, ok: true, status: "future_status" })],
    ["missing discriminator", jsonResponse({ schemaVersion: 2, status: "accepted" })],
    ["empty ambiguity", jsonResponse({
      schemaVersion: 2,
      ok: true,
      status: "needs_variant_confirmation",
      retryable: false,
      mutationReplayed: false,
      variantCandidates: [],
    })],
    ["duplicate design candidates", jsonResponse({
      schemaVersion: 2,
      ok: true,
      status: "needs_variant_confirmation",
      retryable: false,
      mutationReplayed: false,
      variantCandidates: [candidate({ designId: rubyDesignId }), candidate({ designId: rubyDesignId })],
    })],
  ])("fails closed for %s", async (_label, response) => {
    const result = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => response),
    });
    expect(result).toMatchObject({
      ok: false,
      status: "unavailable",
      retryable: true,
      errorCode: "invalid_suite_response",
    });
  });

  it("never treats a success-shaped non-2xx response as success", async () => {
    const result = await submitShowcaseStudioIntake(confirmRequest(rubyDesignId), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse(exactSuccess("accepted", rubyDesignId), 500)),
    });
    expect(result).toMatchObject({ ok: false, errorCode: "invalid_suite_response" });
  });

  it("fails locally on invalid IDs, mismatched evidence, or missing item details", async () => {
    const fetcher = vi.fn();
    const invalidRequests: ShowcaseStudioIntakeRequest[] = [
      { ...resolveRequest(), finderSubmissionId: "not-a-uuid" },
      resolveRequest({ labelDetails: { itemNumber: "" } }),
      resolveRequest({
        photoEvidence: [
          { ...resolveRequest().photoEvidence[0], finderSubmissionId: quartzDesignId },
          resolveRequest().photoEvidence[1],
        ],
      }),
      confirmRequest("not-a-design-uuid"),
    ];

    for (const request of invalidRequests) {
      const result = await submitShowcaseStudioIntake(request, { config: suiteIntakeConfig(), fetcher });
      expect(result).toMatchObject({
        ok: false,
        status: "invalid_details",
        retryable: false,
        errorCode: "invalid_finder_request",
      });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns distinct configuration, reachability, and invalid HTTP failures", async () => {
    const notConfigured = await submitShowcaseStudioIntake(resolveRequest(), {
      config: { apiUrl: "", bearerToken: "" },
      fetcher: vi.fn(),
    });
    expect(notConfigured).toMatchObject({ status: "unavailable", errorCode: "bridge_not_configured" });

    const unreachable = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => { throw new Error("private provider detail"); }),
    });
    expect(unreachable).toMatchObject({ status: "temporary_failure", errorCode: "bridge_unreachable" });
    expect(JSON.stringify(unreachable)).not.toContain("private provider detail");

    const invalidHttp = await submitShowcaseStudioIntake(resolveRequest(), {
      config: suiteIntakeConfig(),
      fetcher: vi.fn(async () => jsonResponse({ error: "raw private error" }, 401)),
    });
    expect(invalidHttp).toMatchObject({ status: "unavailable", retryable: false, errorCode: "suite_http_error" });
    expect(JSON.stringify(invalidHttp)).not.toContain("raw private error");
  });

  it("upgrades the legacy configured route to the exact v2 endpoint", () => {
    expect(getShowcaseStudioConfig({
      NODE_ENV: "test",
      SPARKLE_SUITE_FINDER_INTAKE_API_URL: "https://suite.example/api/internal/finder/jewelry-intake/",
      SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN: "finder-to-suite-token",
    })).toEqual(suiteIntakeConfig());
  });
});

function resolveRequest(
  overrides: Partial<Extract<ShowcaseStudioIntakeRequest, { action: "resolve" }>> = {},
): Extract<ShowcaseStudioIntakeRequest, { action: "resolve" }> {
  return {
    finderSubmissionId: submissionId,
    action: "resolve",
    labelDetails: { itemNumber: "RBP5902", mainStone: "Ruby" },
    customerNote: "Ruby variant from the original label.",
    photoEvidence: [
      {
        finderSubmissionId: submissionId,
        finderAssetId: labelAssetId,
        claimedKind: "label",
        temporaryReadUrl: "https://finder.example/private/label",
      },
      {
        finderSubmissionId: submissionId,
        finderAssetId: jewelryAssetId,
        claimedKind: "jewelry",
        temporaryReadUrl: "https://finder.example/private/jewelry",
      },
    ],
    ...overrides,
  };
}

function confirmRequest(selectedDesignId: string): Extract<ShowcaseStudioIntakeRequest, { action: "confirm" }> {
  return { finderSubmissionId: submissionId, action: "confirm", selectedDesignId };
}

function candidate(overrides: Partial<ShowcaseStudioVariantCandidate> = {}): ShowcaseStudioVariantCandidate {
  return {
    designId: rubyDesignId,
    itemNumber: "RBP5902",
    designName: "Ruby Birthday Ring",
    material: "Rose gold",
    mainStone: "Ruby",
    jewelryType: "ring",
    collectionName: "Birthday Collection",
    collectionYear: 2026,
    canonicalPhotoUrl: "https://cdn.example/ruby.jpg",
    description: null,
    ...overrides,
  };
}

function exactSuccess(status: "accepted" | "published", designId: string) {
  return {
    schemaVersion: 2,
    ok: true,
    status,
    retryable: false,
    mutationReplayed: false,
    suiteDesignId: designId,
    resolvedDesign: candidate({ designId }),
  };
}

function suiteIntakeConfig() {
  return {
    apiUrl: "https://suite.example/api/internal/finder/jewelry-intake/v2",
    bearerToken: "finder-to-suite-token",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}
