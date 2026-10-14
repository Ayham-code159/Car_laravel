import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: { baseURL: "http://localhost:5174", trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.platform === "win32" ? "msedge" : undefined,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174/login",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
