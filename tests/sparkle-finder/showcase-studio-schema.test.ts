import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Sparkle Finder Showcase Studio schema", () => {
  it("keeps Silver missing-piece intake private and master-database ready", () => {
    const migration = readShowcaseStudioMigration();

    expect(migration).toContain("create table if not exists public.sparkle_finder_nic_nac_intake_submissions");
    expect(migration).toContain("create table if not exists public.sparkle_finder_nic_nac_intake_assets");
    expect(migration).toContain("alter table public.sparkle_finder_nic_nac_intake_submissions enable row level security");
    expect(migration).toContain("alter table public.sparkle_finder_nic_nac_intake_assets enable row level security");
    expect(migration).toContain("suite_catalog_design_id");
    expect(migration).toContain("suite_publish_request_id");
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).toContain("sparkle-finder-private");
    expect(migration).toContain("storage.objects");
    expect(migration).toContain("silver users can create their own studio upload objects");
    expect(migration).toContain("sparkle_finder_memberships");
    expect(migration).toContain("grant select, insert, update, delete on public.sparkle_finder_nic_nac_intake_submissions to authenticated");
    expect(migration).not.toMatch(/grant\s+.*sparkle_finder_nic_nac_intake_submissions\s+to\s+anon/i);
    expect(migration).not.toMatch(/security\s+definer/i);
    expect(migration).not.toMatch(/customer_contact|asking_price|counterparty|swap|offer/i);
  });
});

function readShowcaseStudioMigration(): string {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  expect(existsSync(migrationsDir)).toBe(true);
  const fileName = readdirSync(migrationsDir).find((name) => name.includes("sparkle_finder_showcase_studio_intake"));
  expect(fileName).toBeTruthy();

  return readFileSync(join(migrationsDir, fileName!), "utf8").toLowerCase();
}
