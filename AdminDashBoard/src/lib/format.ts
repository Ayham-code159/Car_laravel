import { format } from "date-fns";
import type { Booking, BookingStatus } from "@/types/api";
export const money = (value: string | number, currency: string) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(Number(value));
export const dateTime = (value: string) =>
  format(new Date(value), "dd MMM yyyy · HH:mm");
export const toApiDate = (value: string) =>
  new Date(value).toISOString().replace(/\.\d{3}Z$/, "Z");
export const localDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");
export const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (s) => s.toUpperCase());
export const overlaps = (
  start: string,
  end: string,
  otherStart: Date,
  otherEnd: Date,
) => new Date(start) < otherEnd && new Date(end) > otherStart;
export function validActions(
  booking: Booking,
  now = Date.now(),
): BookingStatus[] {
  if (booking.status === "pending")
    return [
      ...(new Date(booking.pickupAt).getTime() > now &&
      booking.car.operationalStatus === "active" &&
      !booking.car.archivedAt &&
      booking.pickupLocation.isActive
        ? ["confirmed" as const]
        : []),
      "rejected",
      "cancelled",
    ];
  if (booking.status === "confirmed")
    return [
      "cancelled",
      ...(new Date(booking.returnAt).getTime() <= now
        ? ["completed" as const]
        : []),
    ];
  return [];
}
export function whatsapp(phone: string) {
  const normalized = phone.replace(/[ ()-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(normalized)
    ? `https://wa.me/${normalized.slice(1)}`
    : null;
}
