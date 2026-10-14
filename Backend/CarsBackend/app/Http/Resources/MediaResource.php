<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'url' => $this->getUrl(),
            'thumbnailUrl' => $this->hasGeneratedConversion('thumb') ? $this->getUrl('thumb') : $this->getUrl(),
            'isPrimary' => (bool) $this->getCustomProperty('primary', false), 'order' => $this->order_column];
    }
}
