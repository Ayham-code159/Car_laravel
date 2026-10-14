# Aurel — Car Rental Admin Dashboard

Aurel is the React + TypeScript administration interface for the existing Laravel car rental API in `../Backend/CarsBackend`. It manages fleet inventory, vehicle galleries, bookings, maintenance periods, categories and locations. The public website lives elsewhere.

## Local setup

Use Node.js 24+ (verified with Node 24.11.1) and npm. From `Cars/AdminDashBoard`:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5174`. The fixed localhost port matches the Laravel backend's default `CORS_ALLOWED_ORIGINS` entry. Start the backend separately from `Backend/CarsBackend` with `php artisan serve --no-reload`. Set `VITE_API_BASE_URL` in the dashboard's `.env` to the Laravel API root, such as `http://127.0.0.1:8000/api/v1`. The client adds `/api/v1` only when missing, so it never duplicates the prefix. For another dashboard origin, add that **exact** origin to the backend's `CORS_ALLOWED_ORIGINS` configuration through normal deployment setup.

The Laravel README documents backend initialization and administrator provisioning. The existing environment reported no provisioned administrator; set `ADMIN_USERNAME` and `ADMIN_PASSWORD` privately in the backend environment and run `php artisan admin:provision` there before trying to log in. This dashboard does not create an administrator or change MySQL data during setup. The existing backend storage link serves car media; if deploying elsewhere, follow its `php artisan storage:link` instructions. Images are returned through Spatie Media Library, and missing images use an intentional local visual fallback.

The sample `.env.example` contains only public frontend settings. `VITE_IMAGE_BATCH_LIMIT`, `VITE_IMAGE_TOTAL_LIMIT`, `VITE_IMAGE_MAX_MB`, and `VITE_MAX_RENTAL_DAYS` mirror the backend defaults (6, 12, 5 MB, 90 days). If backend rental limits change, update these dashboard values so early validation stays aligned. Laravel remains the final validator.

## Application routes

| Route            | Purpose                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `/login`         | Username/password admin login                                                        |
| `/dashboard`     | Live fleet and booking counts, recent reservations, actual fleet-status distribution |
| `/cars`          | Filtered, sorted, paginated vehicle inventory and management actions                 |
| `/cars/new`      | Create a physical rental car                                                         |
| `/cars/:id/edit` | Update details, upload/reorder/remove images and choose a primary image              |
| `/bookings`      | Search/filter/paginate bookings and create a manual reservation                      |
| `/bookings/:id`  | Customer, vehicle, rental and price details with valid status actions                |
| `/availability`  | Selected-car monthly schedule, confirmed bookings and date blocks                    |
| `/categories`    | Category CRUD                                                                        |
| `/locations`     | Location CRUD and active status                                                      |

All application routes except `/login` require a Laravel Passport bearer token. The token and expiry are kept in `sessionStorage` for this browser tab. This is a pragmatic SPA session, but JavaScript-readable storage remains exposed to XSS; enforce a strong CSP and review third-party scripts before production deployment. No refresh token or cookie authentication is assumed. The app calls `/admin/me`, clears the local session on 401 or expiry, and revokes the current token on logout. If the logout request fails, the local session is cleared and a warning explains that server revocation could not be verified.

## Laravel API integration

The client reads Laravel's envelope `{ "success": true, "message": "...", "errors": [], "data": ... }`. List responses contain `data.items` and `data.pagination` with `currentPage`, `perPage`, `lastPage`, `total`, `from`, and `to`. Request fields are snake_case; resource fields are camelCase. Laravel error arrays such as `"price_per_day: The price field is required."` are mapped to form fields. HTTP 401, 409, 422 and 429 receive distinct useful handling. Dates submitted from `datetime-local` inputs are normalized to explicit UTC with seconds, as the API requires.

| Feature            | Verified endpoints under `/api/v1`                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication     | `POST /admin/login`, `GET /admin/me`, `POST /admin/logout`                                                                                                                                   |
| Overview           | `GET /admin/dashboard`                                                                                                                                                                       |
| Catalog options    | `GET /brands`, `GET /admin/categories`, `GET /admin/locations`                                                                                                                               |
| Vehicles           | `GET/POST /admin/cars`, `GET/PUT/DELETE /admin/cars/{id}`, `PATCH /admin/cars/{id}/status`, `/publication`, `/featured`                                                                      |
| Gallery            | `POST /admin/cars/{id}/images` (`images[]` multipart), `DELETE /admin/cars/{id}/images/{mediaId}`, `PATCH /admin/cars/{id}/images/{mediaId}/primary`, `PATCH /admin/cars/{id}/images/order`  |
| Bookings           | `GET/POST /admin/bookings`, `GET /admin/bookings/{id}`, `PATCH /admin/bookings/{id}/status`                                                                                                  |
| Availability       | `GET /admin/cars/{id}` includes `blockedPeriods`, paginated `GET /admin/bookings?car_id=...&status=confirmed`, `POST /admin/cars/{id}/blocked-periods`, `DELETE /admin/blocked-periods/{id}` |
| Catalog management | `POST/PUT/DELETE /admin/categories[/{id}]`, `POST/PUT/DELETE /admin/locations[/{id}]`                                                                                                        |

The calendar retrieves _all pages_ of confirmed bookings for the selected vehicle, so a rental that began before the visible month still appears. Its current safety cap is 5,000 bookings per vehicle; beyond that it shows an explicit error instead of a misleading empty schedule. A future server-side interval-overlap endpoint would be useful for very large histories. Booking list date filters refer to **pickup timestamps** as implemented by Laravel. The API exposes aggregate dashboard counts but no historical trend series, so the dashboard shows a real fleet-status distribution rather than a synthetic trend chart. Category and location vehicle counts are not exposed and are not shown.

Only `pending → confirmed/rejected/cancelled` and `confirmed → cancelled/completed` are allowed. Completion requires the scheduled return to have passed. Confirmation and maintenance blocks are rechecked for conflicts by the backend inside transactions. The UI reports 409 responses and does not present pending requests as reserved vehicles. Car archival keeps booking history; daily rates displayed on a car are current while each booking's estimate remains the stored historical snapshot.

Example login (PowerShell):

```powershell
$body = @{ username = 'your-admin-username'; password = 'your-private-password' } | ConvertTo-Json
$result = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/admin/login' -Method Post -ContentType 'application/json' -Body $body
$token = $result.data.accessToken
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/admin/dashboard' -Headers @{ Authorization = "Bearer $token" }
```

Example vehicle create body (the dashboard submits this through its form):

```json
{
  "inventory_code": "BMW-101",
  "brand_id": 1,
  "category_id": 3,
  "location_id": 1,
  "model": "320i",
  "year": 2024,
  "price_per_day": "110.00",
  "currency": "USD",
  "transmission": "automatic",
  "fuel_type": "petrol",
  "seats": 5,
  "luggage_count": 2,
  "operational_status": "active",
  "is_published": false,
  "is_featured": false
}
```

## Checks

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
```

The Vitest suite covers token lifecycle, protected navigation, API envelopes and errors, booking and vehicle validation, image upload format, date conversion, and valid status actions. Playwright tests use clearly labeled **test-only** API fixtures to check route navigation and mobile layout. On Windows, they use an installed Microsoft Edge; on other systems run `npx playwright install chromium` first. There are no mock records in production source. Browser tests and live authenticated end-to-end verification depend on a launchable local browser and a provisioned Laravel administrator respectively. Current verification status is reported in the delivery note; a production build alone does not prove server connectivity.

The Vite scripts include a local-drive workaround for this Windows sandbox, which blocks Vite's optional `net use` probe. It intercepts only that probe and does not alter network security or TLS. The dashboard connects directly to the configured Laravel API at runtime.
