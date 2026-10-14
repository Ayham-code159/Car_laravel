<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CarFactory extends Factory
{
    /** Model, category, fuel, daily USD price, seats. */
    public const MODELS = [
        'BMW' => [['216d', 'Luxury', 'diesel', '85.00', 5], ['218i', 'Luxury', 'petrol', '95.00', 5], ['320i', 'Luxury', 'petrol', '125.00', 5]],
        'BYD' => [['Qin Plus', 'Economy', 'hybrid', '45.00', 5], ['Song Plus', 'SUV', 'hybrid', '70.00', 5], ['Seal', 'Luxury', 'electric', '90.00', 5]],
        'Fiat' => [['500', 'Economy', 'petrol', '30.00', 4], ['Tipo', 'Economy', 'petrol', '38.00', 5], ['Doblo', 'Van', 'diesel', '55.00', 7]],
        'Ford' => [['Focus', 'Economy', 'petrol', '42.00', 5], ['Kuga', 'SUV', 'hybrid', '68.00', 5], ['Tourneo Custom', 'Van', 'diesel', '95.00', 9]],
        'GMC' => [['Terrain', 'SUV', 'petrol', '85.00', 5], ['Acadia', 'SUV', 'petrol', '110.00', 7], ['Yukon', 'Luxury', 'petrol', '155.00', 8]],
        'Honda' => [['Civic', 'Economy', 'petrol', '48.00', 5], ['Accord', 'Luxury', 'hybrid', '75.00', 5], ['CR-V', 'SUV', 'hybrid', '80.00', 5]],
        'Hyundai' => [['Accent', 'Economy', 'petrol', '30.00', 5], ['Elantra', 'Economy', 'petrol', '40.00', 5], ['Tucson', 'SUV', 'petrol', '65.00', 5]],
        'Jetour' => [['X70', 'SUV', 'petrol', '58.00', 7], ['X90', 'SUV', 'petrol', '72.00', 7], ['Dashing', 'SUV', 'petrol', '68.00', 5]],
        'Kia' => [['K3', 'Economy', 'petrol', '36.00', 5], ['Seltos', 'SUV', 'petrol', '52.00', 5], ['Sonet', 'SUV', 'petrol', '45.00', 5]],
        'MG' => [['MG5', 'Economy', 'petrol', '34.00', 5], ['ZS', 'SUV', 'petrol', '48.00', 5], ['HS', 'SUV', 'hybrid', '65.00', 5]],
        'Mitsubishi' => [['Attrage', 'Economy', 'petrol', '28.00', 5], ['ASX', 'SUV', 'petrol', '50.00', 5], ['Outlander', 'SUV', 'hybrid', '75.00', 7]],
        'Nissan' => [['Sunny', 'Economy', 'petrol', '30.00', 5], ['Qashqai', 'SUV', 'petrol', '60.00', 5], ['X-Trail', 'SUV', 'hybrid', '78.00', 7]],
        'Opel' => [['Corsa', 'Economy', 'petrol', '32.00', 5], ['Astra', 'Economy', 'petrol', '43.00', 5], ['Grandland', 'SUV', 'hybrid', '68.00', 5]],
        'Peugeot' => [['208', 'Economy', 'petrol', '35.00', 5], ['3008', 'SUV', 'hybrid', '72.00', 5], ['Traveller', 'Van', 'diesel', '92.00', 8]],
        'Renault' => [['Clio', 'Economy', 'petrol', '32.00', 5], ['Megane', 'Economy', 'petrol', '42.00', 5], ['Duster', 'SUV', 'petrol', '52.00', 5]],
        'Škoda' => [['Fabia', 'Economy', 'petrol', '34.00', 5], ['Octavia', 'Economy', 'petrol', '48.00', 5], ['Kodiaq', 'SUV', 'diesel', '78.00', 7]],
        'Toyota' => [['Corolla', 'Economy', 'petrol', '40.00', 5], ['Camry', 'Luxury', 'hybrid', '70.00', 5], ['RAV4', 'SUV', 'hybrid', '75.00', 5]],
        'Volkswagen' => [['Polo', 'Economy', 'petrol', '36.00', 5], ['Golf', 'Economy', 'petrol', '48.00', 5], ['Tiguan', 'SUV', 'diesel', '76.00', 5]],
    ];

    public function definition(): array
    {
        $brand = fake()->randomElement(array_keys(self::MODELS));
        [$model, $category, $fuel, $price, $seats] = fake()->randomElement(self::MODELS[$brand]);
        $code = 'DEMO-'.strtoupper(Str::random(12));

        return [
            'inventory_code' => $code,
            'brand_id' => fn () => Brand::firstOrCreate(['slug' => Str::slug($brand)], ['name' => $brand])->id,
            'category_id' => fn () => Category::firstOrCreate(['slug' => Str::slug($category)], ['name' => $category])->id,
            'location_id' => Location::factory(),
            'model' => $model, 'slug' => Str::slug($brand.'-'.$model.'-'.$code),
            'year' => fake()->numberBetween(2021, 2025), 'price_per_day' => $price, 'currency' => 'USD',
            'transmission' => 'automatic', 'fuel_type' => $fuel, 'seats' => $seats,
            'luggage_count' => $category === 'Van' ? 6 : ($category === 'SUV' ? 4 : 2),
            'description' => 'DEMO inventory: '.$brand.' '.$model.'. Comfortable rental vehicle with air conditioning.',
            'operational_status' => 'active', 'is_published' => true, 'is_featured' => false,
        ];
    }
}
