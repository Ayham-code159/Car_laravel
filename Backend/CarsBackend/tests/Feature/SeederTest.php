<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Car;
use App\Models\User;
use Database\Factories\CarFactory;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Hash;
use Tests\ApiTestCase;

class SeederTest extends ApiTestCase
{
    public function test_demo_seeding_creates_exact_inventory_and_is_idempotent(): void
    {
        $this->seed(DemoSeeder::class);
        $this->seed(DemoSeeder::class);
        $this->assertDatabaseCount('brands', 18);
        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseCount('locations', 3);
        $this->assertDatabaseCount('cars', 54);
        foreach (Brand::with('cars')->get() as $brand) {
            $this->assertCount(3, $brand->cars);
            $allowed = array_column(CarFactory::MODELS[$brand->name], 0);
            foreach ($brand->cars as $car) {
                $this->assertContains($car->model, $allowed);
                $this->assertNotNull($car->category);
                $this->assertNotNull($car->location);
                $this->assertStringStartsWith('DEMO-', $car->inventory_code);
                $this->assertCount(1, $car->getMedia('car_images'));
                $this->assertTrue($car->getFirstMedia('car_images')->hasGeneratedConversion('thumb'));
            }
        }
        $car = Car::first();
        $car->delete();
        $this->seed(DemoSeeder::class);
        $this->assertSame(54, Car::withTrashed()->count());
        $this->assertSoftDeleted($car);
    }

    public function test_admin_seeder_hashes_credentials_and_does_not_reset_password(): void
    {
        config(['rental.admin_username' => 'demo-admin', 'rental.admin_password' => 'first-demo-password']);
        $this->seed(AdminUserSeeder::class);
        $firstHash = User::sole()->password;
        config(['rental.admin_password' => 'different-demo-password']);
        $this->seed(AdminUserSeeder::class);
        $this->assertDatabaseCount('users', 1);
        $this->assertSame($firstHash, User::sole()->password);
        $this->assertTrue(Hash::check('first-demo-password', $firstHash));
        $this->assertTrue(User::sole()->is_admin);
    }

    public function test_explicit_admin_rotation_replaces_credentials(): void
    {
        config(['rental.admin_username' => 'demo-admin', 'rental.admin_password' => 'first-demo-password']);
        $this->artisan('admin:provision')->assertSuccessful();
        config(['rental.admin_username' => 'rotated-admin', 'rental.admin_password' => 'rotated-demo-password']);
        $this->artisan('admin:provision', ['--rotate' => true])->assertSuccessful();
        $this->assertDatabaseCount('users', 1);
        $this->assertSame('rotated-admin', User::sole()->username);
        $this->assertTrue(Hash::check('rotated-demo-password', User::sole()->password));
    }

    public function test_demo_seeding_is_refused_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->expectException(\RuntimeException::class);
        app(DemoSeeder::class)->run();
    }
}
