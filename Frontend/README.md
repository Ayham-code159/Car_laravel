# Public car rental website

A complete React + TypeScript website for the existing Laravel rental API. All implementation, tests, configuration, and campaign assets live in `Frontend`. No backend or dashboard source files were modified.

## Run locally

Requires Node.js 24+ and npm. Dependencies are pinned by `package-lock.json`.

```powershell
cd Cars/Frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173**. Use `localhost` for the frontend: this origin is allowed by the backend's default CORS configuration. If port 5173 is occupied, the server intentionally fails instead of silently switching to an origin Laravel may reject.

In another terminal, start your existing backend using its normal setup:

```powershell
cd Cars/Backend/CarsBackend
php artisan serve --host=127.0.0.1 --port=8000
```

MySQL must be running. The website does not migrate or seed your database. Preserve the existing Laravel `.env`, keys, and credentials. If the backend is unavailable, the interface shows retryable errors rather than demo results.

The default frontend API base is `http://127.0.0.1:8000/api/v1`. Include `/api/v1` **once**, in `VITE_API_BASE_URL`. All calls are public, without Passport tokens, cookies, or authentication. Image URLs are used exactly as Laravel returns them. Laravel's `APP_URL`, storage link, and public media disk must be accessible to the browser.

## What is implemented

| Route               | Experience                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                 | Original cinematic hero, rental search, real featured cars, dynamic categories, benefits, three-step rental explanation, final CTA, contact footer          |
| `/cars`             | URL-based search/filter/sort/pagination, real availability search, desktop filters, accessible mobile drawer, result counts and recovery states             |
| `/cars/:slug`       | Real slug endpoint, responsive gallery, thumbnails, keyboard navigation/lightbox, specifications, description, related catalog vehicles, guest request form |
| Unrecognized routes | Accessible not-found state with a route back to the collection                                                                                              |

The two-step request form is attached to its vehicle: choose dates/location, then contact details and review the estimate. A successful request shows Laravel's UUID and authoritative estimate, with **pending confirmation** clearly stated. No accounts, payments, or extra content pages are included.

Feature folders separate home, cars, search, and booking. Shared layout/UI, typed API models, Axios handling, dates, money, and site configuration are centralized. Radix Dialog and Popover provide focus management, Escape handling, and accessible overlays. Native date/time inputs work alongside an accessible DayPicker calendar. Motion respects reduced-motion preferences; CSS animations do too. Gallery controls support keyboard arrows. Mobile layouts are designed independently, including a fixed booking action with reserved footer space.

Installed runtime packages: React/React DOM, React Router, TanStack Query, Axios, React Hook Form, Zod and its resolver, Radix Dialog/Popover, React DayPicker, date-fns, Lucide React, Motion, and Fontsource Manrope. Build/test packages: Vite, TypeScript, Tailwind CSS and its Vite plugin, the React Vite plugin, Vitest, Playwright, and Sharp for asset optimization. Exact versions are in `package.json` and `package-lock.json`; no gallery framework is needed for the lightweight keyboard-accessible gallery.

## Visual identity and assets

Charcoal surfaces, warm white type, restrained gold accents, Manrope interface typography, and occasional italic display type. Spacious editorial sections are paired with compact, legible vehicle cards. CSS tokens live in `src/styles/index.css`.

**The Collection** is explicitly labeled as a preview identity, not a supplied business name. Set `VITE_BUSINESS_NAME` to replace it. No contact details, customer claims, testimonials, business addresses, or social accounts have been invented. WhatsApp and other contact links remain hidden until configured.

The hero is original AI-generated campaign artwork, clearly distinguished from rental inventory. It is not a promise that the pictured car is available. Vehicle cards and galleries always use real API media. Your current seeded catalog contains demonstration placeholder images; replace those through your existing admin workflow before public launch. This site does not modify those assets.

Hero assets: `public/images/hero-desktop.webp` (~126 KB) and `hero-mobile.webp` (~78 KB). See [asset provenance and prompt](ASSETS.md). They are served locally; there are no third-party image or font requests. Fonts are self-hosted and use `font-display: swap` with unicode ranges. The hero has high fetch priority, vehicle imagery is lazy loaded where appropriate, and pages use route-level code splitting.

## Public configuration

All `VITE_` values are compiled into the public bundle. Never put secrets in them. Restart Vite after changing `.env`; rebuild for production changes.

| Variable                                  | Purpose                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`                       | Laravel public API including `/api/v1`; default `http://127.0.0.1:8000/api/v1`                                       |
| `VITE_BUSINESS_NAME`                      | Supplied company name; blank keeps the labeled preview identity                                                      |
| `VITE_TAGLINE`                            | Configurable short footer copy                                                                                       |
| `VITE_WHATSAPP_NUMBER`                    | International number with 7–15 digits, optionally leading `+`; no spaces or punctuation                              |
| `VITE_CONTACT_PHONE`                      | Display/contact telephone number                                                                                     |
| `VITE_ADDRESS`                            | Actual business address or location text                                                                             |
| `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL` | Optional real HTTP(S) profile URLs                                                                                   |
| `VITE_SITE_URL`                           | Public production origin, e.g. `https://your-domain.example`; enables canonical URLs and absolute Open Graph imagery |
| `VITE_MAX_RENTAL_DAYS`                    | Match Laravel's `RENTAL_MAX_DAYS`; default 90                                                                        |

Configuration and WhatsApp message encoding: `src/lib/config/site.ts`.

## Verified Laravel contracts

Inspected `routes/api.php`, public controllers, Form Requests, Resources, `ApiResponse`, and catalog/availability/booking/pricing services before implementation.

| Method and path (relative to API base) | Use                                                                  |
| -------------------------------------- | -------------------------------------------------------------------- |
| `GET /brands`                          | Brand names/slugs                                                    |
| `GET /categories`                      | Homepage categories and fleet filtering                              |
| `GET /locations`                       | Active pickup locations                                              |
| `GET /cars`                            | Search, availability, filters, pagination, sorting, related vehicles |
| `GET /cars/featured`                   | Featured homepage vehicles (paginated response)                      |
| `GET /cars/{slug}`                     | Full public vehicle details/media                                    |
| `POST /booking-requests`               | Guest request and pending receipt                                    |

Envelopes use `{ success, message, errors, data }`. Catalogs return arrays inside `data`. Listings return `data.items` and `data.pagination` (`currentPage`, `perPage`, `lastPage`, `total`, `from`, `to`). Resources use camelCase; requests use snake_case. Errors are an array of strings, with validation formatted as `field_name: message`; the frontend displays the overall error and maps recognized names to fields.

Supported URL/API filters: `brand`, `category`, `search` (brand/model), `model`, `location`, `min_price`, `max_price`, `transmission`, `fuel_type`, `pickup_at`, `return_at`, `sort`, `page`, and `per_page`. Fleet size is intentionally fixed to nine cards per page. The visible model control uses the backend's combined `search` field. External `model` filters are also respected and removable. Brand/category values are slugs; search locations are names, never numeric car IDs. Numeric location IDs are used only in the verified booking body.

Server-supported sorts: `newest`, `price_asc`, `price_desc`, `year_desc`, `model_asc`. Prices are compared by Laravel as listed, without currency conversion. The UI shows each car's currency and does not silently convert mixed-currency inventory.

Booking payload:

```json
{
  "car_slug": "a-real-catalog-slug",
  "customer_name": "Customer name",
  "customer_phone": "+12025550123",
  "customer_email": null,
  "pickup_location_id": 1,
  "pickup_at": "2030-01-10T07:00:00Z",
  "return_at": "2030-01-12T07:00:00Z",
  "notes": null
}
```

This is a schema example, not production fixture data. Real names/slugs/locations come from user input and the API.

Media fields are `primaryImageUrl` and `images[]` containing `url`, `thumbnailUrl`, `isPrimary`, `order`, and `id`. Missing or failed photos show an intentional fallback; unrelated stock photos are never substituted for actual inventory.

### Dates, pricing, availability, and confirmation

- Date controls display the **visitor's device timezone**, named beside the form. They serialize to UTC with seconds and `Z`, as required by Laravel. No timezone is inferred from location names: the backend has no location timezone field.
- Pickup cannot be in the past. Return must be later; both timestamps must be present together in availability searches. Client validation uses the configured maximum duration; server validation remains authoritative.
- Chargeable days are `ceil(elapsed_seconds / 86400)`, minimum one. This handles daylight-saving offsets by elapsed time, not calendar dates.
- Decimal prices are converted to integer cents using `BigInt` and multiplied exactly. UI formatting happens after calculation. The estimate shown after submission comes from Laravel, never the earlier local estimate.
- Laravel excludes overlapping **confirmed** bookings and blocked periods. Pending requests do not block availability. Back-to-back rentals are allowed. The frontend never labels an undated catalog as available.
- There is no quote endpoint, unavailable-date calendar endpoint, rental-settings endpoint, location timezone, or request-status polling endpoint. Date cells are not falsely marked available/unavailable. Server-side submission is the final availability check.
- Validation (422), conflicts (409), missing cars (404), rate limiting (429), network failures, and server failures have visible feedback. Duplicate clicks are locked while submitting, and mutations are never retried automatically.
- The API does not offer idempotency keys. After an ambiguous network failure during submission, a request may already exist; contact the rental team before resubmitting if uncertain. No customer PII is persisted to browser storage.

## Tests and verification

```powershell
npm run typecheck
npm test
npm run test:e2e
npm run test:backend
npm run test:live
npm run build
```

- **25 Vitest tests** cover rental rounding/offsets, exact monetary calculations, validation, URL state, envelope decoding, public request parameters, and the guest payload/receipt.
- **7 browser scenarios** use test-only HTTP fixtures to cover search/calendar, sorting/pagination/back navigation, galleries, success, 422 validation, 409 conflicts, errors/empty states, mobile drawer/focus handling, missing media, and 404s. Fixtures exist only in `tests`, never in production code.
- **12 isolated Laravel assertions** execute the existing Laravel kernel/controllers/services against SQLite `:memory:`: guest persistence and reference, exact pricing, flattened errors, pending/confirmed availability, conflicts, and back-to-back dates. It explicitly rejects any non-memory database configuration and does not touch development bookings. Requires the neighboring Laravel vendor directory, PHP, PDO SQLite, and BCMath.
- **1 live browser scenario** is separately opt-in (`test:live`). It reads the actual existing MySQL-backed public API and checks catalogs, filters, pagination, detail slugs, served media, and overflow at 320, 390, 768, and 1440 px. Start Laravel first. It never submits a booking.
- Playwright uses installed Microsoft Edge on Windows. On other platforms install Chromium using `npx playwright install chromium`. Test output/screenshots/traces are ignored by Git. Run browser projects sequentially because Playwright clears its output directory at startup.

Verification executed during implementation: all counts above passed, TypeScript passed, and the production build passed. Real catalog/media were verified in Edge. Booking persistence was tested against real Laravel code in isolated SQLite; no test booking was inserted into your MySQL inventory. Safari, Firefox, physical devices, and MySQL booking concurrency were not re-tested by this frontend task.

## Production and SEO

```powershell
npm run build
npm run preview
```

Deploy `dist/` to static hosting and configure **history fallback to `/index.html`** for `/cars` and `/cars/*`. Missing asset paths should return 404, not HTML. Use HTTPS for the frontend, API, and media. Configure Laravel's allowed CORS origins to your actual frontend origin using the existing backend deployment process.

Semantic headings/landmarks, route titles/descriptions, noindex on filtered fleet URLs and missing pages, meaningful alt text, optional canonical links, and Open Graph metadata are implemented. The built HTML shell gets the configured business name and home metadata before JavaScript runs.

**SEO assessment:** this remains a client-rendered Vite application. JavaScript-capable crawlers can index it, but car-specific social cards and HTML content are not server rendered. Prerendering the homepage and public car slugs would materially improve first-crawl and social sharing. It is intentionally not coupled to the default build: a reliable prerender pipeline needs a configured production origin, reachable production catalog, and regeneration when cars are published/archived. Never prerender dated availability results or booking forms with customer input. Once those deployment inputs are supplied, add a build-time snapshot step for `/` and known slugs, while retaining live query refetching. No framework migration is required.

The frontend uses logical inline spacing in most components and centralized configuration, but English copy is currently colocated with features. Arabic needs a real translation pass, suitable font, RTL gallery/calendar verification, and an agreed location timezone policy; it is not represented as already supported.

## Before public launch

1. Supply the real company name and desired contact details in `.env`.
2. Replace demo vehicle photos and review published inventory through the existing dashboard.
3. Set the production API/site URLs, match the rental-day limit, configure CORS and SPA rewrites, then rebuild.
4. Review the visitor-timezone policy; location-local display requires timezone data that the current API does not supply.
5. Perform a business-approved real request and manual confirmation with the rental team before launch.

No deployment was requested or performed. No additional backend endpoints are required for the implemented flow.
