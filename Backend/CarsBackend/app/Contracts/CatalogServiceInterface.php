<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface CatalogServiceInterface
{
    public function list(string $catalog, bool $admin = false): Collection;

    public function create(string $catalog, array $data): Model;

    public function update(string $catalog, int $id, array $data): Model;

    public function delete(string $catalog, int $id): void;
}
