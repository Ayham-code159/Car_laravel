import { useQuery } from "@tanstack/react-query";
import { get } from "../../lib/api/client";
import type {
  Brand,
  Car,
  Category,
  Location,
  Paginated,
  SearchFilters,
} from "../../types/api";

export const getCars = (filters: SearchFilters, signal?: AbortSignal) =>
  get<Paginated<Car>>("/cars", filters, signal);
export const useCars = (filters: SearchFilters, enabled = true) =>
  useQuery({
    queryKey: ["cars", filters],
    queryFn: ({ signal }) => getCars(filters, signal),
    enabled,
    staleTime: 0,
  });
export const useFeatured = () =>
  useQuery({
    queryKey: ["featured"],
    queryFn: ({ signal }) =>
      get<Paginated<Car>>("/cars/featured", { per_page: 3 }, signal),
  });
export const useCar = (slug: string) =>
  useQuery({
    queryKey: ["car", slug],
    queryFn: ({ signal }) =>
      get<Car>(`/cars/${encodeURIComponent(slug)}`, undefined, signal),
  });
export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: ({ signal }) => get<Brand[]>("/brands", undefined, signal),
    staleTime: 300000,
  });
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => get<Category[]>("/categories", undefined, signal),
    staleTime: 300000,
  });
export const useLocations = () =>
  useQuery({
    queryKey: ["locations"],
    queryFn: ({ signal }) => get<Location[]>("/locations", undefined, signal),
    staleTime: 300000,
  });
