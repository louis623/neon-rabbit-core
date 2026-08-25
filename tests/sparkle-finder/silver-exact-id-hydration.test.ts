import { afterEach, describe, expect, it, vi } from "vitest";
import type { JewelryItem } from "../../lib/sparkle-finder/types";

const userId = "owner-123";

describe("Silver exact design-ID collection hydration", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/lib/supabase/server");
    vi.doUnmock("@/lib/sparkle-finder/catalog-service");
  });

  it("hydrates persisted collection rows by their exact design IDs", async () => {
    const getCatalogJewelryItemsByIdsResult = vi.fn().mockResolvedValue({
      status: "success",
      schemaVersion: 2,
      items: [jewelryItem("saved-design")],
      missingDesignIds: [],
    });
    mockCollectionRows([collectionRow("saved-design")]);
    mockCatalogBatch(getCatalogJewelryItemsByIdsResult);

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result).toMatchObject({
      status: "success",
      items: [{ jewelryItemId: "saved-design", jewelryItem: { id: "saved-design" } }],
    });
    expect(getCatalogJewelryItemsByIdsResult).toHaveBeenCalledWith(["saved-design"]);
  });

  it("reports missing saved design IDs and returns no misleading partial collection", async () => {
    mockCollectionRows([collectionRow("saved-design"), collectionRow("missing-design")]);
    mockCatalogBatch(vi.fn().mockResolvedValue({
      status: "success",
      schemaVersion: 2,
      items: [jewelryItem("saved-design")],
      missingDesignIds: ["missing-design"],
    }));

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result).toEqual({
      status: "error",
      items: [],
      message: "Some saved pieces are no longer available in the jewelry catalog. Nothing was substituted.",
      missingDesignIds: ["missing-design"],
    });
  });

  it("chunks large owner collections at the Suite batch contract limit", async () => {
    const rows = Array.from({ length: 51 }, (_, index) => collectionRow(`design-${index + 1}`));
    const getCatalogJewelryItemsByIdsResult = vi.fn().mockImplementation(async (designIds: string[]) => ({
      status: "success",
      schemaVersion: 2,
      items: designIds.map(jewelryItem),
      missingDesignIds: [],
    }));
    mockCollectionRows(rows);
    mockCatalogBatch(getCatalogJewelryItemsByIdsResult);

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result.status).toBe("success");
    expect(result.items).toHaveLength(51);
    expect(getCatalogJewelryItemsByIdsResult).toHaveBeenCalledTimes(2);
    expect(getCatalogJewelryItemsByIdsResult.mock.calls[0]?.[0]).toHaveLength(50);
    expect(getCatalogJewelryItemsByIdsResult.mock.calls[1]?.[0]).toEqual(["design-51"]);
  });

  it("walks owner rows in stable pages and bounds concurrent catalog batches", async () => {
    const rows = Array.from({ length: 201 }, (_, index) => collectionRow(`paged-design-${index + 1}`));
    let activeBatches = 0;
    let maxActiveBatches = 0;
    const getCatalogJewelryItemsByIdsResult = vi.fn().mockImplementation(async (designIds: string[]) => {
      activeBatches += 1;
      maxActiveBatches = Math.max(maxActiveBatches, activeBatches);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeBatches -= 1;
      return {
        status: "success",
        schemaVersion: 2,
        items: designIds.map(jewelryItem),
        missingDesignIds: [],
      };
    });
    const collectionQuery = mockCollectionRows(rows);
    mockCatalogBatch(getCatalogJewelryItemsByIdsResult);

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result.status).toBe("success");
    expect(result.items).toHaveLength(201);
    expect(collectionQuery.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(collectionQuery.range.mock.calls).toEqual([[0, 199], [200, 399]]);
    expect(getCatalogJewelryItemsByIdsResult).toHaveBeenCalledTimes(5);
    expect(maxActiveBatches).toBe(4);
  });

  it("fails visibly instead of returning a collection truncated at the owner-row cap", async () => {
    const rows = Array.from({ length: 2_001 }, (_, index) => collectionRow(`capped-design-${index + 1}`));
    const getCatalogJewelryItemsByIdsResult = vi.fn();
    mockCollectionRows(rows);
    mockCatalogBatch(getCatalogJewelryItemsByIdsResult);

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result).toEqual({
      status: "error",
      items: [],
      message: "Your Sparkle Showcase has more than 2,000 saved pieces and can't be loaded safely yet. No partial collection was shown.",
    });
    expect(getCatalogJewelryItemsByIdsResult).not.toHaveBeenCalled();
  });

  it("rejects a collection row whose owner does not match the requested customer", async () => {
    const getCatalogJewelryItemsByIdsResult = vi.fn();
    mockCollectionRows([{ ...collectionRow("foreign-design"), user_id: "different-owner" }]);
    mockCatalogBatch(getCatalogJewelryItemsByIdsResult);

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result).toEqual({
      status: "error",
      items: [],
      message: "Some saved Sparkle Showcase pieces couldn't be read safely. Please try again.",
    });
    expect(getCatalogJewelryItemsByIdsResult).not.toHaveBeenCalled();
  });

  it("does not case-fold an exact persisted design ID into a different catalog ID", async () => {
    mockCollectionRows([collectionRow("Design-A")]);
    mockCatalogBatch(vi.fn().mockResolvedValue({
      status: "success",
      schemaVersion: 2,
      items: [jewelryItem("design-a")],
      missingDesignIds: [],
    }));

    const { getPersistedCollectionItems } = await import("../../app/(hub)/silver/page");
    const result = await getPersistedCollectionItems(userId);

    expect(result).toEqual({
      status: "error",
      items: [],
      message: "Your Sparkle Showcase couldn't reach the jewelry catalog. Please try again.",
    });
  });
});

function mockCollectionRows(rows: Record<string, unknown>[]) {
  const range = vi.fn((from: number, to: number) => Promise.resolve({
    data: rows.slice(from, to + 1),
    error: null,
  }));
  const order = vi.fn(() => ({ range }));
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ order })),
        })),
      })),
    }),
  }));
  return { order, range };
}

function mockCatalogBatch(getCatalogJewelryItemsByIdsResult: ReturnType<typeof vi.fn>) {
  vi.doMock("@/lib/sparkle-finder/catalog-service", async (importOriginal) => ({
    ...((await importOriginal()) as Record<string, unknown>),
    getCatalogJewelryItemsByIdsResult,
  }));
}

function collectionRow(designId: string): Record<string, unknown> {
  return {
    id: `collection-${designId}`,
    user_id: userId,
    jewelry_item_id: designId,
    state: "owned",
    note: "",
    is_highlighted: false,
    acquisition_source: "manual",
    acquisition_context: {},
    acquisition_marked_at: null,
    visibility: "private",
    showcase_status: "owned",
    reveal_story: "",
    personal_photo_url: null,
    is_rarest_reveal: false,
  };
}

function jewelryItem(id: string): JewelryItem {
  return {
    id,
    itemNumber: `ITEM-${id}`,
    name: `${id} ring`,
    collectionName: "Test Collection",
    jewelryType: "ring",
    imageUrl: `https://cdn.example.test/${id}.jpg`,
    bpLabel: "standard",
    knownRepListingIds: [],
  };
}
