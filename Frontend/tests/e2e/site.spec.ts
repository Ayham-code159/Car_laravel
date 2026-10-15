import { test, expect } from "@playwright/test";
import { car, envelope, mockCatalog, receipt } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
});
test("home, calendar, human-readable search, URL state, sorting and pagination", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Drive beyond",
  );
  await expect(page.locator(".car-card")).toHaveCount(1);
  await page.getByLabel("Pickup location").selectOption("Test City Branch");
  await page.getByRole("button", { name: "Open pickup calendar" }).click();
  await expect(page.locator(".rdp-root")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Find my drive" }).click();
  await expect(page).toHaveURL(/\/cars\?/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("location")).toBe("Test City Branch");
  expect(params.get("pickup_at")).toMatch(/T\d{2}:\d{2}:00Z$/);
  expect(params.has("id")).toBe(false);
  await page.getByLabel("Sort vehicles").selectOption("price_asc");
  await expect(page).toHaveURL(/sort=price_asc/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(page.getByLabel("Sort vehicles")).toHaveValue("price_asc");
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Sort vehicles")).toHaveValue("price_asc");
});
test("gallery keyboard control and guest request use real response fields", async ({
  page,
}) => {
  let submitted = 0;
  let releaseResponse: () => void = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("**/api/v1/booking-requests", async (route) => {
    submitted++;
    await responseGate;
    await route.fulfill({ status: 201, json: envelope(receipt) });
  });
  await page.goto(`/cars/${car.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Grand Tourer",
  );
  await page.getByRole("button", { name: "Show photograph 2" }).click();
  await expect(
    page.getByRole("button", { name: "Show photograph 2" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("button", { name: "Show photograph 1" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await page.getByLabel("Full name").fill("Browser Test");
  await page.getByLabel("Phone number").fill("+1 (202) 555-0123");
  const request = page.waitForRequest(
    (req) => req.method() === "POST" && req.url().includes("/booking-requests"),
  );
  await page.getByRole("button", { name: "Send rental request" }).click();
  const body = (await request).postDataJSON();
  expect(body.car_slug).toBe(car.slug);
  expect(body.pickup_location_id).toBe(2);
  expect(body.pickup_at).toMatch(/:00Z$/);
  expect(body.customer_email).toBeNull();
  await expect(
    page.getByRole("button", { name: "Send rental request" }),
  ).toBeDisabled();
  expect(submitted).toBe(1);
  releaseResponse();
  await expect(
    page.getByText(receipt.bookingReference, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pending confirmation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("USD 250.20", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send rental request" }),
  ).toHaveCount(0);
});
test("invalid dates never create requests, and server validation is displayed", async ({
  page,
}) => {
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST") posts++;
  });
  await page.route("**/booking-requests", (route) =>
    route.fulfill({
      status: 422,
      json: {
        success: false,
        message: "Validation failed.",
        errors: ["customer_phone: Please provide a reachable phone number."],
        data: null,
      },
    }),
  );
  await page.goto(`/cars/${car.slug}`);
  await page.getByLabel("Return date", { exact: true }).fill("2020-01-01");
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await expect(page.getByText("Return must be after pickup.")).toBeVisible();
  expect(posts).toBe(0);
  const pickup = await page
    .getByLabel("Pickup date", { exact: true })
    .inputValue();
  await page.getByLabel("Return date", { exact: true }).fill(pickup);
  await page.getByLabel("Return time", { exact: true }).fill("18:00");
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await page.getByLabel("Full name").fill("Test");
  await page.getByLabel("Phone number").fill("+12025550123");
  await page.getByRole("button", { name: "Send rental request" }).click();
  await expect(
    page.getByText("Please provide a reachable phone number.", { exact: true }),
  ).toBeVisible();
});
test("availability conflict preserves details and returns to rental dates", async ({
  page,
}) => {
  await page.route("**/booking-requests", (route) =>
    route.fulfill({
      status: 409,
      json: {
        success: false,
        message: "The vehicle is unavailable for the requested period.",
        errors: [],
        data: null,
      },
    }),
  );
  await page.goto(`/cars/${car.slug}`);
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await page.getByLabel("Full name").fill("Test");
  await page.getByLabel("Phone number").fill("+12025550123");
  await page.getByRole("button", { name: "Send rental request" }).click();
  await expect(page.getByText("These dates aren’t available.")).toBeVisible();
  await expect(page.getByLabel("Pickup date", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Test");
});
test("empty results and service failure do not show fabricated cars", async ({
  page,
}) => {
  await page.goto("/cars?search=missing");
  await expect(page.getByText("A different journey awaits.")).toBeVisible();
  await expect(page.locator(".car-card")).toHaveCount(0);
  await page.route("**/api/v1/cars?*", (route) =>
    route.fulfill({
      status: 503,
      json: { success: false, message: "Unavailable", errors: [], data: null },
    }),
  );
  await page.goto("/cars");
  await expect(
    page.getByText(
      "The rental service is temporarily unavailable. Please try again shortly.",
    ),
  ).toBeVisible();
  await expect(page.locator(".car-card")).toHaveCount(0);
});
test("mobile menu focus, filter drawer, deep links and no overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.goto("/cars");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Category", { exact: true })
    .selectOption("luxury");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply filters" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/category=luxury/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".car-image-link").click();
  await expect(page).toHaveURL(new RegExp(car.slug));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/detail-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Back to the collection" }).click();
  await expect(page).toHaveURL(/\/cars\?category=luxury/);
  await page.goto("/#how-it-works");
  await expect(page.locator("#how-it-works")).toBeInViewport();
});
test("missing photos fall back and an unavailable car shows a useful error", async ({
  page,
}) => {
  await page.route("**/api/v1/cars/test-grand-tourer", (route) =>
    route.fulfill({
      json: envelope({ ...car, primaryImageUrl: null, images: [] }),
    }),
  );
  await page.goto(`/cars/${car.slug}`);
  await expect(
    page.getByRole("img", { name: /image unavailable/ }),
  ).toBeVisible();
  await page.route("**/api/v1/cars/not-a-car", (route) =>
    route.fulfill({
      status: 404,
      json: {
        success: false,
        message: "Resource not found.",
        errors: [],
        data: null,
      },
    }),
  );
  await page.goto("/cars/not-a-car");
  await expect(
    page.getByText("This vehicle has left the collection."),
  ).toBeVisible();
});
