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
  await dialog.getByLabel("Name", { exact: true }).fill("Odaq");
  await dialog.getByLabel("Bundle ID").fill("com.example.odaq");
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

  await page.getByLabel("Title", { exact: true }).fill("Focus with a *cat*");
  await expect(page.getByText("Saved")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Focus with a *cat*");

  await page.goto("/");
  await expect(page.getByRole("list", { name: "Apps" }).getByText("Odaq", { exact: true })).toBeVisible();
});

test("shows validation errors", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New app" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New app" });
  await dialog.getByLabel("Name", { exact: true }).fill("Nefo");
  await dialog.getByLabel("Bundle ID").fill("nefo");
  await dialog.getByRole("button", { name: "Create and open editor" }).click();
  await expect(dialog.getByText("Use reverse DNS, like com.example.app")).toBeVisible();
});

test("edits metadata and imports an EAS store config", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New app" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New app" });
  await dialog.getByLabel("Name", { exact: true }).fill("Kertik");
  await dialog.getByLabel("Bundle ID").fill("com.example.kertik");
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
        "en-US": { title: "Kertik: Habit Tracker", keywords: ["habit", "tally"] },
        tr: { title: "Kertik: Alışkanlık Takibi", subtitle: "Çentik at, seriyi koru" },
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
  await expect(page.getByLabel("App name")).toHaveValue("Kertik: Habit Tracker");

  await page.getByRole("button", { name: "Turkish" }).click();
  await expect(page.getByLabel("Subtitle")).toHaveValue("Çentik at, seriyi koru");

  await page.reload();
  await page.getByRole("button", { name: "Turkish" }).click();
  await expect(page.getByLabel("App name")).toHaveValue("Kertik: Alışkanlık Takibi");
});
