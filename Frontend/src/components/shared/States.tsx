import { CarFront, CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "../ui/Primitives";
import { ApiError } from "../../lib/api/client";

export function ErrorState({
  error,
  retry,
  title = "A small detour.",
}: {
  error: unknown;
  retry?: () => void;
  title?: string;
}) {
  return (
    <div className="state error-state" role="alert">
      <CircleAlert size={28} />
      <h3>{title}</h3>
      <p>
        {error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."}
      </p>
      {error instanceof ApiError && error.errors.length > 0 && (
        <ul>
          {error.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {retry && (
        <Button variant="outline" onClick={retry}>
          <RefreshCw size={15} />
          Try again
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "A different journey awaits.",
  message = "No vehicles match these filters. Try another date or explore the complete collection.",
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state">
      <CarFront size={32} />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
export function CarSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="car-grid" aria-busy="true" aria-label="Loading vehicles">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function PageLoading() {
  return (
    <div className="container page-loading" role="status">
      <span className="loading-mark" />
      Preparing your next journey…
    </div>
  );
}
