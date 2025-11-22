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
        Schema::create('usage_charge_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('invitation_group_id')->nullable()->constrained('invitation_groups')->nullOnDelete();
            $table->unsignedBigInteger('charge_id')->nullable();
            $table->unsignedInteger('successful_invites')->default(0);
            $table->float('amount_charged');
            $table->longText('notes')->nullable();
            $table->timestamp('charged_at')->nullable();
            $table->longText('error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usage_charge_logs');
    }
};
