<?php

namespace App\Http\Requests;

class UploadCarImagesRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['images' => ['required', 'array', 'min:1', 'max:'.config('rental.max_uploads')],
            'images.*' => ['required', 'file', 'image', 'mimetypes:image/jpeg,image/png,image/webp',
                'max:'.config('rental.image_max_kb'), 'dimensions:max_width=6000,max_height=6000']];
    }
}
