import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  CheckCheck,
  Globe2,
  Plus,
  Wrench,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  StatCard,
  LoadingSkeleton,
  ErrorState,
} from "@/components/shared";
import { dashboardApi } from "@/lib/api/services";
import { VehicleIllustration } from "@/components/layout/Brand";
import BookingTable from "@/features/bookings/BookingTable";
export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => dashboardApi(signal),
  });
  if (query.isPending) return <LoadingSkeleton />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const d = query.data;
  const distribution = [
    { name: "Active", value: d.activeCars, color: "#D4AF37" },
    { name: "Maintenance", value: d.carsUnderMaintenance, color: "#bb8751" },
    {
      name: "Inactive",
      value: Math.max(0, d.totalCars - d.activeCars - d.carsUnderMaintenance),
      color: "#444952",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow={format(new Date(), "EEEE, dd MMMM yyyy").toUpperCase()}
        title="A clearer view. A better drive."
        description="Your fleet, reservations, and daily operations — beautifully in sync."
        actions={
          <Button asChild>
            <Link to="/cars/new">
              <Plus size={17} /> Add vehicle
            </Link>
          </Button>
        }
      />
      <div className="overview-hero">
        <div className="hero-copy">
          <span className="eyebrow">YOUR FLEET, AT A GLANCE</span>
          <h2>
            Made for the
            <br />
            <em>road ahead.</em>
          </h2>
          <p>
            A considered overview of everything
            <br />
            that keeps your business moving.
          </p>
          <Link to="/cars" className="text-link">
            Explore your fleet <ArrowRight size={16} />
          </Link>
        </div>
        <VehicleIllustration />
        <div className="hero-caption">
          <span className="gold-dot" /> FLEET OPERATIONS / OVERVIEW
        </div>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total vehicles"
          value={d.totalCars}
          icon={<CarFront size={19} />}
          footnote="Current fleet inventory"
        />
        <StatCard
          label="Published"
          value={d.publishedCars}
          icon={<Globe2 size={19} />}
          footnote="Visible on the public catalog"
        />
        <StatCard
          label="Operationally active"
          value={d.activeCars}
          icon={<CheckCheck size={19} />}
          footnote="Rental-ready operating status"
        />
        <StatCard
          label="Under maintenance"
          value={d.carsUnderMaintenance}
          icon={<Wrench size={19} />}
          footnote="Vehicles receiving attention"
        />
      </div>
      <div className="overview-middle">
        <section className="panel booking-summary">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RESERVATIONS</span>
              <h2>Every journey starts here.</h2>
            </div>
            <CalendarDays size={21} className="text-muted-foreground" />
          </div>
          <div className="booking-stats">
            {[
              {
                label: "Pending requests",
                count: d.pendingBookingRequests,
                status: "pending",
              },
              {
                label: "Confirmed bookings",
                count: d.confirmedBookings,
                status: "confirmed",
              },
              {
                label: "Completed journeys",
                count: d.completedBookings,
                status: "completed",
              },
            ].map((s) => (
              <Link key={s.status} to={`/bookings?status=${s.status}`}>
                <span className={`summary-dot status-${s.status}`} />
                <span>{s.label}</span>
                <strong>{s.count}</strong>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          <Link to="/bookings" className="text-link">
            Manage reservations <ArrowRight size={16} />
          </Link>
        </section>
        <section className="panel fleet-distribution">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">FLEET HEALTH</span>
              <h2>Ready for what’s next.</h2>
            </div>
          </div>
          <div className="distribution-content">
            <div
              className="donut"
              role="img"
              aria-label={distribution
                .map((v) => `${v.name}: ${v.value}`)
                .join(", ")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      d.totalCars
                        ? distribution
                        : [{ name: "Empty", value: 1, color: "#303339" }]
                    }
                    dataKey="value"
                    innerRadius="75%"
                    outerRadius="95%"
                    paddingAngle={d.totalCars ? 5 : 0}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {(d.totalCars
                      ? distribution
                      : [{ name: "Empty", value: 1, color: "#303339" }]
                    ).map((v) => (
                      <Cell key={v.name} fill={v.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-label">
                <strong>{d.totalCars}</strong>
                <span>VEHICLES</span>
              </div>
            </div>
            <div className="distribution-legend">
              {distribution.map((v) => (
                <div key={v.name}>
                  <span style={{ background: v.color }} />
                  {v.name}
                  <strong>{v.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <p className="field-hint">
            Operating status is separate from date-based availability.
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">LATEST ACTIVITY</span>
            <h2>Recent reservations</h2>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/bookings">
              View all <ArrowUpRight size={15} />
            </Link>
          </Button>
        </div>
        <BookingTable bookings={d.recentBookingRequests} />
      </section>
      <div className="quick-links">
        <Link to="/availability">
          <CalendarDays size={20} />
          <div>
            <strong>Plan the next journey</strong>
            <span>Review bookings and maintenance blocks</span>
          </div>
          <ArrowUpRight size={19} />
        </Link>
        <Link to="/locations">
          <Globe2 size={20} />
          <div>
            <strong>Keep your network connected</strong>
            <span>Manage pickup locations across your fleet</span>
          </div>
          <ArrowUpRight size={19} />
        </Link>
      </div>
    </>
  );
}
