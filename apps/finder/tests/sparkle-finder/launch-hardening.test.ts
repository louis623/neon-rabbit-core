import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";
import type { JewelryItem } from "../../lib/sparkle-finder/types";

describe("Sparkle Finder launch hardening", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("next/headers");
    vi.doUnmock("@/lib/sparkle-finder/account-service");
    vi.doUnmock("@/lib/sparkle-finder/catalog-service");
    vi.doUnmock("@supabase/supabase-js");
    vi.unstubAllEnvs();
  });

  it("uses the real signed-in account state on library detail pages", async () => {
    vi.doMock("next/headers", () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      }),
    }));
    vi.doMock("@/lib/sparkle-finder/account-service", () => ({
      getCurrentSparkleFinderAccount: vi.fn().mockResolvedValue(realSilverAccountState()),
    }));
    vi.doMock("@/lib/sparkle-finder/catalog-service", async (importOriginal) => ({
      ...((await importOriginal()) as Record<string, unknown>),
      getCatalogJewelryItemById: vi.fn().mockResolvedValue(jewelryItem()),
      getFinderAvailabilityForJewelryItem: vi.fn().mockResolvedValue(undefined),
    }));

    const { default: ItemDetailPage } = await import("../../app/(hub)/library/[itemId]/page");
    const markup = renderToStaticMarkup(
      await ItemDetailPage({ params: Promise.resolve({ itemId: "jewel-rainbow-crown-ring" }) }),
    );

    expect(markup).toContain(">Nic-Nac</h2>");
    expect(markup).toContain("finder-nic-nac-chatbot");
    expect(markup).not.toContain("Browse for free. Let Nic-Nac hunt for you with Silver.");
  });

  it("renders account notices for billing redirect states", async () => {
    vi.doMock("next/headers", () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      }),
    }));
    vi.doMock("@/lib/sparkle-finder/account-service", async (importOriginal) => ({
      ...((await importOriginal()) as Record<string, unknown>),
      getCurrentSparkleFinderAccount: vi.fn().mockResolvedValue(realSilverAccountState()),
    }));

    const { default: AccountPage } = await import("../../app/account/page");
    const notConfiguredMarkup = renderToStaticMarkup(
      await AccountPage({ searchParams: Promise.resolve({ error: "billing_not_configured" }) }),
    );
    const alreadyActiveMarkup = renderToStaticMarkup(
      await AccountPage({ searchParams: Promise.resolve({ message: "silver_already_active" }) }),
    );
    const paidDisabledMarkup = renderToStaticMarkup(
      await AccountPage({ searchParams: Promise.resolve({ error: "paid_billing_disabled" }) }),
    );

    expect(notConfiguredMarkup).toContain("Silver billing is not configured yet");
    expect(notConfiguredMarkup).toContain("Your Silver trial and account access are still safe.");
    expect(alreadyActiveMarkup).toContain("Silver is already active");
    expect(alreadyActiveMarkup).toContain("You already have paid Silver access.");
    expect(paidDisabledMarkup).toContain("Paid Silver is not open for beta yet");
    expect(paidDisabledMarkup).toContain("Your 45-day Silver trial remains available while checkout stays closed.");
  }, 10_000);

  it("does not create a service-role client for the blocked shared Supabase project", async () => {
    const createClient = vi.fn(() => ({
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }));
    vi.doMock("@supabase/supabase-js", () => ({
      createClient,
    }));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://bqhzfkgkjyuhlsozpylf.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { applyStripeMembershipUpdate } = await import("../../lib/sparkle-finder/billing");
    const result = await applyStripeMembershipUpdate({
      userId: "user-123",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      accessState: "silver_paid",
      silverSource: "stripe",
      silverStartedAt: "2026-06-01T12:00:00.000Z",
      silverEndsAt: null,
    });

    expect(createClient).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      reason:
        "Missing or invalid SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL; refusing to update membership with an unsafe service role client.",
    });
  });

  it("tracks collection acquisition source for honest Finder-find statistics", () => {
    const migration = readFileSync(
      "supabase/migrations/20260702235634_collection_acquisition_source.sql",
      "utf8",
    );

    expect(migration).toContain("alter table public.sparkle_finder_collection_items");
    expect(migration).toContain("acquisition_source");
    expect(migration).toContain("acquisition_context");
    expect(migration).toContain("acquisition_marked_at");
    expect(migration).toContain("'sparkle_finder_lead'");
    expect(migration).toContain("'nic_nac_request'");
    expect(migration).toContain("sparkle_finder_collection_items_user_acquisition_source_idx");
  });

  it("uses the verified session client for Silver profile saves", async () => {
    const sessionClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: vi.fn(),
    };
    const persistSilverProfileForAccount = vi.fn().mockResolvedValue({ ok: true });
    const revalidatePath = vi.fn();

    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(sessionClient),
    }));
    vi.doMock("@/lib/sparkle-finder/account-service", () => ({
      getCurrentSparkleFinderAccount: vi.fn().mockResolvedValue(realSilverAccountState()),
    }));
    vi.doMock("@/lib/sparkle-finder/customer-state", async (importOriginal) => ({
      ...((await importOriginal()) as Record<string, unknown>),
      persistSilverProfileForAccount,
    }));

    const { saveSilverProfileAction } = await import("../../app/(hub)/silver/actions");
    const formData = new FormData();
    formData.set("displayName", "Louis's Bling Vault");
    formData.set("tiktokHandle", "@louis");
    formData.set("bio", "Testing live profile saves.");
    formData.set("visibility", "private");

    const result = await saveSilverProfileAction({ status: "idle", message: "" }, formData);

    expect(result).toEqual({ status: "saved", message: "Profile saved." });
    expect(persistSilverProfileForAccount).toHaveBeenCalledWith(
      sessionClient,
      expect.objectContaining({ customer: expect.objectContaining({ id: "user-123" }) }),
      expect.objectContaining({
        bio: "Testing live profile saves.",
        displayName: "Louis's Bling Vault",
        tiktokHandle: "@louis",
        visibility: "private",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("keeps a safe profile-save error when persistence fails", async () => {
    const persistSilverProfileForAccount = vi.fn().mockResolvedValue({ ok: false, reason: "save_failed" });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
        },
      }),
    }));
    vi.doMock("@/lib/sparkle-finder/account-service", () => ({
      getCurrentSparkleFinderAccount: vi.fn().mockResolvedValue(realSilverAccountState()),
    }));
    vi.doMock("@/lib/sparkle-finder/customer-state", async (importOriginal) => ({
      ...((await importOriginal()) as Record<string, unknown>),
      persistSilverProfileForAccount,
    }));

    const { saveSilverProfileAction } = await import("../../app/(hub)/silver/actions");
    const formData = new FormData();
    formData.set("displayName", "Louis's Bling Vault");

    const result = await saveSilverProfileAction({ status: "idle", message: "" }, formData);

    expect(result).toEqual({
      status: "error",
      message: "Profile could not be saved.",
    });
  });

  it("disables fixture fallback for production catalog and live-show route reads", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "");
    const getCatalogJewelryItemsPageResult = vi.fn().mockResolvedValue({
      status: "success",
      pagination: "supported",
      schemaVersion: 2,
      items: [],
      pageInfo: { totalCount: 0, hasMore: false, nextCursor: null },
    });
    const getCatalogFacetOptions = vi.fn().mockResolvedValue(emptyFacetOptions());
    const getFinderLiveShows = vi.fn().mockResolvedValue([]);
    vi.doMock("@/lib/sparkle-finder/catalog-service", async (importOriginal) => ({
      ...((await importOriginal()) as Record<string, unknown>),
      getCatalogJewelryItemsPageResult,
      getCatalogFacetOptions,
      getFinderLiveShows,
    }));

    const { default: LibraryPage } = await import("../../app/(hub)/library/page");
    const { default: LiveShowsPage } = await import("../../app/(hub)/live-shows/page");

    await LibraryPage();
    await LiveShowsPage();

    expect(getCatalogJewelryItemsPageResult).toHaveBeenCalledWith(expect.objectContaining({ useFixtureFallback: false }));
    expect(getCatalogFacetOptions).toHaveBeenCalledWith(expect.objectContaining({ useFixtureFallback: false }));
    expect(getFinderLiveShows).toHaveBeenCalledWith(expect.objectContaining({ useFixtureFallback: false }));
  });
});

function realSilverAccountState(): CurrentSparkleFinderAccountState {
  return {
    status: "authenticated",
    tier: "silver",
    displayName: "Casey Collector",
    email: "casey@example.com",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.com",
      state: "PA",
      tier: "silver",
    },
    membership: {
      accountId: "user-123",
      personId: "user-123",
      accessState: "silver_trial",
      silverSource: "trial",
      trialStartedAt: "2026-06-01T12:00:00.000Z",
      trialEndsAt: "2026-07-16T12:00:00.000Z",
      silverStartedAt: "2026-06-01T12:00:00.000Z",
      silverEndsAt: "2026-07-16T12:00:00.000Z",
      effectiveState: "silver_trial",
      hasSilverAccess: true,
      isTrialActive: true,
      isTrialExpired: false,
    },
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      promotionalEmailOptIn: false,
      promotionalSmsOptIn: false,
      accountSmsConsentedAt: null,
      promotionalEmailConsentedAt: null,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-06-01T12:00:00.000Z",
    },
  };
}

function jewelryItem(): JewelryItem {
  return {
    id: "jewel-rainbow-crown-ring",
    name: "Rainbow Crown Ring",
    collectionName: "Rainbow Luxe",
    collectionYear: 2026,
    jewelryType: "ring",
    material: "Rhodium",
    mainStone: "Rainbow topaz",
    imageUrl: "",
    bpLabel: "diamond",
    itemNumber: "RCR-001",
    searchTags: ["rainbow", "crown"],
    availableListingCount: 2,
    knownRepListingIds: ["rainbow-crown"],
  };
}

function emptyFacetOptions() {
  return {
    collections: [],
    materials: [],
    stones: [],
    types: [],
    labels: [],
    years: [],
  };
}
