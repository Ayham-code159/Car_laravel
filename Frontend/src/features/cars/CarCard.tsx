import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowUpRight, CarFront, Fuel, Settings2, Users } from "lucide-react";
import type { Car } from "../../types/api";
import { money } from "../../lib/utils/money";
import { rentalQuery } from "../search/validation";

export function CarImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`image-fallback ${className}`}
      role="img"
      aria-label={`${alt} — image unavailable`}
    >
      <CarFront size={64} strokeWidth={1} />
      <span>IMAGE COMING SOON</span>
    </div>
  );
}
export function CarCard({ car }: { car: Car }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const state = {
    from:
      location.pathname === "/cars"
        ? `/cars${location.search}`
        : `/cars${rentalQuery(params)}`,
  };
  const path = `/cars/${car.slug}${rentalQuery(params)}`;
  const primary = car.images.find((i) => i.isPrimary) || car.images[0];
  return (
    <article className="car-card">
      <Link
        to={path}
        state={state}
        className="car-image-link"
        aria-label={`View ${car.brand.name} ${car.model}`}
      >
        <CarImage
          key={car.primaryImageUrl}
          src={primary?.thumbnailUrl || car.primaryImageUrl}
          alt={`${car.brand.name} ${car.model}, ${car.year}`}
        />
        <span className="car-category">{car.category.name}</span>
        <span className="image-arrow">
          <ArrowUpRight size={21} />
        </span>
      </Link>
      <div className="car-card-body">
        <div className="car-overline">
          <span>{car.brand.name}</span>
          <span>{car.year}</span>
        </div>
        <h3>
          <Link to={path} state={state}>
            {car.model}
          </Link>
        </h3>
        <div className="car-specs">
          <span>
            <Settings2 size={15} />
            {car.transmission}
          </span>
          <span>
            <Fuel size={15} />
            {car.fuelType}
          </span>
          <span>
            <Users size={15} />
            {car.seats} seats
          </span>
        </div>
        <div className="card-price">
          <p>
            <strong>{money(car.pricePerDay, car.currency)}</strong>
            <span> / day</span>
          </p>
          <Link to={`${path}#booking`} state={state} className="book-link">
            Book now
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <Link to={path} state={state} className="card-detail-link">
          Discover this vehicle<span>View details →</span>
        </Link>
      </div>
    </article>
  );
}
