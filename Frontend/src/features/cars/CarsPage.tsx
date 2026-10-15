import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCars } from "./api";
import { CarCard } from "./CarCard";
import { CarFilters } from "./CarFilters";
import { BookingSearch } from "../search/BookingSearch";
import { readFilters, updateParams } from "../search/validation";
import {
  CarSkeletons,
  EmptyState,
  ErrorState,
} from "../../components/shared/States";
import { Button, Eyebrow } from "../../components/ui/Primitives";
import { Seo } from "../../components/shared/Seo";

export default function CarsPage() {
  const [params, setParams] = useSearchParams();
  const parsed = readFilters(params);
  const cars = useCars(
    parsed.success ? { ...parsed.data, per_page: 9 } : {},
    parsed.success,
  );
  const pagination = cars.data?.pagination;
  const chips = [...params].filter(
    ([key, val]) =>
      val &&
      !["page", "per_page", "sort", "pickup_at", "return_at"].includes(key),
  );
  const goPage = (page: number) => {
    const query = new URLSearchParams(params);
    query.set("page", String(page));
    setParams(query);
  };
  return (
    <>
      <Seo
        title="The vehicle collection"
        description="Find your next drive. Browse the fleet by brand, category, daily rate, and rental dates."
        path="/cars"
        noindex={params.size > 0}
      />
      <div className="container page-header">
        <Eyebrow>FIND YOUR NEXT DRIVE</Eyebrow>
        <div className="fleet-title">
          <h1>
            The <span className="serif">collection.</span>
          </h1>
          <p>
            Every journey has a character.
            <br />
            Find the car that matches yours.
          </p>
        </div>
      </div>
      <div className="container">
        <BookingSearch
          compact
          key={`search-${params.get("pickup_at")}-${params.get("return_at")}-${params.get("location")}`}
        />
      </div>
      <div className="container fleet-layout">
        <CarFilters />
        <div className="fleet-results">
          <div className="results-toolbar">
            <p aria-live="polite">
              {cars.isPending ? (
                "Discovering the collection…"
              ) : pagination ? (
                <>
                  <strong>{pagination.total}</strong>{" "}
                  {pagination.total === 1 ? "vehicle" : "vehicles"} to explore
                </>
              ) : (
                "The collection"
              )}
            </p>
            <label className="sort-control">
              <span>Sort by</span>
              <select
                aria-label="Sort vehicles"
                value={params.get("sort") || "newest"}
                onChange={(e) =>
                  setParams(updateParams(params, { sort: e.target.value }))
                }
              >
                <option value="newest">Latest additions</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="year_desc">Newest model year</option>
                <option value="model_asc">Model: A to Z</option>
              </select>
            </label>
          </div>
          {chips.length > 0 && (
            <div className="filter-chips">
              {chips.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() =>
                    setParams(updateParams(params, { [key]: undefined }))
                  }
                  aria-label={`Remove ${key.replaceAll("_", " ")} filter: ${value}`}
                >
                  {key.replaceAll("_", " ")}: {value.replaceAll("-", " ")}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
          <p className="availability-note">
            {params.get("pickup_at") && params.get("return_at")
              ? "Results are checked against your rental dates. Final confirmation is made by the rental team."
              : "Select rental dates above to check availability."}
          </p>
          {!parsed.success ? (
            <div className="state" role="alert">
              <h3>Let’s adjust your search.</h3>
              <ul>
                {parsed.error.issues.map((issue, i) => (
                  <li key={i}>
                    {issue.path.join(" ").replaceAll("_", " ")}: {issue.message}
                  </li>
                ))}
              </ul>
              <Button onClick={() => setParams({})} variant="outline">
                Reset search
              </Button>
            </div>
          ) : cars.isPending ? (
            <CarSkeletons count={6} />
          ) : cars.isError ? (
            <ErrorState error={cars.error} retry={() => cars.refetch()} />
          ) : cars.data?.items.length ? (
            <div className="car-grid">
              {cars.data.items.map((car) => (
                <CarCard key={car.slug} car={car} />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button variant="outline" onClick={() => setParams({})}>
                  Explore all vehicles
                </Button>
              }
            />
          )}
          {pagination && pagination.lastPage > 1 && (
            <nav className="pagination" aria-label="Fleet pagination">
              <Button
                variant="outline"
                disabled={pagination.currentPage <= 1}
                onClick={() => goPage(pagination.currentPage - 1)}
              >
                <ArrowLeft size={16} />
                Previous
              </Button>
              <span>
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <Button
                variant="outline"
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => goPage(pagination.currentPage + 1)}
              >
                Next
                <ArrowRight size={16} />
              </Button>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
