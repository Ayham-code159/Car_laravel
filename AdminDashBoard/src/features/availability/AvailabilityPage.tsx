import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ConfirmDialog,
  ErrorNotice,
  ErrorState,
  Field,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { VehiclePicker } from "@/components/forms/VehiclePicker";
import { bookingApi, carApi } from "@/lib/api/services";
import { blockSchema, mapErrors } from "@/lib/validations";
import {
  dateTime,
  localDate,
  overlaps,
  toApiDate,
  timezone,
} from "@/lib/format";
import { useInvalidate } from "@/hooks/use-data";
import type { Block, Car } from "@/types/api";
interface BlockValues {
  start_at: string;
  end_at: string;
  reason: string;
}
export default function AvailabilityPage() {
  const [car, setCar] = useState<Car | null>(null);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [first, setFirst] = useState<Date | null>(null);
  const [last, setLast] = useState<Date | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [removing, setRemoving] = useState<Block | null>(null);
  const invalidate = useInvalidate();
  const detail = useQuery({
    queryKey: ["cars", car?.id],
    queryFn: ({ signal }) => carApi.detail(car!.id, signal),
    enabled: !!car,
  });
  const schedule = useQuery({
    queryKey: ["schedule", car?.id],
    queryFn: ({ signal }) => bookingApi.schedule(car!.id, signal),
    enabled: !!car,
  });
  const remove = useMutation({
    mutationFn: (id: number) => carApi.deleteBlock(id),
    onSuccess: async () => {
      await invalidate();
      setRemoving(null);
      toast.success("Unavailable period removed.");
    },
  });
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const loaded = !!detail.data && !!schedule.data;
  const selectedStart =
    first && last ? new Date(Math.min(first.getTime(), last.getTime())) : first;
  const selectedEnd =
    first && last ? new Date(Math.max(first.getTime(), last.getTime())) : first;
  return (
    <>
      <PageHeader
        eyebrow="FLEET PLANNING"
        title="A clear road ahead."
        description="See confirmed reservations, plan maintenance, and protect every booking."
        actions={
          car && (
            <Button
              onClick={() => setBlockOpen(true)}
              disabled={!loaded || !!detail.data?.archivedAt}
            >
              <Plus size={17} /> Block a period
            </Button>
          )
        }
      />
      <div className="availability-layout">
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <div>
              <span className="eyebrow">SELECT A VEHICLE</span>
              <h2>Availability planner</h2>
            </div>
            <div className="month-controls">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() => setMonth(subMonths(month, 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <strong>{format(month, "MMMM yyyy")}</strong>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={() => setMonth(addMonths(month, 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
          <div className="p-6 pt-0">
            <VehiclePicker
              value={car}
              onChange={(v) => {
                setCar(v);
                setFirst(null);
                setLast(null);
              }}
            />
          </div>
          {car && (
            <>
              {detail.isError ? (
                <ErrorState
                  error={detail.error}
                  retry={() => void detail.refetch()}
                />
              ) : schedule.isError ? (
                <ErrorState
                  error={schedule.error}
                  retry={() => void schedule.refetch()}
                />
              ) : !loaded ? (
                <div className="p-6">
                  <LoadingSkeleton />
                </div>
              ) : (
                <>
                  <div className="calendar-guide">
                    <span>
                      <i className="legend-confirmed" /> Confirmed rental
                    </span>
                    <span>
                      <i className="legend-block" /> Unavailable period
                    </span>
                    <span>
                      <i className="legend-selected" /> Selected range
                    </span>
                    <span>
                      <i className="legend-neutral" /> No recorded conflict
                    </span>
                  </div>
                  <p className="calendar-note">
                    Schedule loaded for this car. The server checks final
                    availability when creating a block or confirming a booking.
                  </p>
                  <div
                    className="calendar-grid"
                    role="group"
                    aria-label={`${format(month, "MMMM yyyy")} availability`}
                  >
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => (
                        <div className="calendar-weekday" key={day}>
                          {day}
                        </div>
                      ),
                    )}
                    {days.map((day) => {
                      const start = day;
                      const end = addDays(day, 1);
                      const bookings = schedule.data.filter((b) =>
                        overlaps(b.pickupAt, b.returnAt, start, end),
                      );
                      const blocks = (detail.data.blockedPeriods || []).filter(
                        (b) => overlaps(b.startAt, b.endAt, start, end),
                      );
                      const selected =
                        selectedStart &&
                        selectedEnd &&
                        day >= selectedStart &&
                        day <= selectedEnd;
                      return (
                        <div
                          key={day.toISOString()}
                          className={`calendar-day ${!isSameMonth(day, month) ? "outside" : ""} ${selected ? "selected" : ""} ${isSameDay(day, new Date()) ? "today" : ""}`}
                        >
                          <button
                            type="button"
                            className="day-select"
                            onClick={() => {
                              if (!first || last) {
                                setFirst(day);
                                setLast(null);
                              } else setLast(day);
                            }}
                            aria-label={`Select ${format(day, "EEEE dd MMMM yyyy")}, ${bookings.length} confirmed bookings, ${blocks.length} blocked periods`}
                            aria-pressed={!!selected}
                          >
                            <span className="day-number">
                              {format(day, "d")}
                            </span>
                          </button>
                          <span className="calendar-day-events">
                            {bookings.slice(0, 2).map((b) => (
                              <Link
                                className="day-event booked"
                                to={`/bookings/${b.id}`}
                                title={`View booking for ${b.customerName}`}
                                key={b.id}
                              >
                                {b.car.brand.name} · {b.customerName}
                              </Link>
                            ))}
                            {blocks.slice(0, 2).map((b) => (
                              <span className="day-event blocked" key={b.id}>
                                {b.reason}
                              </span>
                            ))}
                            {bookings.length + blocks.length >
                              Math.min(2, bookings.length) +
                                Math.min(2, blocks.length) && (
                              <small>
                                +
                                {bookings.length +
                                  blocks.length -
                                  Math.min(2, bookings.length) -
                                  Math.min(2, blocks.length)}{" "}
                                more
                              </small>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="calendar-bottom">
                    {first ? (
                      <span>
                        Selected {format(selectedStart!, "dd MMM")}{" "}
                        {last
                          ? `– ${format(selectedEnd!, "dd MMM")}`
                          : "(choose the end day)"}
                      </span>
                    ) : (
                      <span>Choose dates to prepare a maintenance block.</span>
                    )}
                    <Button
                      variant="outline"
                      disabled={!first}
                      onClick={() => setBlockOpen(true)}
                    >
                      Use selected dates
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
          {!car && (
            <div className="calendar-prompt">
              <CalendarDays size={32} />
              <h3>Choose a vehicle to view its schedule.</h3>
              <p>
                Confirmed bookings and maintenance periods will appear on the
                calendar.
              </p>
            </div>
          )}
        </section>
        <aside className="space-y-6">
          <section className="panel schedule-aside">
            <span className="eyebrow">SCHEDULE AT A GLANCE</span>
            <h2>{car ? `${car.brand.name} ${car.model}` : "Your next move"}</h2>
            {car && (
              <p className="text-sm text-muted-foreground">
                {car.inventoryCode} ·{" "}
                <StatusBadge
                  value={
                    detail.data?.operationalStatus || car.operationalStatus
                  }
                />
              </p>
            )}
            {loaded ? (
              <>
                <h3>
                  Confirmed bookings <span>{schedule.data.length}</span>
                </h3>
                {schedule.data.length === 0 ? (
                  <p className="field-hint">
                    No confirmed rentals are recorded for this vehicle.
                  </p>
                ) : (
                  <div className="event-list">
                    {schedule.data
                      .filter(
                        (b) =>
                          new Date(b.returnAt) >= startOfMonth(month) &&
                          new Date(b.pickupAt) < addMonths(month, 1),
                      )
                      .map((b) => (
                        <Link to={`/bookings/${b.id}`} key={b.id}>
                          <span className="summary-dot status-confirmed" />
                          <div>
                            <strong>{b.customerName}</strong>
                            <small>
                              {dateTime(b.pickupAt)} → {dateTime(b.returnAt)}
                            </small>
                          </div>
                        </Link>
                      ))}
                    {!schedule.data.some(
                      (b) =>
                        new Date(b.returnAt) >= startOfMonth(month) &&
                        new Date(b.pickupAt) < addMonths(month, 1),
                    ) && (
                      <p className="field-hint">
                        No confirmed bookings overlap this month.
                      </p>
                    )}
                  </div>
                )}
                <h3>
                  Unavailable periods{" "}
                  <span>{detail.data.blockedPeriods?.length || 0}</span>
                </h3>
                <div className="event-list">
                  {detail.data.blockedPeriods
                    ?.filter(
                      (b) =>
                        new Date(b.endAt) >= startOfMonth(month) &&
                        new Date(b.startAt) < addMonths(month, 1),
                    )
                    .map((b) => (
                      <div className="block-list-item" key={b.id}>
                        <span className="summary-dot status-maintenance" />
                        <div>
                          <strong>{b.reason}</strong>
                          <small>
                            {dateTime(b.startAt)} → {dateTime(b.endAt)}
                          </small>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove block ${b.reason}`}
                          onClick={() => {
                            remove.reset();
                            setRemoving(b);
                          }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    ))}
                  {!detail.data.blockedPeriods?.some(
                    (b) =>
                      new Date(b.endAt) >= startOfMonth(month) &&
                      new Date(b.startAt) < addMonths(month, 1),
                  ) && (
                    <p className="field-hint">
                      No manual blocks overlap this month.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm mt-5">
                Select a vehicle to inspect real schedule data.
              </p>
            )}
          </section>
          <div className="calendar-footnote">
            Dates are displayed in {timezone}. Rental periods use half-open
            intervals: one rental may begin when another ends.
          </div>
        </aside>
      </div>
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protect a period</DialogTitle>
            <DialogDescription>
              Block {car?.brand.name} {car?.model} for maintenance or another
              operational reason. Confirmed bookings cannot overlap.
            </DialogDescription>
          </DialogHeader>
          {blockOpen && car && (
            <BlockForm
              car={car}
              first={selectedStart}
              last={selectedEnd}
              close={() => setBlockOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => {
          if (!v) setRemoving(null);
        }}
        title="Remove this unavailable period?"
        description={`The block for “${removing?.reason}” will be deleted. The vehicle may then be booked for that time.`}
        destructive
        confirmLabel="Remove block"
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </>
  );
}
function BlockForm({
  car,
  first,
  last,
  close,
}: {
  car: Car;
  first: Date | null;
  last: Date | null;
  close: () => void;
}) {
  const invalidate = useInvalidate();
  const [error, setError] = useState<unknown>(null);
  const form = useForm<BlockValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      start_at: first ? localDate(first) : "",
      end_at: last ? localDate(addDays(last, 1)) : "",
      reason: "",
    },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          await carApi.block(car.id, {
            start_at: toApiDate(values.start_at),
            end_at: toApiDate(values.end_at),
            reason: values.reason,
          });
          await invalidate();
          toast.success("Unavailable period created.");
          close();
        } catch (e) {
          setError(e);
          mapErrors(e, form.setError);
        }
      })}
    >
      <Field label="Starts at" required error={errors.start_at?.message}>
        <input
          type="datetime-local"
          className="control"
          {...register("start_at")}
        />
      </Field>
      <Field label="Ends at" required error={errors.end_at?.message}>
        <input
          type="datetime-local"
          className="control"
          {...register("end_at")}
        />
      </Field>
      <Field label="Reason" required error={errors.reason?.message}>
        <input
          className="control"
          placeholder="e.g. Scheduled service"
          {...register("reason")}
        />
      </Field>
      <p className="field-hint">
        Time zone: {timezone}. The server checks for overlapping confirmed
        rentals.
      </p>
      <ErrorNotice error={error} />
      <div className="dialog-actions">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Create block"}
        </Button>
      </div>
    </form>
  );
}
