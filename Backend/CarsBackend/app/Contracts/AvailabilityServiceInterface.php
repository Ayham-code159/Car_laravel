<?php

namespace App\Contracts;

use App\Models\Car;
use App\Models\CarUnavailablePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

interface AvailabilityServiceInterface
{
    public function isAvailable(Car $car, CarbonImmutable $start, CarbonImmutable $end, ?int $ignoreBookingId = null): bool;

    public function filterAvailable(Builder $query, CarbonImmutable $start, CarbonImmutable $end, ?int $ignoreBookingId = null): Builder;

    public function block(int $carId, array $data): CarUnavailablePeriod;

    public function removeBlock(int $id): void;
}
