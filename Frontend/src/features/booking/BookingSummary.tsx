import { rentalDays } from "../../lib/utils/dates";
import { estimateTotal, money } from "../../lib/utils/money";
import type { Car } from "../../types/api";

export function BookingSummary({
  car,
  pickup,
  dropoff,
}: {
  car: Car;
  pickup: string;
  dropoff: string;
}) {
  const days = rentalDays(pickup, dropoff);
  const total = estimateTotal(car.pricePerDay, days);
  return (
    <div className="booking-summary">
      <div>
        <span>Daily rate</span>
        <span>{money(car.pricePerDay, car.currency)}</span>
      </div>
      <div>
        <span>Rental duration</span>
        <span>
          {days ? `${days} ${days === 1 ? "day" : "days"}` : "Select dates"}
        </span>
      </div>
      <div className="summary-total">
        <span>Estimated total</span>
        <strong>{total ? money(total, car.currency) : "—"}</strong>
      </div>
      <p>
        Each started 24-hour period counts as one rental day. This is an
        estimate; the rental service calculates the final request amount.
      </p>
    </div>
  );
}
