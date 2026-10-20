import { expect, test } from "@playwright/test";

test("adds an app and lists it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No apps yet")).toBeVisible();

  await page.getByLabel("Name", { exact: true }).fill("Odaq");
  await page.getByLabel("Bundle ID").fill("com.example.odaq");
  await page.getByRole("button", { name: "Add app" }).click();

  const list = page.getByRole("list", { name: "Apps" });
  await expect(list.getByText("Odaq", { exact: true })).toBeVisible();
  await expect(list.getByText("com.example.odaq")).toBeVisible();
});

test("shows validation errors", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Name", { exact: true }).fill("Odaq");
  await page.getByLabel("Bundle ID").fill("odaq");
  await page.getByRole("button", { name: "Add app" }).click();
  await expect(page.getByText("Use reverse DNS, like com.example.app")).toBeVisible();
});
