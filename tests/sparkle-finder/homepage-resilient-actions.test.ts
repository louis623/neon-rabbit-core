import { afterEach, describe, expect, it, vi } from "vitest";
import type { JewelryItem } from "../../lib/sparkle-finder/types";

const ownedCollectionItemId = "11111111-1111-4111-8111-111111111111";
const userId = "owner-123";

describe("Homepage Hero Piece and Bling Vault actions", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("next/cache");
    vi.doUnmock("@/lib/supabase/server");
    vi.doUnmock("@/lib/sparkle-finder/catalog-service");
  });

  it("returns a denied result for an invalid Hero Piece id before opening a database client", async () => {
    const createClient = vi.fn();
    vi.doMock("next/cache", () => ({ revalidatePath: vi.fn() }));
    vi.doMock("@/lib/supabase/server", () => ({ createClient }));

    const { makeHeroPiece } = await import("../../app/actions/hero-piece");
    const formData = new FormData();
    formData.set("collectionItemId", "not-a-collection-id");
    const result = await makeHeroPiece({ status: "idle", message: "" }, formData);

    expect(result).toEqual({
      status: "denied",
      message: "Choose an owned piece from your Bling Vault and try again.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects a Hero Piece that is not an owned row for the signed-in customer", async () => {
    const rpc = vi.fn();
    const client = heroClient({ ownedItem: null, rpc });
    vi.doMock("next/cache", () => ({ revalidatePath: vi.fn() }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { makeHeroPiece } = await import("../../app/actions/hero-piece");
    const formData = new FormData();
    formData.set("collectionItemId", ownedCollectionItemId);
    const result = await makeHeroPiece({ status: "idle", message: "" }, formData);

    expect(result).toEqual({
      status: "denied",
      message: "Only an owned piece in your Bling Vault can be your Hero Piece.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns an explicit success and revalidates only after the Hero Piece RPC succeeds", async () => {
    const revalidatePath = vi.fn();
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const client = heroClient({ ownedItem: { id: ownedCollectionItemId }, rpc });
    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { makeHeroPiece } = await import("../../app/actions/hero-piece");
    const formData = new FormData();
    formData.set("collectionItemId", ownedCollectionItemId);
    const result = await makeHeroPiece({ status: "idle", message: "" }, formData);

    expect(result).toEqual({ status: "success", message: "Your Hero Piece is saved." });
    expect(rpc).toHaveBeenCalledWith("set_sparkle_finder_hero_piece", {
      collection_item_id: ownedCollectionItemId,
    });
    expect(revalidatePath.mock.calls).toEqual([["/"], ["/silver"]]);
  });

  it.each([false, null])("does not claim Hero Piece success when the authoritative RPC returns %s", async (rpcResult) => {
    const revalidatePath = vi.fn();
    const rpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    const client = heroClient({ ownedItem: { id: ownedCollectionItemId }, rpc });
    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { makeHeroPiece } = await import("../../app/actions/hero-piece");
    const formData = new FormData();
    formData.set("collectionItemId", ownedCollectionItemId);
    const result = await makeHeroPiece({ status: "idle", message: "" }, formData);

    expect(result).toEqual({
      status: "error",
      message: "We couldn't save your Hero Piece. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("propagates a catalog outage instead of reporting an empty Bling Vault page", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(blingVaultClient({
        rows: [collectionRow()],
      })),
    }));
    vi.doMock("@/lib/sparkle-finder/catalog-service", () => ({
      getCatalogJewelryItemsResult: vi.fn().mockResolvedValue({ status: "error" }),
    }));

    const { loadBlingVaultPage } = await import("../../app/actions/bling-vault");
    const result = await loadBlingVaultPage("all", 0, 8);

    expect(result).toEqual({
      status: "error",
      message: "Your Bling Vault couldn't reach the jewelry catalog. Please try again.",
    });
  });

  it("propagates an initial homepage catalog failure through the same visible error channel", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(blingVaultClient({
        rows: [collectionRow()],
      })),
    }));
    vi.doMock("@/lib/sparkle-finder/catalog-service", () => ({
      getCatalogJewelryItemByIdResult: vi.fn().mockResolvedValue({ status: "error" }),
    }));

    const { getPersistedHomepageBlingVaultItems } = await import("../../app/page");
    const result = await getPersistedHomepageBlingVaultItems(userId);

    expect(result).toEqual({
      status: "error",
      message: "Your Bling Vault couldn't reach the jewelry catalog. Please try again.",
    });
  });

  it("returns a bounded successful page without trusting a client owner id", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(blingVaultClient({
        rows: [collectionRow(), collectionRow({ id: "owned-2", jewelry_item_id: "jewel-2" })],
      })),
    }));
    vi.doMock("@/lib/sparkle-finder/catalog-service", () => ({
      getCatalogJewelryItemsResult: vi.fn().mockResolvedValue({
        status: "success",
        items: [jewelryItem("jewel-1"), jewelryItem("jewel-2")],
      }),
    }));

    const { loadBlingVaultPage } = await import("../../app/actions/bling-vault");
    const result = await loadBlingVaultPage("owned", 1, 1);

    expect(result).toMatchObject({
      status: "success",
      total: 2,
      items: [{ id: "owned-2", customerId: userId }],
    });
  });
});

function heroClient({
  ownedItem,
  rpc,
}: {
  ownedItem: { id: string } | null;
  rpc: ReturnType<typeof vi.fn>;
}) {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: ownedItem, error: null }),
  };
  query.eq.mockReturnValue(query);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
    from: vi.fn(() => ({ select: vi.fn(() => query) })),
    rpc,
  };
}

function blingVaultClient({ rows }: { rows: Record<string, unknown>[] }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
      })),
    })),
  };
}

function collectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "owned-1",
    user_id: userId,
    jewelry_item_id: "jewel-1",
    state: "owned",
    acquisition_source: "manual",
    acquisition_context: {},
    acquisition_marked_at: null,
    personal_photo_url: null,
    ...overrides,
  };
}

function jewelryItem(id: string): JewelryItem {
  return {
    id,
    itemNumber: id.toUpperCase(),
    name: `${id} ring`,
    collectionName: "Test Collection",
    jewelryType: "ring",
    imageUrl: `https://cdn.example.test/${id}.jpg`,
    bpLabel: "standard",
    knownRepListingIds: [],
  };
}
