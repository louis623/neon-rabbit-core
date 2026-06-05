import { describe, expect, it } from "vitest";
import {
  getCatalogJewelryItemById,
  getCatalogJewelryItems,
  mapCanonicalJewelryDesignRow,
  mapSparkleSuiteJewelryType,
  type CanonicalJewelryDesignRow,
} from "../../lib/sparkle-finder/catalog-service";

describe("Sparkle Finder canonical catalog service", () => {
  it("maps Sparkle Suite jewelry_designs rows into Finder library records", () => {
    const item = mapCanonicalJewelryDesignRow(
      canonicalRow({
        design_name: "Starlight Diamond Ring",
        type_prefix: "RG",
        special_features: "Diamond label",
      }),
    );

    expect(item).toEqual({
      id: "design-123",
      name: "Starlight Diamond Ring",
      collectionName: "Midnight Garden",
      jewelryType: "ring",
      imageUrl: "https://cdn.example.test/design-123.jpg",
      bpLabel: "diamond",
      itemNumber: "RG1234",
      knownRepListingIds: [],
    });
  });

  it("uses the agreed Finder type fallback for Sparkle Suite ST items", () => {
    expect(mapSparkleSuiteJewelryType("ST")).toBe("other");
    expect(mapSparkleSuiteJewelryType("BR")).toBe("bracelet");
    expect(mapSparkleSuiteJewelryType("ER")).toBe("earrings");
    expect(mapSparkleSuiteJewelryType("NK")).toBe("necklace");
  });

  it("reads canonical catalog rows and attaches available trade listing ids", async () => {
    const rows = [
      canonicalRow({
        id: "design-unicorn",
        design_name: "Lavender Unicorn Necklace",
        item_number: "NK8888",
        main_stone: "Unicorn opal",
        type_prefix: "NK",
      }),
    ];
    const client = createFakeCatalogClient({
      rows,
      listings: [{ id: "listing-available", design_id: "design-unicorn" }],
    });

    const items = await getCatalogJewelryItems({
      createSupabaseClient: async () => client as never,
      isConfigured: () => true,
      useFixtureFallback: false,
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: "design-unicorn",
        itemNumber: "NK8888",
        jewelryType: "necklace",
        bpLabel: "unicorn",
        knownRepListingIds: ["listing-available"],
      }),
    ]);
  });

  it("fetches a single canonical catalog item by jewelry_designs id", async () => {
    const rows = [canonicalRow({ id: "design-single", item_number: "BR7777", type_prefix: "BR" })];
    const client = createFakeCatalogClient({
      rows,
      listings: [{ id: "listing-single", design_id: "design-single" }],
    });

    const item = await getCatalogJewelryItemById("design-single", {
      createSupabaseClient: async () => client as never,
      isConfigured: () => true,
      useFixtureFallback: false,
    });

    expect(item).toEqual(
      expect.objectContaining({
        id: "design-single",
        itemNumber: "BR7777",
        jewelryType: "bracelet",
        knownRepListingIds: ["listing-single"],
      }),
    );
  });
});

function canonicalRow(overrides: Partial<CanonicalJewelryDesignRow> = {}): CanonicalJewelryDesignRow {
  return {
    id: "design-123",
    item_number: "RG1234",
    design_name: "Starlight Ring",
    material: "Rose gold",
    main_stone: "Pink stone",
    canonical_photo_url: "https://cdn.example.test/design-123.jpg",
    special_features: null,
    type_prefix: "RG",
    collection: { name: "Midnight Garden" },
    ...overrides,
  };
}

function createFakeCatalogClient({
  rows,
  listings,
}: {
  rows: CanonicalJewelryDesignRow[];
  listings: Array<{ id: string; design_id: string }>;
}) {
  return {
    from(table: string) {
      if (table === "jewelry_designs") {
        return {
          select: () => ({
            order: async () => ({ data: rows, error: null }),
            eq: (_column: string, value: string) => ({
              maybeSingle: async () => ({
                data: rows.find((row) => row.id === value) ?? null,
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            in: async (_column: string, values: string[]) => ({
              data: listings.filter((listing) => values.includes(listing.design_id)),
              error: null,
            }),
          }),
        }),
      };
    },
  };
}
