<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'bookingReference' => $this->booking_reference,
            'car' => new CarResource($this->whenLoaded('car')), 'customerName' => $this->customer_name,
            'customerPhone' => $this->customer_phone, 'customerEmail' => $this->customer_email,
            'pickupLocation' => new LocationResource($this->whenLoaded('pickupLocation')),
            'pickupAt' => $this->pickup_at->toISOString(), 'returnAt' => $this->return_at->toISOString(),
            'estimatedTotal' => $this->estimated_total, 'currency' => $this->currency,
            'status' => $this->status->value, 'notes' => $this->notes, 'createdAt' => $this->created_at->toISOString()];
    }
}
