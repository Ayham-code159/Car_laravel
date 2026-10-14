<?php

namespace App\Services;

use App\Contracts\DashboardServiceInterface;
use App\Models\Booking;
use App\Models\Car;

class DashboardService implements DashboardServiceInterface
{
    public function statistics(): array
    {
        $cars = Car::selectRaw("COUNT(*) AS total, COALESCE(SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END), 0) AS published, COALESCE(SUM(CASE WHEN operational_status = 'active' THEN 1 ELSE 0 END), 0) AS active, COALESCE(SUM(CASE WHEN operational_status = 'maintenance' THEN 1 ELSE 0 END), 0) AS maintenance")->first();
        $bookings = Booking::selectRaw("COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending, COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed, COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed")->first();

        return ['totalCars' => (int) $cars->total, 'publishedCars' => (int) $cars->published,
            'activeCars' => (int) $cars->active, 'carsUnderMaintenance' => (int) $cars->maintenance,
            'pendingBookingRequests' => (int) $bookings->pending, 'confirmedBookings' => (int) $bookings->confirmed,
            'completedBookings' => (int) $bookings->completed,
            'recentBookingRequests' => Booking::with(['car.brand', 'car.category', 'car.location', 'car.media', 'pickupLocation'])
                ->latest('id')->limit(10)->get()];
    }
}
