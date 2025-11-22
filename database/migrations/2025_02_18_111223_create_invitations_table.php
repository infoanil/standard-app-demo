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
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('invitation_group_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('email')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_state')->nullable();
            $table->string('status')->default('PENDING');
            $table->longText('error')->nullable();
            $table->string('source')->default('ADMIN');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
