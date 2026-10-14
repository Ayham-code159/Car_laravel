import axios, { type AxiosRequestConfig } from "axios";
import type { Envelope } from "@/types/api";
export const SESSION_KEY = "aurel.admin.session";
export interface Session {
  token: string;
  expiresAt: string;
}
export function readSession(): Session | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(SESSION_KEY) ?? "null",
    ) as Session | null;
    if (
      value &&
      typeof value.token === "string" &&
      Date.parse(value.expiresAt) > Date.now()
    )
      return value;
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
  }
  return null;
}
export function saveSession(session: Session | null) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}
export function normalizeBaseUrl(value: string) {
  const base = value.trim().replace(/\/+$/, "");
  return base.endsWith("/api/v1")
    ? base
    : `${base.replace(/\/api$/, "")}/api/v1`;
}
export const client = axios.create({
  baseURL: normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  ),
  timeout: 30000,
  headers: { Accept: "application/json" },
});
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public errors: string[] = [],
    public retryAfter?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
client.interceptors.request.use((config) => {
  const session = readSession();
  if (session) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError<Envelope<null>>(error))
      return Promise.reject(
        new ApiError("An unexpected request error occurred."),
      );
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status ?? 0;
    if (
      status === 401 &&
      !error.config?.url?.endsWith("/login") &&
      readSession()
    ) {
      saveSession(null);
      window.dispatchEvent(new Event("aurel:unauthorized"));
    }
    const body = error.response?.data;
    const fallback =
      status === 429
        ? "Too many requests. Please wait before trying again."
        : status === 0
          ? "Unable to reach the API. Check your connection and the Laravel server."
          : "The request could not be completed.";
    return Promise.reject(
      new ApiError(
        body?.message || fallback,
        status,
        Array.isArray(body?.errors) ? body.errors : [],
        error.response?.headers["retry-after"] as string | undefined,
      ),
    );
  },
);
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await client.request<Envelope<T>>(config);
  if (!data.success) throw new ApiError(data.message, 400, data.errors);
  return data.data;
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
