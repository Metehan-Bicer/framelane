import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const FAKE_ASC = "http://127.0.0.1:3199";
const PNG = readFileSync(path.join(__dirname, "fixtures/screen.png"));
const p8 = generateKeyPairSync("ec", { namedCurve: "P-256" })
  .privateKey.export({ type: "pkcs8", format: "pem" })
  .toString();

test("connects to App Store Connect and publishes text and screenshots", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New app" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New app" });
  await dialog.getByLabel("Name", { exact: true }).fill("Nefo");
  await dialog.getByLabel("Bundle ID").fill("com.example.nefo");
  await dialog.getByRole("button", { name: "Create and open editor" }).click();
  await expect(page.getByText("Add your screenshots")).toBeVisible();

  await page.locator('input[type="file"]').first().setInputFiles({ name: "today.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Frame 1 of 1")).toBeVisible();

  await page.getByRole("link", { name: "Metadata" }).click();
  await page.getByLabel("App name").fill("Nefo: Quit Smoking");
  await page.getByLabel("Description", { exact: true }).fill("Count the days since your last cigarette.");
  await page.getByLabel("Keywords", { exact: true }).fill("quit,smoking");
  await expect(page.getByText("Saved").filter({ visible: true })).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByRole("link", { name: "Publish" }).click();
  await expect(page.getByRole("heading", { name: "Connect App Store Connect" })).toBeVisible();

  const keyFile = { name: "AuthKey_2X9R4HXF34.p8", mimeType: "application/octet-stream", buffer: Buffer.from(p8) };
  const connect = async (keyId: string) => {
    await page.getByLabel("Issuer ID").fill("57246542-96fe-1a63-e053-0824d011072a");
    await page.getByLabel("Key ID").fill(keyId);
    await page.getByLabel("Private key file").setInputFiles(keyFile);
    await page.getByRole("button", { name: "Connect" }).click();
  };

  await connect("short");
  await expect(page.getByText("The Key ID is 10 letters and digits")).toBeVisible();

  await connect("REJECTED00");
  await expect(page.getByText("App Store Connect rejected the key")).toBeVisible();

  await connect("2X9R4HXF34");
  await expect(page.getByText("Connected to App Store Connect")).toBeVisible();
  await expect(page.getByText("Version 1.0")).toBeVisible();
  await expect(page.getByText("New language · 3")).toBeVisible();

  await page.getByRole("button", { name: "Push 3 changes" }).click();
  await expect(page.getByRole("status")).toContainText("en-US ✓");
  await expect(page.getByRole("button", { name: "Up to date" })).toBeVisible();

  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText("1 uploaded")).toBeVisible({ timeout: 15_000 });

  const state = await (await request.get(`${FAKE_ASC}/__state`)).json();
  const versionLoc = Object.values(state.versionLocs)[0] as { attributes: Record<string, string> };
  expect(versionLoc.attributes).toMatchObject({ locale: "en-US", keywords: "quit,smoking" });
  const infoLoc = Object.values(state.infoLocs)[0] as { attributes: Record<string, string> };
  expect(infoLoc.attributes.name).toBe("Nefo: Quit Smoking");
  const set = Object.values(state.sets)[0] as { attributes: { screenshotDisplayType: string }; order: string[] };
  expect(set.attributes.screenshotDisplayType).toBe("APP_IPHONE_67");
  expect(set.order).toHaveLength(1);
  const shot = state.shots[set.order[0]] as { attributes: { fileSize: number; uploaded: boolean; sourceFileChecksum: string } };
  expect(shot.attributes.uploaded).toBe(true);
  expect(shot.attributes.sourceFileChecksum).toMatch(/^[0-9a-f]{32}$/);
  const uploaded = Object.entries(state.uploads as Record<string, number>)
    .filter(([key]) => key.startsWith(set.order[0]))
    .reduce((sum, [, bytes]) => sum + bytes, 0);
  expect(uploaded).toBe(shot.attributes.fileSize);
});
