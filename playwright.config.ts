import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/fake-asc.mjs",
      url: "http://127.0.0.1:3199/__state",
      env: { PORT: "3199" },
      reuseExistingServer: false,
    },
    {
      command: `rm -rf .e2e-data && npm run start -- -p ${port}`,
      url: `http://127.0.0.1:${port}/api/health`,
      env: { FRAMELANE_DATA_DIR: ".e2e-data", FRAMELANE_ASC_URL: "http://127.0.0.1:3199" },
      reuseExistingServer: false,
    },
  ],
});
