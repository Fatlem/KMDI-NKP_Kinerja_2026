<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Temuan extends Model
{
    protected $table = 'temuan';

    protected $fillable = [
        'no', 'temuan', 'sub_temuan', 'kriteria', 'sebab',
        'rekomendasi', 'pic', 'rencana_aksi', 'jadwal_pelaksanaan',
        'output', 'parent_id', 'sort_order',
    ];

    public function parent()
    {
        return $this->belongsTo(Temuan::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Temuan::class, 'parent_id')->orderBy('sort_order');
    }
}
