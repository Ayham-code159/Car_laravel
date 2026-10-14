<?php

namespace App\Services;

use App\Contracts\AvailabilityServiceInterface;
use App\Enums\BookingStatus;
use App\Enums\OperationalStatus;
use App\Exceptions\BookingConflictException;
use App\Models\Car;
use App\Models\CarUnavailablePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AvailabilityService implements AvailabilityServiceInterface
{
    public function isAvailable(Car $car, CarbonImmutable $start, CarbonImmutable $end, ?int $ignoreBookingId = null): bool
    {
        return ! $car->trashed() && $car->operational_status === OperationalStatus::Active
            && $this->filterAvailable(Car::whereKey($car->id), $start, $end, $ignoreBookingId)->exists();
    }

    public function filterAvailable(Builder $query, CarbonImmutable $start, CarbonImmutable $end, ?int $ignoreBookingId = null): Builder
    {
        if ($end <= $start) {
            throw new InvalidArgumentException('End must be after start.');
        }
        $start = $start->utc()->format('Y-m-d H:i:s');
        $end = $end->utc()->format('Y-m-d H:i:s');

        return $query->whereDoesntHave('bookings', function (Builder $bookings) use ($start, $end, $ignoreBookingId): void {
            $bookings->where('status', BookingStatus::Confirmed)->where('pickup_at', '<', $end)->where('return_at', '>', $start);
            if ($ignoreBookingId !== null) {
                $bookings->whereKeyNot($ignoreBookingId);
            }
        })->whereDoesntHave('unavailablePeriods', fn (Builder $periods) => $periods->where('start_at', '<', $end)->where('end_at', '>', $start));
    }

    public function block(int $carId, array $data): CarUnavailablePeriod
    {
        return DB::transaction(function () use ($carId, $data): CarUnavailablePeriod {
            $car = Car::lockForUpdate()->findOrFail($carId);
            $start = CarbonImmutable::parse($data['start_at'])->utc();
            $end = CarbonImmutable::parse($data['end_at'])->utc();
            if (! $this->filterAvailable(Car::whereKey($car->id), $start, $end)->exists()) {
                throw new BookingConflictException('The date block overlaps a confirmed rental or another date block.');
            }

            return $car->unavailablePeriods()->create(['start_at' => $start, 'end_at' => $end, 'reason' => $data['reason']]);
        }, 3);
    }

    public function removeBlock(int $id): void
    {
        DB::transaction(function () use ($id): void {
            $period = CarUnavailablePeriod::findOrFail($id);
            Car::withTrashed()->lockForUpdate()->findOrFail($period->car_id);
            CarUnavailablePeriod::lockForUpdate()->findOrFail($id)->delete();
        }, 3);
    }
}
