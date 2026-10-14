<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo data is restricted to local and testing environments.');
        }
        $this->call([BrandSeeder::class, CategorySeeder::class, LocationSeeder::class, CarSeeder::class]);
    }
}
