import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DateRangePicker,
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
} from "@/components/shared";
import { bookingApi } from "@/lib/api/services";
import { titleCase, toApiDate } from "@/lib/format";
import { useDebounce } from "@/hooks/use-data";
import BookingTable from "./BookingTable";
import ManualBookingDialog from "./ManualBookingDialog";
const statuses = ["pending", "confirmed", "rejected", "cancelled", "completed"];
export default function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const term = useDebounce(search);
  const status = statuses.includes(params.get("status") || "")
    ? params.get("status")!
    : "";
  const invalid = !!(from && to && new Date(to) < new Date(from));
  const query = useQuery({
    queryKey: ["bookings", "list", term, status, from, to, page],
    queryFn: ({ signal }) =>
      bookingApi.list(
        {
          search: term || undefined,
          status: status || undefined,
          from: from ? toApiDate(from) : undefined,
          to: to ? toApiDate(to) : undefined,
          page,
          per_page: 15,
        },
        signal,
      ),
    enabled: !invalid,
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="RESERVATION DESK"
        title="Every journey, accounted for."
        description="From the first request to the final handover. Keep it all in view."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} /> New reservation
          </Button>
        }
      />
      <section className="panel">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search customer name or phone…"
          />
          <SelectFilter
            label="All booking statuses"
            value={status}
            onChange={(v) => {
              setParams(v ? { status: v } : {});
              setPage(1);
            }}
            options={statuses.map((v) => ({ value: v, label: titleCase(v) }))}
          />
        </FilterBar>
        <div className="px-6 pb-5">
          <DateRangePicker
            start={from}
            end={to}
            onStart={(v) => {
              setFrom(v);
              setPage(1);
            }}
            onEnd={(v) => {
              setTo(v);
              setPage(1);
            }}
          />
          {invalid && (
            <p role="alert" className="field-error">
              The end of the pickup window must follow its start.
            </p>
          )}
        </div>
        {query.isPending ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <div
            aria-busy={query.isFetching}
            className={query.isPlaceholderData || invalid ? "opacity-50" : ""}
          >
            <BookingTable bookings={query.data.items} />
            <Pagination
              meta={query.data.pagination}
              onChange={setPage}
              disabled={query.isPlaceholderData || invalid}
            />
          </div>
        )}
      </section>
      <ManualBookingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
