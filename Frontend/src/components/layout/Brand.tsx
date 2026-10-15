import { Link } from "react-router-dom";
import { site } from "../../lib/config/site";
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label={`${site.name} home`}>
      <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M43 12a23 23 0 1 0 0 40M49 19a16 16 0 1 0 0 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <span>
        <strong>{site.name}</strong>
        <small>
          {site.isPreview ? "RENTAL WEBSITE · PREVIEW" : "PREMIUM CAR RENTAL"}
        </small>
      </span>
    </Link>
  );
}
