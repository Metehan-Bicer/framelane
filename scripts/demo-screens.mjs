// Renders the Daybook mock screens in demo/screens.html to 1320 x 2868 PNGs (iPhone 6.9").
// Usage: node scripts/demo-screens.mjs
import path from "node:path";
import { chromium } from "@playwright/test";

const screens = ["today", "entry", "calendar", "insights"];
const langs = { "en-US": "en", tr: "tr" };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
for (const [locale, lang] of Object.entries(langs)) {
  for (const [index, screen] of screens.entries()) {
    await page.goto(`file://${path.resolve("demo/screens.html")}?screen=${screen}&lang=${lang}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `demo/screens/${locale}/${index + 1}-${screen}.png` });
  }
}
await browser.close();
console.log("Wrote demo/screens");
