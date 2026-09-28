<?php

namespace App\Http\Controllers;

use App\Models\Pic;

class PicController extends Controller
{
    public function index()
    {
        $list = Pic::orderBy('id')->get()->map(fn($p) => [
            'username' => $p->nama,   // konsisten dengan format GAS: username = nama
            'nama'     => $p->nama,
        ]);

        return response()->json($list);
    }
}
