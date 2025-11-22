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
        Schema::table('invitation_groups', function (Blueprint $table) {
            $table->integer('charged')->after('failed')->default(0);
            $table->boolean('invite_all_group')->after('charged')->nullable();
            $table->boolean('customer_fetched')->after('invite_all_group')->nullable();
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->boolean('charged')->after('source')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_groups', function (Blueprint $table) {
            $table->dropColumn('charged');
            $table->dropColumn('invite_all_group');
            $table->dropColumn('customer_fetched');
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropColumn('charged');
        });
    }
};
