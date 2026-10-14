<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use Database\Factories\CarFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CarSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo inventory may only be seeded in local or testing environments.');
        }
        $locations = Location::where('name', 'like', 'DEMO %')->orderBy('id')->pluck('id');
        if ($locations->isEmpty()) {
            throw new \RuntimeException('Seed the demo locations first.');
        }
        foreach (CarFactory::MODELS as $brandName => $models) {
            foreach ($models as $index => [$model, $category, $fuel, $price, $seats]) {
                $code = 'DEMO-'.strtoupper(Str::slug($brandName)).'-'.($index + 1);
                $car = Car::withTrashed()->where('inventory_code', $code)->first();
                if (! $car) {
                    $car = Car::factory()->create([
                        'inventory_code' => $code, 'slug' => Str::slug($brandName.'-'.$model.'-'.$code),
                        'brand_id' => Brand::where('slug', Str::slug($brandName))->firstOrFail()->id,
                        'category_id' => Category::where('slug', Str::slug($category))->firstOrFail()->id,
                        'location_id' => $locations[$index % $locations->count()],
                        'model' => $model, 'fuel_type' => $fuel, 'price_per_day' => $price, 'seats' => $seats,
                        'luggage_count' => $category === 'Van' ? 6 : ($category === 'SUV' ? 4 : 2),
                        'description' => 'DEMO inventory: '.$brandName.' '.$model.'. Air conditioning, comfortable seating and practical luggage space.',
                        'operational_status' => $index === 2 && in_array($brandName, ['Fiat', 'Opel'], true) ? 'maintenance' : 'active',
                        'is_featured' => $index === 0,
                    ]);
                }
                if (! $car->trashed() && ! $car->getFirstMedia('car_images') && extension_loaded('gd')) {
                    $this->attachPlaceholder($car, $brandName.' '.$model);
                }
            }
        }
    }

    private function attachPlaceholder(Car $car, string $label): void
    {
        $directory = storage_path('app/private/demo-placeholders');
        File::ensureDirectoryExists($directory);
        $path = $directory.'/'.$car->inventory_code.'.png';
        $image = imagecreatetruecolor(800, 450);
        $background = imagecolorallocate($image, 235, 240, 245);
        $ink = imagecolorallocate($image, 35, 55, 75);
        imagefill($image, 0, 0, $background);
        imagefilledrectangle($image, 170, 180, 630, 280, $ink);
        imagefilledpolygon($image, [270, 180, 330, 120, 490, 120, 550, 180], $ink);
        imagefilledellipse($image, 270, 280, 75, 75, $ink);
        imagefilledellipse($image, 530, 280, 75, 75, $ink);
        imagestring($image, 5, 30, 350, iconv('UTF-8', 'ASCII//TRANSLIT', $label), $ink);
        imagestring($image, 4, 30, 385, 'DEMO PLACEHOLDER - Supply real vehicle images before publishing.', $ink);
        imagepng($image, $path);
        $car->addMedia($path)->usingFileName($car->inventory_code.'.png')
            ->withCustomProperties(['primary' => true, 'demo' => true])->toMediaCollection('car_images');
    }
}
