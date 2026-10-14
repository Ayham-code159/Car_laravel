<?php

use App\Contracts\AvailabilityServiceInterface;
use App\Contracts\BookingServiceInterface;
use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Models\Car;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$expected = getenv('CAR_RENTAL_CONCURRENCY_DATABASE');
$database = config('database.connections.mysql.database');
if (! $app->environment('testing') || ! is_string($expected)
    || ! preg_match('/^cars_api_test_[a-f0-9]{16}$/', $expected)
    || $database !== $expected || config('database.default') !== 'mysql') {
    fwrite(STDERR, 'Unsafe test database configuration.');
    exit(2);
}
echo 'READY'.PHP_EOL;
flush();
try {
    $id = (int) ($argv[2] ?? 0);
    match ($argv[1] ?? '') {
        'confirm' => app(BookingServiceInterface::class)->transition($id, BookingStatus::Confirmed),
        'manual' => app(BookingServiceInterface::class)->create([
            'car_slug' => Car::findOrFail($id)->slug, 'customer_name' => 'Concurrent demo customer',
            'customer_phone' => '+963991234567', 'pickup_location_id' => Car::findOrFail($id)->location_id,
            'pickup_at' => $argv[3], 'return_at' => $argv[4], 'status' => 'confirmed',
        ], manual: true),
        'block' => app(AvailabilityServiceInterface::class)->block($id, ['start_at' => $argv[3], 'end_at' => $argv[4], 'reason' => 'Concurrency test']),
        default => throw new InvalidArgumentException('Unknown worker action.'),
    };
    echo 'SUCCESS'.PHP_EOL;
} catch (BookingConflictException) {
    echo 'CONFLICT'.PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, get_class($e));
    exit(1);
}
