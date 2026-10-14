import { expect, test } from "@playwright/test";

// All records in this file are test fixtures. The deployed dashboard has no mock API.
test("a protected route sends guests to the real login screen", async ({
  page,
}) => {
  await page.goto("/cars");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});

test("login leads to API-backed overview and navigation works on mobile", async ({
  page,
}) => {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": "http://localhost:5174",
      "access-control-allow-headers":
        "Accept, Authorization, Content-Type, Origin",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    };
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const data = path.endsWith("/admin/login")
      ? {
          accessToken: "test-token",
          tokenType: "Bearer",
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          admin: { id: 1, username: "fleetadmin" },
        }
      : path.endsWith("/admin/me")
        ? { id: 1, username: "fleetadmin" }
        : path.endsWith("/admin/dashboard")
          ? {
              totalCars: 54,
              publishedCars: 52,
              activeCars: 52,
              carsUnderMaintenance: 2,
              pendingBookingRequests: 3,
              confirmedBookings: 2,
              completedBookings: 1,
              recentBookingRequests: [],
            }
          : path.endsWith("/admin/cars")
            ? {
                items: [],
                pagination: {
                  currentPage: 1,
                  perPage: 15,
                  lastPage: 1,
                  total: 0,
                  from: null,
                  to: null,
                },
              }
            : [];
    await route.fulfill({
      status: 200,
      headers,
      json: { success: true, message: "Test fixture.", errors: [], data },
    });
  });
  await page.goto("/login");
  await page.getByPlaceholder("Your username").fill("fleetadmin");
  await page.getByPlaceholder("Enter your password").fill("test-password");
  await page.getByRole("button", { name: /Sign in to dashboard/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("54", { exact: true }).first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Cars" }).click();
  await expect(page).toHaveURL(/\/cars$/);
  await expect(
    page.getByRole("heading", { name: "Your fleet, thoughtfully managed." }),
  ).toBeVisible();
});
