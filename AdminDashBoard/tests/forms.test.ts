import { describe, expect, it } from "vitest";
import { bookingSchema, carSchema } from "@/lib/validations";
import { overlaps, toApiDate, validActions } from "@/lib/format";
import type { Booking } from "@/types/api";
const tomorrow = new Date(Date.now() + 86400000);
const later = new Date(Date.now() + 2 * 86400000);
const booking = {
  car_slug: "toyota-corolla-01",
  customer_name: "Maya Haddad",
  customer_phone: "+963 944 123 456",
  customer_email: "",
  pickup_location_id: "1",
  pickup_at: tomorrow.toISOString(),
  return_at: later.toISOString(),
  notes: "",
  status: "pending",
};
describe("form and status rules", () => {
  it("rejects inverted booking dates", () => {
    expect(
      bookingSchema.safeParse({
        ...booking,
        return_at: new Date(Date.now() + 1000).toISOString(),
      }).success,
    ).toBe(false);
  });
  it("accepts an international guest phone and a valid rental", () => {
    expect(bookingSchema.safeParse(booking).success).toBe(true);
  });
  it("rejects an invalid daily price before submit", () => {
    expect(
      carSchema.safeParse({
        brand_id: "1",
        category_id: "1",
        location_id: "1",
        inventory_code: "TOY-001",
        model: "Corolla",
        year: 2024,
        price_per_day: "0",
        currency: "USD",
        transmission: "automatic",
        fuel_type: "petrol",
        seats: 5,
        luggage_count: 2,
        description: "",
        operational_status: "active",
        is_published: true,
        is_featured: false,
      }).success,
    ).toBe(false);
  });
  it("sends timezone-aware timestamps in Laravel format without milliseconds", () => {
    expect(toApiDate("2030-06-01T10:00")).toMatch(/^2030-06-01T\d\d:\d\d:00Z$/);
  });
  it("treats adjacent rental intervals as non-overlapping", () => {
    expect(
      overlaps(
        "2030-01-01T10:00:00Z",
        "2030-01-02T10:00:00Z",
        new Date("2030-01-02T10:00:00Z"),
        new Date("2030-01-03T10:00:00Z"),
      ),
    ).toBe(false);
  });
  it("shows only allowed actions, including time-gated completion", () => {
    const base = {
      status: "pending",
      pickupAt: tomorrow.toISOString(),
      returnAt: later.toISOString(),
      car: { operationalStatus: "active", archivedAt: null },
      pickupLocation: { isActive: true },
    } as Booking;
    expect(validActions(base)).toEqual(["confirmed", "rejected", "cancelled"]);
    expect(validActions({ ...base, status: "confirmed" })).toEqual([
      "cancelled",
    ]);
    expect(
      validActions({
        ...base,
        status: "confirmed",
        returnAt: "2020-01-01T00:00:00Z",
      }),
    ).toEqual(["cancelled", "completed"]);
    expect(validActions({ ...base, status: "rejected" })).toEqual([]);
  });
});
