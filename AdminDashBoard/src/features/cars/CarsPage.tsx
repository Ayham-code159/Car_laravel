import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ActionMenu,
  CarImage,
  ConfirmDialog,
  DataTable,
  ErrorNotice,
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  StatusBadge,
} from "@/components/shared";
import { carApi } from "@/lib/api/services";
import { errorMessage } from "@/lib/api/client";
import { useCatalog, useDebounce, useInvalidate } from "@/hooks/use-data";
import { money, titleCase } from "@/lib/format";
import type { Car, Filters } from "@/types/api";
export default function CarsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ sort: "newest" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const catalog = useCatalog();
  const invalidate = useInvalidate();
  const [archive, setArchive] = useState<Car | null>(null);
  const updateFilter = (name: string, value: string) => {
    setFilters((f) => ({ ...f, [name]: value || undefined }));
    setPage(1);
  };
  const query = useQuery({
    queryKey: ["cars", "list", filters, debounced, page],
    queryFn: ({ signal }) =>
      carApi.list(
        { ...filters, search: debounced || undefined, page, per_page: 15 },
        signal,
      ),
    placeholderData: keepPreviousData,
  });
  const mutation = useMutation({
    mutationFn: ({
      car,
      action,
      value,
    }: {
      car: Car;
      action: "status" | "publication" | "featured";
      value: string | boolean;
    }) =>
      carApi.change(car.id, action, {
        [action === "status"
          ? "operational_status"
          : action === "publication"
            ? "is_published"
            : "is_featured"]: value,
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Vehicle updated.");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (car: Car) => carApi.archive(car.id),
    onSuccess: async () => {
      await invalidate();
      setArchive(null);
      toast.success("Vehicle archived. Booking history is preserved.");
    },
  });
  const change = (
    car: Car,
    action: "status" | "publication" | "featured",
    value: string | boolean,
  ) => mutation.mutate({ car, action, value });
  const columns: ColumnDef<Car>[] = [
    {
      header: "Vehicle",
      cell: ({ row: { original: c } }) => (
        <Link to={`/cars/${c.id}/edit`} className="vehicle-cell">
          <CarImage
            url={
              c.images.find((i) => i.isPrimary)?.thumbnailUrl ||
              c.primaryImageUrl
            }
            alt={`${c.brand.name} ${c.model}`}
          />
          <div>
            <strong>
              {c.brand.name} {c.model}
            </strong>
            <span>
              {c.inventoryCode}{" "}
              <span className="text-primary">
                {c.isFeatured && <Star size={11} fill="currentColor" />}
              </span>
            </span>
          </div>
        </Link>
      ),
    },
    {
      header: "Category",
      cell: ({ row: { original: c } }) => (
        <div>
          {c.category.name}
          <p className="table-secondary">
            {c.year} · {titleCase(c.transmission)}
          </p>
        </div>
      ),
    },
    {
      header: "Daily rate",
      cell: ({ row: { original: c } }) => (
        <div className="money">
          {money(c.pricePerDay, c.currency)}
          <p className="table-secondary">{c.currency} / day</p>
        </div>
      ),
    },
    { header: "Location", cell: ({ row: { original: c } }) => c.location.name },
    {
      header: "Status",
      cell: ({ row: { original: c } }) => (
        <StatusBadge value={c.operationalStatus} />
      ),
    },
    {
      header: "Visibility",
      cell: ({ row: { original: c } }) => (
        <StatusBadge value={c.isPublished ? "published" : "unpublished"} />
      ),
    },
    {
      header: "",
      id: "actions",
      cell: ({ row: { original: c } }) => (
        <ActionMenu
          label={`Actions for ${c.brand.name} ${c.model}`}
          items={[
            {
              label: "Edit vehicle",
              onClick: () => navigate(`/cars/${c.id}/edit`),
            },
            {
              label: c.isPublished ? "Unpublish" : "Publish",
              onClick: () => change(c, "publication", !c.isPublished),
              disabled: mutation.isPending,
            },
            {
              label: c.isFeatured ? "Remove featured" : "Mark as featured",
              onClick: () => change(c, "featured", !c.isFeatured),
              disabled: mutation.isPending,
            },
            ...(["active", "maintenance", "inactive"] as const)
              .filter((s) => s !== c.operationalStatus)
              .map((status) => ({
                label: `Set ${status}`,
                onClick: () => change(c, "status", status),
                disabled: mutation.isPending,
              })),
            {
              label: "Archive vehicle",
              onClick: () => {
                remove.reset();
                setArchive(c);
              },
              danger: true,
            },
          ]}
        />
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Your fleet, thoughtfully managed."
        description="Every vehicle. Every detail. One beautifully organized inventory."
        actions={
          <Button asChild>
            <Link to="/cars/new">
              <Plus size={17} /> Add vehicle
            </Link>
          </Button>
        }
      />
      <section className="panel">
        <div className="inventory-heading">
          <div>
            <h2>Vehicle inventory</h2>
            <span>
              {query.data
                ? `${query.data.pagination.total} vehicles`
                : "Your physical rental fleet"}
            </span>
          </div>
          <select
            className="control sort-select"
            aria-label="Sort vehicles"
            value={String(filters.sort)}
            onChange={(e) => updateFilter("sort", e.target.value)}
          >
            <option value="newest">Recently added</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="year_desc">Newest year</option>
            <option value="model_asc">Model A–Z</option>
          </select>
        </div>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search brand or model…"
          />
          <SelectFilter
            label="All brands"
            value={String(filters.brand || "")}
            onChange={(v) => updateFilter("brand", v)}
            options={(catalog.brands.data || []).map((b) => ({
              value: b.slug,
              label: b.name,
            }))}
          />
          <SelectFilter
            label="All categories"
            value={String(filters.category || "")}
            onChange={(v) => updateFilter("category", v)}
            options={(catalog.categories.data || []).map((c) => ({
              value: c.slug,
              label: c.name,
            }))}
          />
          <SelectFilter
            label="All statuses"
            value={String(filters.operational_status || "")}
            onChange={(v) => updateFilter("operational_status", v)}
            options={["active", "maintenance", "inactive"].map((v) => ({
              value: v,
              label: titleCase(v),
            }))}
          />
          <SelectFilter
            label="All visibility"
            value={String(filters.is_published ?? "")}
            onChange={(v) => updateFilter("is_published", v)}
            options={[
              { value: "1", label: "Published" },
              { value: "0", label: "Unpublished" },
            ]}
          />
          <SelectFilter
            label="All locations"
            value={String(filters.location || "")}
            onChange={(v) => updateFilter("location", v)}
            options={(catalog.locations.data || []).map((l) => ({
              value: String(l.id),
              label: l.name,
            }))}
          />
          <SelectFilter
            label="Transmission"
            value={String(filters.transmission || "")}
            onChange={(v) => updateFilter("transmission", v)}
            options={["automatic", "manual"].map((v) => ({
              value: v,
              label: titleCase(v),
            }))}
          />
          <SelectFilter
            label="Fuel type"
            value={String(filters.fuel_type || "")}
            onChange={(v) => updateFilter("fuel_type", v)}
            options={["petrol", "diesel", "hybrid", "electric"].map((v) => ({
              value: v,
              label: titleCase(v),
            }))}
          />
        </FilterBar>
        {(catalog.brands.error ||
          catalog.categories.error ||
          catalog.locations.error) && (
          <ErrorNotice
            error={
              catalog.brands.error ||
              catalog.categories.error ||
              catalog.locations.error
            }
          />
        )}
        <div
          aria-busy={query.isFetching}
          className={query.isPlaceholderData ? "opacity-60" : ""}
        >
          {query.isPending ? (
            <div className="p-6">
              <LoadingSkeleton />
            </div>
          ) : query.isError ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            <>
              <DataTable data={query.data.items} columns={columns} />
              <Pagination
                meta={query.data.pagination}
                onChange={setPage}
                disabled={query.isPlaceholderData}
              />
            </>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={!!archive}
        onOpenChange={(v) => {
          if (!v) setArchive(null);
        }}
        title="Archive this vehicle?"
        description={`${archive?.brand.name} ${archive?.model} will leave the active inventory and public catalog. Its booking history will remain intact.`}
        confirmLabel="Archive vehicle"
        destructive
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() => archive && remove.mutate(archive)}
      />
    </>
  );
}
