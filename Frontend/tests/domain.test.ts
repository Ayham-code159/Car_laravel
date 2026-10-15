import { afterEach, describe, expect, it, vi } from "vitest";
import { rentalDays, toApiDate, toLocal } from "../src/lib/utils/dates";
import { estimateTotal } from "../src/lib/utils/money";
import { bookingSchema } from "../src/features/booking/validation";
import {
  readFilters,
  rentalQuery,
  searchSchema,
  updateParams,
} from "../src/features/search/validation";
import { ApiError } from "../src/lib/api/client";

afterEach(() => vi.useRealTimers());
const period = {
  pickup_at: "2030-01-10T10:00:00Z",
  return_at: "2030-01-12T10:00:00Z",
};
const validBooking = {
  customer_name: "Test Customer",
  customer_phone: "+1 (202) 555-0123",
  customer_email: "",
  pickup_location_id: "2",
  notes: "",
  ...period,
};
describe("Laravel rental day and decimal money rules", () => {
  it.each([
    ["2030-01-10T10:00:00Z", "2030-01-10T10:00:01Z", 1],
    ["2030-01-10T10:00:00Z", "2030-01-11T10:00:00Z", 1],
    ["2030-01-10T10:00:00Z", "2030-01-11T10:00:01Z", 2],
    ["2030-01-10T10:00:00+03:00", "2030-01-11T10:00:00+04:00", 1],
    ["2030-01-10T10:00:00+04:00", "2030-01-11T10:00:00+03:00", 2],
    ["bad", "bad", 0],
    ["2030-01-10T10:00:00Z", "2030-01-10T10:00:00Z", 0],
  ])("rounds %s → %s to %s days", (start, end, days) =>
    expect(rentalDays(start, end)).toBe(days),
  );
  it("multiplies exact cents rather than binary fractions", () => {
    expect(estimateTotal("0.10", 3)).toBe("0.30");
    expect(estimateTotal("199.99", 90)).toBe("17999.10");
  });
  it("handles the backend maximum daily price exactly", () =>
    expect(estimateTotal("99999999.99", 90)).toBe("8999999999.10"));
  it("rejects invalid prices and durations", () => {
    expect(estimateTotal("NaN", 3)).toBeNull();
    expect(estimateTotal("25.00", 0)).toBeNull();
  });
  it("sends ISO seconds with a timezone and preserves the instant", () => {
    const result = toApiDate("2030-01-10T10:00:00+03:00");
    expect(result).toBe("2030-01-10T07:00:00Z");
    expect(new Date(toLocal(result)).getTime()).toBe(Date.parse(result));
  });
});
describe("form and URL contracts", () => {
  it("accepts supported guest fields without email", () =>
    expect(bookingSchema.safeParse(validBooking).success).toBe(true));
  it.each(["abc", "1234567", "+1234567890123456", "12345"])(
    "rejects Laravel-incompatible phone %s",
    (phone) =>
      expect(
        bookingSchema.safeParse({ ...validBooking, customer_phone: phone })
          .success,
      ).toBe(false),
  );
  it("rejects pickup in the past", () => {
    vi.useFakeTimers().setSystemTime(new Date("2030-01-11"));
    expect(
      searchSchema.safeParse({ location: "Main branch", ...period }).success,
    ).toBe(false);
  });
  it("rejects return before pickup", () =>
    expect(
      bookingSchema.safeParse({
        ...validBooking,
        return_at: "2030-01-09T10:00:00Z",
      }).success,
    ).toBe(false));
  it("rejects a rental longer than the configured backend limit", () =>
    expect(
      bookingSchema.safeParse({
        ...validBooking,
        return_at: "2031-01-12T10:00:00Z",
      }).success,
    ).toBe(false));
  it("rejects incomplete date filters, invalid sorting, and inverted prices", () => {
    expect(
      readFilters(new URLSearchParams({ pickup_at: period.pickup_at })).success,
    ).toBe(false);
    expect(
      readFilters(new URLSearchParams({ sort: "unimplemented" })).success,
    ).toBe(false);
    expect(
      readFilters(new URLSearchParams({ min_price: "100", max_price: "20" }))
        .success,
    ).toBe(false);
  });
  it("keeps supported filters and strips unknown URL parameters", () => {
    const result = readFilters(
      new URLSearchParams({
        brand: "bmw",
        category: "luxury",
        sort: "price_asc",
        page: "2",
        id: "7",
      }),
    );
    expect(result.success && result.data).toEqual({
      brand: "bmw",
      category: "luxury",
      sort: "price_asc",
      page: 2,
    });
  });
  it("resets pagination when changing a filter and retains rental dates", () => {
    const result = updateParams(
      new URLSearchParams({ ...period, page: "4", category: "suv" }),
      { category: undefined, brand: "bmw" },
    );
    expect(result.has("page")).toBe(false);
    expect(result.has("category")).toBe(false);
    expect(result.get("pickup_at")).toBe(period.pickup_at);
    expect(rentalQuery(result)).not.toContain("brand");
  });
  it("decodes the backend flattened field errors without losing messages", () => {
    const error = new ApiError("Validation failed.", 422, [
      "customer_phone: The phone number is invalid.",
      "return_at: Return must be later.",
    ]);
    expect(error.fieldErrors.customer_phone).toBe(
      "The phone number is invalid.",
    );
    expect(error.status).toBe(422);
  });
});
