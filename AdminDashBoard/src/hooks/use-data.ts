import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { catalogApi, carApi } from "@/lib/api/services";
export function useCatalog() {
  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: ({ signal }) => catalogApi.brands(signal),
    staleTime: 300000,
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => catalogApi.categories(signal),
  });
  const locations = useQuery({
    queryKey: ["locations"],
    queryFn: ({ signal }) => catalogApi.locations(signal),
  });
  return { brands, categories, locations };
}
export function useCar(id: number) {
  return useQuery({
    queryKey: ["cars", id],
    queryFn: ({ signal }) => carApi.detail(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}
export function useInvalidate() {
  const client = useQueryClient();
  return async () => {
    await Promise.all(
      [
        "cars",
        "bookings",
        "dashboard",
        "schedule",
        "categories",
        "locations",
      ].map((key) => client.invalidateQueries({ queryKey: [key] })),
    );
  };
}
export function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
