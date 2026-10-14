# Car Rental REST API

Laravel 13.36 / PHP 8.3+ API for one developer-provisioned administrator and guest rental requests. All backend work lives in `Backend/CarsBackend`. The public website and dashboard are separate future React applications.

## Implementation and current setup

- Passport 13.10 personal access tokens, username login, explicit admin authorization and token revocation.
- Spatie Media Library 11.23 images, synchronous GD thumbnails, ownership checks, ordering and primary-image metadata.
- Form Requests → thin controllers → service contracts → transactional Eloquent services → API Resources and `ApiResponse`.
- Public catalog search, admin catalog/car management, guest/manual bookings, date availability and dashboard statistics.
- Additive migrations preserve the starter user columns and add nullable username and an admin flag. Cars are soft deleted; foreign keys protect booking history and catalog references.
- The existing empty MySQL database was inspected before migration. All migrations have been applied. Passport keys, the personal-access client and the storage link have been initialized.
- Demo data has been seeded: 18 brands, 4 categories, 3 demo locations, 54 cars and 54 generated placeholder images. Two cars are under maintenance, so the initial public catalog contains 52 active cars.
- The actual `.env`, database connection and application key were preserved. The administrator remains to be provisioned because `ADMIN_USERNAME` and `ADMIN_PASSWORD` were not configured.

## Requirements

PHP 8.3+ (verified with 8.4), Composer, MySQL, and the PHP extensions BCMath, GD, EXIF, Fileinfo and PDO MySQL. PDO SQLite is required for the default isolated tests. The Composer lock file pins compatible package versions; no Laravel upgrade is necessary.

Run commands from the existing application root:

```powershell
cd Backend/CarsBackend
```

On this Windows installation GD is available but disabled in the global CLI `php.ini`. Enable it for the current terminal without modifying global files:

```powershell
. ./scripts/Enable-LocalGd.ps1
php -m
```

This creates only `storage/framework/php-ini/gd.ini` and sets `PHP_INI_SCAN_DIR` for the terminal. Re-run it in each new terminal. Alternatively, enable `extension=gd` in the active global `php.ini` yourself and restart PHP. Verify the PHP runtime used by your web server separately.

Composer initially inherited unreachable proxy variables pointing at a local unused port. Removing those variables for the command process restored downloads; TLS verification stayed enabled. If the same unwanted proxy is present in your terminal:

```powershell
Remove-Item Env:HTTP_PROXY, Env:HTTPS_PROXY, Env:ALL_PROXY, Env:GIT_HTTP_PROXY, Env:GIT_HTTPS_PROXY -ErrorAction SilentlyContinue
$env:COMPOSER_CACHE_DIR = Join-Path $PWD 'storage/framework/composer-cache'
composer install
composer validate --strict
```

Keep an intentionally configured working proxy. Do not disable TLS verification. Laravel Boost is a development dependency required by this project's `AGENTS.md`.

## Initialization on another environment

Keep the existing `.env` and MySQL connection. Configure the additional variables below locally; the blank placeholders in `.env.example` are documentation, not usable admin credentials. Do not regenerate an existing application key.

Inspect the target database before applying migrations. Back up meaningful data and review the migrations before modifying a populated database. Only the normal additive migration command is needed:

```powershell
php artisan migrate:status
php artisan migrate --no-interaction
php artisan passport:keys --no-interaction
php artisan passport:client --personal --name="Car Rental Admin API" --provider=users --no-interaction
php artisan storage:link --no-interaction
```

The package migrations and configs are already published in this repository. Create Passport keys and the personal-access client once per environment. Do not overwrite keys or create duplicate clients on ordinary deploys. Passport 13 discovers the personal-access client by the `users` provider; personal-client ID/secret environment variables are not needed. The default OAuth routes are disabled so `/oauth/token` and OAuth client-management endpoints are absent. Only the application admin login issues tokens.

Never commit `.env` or `storage/*.key`. The public disk serves media through `/storage`; `APP_URL` must be the externally accessible backend URL. Windows may require Developer Mode or permission to create symlinks.

## Configuration

Existing connection/application variable names: `APP_ENV`, `APP_KEY`, `APP_URL`, `APP_DEBUG`, `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_URL`, `CACHE_STORE`, `SESSION_DRIVER`.

Additional variables:

| Name | Purpose / default |
| --- | --- |
| `ADMIN_USERNAME` | Developer-chosen username, 3–100 letters, digits, underscore, dot or hyphen |
| `ADMIN_PASSWORD` | Developer-chosen password, at least 12 characters |
| `ADMIN_TOKEN_HOURS` | Personal token lifetime, 12 hours |
| `RENTAL_MAX_DAYS` | Maximum rental duration, 90 days |
| `CAR_MAX_IMAGES` | Maximum images per vehicle, 12 |
| `CAR_MAX_UPLOADS` | Maximum files per upload, 6 |
| `CAR_IMAGE_MAX_KB` | Maximum image size, 5120 KB |
| `MEDIA_DISK` | Configured media disk, `public` |
| `IMAGE_DRIVER` | Image conversion driver, `gd` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact React origins; defaults to localhost ports 5173 and 5174 |
| `PASSPORT_PRIVATE_KEY`, `PASSPORT_PUBLIC_KEY` | Optional alternative to keys on disk |

Dates are stored in UTC. Request datetimes must include seconds and an explicit timezone: `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DDTHH:mm:ss+03:00`. JSON responses use camelCase; request bodies and filter parameters use snake_case. Prices and estimates are decimal strings with two fractional digits.

## Provisioning and rotating the administrator

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` privately in your existing `.env` or deployment environment, then:

```powershell
php artisan config:clear
php artisan admin:provision
```

Alternatively run `php artisan db:seed --class=AdminUserSeeder --no-interaction`. Both hash the password and create the administrator if absent. Ordinary reruns preserve its password. An existing administrator with a different configured username causes an error rather than creating a second administrator. Starter/non-admin user rows cannot log in or access admin routes.

For an explicit credential rotation, change the two environment settings and run:

```powershell
php artisan config:clear
php artisan admin:provision --rotate
```

Rotation updates the existing account and revokes all its access tokens. The command requires an existing administrator. No registration, password-change/reset, customer auth, or user-management APIs exist.

## Catalog and development data

```powershell
# Safe catalog only: creates the fixed brands and initial categories.
php artisan db:seed --no-interaction

# Explicit demo inventory, local/testing environments only.
. ./scripts/Enable-LocalGd.ps1
php artisan db:seed --class=DemoSeeder --no-interaction
```

`DatabaseSeeder` calls only `BrandSeeder` and `CategorySeeder`. It does not provision credentials or add fake cars. `DemoSeeder` additionally calls `LocationSeeder` and `CarSeeder`. Each of the 18 brands gets three brand-appropriate factory-generated vehicles. Stable `DEMO-*` inventory codes make reruns idempotent; existing cars are preserved and archived demo cars are not restored. The seeds refuse demo inventory and locations outside local/testing. They never delete other inventory.

Brands: BMW, BYD, Fiat, Ford, GMC, Honda, Hyundai, Jetour, Kia, MG, Mitsubishi, Nissan, Opel, Peugeot, Renault, Škoda, Toyota and Volkswagen. Categories: Economy, SUV, Luxury and Van. Model mappings are in `database/factories/CarFactory.php`.

Placeholders are generated locally using GD, marked as demo media and attached through Spatie. If GD is unavailable, demo inventory can still be seeded without images. Supply actual licensed images of your physical vehicles before publishing a real catalog. No external car images were scraped.

## Run the backend

```powershell
. ./scripts/Enable-LocalGd.ps1
php artisan serve --no-reload
```

`--no-reload` preserves terminal-only PHP configuration in the server process. The API base URL is `http://127.0.0.1:8000/api/v1`. `composer run dev` starts the same backend-only server. No Node installation or React build is required. Thumbnails run synchronously, so V1 image handling does not require a queue worker.

## Public endpoints

All paths below are relative to `/api/v1`.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/brands` | Seeded brands |
| GET | `/categories` | Categories |
| GET | `/locations` | Active pickup locations |
| GET | `/cars` | Filtered, paginated public cars |
| GET | `/cars/featured` | Filtered, paginated featured cars |
| GET | `/cars/{slug}` | Car specifications and images |
| POST | `/booking-requests` | Submit a pending guest request; returns a receipt |

Car filters: `brand` (name or slug), `model` (partial model), `search` (brand/model text), `category` (name or slug), `min_price`, `max_price`, `transmission`, `fuel_type`, `location` (location name or ID), `pickup_at`, `return_at`, `sort`, `page`, `per_page`. Dates must be provided together. Sorting: `price_asc`, `price_desc`, `newest` (default), `year_desc`, `model_asc`. Page size defaults to 15 and is limited to 100.

Only published, active, non-archived cars are visible. Date filters exclude confirmed bookings and unavailable periods. Numeric public car lookups return 404; use the catalog's `slug` for details and bookings. The returned location ID can be used for pickup selection.

Enums: transmission `automatic|manual`; fuel `petrol|diesel|hybrid|electric`; operational status `active|maintenance|inactive`; booking status `pending|confirmed|rejected|cancelled|completed`.

## Admin endpoints

Login is public; all other admin routes require `Authorization: Bearer <accessToken>` and an explicitly authorized admin account.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/admin/login` | Username/password login |
| POST | `/admin/logout` | Revoke the current access token |
| GET | `/admin/me` | Current admin ID and username |
| GET | `/admin/dashboard` | Car/booking counts and ten recent requests |
| GET, POST | `/admin/cars` | List or create vehicles |
| GET, PUT, DELETE | `/admin/cars/{id}` | Read, update or archive a vehicle |
| PATCH | `/admin/cars/{id}/status` | `operational_status` |
| PATCH | `/admin/cars/{id}/featured` | `is_featured` boolean |
| PATCH | `/admin/cars/{id}/publication` | `is_published` boolean |
| POST | `/admin/cars/{id}/images` | Multipart `images[]` uploads |
| DELETE | `/admin/cars/{id}/images/{mediaId}` | Delete an owned image |
| PATCH | `/admin/cars/{id}/images/{mediaId}/primary` | Select an owned primary image |
| PATCH | `/admin/cars/{id}/images/order` | `media_ids` in the desired order |
| POST | `/admin/cars/{id}/blocked-periods` | `start_at`, `end_at`, `reason` |
| DELETE | `/admin/blocked-periods/{id}` | Remove a date block |
| GET, POST | `/admin/categories` | List or create categories |
| PUT, DELETE | `/admin/categories/{id}` | Update or delete an unused category |
| GET, POST | `/admin/locations` | List all locations or create a location |
| PUT, DELETE | `/admin/locations/{id}` | Update or delete an unused location |
| GET, POST | `/admin/bookings` | Filter bookings or create a manual booking |
| GET | `/admin/bookings/{id}` | Customer and rental details |
| PATCH | `/admin/bookings/{id}/status` | Apply a permitted status transition |

Admin car listing supports the public search parameters plus `operational_status`, `is_published`, `is_featured` and `archived`; use `0|1` for query booleans. The default lists non-archived cars including hidden and inactive cars. `archived=1` lists archived cars; archived details remain readable. Updating an archived vehicle is disallowed.

Booking filters: `status`, `car_id`, `booking_reference`, `search` (customer name/phone), `from`, `to` (pickup datetime bounds), `page`, `per_page`. Results sort newest first.

Category bodies use `name` and optional `slug` (generated from name when omitted). Location bodies use `name`, `city`, `country`, optional `is_active`. Category/location deletion returns 409 when referenced, including by archived cars or historical bookings. Brands have no admin mutation endpoints.

Create-car required fields: `inventory_code`, `brand_id`, `category_id`, `location_id`, `model`, `year`, `price_per_day`, `currency`, `transmission`, `fuel_type`, `seats`, `luggage_count`. Optional: `slug`, `description`, `operational_status`, `is_published`, `is_featured`. A generated slug includes the brand, model and inventory code. Updates accept supplied fields without resetting omitted ones; generated slugs remain stable unless explicitly updated. Monetary input must be positive with at most two decimal places.

Images accept actual JPEG, PNG and WebP content, up to 5 MB each and 6000×6000 pixels. SVG/GIF and spoofed images are rejected. Uploads receive random safe filenames. The first upload becomes primary; selecting primary clears previous primary metadata. Deleting primary promotes the first remaining image. Reordering requires every image owned by that car exactly once and does not change the primary selection. Failed conversions clean up partially created media/files.

## Booking, availability and pricing rules

Guest requests require `car_slug`, `customer_name`, `customer_phone`, `pickup_location_id`, `pickup_at`, `return_at`; optional `customer_email` and `notes`. Guest-supplied status and estimate fields are ignored. Guest responses contain only the booking reference, pending status, estimate and currency. There is no public booking lookup.

Manual bookings accept the same payload plus optional `status` (`pending` by default or `confirmed`). An admin can manually book a hidden active car. Inactive/archived vehicles and inactive pickup locations cannot be booked.

- Pending → confirmed, rejected or cancelled.
- Confirmed → cancelled or completed. Completion is allowed after the return timestamp.
- Rejected, cancelled and completed are terminal; repeated/invalid transitions return 409.
- A past pending pickup cannot be confirmed. There is no automatic confirmation, payment or notification workflow.
- Pending requests do not reserve inventory. Confirmation rechecks availability under a car-row lock within a database transaction. Confirmed manual creation and date-block insertion use the same car lock. Overlapping blocks are also rejected.
- Rental intervals are half open: `[pickup_at, return_at)`. Overlap means `existing_start < requested_end && existing_end > requested_start`, so back-to-back rentals are allowed.
- Operational status, publication and date availability are separate. Archived cars keep bookings and images. Rejecting or cancelling a booking releases its dates.
- Chargeable days are the duration in seconds divided by 86400, rounded up, minimum one. BCMath computes the estimate without floating-point arithmetic. Estimate and currency are saved at creation and remain unchanged when car prices change.

Login is limited to five attempts per minute per IP and per username. Guest requests are limited to five per minute per IP. All application API routes have a general 120-per-minute IP limit. Rate-limit responses include `Retry-After`.

## Responses and errors

```json
{
  "success": true,
  "message": "Car created successfully.",
  "errors": [],
  "data": { "id": 1, "slug": "toyota-corolla-vehicle-001", "pricePerDay": "40.00" }
}
```

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": ["price_per_day: The price per day field must be greater than 0."],
  "data": null
}
```

Paginated `data` is `{ "items": [...], "pagination": { "currentPage": 1, "perPage": 15, "lastPage": 4, "total": 54, "from": 1, "to": 15 } }`, with no nested `data.data`. Pagination examples show the structure; actual public totals depend on publication/status/date filters.

Status codes: 200 reads/updates/deletes, 201 creation, 401 invalid/missing auth, 403 unauthorized account, 404 missing resources, 405 unsupported methods, 409 conflicts, 422 validation, 429 throttling, 500 unexpected errors. Unexpected messages and traces are hidden from API clients even in debug mode; Laravel reports unexpected exceptions through its configured logger.

## Try with Postman or curl

Import `docs/car-rental.postman_collection.json` into Postman. Set `baseUrl`, `adminUsername`, `adminPassword`, `carSlug`, `pickupLocationId`, future `pickupAt`/`returnAt`, and the admin IDs for mutation requests. The login request saves its access token into the collection variable `adminToken`; the token is not written into the collection file. Use demo inventory to obtain real slugs and IDs.

Shell examples (use `curl.exe` on Windows PowerShell, where `curl` may alias another command):

```sh
curl -H "Accept: application/json" "http://127.0.0.1:8000/api/v1/cars?brand=toyota&sort=price_asc&per_page=10"
curl -H "Accept: application/json" "http://127.0.0.1:8000/api/v1/cars/toyota-corolla-demo-toyota-1"
```

Create a local `login.json` containing your privately chosen username/password, then:

```sh
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" --data-binary @login.json http://127.0.0.1:8000/api/v1/admin/login
curl -H "Authorization: Bearer <accessToken>" -H "Accept: application/json" http://127.0.0.1:8000/api/v1/admin/dashboard
```

Keep credential/token files outside Git. A guest `booking.json` example (replace dates with future datetimes and the location ID with a returned active location):

```json
{
  "car_slug": "toyota-corolla-demo-toyota-1",
  "customer_name": "Demo Customer",
  "customer_phone": "+963991234567",
  "customer_email": "demo@example.test",
  "pickup_location_id": 1,
  "pickup_at": "2030-01-10T10:00:00Z",
  "return_at": "2030-01-12T10:00:00Z",
  "notes": "Please prepare the vehicle."
}
```

```sh
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" --data-binary @booking.json http://127.0.0.1:8000/api/v1/booking-requests
curl -X PATCH -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" --data-binary @status.json http://127.0.0.1:8000/api/v1/admin/bookings/1/status
curl -X POST -H "Authorization: Bearer <accessToken>" -H "Accept: application/json" -F "images[]=@front.jpg" -F "images[]=@rear.png" http://127.0.0.1:8000/api/v1/admin/cars/1/images
```

`status.json` contains `{ "status": "confirmed" }`. A successful guest submission remains pending until this administrator action succeeds.

## Tests and verification

```powershell
. ./scripts/Enable-LocalGd.ps1
php artisan config:clear
php vendor/phpunit/phpunit/phpunit
```

The default PHPUnit configuration forces SQLite `:memory:`, clears `DB_URL`, uses a test-only application key and generates ephemeral Passport keys in memory. The base test case rejects any other database configuration before database-refresh traits run. Media tests and demo-seeder tests use a fake public disk. Never repoint these tests at a development database.

Real MySQL concurrency tests are separate and opt-in:

```powershell
$env:RUN_MYSQL_CONCURRENCY_TESTS = '1'
php vendor/phpunit/phpunit/phpunit tests/Integration
Remove-Item Env:RUN_MYSQL_CONCURRENCY_TESTS
```

These require your MySQL account to create/drop temporary databases. Each test creates a randomly named `cars_api_test_*` schema, migrates only that owned schema, starts two independent PHP worker processes, and tests competing confirmations/manual bookings/date blocks. Cleanup drops only the exact schema created by the test; it never targets the configured development database. Worker code refuses any database without the exact generated test name. Interrupting an integration test may leave a temporary test schema for manual inspection/cleanup.

Verified on 2026-10-14: **50 unit/feature tests passed (654 assertions)** and **3 real MySQL concurrency tests passed (24 assertions)**. No tests remain failing or skipped in those executed runs. PHP syntax checks passed for 135 files. Composer validation/platform checks, Pint formatting and route caching succeeded. Live HTTP checks verified the public catalog, car details, image serving and a standardized 401 response without an `Accept` header. Ordinary demo seeding was rerun against MySQL without duplicating the 18 brands, 54 cars or 54 images.

Validation commands also include `composer validate --strict`, `composer check-platform-reqs`, PHP syntax checks, Pint formatting and `php artisan route:list --path=api`. Pint's `--dirty` option cannot run here because the workspace has no Git metadata; full-project formatting was used instead.

## Production notes

Serve `public/` behind HTTPS and configure `APP_URL`, `APP_DEBUG=false`, exact allowed React origins, persistent cache storage for throttling, and writable Laravel/media storage. Enable GD and the required extensions in the production PHP runtime. Keep OAuth keys and environment secrets outside source control. Configure trusted proxies for your actual deployment if a reverse proxy terminates HTTPS; do not trust arbitrary forwarded headers.

Use `php artisan config:cache` and `php artisan route:cache` after configuration is complete. The normal seed command provisions only reference catalogs; create real locations and inventory through admin routes. Supply real vehicle photos and review demo publication before exposing a deployment. No React UI, customer auth, payments, email notifications, coupons or unrelated content-management modules are included.
