import type { Page } from "@playwright/test";
export const location = {
  id: 2,
  name: "Test City Branch",
  city: "Test City",
  country: "Test Country",
  isActive: true,
};
export const category = { id: 1, name: "Luxury", slug: "luxury" };
export const car = {
  id: 12,
  slug: "test-grand-tourer",
  brand: { id: 3, name: "Test Brand", slug: "test-brand" },
  category,
  location,
  model: "Grand Tourer",
  year: 2025,
  pricePerDay: "125.10",
  currency: "USD",
  transmission: "automatic",
  fuelType: "petrol",
  seats: 4,
  luggageCount: 2,
  isFeatured: true,
  description: "Test-only vehicle for browser verification.",
  primaryImageUrl: "/images/hero-desktop.webp",
  images: [
    {
      id: 1,
      url: "/images/hero-desktop.webp",
      thumbnailUrl: "/images/hero-mobile.webp",
      isPrimary: true,
      order: 1,
    },
    {
      id: 2,
      url: "/images/hero-mobile.webp",
      thumbnailUrl: "/images/hero-mobile.webp",
      isPrimary: false,
      order: 2,
    },
  ],
};
export const receipt = {
  bookingReference: "8c8e5906-4bda-4c02-8a25-77bc63941072",
  status: "pending",
  estimatedTotal: "250.20",
  currency: "USD",
};
export const envelope = (data: unknown) => ({
  success: true,
  message: "Request successful.",
  errors: [],
  data,
});
export async function mockCatalog(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    if (path === "/booking-requests")
      return route.fulfill({ status: 201, json: envelope(receipt) });
    if (path === "/locations")
      return route.fulfill({ json: envelope([location]) });
    if (path === "/brands")
      return route.fulfill({ json: envelope([car.brand]) });
    if (path === "/categories")
      return route.fulfill({ json: envelope([category]) });
    if (path === `/cars/${car.slug}`)
      return route.fulfill({ json: envelope(car) });
    const currentPage = Number(url.searchParams.get("page") || 1);
    const perPage = Number(url.searchParams.get("per_page") || 3);
    const empty = url.searchParams.get("search") === "missing";
    return route.fulfill({
      json: envelope({
        items: empty ? [] : [car],
        pagination: {
          currentPage,
          perPage,
          lastPage: path.includes("featured") ? 1 : 2,
          total: empty ? 0 : 10,
          from: empty ? null : 1,
          to: empty ? null : 1,
        },
      }),
    });
  });
}
