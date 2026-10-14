<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingReceiptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['bookingReference' => $this->booking_reference, 'status' => $this->status->value,
            'estimatedTotal' => $this->estimated_total, 'currency' => $this->currency];
    }
}
