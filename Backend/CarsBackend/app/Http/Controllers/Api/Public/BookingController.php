<?php

namespace App\Http\Controllers\Api\Public;

use App\Contracts\BookingServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingReceiptResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    public function __construct(private BookingServiceInterface $bookings) {}

    public function store(StoreBookingRequest $request): JsonResponse
    {
        return ApiResponse::success(new BookingReceiptResource($this->bookings->create($request->validated())),
            'Booking request submitted. It is pending manual administrator confirmation.', 201);
    }
}
