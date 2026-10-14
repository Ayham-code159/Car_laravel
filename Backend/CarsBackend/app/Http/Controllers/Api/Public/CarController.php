<?php

namespace App\Http\Controllers\Api\Public;

use App\Contracts\CarServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\SearchCarsRequest;
use App\Http\Resources\CarResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CarController extends Controller
{
    public function __construct(private CarServiceInterface $cars) {}

    public function index(SearchCarsRequest $request): JsonResponse
    {
        return ApiResponse::paginated($this->cars->search($request->validated()), CarResource::class);
    }

    public function featured(SearchCarsRequest $request): JsonResponse
    {
        return ApiResponse::paginated($this->cars->search($request->validated(), featured: true), CarResource::class);
    }

    public function show(string $slug): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->findPublic($slug)));
    }
}
