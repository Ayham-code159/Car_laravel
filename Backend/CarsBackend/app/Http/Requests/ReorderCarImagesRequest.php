<?php

namespace App\Http\Requests;

class ReorderCarImagesRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['media_ids' => ['required', 'array', 'min:1', 'max:'.config('rental.max_images')],
            'media_ids.*' => ['required', 'integer', 'min:1', 'distinct']];
    }
}
