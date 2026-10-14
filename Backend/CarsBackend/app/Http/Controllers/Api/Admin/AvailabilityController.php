<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\AvailabilityServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\BlockCarPeriodRequest;
use App\Http\Resources\UnavailablePeriodResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class AvailabilityController extends Controller
{
    public function __construct(private AvailabilityServiceInterface $availability) {}

    public function store(BlockCarPeriodRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new UnavailablePeriodResource($this->availability->block($id, $request->validated())), 'Unavailable period created.', 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->availability->removeBlock($id);

        return ApiResponse::success(null, 'Unavailable period deleted.');
    }
}
