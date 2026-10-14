<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\CarServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdminCarsRequest;
use App\Http\Requests\StoreCarRequest;
use App\Http\Requests\UpdateCarFeaturedRequest;
use App\Http\Requests\UpdateCarPublicationRequest;
use App\Http\Requests\UpdateCarRequest;
use App\Http\Requests\UpdateCarStatusRequest;
use App\Http\Resources\CarResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CarController extends Controller
{
    public function __construct(private CarServiceInterface $cars) {}

    public function index(AdminCarsRequest $request): JsonResponse
    {
        return ApiResponse::paginated($this->cars->search($request->validated(), admin: true), CarResource::class);
    }

    public function show(int $id): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->findAdmin($id)));
    }

    public function store(StoreCarRequest $request): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->create($request->validated())), 'Car created successfully.', 201);
    }

    public function update(UpdateCarRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->update($id, $request->validated())), 'Car updated successfully.');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->cars->archive($id);

        return ApiResponse::success(null, 'Car archived successfully.');
    }

    public function status(UpdateCarStatusRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->update($id, $request->validated())), 'Operational status updated.');
    }

    public function featured(UpdateCarFeaturedRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->update($id, $request->validated())), 'Featured status updated.');
    }

    public function publication(UpdateCarPublicationRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new CarResource($this->cars->update($id, $request->validated())), 'Publication status updated.');
    }
}
