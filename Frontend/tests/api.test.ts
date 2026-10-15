import { describe, expect, it } from "vitest";
import { api, get } from "../src/lib/api/client";
import { createBooking } from "../src/features/booking/api";

describe("public HTTP contracts", () => {
  it("unwraps items/pagination without inventing a Laravel resource envelope", async () => {
    const payload = {
      items: [],
      pagination: {
        currentPage: 1,
        perPage: 9,
        lastPage: 1,
        total: 0,
        from: null,
        to: null,
      },
    };
    const original = api.defaults.adapter;
    api.defaults.adapter = async (config) => {
      expect(config.url).toBe("/cars");
      expect(config.params).toEqual({ category: "suv", sort: "price_asc" });
      expect(config.headers.has("Authorization")).toBe(false);
      return {
        data: { success: true, message: "", errors: [], data: payload },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    try {
      expect(
        await get("/cars", { category: "suv", sort: "price_asc" }),
      ).toEqual(payload);
    } finally {
      api.defaults.adapter = original;
    }
  });
  it("posts a car slug and numeric location identifier and uses the real receipt", async () => {
    const original = api.defaults.adapter;
    const receipt = {
      bookingReference: "server-reference",
      status: "pending",
      estimatedTotal: "250.00",
      currency: "USD",
    };
    api.defaults.adapter = async (config) => {
      const body = JSON.parse(config.data);
      expect(config.url).toBe("/booking-requests");
      expect(body.car_slug).toBe("test-coupe");
      expect(body.pickup_location_id).toBe(2);
      expect(body).not.toHaveProperty("car_id");
      expect(config.headers.has("Authorization")).toBe(false);
      return {
        data: { success: true, data: receipt },
        status: 201,
        statusText: "Created",
        headers: {},
        config,
      };
    };
    try {
      expect(
        await createBooking({
          car_slug: "test-coupe",
          pickup_location_id: 2,
          customer_name: "Test",
          customer_phone: "+12025550123",
          pickup_at: "2030-01-10T10:00:00Z",
          return_at: "2030-01-12T10:00:00Z",
        }),
      ).toEqual(receipt);
    } finally {
      api.defaults.adapter = original;
    }
  });
});
