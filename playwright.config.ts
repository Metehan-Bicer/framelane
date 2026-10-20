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
  webServer: {
    command: `rm -rf .e2e-data && npm run start -- -p ${port}`,
    url: `http://127.0.0.1:${port}/api/health`,
    env: { FRAMELANE_DATA_DIR: ".e2e-data" },
    reuseExistingServer: false,
  },
});
