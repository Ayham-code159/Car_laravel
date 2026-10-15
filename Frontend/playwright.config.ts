import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/live.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.platform === "win32" ? "msedge" : undefined,
      },
    },
    {
      name: "live",
      testMatch: "**/live.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.platform === "win32" ? "msedge" : undefined,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
