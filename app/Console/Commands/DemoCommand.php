<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DemoCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:demo-command';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'For Testing Purpose';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
