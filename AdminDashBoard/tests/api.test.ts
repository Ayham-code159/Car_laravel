import { afterEach, describe, expect, it, vi } from "vitest";
import {
  client,
  ApiError,
  normalizeBaseUrl,
  readSession,
  request,
  saveSession,
} from "@/lib/api/client";
describe("Laravel API envelope and session", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("keeps exactly one API version suffix", () => {
    expect(normalizeBaseUrl("http://localhost:8000/api/v1/")).toBe(
      "http://localhost:8000/api/v1",
    );
    expect(normalizeBaseUrl("http://localhost:8000")).toBe(
      "http://localhost:8000/api/v1",
    );
  });
  it("unwraps successful data without an extra data layer", async () => {
    const old = client.defaults.adapter;
    client.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: {
        success: true,
        message: "OK",
        errors: [],
        data: { items: [{ id: 5 }], pagination: { total: 1 } },
      },
    });
    try {
      expect(
        await request<{ items: { id: number }[] }>({ url: "/admin/cars" }),
      ).toEqual({ items: [{ id: 5 }], pagination: { total: 1 } });
    } finally {
      client.defaults.adapter = old;
    }
  });
  it("maps validation errors and status", async () => {
    const old = client.defaults.adapter;
    client.defaults.adapter = async (config) =>
      Promise.reject({
        isAxiosError: true,
        config,
        response: {
          status: 422,
          headers: {},
          data: {
            success: false,
            message: "Validation failed.",
            errors: ["model: The model field is required."],
            data: null,
          },
        },
      });
    try {
      await expect(request({ url: "/admin/cars" })).rejects.toMatchObject({
        status: 422,
        message: "Validation failed.",
        errors: ["model: The model field is required."],
      });
    } finally {
      client.defaults.adapter = old;
    }
  });
  it("clears a rejected bearer token and notifies the app", async () => {
    saveSession({
      token: "test-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const listener = vi.fn();
    window.addEventListener("aurel:unauthorized", listener);
    const old = client.defaults.adapter;
    client.defaults.adapter = async (config) =>
      Promise.reject({
        isAxiosError: true,
        config,
        response: {
          status: 401,
          headers: {},
          data: {
            success: false,
            message: "Authentication required.",
            errors: [],
            data: null,
          },
        },
      });
    try {
      await expect(request({ url: "/admin/me" })).rejects.toBeInstanceOf(
        ApiError,
      );
      expect(readSession()).toBeNull();
      expect(listener).toHaveBeenCalledOnce();
    } finally {
      client.defaults.adapter = old;
      window.removeEventListener("aurel:unauthorized", listener);
    }
  });
  it("does not reuse expired session tokens", () => {
    saveSession({ token: "expired", expiresAt: "2020-01-01T00:00:00Z" });
    expect(readSession()).toBeNull();
  });
});
