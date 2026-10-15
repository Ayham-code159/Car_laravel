import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CarFront,
  Compass,
  SlidersHorizontal,
  MessageSquareText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useCategories, useFeatured } from "../cars/api";
import { BookingSearch } from "../search/BookingSearch";
import { CarCard } from "../cars/CarCard";
import { ButtonLink, Eyebrow, TextLink } from "../../components/ui/Primitives";
import {
  CarSkeletons,
  EmptyState,
  ErrorState,
} from "../../components/shared/States";
import { Seo } from "../../components/shared/Seo";

const benefits = [
  {
    icon: CarFront,
    title: "A drive for every occasion.",
    text: "Compare the collection by style, space, and the way you like to travel.",
  },
  {
    icon: SlidersHorizontal,
    title: "Your plans come first.",
    text: "Choose your dates and pickup location to find a car that fits your journey.",
  },
  {
    icon: MessageSquareText,
    title: "A more personal handover.",
    text: "Send your request directly to the rental team. They’ll take it from there.",
  },
];
export default function HomePage() {
  const featured = useFeatured();
  const categories = useCategories();
  return (
    <>
      <Seo
        title="Drive beyond ordinary"
        description="An exceptional journey starts with the right car. Explore the collection, search your dates, and request your next rental."
        path="/"
      />
      <section className="hero" aria-labelledby="hero-title">
        <picture className="hero-picture">
          <source
            media="(max-width: 640px)"
            srcSet="/images/hero-mobile.webp"
          />
          <img
            src="/images/hero-desktop.webp"
            alt="Graphite grand touring coupe in a dramatic architectural setting"
            fetchPriority="high"
            width="1660"
            height="948"
          />
        </picture>
        <div className="hero-shade" />
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Eyebrow>THE ART OF THE JOURNEY</Eyebrow>
            <h1 id="hero-title">
              Drive beyond
              <br />
              <span>ordinary.</span>
            </h1>
            <p>
              Some journeys deserve a little more.
              <br />
              Find the car that makes yours exceptional.
            </p>
            <div className="hero-actions">
              <ButtonLink to="/cars">
                Explore the collection
                <ArrowUpRight size={19} />
              </ButtonLink>
              <Link to="/#how-it-works" className="hero-secondary">
                A simple way to go
                <ArrowRight size={17} />
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="container hero-bottom">
          <a href="#find-your-drive" aria-label="Scroll to search">
            <ArrowDown size={16} />
            THE ROAD IS YOURS
          </a>
          <span>Campaign imagery · explore the actual fleet below</span>
        </div>
      </section>
      <section
        id="find-your-drive"
        className="container home-search"
        aria-label="Find a rental car"
      >
        <BookingSearch />
      </section>
      <section className="container section featured-section">
        <div className="section-heading">
          <div>
            <Eyebrow>THE SELECTED COLLECTION</Eyebrow>
            <h2>
              Exceptional cars.
              <br />
              <span className="muted">Extraordinary possibilities.</span>
            </h2>
          </div>
          <div className="section-intro">
            <p>
              A closer look at the vehicles in our spotlight.
              <br />
              Your next great journey could start here.
            </p>
            <TextLink to="/cars">View the entire fleet</TextLink>
          </div>
        </div>
        {featured.isPending ? (
          <CarSkeletons />
        ) : featured.isError ? (
          <ErrorState error={featured.error} retry={() => featured.refetch()} />
        ) : !featured.data.items.length ? (
          <EmptyState
            title="The spotlight is yours."
            message="Featured vehicles will appear here. Discover the complete collection in the meantime."
            action={
              <ButtonLink to="/cars" variant="outline">
                Explore all cars
                <ArrowRight size={16} />
              </ButtonLink>
            }
          />
        ) : (
          <div className="car-grid">
            {featured.data.items.map((car) => (
              <CarCard key={car.slug} car={car} />
            ))}
          </div>
        )}
      </section>
      <section className="category-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <Eyebrow>FIND YOUR PERSPECTIVE</Eyebrow>
              <h2>
                Different roads.
                <br />
                One perfect fit.
              </h2>
            </div>
            <p className="section-intro">
              City streets or a change of scenery.
              <br />
              Explore the collection your way.
            </p>
          </div>
          {categories.isPending ? (
            <div className="category-grid" aria-label="Loading categories">
              {[1, 2, 3, 4].map((n) => (
                <div className="skeleton category-skeleton" key={n} />
              ))}
            </div>
          ) : categories.isError ? (
            <ErrorState
              error={categories.error}
              retry={() => categories.refetch()}
            />
          ) : !categories.data.length ? (
            <EmptyState
              title="More ways to explore, coming soon."
              message="Browse all vehicles while the collection is being organized."
            />
          ) : (
            <div className="category-grid">
              {categories.data.map((category, index) => (
                <Link
                  className="category-tile"
                  key={category.slug}
                  to={`/cars?category=${encodeURIComponent(category.slug)}`}
                >
                  <span className="category-number">0{index + 1}</span>
                  <Compass
                    className="category-symbol"
                    strokeWidth={0.6}
                    size={100}
                  />
                  <div>
                    <h3>{category.name}</h3>
                    <span>
                      Explore category
                      <ArrowUpRight size={21} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="container section benefits-section">
        <div className="benefit-intro">
          <Eyebrow>THOUGHTFULLY SIMPLE</Eyebrow>
          <h2>
            More freedom.
            <br />
            <span className="serif">Less friction.</span>
          </h2>
          <p>
            A considered experience,
            <br />
            from the first click to the open road.
          </p>
        </div>
        <div className="benefits">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div className="benefit" key={title}>
              <Icon size={25} strokeWidth={1.3} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <Eyebrow>THE WAY FORWARD</Eyebrow>
              <h2>
                Your next journey.
                <br />
                Three simple steps.
              </h2>
            </div>
            <p className="section-intro">
              A straightforward request.
              <br />A personal confirmation.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Find your drive.",
                "Browse the fleet and choose a vehicle that suits your plans.",
              ],
              [
                "02",
                "Make it yours.",
                "Select your dates and pickup location, then send your rental request.",
              ],
              [
                "03",
                "Let us take it from here.",
                "The rental team will contact you to confirm availability and finalize the details.",
              ],
            ].map(([number, title, text]) => (
              <div className="step" key={number}>
                <div className="step-top">
                  <span>{number}</span>
                  <ArrowRight size={20} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <p className="confirmation-note">
            Every request is reviewed by the rental team. Your rental is
            confirmed only after their approval.
          </p>
        </div>
      </section>
      <section className="container final-cta">
        <div className="cta-art" aria-hidden="true" />
        <div className="cta-content">
          <Eyebrow>A NEW PERSPECTIVE AWAITS</Eyebrow>
          <h2>
            Good journeys
            <br />
            start with <span className="serif">a choice.</span>
          </h2>
          <ButtonLink to="/cars">
            Find your next drive
            <ArrowUpRight size={19} />
          </ButtonLink>
        </div>
        <span className="cta-index" aria-hidden="true">
          GO
          <br />
          BEYOND.
        </span>
      </section>
    </>
  );
}
