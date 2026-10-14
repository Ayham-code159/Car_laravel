import { request } from "./client";
import type {
  Admin,
  AuthResult,
  Booking,
  BookingStatus,
  Brand,
  Car,
  Category,
  Dashboard,
  Filters,
  Location,
  Page,
  Block,
} from "@/types/api";
const get = <T>(url: string, params?: Filters, signal?: AbortSignal) =>
  request<T>({ url, params, signal });
export const authApi = {
  login: (data: { username: string; password: string }) =>
    request<AuthResult>({ url: "/admin/login", method: "POST", data }),
  me: (signal?: AbortSignal) => get<Admin>("/admin/me", undefined, signal),
  logout: () => request<null>({ url: "/admin/logout", method: "POST" }),
};
export const catalogApi = {
  brands: (signal?: AbortSignal) => get<Brand[]>("/brands", undefined, signal),
  categories: (signal?: AbortSignal) =>
    get<Category[]>("/admin/categories", undefined, signal),
  locations: (signal?: AbortSignal) =>
    get<Location[]>("/admin/locations", undefined, signal),
  saveCategory: (data: unknown, id?: number) =>
    request<Category>({
      url: `/admin/categories${id ? `/${id}` : ""}`,
      method: id ? "PUT" : "POST",
      data,
    }),
  saveLocation: (data: unknown, id?: number) =>
    request<Location>({
      url: `/admin/locations${id ? `/${id}` : ""}`,
      method: id ? "PUT" : "POST",
      data,
    }),
  remove: (kind: "categories" | "locations", id: number) =>
    request<null>({ url: `/admin/${kind}/${id}`, method: "DELETE" }),
};
export const carApi = {
  list: (params: Filters = {}, signal?: AbortSignal) =>
    get<Page<Car>>("/admin/cars", params, signal),
  detail: (id: number, signal?: AbortSignal) =>
    get<Car>(`/admin/cars/${id}`, undefined, signal),
  save: (data: unknown, id?: number) =>
    request<Car>({
      url: `/admin/cars${id ? `/${id}` : ""}`,
      method: id ? "PUT" : "POST",
      data,
    }),
  archive: (id: number) =>
    request<null>({ url: `/admin/cars/${id}`, method: "DELETE" }),
  change: (
    id: number,
    action: "status" | "publication" | "featured",
    data: unknown,
  ) =>
    request<Car>({ url: `/admin/cars/${id}/${action}`, method: "PATCH", data }),
  upload: (
    id: number,
    files: File[],
    onProgress: (percent: number) => void,
  ) => {
    const data = new FormData();
    files.forEach((file) => data.append("images[]", file));
    return request<Car>({
      url: `/admin/cars/${id}/images`,
      method: "POST",
      data,
      timeout: 120000,
      onUploadProgress: (event) => {
        if (event.total)
          onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },
  deleteImage: (id: number, mediaId: number) =>
    request<unknown>({
      url: `/admin/cars/${id}/images/${mediaId}`,
      method: "DELETE",
    }),
  primaryImage: (id: number, mediaId: number) =>
    request<unknown>({
      url: `/admin/cars/${id}/images/${mediaId}/primary`,
      method: "PATCH",
    }),
  orderImages: (id: number, media_ids: number[]) =>
    request<unknown>({
      url: `/admin/cars/${id}/images/order`,
      method: "PATCH",
      data: { media_ids },
    }),
  block: (id: number, data: unknown) =>
    request<Block>({
      url: `/admin/cars/${id}/blocked-periods`,
      method: "POST",
      data,
    }),
  deleteBlock: (id: number) =>
    request<null>({ url: `/admin/blocked-periods/${id}`, method: "DELETE" }),
};
export const bookingApi = {
  list: (params: Filters = {}, signal?: AbortSignal) =>
    get<Page<Booking>>("/admin/bookings", params, signal),
  detail: (id: number, signal?: AbortSignal) =>
    get<Booking>(`/admin/bookings/${id}`, undefined, signal),
  create: (data: unknown) =>
    request<Booking>({ url: "/admin/bookings", method: "POST", data }),
  status: (id: number, status: BookingStatus) =>
    request<Booking>({
      url: `/admin/bookings/${id}/status`,
      method: "PATCH",
      data: { status },
    }),
  schedule: async (carId: number, signal?: AbortSignal) => {
    const items: Booking[] = [];
    let page = 1;
    while (true) {
      const result = await bookingApi.list(
        { car_id: carId, status: "confirmed", per_page: 100, page },
        signal,
      );
      items.push(...result.items);
      if (page >= result.pagination.lastPage) return items;
      if (page >= 50)
        throw new Error(
          "This schedule exceeds 5,000 confirmed bookings. A date-overlap API is needed to load it safely.",
        );
      page++;
    }
  },
};
export const dashboardApi = (signal?: AbortSignal) =>
  get<Dashboard>("/admin/dashboard", undefined, signal);
