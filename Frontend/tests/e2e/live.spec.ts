import { test, expect } from "@playwright/test";

// Explicit opt-in project: uses the existing Laravel catalog, and never writes bookings.
test("live Laravel catalog, filters, pagination, media and slug details", async ({
  page,
  request,
}) => {
  const base = "http://127.0.0.1:8000/api/v1";
  const response = await request.get(`${base}/cars?per_page=1`);
  expect(response.ok()).toBe(true);
  const listing = (await response.json()).data;
  expect(listing.items.length).toBeGreaterThan(0);
  const car = listing.items[0];
  const catalogs = await Promise.all(
    ["brands", "categories", "locations"].map(async (name) => {
      const r = await request.get(`${base}/${name}`);
      expect(r.ok()).toBe(true);
      return (await r.json()).data;
    }),
  );
  expect(catalogs.every((items) => items.length > 0)).toBe(true);
  const filtered = await request.get(`${base}/cars`, {
    params: {
      brand: car.brand.slug,
      category: car.category.slug,
      sort: "price_asc",
      per_page: 1,
    },
  });
  expect((await filtered.json()).data.items[0].brand.slug).toBe(car.brand.slug);
  const second = await request.get(`${base}/cars?per_page=1&page=2`);
  expect((await second.json()).data.pagination.currentPage).toBe(2);
  await page.goto("/");
  await expect(page.locator(".car-card").first()).toBeVisible();
  await page.locator(".featured-section").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll<HTMLImageElement>(".car-image-link img"),
    ].every((img) => img.complete && img.naturalWidth > 0),
  );
  await page.screenshot({
    path: "test-results/live-home-desktop.png",
    fullPage: true,
  });
  await page.goto(`/cars/${car.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    car.model,
  );
  await expect(page.locator(".gallery-main > img")).toBeVisible();
  await page.waitForFunction(() => {
    const img = document.querySelector<HTMLImageElement>(".gallery-main > img");
    return !!img?.complete && img.naturalWidth > 0;
  });
  await page.screenshot({
    path: "test-results/live-detail-desktop.png",
    fullPage: true,
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `detail width ${width}`,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".featured-section").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll<HTMLImageElement>(".car-image-link img"),
    ].every((img) => img.complete && img.naturalWidth > 0),
  );
  await page.screenshot({
    path: "test-results/live-home-mobile.png",
    fullPage: true,
  });
  await page.goto("/cars");
  await expect(page.locator(".car-card")).toHaveCount(9);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `fleet width ${width}`,
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/live-fleet-desktop.png",
    fullPage: true,
  });
});
