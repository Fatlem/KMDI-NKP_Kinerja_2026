<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (! session()->has('kmdi_user')) {
            return response()->json(['success' => false, 'message' => 'Sesi berakhir. Silakan login kembali.'], 401);
        }

        return $next($request);
    }
}
