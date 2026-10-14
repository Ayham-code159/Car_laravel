import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { carApi } from "@/lib/api/services";
import { useDebounce } from "@/hooks/use-data";
import {
  CarImage,
  ErrorNotice,
  Pagination,
  SearchInput,
  StatusBadge,
} from "@/components/shared";
import type { Car } from "@/types/api";
export function VehiclePicker({
  value,
  onChange,
}: {
  value: Car | null;
  onChange: (car: Car) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounce(search);
  const query = useQuery({
    queryKey: ["cars", "picker", term, page],
    queryFn: ({ signal }) =>
      carApi.list(
        { search: term || undefined, page, per_page: 8, sort: "model_asc" },
        signal,
      ),
    placeholderData: keepPreviousData,
  });
  return (
    <div className="vehicle-picker">
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Find a vehicle by brand or model…"
      />
      <ErrorNotice error={query.error} />
      {value && (
        <div className="selected-vehicle">
          <CarImage url={value.primaryImageUrl} alt={value.model} />
          <div>
            <strong>
              {value.brand.name} {value.model}
            </strong>
            <span>{value.inventoryCode} · Selected</span>
          </div>
        </div>
      )}
      <div
        className="vehicle-picker-options"
        aria-label="Vehicle options"
        aria-busy={query.isFetching}
      >
        {query.isPending ? (
          <p className="p-4 text-muted-foreground">Loading vehicles…</p>
        ) : (
          query.data?.items.map((car) => (
            <button
              type="button"
              key={car.id}
              className={value?.id === car.id ? "selected" : ""}
              onClick={() => onChange(car)}
            >
              <span>
                <strong>
                  {car.brand.name} {car.model}
                </strong>
                <small>
                  {car.inventoryCode} · {car.location.name}
                </small>
              </span>
              <StatusBadge value={car.operationalStatus} />
            </button>
          ))
        )}
        {query.data?.items.length === 0 && (
          <p className="p-4 text-muted-foreground">No matching vehicles.</p>
        )}
      </div>
      {query.data && (
        <Pagination
          meta={query.data.pagination}
          onChange={setPage}
          disabled={query.isPlaceholderData}
        />
      )}
    </div>
  );
}
