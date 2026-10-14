<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use Illuminate\Support\Facades\Route;
use Tests\ApiTestCase;

class ApiResponseTest extends ApiTestCase
{
    public function test_success_and_pagination_have_a_single_consistent_envelope(): void
    {
        Car::factory()->create();
        $response = $this->getJson('/api/v1/cars')->assertOk()->assertJsonStructure([
            'success', 'message', 'errors', 'data' => ['items', 'pagination' => ['currentPage', 'perPage', 'lastPage', 'total', 'from', 'to']],
        ])->assertJsonMissingPath('data.data');
        $this->assertSame([], $response->json('errors'));
        $this->assertSame(['success', 'message', 'errors', 'data'], array_keys($response->json()));
    }

    public function test_validation_and_missing_resources_use_safe_standard_errors(): void
    {
        $response = $this->postJson('/api/v1/booking-requests', [])->assertUnprocessable()
            ->assertJsonPath('success', false)->assertJsonPath('message', 'Validation failed.')->assertJsonPath('data', null);
        $this->assertStringContainsString(': ', $response->json('errors.0'));
        $this->getJson('/api/v1/cars/does-not-exist')->assertNotFound()->assertJsonPath('success', false);
        $this->getJson('/api/v1/admin/me')->assertUnauthorized()->assertJsonPath('data', null);
        $this->get('/api/v1/admin/me')->assertUnauthorized()->assertJsonPath('success', false);
    }

    public function test_unexpected_exceptions_never_expose_internal_messages_even_with_debug_enabled(): void
    {
        config(['app.debug' => true]);
        Route::get('api/v1/test-error', function (): void {
            throw new \RuntimeException('sensitive-internal-detail');
        });
        $response = $this->getJson('/api/v1/test-error')->assertStatus(500)
            ->assertJsonPath('message', 'An unexpected error occurred.')->assertJsonPath('errors', []);
        $this->assertStringNotContainsString('sensitive-internal-detail', $response->getContent());
        $response->assertJsonMissingPath('trace');
    }

    public function test_dashboard_returns_accurate_aggregates_and_recent_requests(): void
    {
        $this->signInAdmin();
        Car::factory()->create(['is_published' => true, 'operational_status' => 'active']);
        Car::factory()->create(['is_published' => false, 'operational_status' => 'maintenance']);
        $archived = Car::factory()->create();
        $archived->delete();
        $carId = Car::first()->id;
        foreach (['pending', 'confirmed', 'completed'] as $status) {
            Booking::factory()->create(['car_id' => $carId, 'status' => $status]);
        }
        $this->getJson('/api/v1/admin/dashboard')->assertOk()->assertJsonPath('data.totalCars', 2)
            ->assertJsonPath('data.publishedCars', 1)->assertJsonPath('data.activeCars', 1)
            ->assertJsonPath('data.carsUnderMaintenance', 1)->assertJsonPath('data.pendingBookingRequests', 1)
            ->assertJsonPath('data.confirmedBookings', 1)->assertJsonPath('data.completedBookings', 1)
            ->assertJsonCount(3, 'data.recentBookingRequests');
    }

    public function test_cors_allows_configured_origins_and_does_not_allow_unknown_origins(): void
    {
        $this->getJson('/api/v1/cars', ['Origin' => 'http://localhost:5173'])->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        $this->getJson('/api/v1/cars', ['Origin' => 'https://unknown.example'])->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
