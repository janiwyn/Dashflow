<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $query = Category::where('business_id', $this->businessId($request))->orderBy('name');

        if ($request->boolean('full')) {
            return response()->json($query->get(['id', 'name']));
        }

        return response()->json($query->pluck('name'));
    }
}
