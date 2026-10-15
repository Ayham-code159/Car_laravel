import axios from "axios";
import type { ApiEnvelope } from "../../types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public errors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
  get fieldErrors() {
    return Object.fromEntries(
      this.errors
        .filter((e) => e.includes(":"))
        .map((e) => {
          const split = e.indexOf(":");
          return [e.slice(0, split).trim(), e.slice(split + 1).trim()];
        }),
    );
  }
}
export const api = axios.create({
  baseURL: (
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, ""),
  timeout: 20000,
  headers: { Accept: "application/json" },
  withCredentials: false,
});
api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false)
      throw new ApiError(
        response.data.message,
        response.status,
        response.data.errors,
      );
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status || 0;
    const body = error.response?.data as ApiEnvelope<null> | undefined;
    const message =
      status === 0
        ? "We couldn’t connect to the rental service. Please try again shortly."
        : status === 429
          ? "Too many requests. Please wait a moment before trying again."
          : status >= 500
            ? "The rental service is temporarily unavailable. Please try again shortly."
            : body?.message || "We couldn’t complete this request.";
    return Promise.reject(
      new ApiError(
        message,
        status,
        Array.isArray(body?.errors) ? body.errors : [],
      ),
    );
  },
);
export async function get<T>(
  path: string,
  params?: object,
  signal?: AbortSignal,
): Promise<T> {
  const response = await api.get<ApiEnvelope<T>>(path, { params, signal });
  return response.data.data;
}
