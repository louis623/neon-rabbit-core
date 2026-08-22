import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({
  accountState: {
    status: "authenticated" as const,
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.com",
      state: "TX",
    },
    membership: { hasSilverAccess: true },
  },
  authenticated: true,
  inputs: [] as Record<string, unknown>[],
  persistResult: { ok: true } as { ok: boolean; reason?: string },
  revalidated: [] as Array<[string, string?]>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: runtime.authenticated ? { id: "user-123" } : null },
        error: null,
      }),
    },
  }),
}));

vi.mock("@/lib/sparkle-finder/account-service", () => ({
  getCurrentSparkleFinderAccount: async () => runtime.accountState,
}));

vi.mock("@/lib/sparkle-finder/catalog-service", () => ({
  getCatalogJewelryItemById: async () => ({ id: "jewelry-1" }),
}));

vi.mock("@/lib/sparkle-finder/customer-state", () => ({
  persistCollectionItemForAccount: async () => ({ ok: true }),
  persistSilverProfileForAccount: async () => ({ ok: true }),
  persistShowcasePieceForAccount: async (_client: unknown, _account: unknown, input: Record<string, unknown>) => {
    runtime.inputs.push(input);
    return runtime.persistResult;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string, type?: string) => runtime.revalidated.push([path, type]),
}));

import { saveShowcasePieceAction } from "../../app/(hub)/silver/actions";

const idleState = { status: "idle" as const, message: "Ready." };

describe("Showcase piece server action", () => {
  beforeEach(() => {
    runtime.authenticated = true;
    runtime.inputs.length = 0;
    runtime.persistResult = { ok: true };
    runtime.revalidated.length = 0;
  });

  it("preserves the current photo when no photo choice is submitted", async () => {
    await expect(saveShowcasePieceAction(idleState, pieceForm())).resolves.toEqual({
      status: "saved",
      message: "Sparkle Showcase piece saved.",
    });
    expect(runtime.inputs[0]).not.toHaveProperty("personalPhotoUrl");
  });

  it("removes the personal photo only when the owner explicitly requests it", async () => {
    const formData = pieceForm();
    formData.set("removePersonalPhoto", "yes");

    await saveShowcasePieceAction(idleState, formData);

    expect(runtime.inputs[0]).toHaveProperty("personalPhotoUrl", "");
  });

  it("prepares an accepted replacement photo for persistence", async () => {
    const formData = pieceForm();
    formData.set("personalPhoto", new File([new Uint8Array([1, 2, 3])], "piece.jpg", { type: "image/jpeg" }));

    await saveShowcasePieceAction(idleState, formData);

    expect(runtime.inputs[0].personalPhotoUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("rejects unsupported and oversized photos before persistence", async () => {
    const unsupported = pieceForm();
    unsupported.set("personalPhoto", new File([new Uint8Array([1])], "piece.gif", { type: "image/gif" }));
    await expect(saveShowcasePieceAction(idleState, unsupported)).resolves.toEqual({
      status: "error",
      message: "Personal piece photo must be a JPG, PNG, or WebP.",
    });

    const oversized = pieceForm();
    oversized.set("personalPhoto", new File([new Uint8Array((500 * 1024) + 1)], "piece.png", { type: "image/png" }));
    await expect(saveShowcasePieceAction(idleState, oversized)).resolves.toEqual({
      status: "error",
      message: "Personal piece photo must be 500 KB or smaller.",
    });
    expect(runtime.inputs).toEqual([]);
  });

  it("keeps auth and persistence failures visible and does not revalidate", async () => {
    runtime.authenticated = false;
    await expect(saveShowcasePieceAction(idleState, pieceForm())).resolves.toEqual({
      status: "denied",
      message: "Sign in to save Silver updates.",
    });

    runtime.authenticated = true;
    runtime.persistResult = { ok: false, reason: "save_failed" };
    await expect(saveShowcasePieceAction(idleState, pieceForm())).resolves.toEqual({
      status: "error",
      message: "Sparkle Showcase piece could not be saved.",
    });
    expect(runtime.revalidated).toEqual([]);
  });
});

function pieceForm() {
  const formData = new FormData();
  formData.set("jewelryItemId", "jewelry-1");
  formData.set("showcaseStatus", "owned");
  formData.set("visibility", "private");
  formData.set("revealStory", "My favorite reveal.");
  return formData;
}
