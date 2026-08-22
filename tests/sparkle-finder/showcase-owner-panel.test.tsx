import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShowcaseOwnerPanel } from "../../components/showcase/ShowcaseOwnerPanel";
import type { ManagedCollectionItem } from "../../components/silver/CollectionManager";

const ownerAction = async () => ({ status: "saved" as const, message: "Saved." });

const collectionItem: ManagedCollectionItem = {
  id: "b1d5d56c-e870-4c37-8af1-c76127642ff0",
  customerId: "user-1",
  jewelryItemId: "jewelry-1",
  state: "owned",
  note: "Private owner note",
  isHighlighted: false,
  acquisitionSource: "manual",
  acquisitionContext: {},
  acquisitionMarkedAt: null,
  visibility: "private",
  showcaseStatus: "owned",
  revealStory: "",
  personalPhotoUrl: null,
  isRarestReveal: false,
  jewelryItem: {
    id: "jewelry-1",
    name: "Amethyst Dreams",
    jewelryType: "ring",
    collectionName: "Birthday Collection",
    collectionYear: 2026,
    itemNumber: "R1234",
    bpLabel: "standard",
    imageUrl: "https://images.example/item.jpg",
    knownRepListingIds: [],
  },
};

describe("Showcase owner workflow", () => {
  it("renders phone-friendly explicit privacy, story, photo, and collection controls", () => {
    const markup = renderToStaticMarkup(
      <ShowcaseOwnerPanel
        assignPieceAction={ownerAction}
        canSave
        collectionItems={[collectionItem]}
        data={{
          handle: "casey-finds",
          tagline: "Purple stacks",
          visibility: "private",
          collections: [{
            id: "9fc64c56-42ee-4c7a-95ca-710648e637af",
            customerId: "user-1",
            title: "Purple Dreams",
            slug: "purple-dreams",
            description: "Favorite purple reveals.",
            visibility: "private",
            pieceIds: [],
          }],
        }}
        deleteCollectionAction={ownerAction}
        isLocalPreview={false}
        saveCollectionAction={ownerAction}
        savePieceAction={ownerAction}
        saveProfileAction={ownerAction}
      />,
    );

    expect(markup).toContain("Nothing becomes public automatically");
    expect(markup).toContain("Make public");
    expect(markup).toContain("Personal piece photo");
    expect(markup).toContain("Reveal story");
    expect(markup).toContain("Showcase Collection");
    expect(markup).toContain("Private notes are never included");
  });

  it("verifies the authenticated account and never accepts a hidden owner ID", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "app/(hub)/silver/showcase-owner-actions.ts"),
      "utf8",
    );

    expect(source).toContain("supabase.auth.getUser()");
    expect(source).toContain("accountState.customer.id !== data.user.id");
    expect(source).toContain("accountState.membership?.hasSilverAccess !== true");
    expect(source).toContain('.eq("user_id", verified.userId)');
    expect(source).not.toContain('formData.get("userId")');
    expect(source).not.toContain('formData.get("customerId")');
  });
});
