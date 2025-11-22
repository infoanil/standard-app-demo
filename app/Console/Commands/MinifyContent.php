<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Tholu\Packer\Packer;


class MinifyContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:minify-content';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Minify content for security reasons';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sourcePath = base_path('resources/js/smart-login-invite.js');
        $targetPath = base_path('extensions/smart-login-invite/assets/index.js');

        if (!file_exists($sourcePath)) {
            $this->error("Source file not found: $sourcePath");
            return;
        }

        $packer = new Packer(File::get($sourcePath), 'Normal', true, false, true);
        File::put($targetPath, $packer->pack());
        $this->info("Minify content generated at: $targetPath");
    }
}
