<?php

namespace Tests\Feature;

use App\Contracts\AvailabilityServiceInterface;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarUnavailablePeriod;
use Carbon\CarbonImmutable;
use Tests\ApiTestCase;

class AvailabilityTest extends ApiTestCase
{
    public function test_overlap_detection_uses_half_open_intervals(): void
    {
        $car = Car::factory()->create();
        $start = CarbonImmutable::now()->addDays(3)->startOfHour();
        $end = $start->addDays(2);
        Booking::factory()->create(['car_id' => $car->id, 'status' => 'confirmed', 'pickup_at' => $start, 'return_at' => $end]);
        $service = app(AvailabilityServiceInterface::class);
        $this->assertFalse($service->isAvailable($car, $start->addHour(), $end->subHour()));
        $this->assertFalse($service->isAvailable($car, $start->subDay(), $end->addDay()));
        $this->assertFalse($service->isAvailable($car, $start->subDay(), $start->addSecond()));
        $this->assertTrue($service->isAvailable($car, $end, $end->addDay()));
        $this->assertTrue($service->isAvailable($car, $start->subDay(), $start));
    }

    public function test_only_confirmed_bookings_and_date_blocks_block_availability(): void
    {
        $car = Car::factory()->create();
        $start = CarbonImmutable::now()->addDays(3);
        $end = $start->addDays(2);
        foreach (['pending', 'cancelled', 'rejected', 'completed'] as $status) {
            Booking::factory()->create(['car_id' => $car->id, 'status' => $status, 'pickup_at' => $start, 'return_at' => $end]);
        }
        $service = app(AvailabilityServiceInterface::class);
        $this->assertTrue($service->isAvailable($car, $start, $end));
        CarUnavailablePeriod::factory()->create(['car_id' => $car->id, 'start_at' => $start, 'end_at' => $end]);
        $this->assertFalse($service->isAvailable($car, $start, $end));
        $this->assertTrue($service->isAvailable($car, $end, $end->addDay()));
    }

    public function test_public_search_filters_out_confirmed_rentals_and_maintenance_periods(): void
    {
        $free = Car::factory()->create();
        $booked = Car::factory()->create();
        $blocked = Car::factory()->create();
        $payload = $this->bookingPayload($free);
        Booking::factory()->create(['car_id' => $booked->id, 'status' => 'confirmed', 'pickup_at' => $payload['pickup_at'], 'return_at' => $payload['return_at']]);
        CarUnavailablePeriod::factory()->create(['car_id' => $blocked->id, 'start_at' => $payload['pickup_at'], 'end_at' => $payload['return_at']]);
        $this->getJson('/api/v1/cars?'.http_build_query(['pickup_at' => $payload['pickup_at'], 'return_at' => $payload['return_at']]))
            ->assertOk()->assertJsonPath('data.pagination.total', 1)->assertJsonPath('data.items.0.slug', $free->slug);
        $this->getJson('/api/v1/cars?'.http_build_query(['pickup_at' => $payload['pickup_at']]))->assertUnprocessable();
    }

    public function test_blocks_cannot_conflict_with_confirmed_rentals_and_can_be_removed(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $payload = $this->bookingPayload($car);
        $block = ['start_at' => $payload['pickup_at'], 'end_at' => $payload['return_at'], 'reason' => 'Maintenance'];
        $response = $this->postJson('/api/v1/admin/cars/'.$car->id.'/blocked-periods', $block)->assertCreated();
        $this->postJson('/api/v1/admin/bookings', $payload + ['status' => 'confirmed'])->assertConflict();
        $this->deleteJson('/api/v1/admin/blocked-periods/'.$response->json('data.id'))->assertOk();
        $this->postJson('/api/v1/admin/bookings', $payload + ['status' => 'confirmed'])->assertCreated();
        $this->postJson('/api/v1/admin/cars/'.$car->id.'/blocked-periods', $block)->assertConflict();
        $this->postJson('/api/v1/admin/cars/'.$car->id.'/blocked-periods', array_merge($block, ['end_at' => $block['start_at']]))->assertUnprocessable();
    }

    public function test_adjacent_manual_bookings_can_both_be_confirmed(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $first = $this->bookingPayload($car, ['status' => 'confirmed']);
        $second = $this->bookingPayload($car, ['status' => 'confirmed', 'pickup_at' => $first['return_at'],
            'return_at' => CarbonImmutable::parse($first['return_at'])->addDay()->format('Y-m-d\TH:i:s\Z')]);
        $this->postJson('/api/v1/admin/bookings', $first)->assertCreated();
        $this->postJson('/api/v1/admin/bookings', $second)->assertCreated();
        $this->assertDatabaseCount('bookings', 2);
    }

    public function test_archived_or_inactive_cars_cannot_be_confirmed_but_history_can_be_cancelled(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $booking = Booking::factory()->create(['car_id' => $car->id]);
        $car->delete();
        $this->patchJson('/api/v1/admin/bookings/'.$booking->id.'/status', ['status' => 'confirmed'])->assertConflict();
        $this->patchJson('/api/v1/admin/bookings/'.$booking->id.'/status', ['status' => 'cancelled'])->assertOk();
        $this->getJson('/api/v1/admin/bookings/'.$booking->id)->assertOk()->assertJsonPath('data.car.id', $car->id);
    }
}
