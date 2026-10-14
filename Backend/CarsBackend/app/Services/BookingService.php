<?php

namespace App\Services;

use App\Contracts\AvailabilityServiceInterface;
use App\Contracts\BookingServiceInterface;
use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Location;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService implements BookingServiceInterface
{
    public function __construct(private AvailabilityServiceInterface $availability, private PricingService $pricing) {}

    public function create(array $data, bool $manual = false): Booking
    {
        return DB::transaction(function () use ($data, $manual): Booking {
            $query = Car::where('slug', $data['car_slug']);
            if (! $manual) {
                $query->publiclyVisible();
            }
            $car = $query->lockForUpdate()->firstOrFail();
            Location::where('is_active', true)->findOrFail($data['pickup_location_id']);
            $start = CarbonImmutable::parse($data['pickup_at'])->utc();
            $end = CarbonImmutable::parse($data['return_at'])->utc();
            if (! $this->availability->isAvailable($car, $start, $end)) {
                throw new BookingConflictException('The vehicle is unavailable for the requested period.');
            }
            $status = $manual ? BookingStatus::from($data['status'] ?? 'pending') : BookingStatus::Pending;
            $booking = Booking::create([
                'booking_reference' => (string) Str::uuid(), 'car_id' => $car->id,
                'customer_name' => $data['customer_name'], 'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null, 'pickup_location_id' => $data['pickup_location_id'],
                'pickup_at' => $start, 'return_at' => $end,
                'estimated_total' => $this->pricing->estimate($car->price_per_day, $start, $end),
                'currency' => $car->currency, 'status' => $status, 'notes' => $data['notes'] ?? null,
            ]);

            return $booking->load(['car.brand', 'car.category', 'car.location', 'car.media', 'pickupLocation']);
        }, 3);
    }

    public function search(array $filters): LengthAwarePaginator
    {
        $query = Booking::with(['car.brand', 'car.category', 'car.location', 'car.media', 'pickupLocation']);
        foreach (['status', 'car_id', 'booking_reference'] as $field) {
            if (isset($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        if (isset($filters['search'])) {
            $query->where(function ($search) use ($filters): void {
                $search->where('customer_name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('customer_phone', 'like', '%'.$filters['search'].'%');
            });
        }
        if (isset($filters['from'])) {
            $query->where('pickup_at', '>=', CarbonImmutable::parse($filters['from'])->utc());
        }
        if (isset($filters['to'])) {
            $query->where('pickup_at', '<=', CarbonImmutable::parse($filters['to'])->utc());
        }

        return $query->orderByDesc('created_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Booking
    {
        return Booking::with(['car.brand', 'car.category', 'car.location', 'car.media', 'pickupLocation'])->findOrFail($id);
    }

    public function transition(int $id, BookingStatus $status): Booking
    {
        $carId = Booking::findOrFail($id)->car_id;

        return DB::transaction(function () use ($id, $status, $carId): Booking {
            $car = Car::withTrashed()->lockForUpdate()->findOrFail($carId);
            $booking = Booking::lockForUpdate()->findOrFail($id);
            if (! $booking->status->canTransitionTo($status)) {
                throw new BookingConflictException('This booking status transition is not allowed.');
            }
            if ($status === BookingStatus::Confirmed) {
                if ($booking->pickup_at->isPast() || ! $this->availability->isAvailable($car, $booking->pickup_at, $booking->return_at, $booking->id)) {
                    throw new BookingConflictException('This request has expired or the vehicle is unavailable for the requested period.');
                }
                if (! $booking->pickupLocation->is_active) {
                    throw new BookingConflictException('The pickup location is inactive.');
                }
            }
            if ($status === BookingStatus::Completed && $booking->return_at->isFuture()) {
                throw new BookingConflictException('A rental can only be completed after its return time.');
            }
            $booking->update(['status' => $status]);

            return $this->find($booking->id);
        }, 3);
    }
}
