<?php

// Runs the EXISTING Laravel routes, validation, resources, and services against
// SQLite :memory:. It cannot write to the configured development MySQL database.
declare(strict_types=1);

$backend = realpath(__DIR__.'/../../Backend/CarsBackend');
if ($backend === false || ! extension_loaded('pdo_sqlite')) {
    fwrite(STDERR, "Existing Laravel checkout and PDO SQLite are required.\n");
    exit(1);
}
foreach (['APP_ENV' => 'testing', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:', 'DB_URL' => '', 'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'LOG_CHANNEL' => 'stderr'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}
require $backend.'/vendor/autoload.php';
$app = require $backend.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();
config([
    'database.default' => 'sqlite',
    'database.connections.sqlite.database' => ':memory:',
    'database.connections.sqlite.url' => null,
    'cache.default' => 'array', 'session.driver' => 'array', 'logging.default' => 'stderr',
]);
Illuminate\Support\Facades\DB::purge();
if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
    throw new RuntimeException('Refusing any database except in-memory SQLite.');
}
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
$brand = App\Models\Brand::create(['name' => 'Test Brand', 'slug' => 'test-brand']);
$category = App\Models\Category::create(['name' => 'Test Luxury', 'slug' => 'test-luxury']);
$location = App\Models\Location::create(['name' => 'Test Branch', 'city' => 'Test City', 'country' => 'Test Country', 'is_active' => true]);
$car = App\Models\Car::create([
    'brand_id' => $brand->id, 'category_id' => $category->id, 'location_id' => $location->id,
    'inventory_code' => 'FRONTEND-TEST-ONLY', 'model' => 'Test Coupe', 'slug' => 'test-coupe', 'year' => 2025,
    'price_per_day' => '125.10', 'currency' => 'USD', 'transmission' => 'automatic', 'fuel_type' => 'petrol',
    'seats' => 4, 'luggage_count' => 2, 'operational_status' => 'active', 'is_published' => true, 'is_featured' => true,
]);
$checks = 0;
$assert = function (bool $condition, string $message) use (&$checks): void {
    if (! $condition) { throw new RuntimeException($message); }
    $checks++;
};
$send = function (string $method, string $path, array $data = []) use ($kernel): array {
    $request = Illuminate\Http\Request::create('/api/v1/'.$path, $method, $method === 'GET' ? $data : [], [], [], ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '127.0.0.1'], $method === 'POST' ? json_encode($data) : null);
    $response = $kernel->handle($request);
    $body = json_decode($response->getContent(), true, flags: JSON_THROW_ON_ERROR);
    $kernel->terminate($request, $response);
    return [$response->getStatusCode(), $body];
};
$pickup = Carbon\CarbonImmutable::now('UTC')->addDays(3)->startOfMinute();
$return = $pickup->addDay()->addMinute();
$payload = [
    'car_slug' => $car->slug, 'customer_name' => 'Frontend Contract Test', 'customer_phone' => '+12025550123',
    'customer_email' => null, 'pickup_location_id' => $location->id, 'notes' => null,
    'pickup_at' => $pickup->format('Y-m-d\TH:i:s\Z'), 'return_at' => $return->format('Y-m-d\TH:i:s\Z'),
];
[$status, $body] = $send('GET', 'cars', ['brand' => 'test-brand', 'category' => 'test-luxury', 'location' => 'Test Branch', 'sort' => 'price_asc']);
$assert($status === 200 && $body['data']['pagination']['total'] === 1, 'Catalog filters must use the documented human-readable values.');
[$status, $body] = $send('GET', 'cars/test-coupe');
$assert($status === 200 && $body['data']['pricePerDay'] === '125.10', 'Detail resource must expose decimal pricePerDay.');
[$status, $body] = $send('POST', 'booking-requests', array_replace($payload, ['pickup_at' => $pickup->format('Y-m-d\TH:i')]));
$assert($status === 422 && str_starts_with($body['errors'][0], 'pickup_at:'), 'Missing timezone must produce flattened validation errors.');
[$status, $body] = $send('POST', 'booking-requests', $payload);
$assert($status === 201, 'Valid guest request must be accepted by real Laravel.');
$assert($body['data']['status'] === 'pending', 'Receipt must remain pending.');
$assert($body['data']['estimatedTotal'] === '250.20', 'Started rental days must round up and calculate exact decimals.');
$assert(Illuminate\Support\Str::isUuid($body['data']['bookingReference']), 'Receipt must include the actual UUID reference.');
$assert(App\Models\Booking::where('booking_reference', $body['data']['bookingReference'])->exists(), 'Request must be persisted in isolated SQLite.');
[$status, $body] = $send('GET', 'cars', ['pickup_at' => $payload['pickup_at'], 'return_at' => $payload['return_at']]);
$assert($status === 200 && $body['data']['pagination']['total'] === 1, 'Pending bookings must not block availability.');
App\Models\Booking::query()->update(['status' => 'confirmed']);
[$status, $body] = $send('POST', 'booking-requests', $payload);
$assert($status === 409 && $body['success'] === false, 'Confirmed overlap must return a conflict.');
[$status, $body] = $send('GET', 'cars', ['pickup_at' => $payload['pickup_at'], 'return_at' => $payload['return_at']]);
$assert($status === 200 && $body['data']['pagination']['total'] === 0, 'Date search must exclude confirmed overlaps.');
[$status, $body] = $send('GET', 'cars', ['pickup_at' => $payload['return_at'], 'return_at' => $return->addDay()->format('Y-m-d\TH:i:s\Z')]);
$assert($status === 200 && $body['data']['pagination']['total'] === 1, 'Back-to-back rentals must remain possible.');
echo "Passed {$checks} assertions against existing Laravel code using SQLite :memory:. No development data changed.\n";
