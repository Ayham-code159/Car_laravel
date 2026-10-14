<?php

namespace App\Http\Responses;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

final class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Request successful.', int $statusCode = 200): JsonResponse
    {
        if ($data instanceof JsonResource) {
            $data = $data->resolve(request());
        }

        return response()->json(['success' => true, 'message' => $message, 'errors' => [], 'data' => $data], $statusCode);
    }

    /** @param list<string> $errors */
    public static function error(string $message, array $errors = [], int $statusCode = 400): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message, 'errors' => array_values($errors), 'data' => null], $statusCode);
    }

    /** @param class-string<JsonResource> $resource */
    public static function paginated(LengthAwarePaginator $paginator, string $resource): JsonResponse
    {
        return self::success([
            'items' => $resource::collection($paginator->getCollection())->resolve(request()),
            'pagination' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'lastPage' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }
}
