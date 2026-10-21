import { expect, test } from "@playwright/test";

// A tiny valid PNG, so the test does not depend on files outside the repo.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAWCAIAAAB2RJoKAAAAFUlEQVR4nGNwaDiABzGMSo9KDw5pAEBjShDqFm/1AAAAAElFTkSuQmCC",
  "base64",
);

test("creates an app, adds a screenshot and captions it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Add your first app")).toBeVisible();

  await page.getByRole("button", { name: "New app" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New app" });
  await dialog.getByLabel("Name", { exact: true }).fill("Daybook");
  await dialog.getByLabel("Bundle ID").fill("com.example.daybook");
  await dialog.getByRole("button", { name: "Create and open editor" }).click();

  await expect(page).toHaveURL(/\/apps\//);
  await expect(page.getByText("Add your screenshots")).toBeVisible();

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "focus.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByRole("status")).toHaveText("1 frame added");
  await expect(page.getByText("Frame 1 of 1")).toBeVisible();

  await page.getByLabel("Title", { exact: true }).fill("Write a *little*");
  await expect(page.getByText("Saved")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Write a *little*");

  await page.goto("/");
  await expect(page.getByRole("list", { name: "Apps" }).getByText("Daybook", { exact: true })).toBeVisible();
});

test("shows validation errors", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New app" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New app" });
  await dialog.getByLabel("Name", { exact: true }).fill("Tidepool");
  await dialog.getByLabel("Bundle ID").fill("tidepool");
  await dialog.getByRole("button", { name: "Create and open editor" }).click();
  await expect(dialog.getByText("Use reverse DNS, like com.example.app")).toBeVisible();
});

test("edits metadata and imports an EAS store config", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New app" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New app" });
  await dialog.getByLabel("Name", { exact: true }).fill("Tally");
  await dialog.getByLabel("Bundle ID").fill("com.example.tally");
  await dialog.getByRole("button", { name: "Create and open editor" }).click();
  await expect(page).toHaveURL(/\/apps\/[^/]+$/);

  await page.getByRole("link", { name: "Metadata" }).click();
  await expect(page.getByRole("heading", { name: "English (U.S.)" })).toBeVisible();

  await page.getByLabel("Keywords", { exact: true }).fill("habit, streak, habit, tracker");
  await expect(page.getByText("Removing spaces and duplicates frees")).toBeVisible();
  await page.getByRole("button", { name: "Tidy up" }).click();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue("habit,streak,tracker");

  const config = {
    configVersion: 0,
    apple: {
      info: {
        "en-US": { title: "Tally: Habit Tracker", keywords: ["habit", "tally"] },
        tr: { title: "Tally: Alışkanlık Takibi", subtitle: "Her gün bir çizgi" },
        xx: { title: "Unknown" },
      },
    },
  };
  await page.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: "store.config.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(config)),
  });
  await expect(page.getByRole("status")).toHaveText("Imported 2 languages, skipped xx");
  await expect(page.getByLabel("App name")).toHaveValue("Tally: Habit Tracker");

  await page.getByRole("button", { name: "Turkish" }).click();
  await expect(page.getByLabel("Subtitle")).toHaveValue("Her gün bir çizgi");

  await page.reload();
  await page.getByRole("button", { name: "Turkish" }).click();
  await expect(page.getByLabel("App name")).toHaveValue("Tally: Alışkanlık Takibi");
});
