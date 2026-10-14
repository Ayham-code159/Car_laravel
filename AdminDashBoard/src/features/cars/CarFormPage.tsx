import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BackLink,
  ErrorNotice,
  ErrorState,
  Field,
  FormSection,
  LoadingSkeleton,
  PageHeader,
} from "@/components/shared";
import { useCar, useCatalog, useInvalidate } from "@/hooks/use-data";
import { carSchema, mapErrors, type CarFormValues } from "@/lib/validations";
import { carApi } from "@/lib/api/services";
import { UnsavedChanges } from "@/components/forms/UnsavedChanges";
import ImageUploader from "./ImageUploader";
import type { Car } from "@/types/api";
export default function CarFormPage() {
  const { id } = useParams();
  const query = useCar(Number(id));
  if (id && query.isPending) return <LoadingSkeleton />;
  if (id && query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (query.data?.archivedAt)
    return (
      <ErrorState
        error={
          new Error(
            "This vehicle has been archived. Its booking history remains available.",
          )
        }
      />
    );
  return <CarEditor key={id || "new"} car={query.data} />;
}
function CarEditor({ car }: { car?: Car }) {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const invalidate = useInvalidate();
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand_id: car ? String(car.brand.id) : "",
      category_id: car ? String(car.category.id) : "",
      location_id: car ? String(car.location.id) : "",
      inventory_code: car?.inventoryCode || "",
      model: car?.model || "",
      year: car?.year || new Date().getFullYear(),
      price_per_day: car?.pricePerDay || "",
      currency: car?.currency || "USD",
      transmission: car?.transmission || "automatic",
      fuel_type: car?.fuelType || "petrol",
      seats: car?.seats || 5,
      luggage_count: car?.luggageCount ?? 2,
      description: car?.description || "",
      operational_status: car?.operationalStatus || "active",
      is_published: car?.isPublished || false,
      is_featured: car?.isFeatured || false,
    },
  });
  const {
    register,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  return (
    <>
      <UnsavedChanges dirty={isDirty && !saved} />
      <BackLink to="/cars">Back to inventory</BackLink>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            const result = await carApi.save(
              {
                ...values,
                brand_id: Number(values.brand_id),
                category_id: Number(values.category_id),
                location_id: Number(values.location_id),
              },
              car?.id,
            );
            form.reset(values);
            setSaved(true);
            await invalidate();
            toast.success(
              car
                ? "Vehicle details saved."
                : "Vehicle created. You can now add its images.",
            );
            if (!car) navigate(`/cars/${result.id}/edit`, { replace: true });
            setSaved(false);
          } catch (e) {
            setError(e);
            mapErrors(e, form.setError);
          }
        })}
      >
        <PageHeader
          eyebrow={car ? "REFINE YOUR FLEET" : "GROW YOUR FLEET"}
          title={
            car
              ? `${car.brand.name} ${car.model}`
              : "A new addition. A new possibility."
          }
          description={
            car
              ? `${car.inventoryCode} · Update specifications, presentation, and visibility.`
              : "Create a complete profile for your next rental vehicle."
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/cars")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  catalog.brands.isPending ||
                  catalog.categories.isPending ||
                  catalog.locations.isPending
                }
              >
                <Save size={16} />
                {isSubmitting
                  ? "Saving…"
                  : car
                    ? "Save changes"
                    : "Create vehicle"}
              </Button>
            </>
          }
        />
        <ErrorNotice error={error} />
        <ErrorNotice
          error={
            catalog.brands.error ||
            catalog.categories.error ||
            catalog.locations.error
          }
        />
        <div className="form-stack">
          <FormSection
            number="01"
            title="The essentials"
            description="The details that identify this physical vehicle."
          >
            <Field label="Brand" required error={errors.brand_id?.message}>
              <select className="control" {...register("brand_id")}>
                <option value="">Select brand</option>
                {catalog.brands.data?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Model" required error={errors.model?.message}>
              <input
                className="control"
                placeholder="e.g. 320i"
                {...register("model")}
              />
            </Field>
            <Field
              label="Category"
              required
              error={errors.category_id?.message}
            >
              <select className="control" {...register("category_id")}>
                <option value="">Select category</option>
                {catalog.categories.data?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Inventory code"
              required
              error={errors.inventory_code?.message}
            >
              <input
                className="control"
                placeholder="e.g. BMW-001"
                {...register("inventory_code")}
              />
            </Field>
            <Field
              label="Production year"
              required
              error={errors.year?.message}
            >
              <input
                className="control"
                type="number"
                min={1990}
                max={new Date().getFullYear() + 1}
                {...register("year", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Assigned location"
              required
              error={errors.location_id?.message}
            >
              <select className="control" {...register("location_id")}>
                <option value="">Select location</option>
                {catalog.locations.data?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {!v.isActive ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </FormSection>
          <FormSection
            number="02"
            title="Designed for the journey"
            description="Specifications and the finer details."
          >
            <Field label="Transmission" error={errors.transmission?.message}>
              <select className="control" {...register("transmission")}>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </Field>
            <Field label="Fuel type" error={errors.fuel_type?.message}>
              <select className="control" {...register("fuel_type")}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </Field>
            <Field label="Seats" error={errors.seats?.message}>
              <input
                type="number"
                className="control"
                min={1}
                max={12}
                {...register("seats", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Luggage capacity"
              error={errors.luggage_count?.message}
            >
              <input
                type="number"
                className="control"
                min={0}
                max={20}
                {...register("luggage_count", { valueAsNumber: true })}
              />
            </Field>
            <div className="col-span-full">
              <Field label="Description" error={errors.description?.message}>
                <textarea
                  className="control"
                  rows={4}
                  placeholder="Tell the story of this vehicle…"
                  {...register("description")}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection
            number="03"
            title="A clear daily rate"
            description="New rates apply to future requests; existing estimates stay unchanged."
          >
            <Field
              label="Price per day"
              required
              error={errors.price_per_day?.message}
            >
              <input
                className="control"
                inputMode="decimal"
                placeholder="0.00"
                {...register("price_per_day")}
              />
            </Field>
            <Field
              label="Currency"
              required
              error={errors.currency?.message}
              hint="Three-letter uppercase currency code, e.g. USD."
            >
              <input
                className="control uppercase"
                maxLength={3}
                {...register("currency", {
                  setValueAs: (v: string) => v.toUpperCase(),
                })}
              />
            </Field>
          </FormSection>
          <FormSection
            number="04"
            title="Control the spotlight"
            description="Operating condition and public visibility are independent of rental availability."
          >
            <Field
              label="Operational status"
              error={errors.operational_status?.message}
            >
              <select className="control" {...register("operational_status")}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="toggle-stack">
              <label className="toggle-row">
                <div>
                  <strong>Publish vehicle</strong>
                  <span>
                    Show this vehicle in the public catalog when active.
                  </span>
                </div>
                <input
                  className="toggle"
                  type="checkbox"
                  {...register("is_published")}
                />
              </label>
              <label className="toggle-row">
                <div>
                  <strong>Featured selection</strong>
                  <span>Include in the featured vehicle collection.</span>
                </div>
                <input
                  className="toggle"
                  type="checkbox"
                  {...register("is_featured")}
                />
              </label>
            </div>
          </FormSection>
        </div>
      </form>
      <div className="mt-6">
        <ImageUploader car={car} />
      </div>
    </>
  );
}
