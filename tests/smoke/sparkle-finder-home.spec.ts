import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

const baseUrl = process.env.SPARKLE_FINDER_BASE_URL ?? "http://127.0.0.1:4310";
const screenshotDir = process.env.SPARKLE_FINDER_SCREENSHOT_DIR ?? "verification/sparkle-finder";
const sparkleSuiteFinderBaseUrl = (
  process.env.SPARKLE_SUITE_FINDER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL ??
  "https://www.yoursparklesuite.com"
)
  .trim()
  .replace(/\/+$/, "");

const smokeTexts = [
  "Sparkle Finder",
  "Find it, favorite it, show it off.",
  "Start free Silver trial",
  "Find the pieces you like",
  "Built for collectors, independently.",
  "Sparkle Finder is not Bomb Party",
  "Master Jewelry Library",
  "Live Show Calendar",
  "Rep Trade Boards / Dance Floors",
  "Collection Showcase",
  "Photo-ready uploads",
  "Start with your 45-day Silver Tier trial",
  "45 days free",
  "$4.99/month",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.describe("Sparkle Finder homepage smoke", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} homepage renders trust-first public landing`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

      for (const text of smokeTexts) {
        await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
      }

      await expectNoGuardrailCopy(page);
      await expectHomepageLinksStayLocal(page);
      await expectNoPublicHomepageDemoData(page);
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

    await expectClickPath(page, page.getByRole("link", { name: "Start free Silver trial" }), "/auth/sign-up");
    await expectClickPath(page, page.locator("main").getByRole("link", { name: "Sign in" }), "/auth/sign-in");
  });

  test("photo setup feature card remains present without a temporary card link", async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    const photoSetupCard = page
      .locator('[data-smoke="public-feature-cards"]')
      .getByRole("article")
      .filter({ hasText: "Photo-ready uploads" });
    await expect(photoSetupCard).toBeVisible();
    await expect(photoSetupCard).toContainText("Use label evidence and clean light-box photos");
    await expect(photoSetupCard.getByRole("link")).toHaveCount(0);
  });

  test("signup shows Silver trial and phone privacy defaults", async ({ page }) => {
    await page.goto(`${baseUrl}/auth/sign-up`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Start your 45-day Silver trial" })).toBeVisible();
    await expect(page.getByText("Start with a 45-day Silver trial")).toBeVisible();
    await expect(page.getByText("Marketing texts are optional.")).toBeVisible();
    await expect(page.getByText("Not sold.")).toBeVisible();
    await expect(page.getByText("I acknowledge the Sparkle Finder privacy terms")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Text me optional promotional messages/ })).not.toBeChecked();
  });

  test("account route prompts anonymous visitors and Silver preview can access account and Silver pages", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${baseUrl}/account`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sign in to manage your Sparkle Finder account")).toBeVisible();
    await expect(page.getByText("Silver trial details")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/auth/sign-up");

    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /Preview Sparkle Mama/ }).click();
    await expect(page).toHaveURL(`${baseUrl}/`);
    await expect(page.getByText("Today across Sparkle Suite")).toBeVisible();
    await expect(page.getByText("Your Collector Space")).toBeVisible();

    await page.goto(`${baseUrl}/account`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Sparkle Finder account", exact: true })).toBeVisible();
    await expect(page.getByText(/Your\s+45-day Silver trial\s+is active/)).toBeVisible();
    await expect(page.getByText(/Trial ends\s+June 10, 2026/)).toBeVisible();
    await expect(page.getByText("Phone is used for account identification")).toBeVisible();
    await expect(page.getByText("We do not sell your phone number.")).toBeVisible();
    await expect(page.getByText("Marketing texts are optional and separate from account/security notices.")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Optional promotional SMS/ })).not.toBeChecked();

    await page.goto(`${baseUrl}/silver`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sparkle Mama's Sparkle Showcase")).toBeVisible();
    await expect(page.getByText("Local fixture mode")).toBeVisible();
  });

  test("hub routes still gate anonymous visitors", async ({ page }) => {
    await page.context().clearCookies();

    for (const path of ["/dashboard", "/library", "/live-shows", "/rep-boards", "/silver"]) {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Sign in to open Sparkle Finder")).toBeVisible();
      await expect(page.getByText("Create a free Sparkle Finder account to open this tool.")).toBeVisible();
      await expect(page.getByRole("link", { name: "Start free Silver trial" })).toHaveAttribute("href", "/auth/sign-up");
      await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/sign-in");
    }
  });

  test("auth preview paths open the customer homepage and gated hub routes", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sign in to open Sparkle Finder")).toBeVisible();
    await expectNoGuardrailCopy(page);
    await expectNoExampleLinksOnCurrentPage(page);

    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`${baseUrl}/auth/sign-in`);
    await expect(page.getByRole("link", { name: "Continue as Guest" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Continue as Marlena/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Preview Sparkle Mama/ })).toBeVisible();

    await page.getByRole("link", { name: /Continue as Marlena/ }).click();
    await expect(page).toHaveURL(`${baseUrl}/`);
    await expect(page.getByText("Today across Sparkle Suite")).toBeVisible();

    await page.goto(`${baseUrl}/silver`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Marlena's Sparkle Showcase")).toBeVisible();
    await expect(page.getByText("Silver preview is required to save profile updates.")).toBeVisible();

    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /Preview Sparkle Mama/ }).click();
    await expect(page).toHaveURL(`${baseUrl}/`);
    await expect(page.getByText("Your Collector Space")).toBeVisible();
    await page.goto(`${baseUrl}/silver`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sparkle Mama's Sparkle Showcase")).toBeVisible();

    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Continue as Guest" }).click();
    await expect(page).toHaveURL(`${baseUrl}/`);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Sign in to open Sparkle Finder")).toBeVisible();
    await expect(page.getByText("Create a free Sparkle Finder account to open this tool.")).toBeVisible();
  });

  test("Silver library item detail exposes bounded Nic-Nac and local rep-board paths", async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "sparkle_finder_auth_mode",
        value: "silver",
        url: baseUrl,
      },
    ]);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(`${baseUrl}/`);
    await expect(page.getByText("Your Collector Space")).toBeVisible();

    await page.goto(`${baseUrl}/library/jewel-rainbow-crown-ring`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Rainbow Crown Ring").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nic-Nac" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Check saved pieces" })).toBeVisible();
    await expect(page.getByText("Exact item", { exact: true }).first()).toBeVisible();
    await expectNoGuardrailCopy(page);
    await expectNoExampleLinksOnCurrentPage(page);

    await page.getByRole("link", { name: "Open rep board path" }).first().click();
    await expect(page).toHaveURL(`${baseUrl}/rep-boards?listing=rainbow-crown`);
    await expect(page.getByText("Rep Trade Boards / Dance Floors")).toBeVisible();
    await expectNoExampleLinksOnCurrentPage(page);
  });

  test("Silver API-backed item detail exposes Sparkle Suite rep site link when configured", async ({ page }) => {
    const apiItemId = process.env.SPARKLE_FINDER_SMOKE_API_ITEM_ID;

    test.skip(!apiItemId, "Set SPARKLE_FINDER_SMOKE_API_ITEM_ID to smoke-test a live API-backed item detail page.");

    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "sparkle_finder_auth_mode",
        value: "silver",
        url: baseUrl,
      },
    ]);

    await page.goto(`${baseUrl}/library/${apiItemId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Nic-Nac" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Check saved pieces" })).toBeVisible();
    const repSiteLink = page.getByRole("link", { name: "Visit Rep Site" }).first();
    await expect(repSiteLink).toBeVisible();
    await expect(repSiteLink).toHaveAttribute(
      "href",
      new RegExp(`^${escapeRegExp(sparkleSuiteFinderBaseUrl)}/`),
    );
    await expect(page.getByRole("link", { name: "Open rep board path" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Open rep profile" })).toHaveCount(0);
    await expectNoGuardrailCopy(page);
  });

  test("Silver live calendar exposes Sparkle Suite rep site links when configured", async ({ page }) => {
    test.skip(
      process.env.SPARKLE_FINDER_SMOKE_EXPECT_LIVE_SHOWS !== "true",
      "Set SPARKLE_FINDER_SMOKE_EXPECT_LIVE_SHOWS=true when the Sparkle Suite live-shows endpoint is deployed.",
    );

    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "sparkle_finder_auth_mode",
        value: "silver",
        url: baseUrl,
      },
    ]);

    await page.goto(`${baseUrl}/live-shows`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Master Live Calendar")).toBeVisible();
    await expect(page.getByRole("link", { name: "Visit Rep Site" }).first()).toBeVisible();
    await expect(page.getByText("Preview calendar data")).toHaveCount(0);
    await expectNoGuardrailCopy(page);
  });
});

async function expectNoGuardrailCopy(page: Page) {
  const visibleCopy = await page.locator("body").innerText();
  expect(findSparkleFinderCopyViolations(visibleCopy)).toEqual([]);
}

async function expectPrimarySectionsAreVisible(page: Page) {
  for (const selector of [
    "nav",
    "public-landing",
    "public-hero",
    "public-feature-cards",
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

async function expectNoPublicHomepageDemoData(page: Page) {
  const html = await page.content();

  expect(html).not.toContain("Rainbow Crown Ring");
  expect(html).not.toContain("Celestial Lights Preview");
  expect(html).not.toContain("Sierra Sparkle Studio");
  expect(html).not.toContain("Add to collection");
  expect(html).not.toContain("Ask Nic-Nac");
}

async function expectReadableControls(page: Page) {
  const navLabelsFit = await page.locator('[data-smoke="nav"] a').evaluateAll((links) =>
    links.every((link) => link.scrollWidth <= link.clientWidth + 1),
  );
  expect(navLabelsFit, "nav labels should not be clipped inside links").toBe(true);

  const primaryColors = await page.getByRole("link", { name: "Start free Silver trial" }).evaluate((element) => {
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
  const hero = page.locator('[data-smoke="public-hero"]');
  const featureCards = page.locator('[data-smoke="public-feature-cards"]');

  await expectNoOverlap(nav, hero, "nav", "public hero");
  await expectNoOverlap(hero, featureCards, "public hero", "feature cards");
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
