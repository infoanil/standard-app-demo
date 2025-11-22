<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invitation_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('segment_id')->nullable();
            $table->string('segment_name')->nullable();
            $table->string('status')->default('ready_to_invite');
            $table->integer('total')->default(0);
            $table->integer('pending')->default(0);
            $table->integer('successful')->default(0);
            $table->integer('failed')->default(0);
            $table->integer('skipped')->default(0);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitation_groups');
    }
};
