import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BackLink,
  CarImage,
  ConfirmDialog,
  DetailRow,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { bookingApi } from "@/lib/api/services";
import {
  dateTime,
  money,
  titleCase,
  validActions,
  whatsapp,
  timezone,
} from "@/lib/format";
import { useInvalidate } from "@/hooks/use-data";
import type { BookingStatus } from "@/types/api";
const actionLabel: Record<string, string> = {
  confirmed: "Confirm reservation",
  rejected: "Reject request",
  cancelled: "Cancel reservation",
  completed: "Mark completed",
};
export default function BookingDetailsPage() {
  const { id } = useParams();
  const invalidate = useInvalidate();
  const [next, setNext] = useState<BookingStatus | null>(null);
  const query = useQuery({
    queryKey: ["bookings", Number(id)],
    queryFn: ({ signal }) => bookingApi.detail(Number(id), signal),
  });
  const mutation = useMutation({
    mutationFn: (status: BookingStatus) =>
      bookingApi.status(Number(id), status),
    onSuccess: async () => {
      await invalidate();
      setNext(null);
      toast.success("Reservation status updated.");
    },
  });
  if (query.isPending) return <LoadingSkeleton />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const b = query.data;
  const actions = validActions(b);
  const contact = whatsapp(b.customerPhone);
  return (
    <>
      <BackLink to="/bookings">Back to reservations</BackLink>
      <PageHeader
        eyebrow="RESERVATION DETAILS"
        title={`A journey for ${b.customerName}.`}
        description={b.bookingReference}
        actions={<StatusBadge value={b.status} />}
      />
      <div className="booking-details">
        <div className="space-y-6">
          <section className="panel detail-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">THE GUEST</span>
                <h2>Personal details</h2>
              </div>
              {contact && (
                <Button variant="outline" size="sm" asChild>
                  <a href={contact} target="_blank" rel="noreferrer">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </Button>
              )}
            </div>
            <dl>
              <DetailRow label="Full name">{b.customerName}</DetailRow>
              <DetailRow label="Phone">
                <a href={`tel:${b.customerPhone.replace(/[ ()-]/g, "")}`}>
                  {b.customerPhone}
                </a>
              </DetailRow>
              <DetailRow label="Email">
                {b.customerEmail ? (
                  <a href={`mailto:${b.customerEmail}`}>{b.customerEmail}</a>
                ) : (
                  "Not provided"
                )}
              </DetailRow>
            </dl>
          </section>
          <section className="panel detail-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">THE JOURNEY</span>
                <h2>Reservation details</h2>
              </div>
            </div>
            <dl>
              <DetailRow label="Pickup">{dateTime(b.pickupAt)}</DetailRow>
              <DetailRow label="Return">{dateTime(b.returnAt)}</DetailRow>
              <DetailRow label="Pickup location">
                {b.pickupLocation.name} · {b.pickupLocation.city}
              </DetailRow>
              <DetailRow label="Requested">{dateTime(b.createdAt)}</DetailRow>
              <DetailRow label="Time zone">{timezone}</DetailRow>
              <DetailRow label="Notes">
                <span className="whitespace-pre-wrap">
                  {b.notes || "No additional notes."}
                </span>
              </DetailRow>
            </dl>
          </section>
          <section className="panel detail-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">NEXT STEPS</span>
                <h2>Manage this reservation</h2>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Button
                    key={action}
                    variant={
                      action === "confirmed"
                        ? "default"
                        : action === "completed"
                          ? "outline"
                          : "secondary"
                    }
                    onClick={() => {
                      mutation.reset();
                      setNext(action);
                    }}
                  >
                    {actionLabel[action]}
                  </Button>
                ))}
              </div>
              {!actions.length && (
                <p className="text-muted-foreground text-sm">
                  This {b.status} reservation has no further status actions.
                </p>
              )}
              {b.status === "confirmed" &&
                new Date(b.returnAt) > new Date() && (
                  <p className="field-hint mt-4">
                    Completion becomes available after the scheduled return.
                  </p>
                )}
              {b.status === "pending" && !actions.includes("confirmed") && (
                <p className="field-hint mt-4">
                  Confirmation requires a future pickup, an active vehicle, and
                  an active pickup location.
                </p>
              )}
              <p className="field-hint mt-4">
                The server rechecks availability when confirming. Pending
                requests do not reserve a vehicle.
              </p>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="panel vehicle-detail-card">
            <CarImage
              url={b.car.primaryImageUrl}
              alt={`${b.car.brand.name} ${b.car.model}`}
            />
            <div className="p-6">
              <span className="eyebrow">THE VEHICLE</span>
              <h2 className="mt-2">
                {b.car.brand.name} {b.car.model}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                {b.car.inventoryCode} · {b.car.year} ·{" "}
                {titleCase(b.car.transmission)}
              </p>
              <div className="mt-4">
                <StatusBadge
                  value={
                    b.car.archivedAt ? "archived" : b.car.operationalStatus
                  }
                />
              </div>
              {!b.car.archivedAt && (
                <Link className="text-link mt-5" to={`/cars/${b.car.id}/edit`}>
                  View vehicle <ArrowUpRight size={16} />
                </Link>
              )}
              <p className="field-hint mt-5">
                Current daily rate: {money(b.car.pricePerDay, b.car.currency)}{" "}
                {b.car.currency}
              </p>
            </div>
          </section>
          <section className="panel estimate-card">
            <span className="eyebrow">BOOKING ESTIMATE</span>
            <strong>{money(b.estimatedTotal, b.currency)}</strong>
            <span>{b.currency} · Original price snapshot</span>
            <p>
              Stored when this reservation was created. Later daily-rate changes
              do not affect this estimate.
            </p>
          </section>
        </aside>
      </div>
      <ConfirmDialog
        open={!!next}
        onOpenChange={(v) => {
          if (!v) setNext(null);
        }}
        title={next ? actionLabel[next] : ""}
        description={
          next === "confirmed"
            ? "This reserves the vehicle for the requested period after a final availability check."
            : next === "completed"
              ? "Mark this confirmed rental as completed. This action cannot be reversed."
              : `Set this reservation to ${next}. This action cannot be reversed.`
        }
        confirmLabel={next ? actionLabel[next] : "Confirm"}
        destructive={next === "cancelled" || next === "rejected"}
        onConfirm={() => next && mutation.mutate(next)}
        pending={mutation.isPending}
        error={mutation.error}
      />
    </>
  );
}
