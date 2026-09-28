<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KmdiUser extends Model
{
    protected $table = 'kmdi_users';

    protected $fillable = ['username', 'nama', 'password', 'role'];

    protected $hidden = ['password'];
}
