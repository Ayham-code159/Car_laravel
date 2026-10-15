import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  MessageCircle,
} from "lucide-react";
import { bookingSchema, type BookingValues } from "./validation";
import { createBooking } from "./api";
import { useLocations } from "../cars/api";
import { BookingSummary } from "./BookingSummary";
import { BookingSuccess } from "./BookingSuccess";
import {
  defaultDates,
  localTimezone,
  prettyDate,
  toApiDate,
  toLocal,
} from "../../lib/utils/dates";
import { money } from "../../lib/utils/money";
import { ApiError } from "../../lib/api/client";
import { whatsappUrl } from "../../lib/config/site";
import { Button, Field } from "../../components/ui/Primitives";
import { DateTimeField } from "../../components/ui/DateTimeField";
import { ErrorState } from "../../components/shared/States";
import type { Car } from "../../types/api";

export function BookingForm({ car }: { car: Car }) {
  const locations = useLocations();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const locked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const client = useQueryClient();
  const defaults = defaultDates();
  const mutation = useMutation({
    mutationFn: createBooking,
    retry: false,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["cars"] });
    },
  });
  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      notes: "",
      pickup_location_id: String(
        locations.data?.find((l) => l.name === params.get("location"))?.id ||
          car.location.id,
      ),
      pickup_at: toLocal(params.get("pickup_at") || "") || defaults.pickup_at,
      return_at: toLocal(params.get("return_at") || "") || defaults.return_at,
    },
  });
  const {
    register,
    control,
    watch,
    trigger,
    handleSubmit,
    setError,
    formState: { errors },
  } = form;
  const initialLocationApplied = useRef(false);
  useEffect(() => {
    if (!locations.data || initialLocationApplied.current) return;
    initialLocationApplied.current = true;
    const location = locations.data.find(
      (l) => l.name === params.get("location"),
    );
    if (location && !form.getFieldState("pickup_location_id").isDirty)
      form.setValue("pickup_location_id", String(location.id));
  }, [locations.data, params, form]);
  const pickup = watch("pickup_at");
  const dropoff = watch("return_at");
  const pickupLocation = locations.data?.find(
    (l) => String(l.id) === watch("pickup_location_id"),
  );
  const next = async () => {
    if (await trigger(["pickup_location_id", "pickup_at", "return_at"])) {
      setStep(2);
      requestAnimationFrame(() => heading.current?.focus());
    }
  };
  const submit = handleSubmit(
    async (values) => {
      if (locked.current) return;
      locked.current = true;
      try {
        await mutation.mutateAsync({
          ...values,
          car_slug: car.slug,
          pickup_location_id: Number(values.pickup_location_id),
          pickup_at: toApiDate(values.pickup_at),
          return_at: toApiDate(values.return_at),
          customer_email: values.customer_email || null,
          notes: values.notes || null,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          for (const [key, message] of Object.entries(error.fieldErrors)) {
            if (key in values)
              setError(key as keyof BookingValues, { message });
          }
          if (
            ["pickup_at", "return_at", "pickup_location_id"].some(
              (key) => error.fieldErrors[key],
            ) ||
            error.status === 409
          )
            setStep(1);
        }
      } finally {
        locked.current = false;
      }
    },
    (invalid) => {
      if (invalid.pickup_at || invalid.return_at || invalid.pickup_location_id)
        setStep(1);
    },
  );
  if (mutation.data)
    return (
      <div id="booking" className="booking-panel">
        <BookingSuccess receipt={mutation.data} />
      </div>
    );
  const inquiry = whatsappUrl(
    `Hello, I’m interested in the ${car.brand.name} ${car.model}${pickup && dropoff ? ` from ${pickup.replace("T", " ")} to ${dropoff.replace("T", " ")} (${localTimezone})` : ""}. Could you tell me about availability?`,
  );
  return (
    <section
      id="booking"
      className="booking-panel"
      aria-labelledby="booking-title"
    >
      <div className="booking-panel-top">
        <p className="eyebrow">MAKE IT YOUR NEXT DRIVE</p>
        <p className="booking-rate">
          {money(car.pricePerDay, car.currency)}
          <span> / day</span>
        </p>
      </div>
      <div className="booking-steps">
        <span className={step === 1 ? "active" : ""}>01 · Your journey</span>
        <span className={step === 2 ? "active" : ""}>02 · Your details</span>
      </div>
      <h2 id="booking-title" ref={heading} tabIndex={-1}>
        {step === 1 ? "Set the scene." : "A few final details."}
      </h2>
      <form
        noValidate
        onSubmit={(event) => {
          if (step === 1) {
            event.preventDefault();
            void next();
          } else void submit(event);
        }}
      >
        <fieldset disabled={mutation.isPending}>
          {step === 1 ? (
            <div className="booking-fields">
              <Field
                label="Pickup location"
                htmlFor="booking-location"
                error={errors.pickup_location_id?.message}
              >
                <Controller
                  name="pickup_location_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="booking-location"
                      {...field}
                      aria-invalid={!!errors.pickup_location_id}
                      aria-describedby={
                        errors.pickup_location_id
                          ? "booking-location-error"
                          : undefined
                      }
                      disabled={!locations.data?.length}
                    >
                      <option value="">Choose a location</option>
                      {locations.data?.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </Field>
              {locations.isError && (
                <p role="alert" className="field-error">
                  Locations couldn’t load.{" "}
                  <button
                    className="inline-link"
                    type="button"
                    onClick={() => locations.refetch()}
                  >
                    Try again
                  </button>
                </p>
              )}
              {locations.isSuccess && !locations.data.length && (
                <p className="field-error">
                  No pickup locations are available. Requests cannot be
                  submitted yet.
                </p>
              )}
              <Controller
                name="pickup_at"
                control={control}
                render={({ field }) => (
                  <DateTimeField
                    label="Pickup"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.pickup_at?.message}
                  />
                )}
              />
              <Controller
                name="return_at"
                control={control}
                render={({ field }) => (
                  <DateTimeField
                    label="Return"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={pickup}
                    error={errors.return_at?.message}
                  />
                )}
              />
              <p className="small-text">
                All times in {localTimezone.replaceAll("_", " ")}.
              </p>
            </div>
          ) : (
            <div className="booking-fields">
              <div className="journey-review">
                <strong>
                  {car.brand.name} {car.model}
                </strong>
                <span>{pickupLocation?.name}</span>
                <span>
                  {pickup && prettyDate(pickup)} →<br />
                  {dropoff && prettyDate(dropoff)}
                </span>
                <small>{localTimezone.replaceAll("_", " ")}</small>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setStep(1)}
                >
                  Edit journey
                </button>
              </div>
              <Field
                label="Full name"
                htmlFor="booking-name"
                error={errors.customer_name?.message}
              >
                <input
                  id="booking-name"
                  autoComplete="name"
                  maxLength={150}
                  {...register("customer_name")}
                  aria-invalid={!!errors.customer_name}
                  aria-describedby={
                    errors.customer_name ? "booking-name-error" : undefined
                  }
                  placeholder="Your full name"
                />
              </Field>
              <Field
                label="Phone number"
                htmlFor="booking-phone"
                error={errors.customer_phone?.message}
              >
                <input
                  id="booking-phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={27}
                  {...register("customer_phone")}
                  aria-invalid={!!errors.customer_phone}
                  aria-describedby={
                    errors.customer_phone ? "booking-phone-error" : undefined
                  }
                  placeholder="Include country code"
                />
              </Field>
              <Field
                label="Email address"
                htmlFor="booking-email"
                error={errors.customer_email?.message}
                optional
              >
                <input
                  id="booking-email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  {...register("customer_email")}
                  aria-invalid={!!errors.customer_email}
                  aria-describedby={
                    errors.customer_email ? "booking-email-error" : undefined
                  }
                  placeholder="you@example.com"
                />
              </Field>
              <Field
                label="Anything we should know?"
                htmlFor="booking-notes"
                error={errors.notes?.message}
                optional
              >
                <textarea
                  id="booking-notes"
                  rows={3}
                  maxLength={5000}
                  {...register("notes")}
                  placeholder="A note for the rental team…"
                />
              </Field>
            </div>
          )}
          <BookingSummary car={car} pickup={pickup} dropoff={dropoff} />
          {mutation.isError && (
            <ErrorState
              title={
                mutation.error instanceof ApiError &&
                mutation.error.status === 409
                  ? "These dates aren’t available."
                  : "We couldn’t send your request."
              }
              error={mutation.error}
            />
          )}
          <Button
            type="submit"
            busy={mutation.isPending}
            disabled={!locations.data?.length}
            className="w-full"
          >
            {step === 1 ? "Continue to your details" : "Send rental request"}
            <ArrowRight size={17} />
          </Button>
          {step === 2 && (
            <Button
              variant="ghost"
              className="w-full"
              type="button"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={15} />
              Back to your journey
            </Button>
          )}
        </fieldset>
      </form>
      <p className="booking-reassurance">
        <LockKeyhole size={15} />
        No payment required. Subject to confirmation.
      </p>
      {inquiry && (
        <a
          className="booking-whatsapp"
          href={inquiry}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={17} />
          Ask about this car on WhatsApp
        </a>
      )}
    </section>
  );
}
