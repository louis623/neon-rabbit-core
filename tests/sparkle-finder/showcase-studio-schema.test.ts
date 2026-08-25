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

  it("makes authenticated Studio access read-only while preserving owner reads", () => {
    const migration = readMigration("20260825143000_sparkle_finder_showcase_studio_recovery.sql");

    expect(migration).toContain("'uploading'");
    expect(migration).toContain("'saved_pending_sync'");
    expect(migration).toContain("sparkle_finder_nic_nac_intake_assets_submission_kind_key");
    expect(migration).toContain("(submission_id, asset_kind)");
    expect(migration.match(/revoke\s+insert,\s*update,\s*delete/g)).toHaveLength(2);
    for (const policy of [
      "silver users can insert their own draft intake submissions",
      "silver users can update their own non-published intake submissions",
      "silver users can delete their own draft intake submissions",
      "silver users can insert their own intake assets",
      "silver users can update their own pending intake assets",
      "silver users can delete their own intake assets",
      "silver users can create their own studio upload objects",
      "silver users can replace their own pending studio upload objects",
      "silver users can remove their own studio upload objects",
    ]) {
      expect(migration).toContain(`drop policy if exists "${policy}"`);
    }
    expect(migration).not.toContain("drop policy if exists \"silver users can select their own intake submissions\"");
    expect(migration).not.toContain("drop policy if exists \"silver users can select their own intake assets\"");
    expect(migration).not.toContain("drop policy if exists \"silver users can read their own studio upload objects\"");
    expect(migration).not.toMatch(/revoke\s+select/i);
    expect(migration).not.toMatch(/create\s+policy|grant\s+|disable\s+row\s+level\s+security/i);
    expect(migration).not.toMatch(/security\s+definer/i);
  });

  it("claims one uploader and never overwrites evidence on resume", () => {
    const stateSource = readSource("lib/sparkle-finder/showcase-studio-state.ts");
    const persistenceSource = readSource("lib/sparkle-finder/showcase-studio-persistence.ts");

    expect(stateSource).toContain('expectedstatus: "draft"');
    expect(stateSource).toContain('values: { status: "uploading" }');
    expect(stateSource).toContain('expectedstatus: "uploading"');
    expect(stateSource).toContain('.eq("status", "uploading")');
    expect(stateSource).toContain('upsert: false');
    expect(stateSource).toContain('.insert([');
    expect(stateSource).not.toContain('.upsert([');
    expect(persistenceSource).toContain('new set(["submitted", "saved_pending_sync"])');
    expect(persistenceSource).not.toContain('new set(["submitted", "saved_pending_sync", "publish_failed"])');
  });
});

function readShowcaseStudioMigration(): string {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  expect(existsSync(migrationsDir)).toBe(true);
  const fileName = readdirSync(migrationsDir).find((name) => name.includes("sparkle_finder_showcase_studio_intake"));
  expect(fileName).toBeTruthy();

  return readFileSync(join(migrationsDir, fileName!), "utf8").toLowerCase();
}

function readMigration(fileName: string): string {
  const migrationPath = join(process.cwd(), "supabase", "migrations", fileName);
  expect(existsSync(migrationPath)).toBe(true);
  return readFileSync(migrationPath, "utf8").toLowerCase();
}

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8").toLowerCase();
}
