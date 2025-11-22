<?php

namespace App\Exports;

use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InvitationGroupExport implements FromCollection, WithHeadings, WithMapping
{
    protected $invitationGroup;
    protected $invitations;

    public function __construct($invitationGroup, $invitations) {
        $this->invitationGroup = $invitationGroup;
        $this->invitations = $invitations;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        return $this->invitations;
    }

    public function map($row): array
    {
        return [
            data_get($this->invitationGroup, 'name'),
            $row->customer_name,
            $row->email,
            $row->customer_state,
            $row->status,
            $row->updated_at ? Carbon::parse($row->updated_at)->toDateTimeString() : '',
        ];
    }

    public function headings(): array
    {
        return [
            'Invitation Group',
            'Customer Name',
            'Email',
            'Customer Status',
            'Invitation Status',
            'Processed At',
        ];
    }
}
