import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Tags } from "lucide-react";
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
} from "@/components/shared";
import { catalogApi } from "@/lib/api/services";
import { categorySchema, mapErrors } from "@/lib/validations";
import { useInvalidate } from "@/hooks/use-data";
import type { Category } from "@/types/api";
interface Values {
  name: string;
  slug: string;
}
export default function CategoriesPage() {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => catalogApi.categories(signal),
  });
  const invalidate = useInvalidate();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<Category | null>(null);
  const deletion = useMutation({
    mutationFn: (item: Category) => catalogApi.remove("categories", item.id),
    onSuccess: async () => {
      await invalidate();
      setRemove(null);
      toast.success("Category deleted.");
    },
  });
  const columns: ColumnDef<Category>[] = [
    {
      header: "Category",
      cell: ({ row: { original: v } }) => (
        <div className="catalog-item">
          <span className="catalog-icon">
            <Tags size={18} />
          </span>
          <strong>{v.name}</strong>
        </div>
      ),
    },
    {
      header: "Slug",
      accessorKey: "slug",
      cell: ({ getValue }) => <code>{String(getValue())}</code>,
    },
    {
      header: "",
      id: "actions",
      cell: ({ row: { original: v } }) => (
        <ActionMenu
          label={`Actions for ${v.name}`}
          items={[
            {
              label: "Edit category",
              onClick: () => {
                setEditing(v);
                setOpen(true);
              },
            },
            {
              label: "Delete category",
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
        eyebrow="CATALOG STRUCTURE"
        title="Organize with intention."
        description="Create clear categories that help guests find the right vehicle."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={17} /> Add category
          </Button>
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR CATEGORIES</span>
            <h2>Vehicle groups</h2>
          </div>
          <span className="text-muted-foreground text-sm">
            {query.data?.length || 0} categories
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
            emptyTitle="No categories yet"
          />
        )}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Refine this category" : "A new category"}
            </DialogTitle>
            <DialogDescription>
              Names and slugs must be unique across the catalog.
            </DialogDescription>
          </DialogHeader>
          {open && <CategoryForm item={editing} close={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
        title={`Delete ${remove?.name}?`}
        description="Categories assigned to vehicles cannot be deleted. If this category is in use, the server will keep it and explain the conflict."
        destructive
        confirmLabel="Delete category"
        pending={deletion.isPending}
        error={deletion.error}
        onConfirm={() => remove && deletion.mutate(remove)}
      />
    </>
  );
}
function CategoryForm({
  item,
  close,
}: {
  item: Category | null;
  close: () => void;
}) {
  const invalidate = useInvalidate();
  const [error, setError] = useState<unknown>(null);
  const form = useForm<Values>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: item?.name || "", slug: item?.slug || "" },
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
          await catalogApi.saveCategory(values, item?.id);
          await invalidate();
          toast.success(item ? "Category updated." : "Category created.");
          close();
        } catch (e) {
          setError(e);
          mapErrors(e, form.setError);
        }
      })}
    >
      <Field label="Name" required error={errors.name?.message}>
        <input
          className="control"
          placeholder="e.g. Economy"
          {...register("name")}
        />
      </Field>
      <Field
        label="Slug"
        required
        error={errors.slug?.message}
        hint="Lowercase words joined by hyphens, e.g. luxury-suv."
      >
        <input
          className="control"
          placeholder="e.g. economy"
          {...register("slug")}
        />
      </Field>
      <ErrorNotice error={error} />
      <div className="dialog-actions">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save category"}
        </Button>
      </div>
    </form>
  );
}
