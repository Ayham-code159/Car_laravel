<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\BookingServiceInterface;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateManualBookingRequest;
use App\Http\Requests\SearchBookingsRequest;
use App\Http\Requests\UpdateBookingStatusRequest;
use App\Http\Resources\BookingResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    public function __construct(private BookingServiceInterface $bookings) {}

    public function index(SearchBookingsRequest $request): JsonResponse
    {
        return ApiResponse::paginated($this->bookings->search($request->validated()), BookingResource::class);
    }

    public function show(int $id): JsonResponse
    {
        return ApiResponse::success(new BookingResource($this->bookings->find($id)));
    }

    public function store(CreateManualBookingRequest $request): JsonResponse
    {
        return ApiResponse::success(new BookingResource($this->bookings->create($request->validated(), manual: true)), 'Manual booking created.', 201);
    }

    public function status(UpdateBookingStatusRequest $request, int $id): JsonResponse
    {
        return ApiResponse::success(new BookingResource($this->bookings->transition($id, BookingStatus::from($request->validated('status')))), 'Booking status updated.');
    }
}
