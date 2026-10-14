<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\CatalogServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\ListCatalogRequest;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\StoreLocationRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\LocationResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    public function __construct(private CatalogServiceInterface $catalog) {}

    public function categories(ListCatalogRequest $request): JsonResponse
    {
        return ApiResponse::success(CategoryResource::collection($this->catalog->list('categories', admin: true)));
    }

    public function storeCategory(StoreCategoryRequest $request): JsonResponse
    {
        return ApiResponse::success(new CategoryResource($this->catalog->create('categories', $request->validated())), 'Category created.', 201);
    }

    public function updateCategory(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new CategoryResource($this->catalog->update('categories', $id, $request->validated())), 'Category updated.');
    }

    public function deleteCategory(int $id): JsonResponse
    {
        $this->catalog->delete('categories', $id);

        return ApiResponse::success(null, 'Category deleted.');
    }

    public function locations(ListCatalogRequest $request): JsonResponse
    {
        return ApiResponse::success(LocationResource::collection($this->catalog->list('locations', admin: true)));
    }

    public function storeLocation(StoreLocationRequest $request): JsonResponse
    {
        return ApiResponse::success(new LocationResource($this->catalog->create('locations', $request->validated())), 'Location created.', 201);
    }

    public function updateLocation(UpdateLocationRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new LocationResource($this->catalog->update('locations', $id, $request->validated())), 'Location updated.');
    }

    public function deleteLocation(int $id): JsonResponse
    {
        $this->catalog->delete('locations', $id);

        return ApiResponse::success(null, 'Location deleted.');
    }
}
