import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FollowedShowcases } from "../../components/social/FollowedShowcases";

describe("Followed Showcases", () => {
  it("renders a bounded public highlight and an honest empty state", () => {
    const markup = renderToStaticMarkup(
      <FollowedShowcases highlights={[{
        userId: "user-1",
        handle: "casey-finds",
        displayName: "Casey",
        tagline: "Purple stacks",
        collectorPhotoUrl: null,
        collectionItemId: "b1d5d56c-e870-4c37-8af1-c76127642ff0",
        jewelryItemId: "jewelry-1",
        revealStory: "My favorite birthday reveal.",
        personalPhotoUrl: null,
        isRarestReveal: true,
        updatedAt: "2026-08-22T19:30:00.000Z",
        showcaseUrl: "/showcase/casey-finds",
        spotlightUrl: "/showcase/casey-finds/pieces/jewelry-1",
      }]} />,
    );

    expect(markup).toContain("Followed Showcases");
    expect(markup).toContain("Rarest Reveal");
    expect(markup).toContain("Open Piece Spotlight");
    expect(markup).toContain("My favorite birthday reveal.");
    expect(markup).toContain("/showcase/casey-finds/pieces/");

    expect(renderToStaticMarkup(<FollowedShowcases highlights={[]} />)).toContain(
      "Follow collectors to see their newest pieces.",
    );
    expect(renderToStaticMarkup(<FollowedShowcases highlights={[]} />)).toContain(
      "Their newest public pieces will appear here.",
    );
    expect(markup).toContain("See the newest public pieces shared by collectors you follow.");
  });

  it("keeps the database helper authenticated, bounded, block-aware, and free of private note fields", () => {
    const sql = fs.readFileSync(
      path.resolve(process.cwd(), "supabase/migrations/20260822220000_sparkle_finder_owned_rarest_reveals.sql"),
      "utf8",
    );

    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("select (select auth.uid())");
    expect(sql).toContain("sparkle_finder_collector_blocks");
    expect(sql).toContain("item.visibility = 'public'");
    expect(sql).toContain("item.showcase_status <> 'private_note_only'");
    expect(sql).toContain("item.state = 'owned'");
    expect(sql).toContain("item.showcase_status = 'owned'");
    expect(sql).toContain("sparkle_finder_collection_items_rarest_reveal_owned");
    expect(sql).toContain("or (state = 'owned' and showcase_status = 'owned')");
    expect(sql).toContain("limit least(greatest(coalesce(result_limit, 6), 1), 12)");
    expect(sql).toContain("grant execute on function public.sparkle_finder_list_followed_showcase_highlights(integer) to authenticated");
    expect(sql).toContain("sparkle_finder_list_followed_showcase_highlights_v2");
    expect(sql).toContain("item.state::text as state");
    expect(sql).toContain("item.showcase_status::text as showcase_status");
    expect(sql).toContain("grant execute on function public.sparkle_finder_list_followed_showcase_highlights_v2(integer) to authenticated");
    expect(sql).not.toMatch(/\bnote\b/);
  });
});
