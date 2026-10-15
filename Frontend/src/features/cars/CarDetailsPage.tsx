import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Fuel,
  MapPin,
  Settings2,
  Users,
  BriefcaseBusiness,
} from "lucide-react";
import { useCar, useCars } from "./api";
import { CarImageGallery } from "./CarImageGallery";
import { BookingForm } from "../booking/BookingForm";
import { CarCard } from "./CarCard";
import { ErrorState, PageLoading } from "../../components/shared/States";
import { ButtonLink, Eyebrow, TextLink } from "../../components/ui/Primitives";
import { Seo } from "../../components/shared/Seo";
import { ApiError } from "../../lib/api/client";
import { money } from "../../lib/utils/money";
import { rentalQuery } from "../search/validation";

function RelatedCars({ category, slug }: { category: string; slug: string }) {
  const related = useCars({ category, per_page: 4 });
  const cars = related.data?.items.filter((c) => c.slug !== slug).slice(0, 3);
  if (!cars?.length) return null;
  return (
    <section className="container section related-section">
      <div className="section-heading">
        <div>
          <Eyebrow>ANOTHER WAY TO GO</Eyebrow>
          <h2>More to discover.</h2>
        </div>
        <TextLink to={`/cars?category=${encodeURIComponent(category)}`}>
          Explore this category
        </TextLink>
      </div>
      <div className="car-grid">
        {cars.map((c) => (
          <CarCard key={c.slug} car={c} />
        ))}
      </div>
    </section>
  );
}
export default function CarDetailsPage() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = location.state?.from;
  const collectionPath =
    typeof from === "string" && /^\/cars(?:\?|$)/.test(from)
      ? from
      : `/cars${rentalQuery(params)}`;
  const query = useCar(slug);
  if (query.isPending) return <PageLoading />;
  if (query.isError)
    return (
      <div className="container page-header">
        <Seo
          title="Vehicle unavailable"
          description="Explore the collection to find another car for your journey."
          path={`/cars/${slug}`}
          noindex
        />
        <ErrorState
          title={
            query.error instanceof ApiError && query.error.status === 404
              ? "This vehicle has left the collection."
              : undefined
          }
          error={query.error}
          retry={() => query.refetch()}
        />
        <ButtonLink to="/cars" variant="outline">
          <ArrowLeft size={17} />
          Explore the collection
        </ButtonLink>
      </div>
    );
  const car = query.data;
  const specs = [
    { icon: CalendarDays, label: "Model year", value: car.year },
    { icon: Settings2, label: "Transmission", value: car.transmission },
    { icon: Fuel, label: "Fuel type", value: car.fuelType },
    { icon: Users, label: "Passengers", value: `${car.seats} seats` },
    {
      icon: BriefcaseBusiness,
      label: "Luggage",
      value: `${car.luggageCount} bags`,
    },
    { icon: MapPin, label: "Vehicle location", value: car.location.name },
  ];
  return (
    <>
      <Seo
        title={`${car.brand.name} ${car.model} rental`}
        description={`Explore the ${car.year} ${car.brand.name} ${car.model}. ${car.seats} seats, ${car.transmission}. From ${money(car.pricePerDay, car.currency)} per day. Request your rental.`}
        path={`/cars/${car.slug}`}
        image={car.primaryImageUrl || undefined}
      />
      <div className="container detail-header">
        <Link className="back-link" to={collectionPath}>
          <ArrowLeft size={15} />
          Back to the collection
        </Link>
        <div className="detail-title">
          <div>
            <Eyebrow>
              {car.brand.name} · {car.category.name}
            </Eyebrow>
            <h1>
              {car.model}
              <span>{car.year}</span>
            </h1>
          </div>
          <a href="#booking" className="text-link">
            Make it your next drive
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <div className="container detail-layout">
        <div className="detail-content">
          <CarImageGallery key={car.slug} car={car} />
          <section className="spec-section">
            <Eyebrow>THE FINER DETAILS</Eyebrow>
            <h2>Designed for your journey.</h2>
            <div className="spec-grid">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <Icon size={22} strokeWidth={1.4} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            {car.description && (
              <p className="car-description">{car.description}</p>
            )}
            <div className="rental-note">
              <h3>A note before you go.</h3>
              <p>
                Choose your rental dates to send a request. Availability is
                checked when you submit, and the rental team will contact you to
                confirm the details. No payment is collected online.
              </p>
            </div>
          </section>
        </div>
        <BookingForm key={car.slug} car={car} />
      </div>
      <RelatedCars category={car.category.slug} slug={car.slug} />
      <div className="mobile-booking-bar">
        <span>
          <strong>{money(car.pricePerDay, car.currency)}</strong> / day
        </span>
        <a className="button button-gold" href="#booking">
          Request this car
          <ArrowUpRight size={17} />
        </a>
      </div>
    </>
  );
}
