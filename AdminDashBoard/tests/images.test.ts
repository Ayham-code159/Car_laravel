import { afterEach, describe, expect, it, vi } from "vitest";
import { validateImages } from "@/features/cars/ImageUploader";
import { carApi } from "@/lib/api/services";
import { client } from "@/lib/api/client";

describe("vehicle image integration", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("rejects invalid MIME types and oversized uploads", async () => {
    await expect(
      validateImages([new File(["x"], "car.gif", { type: "image/gif" })], 0),
    ).rejects.toThrow(/JPEG, PNG or WebP/);
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    await expect(validateImages([huge], 0)).rejects.toThrow(/maximum size/);
  });
  it("checks dimensions of valid image files", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 6100, height: 400, close: vi.fn() }),
    );
    await expect(
      validateImages([new File(["x"], "car.webp", { type: "image/webp" })], 0),
    ).rejects.toThrow(/6000/);
  });
  it("submits Spatie images as multipart images[] for the selected car", async () => {
    const original = client.defaults.adapter;
    const file = new File(["image bytes"], "car.png", { type: "image/png" });
    client.defaults.adapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/admin/cars/7/images");
      expect(config.data).toBeInstanceOf(FormData);
      expect((config.data as FormData).getAll("images[]")).toEqual([file]);
      return {
        config,
        status: 201,
        statusText: "Created",
        headers: {},
        data: {
          success: true,
          message: "Images uploaded.",
          errors: [],
          data: { id: 7 },
        },
      };
    };
    try {
      const result = await carApi.upload(7, [file], () => {});
      expect(result.id).toBe(7);
    } finally {
      client.defaults.adapter = original;
    }
  });
});
