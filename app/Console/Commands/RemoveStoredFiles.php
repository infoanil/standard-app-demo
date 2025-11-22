<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class RemoveStoredFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:remove-stored-files';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $invitationGroups = Storage::disk('public')->allDirectories("exports/invitation_groups");

        $date = Carbon::now();

        foreach ($invitationGroups as $directory) {
            $directoryDate = basename($directory);
            $directoryDate = Carbon::createFromTimestamp($directoryDate);

            if ($directoryDate->lt($date)) {
                Storage::disk('public')->deleteDirectory($directory);
            }
        }
    }
}
