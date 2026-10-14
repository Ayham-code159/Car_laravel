<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = ['booking_reference', 'car_id', 'customer_name', 'customer_phone', 'customer_email',
        'pickup_location_id', 'pickup_at', 'return_at', 'estimated_total', 'currency', 'status', 'notes'];

    protected function casts(): array
    {
        return ['pickup_at' => 'immutable_datetime', 'return_at' => 'immutable_datetime',
            'estimated_total' => 'decimal:2', 'status' => BookingStatus::class];
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'pickup_location_id');
    }
}
