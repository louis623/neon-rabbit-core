import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

const baseUrl = process.env.SPARKLE_FINDER_BASE_URL ?? "http://127.0.0.1:4310";
const screenshotDir = process.env.SPARKLE_FINDER_SCREENSHOT_DIR ?? "verification/sparkle-finder";

const smokeTexts = [
  "Sparkle Finder",
  "Today across Sparkle Suite",
  "Master Live Calendar",
  "Rep Trade Boards / Dance Floors",
  "Diamonds & Unicorns",
  "Silver Collector Space",
  "Nic-Nac, find this for me",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.describe("Sparkle Finder homepage smoke", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} homepage renders guarded discovery hub`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

      for (const text of smokeTexts) {
        await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
      }

      await expectNoGuardrailCopy(page);
      await expectPrimarySectionsAreVisible(page);
      await expectPrimarySectionsDoNotOverlap(page);

      mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({
        fullPage: true,
        path: join(screenshotDir, `sparkle-finder-home-${viewport.name}.png`),
      });
    });
  }
});

async function expectNoGuardrailCopy(page: Page) {
  const visibleCopy = await page.locator("body").innerText();
  expect(findSparkleFinderCopyViolations(visibleCopy)).toEqual([]);
}

async function expectPrimarySectionsAreVisible(page: Page) {
  for (const selector of [
    "nav",
    "hero",
    "agenda",
    "discovery-cards",
    "silver",
    "affiliate-strip",
  ]) {
    await expect(page.locator(`[data-smoke="${selector}"]`)).toBeVisible();
  }
}

async function expectPrimarySectionsDoNotOverlap(page: Page) {
  const nav = page.locator('[data-smoke="nav"]');
  const hero = page.locator('[data-smoke="hero"]');
  const agenda = page.locator('[data-smoke="agenda"]');
  const discoveryCards = page.locator('[data-smoke="discovery-cards"]');
  const silver = page.locator('[data-smoke="silver"]');
  const affiliateStrip = page.locator('[data-smoke="affiliate-strip"]');

  await expectNoOverlap(nav, hero, "nav", "hero");
  await expectNoOverlap(discoveryCards, agenda, "discovery cards", "agenda");
  await expectNoOverlap(hero, silver, "hero", "Silver Collector Space");
  await expectNoOverlap(silver, affiliateStrip, "Silver Collector Space", "affiliate strip");
}

async function expectNoOverlap(left: Locator, right: Locator, leftLabel: string, rightLabel: string) {
  const [leftBox, rightBox] = await Promise.all([left.boundingBox(), right.boundingBox()]);

  expect(leftBox, `${leftLabel} should have a rendered bounding box`).not.toBeNull();
  expect(rightBox, `${rightLabel} should have a rendered bounding box`).not.toBeNull();

  if (!leftBox || !rightBox) {
    return;
  }

  expect(leftBox.width, `${leftLabel} width`).toBeGreaterThan(0);
  expect(leftBox.height, `${leftLabel} height`).toBeGreaterThan(0);
  expect(rightBox.width, `${rightLabel} width`).toBeGreaterThan(0);
  expect(rightBox.height, `${rightLabel} height`).toBeGreaterThan(0);

  const overlaps =
    leftBox.x < rightBox.x + rightBox.width &&
    leftBox.x + leftBox.width > rightBox.x &&
    leftBox.y < rightBox.y + rightBox.height &&
    leftBox.y + leftBox.height > rightBox.y;

  expect(overlaps, `${leftLabel} overlaps ${rightLabel}`).toBe(false);
}
