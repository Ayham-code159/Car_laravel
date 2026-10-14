<?php

namespace Database\Factories;

use App\Models\Car;
use Illuminate\Database\Eloquent\Factories\Factory;

class CarUnavailablePeriodFactory extends Factory
{
    public function definition(): array
    {
        return ['car_id' => Car::factory(), 'start_at' => now()->addDays(3), 'end_at' => now()->addDays(5), 'reason' => 'Scheduled maintenance'];
    }
}
