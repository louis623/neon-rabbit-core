import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/20260822210000_sparkle_finder_showcase_public_read_hardening.sql";

describe("Sparkle Showcase public read hardening", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  it("keeps raw public profile and collection-row policies anonymous-only", () => {
    const profilePolicy = policyBody("public can select public showcase profiles");
    const itemPolicy = policyBody("public can select public showcase collection items");

    expect(profilePolicy).toContain("to anon");
    expect(profilePolicy).not.toContain("to anon, authenticated");
    expect(itemPolicy).toContain("to anon");
    expect(itemPolicy).not.toContain("to anon, authenticated");
    expect(itemPolicy).toContain("state in ('owned', 'wishlist')");
    expect(itemPolicy).toContain("showcase_status in ('owned', 'wishlist', 'iso')");
  });

  it("removes broad authenticated selects while preserving owner column access", () => {
    expect(sql).toContain("revoke select on table public.sparkle_finder_profiles from authenticated");
    expect(sql).toContain("revoke select on table public.sparkle_finder_collection_items from authenticated");
    expect(sql).toContain("grant select (\n  user_id,\n  display_name,\n  email");
    expect(sql).toContain("grant select (\n  id,\n  user_id,\n  jewelry_item_id,\n  state,\n  note");
    expect(sql).toContain("using (user_id = (select auth.uid()))");
  });

  it("guards joins, comments, follows, and reports with the same fail-closed helpers", () => {
    expect(sql).toContain("private.sparkle_finder_is_public_showcase_owner");
    expect(sql).toContain("private.sparkle_finder_is_public_showcase_item");
    expect(sql).toContain("private.sparkle_finder_is_public_showcase_comment(showcase_user_id, author_user_id)");
    expect(sql).toContain("not private.sparkle_finder_has_collector_block_between((select auth.uid()), author_user_id)");
    expect(sql).toContain("target_id = showcase_user_id::text");
    expect(sql).toContain("revoke execute on function public.rls_auto_enable() from public, anon, authenticated");
    expect(sql).toContain("public.sparkle_finder_collector_blocks\nto service_role");
  });

  it("splits anonymous and signed-in comment policies while suppressing owner-author blocks", () => {
    const anonymousPolicy = policyBody("anonymous can select non-deleted comments on public showcases");
    const authenticatedPolicy = policyBody("authenticated users can select non-deleted comments on public showcases");

    expect(anonymousPolicy).toContain("to anon");
    expect(anonymousPolicy).toContain("sparkle_finder_is_public_showcase_comment(showcase_user_id, author_user_id)");
    expect(authenticatedPolicy).toContain("to authenticated");
    expect(authenticatedPolicy).toContain("sparkle_finder_is_public_showcase_comment(showcase_user_id, author_user_id)");
    expect(sql).toContain("set search_path = ''");
    expect(sql).not.toContain("where collection_item.id::text = target_collection_item_id");
  });

  function policyBody(name: string): string {
    const start = sql.indexOf(`create policy "${name}"`);
    expect(start).toBeGreaterThanOrEqual(0);
    const next = sql.indexOf("\n\ndrop policy", start + 1);
    return sql.slice(start, next === -1 ? undefined : next);
  }
});
