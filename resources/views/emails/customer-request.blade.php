<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Customer Data Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">

<h1>Hi {{ $firstName }}</h1>

<p style="text-align: left;">
    Thank you for generating a customer data request for your store.<br><br>
    Please find the requested information below. <br><br>
    Let us know if you have any further questions!<br><br>
    Have a nice day, and thank you for choosing <strong>Upsolite</strong>!<br><br>
</p>

@if(isset($customer) && $customer)
    <h2 style="margin-top: 30px;">Customer Information</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
        <tr>
            <th style="border: 1px solid #ddd; padding: 8px;">#</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Email</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Created At</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{{ $customer['first_name'] ?? 'N/A' }}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{{ $customer['email'] ?? 'N/A' }}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{{ $customer['created_at'] ?? 'N/A' }}</td>
        </tr>
        </tbody>
    </table>
@endif

<h2 style="margin-top: 30px; margin-bottom: 0;">Thanks again!</h2>

</body>
</html>
