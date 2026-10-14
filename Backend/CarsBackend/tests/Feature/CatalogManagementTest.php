<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Location;
use Database\Seeders\DatabaseSeeder;
use Tests\ApiTestCase;

class CatalogManagementTest extends ApiTestCase
{
    public function test_public_catalog_is_read_only_and_contains_seeded_brands_and_categories(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->getJson('/api/v1/brands')->assertOk()->assertJsonCount(18, 'data');
        $this->getJson('/api/v1/categories')->assertOk()->assertJsonCount(4, 'data');
        Location::factory()->create(['is_active' => true]);
        Location::factory()->create(['is_active' => false]);
        $this->getJson('/api/v1/locations')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson('/api/v1/brands', ['name' => 'Unexpected'])->assertStatus(405);
        $this->assertDatabaseCount('cars', 0);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_admin_category_and_location_crud_prevents_duplicates(): void
    {
        $this->signInAdmin();
        $category = $this->postJson('/api/v1/admin/categories', ['name' => 'Convertible'])->assertCreated()->json('data.id');
        $this->postJson('/api/v1/admin/categories', ['name' => 'Convertible'])->assertUnprocessable();
        $this->putJson('/api/v1/admin/categories/'.$category, ['name' => 'Sports'])->assertOk()->assertJsonPath('data.slug', 'sports');
        $this->getJson('/api/v1/admin/categories')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson('/api/v1/admin/categories/'.$category)->assertOk();
        $payload = ['name' => 'Airport office', 'city' => 'Damascus', 'country' => 'Syria'];
        $location = $this->postJson('/api/v1/admin/locations', $payload)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/admin/locations', $payload)->assertUnprocessable();
        $this->putJson('/api/v1/admin/locations/'.$location, ['is_active' => false])->assertOk()->assertJsonPath('data.isActive', false);
        $this->getJson('/api/v1/admin/locations')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson('/api/v1/admin/locations/'.$location)->assertOk();
    }

    public function test_categories_and_locations_used_by_archived_cars_or_bookings_cannot_be_deleted(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $car->delete();
        $this->deleteJson('/api/v1/admin/categories/'.$car->category_id)->assertConflict();
        $this->deleteJson('/api/v1/admin/locations/'.$car->location_id)->assertConflict();
        $pickup = Location::factory()->create();
        Booking::factory()->create(['car_id' => $car->id, 'pickup_location_id' => $pickup->id]);
        $this->deleteJson('/api/v1/admin/locations/'.$pickup->id)->assertConflict();
    }
}
