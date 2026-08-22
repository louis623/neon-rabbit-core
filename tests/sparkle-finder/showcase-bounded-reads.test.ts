import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260822230000_sparkle_finder_bounded_showcase_reads.sql",
);

describe("Sparkle Showcase bounded public reads", () => {
  it("adds predicate-matched indexes for the bounded public query shapes", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("sparkle_finder_collection_items_public_showcase_page_idx");
    expect(sql).toContain("(user_id, updated_at desc, id desc)");
    expect(sql).toContain("where visibility = 'public'");
    expect(sql).toContain("sparkle_finder_showcase_collections_public_page_idx");
    expect(sql).toContain("(user_id, created_at desc, id desc)");
    expect(sql).toContain("sparkle_finder_showcase_comments_public_page_idx");
    expect(sql).toContain("(showcase_user_id, target_type, target_id, created_at desc, id desc)");
    expect(sql).toContain("where deleted_at is null");
  });

  it("keeps the privacy-aware social count RPC service-only and block-aware", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("profile.profile_visibility = 'sparkle_finder'");
    expect(sql).toContain("profile.showcase_visibility = 'public'");
    expect(sql).toContain("public_piece_count bigint");
    expect(sql).toContain("rarest_reveal_count bigint");
    expect(sql).toContain("hero_collection_item_id uuid");
    expect(sql).toContain("item.state in ('owned', 'wishlist')");
    expect(sql).toContain("item.showcase_status in ('owned', 'wishlist', 'iso')");
    expect(sql).toContain("from public.sparkle_finder_collector_blocks as block");
    expect(sql).toContain("revoke all on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) from anon");
    expect(sql).toContain("revoke all on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) from authenticated");
    expect(sql).toContain("grant execute on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) to service_role");
  });
});
