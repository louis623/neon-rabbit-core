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
      await expectHomepageLinksStayLocal(page);
      await expectReadableControls(page);
      await expectPrimarySectionsAreVisible(page);
      await expectPrimarySectionsDoNotOverlap(page);

      mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({
        fullPage: true,
        path: join(screenshotDir, `sparkle-finder-home-${viewport.name}.png`),
      });
    });
  }

  test("homepage primary controls route to local app pages", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    await expectClickPath(page, page.getByRole("link", { name: "Explore Live Calendar" }), "/live-shows");
    await expectClickPath(page, page.getByRole("link", { name: "Browse Library" }), "/library");
    await expectClickPath(page, page.getByRole("link", { name: "Master Live Calendar" }), "/live-shows");
    await expectClickPath(page, page.getByRole("link", { name: "Rep Trade Boards / Dance Floors" }), "/rep-boards");
    await expectClickPath(page, page.getByRole("link", { name: "Diamonds & Unicorns Library" }), "/diamonds-unicorns");
    await expectClickPath(page, page.getByRole("link", { name: "Shop affiliate picks" }), "/shop");
  });

  test("auth preview paths open gated hub routes", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sign in to open Sparkle Finder")).toBeVisible();
    await expectNoGuardrailCopy(page);
    await expectNoExampleLinksOnCurrentPage(page);

    await page.getByRole("link", { name: "Continue to sign in" }).click();
    await expect(page).toHaveURL(`${baseUrl}/auth/sign-in`);
    await expect(page.getByRole("link", { name: "Continue as Guest" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Continue as Marlena/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Preview Sparkle Mama/ })).toBeVisible();

    await page.getByRole("link", { name: /Continue as Marlena/ }).click();
    await expect(page).toHaveURL(`${baseUrl}/dashboard`);
    await expect(page.getByText("Finder Dashboard")).toBeVisible();

    await page.goto(`${baseUrl}/silver`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Silver preview needed")).toBeVisible();

    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /Preview Sparkle Mama/ }).click();
    await expect(page).toHaveURL(`${baseUrl}/dashboard`);
    await page.goto(`${baseUrl}/silver`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sparkle Mama's Silver Space")).toBeVisible();

    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Continue as Guest" }).click();
    await expect(page).toHaveURL(`${baseUrl}/`);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sign in to open Sparkle Finder")).toBeVisible();
  });

  test("Silver library item detail exposes bounded Nic-Nac and local rep-board paths", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /Preview Sparkle Mama/ }).click();
    await expect(page).toHaveURL(`${baseUrl}/dashboard`);

    await page.goto(`${baseUrl}/library/jewel-rainbow-crown-ring`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Rainbow Crown Ring").first()).toBeVisible();
    await expect(page.getByText("Nic-Nac, find this for me")).toBeVisible();
    await expect(page.getByText("Exact item", { exact: true }).first()).toBeVisible();
    await expectNoGuardrailCopy(page);
    await expectNoExampleLinksOnCurrentPage(page);

    await page.getByRole("link", { name: "Open rep board path" }).first().click();
    await expect(page).toHaveURL(`${baseUrl}/rep-boards?listing=rainbow-crown`);
    await expect(page.getByText("Rep Trade Boards / Dance Floors")).toBeVisible();
    await expectNoExampleLinksOnCurrentPage(page);
  });
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

async function expectHomepageLinksStayLocal(page: Page) {
  const hrefs = await page.locator("main a[href], nav a[href]").evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).href),
  );

  expect(hrefs.some((href) => href.includes("sparklesuite.example"))).toBe(false);
}

async function expectNoExampleLinksOnCurrentPage(page: Page) {
  const html = await page.content();
  expect(html).not.toContain("sparklesuite.example");
}

async function expectReadableControls(page: Page) {
  const navLabelsFit = await page.locator('[data-smoke="nav"] a').evaluateAll((links) =>
    links.every((link) => link.scrollWidth <= link.clientWidth + 1),
  );
  expect(navLabelsFit, "nav labels should not be clipped inside links").toBe(true);

  const primaryColors = await page.getByRole("link", { name: "Explore Live Calendar" }).evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      background: styles.backgroundColor,
      foreground: styles.color,
    };
  });
  const primaryContrast = getContrastRatio(primaryColors.foreground, primaryColors.background);

  expect(primaryContrast, "primary CTA contrast").toBeGreaterThan(4.5);
  expect(primaryColors.foreground, "primary CTA should render light text").toContain("255");
  expect(primaryColors.background, "primary CTA should have a visible background").not.toBe("rgba(0, 0, 0, 0)");
}

async function expectClickPath(page: Page, link: Locator, expectedPath: string) {
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath.replace("/", "\\/")}(\\?|$)`));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
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

function getContrastRatio(foreground: string, background: string) {
  const fore = parseRgb(foreground);
  const back = parseRgb(background);
  const lighter = Math.max(getRelativeLuminance(fore), getRelativeLuminance(back));
  const darker = Math.min(getRelativeLuminance(fore), getRelativeLuminance(back));

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance([red, green, blue]: [number, number, number]) {
  const [r, g, b] = [red, green, blue].map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseRgb(value: string): [number, number, number] {
  if (value.startsWith("#") && (value.length === 7 || value.length === 4)) {
    const hex =
      value.length === 4
        ? value
            .slice(1)
            .split("")
            .map((character) => character + character)
            .join("")
        : value.slice(1);

    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ];
  }

  const matches = value.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  const channels = matches.slice(0, 3);

  if (value.startsWith("color(") && channels.every((channel) => channel <= 1)) {
    return [
      Math.round((channels[0] ?? 0) * 255),
      Math.round((channels[1] ?? 0) * 255),
      Math.round((channels[2] ?? 0) * 255),
    ];
  }

  return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0];
}
