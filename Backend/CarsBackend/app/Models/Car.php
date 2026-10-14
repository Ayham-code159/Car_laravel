<?php

namespace App\Models;

use App\Enums\FuelType;
use App\Enums\OperationalStatus;
use App\Enums\Transmission;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Car extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $attributes = ['operational_status' => 'active', 'is_published' => false, 'is_featured' => false];

    protected $fillable = [
        'inventory_code', 'brand_id', 'category_id', 'location_id', 'model', 'slug', 'year',
        'price_per_day', 'currency', 'transmission', 'fuel_type', 'seats', 'luggage_count',
        'description', 'operational_status', 'is_published', 'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price_per_day' => 'decimal:2', 'year' => 'integer', 'seats' => 'integer', 'luggage_count' => 'integer',
            'transmission' => Transmission::class, 'fuel_type' => FuelType::class,
            'operational_status' => OperationalStatus::class, 'is_published' => 'boolean', 'is_featured' => 'boolean',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function unavailablePeriods(): HasMany
    {
        return $this->hasMany(CarUnavailablePeriod::class);
    }

    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('is_published', true)->where('operational_status', OperationalStatus::Active);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('car_images')->useDisk(config('media-library.disk_name'))
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')->width(400)->height(250)->format('jpg')
            ->nonQueued()->nonOptimized()->performOnCollections('car_images');
    }
}
