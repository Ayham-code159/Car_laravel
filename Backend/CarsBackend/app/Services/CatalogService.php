<?php

namespace App\Services;

use App\Contracts\CatalogServiceInterface;
use App\Exceptions\BookingConflictException;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CatalogService implements CatalogServiceInterface
{
    /** @return class-string<Model> */
    private function model(string $catalog): string
    {
        return match ($catalog) {
            'brands' => Brand::class, 'categories' => Category::class, 'locations' => Location::class,
            default => throw new InvalidArgumentException('Unknown catalog.'),
        };
    }

    public function list(string $catalog, bool $admin = false): Collection
    {
        $query = $this->model($catalog)::query();
        if ($catalog === 'locations' && ! $admin) {
            $query->where('is_active', true);
        }

        return $query->orderBy('name')->get();
    }

    public function create(string $catalog, array $data): Model
    {
        return $this->model($catalog)::create($data);
    }

    public function update(string $catalog, int $id, array $data): Model
    {
        return DB::transaction(function () use ($catalog, $id, $data): Model {
            $model = $this->model($catalog)::lockForUpdate()->findOrFail($id);
            $model->update($data);

            return $model;
        });
    }

    public function delete(string $catalog, int $id): void
    {
        DB::transaction(function () use ($catalog, $id): void {
            $model = $this->model($catalog)::lockForUpdate()->findOrFail($id);
            if ($model->cars()->withTrashed()->exists() || ($model instanceof Location && $model->bookings()->exists())) {
                throw new BookingConflictException('This catalog entry is used by cars or booking history and cannot be deleted.');
            }
            $model->delete();
        });
    }
}
