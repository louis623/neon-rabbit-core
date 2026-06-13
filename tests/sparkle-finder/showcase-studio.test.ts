import { describe, expect, it, vi } from "vitest";
import {
  getShowcaseStudioConfig,
  submitShowcaseStudioIntake,
  type ShowcaseStudioIntakeRequest,
} from "../../lib/sparkle-finder/showcase-studio";

describe("Sparkle Finder Showcase Studio intake", () => {
  it("does not call the master database intake without an original Bomb Party label", async () => {
    const fetcher = vi.fn();

    const result = await submitShowcaseStudioIntake(
      studioRequest({ originalLabelImageDataUrl: "" }),
      {
        config: suiteIntakeConfig(),
        fetcher,
      },
    );

    expect(result).toEqual({
      ok: false,
      status: "needs_label",
      message: "Original Bomb Party label photo is required before Nic-Nac can review a missing piece.",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("posts a privacy-safe Silver submission to the shared master database intake contract", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        status: "needs_jewelry_photo",
        message: "Nic-Nac matched the label details. Add the light-box jewelry photo next.",
        suiteDesignId: "design-starlight-123",
        catalogDraft: {
          designName: "Starlight Diamond Ring",
          itemNumber: "RG1234",
        },
      }),
    );

    const result = await submitShowcaseStudioIntake(
      {
        ...studioRequest(),
        customerEmail: "casey@example.com",
        customerDisplayName: "Casey Collector",
      } as ShowcaseStudioIntakeRequest & { customerEmail: string; customerDisplayName: string },
      {
        config: suiteIntakeConfig(),
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith("https://suite.example/api/internal/finder/jewelry-intake", {
      body: expect.any(String),
      cache: "no-store",
      headers: {
        Authorization: "Bearer finder-to-suite-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(payload).toMatchObject({
      sourceProduct: "sparkle_finder",
      finderSubmissionId: "studio-req-123",
      originalLabelImageDataUrl: "data:image/jpeg;base64,label",
      jewelryFrontImageDataUrl: "data:image/jpeg;base64,jewelry",
      labelDetails: {
        itemNumber: "RG1234",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("casey@example.com");
    expect(JSON.stringify(payload)).not.toContain("Casey Collector");
    expect(result).toEqual({
      ok: true,
      status: "needs_jewelry_photo",
      message: "Nic-Nac matched the label details. Add the light-box jewelry photo next.",
      suiteDesignId: "design-starlight-123",
      catalogDraft: {
        designName: "Starlight Diamond Ring",
        itemNumber: "RG1234",
      },
    });
  });

  it("maps Nic-Nac photo QA feedback to customer-safe light-box coaching", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        status: "photo_rejected",
        message: "The jewelry photo needs a cleaner light-box retake.",
        photoFeedback: ["Use a plain white light-box background.", "Retake closer so the stones are sharp."],
      }),
    );

    const result = await submitShowcaseStudioIntake(studioRequest(), {
      config: suiteIntakeConfig(),
      fetcher,
    });

    expect(result).toEqual({
      ok: false,
      status: "photo_rejected",
      message: "The jewelry photo needs a cleaner light-box retake.",
      photoFeedback: ["Use a plain white light-box background.", "Retake closer so the stones are sharp."],
      lightBoxHelpHref: "/photo-setup",
    });
  });

  it("returns a safe unavailable state until Finder is connected to the Suite intake endpoint", async () => {
    const fetcher = vi.fn();

    const result = await submitShowcaseStudioIntake(studioRequest(), {
      config: { apiUrl: "", bearerToken: "" },
      fetcher,
    });

    expect(result).toEqual({
      ok: false,
      status: "unavailable",
      message: "Showcase Studio publishing is not connected yet.",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reads the internal Suite intake URL and token from Finder environment variables", () => {
    const config = getShowcaseStudioConfig({
      SPARKLE_SUITE_FINDER_INTAKE_API_URL: "https://suite.example/api/internal/finder/jewelry-intake",
      SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN: "finder-to-suite-token",
    });

    expect(config).toEqual(suiteIntakeConfig());
  });
});

function studioRequest(overrides: Partial<ShowcaseStudioIntakeRequest> = {}): ShowcaseStudioIntakeRequest {
  return {
    finderSubmissionId: "studio-req-123",
    originalLabelImageDataUrl: "data:image/jpeg;base64,label",
    jewelryFrontImageDataUrl: "data:image/jpeg;base64,jewelry",
    labelDetails: {
      itemNumber: "RG1234",
    },
    ...overrides,
  };
}

function suiteIntakeConfig() {
  return {
    apiUrl: "https://suite.example/api/internal/finder/jewelry-intake",
    bearerToken: "finder-to-suite-token",
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}
