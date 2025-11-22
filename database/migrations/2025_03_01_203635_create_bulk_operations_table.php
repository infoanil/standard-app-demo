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
        Schema::create('bulk_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('graphql_id');
            $table->string('type');
            $table->string('status')->default('CREATED');
            $table->string('sync_status')->nullable();
            $table->longText('url')->nullable();
            $table->unsignedInteger('object_count')->default(0);
            $table->unsignedInteger('root_object_count')->default(0);
            $table->string('error_code')->nullable();
            $table->longText('error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bulk_operations');
    }
};
