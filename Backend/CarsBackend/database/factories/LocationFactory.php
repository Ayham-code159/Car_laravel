<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class LocationFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Demo branch '.fake()->unique()->numerify('######'), 'city' => 'Damascus', 'country' => 'Syria', 'is_active' => true];
    }
}
