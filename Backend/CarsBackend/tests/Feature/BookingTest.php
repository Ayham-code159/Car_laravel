<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\ApiTestCase;

class BookingTest extends ApiTestCase
{
    public function test_guest_request_is_pending_returns_only_a_receipt_and_stores_a_price_snapshot(): void
    {
        $car = Car::factory()->create(['price_per_day' => '19.99']);
        $response = $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car, ['status' => 'confirmed', 'estimated_total' => '0.01']))
            ->assertCreated()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.estimatedTotal', '39.98')
            ->assertJsonMissingPath('data.customerPhone')->assertJsonMissingPath('data.id');
        $reference = $response->json('data.bookingReference');
        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $reference);
        $booking = Booking::sole();
        $car->update(['price_per_day' => '100.00']);
        $this->signInAdmin();
        $this->patchJson('/api/v1/admin/bookings/'.$booking->id.'/status', ['status' => 'confirmed'])
            ->assertOk()->assertJsonPath('data.estimatedTotal', '39.98');
        $this->assertSame($reference, $booking->fresh()->booking_reference);
    }

    public function test_guest_booking_validation_rejects_bad_dates_customer_data_and_missing_entities(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        $car = Car::factory()->create();
        $invalid = [
            ['return_at' => now()->addDay()->format('Y-m-d\TH:i:s\Z')],
            ['pickup_at' => now()->subDay()->format('Y-m-d\TH:i:s\Z')],
            ['return_at' => now()->addDays(100)->format('Y-m-d\TH:i:s\Z')],
            ['pickup_at' => '2030-01-01 12:00:00'], ['customer_phone' => 'invalid'],
            ['pickup_at' => '2030-01-01T24:00:00Z'], ['customer_phone' => '+1       2'],
            ['customer_email' => 'invalid'], ['car_slug' => 'missing-car'], ['pickup_location_id' => 999999],
        ];
        foreach ($invalid as $override) {
            $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car, $override))->assertUnprocessable();
        }
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_pending_requests_do_not_block_and_only_one_overlapping_request_can_be_confirmed(): void
    {
        $car = Car::factory()->create();
        $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car))->assertCreated();
        $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car))->assertCreated();
        [$first, $second] = Booking::orderBy('id')->get()->all();
        $this->signInAdmin();
        $this->patchJson('/api/v1/admin/bookings/'.$first->id.'/status', ['status' => 'confirmed'])->assertOk();
        $this->patchJson('/api/v1/admin/bookings/'.$second->id.'/status', ['status' => 'confirmed'])->assertConflict();
        $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car))->assertConflict();
    }

    public function test_rejection_cancellation_and_terminal_statuses_are_enforced(): void
    {
        $this->signInAdmin();
        $booking = Booking::factory()->create();
        $this->patchJson('/api/v1/admin/bookings/'.$booking->id.'/status', ['status' => 'rejected'])->assertOk();
        $this->patchJson('/api/v1/admin/bookings/'.$booking->id.'/status', ['status' => 'confirmed'])->assertConflict();
        $confirmed = Booking::factory()->create(['status' => 'confirmed']);
        $this->patchJson('/api/v1/admin/bookings/'.$confirmed->id.'/status', ['status' => 'cancelled'])->assertOk();
        $this->patchJson('/api/v1/admin/bookings/'.$confirmed->id.'/status', ['status' => 'completed'])->assertConflict();
        $pending = Booking::factory()->create();
        $this->patchJson('/api/v1/admin/bookings/'.$pending->id.'/status', ['status' => 'cancelled'])->assertOk();
        $this->patchJson('/api/v1/admin/bookings/'.$pending->id.'/status', ['status' => 'invalid'])->assertUnprocessable();
    }

    public function test_completion_is_allowed_after_return_and_not_before(): void
    {
        $this->signInAdmin();
        $future = Booking::factory()->create(['status' => 'confirmed']);
        $this->patchJson('/api/v1/admin/bookings/'.$future->id.'/status', ['status' => 'completed'])->assertConflict();
        $past = Booking::factory()->create(['status' => 'confirmed', 'pickup_at' => now()->subDays(3), 'return_at' => now()->subDay()]);
        $this->patchJson('/api/v1/admin/bookings/'.$past->id.'/status', ['status' => 'completed'])->assertOk();
    }

    public function test_manual_confirmed_bookings_share_availability_rules_and_can_use_hidden_cars(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create(['is_published' => false]);
        $payload = $this->bookingPayload($car, ['status' => 'confirmed']);
        $this->postJson('/api/v1/admin/bookings', $payload)->assertCreated()->assertJsonPath('data.status', 'confirmed');
        $this->postJson('/api/v1/admin/bookings', $payload)->assertConflict();
        $this->getJson('/api/v1/admin/bookings?status=confirmed&car_id='.$car->id)->assertOk()->assertJsonPath('data.pagination.total', 1);
        $this->getJson('/api/v1/admin/bookings/'.Booking::sole()->id)->assertOk();
    }

    public function test_public_booking_details_are_absent_and_submissions_are_throttled(): void
    {
        $car = Car::factory()->create();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car))->assertCreated();
        }
        $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car))->assertStatus(429);
        $this->getJson('/api/v1/bookings/1')->assertNotFound();
        $this->getJson('/api/v1/booking-requests/'.Booking::first()->booking_reference)->assertNotFound();
        $this->getJson('/api/v1/admin/bookings/1')->assertUnauthorized();
    }

    public function test_dates_with_offsets_are_stored_in_utc(): void
    {
        $car = Car::factory()->create();
        $pickup = now()->addDays(3)->startOfHour()->setTimezone('Asia/Damascus');
        $return = $pickup->copy()->addDay();
        $this->postJson('/api/v1/booking-requests', $this->bookingPayload($car, [
            'pickup_at' => $pickup->format('Y-m-d\TH:i:sP'), 'return_at' => $return->format('Y-m-d\TH:i:sP'),
        ]))->assertCreated();
        $this->assertSame($pickup->utc()->format('Y-m-d H:i:s'), Booking::sole()->getRawOriginal('pickup_at'));
    }
}
