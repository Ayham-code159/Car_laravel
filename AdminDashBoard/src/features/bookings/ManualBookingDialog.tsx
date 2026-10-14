import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field } from "@/components/shared";
import { VehiclePicker } from "@/components/forms/VehiclePicker";
import {
  bookingSchema,
  mapErrors,
  MAX_RENTAL_DAYS,
  type BookingFormValues,
} from "@/lib/validations";
import { bookingApi } from "@/lib/api/services";
import { toApiDate, timezone } from "@/lib/format";
import { useCatalog, useInvalidate } from "@/hooks/use-data";
import type { Car } from "@/types/api";
export default function ManualBookingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-wide">
        <DialogHeader>
          <DialogTitle>A personal touch. A new reservation.</DialogTitle>
          <DialogDescription>
            Create a request received by phone or WhatsApp. Availability is
            checked by the server.
          </DialogDescription>
        </DialogHeader>
        {open && <ManualForm close={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
function ManualForm({ close }: { close: () => void }) {
  const [car, setCar] = useState<Car | null>(null);
  const [error, setError] = useState<unknown>(null);
  const catalog = useCatalog();
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      car_slug: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      pickup_location_id: "",
      pickup_at: "",
      return_at: "",
      notes: "",
      status: "pending",
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
          const booking = await bookingApi.create({
            ...values,
            customer_email: values.customer_email || null,
            pickup_location_id: Number(values.pickup_location_id),
            pickup_at: toApiDate(values.pickup_at),
            return_at: toApiDate(values.return_at),
          });
          await invalidate();
          toast.success(
            `Reservation ${booking.status === "confirmed" ? "confirmed" : "submitted as pending"}.`,
          );
          close();
          navigate(`/bookings/${booking.id}`);
        } catch (e) {
          setError(e);
          mapErrors(e, form.setError);
        }
      })}
    >
      <Field label="Choose a vehicle" error={errors.car_slug?.message}>
        <span className="block">
          <VehiclePicker
            value={car}
            onChange={(v) => {
              setCar(v);
              form.setValue("car_slug", v.slug, { shouldValidate: true });
            }}
          />
        </span>
      </Field>
      <div className="form-grid">
        <Field
          label="Customer name"
          required
          error={errors.customer_name?.message}
        >
          <input
            className="control"
            autoComplete="name"
            {...register("customer_name")}
          />
        </Field>
        <Field
          label="Phone number"
          required
          error={errors.customer_phone?.message}
        >
          <input
            className="control"
            type="tel"
            placeholder="+963…"
            {...register("customer_phone")}
          />
        </Field>
        <Field label="Email (optional)" error={errors.customer_email?.message}>
          <input
            className="control"
            type="email"
            {...register("customer_email")}
          />
        </Field>
        <Field
          label="Pickup location"
          required
          error={errors.pickup_location_id?.message}
        >
          <select className="control" {...register("pickup_location_id")}>
            <option value="">Select location</option>
            {catalog.locations.data
              ?.filter((v) => v.isActive)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label="Pickup date and time"
          required
          error={errors.pickup_at?.message}
        >
          <input
            className="control"
            type="datetime-local"
            {...register("pickup_at")}
          />
        </Field>
        <Field
          label="Return date and time"
          required
          error={errors.return_at?.message}
        >
          <input
            className="control"
            type="datetime-local"
            {...register("return_at")}
          />
        </Field>
        <Field label="Initial status" error={errors.status?.message}>
          <select className="control" {...register("status")}>
            <option value="pending">Pending — review later</option>
            <option value="confirmed">Confirmed — reserve vehicle</option>
          </select>
        </Field>
        <div className="col-span-full">
          <Field label="Notes (optional)" error={errors.notes?.message}>
            <textarea className="control" rows={3} {...register("notes")} />
          </Field>
        </div>
      </div>
      <p className="field-hint">
        Times are entered in {timezone}. Maximum rental: {MAX_RENTAL_DAYS} days.
        Partial days are charged as full days; the server stores the final
        estimate.
      </p>
      <ErrorNotice error={catalog.locations.error || error} />
      <div className="dialog-actions">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={close}
        >
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating…" : "Create reservation"}
        </Button>
      </div>
    </form>
  );
}
