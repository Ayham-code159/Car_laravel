<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnavailablePeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'carId' => $this->car_id, 'startAt' => $this->start_at->toISOString(),
            'endAt' => $this->end_at->toISOString(), 'reason' => $this->reason];
    }
}
