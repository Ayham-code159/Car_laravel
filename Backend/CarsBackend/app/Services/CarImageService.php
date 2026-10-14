<?php

namespace App\Services;

use App\Exceptions\BookingConflictException;
use App\Models\Car;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Throwable;

class CarImageService
{
    /** @param list<UploadedFile> $images */
    public function upload(int $carId, array $images): Collection
    {
        return DB::transaction(function () use ($carId, $images): Collection {
            $car = Car::lockForUpdate()->findOrFail($carId);
            $existing = $car->getMedia('car_images');
            if ($existing->count() + count($images) > config('rental.max_images')) {
                throw new BookingConflictException('This upload exceeds the maximum number of car images.');
            }
            try {
                foreach ($images as $index => $image) {
                    $extension = match ($image->getMimeType()) {
                        'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
                        default => throw new BookingConflictException('Unsupported image format.'),
                    };
                    $car->addMedia($image)->usingFileName(Str::uuid().'.'.$extension)
                        ->withCustomProperties(['primary' => $existing->isEmpty() && $index === 0])->toMediaCollection('car_images');
                }
            } catch (Throwable $e) {
                $created = $car->media()->where('collection_name', 'car_images')->whereNotIn('id', $existing->modelKeys())->get();
                foreach ($created as $media) {
                    $media->delete();
                }
                throw $e;
            }

            return $car->unsetRelation('media')->getMedia('car_images');
        });
    }

    private function ownedMedia(Car $car, int $mediaId): Media
    {
        return $car->media()->where('collection_name', 'car_images')->findOrFail($mediaId);
    }

    public function delete(int $carId, int $mediaId): void
    {
        DB::transaction(function () use ($carId, $mediaId): void {
            $car = Car::lockForUpdate()->findOrFail($carId);
            $media = $this->ownedMedia($car, $mediaId);
            $primary = (bool) $media->getCustomProperty('primary', false);
            $media->delete();
            if ($primary) {
                $next = $car->media()->where('collection_name', 'car_images')->orderBy('order_column')->orderBy('id')->first();
                if ($next) {
                    $next->setCustomProperty('primary', true)->save();
                }
            }
        });
    }

    public function selectPrimary(int $carId, int $mediaId): Collection
    {
        return DB::transaction(function () use ($carId, $mediaId): Collection {
            $car = Car::lockForUpdate()->findOrFail($carId);
            $this->ownedMedia($car, $mediaId);
            $media = $car->getMedia('car_images');
            foreach ($media as $image) {
                $image->setCustomProperty('primary', $image->id === $mediaId)->save();
            }

            return $media;
        });
    }

    public function reorder(int $carId, array $mediaIds): Collection
    {
        return DB::transaction(function () use ($carId, $mediaIds): Collection {
            $car = Car::lockForUpdate()->findOrFail($carId);
            $owned = $car->getMedia('car_images')->modelKeys();
            $requested = array_map('intval', $mediaIds);
            if (count($owned) !== count($requested) || array_diff($owned, $requested)) {
                throw new BookingConflictException('Supply every image belonging to this car exactly once.');
            }
            Media::setNewOrder($requested);

            return $car->unsetRelation('media')->getMedia('car_images');
        });
    }
}
