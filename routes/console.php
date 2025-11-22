<?php

use Illuminate\Support\Facades\Schedule;


Schedule::command('shop:attempt-usage-charge')->daily();
Schedule::command('app:poll-bulk-operation')->everyTenMinutes();
Schedule::command('app:database-cleanup')->daily();
