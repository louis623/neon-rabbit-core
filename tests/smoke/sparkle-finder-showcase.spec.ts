import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

const baseUrl = process.env.SPARKLE_FINDER_BASE_URL ?? "http://127.0.0.1:4310";
const screenshotDir = process.env.SPARKLE_FINDER_SCREENSHOT_DIR ?? "verification/sparkle-finder";

test.describe("Sparkle Showcase smoke", () => {
  test("public Sparkle Showcase renders shareable collection and conversation surfaces", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(`${baseUrl}/showcase/sparkle-mama`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-smoke="sparkle-showcase"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sparkle Mama's Sparkle Showcase" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Rarest of Reveals" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Showcase Collections" })).toBeVisible();
    await expect(page.getByText("Never Leaving")).toBeVisible();
    await expect(page.getByText("Showcase Conversation")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in to follow" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Share Showcase" })).toHaveAttribute(
      "href",
      "/showcase/sparkle-mama",
    );
    await expectNoGuardrailCopy(page);

    mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      fullPage: true,
      path: join(screenshotDir, "sparkle-showcase-public-desktop.png"),
    });
  });

  test("Reveal Spotlight keeps the rare-piece story and rep-first find path visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}/showcase/sparkle-mama/pieces/jewel-rainbow-crown-ring`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator('[data-smoke="reveal-spotlight"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rainbow Crown Ring" })).toBeVisible();
    await expect(page.getByText("Reveal Spotlight", { exact: true })).toBeVisible();
    await expect(page.getByText("Diamond Reveal", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rep leads" })).toBeVisible();
    await expect(page.getByText("That reveal was unreal.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Share Reveal Spotlight" })).toHaveAttribute(
      "href",
      "/showcase/sparkle-mama/pieces/jewel-rainbow-crown-ring",
    );
    await expectNoGuardrailCopy(page);
  });

  test("Showcase Collection page uses the customer grouping language", async ({ page }) => {
    await page.goto(`${baseUrl}/showcase/sparkle-mama/showcase-collections/never-leaving`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("link", { name: "Back to Sparkle Showcase" })).toHaveAttribute(
      "href",
      "/showcase/sparkle-mama",
    );
    await expect(page.getByText("Showcase Collection", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Never Leaving", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Never Leaving Showcase Collection" })).toBeVisible();
    await expectNoGuardrailCopy(page);
  });

  test("Silver preview exposes owner Sparkle Showcase controls without trading language", async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "sparkle_finder_auth_mode",
        value: "silver",
        url: baseUrl,
      },
    ]);
    await page.goto(`${baseUrl}/silver`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-smoke="showcase-getting-started"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Build your Sparkle Showcase in four simple steps." })).toBeVisible();
    await expect(page.getByText("Add pieces you own.")).toBeVisible();
    await expect(page.getByText("Mark pieces you are looking for.")).toBeVisible();
    await expect(page.getByText("Feature your rarest reveals.")).toBeVisible();
    await expect(page.getByText("Share your Sparkle Showcase.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Building My Sparkle Showcase" })).toHaveAttribute(
      "href",
      "#add-to-sparkle-showcase",
    );
    await expect(page.locator('[data-smoke="showcase-add-pieces"]')).toBeVisible();
    await expect(page.locator('[data-smoke="showcase-manager"]')).toBeVisible();
    await expect(page.getByText("Owner tools")).toBeVisible();
    await expect(page.getByText("Sparkle Showcase preview ready.")).toBeVisible();
    const profileCard = page.locator('[data-smoke="profile-editor-card"]');
    const profileCardBox = await profileCard.boundingBox();

    expect(profileCardBox).not.toBeNull();
    expect(profileCardBox?.height ?? 0).toBeLessThan(900);
    await expect(page.locator(".sparkle-global-save-indicator")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save profile" })).toBeVisible();
    await expect(page.getByText("Make your changes, then save your profile.")).toBeVisible();
    const displayNameInput = page.getByLabel("Display name");

    await expect(displayNameInput).toBeEditable();
    await displayNameInput.fill("Sparkle Preview");
    await expect(displayNameInput).toHaveValue("Sparkle Preview");
    const tiktokInput = page.getByLabel("TikTok handle");
    const collectorNotesInput = page.getByLabel("Collector notes");

    await tiktokInput.fill("@sparkle_preview");
    await collectorNotesInput.fill("Testing that profile fields save only after clicking the button.");
    await expect(tiktokInput).toHaveValue("@sparkle_preview");
    await expect(collectorNotesInput).toHaveValue("Testing that profile fields save only after clicking the button.");
    await expect(page.getByText("Unsaved profile changes.")).toBeVisible();
    const profilePhotoInput = page.locator('input[name="profilePhoto"][type="file"]');

    await expect(profilePhotoInput).toHaveCount(1);
    await expect(page.getByText("Upload photo")).toBeVisible();
    await expect(page.locator('input[name="photoUrl"][type="hidden"]')).toHaveCount(1);
    await expect(page.locator('input[name="profilePhotoDataUrl"][type="hidden"]')).toHaveCount(1);
    await expect(page.getByText("Profile photo URL")).toHaveCount(0);
    await profilePhotoInput.setInputFiles(join(process.cwd(), "brand-assets", "sparkle-finder-s-logo-256.png"));
    await expect(page.getByText("sparkle-finder-s-logo-256.png")).toBeVisible();
    await expect(page.getByText("Drag photo to center, then save your profile.")).toBeVisible();
    await expect(page.getByLabel("Drag profile photo to center")).toBeVisible();
    await expect(page.locator('input[name="profilePhotoDataUrl"]')).toHaveValue(/^data:image\/jpeg;base64,/);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as looking for" }).first()).toBeVisible();
    await expect(page.getByText("Feature in The Rarest of Reveals").first()).toBeVisible();
    await expect(page.getByText("Need a missing piece?")).toBeVisible();
    await expect(page.locator('[data-smoke="showcase-studio-intake"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Showcase Studio" })).toBeVisible();
    await expect(page.getByText("Original Bomb Party label required")).toBeVisible();
    await expect(page.getByText("Nic-Nac checks every image")).toBeVisible();
    await expect(page.getByLabel("Original label photo")).toBeVisible();
    await expect(page.getByLabel("Light-box jewelry photo")).toBeVisible();
    await expect(page.getByLabel("Item number")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit to Nic-Nac review" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Light-box setup guide" })).toHaveAttribute(
      "href",
      "/photo-setup",
    );
    await expectNoGuardrailCopy(page);

    await page.getByRole("button", { name: "Mark as looking for" }).first().click();
    await expect(page.getByText("Looking-for piece added to your Sparkle Showcase preview.")).toBeVisible();
  });
});

async function expectNoGuardrailCopy(page: Page) {
  const visibleCopy = await page.locator("body").innerText();

  expect(findSparkleFinderCopyViolations(visibleCopy)).toEqual([]);
}
