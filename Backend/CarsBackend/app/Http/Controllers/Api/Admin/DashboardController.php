<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\DashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private DashboardServiceInterface $dashboard) {}

    public function __invoke(): JsonResponse
    {
        $statistics = $this->dashboard->statistics();
        $statistics['recentBookingRequests'] = BookingResource::collection($statistics['recentBookingRequests'])->resolve(request());

        return ApiResponse::success($statistics);
    }
}
