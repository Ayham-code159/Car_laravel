<?php

namespace App\Http\Controllers\Api\Public;

use App\Contracts\CatalogServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\ListCatalogRequest;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\LocationResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    public function __construct(private CatalogServiceInterface $catalog) {}

    public function brands(ListCatalogRequest $request): JsonResponse
    {
        return ApiResponse::success(BrandResource::collection($this->catalog->list('brands')));
    }

    public function categories(ListCatalogRequest $request): JsonResponse
    {
        return ApiResponse::success(CategoryResource::collection($this->catalog->list('categories')));
    }

    public function locations(ListCatalogRequest $request): JsonResponse
    {
        return ApiResponse::success(LocationResource::collection($this->catalog->list('locations')));
    }
}
