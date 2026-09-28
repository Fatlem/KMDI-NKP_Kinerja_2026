<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TemuanController;
use App\Http\Controllers\PicController;
use App\Http\Controllers\UserController;

// ── SPA Entry Point ──────────────────────────────────────────────
Route::get('/', fn() => view('app'));

// ── API Routes (web middleware agar session tersedia) ─────────────
Route::prefix('api')->group(function () {

    // Auth (public)
    Route::post('/auth/login',  [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Protected
    Route::middleware('auth.kmdi')->group(function () {
        Route::get('/users/list',       [UserController::class,  'listForLogin']);
        Route::get('/pic',              [PicController::class,   'index']);
        Route::get('/temuan',           [TemuanController::class,'index']);
        Route::get('/temuan/next-no',   [TemuanController::class,'nextNo']);
        Route::post('/temuan',          [TemuanController::class,'store']);
        Route::put('/temuan/{id}',      [TemuanController::class,'update']);
        Route::delete('/temuan/{id}',   [TemuanController::class,'destroy']);
    });
});
