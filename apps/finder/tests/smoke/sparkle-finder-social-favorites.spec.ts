import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

const baseUrl = process.env.SPARKLE_FINDER_BASE_URL ?? "http://127.0.0.1:4310";
const screenshotDir = process.env.SPARKLE_FINDER_SCREENSHOT_DIR ?? "verification/sparkle-finder";

test.describe("Sparkle Finder social favorites smoke", () => {
  test("Silver Favorites and Collectors routes expose safe social shortcuts", async ({ page }) => {
    await signInAsSilver(page);
    await page.setViewportSize({ width: 1440, height: 950 });

    await page.goto(`${baseUrl}/favorites`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Favorites" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Favorite Reps" })).toBeVisible();
    await expect(page.getByText("Next show").first()).toBeVisible();
    await expect(page.getByText("Dance Floor").first()).toBeVisible();
    await expect(page.getByText("Rep notes").first()).toBeVisible();
    await expect(page.getByText("Ask Nic-Nac").first()).toBeVisible();
    await expectNoGuardrailCopy(page);

    await page.goto(`${baseUrl}/collectors`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Collectors" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search public collectors" })).toBeVisible();
    await expect(page.getByText("Public Showcases")).toBeVisible();
    await expect(page.locator('[data-smoke="collector-card"]').first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View Showcase" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Follow|Following|Your Showcase/ }).first()).toBeVisible();
    await expect(page.locator('[data-smoke="collector-safety-controls"]').first()).toBeVisible();
    await expect(page.getByText("Safety controls ready.")).toHaveCount(0);
    await expect(page.getByLabel("Confirm block").first()).toBeVisible();
    await expectNoGuardrailCopy(page);

    mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      fullPage: true,
      path: join(screenshotDir, "sparkle-social-favorites-desktop.png"),
    });
  });

  test("collector search and Showcase safety surfaces stay bounded on mobile", async ({ page }) => {
    await signInAsFree(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${baseUrl}/collectors?q=sparkle`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Collectors" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search public collectors" })).toHaveValue("sparkle");
    await expect(page.getByText("Sparkle Showcase").first()).toBeVisible();
    await expect(page.locator('[data-smoke="collector-card"]').first()).toBeVisible();
    await expectNoGuardrailCopy(page);

    await page.goto(`${baseUrl}/showcase/sparkle-mama`, { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-smoke="sparkle-showcase"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Report @/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Block collector", exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm block")).toBeVisible();
    await expectNoGuardrailCopy(page);
  });
});

async function signInAsSilver(page: Page) {
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "sparkle_finder_auth_mode",
      value: "silver",
      url: baseUrl,
    },
  ]);
}

async function signInAsFree(page: Page) {
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "sparkle_finder_auth_mode",
      value: "free",
      url: baseUrl,
    },
  ]);
}

async function expectNoGuardrailCopy(page: Page) {
  const visibleCopy = await page.locator("body").innerText();

  expect(findSparkleFinderCopyViolations(visibleCopy)).toEqual([]);
}
