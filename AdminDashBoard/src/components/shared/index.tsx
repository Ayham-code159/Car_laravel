import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ApiError, errorMessage } from "@/lib/api/client";
import { titleCase, timezone } from "@/lib/format";
import type { Pagination as PaginationType } from "@/types/api";
export function PageHeader({
  eyebrow = "FLEET MANAGEMENT",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">{actions}</div>
    </div>
  );
}
export function StatCard({
  label,
  value,
  icon,
  footnote,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  footnote?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value.toLocaleString()}</div>
      {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}
export function StatusBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  return (
    <span className={cn("status-badge", `status-${value}`)}>
      <span />
      {label || titleCase(value)}
    </span>
  );
}
export function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-5">
      <span className="sr-only">Loading content</span>
      <div className="skeleton h-12 w-64" />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[1, 2, 3, 4].map((v) => (
          <div key={v} className="skeleton h-36" />
        ))}
      </div>
      <div className="skeleton h-80" />
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div role="alert" className="empty-state">
      <AlertCircle size={32} />
      <h3>We couldn’t load this view</h3>
      <p>{errorMessage(error)}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  description = "Your records will appear here.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className="error-notice" role="alert">
      <AlertCircle className="shrink-0" size={18} />
      <div>
        <p>{errorMessage(error)}</p>
        {error instanceof ApiError && error.errors.length > 0 && (
          <ul>
            {error.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {error instanceof ApiError && error.retryAfter && (
          <p>Try again in {error.retryAfter} seconds.</p>
        )}
      </div>
    </div>
  );
}
export function Field({
  label,
  error,
  children,
  hint,
  required,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="form-field">
      <label>
        <span className="field-label">
          {label}
          {required && <span className="text-primary"> *</span>}
        </span>
        {children}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      {error && (
        <p id={id} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function FormSection({
  number,
  title,
  description,
  children,
}: {
  number?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel form-section">
      <div className="section-heading">
        {number && <span className="section-number">{number}</span>}
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
}
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="control filter-select"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
export function Pagination({
  meta,
  onChange,
  disabled = false,
}: {
  meta: PaginationType;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="pagination">
      <span>
        {meta.total
          ? `${meta.from}–${meta.to} of ${meta.total} results`
          : "0 results"}
      </span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={disabled || meta.currentPage <= 1}
          onClick={() => onChange(meta.currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span>
          Page {meta.currentPage} of {Math.max(1, meta.lastPage)}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={disabled || meta.currentPage >= meta.lastPage}
          onClick={() => onChange(meta.currentPage + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
export function DataTable<T>({
  columns,
  data,
  emptyTitle,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  emptyTitle?: string;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  if (!data.length)
    return (
      <EmptyState
        title={emptyTitle || "No matching records"}
        description="Try adjusting your filters or add a new record."
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  pending = false,
  destructive = false,
  confirmLabel = "Confirm",
  error,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
  destructive?: boolean;
  confirmLabel?: string;
  error?: unknown;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ErrorNotice error={error} />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Saving…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function ActionMenu({
  label = "Actions",
  items,
}: {
  label?: string;
  items: {
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <MoreHorizontal size={19} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            disabled={item.disabled}
            className={item.danger ? "text-destructive" : undefined}
            onClick={item.onClick}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function CarImage({
  url,
  alt,
  className,
}: {
  url?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return url && failed !== url ? (
    <img
      className={cn("car-image", className)}
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(url)}
    />
  ) : (
    <div
      className={cn("car-fallback", className)}
      role="img"
      aria-label={`${alt} — image unavailable`}
    >
      <CarFront />
      <span>AUREL</span>
    </div>
  );
}
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}
export function DateRangePicker({
  start,
  end,
  onStart,
  onEnd,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  return (
    <div className="date-range">
      <Field label="Pickup from">
        <input
          className="control"
          type="datetime-local"
          value={start}
          onChange={(e) => onStart(e.target.value)}
        />
      </Field>
      <ArrowRight size={16} />
      <Field label="Pickup through">
        <input
          className="control"
          type="datetime-local"
          value={end}
          min={start}
          onChange={(e) => onEnd(e.target.value)}
        />
      </Field>
      <span className="field-hint">{timezone}</span>
    </div>
  );
}
export function BackLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}
