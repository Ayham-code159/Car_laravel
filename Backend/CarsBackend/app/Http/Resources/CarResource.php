<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $images = $this->relationLoaded('media') ? $this->getMedia('car_images') : collect();
        $primary = $images->first(fn ($image) => $image->getCustomProperty('primary', false)) ?? $images->first();
        $admin = $request->is('api/v1/admin/*') && $request->user()?->is_admin;

        return [
            'id' => $this->id, 'slug' => $this->slug, 'model' => $this->model, 'year' => $this->year,
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'pricePerDay' => $this->price_per_day, 'currency' => $this->currency,
            'transmission' => $this->transmission->value, 'fuelType' => $this->fuel_type->value,
            'seats' => $this->seats, 'luggageCount' => $this->luggage_count, 'description' => $this->description,
            'isFeatured' => $this->is_featured, 'primaryImageUrl' => $primary?->getUrl(),
            'images' => MediaResource::collection($images),
            'inventoryCode' => $this->when($admin, $this->inventory_code),
            'operationalStatus' => $this->when($admin, $this->operational_status->value),
            'isPublished' => $this->when($admin, $this->is_published),
            'archivedAt' => $this->when($admin, $this->deleted_at?->toISOString()),
            'blockedPeriods' => UnavailablePeriodResource::collection($this->whenLoaded('unavailablePeriods')),
        ];
    }
}
