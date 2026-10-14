<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo locations may only be seeded in local or testing environments.');
        }
        foreach (['Damascus', 'Aleppo', 'Latakia'] as $city) {
            Location::firstOrCreate(['name' => 'DEMO '.$city.' Branch'], ['city' => $city, 'country' => 'Syria', 'is_active' => true]);
        }
    }
}
