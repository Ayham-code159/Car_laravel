<?php

namespace Database\Seeders;

use App\Models\Brand;
use Database\Factories\CarFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        foreach (array_keys(CarFactory::MODELS) as $name) {
            Brand::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
        }
    }
}
