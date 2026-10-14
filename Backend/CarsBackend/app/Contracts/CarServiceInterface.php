<?php

namespace App\Contracts;

use App\Models\Car;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CarServiceInterface
{
    public function search(array $filters, bool $admin = false, bool $featured = false): LengthAwarePaginator;

    public function findPublic(string $slug): Car;

    public function findAdmin(int $id): Car;

    public function create(array $data): Car;

    public function update(int $id, array $data): Car;

    public function archive(int $id): void;
}
