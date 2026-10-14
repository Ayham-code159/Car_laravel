<?php

namespace App\Contracts;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BookingServiceInterface
{
    public function create(array $data, bool $manual = false): Booking;

    public function search(array $filters): LengthAwarePaginator;

    public function find(int $id): Booking;

    public function transition(int $id, BookingStatus $status): Booking;
}
