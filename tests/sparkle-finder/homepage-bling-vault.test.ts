import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomepageBlingVault } from "../../components/home/HomepageBlingVault";
import { BlingVaultMosaic } from "../../components/home/BlingVaultMosaic";
import { HeroPieceSpotlight } from "../../components/home/HeroPieceSpotlight";
import {
  createInitialBlingVaultLoadState,
  reduceBlingVaultLoadState,
} from "../../lib/sparkle-finder/bling-vault-load-state";
import {
  buildHomepageBlingVaultModel,
  filterHomepageBlingVaultItems,
  getHomepageBlingVaultImageUrl,
  type HomepageBlingVaultItem,
} from "../../lib/sparkle-finder/homepage-bling-vault";
import type { CustomerAccount, JewelryItem } from "../../lib/sparkle-finder/types";

describe("Homepage Bling Vault showroom", () => {
  it("keeps a selected owned Hero Piece and exposes the complete filter source", () => {
    const wishlist = vaultItem("wishlist", { state: "wishlist" });
    const owned = vaultItem("owned");
    const selected = vaultItem("selected");
    const model = buildHomepageBlingVaultModel([wishlist, owned, selected], "selected");

    expect(model.heroItem?.id).toBe("selected");
    expect(model.allItems).toEqual([wishlist, owned, selected]);
  });

  it("does not promote a Wishlist piece to Hero Piece when no owned piece exists", () => {
    const model = buildHomepageBlingVaultModel([vaultItem("wishlist", { state: "wishlist" })]);

    expect(model.heroItem).toBeUndefined();
  });

  it("distinguishes a suggested Hero candidate from the saved Hero Piece", () => {
    const item = vaultItem("candidate");
    const suggestionMarkup = renderToStaticMarkup(
      createElement(HeroPieceSpotlight, { item, isSelected: false }),
    );
    const selectedMarkup = renderToStaticMarkup(
      createElement(HeroPieceSpotlight, { item, isSelected: true }),
    );

    expect(suggestionMarkup).toContain("Hero Piece suggestion");
    expect(suggestionMarkup).toContain("Ready to make your Hero");
    expect(suggestionMarkup).not.toContain("Not saved as Hero yet");
    expect(selectedMarkup).toContain("Selected Hero Piece");
    expect(selectedMarkup).toContain("This is your current Hero Piece.");
    expect(selectedMarkup).toContain('role="status"');
    expect(selectedMarkup).not.toContain("Hero Piece suggestion");
  });

  it("filters owned, Wishlist, rarity, and Finder-assisted pieces", () => {
    const items = [
      vaultItem("diamond", { bpLabel: "diamond", acquisitionSource: "sparkle_finder_lead" }),
      vaultItem("unicorn", { bpLabel: "unicorn", acquisitionSource: "nic_nac_request" }),
      vaultItem("standard"),
      vaultItem("wishlist", { state: "wishlist", bpLabel: "diamond", acquisitionSource: "wishlist" }),
    ];

    expect(filterHomepageBlingVaultItems(items, "all")).toHaveLength(4);
    expect(filterHomepageBlingVaultItems(items, "owned").map((item) => item.id)).toEqual(["diamond", "unicorn", "standard"]);
    expect(filterHomepageBlingVaultItems(items, "wishlist").map((item) => item.id)).toEqual(["wishlist"]);
    expect(filterHomepageBlingVaultItems(items, "diamonds").map((item) => item.id)).toEqual(["diamond"]);
    expect(filterHomepageBlingVaultItems(items, "unicorns").map((item) => item.id)).toEqual(["unicorn"]);
    expect(filterHomepageBlingVaultItems(items, "finder").map((item) => item.id)).toEqual(["diamond", "unicorn"]);
  });

  it("prefers a customer photo and safely falls back to the canonical jewelry image", () => {
    const item = vaultItem("photo", { personalPhotoUrl: " https://cdn.example.test/my-photo.jpg " });

    expect(getHomepageBlingVaultImageUrl(item)).toBe("https://cdn.example.test/my-photo.jpg");
    expect(getHomepageBlingVaultImageUrl({ ...item, personalPhotoUrl: " " })).toBe(item.jewelryItem.imageUrl);
  });

  it("renders the compact filters, richer cues, Hero control, and required section order", () => {
    const model = buildHomepageBlingVaultModel([
      vaultItem("hero"),
      vaultItem("wishlist", { state: "wishlist" }),
      vaultItem("finder-diamond", {
        acquisitionSource: "sparkle_finder_lead",
        bpLabel: "diamond",
        personalPhotoUrl: "https://cdn.example.test/customer-ring.jpg",
      }),
    ], "hero");
    const markup = renderToStaticMarkup(
      createElement(HomepageBlingVault, {
        customer: customer(),
        model,
      }),
    );

    expect(markup).toContain('aria-label="Filter your Bling Vault"');
    expect(markup).toContain("Found by Sparkle Finder");
    expect(markup).toContain("Diamonds");
    expect(markup).toContain("Unicorns");
    expect(markup).toContain("Make Hero Piece");
    expect(markup).toContain("Your photo");
    expect(markup).toContain("https://cdn.example.test/customer-ring.jpg");
    expect(markup.indexOf("Hero Piece")).toBeLessThan(markup.indexOf("Pieces you want to find."));
    expect(markup.indexOf("Pieces you want to find.")).toBeLessThan(markup.indexOf("Your collection, all in one place."));
  });

  it("keeps the initial mosaic DOM bounded for a larger collection", () => {
    const items = Array.from({ length: 18 }, (_, index) => vaultItem(`large-${index}`));
    const markup = renderToStaticMarkup(createElement(BlingVaultMosaic, { items }));

    expect((markup.match(/data-smoke="bling-vault-tile"/g) ?? [])).toHaveLength(8);
    expect(markup).toContain("Showing 8 of 18 pieces");
  });

  it("renders an honest retry state instead of an empty collection when the initial read fails", () => {
    const markup = renderToStaticMarkup(
      createElement(BlingVaultMosaic, {
        canLoadPersistedItems: true,
        initialLoadError: "Your Bling Vault couldn't reach the jewelry catalog. Please try again.",
        items: [],
        totalItemCount: 0,
      }),
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("couldn&#x27;t reach the jewelry catalog");
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("Your mosaic will grow here.");
  });

  it("does not show zero stats, an empty Hero, or an empty Wishlist during an initial failure", () => {
    const markup = renderToStaticMarkup(
      createElement(HomepageBlingVault, {
        canLoadPersistedItems: true,
        customer: customer(),
        initialBlingVaultLoadError: "We couldn't load your Bling Vault. Please try again.",
        model: buildHomepageBlingVaultModel([]),
      }),
    );

    expect(markup).toContain("Your saved pieces are still safe.");
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("Start your collection.");
    expect(markup).not.toContain("No Wishlist pieces yet.");
    expect(markup).not.toContain('data-smoke="collection-stats"');
  });

  it("keeps real-account collection pages out of the initial browser payload", () => {
    const authenticatedHomeSource = readFileSync("components/home/AuthenticatedHomePage.tsx", "utf8");
    const mosaicSource = readFileSync("components/home/BlingVaultMosaic.tsx", "utf8");
    const heroActionSource = readFileSync("components/home/HeroPieceActionForm.tsx", "utf8");
    const pageActionSource = readFileSync("app/actions/bling-vault.ts", "utf8");

    expect(authenticatedHomeSource).toContain("completeBlingVaultModel.allItems.slice(0, 12)");
    expect(mosaicSource).toContain("loadBlingVaultPage(activeFilter, persistedItems.length");
    expect(mosaicSource).toContain("loadBlingVaultPage(filter, 0, initialBatchSize)");
    expect(pageActionSource).toContain("supabase.auth.getUser()");
    expect(pageActionSource).toContain('.eq("user_id", authData.user.id)');
    expect(pageActionSource).toContain("filtered.slice(safeOffset, safeOffset + limit)");
    expect(pageActionSource).toContain('status: "error"');
    expect(heroActionSource).toContain("useActionState");
    expect(heroActionSource).toContain("disabled={isPending}");
    expect(heroActionSource).toContain('role="status"');
    expect(heroActionSource).toContain('state.status === "success" ? state.message');
    expect(pageActionSource).not.toContain('formData.get("userId")');
  });

  it("ignores a stale filter response after a newer request starts", () => {
    const initial = createInitialBlingVaultLoadState({
      items: [vaultItem("initial")],
      total: 1,
    });
    const firstRequest = reduceBlingVaultLoadState(initial, {
      type: "request_started",
      filter: "wishlist",
      requestId: 1,
      replace: true,
    });
    const secondRequest = reduceBlingVaultLoadState(firstRequest, {
      type: "request_started",
      filter: "diamonds",
      requestId: 2,
      replace: true,
    });
    const afterStaleResponse = reduceBlingVaultLoadState(secondRequest, {
      type: "request_finished",
      requestId: 1,
      replace: true,
      result: {
        status: "success",
        items: [vaultItem("stale-wishlist", { state: "wishlist" })],
        total: 1,
      },
    });

    expect(afterStaleResponse).toBe(secondRequest);

    const completed = reduceBlingVaultLoadState(afterStaleResponse, {
      type: "request_finished",
      requestId: 2,
      replace: true,
      result: {
        status: "success",
        items: [vaultItem("fresh-diamond", { bpLabel: "diamond" })],
        total: 1,
      },
    });

    expect(completed.activeFilter).toBe("diamonds");
    expect(completed.items.map((item) => item.id)).toEqual(["fresh-diamond"]);
    expect(completed.status).toBe("idle");
  });

  it("keeps the selected filter through an error and a successful retry", () => {
    const initial = createInitialBlingVaultLoadState({ items: [], total: 0 });
    const loading = reduceBlingVaultLoadState(initial, {
      type: "request_started",
      filter: "finder",
      requestId: 4,
      replace: true,
    });
    const failed = reduceBlingVaultLoadState(loading, {
      type: "request_finished",
      requestId: 4,
      replace: true,
      result: { status: "error", message: "Catalog unavailable." },
    });

    expect(failed).toMatchObject({
      activeFilter: "finder",
      errorMessage: "Catalog unavailable.",
      status: "error",
    });

    const retrying = reduceBlingVaultLoadState(failed, {
      type: "request_started",
      filter: failed.activeFilter,
      requestId: 5,
      replace: true,
    });
    const recovered = reduceBlingVaultLoadState(retrying, {
      type: "request_finished",
      requestId: 5,
      replace: true,
      result: {
        status: "success",
        items: [vaultItem("finder-recovery", { acquisitionSource: "sparkle_finder_lead" })],
        total: 1,
      },
    });

    expect(recovered.activeFilter).toBe("finder");
    expect(recovered.errorMessage).toBeNull();
    expect(recovered.items.map((item) => item.id)).toEqual(["finder-recovery"]);
  });

  it("enforces one owner-only, owned Hero Piece atomically in the additive migration", () => {
    const migration = readFileSync(
      "supabase/migrations/20260822170000_sparkle_finder_single_hero_piece.sql",
      "utf8",
    );

    expect(migration).toContain("add column if not exists hero_collection_item_id uuid");
    expect(migration).toContain("references public.sparkle_finder_collection_items(id) on delete set null");
    expect(migration).toContain("authenticated_user_id uuid := auth.uid()");
    expect(migration).toContain("user_id = authenticated_user_id");
    expect(migration).toContain("and state = 'owned'");
    expect(migration).toContain("set hero_collection_item_id = set_sparkle_finder_hero_piece.collection_item_id");
    expect(migration).toContain("grant execute on function public.set_sparkle_finder_hero_piece(uuid) to authenticated");
    expect(migration).toContain("revoke all on function public.set_sparkle_finder_hero_piece(uuid) from anon");
  });
});

function customer(): CustomerAccount {
  return {
    id: "customer-showroom",
    displayName: "Casey Collector",
    email: "casey@example.test",
    state: "KY",
    tier: "silver",
  };
}

function vaultItem(
  id: string,
  overrides: Partial<HomepageBlingVaultItem> & {
    acquisitionSource?: HomepageBlingVaultItem["acquisitionSource"];
    bpLabel?: JewelryItem["bpLabel"];
  } = {},
): HomepageBlingVaultItem {
  const { bpLabel = "standard", ...itemOverrides } = overrides;

  return {
    id,
    customerId: "customer-showroom",
    jewelryItemId: `jewelry-${id}`,
    state: "owned",
    note: "",
    isHighlighted: false,
    acquisitionSource: "manual",
    acquisitionContext: {},
    acquisitionMarkedAt: null,
    jewelryItem: {
      id: `jewelry-${id}`,
      name: `${id} ring`,
      collectionName: "Showroom Collection",
      jewelryType: "ring",
      imageUrl: `https://cdn.example.test/${id}.jpg`,
      bpLabel,
      itemNumber: `ITEM-${id}`,
      knownRepListingIds: [],
    },
    ...itemOverrides,
  };
}
