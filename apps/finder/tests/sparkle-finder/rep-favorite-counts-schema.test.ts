import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Rep favorite count schema", () => {
  const migration = readFileSync(
    join(process.cwd(), "supabase/migrations/20260821165000_rep_favorite_counts.sql"),
    "utf8",
  ).toLowerCase();

  it("exposes only bounded anonymous aggregate counts to authenticated Finder customers", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("cardinality(p_rep_ids), 0) between 1 and 200");
    expect(migration).toContain("favorite.rep_id = any(p_rep_ids)");
    expect(migration).toContain("revoke all on function public.get_sparkle_finder_rep_favorite_counts(text[]) from public");
    expect(migration).toContain("grant execute on function public.get_sparkle_finder_rep_favorite_counts(text[]) to authenticated");
    expect(migration).not.toMatch(/returns table[\s\s]*user_id/);
  });

  it("hardens favorite ids, grants, indexing, and the Free save limit", () => {
    expect(migration).toContain("sparkle_finder_favorite_reps_rep_id_idx");
    expect(migration).toContain("char_length(btrim(rep_id)) between 1 and 200");
    expect(migration).toContain("sparkle_finder_can_insert_favorite_rep(user_id, rep_id)");
    expect(migration).toContain("from public.sparkle_finder_memberships as membership");
    expect(migration).toContain(") < 5");
    expect(migration).toContain("revoke all on table public.sparkle_finder_favorite_reps from anon, authenticated");
    expect(migration).toContain("grant select, insert, update, delete on table public.sparkle_finder_favorite_reps to authenticated");
  });
});
