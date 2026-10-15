import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { useBrands, useCategories } from "./api";
import { Button, Field } from "../../components/ui/Primitives";
import { Overlay } from "../../components/ui/Overlay";
import { readFilters, updateParams } from "../search/validation";

function FilterForm({ close, prefix }: { close?: () => void; prefix: string }) {
  const [params, setParams] = useSearchParams();
  const brands = useBrands();
  const categories = useCategories();
  const [error, setError] = useState("");
  const fields = [
    "search",
    "brand",
    "category",
    "min_price",
    "max_price",
    "transmission",
    "fuel_type",
  ];
  return (
    <form
      className="filter-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const query = updateParams(
          params,
          Object.fromEntries(
            fields.map((key) => [
              key,
              String(
                values.has(key) ? values.get(key) : params.get(key) || "",
              ).trim(),
            ]),
          ),
        );
        const parsed = readFilters(query);
        if (!parsed.success) {
          setError(parsed.error.issues.map((i) => i.message).join(" "));
          return;
        }
        setParams(query);
        setError("");
        close?.();
      }}
    >
      <Field label="Brand or model" htmlFor={`${prefix}-search`}>
        <div className="input-with-icon">
          <Search size={17} />
          <input
            id={`${prefix}-search`}
            name="search"
            maxLength={120}
            placeholder="What moves you?"
            defaultValue={params.get("search") || ""}
          />
        </div>
      </Field>
      <Field label="Brand" htmlFor={`${prefix}-brand`}>
        <select
          key={brands.data?.length}
          name="brand"
          id={`${prefix}-brand`}
          defaultValue={params.get("brand") || ""}
          disabled={!brands.data}
        >
          <option value="">All brands</option>
          {brands.data?.map((b) => (
            <option value={b.slug} key={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>
      {brands.isError && (
        <p className="field-error">
          Brands unavailable.{" "}
          <button
            type="button"
            className="inline-link"
            onClick={() => brands.refetch()}
          >
            Retry
          </button>
        </p>
      )}
      <Field label="Category" htmlFor={`${prefix}-category`}>
        <select
          key={categories.data?.length}
          name="category"
          id={`${prefix}-category`}
          defaultValue={params.get("category") || ""}
          disabled={!categories.data}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option value={c.slug} key={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      {categories.isError && (
        <p className="field-error">
          Categories unavailable.{" "}
          <button
            type="button"
            className="inline-link"
            onClick={() => categories.refetch()}
          >
            Retry
          </button>
        </p>
      )}
      <div className="filter-divider" />
      <div className="field">
        <span className="field-label">Daily rate</span>
        <div className="price-inputs">
          <Field label="Minimum" htmlFor={`${prefix}-min`}>
            <input
              id={`${prefix}-min`}
              name="min_price"
              type="number"
              inputMode="decimal"
              min="0"
              max="99999999.99"
              step="0.01"
              placeholder="0"
              defaultValue={params.get("min_price") || ""}
            />
          </Field>
          <span>—</span>
          <Field label="Maximum" htmlFor={`${prefix}-max`}>
            <input
              id={`${prefix}-max`}
              name="max_price"
              type="number"
              inputMode="decimal"
              min="0"
              max="99999999.99"
              step="0.01"
              placeholder="Any"
              defaultValue={params.get("max_price") || ""}
            />
          </Field>
        </div>
        <small>Prices use each vehicle’s listed currency.</small>
      </div>
      <Field label="Transmission" htmlFor={`${prefix}-transmission`}>
        <select
          id={`${prefix}-transmission`}
          name="transmission"
          defaultValue={params.get("transmission") || ""}
        >
          <option value="">Any transmission</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </Field>
      <Field label="Fuel type" htmlFor={`${prefix}-fuel`}>
        <select
          id={`${prefix}-fuel`}
          name="fuel_type"
          defaultValue={params.get("fuel_type") || ""}
        >
          <option value="">Any fuel type</option>
          {["petrol", "diesel", "hybrid", "electric"].map((f) => (
            <option key={f} value={f}>
              {f[0].toUpperCase() + f.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit">
        Apply filters
        <SlidersHorizontal size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setParams({});
          close?.();
        }}
      >
        Clear all filters
      </Button>
    </form>
  );
}
export function CarFilters() {
  const [open, setOpen] = useState(false);
  const [params] = useSearchParams();
  return (
    <>
      <aside className="desktop-filters" aria-label="Vehicle filters">
        <div className="filter-heading">
          <h2>Refine your drive</h2>
          <SlidersHorizontal size={18} />
        </div>
        <FilterForm key={params.toString()} prefix="desktop" />
      </aside>
      <div className="mobile-filters">
        <Overlay
          title="Refine your drive"
          description="A few details. A better fit."
          drawer
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button variant="outline">
              <SlidersHorizontal size={17} />
              Filters
            </Button>
          }
        >
          <FilterForm
            key={params.toString()}
            prefix="mobile"
            close={() => setOpen(false)}
          />
        </Overlay>
      </div>
    </>
  );
}
