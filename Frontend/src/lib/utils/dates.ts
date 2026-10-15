import { addDays, format, isValid, parseISO } from "date-fns";

export const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export function toLocal(value?: string) {
  if (!value) return "";
  const date = parseISO(value);
  return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}
export function toApiDate(value: string) {
  return new Date(value).toISOString().replace(".000Z", "Z");
}
export function defaultDates() {
  const pickup = addDays(new Date(), 1);
  pickup.setHours(10, 0, 0, 0);
  return {
    pickup_at: toLocal(pickup.toISOString()),
    return_at: toLocal(addDays(pickup, 2).toISOString()),
  };
}
export function rentalDays(pickup: string, dropoff: string) {
  const seconds = (Date.parse(dropoff) - Date.parse(pickup)) / 1000;
  return Number.isFinite(seconds) && seconds > 0
    ? Math.max(1, Math.ceil(seconds / 86400))
    : 0;
}
export function prettyDate(value: string) {
  return format(parseISO(value), "dd MMM yyyy, HH:mm");
}
