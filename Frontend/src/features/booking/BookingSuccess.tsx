import { ArrowUpRight, Check, MessageCircle } from "lucide-react";
import type { BookingReceipt } from "../../types/api";
import { money } from "../../lib/utils/money";
import { ButtonLink, Eyebrow } from "../../components/ui/Primitives";
import { whatsappUrl } from "../../lib/config/site";

export function BookingSuccess({ receipt }: { receipt: BookingReceipt }) {
  const whatsapp = whatsappUrl(
    `Hello, I would like to follow up on rental request ${receipt.bookingReference}.`,
  );
  return (
    <div
      className="booking-success"
      role="status"
      tabIndex={-1}
      ref={(node) => node?.focus()}
    >
      <div className="success-mark">
        <Check size={30} />
      </div>
      <Eyebrow>THE NEXT CHAPTER</Eyebrow>
      <h2>
        Your request
        <br />
        is on its way.
      </h2>
      <p>
        Your rental request has been received. The team will contact you to
        confirm availability and finalize the details.
      </p>
      <span className="pending-pill">Pending confirmation</span>
      <div className="receipt">
        <span>Your booking reference</span>
        <strong>{receipt.bookingReference}</strong>
        <span>Estimated rental total</span>
        <b>{money(receipt.estimatedTotal, receipt.currency)}</b>
      </div>
      <p className="small-text">
        Please keep this reference. Your request does not reserve or guarantee
        the vehicle until the rental team confirms it.
      </p>
      <ButtonLink to="/cars">
        Browse more cars
        <ArrowUpRight size={17} />
      </ButtonLink>
      <ButtonLink variant="ghost" to="/">
        Return home
      </ButtonLink>
      {whatsapp && (
        <a
          className="text-link"
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={17} />
          Contact the team
        </a>
      )}
    </div>
  );
}
