<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BookingFactory extends Factory
{
    public function definition(): array
    {
        return ['booking_reference' => (string) Str::uuid(), 'car_id' => Car::factory(),
            'customer_name' => fake()->name(), 'customer_phone' => '+963991234567', 'customer_email' => fake()->safeEmail(),
            'pickup_location_id' => Location::factory(), 'pickup_at' => now()->addDays(3), 'return_at' => now()->addDays(5),
            'estimated_total' => '100.00', 'currency' => 'USD', 'status' => 'pending', 'notes' => 'DEMO booking'];
    }
}
