import { describe, expect, it } from "vitest";
import {
  persistShowcaseStudioSubmissionForAccount,
  type ShowcaseStudioSubmissionInput,
} from "../../lib/sparkle-finder/showcase-studio-state";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";
import type { SparkleFinderAccessState } from "../../lib/sparkle-finder/account-types";

describe("Showcase Studio submission persistence", () => {
  it("creates a private Silver intake ticket with label and light-box asset paths", async () => {
    const client = createFakeStudioClient();

    const result = await persistShowcaseStudioSubmissionForAccount(
      client,
      currentAccountState("silver_paid"),
      studioInput(),
      {
        idFactory: () => "submission-123",
        now: () => new Date("2026-06-13T16:00:00.000Z"),
      },
    );

    expect(result).toEqual({
      ok: true,
      submissionId: "submission-123",
      status: "submitted",
    });
    expect(client.operations).toEqual([
      {
        table: "sparkle_finder_nic_nac_intake_submissions",
        type: "insert",
        values: {
          id: "submission-123",
          user_id: "user-123",
          status: "submitted",
          item_number: "RG1234",
          customer_note: "This came from a 2024 reveal.",
          submitted_at: "2026-06-13T16:00:00.000Z",
        },
      },
      {
        bucket: "sparkle-finder-private",
        path: "user-123/studio/submission-123/original-label/original-label.jpg",
        type: "upload",
      },
      {
        bucket: "sparkle-finder-private",
        path: "user-123/studio/submission-123/jewelry-front/light-box-photo.jpg",
        type: "upload",
      },
      {
        table: "sparkle_finder_nic_nac_intake_assets",
        type: "insert",
        values: [
          {
            submission_id: "submission-123",
            user_id: "user-123",
            asset_kind: "original_label",
            storage_bucket: "sparkle-finder-private",
            storage_path: "user-123/studio/submission-123/original-label/original-label.jpg",
            content_type: "image/jpeg",
            byte_size: 11,
          },
          {
            submission_id: "submission-123",
            user_id: "user-123",
            asset_kind: "jewelry_front",
            storage_bucket: "sparkle-finder-private",
            storage_path: "user-123/studio/submission-123/jewelry-front/light-box-photo.jpg",
            content_type: "image/jpeg",
            byte_size: 13,
          },
        ],
      },
    ]);
    expect(JSON.stringify(client.operations)).not.toContain("casey@example.test");
    expect(JSON.stringify(client.operations)).not.toContain("Casey Collector");
  });

  it("requires Silver access and both required images", async () => {
    const freeClient = createFakeStudioClient();
    const freeResult = await persistShowcaseStudioSubmissionForAccount(
      freeClient,
      currentAccountState("free"),
      studioInput(),
    );

    const missingLabelClient = createFakeStudioClient();
    const missingLabelResult = await persistShowcaseStudioSubmissionForAccount(
      missingLabelClient,
      currentAccountState("silver_paid"),
      {
        ...studioInput(),
        originalLabelPhoto: new File([], "empty.jpg", { type: "image/jpeg" }),
      },
    );

    const missingJewelryClient = createFakeStudioClient();
    const missingJewelryResult = await persistShowcaseStudioSubmissionForAccount(
      missingJewelryClient,
      currentAccountState("silver_paid"),
      {
        ...studioInput(),
        jewelryFrontPhoto: new File([], "empty.jpg", { type: "image/jpeg" }),
      },
    );

    expect(freeResult).toEqual({ ok: false, reason: "silver_required" });
    expect(missingLabelResult).toEqual({ ok: false, reason: "original_label_required" });
    expect(missingJewelryResult).toEqual({ ok: false, reason: "jewelry_photo_required" });
    expect(freeClient.operations).toEqual([]);
    expect(missingLabelClient.operations).toEqual([]);
    expect(missingJewelryClient.operations).toEqual([]);
  });

  it("pressure rejects non-image and oversize uploads before storage writes", async () => {
    const nonImageClient = createFakeStudioClient();
    const nonImageResult = await persistShowcaseStudioSubmissionForAccount(
      nonImageClient,
      currentAccountState("silver_paid"),
      {
        ...studioInput(),
        originalLabelPhoto: new File(["not-a-photo"], "label.txt", { type: "text/plain" }),
      },
    );

    const oversizeClient = createFakeStudioClient();
    const oversizeResult = await persistShowcaseStudioSubmissionForAccount(
      oversizeClient,
      currentAccountState("silver_paid"),
      {
        ...studioInput(),
        jewelryFrontPhoto: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "too-big.jpg", {
          type: "image/jpeg",
        }),
      },
    );

    expect(nonImageResult).toEqual({ ok: false, reason: "invalid_file_type" });
    expect(oversizeResult).toEqual({ ok: false, reason: "file_too_large" });
    expect(nonImageClient.operations).toEqual([]);
    expect(oversizeClient.operations).toEqual([]);
  });

  it("pressure sanitizes storage paths and trims customer-controlled text", async () => {
    const client = createFakeStudioClient();

    const result = await persistShowcaseStudioSubmissionForAccount(
      client,
      {
        ...currentAccountState("silver_paid"),
        customer: {
          ...currentAccountState("silver_paid").customer,
          id: "user/../with spaces",
        },
      },
      {
        customerNote: "n".repeat(600),
        itemNumber: " RG1234 ".repeat(20),
        jewelryFrontPhoto: new File(["jewelry-photo"], "../light box photo!!.jpg", { type: "image/jpeg" }),
        originalLabelPhoto: new File(["label-photo"], "../../original label!!.jpg", { type: "image/jpeg" }),
      },
      {
        idFactory: () => "submission/../123",
        now: () => new Date("2026-06-13T16:00:00.000Z"),
      },
    );

    expect(result).toEqual({
      ok: true,
      submissionId: "submission/../123",
      status: "submitted",
    });
    expect(client.operations[0]).toMatchObject({
      values: {
        customer_note: "n".repeat(500),
        item_number: " RG1234 ".repeat(20).trim().slice(0, 80),
      },
    });
    const storagePaths = client.operations
      .flatMap((operation) => [operation.path, ...readInsertedStoragePaths(operation.values)])
      .filter((path): path is string => typeof path === "string");

    expect(storagePaths).toHaveLength(4);
    expect(storagePaths.every((path) => !path.includes(".."))).toBe(true);
    expect(storagePaths.every((path) => !path.includes("../"))).toBe(true);
    expect(storagePaths.every((path) => path.includes("user-with-spaces/studio/submission-123"))).toBe(true);
  });
});

function studioInput(): ShowcaseStudioSubmissionInput {
  return {
    customerNote: "This came from a 2024 reveal.",
    itemNumber: "RG1234",
    jewelryFrontPhoto: new File(["jewelry-photo"], "light box photo.jpg", { type: "image/jpeg" }),
    originalLabelPhoto: new File(["label-photo"], "original label.jpg", { type: "image/jpeg" }),
  };
}

function currentAccountState(accessState: SparkleFinderAccessState): CurrentSparkleFinderAccountState & { status: "authenticated" } {
  const hasSilverAccess = accessState !== "free";
  const tier = hasSilverAccess ? "silver" : "free";

  return {
    status: "authenticated",
    tier,
    displayName: "Casey Collector",
    email: "casey@example.test",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.test",
      state: "PA",
      tier,
    },
    membership: {
      accountId: "user-123",
      personId: "user-123",
      accessState,
      silverSource: accessState === "silver_paid" ? "stripe" : accessState === "silver_trial" ? "trial" : accessState === "silver_rep_included" ? "sparkle_suite_rep" : "none",
      trialStartedAt: null,
      trialEndsAt: null,
      silverStartedAt: hasSilverAccess ? "2026-05-01T12:00:00.000Z" : null,
      silverEndsAt: null,
      effectiveState: accessState,
      hasSilverAccess,
      isTrialActive: accessState === "silver_trial",
      isTrialExpired: false,
    },
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      accountSmsConsentedAt: null,
      promotionalEmailOptIn: false,
      promotionalEmailConsentedAt: null,
      promotionalSmsOptIn: false,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-05-01T12:00:00.000Z",
    },
  };
}

function createFakeStudioClient() {
  const operations: Array<Record<string, unknown>> = [];

  return {
    operations,
    from(table: string) {
      return {
        insert: async (values: unknown) => {
          operations.push({ table, type: "insert", values });
          return { data: null, error: null };
        },
      };
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (path: string) => {
            operations.push({ bucket, path, type: "upload" });
            return { data: { path }, error: null };
          },
        };
      },
    },
  };
}

function readInsertedStoragePaths(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value) => {
    if (!value || typeof value !== "object" || !("storage_path" in value)) return [];

    return [String((value as { storage_path: unknown }).storage_path)];
  });
}
