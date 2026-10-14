<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderCarImagesRequest;
use App\Http\Requests\UploadCarImagesRequest;
use App\Http\Resources\MediaResource;
use App\Http\Responses\ApiResponse;
use App\Services\CarImageService;
use Illuminate\Http\JsonResponse;

class CarImageController extends Controller
{
    public function __construct(private CarImageService $images) {}

    public function store(UploadCarImagesRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(MediaResource::collection($this->images->upload($id, $request->file('images'))), 'Images uploaded.', 201);
    }

    public function destroy(int $id, int $mediaId): JsonResponse
    {
        $this->images->delete($id, $mediaId);

        return ApiResponse::success(null, 'Image deleted.');
    }

    public function primary(int $id, int $mediaId): JsonResponse
    {
        return ApiResponse::success(MediaResource::collection($this->images->selectPrimary($id, $mediaId)), 'Primary image updated.');
    }

    public function order(ReorderCarImagesRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(MediaResource::collection($this->images->reorder($id, $request->validated('media_ids'))), 'Image order updated.');
    }
}
