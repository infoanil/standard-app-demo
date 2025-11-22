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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('development_store')->after('theme_support_level')->default(0);
            $table->boolean('onboarding')->after('development_store')->default(0);
            $table->timestamp('last_charge_date')->after('onboarding')->nullable();
            $table->tinyInteger('plan_limit_status')->after('last_charge_date')->nullable();
            $table->date('trial_ends_at')->after('plan_limit_status')->nullable();
            $table->boolean('shopify_plus')->after('trial_ends_at')->default(0);
            $table->string('store_plan_name')->after('shopify_plus')->nullable();
            $table->integer('invite_limit')->after('store_plan_name')->default(5000);
            $table->string('timezone')->after('invite_limit')->nullable();
            $table->date('trial_modal_shown_at')->after('timezone')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('development_store');
            $table->dropColumn('onboarding');
            $table->dropColumn('last_charge_date');
            $table->dropColumn('plan_limit_status');
            $table->dropColumn('trial_ends_at');
            $table->dropColumn('shopify_plus');
            $table->dropColumn('invite_limit');
            $table->dropColumn('timezone');
            $table->dropColumn('trial_modal_shown_at');
        });
    }
};
