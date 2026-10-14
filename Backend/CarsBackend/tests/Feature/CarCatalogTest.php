<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Support\Facades\DB;
use Tests\ApiTestCase;

class CarCatalogTest extends ApiTestCase
{
    public function test_admin_can_create_update_manage_and_archive_a_car(): void
    {
        $this->signInAdmin();
        $sample = Car::factory()->create();
        $payload = ['inventory_code' => 'REAL-VEHICLE-001', 'brand_id' => $sample->brand_id,
            'category_id' => $sample->category_id, 'location_id' => $sample->location_id,
            'model' => 'Rental model', 'year' => 2024, 'price_per_day' => '42.50', 'currency' => 'USD',
            'transmission' => 'automatic', 'fuel_type' => 'petrol', 'seats' => 5, 'luggage_count' => 3];
        $response = $this->postJson('/api/v1/admin/cars', $payload)->assertCreated();
        $id = $response->json('data.id');
        $slug = $response->json('data.slug');
        $this->getJson('/api/v1/cars/'.$slug)->assertNotFound();
        $this->putJson('/api/v1/admin/cars/'.$id, ['price_per_day' => '55.75'])->assertOk()->assertJsonPath('data.pricePerDay', '55.75');
        $this->patchJson('/api/v1/admin/cars/'.$id.'/publication', ['is_published' => true])->assertOk();
        $this->patchJson('/api/v1/admin/cars/'.$id.'/featured', ['is_featured' => true])->assertOk();
        $this->getJson('/api/v1/cars/'.$slug)->assertOk()->assertJsonPath('data.isFeatured', true);
        $this->patchJson('/api/v1/admin/cars/'.$id.'/status', ['operational_status' => 'maintenance'])->assertOk();
        $this->getJson('/api/v1/cars/'.$slug)->assertNotFound();
        Booking::factory()->create(['car_id' => $id, 'pickup_location_id' => $sample->location_id]);
        $this->deleteJson('/api/v1/admin/cars/'.$id)->assertOk();
        $this->assertSoftDeleted('cars', ['id' => $id]);
        $this->assertNotNull(Booking::sole()->car);
        $this->getJson('/api/v1/admin/cars?archived=1')->assertOk()->assertJsonPath('data.pagination.total', 1);
        $this->getJson('/api/v1/admin/cars/'.$id)->assertOk();
    }

    public function test_car_validation_rejects_invalid_fields_and_duplicate_inventory(): void
    {
        $this->signInAdmin();
        $this->postJson('/api/v1/admin/cars', ['price_per_day' => 0])->assertUnprocessable()
            ->assertJsonPath('success', false)->assertJsonPath('data', null);
        $car = Car::factory()->create();
        $this->putJson('/api/v1/admin/cars/'.$car->id, ['currency' => 'usd', 'fuel_type' => 'invalid', 'seats' => 0])->assertUnprocessable();
        $this->putJson('/api/v1/admin/cars/'.$car->id, ['inventory_code' => $car->inventory_code])->assertOk();
        $second = Car::factory()->create();
        $this->putJson('/api/v1/admin/cars/'.$second->id, ['inventory_code' => $car->inventory_code])->assertUnprocessable();
    }

    public function test_public_filters_support_names_slugs_price_and_location(): void
    {
        $category = Category::factory()->create();
        $location = Location::factory()->create();
        $match = Car::factory()->create(['category_id' => $category->id, 'location_id' => $location->id, 'price_per_day' => '65.00']);
        Car::factory()->create(['price_per_day' => '150.00']);
        $parameters = ['brand' => $match->brand->slug, 'category' => $category->slug, 'location' => (string) $location->id,
            'min_price' => 60, 'max_price' => 70, 'transmission' => $match->transmission->value, 'fuel_type' => $match->fuel_type->value];
        $this->getJson('/api/v1/cars?'.http_build_query($parameters))->assertOk()
            ->assertJsonPath('data.pagination.total', 1)->assertJsonPath('data.items.0.slug', $match->slug);
        $parameters['brand'] = $match->brand->name;
        $parameters['category'] = $category->name;
        $parameters['location'] = $location->name;
        $this->getJson('/api/v1/cars?'.http_build_query($parameters))->assertOk()->assertJsonPath('data.pagination.total', 1);
        $this->getJson('/api/v1/cars?max_price=70')->assertOk()->assertJsonPath('data.pagination.total', 1);
        $this->getJson('/api/v1/cars?model='.urlencode($match->model))->assertOk();
    }

    public function test_sorting_pagination_featured_and_hidden_car_rules(): void
    {
        $cheap = Car::factory()->create(['price_per_day' => '20.00', 'is_featured' => true]);
        Car::factory()->create(['price_per_day' => '40.00']);
        Car::factory()->create(['price_per_day' => '60.00']);
        Car::factory()->create(['is_published' => false]);
        Car::factory()->create(['operational_status' => 'inactive']);
        Car::factory()->create(['operational_status' => 'maintenance']);
        $this->getJson('/api/v1/cars?sort=price_asc&per_page=2')->assertOk()
            ->assertJsonPath('data.items.0.slug', $cheap->slug)->assertJsonPath('data.pagination.total', 3)
            ->assertJsonPath('data.pagination.lastPage', 2)->assertJsonCount(2, 'data.items');
        $this->getJson('/api/v1/cars?sort=price_desc&page=2&per_page=2')->assertOk()
            ->assertJsonPath('data.items.0.slug', $cheap->slug)->assertJsonPath('data.pagination.currentPage', 2);
        $this->getJson('/api/v1/cars/featured')->assertOk()->assertJsonPath('data.pagination.total', 1);
        $this->getJson('/api/v1/cars/'.$cheap->id)->assertNotFound();
        $this->getJson('/api/v1/cars?per_page=500&sort=invalid')->assertUnprocessable();
    }

    public function test_long_model_names_generate_valid_public_slugs_within_the_column_limit(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $payload = $car->only(['brand_id', 'category_id', 'location_id', 'year', 'price_per_day', 'currency', 'seats', 'luggage_count']);
        $response = $this->postJson('/api/v1/admin/cars', array_merge($payload, [
            'inventory_code' => str_repeat('X', 80), 'model' => str_repeat('M', 120),
            'transmission' => 'automatic', 'fuel_type' => 'petrol', 'is_published' => true,
        ]))->assertCreated();
        $this->assertLessThanOrEqual(200, strlen($response->json('data.slug')));
        $this->getJson('/api/v1/cars/'.$response->json('data.slug'))->assertOk();
        $this->putJson('/api/v1/admin/cars/'.$car->id, ['slug' => 'featured'])->assertUnprocessable();
    }

    public function test_public_catalog_eager_loads_related_data_with_a_bounded_query_count(): void
    {
        Car::factory()->count(12)->create();
        DB::enableQueryLog();
        try {
            $this->getJson('/api/v1/cars?per_page=100')->assertOk()->assertJsonCount(12, 'data.items');
            $this->assertLessThanOrEqual(6, count(DB::getQueryLog()));
        } finally {
            DB::disableQueryLog();
        }
    }
}
