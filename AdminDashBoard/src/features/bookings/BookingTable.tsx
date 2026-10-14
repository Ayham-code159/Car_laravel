import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, StatusBadge } from "@/components/shared";
import { dateTime, money } from "@/lib/format";
import type { Booking } from "@/types/api";
const columns: ColumnDef<Booking>[] = [
  {
    header: "Reservation / Customer",
    cell: ({ row: { original: b } }) => (
      <Link to={`/bookings/${b.id}`} className="table-person">
        <strong>{b.customerName}</strong>
        <span title={b.bookingReference}>
          {b.bookingReference.slice(0, 8).toUpperCase()}
        </span>
      </Link>
    ),
  },
  {
    header: "Vehicle",
    cell: ({ row: { original: b } }) => (
      <div>
        <strong>
          {b.car.brand.name} {b.car.model}
        </strong>
        <p className="table-secondary">{b.car.inventoryCode}</p>
      </div>
    ),
  },
  {
    header: "Rental period",
    cell: ({ row: { original: b } }) => (
      <div className="table-dates">
        <span>{dateTime(b.pickupAt)}</span>
        <span>{dateTime(b.returnAt)}</span>
      </div>
    ),
  },
  { header: "Phone", accessorKey: "customerPhone" },
  {
    header: "Estimate",
    cell: ({ row: { original: b } }) => (
      <span className="money">
        {money(b.estimatedTotal, b.currency)} <small>{b.currency}</small>
      </span>
    ),
  },
  {
    header: "Status",
    cell: ({ row: { original: b } }) => <StatusBadge value={b.status} />,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row: { original: b } }) => (
      <Link
        to={`/bookings/${b.id}`}
        className="icon-link"
        aria-label={`View booking for ${b.customerName}`}
      >
        <ArrowUpRight size={17} />
      </Link>
    ),
  },
];
export default function BookingTable({ bookings }: { bookings: Booking[] }) {
  return (
    <DataTable
      columns={columns}
      data={bookings}
      emptyTitle="No reservations to display"
    />
  );
}
