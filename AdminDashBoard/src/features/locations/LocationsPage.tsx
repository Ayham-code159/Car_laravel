import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
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
  ActionMenu,
  ConfirmDialog,
  DataTable,
  ErrorNotice,
  ErrorState,
  Field,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { catalogApi } from "@/lib/api/services";
import { locationSchema, mapErrors } from "@/lib/validations";
import { useInvalidate } from "@/hooks/use-data";
import type { Location } from "@/types/api";
interface Values {
  name: string;
  city: string;
  country: string;
  is_active: boolean;
}
export default function LocationsPage() {
  const query = useQuery({
    queryKey: ["locations"],
    queryFn: ({ signal }) => catalogApi.locations(signal),
  });
  const invalidate = useInvalidate();
  const [editing, setEditing] = useState<Location | null>(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<Location | null>(null);
  const deletion = useMutation({
    mutationFn: (item: Location) => catalogApi.remove("locations", item.id),
    onSuccess: async () => {
      await invalidate();
      setRemove(null);
      toast.success("Location deleted.");
    },
  });
  const columns: ColumnDef<Location>[] = [
    {
      header: "Location",
      cell: ({ row: { original: v } }) => (
        <div className="catalog-item">
          <span className="catalog-icon">
            <MapPin size={18} />
          </span>
          <strong>{v.name}</strong>
        </div>
      ),
    },
    { header: "City", accessorKey: "city" },
    { header: "Country", accessorKey: "country" },
    {
      header: "Availability",
      cell: ({ row: { original: v } }) => (
        <StatusBadge value={v.isActive ? "active" : "inactive"} />
      ),
    },
    {
      header: "",
      id: "actions",
      cell: ({ row: { original: v } }) => (
        <ActionMenu
          label={`Actions for ${v.name}`}
          items={[
            {
              label: "Edit location",
              onClick: () => {
                setEditing(v);
                setOpen(true);
              },
            },
            {
              label: "Delete location",
              danger: true,
              onClick: () => {
                deletion.reset();
                setRemove(v);
              },
            },
          ]}
        />
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="YOUR NETWORK"
        title="Every place matters."
        description="Manage where journeys begin, and keep pickup information current."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={17} /> Add location
          </Button>
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PICKUP POINTS</span>
            <h2>Rental locations</h2>
          </div>
          <span className="text-muted-foreground text-sm">
            {query.data?.length || 0} locations
          </span>
        </div>
        {query.isPending ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            data={query.data}
            emptyTitle="No locations yet"
          />
        )}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Update location" : "Open a new location"}
            </DialogTitle>
            <DialogDescription>
              Inactive locations cannot be selected for new bookings.
            </DialogDescription>
          </DialogHeader>
          {open && <LocationForm item={editing} close={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
        title={`Delete ${remove?.name}?`}
        description="Locations linked to vehicles or bookings cannot be deleted. The server will preserve any location still in use."
        destructive
        confirmLabel="Delete location"
        pending={deletion.isPending}
        error={deletion.error}
        onConfirm={() => remove && deletion.mutate(remove)}
      />
    </>
  );
}
function LocationForm({
  item,
  close,
}: {
  item: Location | null;
  close: () => void;
}) {
  const invalidate = useInvalidate();
  const [error, setError] = useState<unknown>(null);
  const form = useForm<Values>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: item?.name || "",
      city: item?.city || "",
      country: item?.country || "",
      is_active: item?.isActive ?? true,
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
          await catalogApi.saveLocation(values, item?.id);
          await invalidate();
          toast.success(item ? "Location updated." : "Location created.");
          close();
        } catch (e) {
          setError(e);
          mapErrors(e, form.setError);
        }
      })}
    >
      <Field label="Location name" required error={errors.name?.message}>
        <input
          className="control"
          placeholder="e.g. Downtown branch"
          {...register("name")}
        />
      </Field>
      <div className="form-grid">
        <Field label="City" required error={errors.city?.message}>
          <input className="control" {...register("city")} />
        </Field>
        <Field label="Country" required error={errors.country?.message}>
          <input className="control" {...register("country")} />
        </Field>
      </div>
      <label className="toggle-row">
        <div>
          <strong>Accept new pickups</strong>
          <span>
            Keep this location active and selectable for new bookings.
          </span>
        </div>
        <input className="toggle" type="checkbox" {...register("is_active")} />
      </label>
      <ErrorNotice error={error} />
      <div className="dialog-actions">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save location"}
        </Button>
      </div>
    </form>
  );
}
