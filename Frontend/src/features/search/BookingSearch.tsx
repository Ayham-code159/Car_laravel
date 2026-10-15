import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { useLocations } from "../cars/api";
import { searchSchema, type SearchValues, updateParams } from "./validation";
import {
  defaultDates,
  localTimezone,
  toApiDate,
  toLocal,
} from "../../lib/utils/dates";
import { DateTimeField } from "../../components/ui/DateTimeField";
import { Button, Field } from "../../components/ui/Primitives";

export function BookingSearch({ compact = false }: { compact?: boolean }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const locations = useLocations();
  const id = useId();
  const dates = defaultDates();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      location: params.get("location") || "",
      pickup_at: toLocal(params.get("pickup_at") || "") || dates.pickup_at,
      return_at: toLocal(params.get("return_at") || "") || dates.return_at,
    },
  });
  const submit = (v: SearchValues) => {
    const query = updateParams(compact ? params : new URLSearchParams(), {
      location: v.location,
      pickup_at: toApiDate(v.pickup_at),
      return_at: toApiDate(v.return_at),
    });
    navigate(`/cars?${query}`);
  };
  return (
    <div className={`booking-search ${compact ? "compact-search" : ""}`}>
      {!compact && (
        <div className="search-caption">
          <span className="eyebrow">YOUR JOURNEY, YOUR WAY</span>
          <span>Find your next drive</span>
        </div>
      )}
      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="search-fields"
      >
        <Field
          label="Pickup location"
          htmlFor={`${id}-location`}
          error={errors.location?.message}
        >
          <div className="select-with-icon">
            <MapPin size={18} />
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <select
                  id={`${id}-location`}
                  {...field}
                  aria-invalid={!!errors.location}
                  aria-describedby={
                    errors.location ? `${id}-location-error` : undefined
                  }
                  disabled={locations.isPending || locations.isError}
                >
                  <option value="">
                    {locations.isPending
                      ? "Loading locations…"
                      : "Choose location"}
                  </option>
                  {locations.data?.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </Field>
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
              minDate={watch("pickup_at")}
              error={errors.return_at?.message}
            />
          )}
        />
        <Button type="submit" disabled={!locations.data?.length}>
          Find my drive
          <ArrowRight size={19} />
        </Button>
      </form>
      <div className="search-footnote">
        <span>Times shown in {localTimezone.replaceAll("_", " ")}.</span>
        <span>No account needed. Confirmation by our team.</span>
      </div>
      {locations.isError && (
        <p role="alert" className="field-error">
          Pickup locations couldn’t load.{" "}
          <button className="inline-link" onClick={() => locations.refetch()}>
            Retry
          </button>
        </p>
      )}
      {locations.isSuccess && !locations.data.length && (
        <p className="field-error">
          Pickup locations are not available yet. You can still explore the
          collection.
        </p>
      )}
    </div>
  );
}
